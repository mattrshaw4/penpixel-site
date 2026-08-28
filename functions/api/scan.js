/**
 * Penpixel Creative - AEO Readiness Check API (Phase 1: Crawl Access)
 * ----------------------------------------------------------------------------
 * Cloudflare Pages Function. Route: POST /api/scan
 *
 * Flow:
 *   1. Guard method + content type
 *   2. Verify Cloudflare Turnstile token server-side (bot/abuse control)
 *   3. Validate + normalize the submitted URL to a safe origin (SSRF control)
 *   4. Fetch /robots.txt and /llms.txt on that origin (timeout, parallel)
 *   5. Score with analyzeCrawlAccess()
 *   6. Return JSON. Optionally forward a lead to n8n (fire-and-forget).
 *
 * Secrets come from the Pages project environment (context.env), never code:
 *   - TURNSTILE_SECRET_KEY   (required)   same secret the contact form uses
 *   - LEAD_WEBHOOK_URL       (optional)   n8n webhook that routes leads to HubSpot
 *
 * SSRF posture: on Cloudflare's edge a Pages Function fetch() egresses as public
 * Internet traffic and cannot reach private IP space or cloud metadata. The URL
 * validator is defense in depth on top of that, and we only ever fetch two fixed
 * benign paths on the validated origin, never a user-controlled full URL.
 */

import { analyzeCrawlAccess } from '../../lib/crawl-access-check.js';
import { analyzePageSpeed } from '../../lib/pagespeed-check.js';
import { analyzeStructuredData } from '../../lib/structured-data-check.js';
import { validateAndNormalizeUrl } from '../../lib/url-validate.js';

const FETCH_TIMEOUT_MS = 8000;
const PSI_TIMEOUT_MS = 55000; // PageSpeed runs a live Lighthouse pass; 15-40s is normal
const MAX_BODY_BYTES = 512 * 1024; // robots.txt/llms.txt cap; real ones are tiny
const PSI_MAX_BODY_BYTES = 8 * 1024 * 1024; // PSI responses embed full Lighthouse detail, often 0.5-2 MB
const PAGE_MAX_BODY_BYTES = 3 * 1024 * 1024; // full page HTML; generous for JSON-LD anywhere in the document
const CRAWLER_UA =
  'Mozilla/5.0 (compatible; PenpixelReadinessCheck/1.0; +https://penpixelcreative.com/readiness-check)';

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
};

/** Small helper: JSON response with our standard headers. */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: SECURITY_HEADERS });
}

/** Map a 0-100 score to a letter grade for the headline result. */
function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/** Verify a Turnstile token with Cloudflare's siteverify endpoint. */
async function verifyTurnstile(token, secret, remoteip) {
  if (!token || !secret) return false;
  const form = new URLSearchParams();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteip) form.append('remoteip', remoteip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false; // fail closed
  }
}

/** Fetch one URL with a hard timeout and a real (streamed) body-size cap.
 *  Never throws; returns {status, body}. We stop reading once MAX_BODY_BYTES is
 *  reached and abort the rest, so a huge or slow-drip response can neither fill
 *  memory nor run out the clock. The 8s timeout bounds total time regardless. */
async function safeFetch(url, timeoutMs = FETCH_TIMEOUT_MS, maxBytes = MAX_BODY_BYTES) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': CRAWLER_UA, Accept: 'text/plain, */*' },
      redirect: 'follow', // edge model prevents private-range targets regardless
      signal: controller.signal,
    });

    // Stream the body and stop at the cap. If there's no readable stream (some
    // runtimes), fall back to text() which is still bounded by the timeout.
    if (!res.body || typeof res.body.getReader !== 'function') {
      const text = (await res.text()).slice(0, maxBytes);
      return { status: res.status, body: text };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let received = 0;
    let text = '';
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
    // Stop reading the rest and free the connection past the cap.
    try { await reader.cancel(); } catch { /* already closed */ }
    return { status: res.status, body: text.slice(0, maxBytes) };
  } catch {
    return { status: 0, body: '' }; // timeout / network error -> inconclusive
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Content-type guard (we only accept JSON).
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return json({ error: 'Send a JSON body.' }, 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const submittedUrl = payload && typeof payload.url === 'string' ? payload.url : '';
  const turnstileToken =
    payload && typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
  const email = payload && typeof payload.email === 'string' ? payload.email.trim() : '';

  // 2. Turnstile verification (primary bot/abuse control on a public endpoint).
  const remoteip = request.headers.get('CF-Connecting-IP') || '';
  const human = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, remoteip);
  if (!human) {
    return json({ error: 'Verification failed. Please reload and try again.' }, 403);
  }

  // 3. SSRF-safe URL validation. On failure, return the plain-English reason.
  const v = validateAndNormalizeUrl(submittedUrl);
  if (!v.ok) {
    return json({ error: v.reason }, 400);
  }

  // 4. Fetch the two fixed paths on the validated origin, in parallel.
  // PageSpeed Insights: key comes from env when configured (dedicated quota);
  // without one the shared keyless pool is tried, which often 429s. Either
  // failure mode lands as an honest "not scored this run", never a bad grade.
  const psiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    + `?url=${encodeURIComponent(v.origin)}`
    + '&strategy=mobile&category=PERFORMANCE'
    + (env.PAGESPEED_API_KEY ? `&key=${env.PAGESPEED_API_KEY}` : '');

  const [robots, llms, psiRaw, page] = await Promise.all([
    safeFetch(`${v.origin}/robots.txt`),
    safeFetch(`${v.origin}/llms.txt`),
    safeFetch(psiUrl, PSI_TIMEOUT_MS, PSI_MAX_BODY_BYTES),
    safeFetch(`${v.origin}/`, FETCH_TIMEOUT_MS, PAGE_MAX_BODY_BYTES),
  ]);

  let psiJson = null;
  if (psiRaw.status !== 0 && psiRaw.body) {
    try { psiJson = JSON.parse(psiRaw.body); } catch { psiJson = null; }
  }

  // 5. Score.
  const crawl = analyzeCrawlAccess({
    robotsStatus: robots.status,
    robotsBody: robots.body,
    llmsStatus: llms.status,
  });

  const speed = analyzePageSpeed(psiJson);
  const structuredData = analyzeStructuredData({ pageStatus: page.status, pageHtml: page.body });

  // Overall = mean of the dimensions that actually produced a score. An
  // inconclusive measurement (score:null) is excluded, never counted against
  // the site. Crawl access always scores, so the list is never empty.
  const dimensions = [crawl, speed, structuredData];
  const scored = dimensions.filter((d) => typeof d.score === 'number');
  const overallScore = Math.round(
    scored.reduce((sum, d) => sum + d.score, 0) / scored.length
  );

  const result = {
    scannedUrl: v.origin,
    overallScore,
    overallGrade: grade(overallScore),
    dimensions,
    // GATE HOOK: once Deven finalizes the hybrid gate, return `dimensions`
    // (findings/bots) only when `email` is a valid captured lead, and always
    // return overallScore/overallGrade. That makes the gate server-side and
    // not bypassable by calling the API directly. Left open until decided.
  };

  // 6. Optional, best-effort lead forward to n8n -> HubSpot. Fire-and-forget so
  // a slow/absent lead pipeline never delays the visitor's result. Skipped
  // entirely until LEAD_WEBHOOK_URL is configured (n8n lead flow not built yet).
  if (email && env.LEAD_WEBHOOK_URL) {
    context.waitUntil(
      fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          scannedUrl: v.origin,
          overallScore,
          overallGrade: result.overallGrade,
          source: 'aeo-readiness-check',
        }),
      }).catch(() => {}) // never surface lead-pipeline errors to the visitor
    );
  }

  return json(result);
}

// POST is handled by onRequestPost above; Pages routes every other method here.
export async function onRequest() {
  return json({ error: 'Method not allowed.' }, 405);
}
