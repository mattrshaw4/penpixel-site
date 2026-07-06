/**
 * POST /api/contact — Cloudflare Pages Function
 *
 * Security posture (OWASP Top 10 2021):
 * - A03 Injection: all input is length-capped, type-checked, and the notification
 *   email is sent as PLAIN TEXT (no HTML), so user content is never interpreted.
 * - A04 Insecure Design: Turnstile token is verified server-side via Siteverify.
 *   Client-side checks are UX only; the server is the gate.
 * - A05 Misconfiguration: secrets live in Cloudflare env vars, never in the repo.
 * - A09 Logging: no PII is logged. Only coarse outcomes.
 *
 * Required environment variables (set in the Pages project dashboard):
 *   TURNSTILE_SECRET_KEY  — from the Turnstile widget (dashboard > Turnstile)
 *   RESEND_API_KEY        — from resend.com (free tier: 3,000 emails/month)
 *   CONTACT_TO_EMAIL      — where inquiries land (deven@penpixelcreative.com)
 *   CONTACT_FROM_EMAIL    — verified sender (e.g. diagnosis@penpixelcreative.com)
 */

// Input limits: generous for humans, hostile to abuse.
const LIMITS = { name: 100, email: 254, company: 150, website: 200, message: 5000 };

/** Basic shape check only — real validation is "did a human pass Turnstile". */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // --- Parse ---------------------------------------------------------------
  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'Invalid form submission.' });
  }

  // Honeypot: real users never see this field; bots autofill it. Silently accept
  // (200) so the bot learns nothing, but do not process.
  if ((form.get('company_website_hp') || '').toString().trim() !== '') {
    return json(200, { ok: true });
  }

  const field = (k) => (form.get(k) || '').toString().trim();
  const name = field('name');
  const email = field('email');
  const company = field('company');
  const website = field('website');
  const message = field('message');
  const token = field('cf-turnstile-response');

  // --- Validate (server-side; the browser is not trusted) -------------------
  const errors = [];
  if (!name || name.length > LIMITS.name) errors.push('name');
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.push('email');
  if (company.length > LIMITS.company) errors.push('company');
  if (website.length > LIMITS.website) errors.push('website');
  if (!message || message.length > LIMITS.message) errors.push('message');
  if (!token) errors.push('verification');
  if (errors.length) {
    return json(400, { ok: false, error: `Please check: ${errors.join(', ')}.` });
  }

  // --- Verify Turnstile (the actual gate) -----------------------------------
  // Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const verify = await verifyRes.json();
  if (!verify.success) {
    return json(403, { ok: false, error: 'Verification failed. Please try again.' });
  }

  // --- Deliver (plain text — user content is data, never markup) ------------
  const text = [
    'New diagnosis request via penpixelcreative.com',
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Company: ${company || '-'}`,
    `Website: ${website || '-'}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Penpixel Diagnosis <${env.CONTACT_FROM_EMAIL}>`,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email, // one-click reply to the prospect
      subject: `Diagnosis request: ${name}${company ? ' — ' + company : ''}`,
      text,
    }),
  });

  if (!sendRes.ok) {
    // Do not leak provider details to the client; log coarse status only.
    console.error('mail_send_failed', sendRes.status);
    return json(502, { ok: false, error: 'Could not send right now. Email us directly instead.' });
  }

  return json(200, { ok: true });
}

/** Anything but POST gets a 405 — this endpoint has exactly one job. */
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
