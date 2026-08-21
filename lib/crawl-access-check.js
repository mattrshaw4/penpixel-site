/**
 * Penpixel Creative - Crawl Access Check (Phase 1 core logic)
 * ----------------------------------------------------------------------------
 * Pure functions. No network, no DNS, no filesystem. Takes already-fetched
 * text in, returns a scored result out. This is deliberate: it drops unchanged
 * into an n8n Code node (which cannot fetch) OR a Cloudflare Pages Function
 * (which can), so the "where does this run" decision does not touch this file.
 *
 * The fetching (robots.txt, llms.txt) happens upstream:
 *   - n8n:  two HTTP Request nodes feed their bodies + status codes into a
 *           Code node running analyzeCrawlAccess()
 *   - Pages Function: two fetch() calls, then call analyzeCrawlAccess()
 *
 * WHY the bots are split into two tiers, not one flat list:
 * A generic tool reports "GPTBot: blocked". That is not useful advice, because
 * blocking GPTBot (a training crawler) is a legitimate business choice and says
 * nothing about whether you can be CITED. The bots that actually drive AEO
 * citations are the search/answer crawlers (OAI-SearchBot, PerplexityBot,
 * Claude-User/Claude-SearchBot, Google-Extended for Gemini grounding). Blocking
 * THOSE is the real, often-accidental self-inflicted wound. The score weights
 * them accordingly. That distinction is the Experienced-Consultant read a
 * prospect cannot get from the free generic scanners.
 */


// ---------------------------------------------------------------------------
// Bot registry. tier: 'citation' bots drive AEO answers/citations (blocking
// them hurts visibility). tier: 'training' bots feed model training (blocking
// them is a defensible IP/cost choice, reported as informational, not a fail).
// Verify this list periodically: crawler user-agents change. Sources of truth
// are each vendor's own crawler docs (OpenAI, Anthropic, Perplexity, Google).
// ---------------------------------------------------------------------------
const BOTS = [
  // Citation / answer-engine crawlers - these are the ones that matter for AEO
  { token: 'OAI-SearchBot',   vendor: 'OpenAI (ChatGPT Search)', tier: 'citation' },
  { token: 'ChatGPT-User',    vendor: 'OpenAI (ChatGPT browsing)', tier: 'citation' },
  { token: 'PerplexityBot',   vendor: 'Perplexity (index)', tier: 'citation' },
  { token: 'Perplexity-User', vendor: 'Perplexity (user fetch)', tier: 'citation' },
  { token: 'Claude-User',     vendor: 'Anthropic (Claude fetch)', tier: 'citation' },
  { token: 'Claude-SearchBot',vendor: 'Anthropic (Claude search)', tier: 'citation' },
  { token: 'Google-Extended', vendor: 'Google (Gemini grounding)', tier: 'citation' },
  { token: 'Applebot-Extended', vendor: 'Apple Intelligence', tier: 'citation' },

  // Training crawlers - blocking these is a legitimate choice, reported as info
  { token: 'GPTBot',          vendor: 'OpenAI (training)', tier: 'training' },
  { token: 'ClaudeBot',       vendor: 'Anthropic (training)', tier: 'training' },
  { token: 'CCBot',           vendor: 'Common Crawl', tier: 'training' },
  { token: 'Meta-ExternalAgent', vendor: 'Meta AI (training)', tier: 'training' },
  { token: 'Bytespider',      vendor: 'ByteDance', tier: 'training' },
];

/**
 * Parse robots.txt into groups. RFC 9309 shape: consecutive User-agent lines
 * share the rule block that follows them. We keep it focused on what the score
 * needs (path "/" reachability per agent), not a full crawl simulator.
 */
function parseRobots(text) {
  const groups = []; // { agents: [lc tokens], rules: [{type:'allow'|'disallow', path}] }
  let current = null;
  let lastLineWasAgent = false;

  const lines = text.split(/\r?\n/);
  for (let raw of lines) {
    // Strip comments (# ...) and trim. robots.txt comments run to end of line.
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      // A new agent line AFTER rules starts a fresh group. A new agent line
      // right after another agent line joins the same group (shared block).
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
    } else if (field === 'allow' || field === 'disallow') {
      if (!current) { // rules before any user-agent: attach to an implicit '*'
        current = { agents: ['*'], rules: [] };
        groups.push(current);
      }
      current.rules.push({ type: field, path: value });
      lastLineWasAgent = false;
    } else {
      // sitemap, crawl-delay, content-signal, host, etc. Not needed for "/" access.
      lastLineWasAgent = false;
    }
  }
  return groups;
}

/**
 * For a given bot token, find the most specific matching group (exact agent
 * match beats '*'), then decide whether path "/" is reachable using
 * longest-match-wins between Allow and Disallow (RFC 9309 tie-break: Allow wins
 * on equal length).
 * Returns 'allowed' | 'disallowed' | 'unlisted' (no group at all = default allow).
 */
function accessForBot(groups, token) {
  const lc = token.toLowerCase();
  let exact = null, star = null;
  for (const g of groups) {
    if (g.agents.includes(lc)) exact = g;
    if (g.agents.includes('*')) star = g;
  }
  const group = exact || star;
  if (!group) return 'unlisted'; // no rule mentions this bot or '*': allowed by default

  // Evaluate rules against "/". Empty Disallow value means "allow everything".
  let decision = 'allowed';
  let bestLen = -1;
  for (const r of group.rules) {
    const p = r.path;
    if (r.type === 'disallow' && p === '') continue; // "Disallow:" = allow all
    // Does this rule pattern apply to "/"? A rule path of "/" or "" (allow)
    // matches the root. We only care about root reachability for the score.
    const applies = p === '/' || p === '' || '/'.startsWith(p);
    if (!applies) continue;
    const len = p.length;
    if (len > bestLen || (len === bestLen && r.type === 'allow')) {
      bestLen = len;
      decision = (r.type === 'disallow') ? 'disallowed' : 'allowed';
    }
  }
  // If the group exists but had no applicable rules, default is allow.
  return decision;
}

/**
 * Main entry point. All inputs are already fetched upstream.
 * @param {Object} input
 * @param {number} input.robotsStatus  HTTP status of /robots.txt fetch (0 if it failed)
 * @param {string} input.robotsBody    body text of /robots.txt ('' if none)
 * @param {number} input.llmsStatus    HTTP status of /llms.txt fetch (0 if it failed)
 * @returns {Object} scored crawl-access result
 */
function analyzeCrawlAccess(input) {
  const robotsStatus = input.robotsStatus || 0;
  const robotsBody = input.robotsBody || '';
  const llmsStatus = input.llmsStatus || 0;

  const hasRobots = robotsStatus >= 200 && robotsStatus < 300 && robotsBody.trim().length > 0;
  const hasLlms = llmsStatus >= 200 && llmsStatus < 300;
  // Distinguish "genuinely absent" (404) from "blocked/failed" (403, 401, 0, 5xx).
  // A site that 403s a scanner very likely HAS a robots.txt we just can't read,
  // so we must not claim it is missing. That would be a wrong result in front
  // of a prospect. We report it as inconclusive instead.
  const robotsInconclusive = !hasRobots && robotsStatus !== 404;

  const groups = hasRobots ? parseRobots(robotsBody) : [];

  const bots = BOTS.map(b => ({
    ...b,
    access: hasRobots ? accessForBot(groups, b.token) : 'unlisted',
  }));

  const citationBots = bots.filter(b => b.tier === 'citation');
  const trainingBots = bots.filter(b => b.tier === 'training');
  const blockedCitation = citationBots.filter(b => b.access === 'disallowed');
  const blockedTraining = trainingBots.filter(b => b.access === 'disallowed');

  // ---- Scoring (0-100 for this dimension) --------------------------------
  // WHY these weights: citation-bot access is the whole point. A global
  // "Disallow: / for *" that catches everything is the worst case. Blocking
  // named citation bots is nearly as bad. llms.txt is a positive signal but a
  // minor one (still emerging), so it is a small bonus, not a large penalty.
  let score = 100;
  const findings = [];

  // Global block: is '*' disallowed from "/"? Catastrophic for AEO.
  const starAccess = hasRobots ? accessForBot(groups, '*-nonexistent-token-forces-star') : 'unlisted';
  // (accessForBot falls back to the '*' group for any unlisted token, so this
  // probes the '*' rule specifically.)
  const globalBlocked = starAccess === 'disallowed';

  if (robotsInconclusive) {
    // Fetch was blocked (403/401), failed, or errored (0/5xx). We cannot see
    // the file, so we do not score the robots dimension and we say so plainly.
    findings.push({
      severity: 'info',
      text: `Could not read robots.txt (the site returned status ${robotsStatus || 'no response'}, which usually means it blocks automated fetches). It likely exists but is served only to recognized browsers or bots. This scan reports what is publicly fetchable.`,
    });
  } else if (!hasRobots) {
    // Genuine 404: no robots.txt at all. Not a block (default is allow), but no
    // explicit signal and no sitemap pointer. Minor deduction + info finding.
    score -= 10;
    findings.push({
      severity: 'info',
      text: 'No robots.txt found. Crawlers are allowed by default, but there is no explicit signal or sitemap pointer for AI crawlers.',
    });
  }

  if (globalBlocked) {
    score -= 60;
    findings.push({
      severity: 'critical',
      text: 'robots.txt blocks all crawlers from the site root (Disallow: / for User-agent: *). AI answer engines cannot read the site at all.',
    });
  }

  if (blockedCitation.length > 0 && !globalBlocked) {
    // Named citation bots blocked while others allowed = deliberate self-harm.
    // Weighted so even one blocked citation crawler cannot grade A: being
    // invisible to a major answer engine is a real, not cosmetic, problem.
    score -= Math.min(55, blockedCitation.length * 20);
    findings.push({
      severity: 'critical',
      text: `Blocks ${blockedCitation.length} AI citation crawler(s) that drive answer-engine visibility: ${blockedCitation.map(b => b.token).join(', ')}. These are the crawlers that let ChatGPT, Perplexity, Claude, and Gemini cite you.`,
    });
  }

  if (blockedTraining.length > 0) {
    // Informational, not scored against them. Blocking training is a real choice.
    findings.push({
      severity: 'info',
      text: `Blocks ${blockedTraining.length} AI training crawler(s): ${blockedTraining.map(b => b.token).join(', ')}. This is a legitimate choice and does not by itself affect citation visibility.`,
    });
  }

  if (hasLlms) {
    // Positive signal, but a small one, and it must not lift a site that has a
    // critical crawl-access problem into a good grade. Only apply the bonus
    // when nothing critical was found.
    const hasCritical = findings.some(f => f.severity === 'critical');
    if (!hasCritical) score += 5;
    findings.push({
      severity: 'pass',
      text: 'llms.txt is present. Emerging signal that curates content for AI assistants.',
    });
  } else {
    findings.push({
      severity: 'info',
      text: 'No llms.txt found. Optional today, but an easy way to hand AI crawlers a curated content map.',
    });
  }

  if (hasRobots && !globalBlocked && blockedCitation.length === 0) {
    findings.push({
      severity: 'pass',
      text: 'All major AI citation crawlers can reach the site root.',
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    dimension: 'Crawl Access',
    score,
    hasRobots,
    robotsInconclusive,
    robotsStatus,
    hasLlms,
    globalBlocked,
    bots,
    blockedCitationCount: blockedCitation.length,
    blockedTrainingCount: blockedTraining.length,
    findings,
  };
}

export { analyzeCrawlAccess, parseRobots, accessForBot, BOTS };
