// Readiness check: fetch-submit + result rendering.
// Lives as a static external file so the strict CSP (script-src 'self',
// no 'unsafe-inline') holds. All rendering uses createElement/textContent,
// never innerHTML with data, so nothing in the API response or the user's
// input can inject markup (OWASP A03).
(function () {
  var form = document.getElementById('scan-form');
  if (!form) return;
  var status = document.getElementById('scan-status');
  var resultsSection = document.getElementById('results');
  var resultsBody = document.getElementById('results-body');
  var setStatus = function (msg) { if (status) status.textContent = msg; };

  // --- tiny DOM helpers (textContent only) ---------------------------------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  // Severity -> brand-correct presentation. Magenta is NOT used here; it is
  // reserved for the single Bottom Line box (brand rule: impact only).
  var SEVERITY = {
    critical: { label: 'CRITICAL', labelClass: 'text-canvas font-bold', textClass: 'text-canvas' },
    info:     { label: 'INFO',     labelClass: 'text-canvas/40',        textClass: 'text-canvas/60' },
    pass:     { label: 'PASS',     labelClass: 'text-success',          textClass: 'text-canvas/80' }
  };

  function severityRow(finding) {
    var s = SEVERITY[finding.severity] || SEVERITY.info;
    var row = el('li', 'flex gap-4 py-3 border-b border-white/10');
    row.appendChild(el('span', 'font-mono text-xs w-20 shrink-0 pt-0.5 ' + s.labelClass, s.label));
    row.appendChild(el('span', 'text-sm ' + s.textClass, finding.text));
    return row;
  }

  // Pick the single worst finding for the Bottom Line (the one magenta moment).
  function worstFinding(dimensions) {
    var all = [];
    dimensions.forEach(function (d) { (d.findings || []).forEach(function (f) { all.push(f); }); });
    var critical = all.filter(function (f) { return f.severity === 'critical'; });
    if (critical.length) return { text: critical[0].text, isProblem: true };
    return {
      text: 'No critical gaps found in what this scan measures. The machine can read you.',
      isProblem: false
    };
  }

  function renderBotTable(bots) {
    var wrap = el('div', 'mt-6');
    wrap.appendChild(el('p', 'font-mono text-xs uppercase tracking-[0.2em] text-canvas/50', '// crawler access'));
    var list = el('ul', 'mt-3 grid gap-x-8 sm:grid-cols-2');
    bots.forEach(function (b) {
      var row = el('li', 'flex items-baseline justify-between gap-3 py-1.5 border-b border-white/5');
      var name = el('span', 'font-mono text-sm ' + (b.tier === 'citation' ? 'text-ai' : 'text-infra'), b.token);
      name.title = b.vendor + ' \u00b7 ' + (b.tier === 'citation' ? 'citation crawler' : 'training crawler');
      row.appendChild(name);
      var access =
        b.access === 'disallowed' ? el('span', 'font-mono text-xs font-bold text-canvas', 'BLOCKED') :
        b.access === 'allowed'    ? el('span', 'font-mono text-xs text-success', 'allowed') :
                                    el('span', 'font-mono text-xs text-canvas/40', 'unlisted');
      row.appendChild(access);
      list.appendChild(row);
    });
    wrap.appendChild(list);
    var legend = el('p', 'mt-3 font-mono text-xs text-canvas/40',
      'purple = citation crawlers (decide AI visibility) \u00b7 blue = training crawlers (blocking these is a choice)');
    wrap.appendChild(legend);
    return wrap;
  }

  function renderResults(data) {
    resultsBody.textContent = '';

    // Headline: scanned origin + the big grade.
    var head = el('div', 'flex flex-wrap items-end justify-between gap-6');
    var left = el('div');
    left.appendChild(el('p', 'font-mono text-sm text-canvas/60', data.scannedUrl));
    left.appendChild(el('h2', 'mt-2 text-4xl', 'Readiness: ' + data.overallScore + '/100'));
    head.appendChild(left);
    head.appendChild(el('div', 'font-mono text-7xl font-bold ' +
      (data.overallGrade === 'A' || data.overallGrade === 'B' ? 'text-success' : 'text-canvas'),
      data.overallGrade));
    resultsBody.appendChild(head);

    // Bottom Line: the single magenta moment on the page's results.
    var worst = worstFinding(data.dimensions || []);
    var bottom = el('div', 'mt-8 border-l-4 border-impact bg-white/[0.02] p-6 max-w-3xl');
    bottom.appendChild(el('p', 'font-mono text-xs uppercase tracking-[0.2em] text-impact', '// bottom line'));
    bottom.appendChild(el('p', 'mt-2 font-display text-xl font-bold text-canvas', worst.text));
    resultsBody.appendChild(bottom);

    // Per-dimension findings.
    (data.dimensions || []).forEach(function (d) {
      var block = el('div', 'mt-10 max-w-3xl');
      var header = el('div', 'flex items-baseline justify-between gap-4');
      header.appendChild(el('h3', 'text-2xl', d.dimension));
      header.appendChild(el('span', 'font-mono text-lg text-canvas/70', d.score === null ? 'not scored' : d.score + '/100'));
      block.appendChild(header);
      var list = el('ul', 'mt-4');
      (d.findings || []).forEach(function (f) { list.appendChild(severityRow(f)); });
      block.appendChild(list);
      if (d.bots && d.bots.length) block.appendChild(renderBotTable(d.bots));
      resultsBody.appendChild(block);
    });

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- submit --------------------------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var urlInput = form.querySelector('input[name="url"]');
    var tokenInput = form.querySelector('[name="cf-turnstile-response"]');
    var token = tokenInput ? tokenInput.value : '';

    if (!urlInput || !urlInput.value.trim()) { setStatus('Enter your site first.'); return; }
    if (!token) { setStatus('Complete the verification first.'); return; }

    if (btn) btn.disabled = true;
    setStatus('Scanning\u2026 the speed check runs a full Lighthouse pass, so this can take up to 30 seconds.');

    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.value.trim(), turnstileToken: token })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (result.ok) {
          setStatus('');
          renderResults(result.data);
        } else {
          setStatus(result.data.error || 'Something went wrong. Try again.');
        }
      })
      .catch(function () { setStatus('Network error. Try again in a moment.'); })
      .finally(function () {
        if (btn) btn.disabled = false;
        if (window.turnstile && window.turnstile.reset) window.turnstile.reset();
      });
  });
})();
