/**
 * Penpixel Creative - Email gate logic (v1 hybrid model)
 * ----------------------------------------------------------------------------
 * Pure functions: no network, no side effects. Decides whether a submitted
 * email is well-formed enough to accept, and strips a full dimension result
 * down to its ungated shape (score only, no findings) when no valid email
 * was provided.
 *
 * WHY server-side, not a client-side reveal: the whole result was already
 * computed either way (the scan has to run to produce a score at all), so
 * gating has to mean withholding data from the HTTP response itself. A
 * client-side-only gate (send everything, hide it with CSS/JS) is trivially
 * bypassed by anyone who opens dev tools and reads the network response,
 * exactly the kind of thing a technical B2B SaaS visitor might actually try.
 *
 * WHY score-but-not-findings stays ungated: matches the explicit design
 * Deven described, an instant score with no details, email to see the rest.
 * Per-dimension scores (not the findings/bots/etc under them) are kept
 * visible too: enough to create curiosity ("why did I score low on
 * structured data?") without giving away the substance that's the actual
 * reason to hand over an email.
 */

// Deliberately lightweight: a sanity check against obvious garbage, not full
// RFC 5322 validation. The real validation that matters is whether HubSpot
// accepts it; this just stops empty/malformed strings from reaching that far.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && email.length > 0 && email.length <= 254 && EMAIL_RE.test(email.trim());
}

/**
 * @param {Object} dimension  a full scored dimension object (score, findings, etc.)
 * @returns {Object} the same dimension with only {dimension, score} kept
 */
function ungatedDimension(dimension) {
  return { dimension: dimension.dimension, score: dimension.score };
}

/**
 * @param {Array<Object>} dimensions  full scored dimensions
 * @param {string} email  raw submitted value, may be empty/invalid
 * @returns {{ gated: boolean, dimensions: Array<Object>, validEmail: string|null }}
 */
function applyGate(dimensions, email) {
  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (isValidEmail(trimmed)) {
    return { gated: false, dimensions, validEmail: trimmed };
  }
  return { gated: true, dimensions: dimensions.map(ungatedDimension), validEmail: null };
}

export { isValidEmail, ungatedDimension, applyGate };
