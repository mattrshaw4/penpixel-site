/**
 * Penpixel Creative - Structured Data Check (Phase 1, dimension 3)
 * ----------------------------------------------------------------------------
 * Pure function. Takes already-fetched page HTML in, returns a scored
 * dimension out. Same portability contract as the other two: no network, no
 * DOM, drops into any JS runtime (Node here, the Workers runtime in
 * production) unchanged.
 *
 * V1 SCOPE (deliberate cut, see build plan): presence and syntax validity
 * only. This does NOT check whether a given @type carries every property
 * Google requires for a specific rich-result eligibility (Organization logo,
 * FAQPage minimum question count, etc.). That rule engine is the fast-follow
 * after Sept 1, real ongoing-maintenance work with no shortcut, and bolting a
 * half-built version of it into this dimension is how an honest v1 cut
 * quietly turns into the thing it was cut to avoid.
 *
 * EXTRACTION METHOD: JSON-LD only (not Microdata/RDFa), found by regex against
 * <script type="application/ld+json"> blocks, not a DOM/HTML parser.
 * Deliberate: JSON-LD is the format Google recommends and the dominant format
 * in practice (confirmed against Penpixel Creative's own SchemaOrg.astro and
 * ServiceSchema.astro output). A regex has no dependency to install, works
 * identically in Node and the Workers runtime with zero compatibility risk,
 * and is easy to reason about for ReDoS: no nested quantifiers, no ambiguous
 * alternation, so it scans in linear time even on adversarial input (verified
 * in the test suite: 3000 unclosed script tags + 500KB filler in ~170ms).
 * Microdata/RDFa presence is out of v1 scope; a page using only those formats
 * reads as "no JSON-LD found" this run.
 *
 * SCORING MODEL: every penalty is proportional to the FRACTION of the page's
 * structured data affected, not a flat per-occurrence deduction, and a
 * finding's severity label is derived from its actual score impact, not
 * assigned independently. Both exist to fix a real bug caught in testing: a
 * flat penalty let a page with its only entity missing @context score 85/B
 * while flagged "critical", a B grade with a critical flag is a contradiction
 * a prospect would catch immediately.
 */

const LDJSON_BLOCK_RE =
  /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;

const SCHEMA_ORG_CONTEXT_RE = /^https?:\/\/(www\.)?schema\.org\/?$/i;

/** Pull every JSON-LD <script> body out of raw HTML. Never throws. */
function extractRawBlocks(html) {
  const blocks = [];
  if (typeof html !== 'string' || html.length === 0) return blocks;
  let m;
  LDJSON_BLOCK_RE.lastIndex = 0; // regex has /g; reset in case of reuse
  while ((m = LDJSON_BLOCK_RE.exec(html)) !== null) {
    blocks.push(m[1].trim());
    if (m.index === LDJSON_BLOCK_RE.lastIndex) LDJSON_BLOCK_RE.lastIndex++; // defense in depth
  }
  return blocks;
}

/** Normalize one parsed JSON-LD value into a flat list of {context, type} entities. */
function flattenEntities(value) {
  const out = [];
  function visit(node, inheritedContext) {
    if (Array.isArray(node)) { node.forEach((n) => visit(n, inheritedContext)); return; }
    if (!node || typeof node !== 'object') return;
    const context = node['@context'] || inheritedContext;
    if (Array.isArray(node['@graph'])) {
      node['@graph'].forEach((n) => visit(n, context)); // @graph entries inherit parent @context
      return;
    }
    if ('@type' in node) out.push({ context: context, type: node['@type'] });
  }
  visit(value, undefined);
  return out;
}

function typeLabel(t) {
  if (Array.isArray(t)) return t.filter((x) => typeof x === 'string').join(' + ') || '(unlabeled)';
  return typeof t === 'string' && t.length ? t : '(unlabeled)';
}

/** Severity follows impact, not the other way around, so a finding never
 *  claims more weight than the score actually gave it. */
function severityForPenalty(points) {
  return points >= 20 ? 'critical' : 'info';
}

function inconclusive(reasonText) {
  return {
    dimension: 'Structured Data',
    score: null,
    inconclusive: true,
    typesFound: [],
    findings: [{ severity: 'info', text: reasonText }],
  };
}

/**
 * @param {Object} input
 * @param {number} input.pageStatus  HTTP status of the page HTML fetch (0 if failed)
 * @param {string} input.pageHtml    body text of the fetched page ('' if none)
 * @returns {Object} scored Structured Data dimension
 */
function analyzeStructuredData(input) {
  const pageStatus = input.pageStatus || 0;
  const pageHtml = input.pageHtml || '';

  if (pageStatus === 0) {
    return inconclusive('Could not fetch the page to check for structured data this run.');
  }
  if (pageStatus >= 400) {
    return inconclusive(
      `The page returned status ${pageStatus} when fetched, so structured data was not checked this run.`
    );
  }

  const rawBlocks = extractRawBlocks(pageHtml);
  if (rawBlocks.length === 0) {
    return {
      dimension: 'Structured Data',
      score: 30,
      inconclusive: false,
      typesFound: [],
      findings: [{
        severity: 'critical',
        text: 'No structured data (JSON-LD) found on the page. With nothing machine-readable to parse, AI systems are inferring who you are from prose alone, which is exactly the gap this dimension exists to catch.',
      }],
    };
  }

  const totalBlocks = rawBlocks.length;
  let parseErrors = 0;
  let blocksWithNoType = 0;
  const entities = []; // {context, type} across all successfully parsed blocks

  for (const raw of rawBlocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parseErrors++;
      continue;
    }
    const found = flattenEntities(parsed);
    if (found.length === 0) { blocksWithNoType++; continue; }
    entities.push(...found);
  }

  const parsedBlocks = totalBlocks - parseErrors;
  const badContextEntities = entities.filter((e) => {
    const ctx = e.context;
    return !(typeof ctx === 'string' && SCHEMA_ORG_CONTEXT_RE.test(ctx.trim()));
  });

  // ---- Proportional penalties -------------------------------------------
  const parseErrorFraction = parseErrors / totalBlocks;
  const penaltyParse = Math.round(parseErrorFraction * 70);

  const missingTypeFraction = parsedBlocks > 0 ? blocksWithNoType / parsedBlocks : 0;
  const penaltyMissingType = Math.round(missingTypeFraction * 30);

  const badContextFraction = entities.length > 0 ? badContextEntities.length / entities.length : 0;
  const penaltyContext = Math.round(badContextFraction * 50);

  const score = Math.max(0, Math.min(100, 100 - penaltyParse - penaltyMissingType - penaltyContext));

  const findings = [];
  if (parseErrors > 0) {
    findings.push({
      severity: severityForPenalty(penaltyParse),
      text: `${parseErrors} of ${totalBlocks} structured data block${totalBlocks > 1 ? 's' : ''} on the page do not parse as valid JSON. A syntax error here means it is silently ignored, functionally the same as not being there, just harder to notice.`,
    });
  }
  if (blocksWithNoType > 0) {
    findings.push({
      severity: severityForPenalty(penaltyMissingType),
      text: `${blocksWithNoType} block${blocksWithNoType > 1 ? 's parse' : ' parses'} as valid JSON but declare${blocksWithNoType > 1 ? '' : 's'} no @type, so there is nothing for a machine to identify.`,
    });
  }
  if (badContextEntities.length > 0) {
    findings.push({
      severity: severityForPenalty(penaltyContext),
      text: `${badContextEntities.length} of ${entities.length} entit${entities.length > 1 ? 'ies' : 'y'} found without a valid schema.org @context. Without it, machines cannot reliably interpret the data as schema.org structured data.`,
    });
  }

  const uniqueTypes = [...new Set(entities.map((e) => typeLabel(e.type)))];
  if (uniqueTypes.length > 0 && parseErrors === 0 && badContextEntities.length === 0) {
    findings.push({
      severity: 'pass',
      text: `Valid schema.org structured data found: ${uniqueTypes.join(', ')}. Whether each type carries every property AI systems look for is the deeper check in the full audit, this pass confirms the foundation is there.`,
    });
  }

  return {
    dimension: 'Structured Data',
    score,
    inconclusive: false,
    typesFound: uniqueTypes,
    findings,
  };
}

export { analyzeStructuredData, extractRawBlocks, flattenEntities };
