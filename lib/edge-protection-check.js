/**
 * Penpixel Creative - Edge Protection Check
 * ----------------------------------------------------------------------------
 * Pure function. Takes already-fetched homepage probe results in, returns a
 * verdict out. Same portability contract as the other lib files: no network,
 * no DOM.
 *
 * WHY THIS EXISTS: robots.txt is only the first gate. A site can allow every
 * AI crawler in robots.txt and still serve them a bot-challenge page ("Just a
 * moment...") because of a WAF rule, a bot-fight setting, or an AI-bot-blocking
 * toggle at the CDN. Every other check here would then score a page the
 * crawler never actually sees. This check looks at what the server returns to
 * automated requests, not what robots.txt says it will allow.
 *
 * HONESTY LIMITS (these shape the wording of every finding):
 *   - We cannot reproduce a vendor's real crawler IP addresses. Bot protection
 *     that verifies crawler IPs may let the real GPTBot through while
 *     challenging everything else. So "everything automated is challenged" is
 *     reported as a real risk to verify, never as proof that a named vendor is
 *     blocked.
 *   - A simulated crawler user agent that is treated differently from a plain
 *     request is reported as info, not scored: IP-verifying protection can
 *     reject a spoofed user agent that the genuine crawler would pass.
 *
 * Probe shape: { id, status, cfMitigated, title }
 *   id           'baseline' (our own scanner) or a simulated crawler name
 *   status       HTTP status, 0 if the request failed
 *   cfMitigated  value of the cf-mitigated response header, or null
 *   title        text of the page <title>, or ''
 */

const BLOCK_STATUSES = new Set([401, 403, 429, 503]);
const CHALLENGE_TITLE_RE =
  /just a moment|attention required|access denied|verify you are human|security check|checking your browser|are you a robot/i;

// Penalty applied to Crawl Access when every automated request is challenged.
// Deliberately not a hard cap: verified crawlers may still be allowed through.
const FULL_CHALLENGE_PENALTY = 35;

function isBlocked(probe) {
  if (!probe || probe.status === 0) return false; // network failure is unknown, not blocked
  if (probe.cfMitigated === 'challenge') return true;
  if (BLOCK_STATUSES.has(probe.status)) return true;
  return CHALLENGE_TITLE_RE.test(probe.title || '');
}

function describe(probe) {
  const bits = [`HTTP ${probe.status}`];
  if (probe.cfMitigated) bits.push(`cf-mitigated: ${probe.cfMitigated}`);
  return bits.join(', ');
}

/** Pull the <title> text out of the first chunk of an HTML body. */
function extractTitle(html) {
  if (typeof html !== 'string') return '';
  const m = html.slice(0, 65536).match(/<title[^>]*>([\s\S]{0,300}?)<\/title\s*>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

/**
 * @param {Array<Object>} probes
 * @returns {{level:'unknown'|'none'|'ai-ua'|'full', penalty:number, findings:Array, probes:Array}}
 */
function analyzeEdgeProtection(probes) {
  const list = Array.isArray(probes) ? probes : [];
  const reachable = list.filter((p) => p && p.status !== 0);
  const summary = list.map((p) => ({ id: p.id, status: p.status, blocked: isBlocked(p) }));

  if (reachable.length === 0) {
    return { level: 'unknown', penalty: 0, findings: [], probes: summary };
  }

  const baseline = reachable.find((p) => p.id === 'baseline');
  const crawlerProbes = reachable.filter((p) => p.id !== 'baseline');
  const blockedCrawlers = crawlerProbes.filter(isBlocked);
  const baselineBlocked = baseline ? isBlocked(baseline) : false;

  // Everything automated we sent was challenged or blocked.
  if (baseline && baselineBlocked && blockedCrawlers.length === crawlerProbes.length) {
    return {
      level: 'full',
      penalty: FULL_CHALLENGE_PENALTY,
      probes: summary,
      findings: [{
        severity: 'critical',
        text: `Your site challenges or blocks automated visitors (${describe(baseline)}). Every automated request we sent got a bot-challenge or error page instead of your content. robots.txt does not control this: it is a firewall or bot-protection rule. Crawlers on your platform's verified allowlist may still get through, but any AI crawler or agent that is not, including tools fetching a page on a user's behalf, stops at that page. Check your WAF, bot-fight, and AI-bot-blocking settings and confirm the AI crawlers you want are allowed.`,
      }],
    };
  }

  // Plain request fine, simulated AI crawler user agents treated differently.
  if (!baselineBlocked && blockedCrawlers.length > 0) {
    const names = blockedCrawlers.map((p) => `${p.id} (${p.status})`).join(', ');
    return {
      level: 'ai-ua',
      penalty: 0,
      probes: summary,
      findings: [{
        severity: 'info',
        text: `The server answers a standard request but turns away requests using these AI crawler user agents: ${names}. That points to a firewall or bot rule, not robots.txt. Bot protection that verifies crawler IP addresses can also reject a user agent sent from another network, so confirm with your host or CDN before changing anything.`,
      }],
    };
  }

  return { level: 'none', penalty: 0, findings: [], probes: summary };
}

export { analyzeEdgeProtection, extractTitle, isBlocked, FULL_CHALLENGE_PENALTY };
