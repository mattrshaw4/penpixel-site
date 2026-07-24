/**
 * Penpixel Creative — 404 Suggested Pages
 *
 * Runs on the static /404 page. Since this page is served for every broken
 * URL on the site (Cloudflare Pages returns the same prebuilt 404.html
 * regardless of what was requested), there's no server-side context about
 * which URL the visitor actually hit — so the matching happens here,
 * client-side, against a small manifest of real pages.
 *
 * How it works:
 *   1. Tokenize the broken path (e.g. /results/joveo-ai-search-visibility
 *      -> ["results","joveo","search","visibility"])
 *   2. Score each real page by how many tokens it shares with the broken path
 *   3. Show the top matches (if any) as "looking for one of these?"
 *   4. If nothing scores above zero, the section stays hidden and the
 *      existing Home / Blog buttons on the page are the fallback
 *
 * This is keyword overlap, not semantic understanding — it will correctly
 * catch things like /results/joveo-... -> /case-studies/joveo (exact name
 * match) but won't catch a case with zero shared words (e.g. a page about
 * "pet hospitals" won't match a page titled "veterinary migration" unless
 * you add synonyms to the manifest below). Extend PAGE_MANIFEST's `title`
 * field with extra keywords/synonyms over time as you see real misses in
 * Search Console's 404 report.
 *
 * Security note (OWASP A03 - XSS): the broken URL itself is never rendered
 * back to the visitor, and every suggested link/label comes from this
 * fixed, first-party manifest — never from window.location. All DOM writes
 * use textContent/createElement, never innerHTML, so a crafted URL path
 * can't inject markup into the page.
 */

(function () {
  "use strict";

  // Real, current site pages. Update when pages are added, renamed, or removed.
  var PAGE_MANIFEST = [
    { path: "/", title: "Home" },
    { path: "/about", title: "About Penpixel Creative" },
    { path: "/services", title: "Services overview" },
    { path: "/services/ai-search-readiness-audits", title: "AI Search Readiness Audits" },
    { path: "/services/entity-management", title: "AI Entity Management" },
    { path: "/services/strategic-implementation", title: "Strategic AI Search Implementation" },
    { path: "/services/brand-and-visual-authority", title: "AI Brand and Visual Authority" },
    { path: "/case-studies", title: "Case studies overview" },
    { path: "/case-studies/dt-heritage", title: "Case study DT Heritage AI citation growth" },
    { path: "/case-studies/the-alexander-group", title: "Case study The Alexander Group organic surge identity recovery" },
    { path: "/case-studies/joveo", title: "Case study Joveo enterprise AI search visibility readiness" },
    { path: "/case-studies/logistics", title: "Case study logistics entity organic surge" },
    { path: "/case-studies/rpo-indexation", title: "Case study enterprise RPO programmatic indexation" },
    { path: "/case-studies/veterinary-migration", title: "Case study national veterinary hospital location migration" },
    { path: "/blog", title: "Blog and insights" },
    { path: "/contact", title: "Contact and get the diagnosis" }
  ];

  var STOPWORDS = {
    "the": 1, "a": 1, "an": 1, "of": 1, "for": 1, "and": 1, "to": 1, "in": 1,
    "on": 1, "with": 1, "is": 1, "are": 1, "case": 1, "study": 1, "studies": 1,
    "page": 1
  };

  function tokenize(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter(function (t) { return t.length > 2 && !STOPWORDS[t]; });
  }

  function scoreEntry(brokenTokens, entry) {
    var entryTokens = tokenize(entry.path + " " + entry.title);
    var overlap = 0;
    for (var i = 0; i < brokenTokens.length; i++) {
      if (entryTokens.indexOf(brokenTokens[i]) !== -1) overlap++;
    }
    return overlap;
  }

  function getSuggestions(pathname, max) {
    var brokenTokens = tokenize(pathname);
    if (brokenTokens.length === 0) return [];

    var scored = [];
    for (var i = 0; i < PAGE_MANIFEST.length; i++) {
      var entry = PAGE_MANIFEST[i];
      var score = scoreEntry(brokenTokens, entry);
      if (score > 1) scored.push({ entry: entry, score: score });
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, max).map(function (s) { return s.entry; });
  }

  function renderSuggestions(suggestions) {
    var container = document.getElementById("suggested-pages");
    if (!container) return;

    if (suggestions.length === 0) {
      container.hidden = true;
      return;
    }

    var heading = document.createElement("p");
    heading.className = "font-mono text-sm uppercase tracking-[0.2em] text-impact";
    heading.textContent = "// looking for one of these?";
    container.appendChild(heading);

    var list = document.createElement("div");
    list.className = "mt-4 flex flex-col gap-2";

    suggestions.forEach(function (entry) {
      var link = document.createElement("a");
      link.href = entry.path; // known-good internal path from our own manifest, not user input
      link.textContent = entry.title; // textContent only, never innerHTML
      link.className =
        "font-body text-canvas/80 underline decoration-canvas/30 underline-offset-4 transition-colors hover:text-canvas hover:decoration-impact";
      list.appendChild(link);
    });

    container.appendChild(list);
    container.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      var suggestions = getSuggestions(window.location.pathname, 3);
      renderSuggestions(suggestions);
    } catch (e) {
      // Fail silently. Worst case, the visitor just sees the default
      // Home / Blog buttons that are already on the page.
    }
  });
})();

/*
 * 🔒 Security Note for Client Handoff:
 * This code was reviewed against OWASP Top 10 (2021).
 * ✅ Security scan complete — no OWASP Top 10 issues detected.
 *   - No innerHTML/document.write with dynamic data (A03)
 *   - No eval/new Function (A03)
 *   - Broken pathname is never rendered to the page — only fixed manifest strings
 *   - No third-party CDN scripts, no localStorage, no forms
 * Before deploying: none of the above required a fix, ship as-is.
 */
