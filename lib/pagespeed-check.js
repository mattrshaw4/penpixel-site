/**
 * Penpixel Creative - Delivery Speed Check (Phase 1, dimension 2)
 * ----------------------------------------------------------------------------
 * Pure function. Takes an already-fetched PageSpeed Insights v5 response
 * (parsed JSON or null) and returns a scored dimension in the same shape as
 * the crawl-access check. No network of its own, same reasoning as the other
 * lib: it drops into any runtime unchanged.
 *
 * Scoring model:
 *   Base score = Lighthouse performance score (0-100, lab, mobile strategy).
 *   One AEO-specific override: server response time (TTFB). AI crawlers give
 *   up in roughly two seconds and mostly don't execute JavaScript, so a slow
 *   FIRST BYTE is the crawler-killing failure regardless of how well the page
 *   eventually renders for humans. TTFB past ~1.8s is a critical finding and
 *   caps the dimension score. That override is the consultant read a generic
 *   Lighthouse wrapper doesn't give.
 *
 * Failure honesty: quota errors (429), unreachable API, or missing data
 * return score:null + inconclusive:true. A measurement failure is never
 * reported as a bad site. The orchestrator excludes null scores from the
 * overall mean.
 */

// CWV thresholds (Google's published good / needs-improvement bands).
const LCP_GOOD_MS = 2500;
const LCP_POOR_MS = 4000;
const CLS_POOR = 0.25;
// AEO crawler-timeout line: past this, the machine likely left before byte one.
const TTFB_CRITICAL_MS = 1800;
const TTFB_SLOW_MS = 800;

function fmtSeconds(ms) {
  return (Math.round(ms / 100) / 10) + 's';
}

function inconclusive(reasonText) {
  return {
    dimension: 'Delivery Speed',
    score: null,
    inconclusive: true,
    metrics: null,
    findings: [{ severity: 'info', text: reasonText }],
  };
}

/**
 * @param {Object|null} psi  Parsed PageSpeed Insights v5 response, or null if
 *                           the request failed / timed out / returned non-JSON.
 * @returns {Object} scored Delivery Speed dimension
 */
function analyzePageSpeed(psi) {
  if (!psi) {
    return inconclusive(
      'Could not reach the speed measurement service. Delivery speed was not scored this run.'
    );
  }
  if (psi.error) {
    const code = psi.error.code;
    if (code === 429) {
      return inconclusive(
        'The speed measurement service is at capacity right now. Delivery speed was not scored this run. Try again shortly.'
      );
    }
    return inconclusive(
      'The speed measurement service returned an error for this page. Delivery speed was not scored this run.'
    );
  }

  const lh = psi.lighthouseResult;
  const perfRaw = lh && lh.categories && lh.categories.performance
    ? lh.categories.performance.score
    : null;
  if (perfRaw === null || perfRaw === undefined) {
    return inconclusive(
      'The speed measurement completed but returned no performance score for this page. Delivery speed was not scored this run.'
    );
  }

  const audits = lh.audits || {};
  const num = (key) => (audits[key] && typeof audits[key].numericValue === 'number'
    ? audits[key].numericValue
    : null);

  const ttfb = num('server-response-time');
  const lcp = num('largest-contentful-paint');
  const cls = num('cumulative-layout-shift');
  const tbt = num('total-blocking-time');

  let score = Math.round(perfRaw * 100);
  const findings = [];

  // --- The AEO override: first byte is what a crawler actually waits for ----
  if (ttfb !== null && ttfb > TTFB_CRITICAL_MS) {
    score = Math.min(score, 45);
    findings.push({
      severity: 'critical',
      text: `The server takes ${fmtSeconds(ttfb)} to send the first byte. AI crawlers give up in roughly two seconds, so for machines this page may as well not answer.`,
    });
  } else if (ttfb !== null && ttfb > TTFB_SLOW_MS) {
    findings.push({
      severity: 'info',
      text: `Server response time is ${fmtSeconds(ttfb)}. Not fatal, but crawler patience is measured in seconds; under ${fmtSeconds(TTFB_SLOW_MS)} is where you want to be.`,
    });
  }

  // --- Core Web Vitals, framed honestly for what each means to a machine ---
  if (lcp !== null && lcp > LCP_POOR_MS) {
    findings.push({
      severity: 'critical',
      text: `Largest Contentful Paint is ${fmtSeconds(lcp)}, in Google's "poor" band (over ${fmtSeconds(LCP_POOR_MS)}). That drags conventional rankings, which AI answers still lean on as a quality signal.`,
    });
  } else if (lcp !== null && lcp > LCP_GOOD_MS) {
    findings.push({
      severity: 'info',
      text: `Largest Contentful Paint is ${fmtSeconds(lcp)}. Google's "good" line is ${fmtSeconds(LCP_GOOD_MS)}; you're in the middle band.`,
    });
  }

  if (cls !== null && cls > CLS_POOR) {
    findings.push({
      severity: 'info',
      text: `Cumulative Layout Shift is ${cls.toFixed(2)}, above the ${CLS_POOR} "poor" line. This one is about humans and Google ranking, not crawlers; machines don't watch your layout move.`,
    });
  }

  if (findings.length === 0 || score >= 90) {
    findings.push({
      severity: 'pass',
      text: `Lab performance score ${score}/100 on mobile. Fast enough for machines and humans.`,
    });
  }

  // Field-data honesty: low-traffic sites have no Chrome real-user data.
  const hasFieldData = psi.loadingExperience
    && psi.loadingExperience.metrics
    && Object.keys(psi.loadingExperience.metrics).length > 0;
  if (!hasFieldData) {
    findings.push({
      severity: 'info',
      text: 'Not enough real-user Chrome traffic for field data on this page; numbers above are a controlled lab run.',
    });
  }

  return {
    dimension: 'Delivery Speed',
    score: Math.max(0, Math.min(100, score)),
    inconclusive: false,
    metrics: {
      performanceScore: Math.round(perfRaw * 100),
      ttfbMs: ttfb,
      lcpMs: lcp,
      cls: cls,
      tbtMs: tbt,
      strategy: 'mobile',
    },
    findings,
  };
}

export { analyzePageSpeed };
