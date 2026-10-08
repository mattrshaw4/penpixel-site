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
 *   - HUBSPOT_ACCESS_TOKEN   (optional)   HubSpot Private App token, scoped to
*                                          crm.objects.contacts.write. Without it,
*                                          the tool still works, leads are simply
*                                          not pushed to HubSpot.
 *
 * SSRF posture: on Cloudflare's edge a Pages Function fetch() egresses as public
 * Internet traffic and cannot reach private IP space or cloud metadata. The URL
 * validator is defense in depth on top of that, and we only ever fetch two fixed
 * benign paths on the validated origin, never a user-controlled full URL.
 */

import { analyzeCrawlAccess } from '../../lib/crawl-access-check.js';
import { analyzeEdgeProtection, extractTitle } from '../../lib/edge-protection-check.js';
import { analyzePageSpeed } from '../../lib/pagespeed-check.js';
import { analyzeStructuredData } from '../../lib/structured-data-check.js';
import { applyGate, isValidEmail } from '../../lib/email-gate.js';
import { pushLead } from '../../lib/hubspot-lead.js';
import { validateAndNormalizeUrl } from '../../lib/url-validate.js';

const FETCH_TIMEOUT_MS = 8000;
const PSI_TIMEOUT_MS = 55000; // PageSpeed runs a live Lighthouse pass; 15-40s is normal
const MAX_BODY_BYTES = 512 * 1024; // robots.txt/llms.txt cap; real ones are tiny
const PSI_MAX_BODY_BYTES = 8 * 1024 * 1024; // PSI responses embed full Lighthouse detail, often 0.5-2 MB
const PAGE_MAX_BODY_BYTES = 3 * 1024 * 1024; // full page HTML; generous for JSON-LD anywhere in the document
const CRAWLER_UA =
  'Mozilla/5.0 (compatible; PenpixelReadinessCheck/1.0; +https://penpixelcreative.com/aeo-readiness-check)';

// Simulated AI-crawler user agents for the edge-protection probe. Each keeps the
// real crawler's token (rules match on it) and says plainly that it is us
// simulating it, so a site owner reading their logs is not misled.
const SIM_SUFFIX = ' PenpixelReadinessCheck/1.0 (simulated crawler user agent; +https://penpixelcreative.com/aeo-readiness-check)';
const AI_PROBES = [
  { id: 'OAI-SearchBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot' + SIM_SUFFIX },
  { id: 'PerplexityBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' + SIM_SUFFIX },
  { id: 'ClaudeBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' + SIM_SUFFIX },
];
const PROBE_MAX_BODY_BYTES = 64 * 1024; // only the status, one header and the <title> are read

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
async function safeFetch(url, timeoutMs = FETCH_TIMEOUT_MS, maxBytes = MAX_BODY_BYTES, ua = CRAWLER_UA) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': ua, Accept: 'text/plain, */*' },
      redirect: 'follow', // edge model prevents private-range targets regardless
      signal: controller.signal,
    });

    // Stream the body and stop at the cap. If there's no readable stream (some
    // runtimes), fall back to text() which is still bounded by the timeout.
    const cfMitigated = res.headers.get('cf-mitigated');
    if (!res.body || typeof res.body.getReader !== 'function') {
      const text = (await res.text()).slice(0, maxBytes);
      return { status: res.status, body: text, cfMitigated };
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
    return { status: res.status, body: text.slice(0, maxBytes), cfMitigated };
  } catch {
    return { status: 0, body: '', cfMitigated: null }; // timeout / network error -> inconclusive
  } finally {
    clearTimeout(timer);
  }
}

// Kill switch. While false, the endpoint does no work at all: no Turnstile call,
// no outbound fetches, no PageSpeed quota. Flip to true to bring the tool back.
const SCAN_ENABLED = false;

export async function onRequestPost(context) {
  if (!SCAN_ENABLED) {
    return json({ error: 'The AEO Readiness Check is offline for maintenance. Please check back soon.' }, 503);
  }
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

  const [robots, llms, psiRaw, page, ...aiProbeResults] = await Promise.all([
    safeFetch(`${v.origin}/robots.txt`),
    safeFetch(`${v.origin}/llms.txt`),
    safeFetch(psiUrl, PSI_TIMEOUT_MS, PSI_MAX_BODY_BYTES),
    safeFetch(`${v.origin}/`, FETCH_TIMEOUT_MS, PAGE_MAX_BODY_BYTES),
    // Edge-protection probes: the same homepage, requested as simulated AI crawlers.
    ...AI_PROBES.map((p) => safeFetch(`${v.origin}/`, FETCH_TIMEOUT_MS, PROBE_MAX_BODY_BYTES, p.ua)),
  ]);

  const edge = analyzeEdgeProtection([
    { id: 'baseline', status: page.status, cfMitigated: page.cfMitigated, title: extractTitle(page.body) },
    ...AI_PROBES.map((p, i) => ({
      id: p.id,
      status: aiProbeResults[i].status,
      cfMitigated: aiProbeResults[i].cfMitigated,
      title: extractTitle(aiProbeResults[i].body),
    })),
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
    edge,
  });

  const speed = analyzePageSpeed(psiJson);
  // A bot-challenge page is not the site's content, so structured data from it
  // (or the absence of any) says nothing about the site. Report it as unread.
  const pageIsChallenge = edge.probes.find((x) => x.id === 'baseline')?.blocked === true;
  const structuredData = analyzeStructuredData({
    pageStatus: pageIsChallenge ? (page.status >= 400 ? page.status : 403) : page.status,
    pageHtml: pageIsChallenge ? '' : page.body,
  });

  const dimensions = [crawl, speed, structuredData];

  // Overall score: weighted, not a flat mean, and hard-capped on a global
  // crawl block. A flat mean lets good speed/schema partially "rescue" a
  // score even when the site is completely unreachable, which misrepresents
  // reality: a blocked crawler never gets far enough to benefit from either.
  // Weights favor crawl access (most foundational: nothing else matters if
  // the page can't be fetched at all), then structured data, then speed.
  // Inconclusive dimensions (score:null) are excluded and the remaining
  // weights renormalize, so a missing measurement never counts against the
  // site. Crawl access always produces a score, so this never divides by zero.
  const DIMENSION_WEIGHTS = { 'Crawl Access': 0.45, 'Delivery Speed': 0.25, 'Structured Data': 0.30 };
  let overallScore;
  if (crawl.globalBlocked) {
    overallScore = crawl.score;
  } else {
    const scored = dimensions.filter((d) => typeof d.score === 'number');
    const totalWeight = scored.reduce((sum, d) => sum + (DIMENSION_WEIGHTS[d.dimension] || 0), 0);
    overallScore = totalWeight > 0
      ? Math.round(scored.reduce((sum, d) => sum + d.score * (DIMENSION_WEIGHTS[d.dimension] || 0), 0) / totalWeight)
      : Math.round(scored.reduce((sum, d) => sum + d.score, 0) / scored.length);
  }

  // Gate decision: a valid email unlocks full findings; an absent or
  // malformed one gets score-only, per-dimension. Deliberately server-side
  // (see file header) rather than a client-side reveal of data already sent.
  const gate = applyGate(dimensions, email);

  const result = {
    scannedUrl: v.origin,
    overallScore,
    overallGrade: grade(overallScore),
    gated: gate.gated,
    dimensions: gate.dimensions,
  };

  // Lead push: best-effort, fire-and-forget. A slow or failing HubSpot call
  // must never delay or block the visitor's result, they already earned it
  // by providing a valid email; whether HubSpot's API is happy right now is
  // Penpixel Creative's problem, not theirs. Only fires when the email
  // actually passed validation (gate.validEmail), never on a malformed one.
  if (gate.validEmail && env.HUBSPOT_ACCESS_TOKEN) {
    context.waitUntil(
      pushLead(
        gate.validEmail,
        { scannedUrl: v.origin, overallScore, overallGrade: result.overallGrade },
        env.HUBSPOT_ACCESS_TOKEN
      ).catch(() => {}) // pushLead already never throws; belt and suspenders
    );
  }

  return json(result);
}

// POST is handled by onRequestPost above; Pages routes every other method here.
export async function onRequest() {
  return json({ error: 'Method not allowed.' }, 405);
}
