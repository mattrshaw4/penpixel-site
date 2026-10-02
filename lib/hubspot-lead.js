/**
 * Penpixel Creative - HubSpot lead push (email gate)
 * ----------------------------------------------------------------------------
 * Uses the CRM API directly (POST /crm/v3/objects/contacts with a Private App
 * bearer token), not the legacy Forms Submission API. HubSpot's own 2026
 * guidance favors this path; the Forms API has a confusing deprecation
 * history (v1/v2/v3 splits, the old Contact-Form-Submissions object being
 * retired) that the CRM API sidesteps entirely.
 *
 * Split into pure functions (buildContactPayload, interpretHubSpotResponse)
 * plus a thin network wrapper (pushLead), same pattern as the rest of this
 * build: the logic is unit-testable without a real HubSpot account, only the
 * actual fetch call needs one.
 *
 * Deliberately sends ONLY standard properties that exist by default on every
 * HubSpot portal (email, website, lifecyclestage). Custom properties (e.g. a
 * "readiness_check_score" field) require creating that property in HubSpot's
 * Settings > Properties first, or the API call fails for that field. Adding
 * custom properties later is a one-line change once they exist; shipping
 * against properties that may not exist yet risks breaking the very first
 * real lead capture, which is the one thing this cannot afford to break.
 */

/** @returns {{properties: Object}} the exact JSON body to POST */
function buildContactPayload(email, context) {
  const properties = {
    email: email,
    lifecyclestage: 'lead',
  };
  if (context && context.scannedUrl) {
    // 'website' is a standard default HubSpot contact property.
    try {
      properties.website = new URL(context.scannedUrl).hostname;
    } catch {
      // scannedUrl should always be a valid origin by the time this runs
      // (it passed SSRF validation earlier), but never let a formatting
      // problem here block the lead capture itself.
    }
  }
  return { properties };
}

/**
 * Maps a HubSpot API response to an outcome. A 409 (contact with this email
 * already exists) is treated as success, not an error: the lead is already
 * captured, which is the actual goal, we are not trying to force an update
 * on every repeat visit.
 * @returns {{ok: boolean, reason: string}}
 */
function interpretHubSpotResponse(status, bodyText) {
  if (status >= 200 && status < 300) return { ok: true, reason: 'created' };
  if (status === 409) return { ok: true, reason: 'already_exists' };
  if (status === 401 || status === 403) {
    return { ok: false, reason: 'auth_failed: check HUBSPOT_ACCESS_TOKEN and its scopes' };
  }
  if (status === 429) return { ok: false, reason: 'rate_limited' };
  return { ok: false, reason: `unexpected_status_${status}: ${String(bodyText).slice(0, 200)}` };
}

/**
 * Fire-and-forget-safe: never throws. Caller decides whether to await it or
 * hand it to waitUntil(); this function itself always resolves.
 * @returns {Promise<{ok: boolean, reason: string}>}
 */
async function pushLead(email, context, accessToken) {
  if (!accessToken) return { ok: false, reason: 'no_access_token_configured' };
  const payload = buildContactPayload(email, context);
  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');
    return interpretHubSpotResponse(res.status, text);
  } catch (err) {
    return { ok: false, reason: `network_error: ${err && err.message ? err.message : 'unknown'}` };
  }
}

module.exports = { buildContactPayload, interpretHubSpotResponse, pushLead };
