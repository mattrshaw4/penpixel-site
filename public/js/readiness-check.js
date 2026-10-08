// Readiness check: fetch-submit + result rendering + email-gate unlock flow.
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
  var unlockBox = document.getElementById('unlock-box');
  var unlockEmailInput = document.getElementById('unlock-email');
  var unlockSubmitBtn = document.getElementById('unlock-submit');
  var unlockStatus = document.getElementById('unlock-status');
  var setStatus = function (msg) { if (status) status.textContent = msg; };
  var setUnlockStatus = function (msg) { if (unlockStatus) unlockStatus.textContent = msg; };

  // Button labels swap on submit, not just the small status text beside them,
  // feedback from a real tester: dimming alone isn't a strong enough signal,
  // and the status line is easy to miss. The label itself needs to say so.
  var SCAN_BTN_IDLE = 'Run the check';
  var SCAN_BTN_LOADING = 'Checking\u2026';
  var UNLOCK_BTN_IDLE = 'Unlock full report';
  var UNLOCK_BTN_LOADING = 'Unlocking\u2026';

  // Remembered from the first (ungated) scan so the unlock step re-submits
  // the same URL without asking the visitor to type it again. Only one
  // widget's worth of state is needed since this page scans one URL at a time.
  var lastScannedUrl = null;

  // Lightweight client-side sanity check only, a UX nicety so a visitor gets
  // instant feedback instead of a round trip for an obvious typo. The real
  // validation, the one that actually matters, happens server-side; this
  // check being wrong or bypassed changes nothing about what the API allows.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Pick the single worst thing for the Bottom Line (the one magenta moment).
  // Findings win when present (unlocked results). Gated results carry no
  // findings, so fall back to the scores, which are always visible: the
  // headline must never say "all clear" next to a failing score. That was a
  // real bug: gating hid the findings and the box defaulted to reassurance
  // beside a 26/100 Delivery Speed.
  var LOW_SCORE_TEXT = {
    'Crawl Access': 'AI crawlers are likely locked out or heavily restricted.',
    'Delivery Speed': 'Pages load too slowly for AI crawlers, which give up in seconds.',
    'Structured Data': 'Machines have little or no structured data to read.'
  };
  function worstFinding(dimensions) {
    var all = [];
    dimensions.forEach(function (d) { (d.findings || []).forEach(function (f) { all.push(f); }); });
    var critical = all.filter(function (f) { return f.severity === 'critical'; });
    if (critical.length) return { text: critical[0].text, isProblem: true };

    var scored = dimensions.filter(function (d) { return typeof d.score === 'number'; });
    var weakest = scored.reduce(function (min, d) { return !min || d.score < min.score ? d : min; }, null);
    if (weakest && weakest.score < 50) {
      return {
        text: weakest.dimension + ' scored ' + weakest.score + '/100. ' +
          (LOW_SCORE_TEXT[weakest.dimension] || 'This is the weak link in the score.'),
        isProblem: true
      };
    }
    if (weakest && weakest.score < 70) {
      return {
        text: 'Readable, with room to improve. ' + weakest.dimension + ' is the weakest area at ' + weakest.score + '/100.',
        isProblem: true
      };
    }
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
    lastScannedUrl = data.scannedUrl;

    // Headline: scanned origin + the big grade. Always present, gated or not.
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

    // Per-dimension: score always shown; findings/bots only present when the
    // API sent them, which is exactly the gate, no client-side check needed
    // here to decide what to render, the response shape already decided it.
    (data.dimensions || []).forEach(function (d) {
      var block = el('div', 'mt-10 max-w-3xl');
      var header = el('div', 'flex items-baseline justify-between gap-4');
      header.appendChild(el('h3', 'text-2xl', d.dimension));
      header.appendChild(el('span', 'font-mono text-lg text-canvas/70', d.score === null ? 'not scored' : d.score + '/100'));
      block.appendChild(header);
      if (d.findings) {
        var list = el('ul', 'mt-4');
        d.findings.forEach(function (f) { list.appendChild(severityRow(f)); });
        block.appendChild(list);
      }
      if (d.bots && d.bots.length) block.appendChild(renderBotTable(d.bots));
      resultsBody.appendChild(block);
    });

    // Show or hide the unlock box based on what this specific response was.
    if (unlockBox) {
      if (data.gated) {
        unlockBox.classList.remove('hidden');
      } else {
        unlockBox.classList.add('hidden');
        setUnlockStatus('');
      }
    }

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- shared submit helper, used by both the initial scan and the unlock --
  function submitScan(url, token, email, onDone) {
    var body = { url: url, turnstileToken: token };
    if (email) body.email = email;
    return fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) { onDone(null, result); })
      .catch(function () { onDone('network'); })
      .finally(function () {
        // Every submission consumes its Turnstile token; reset so the next
        // one, whichever form triggers it, has a fresh token ready.
        if (window.turnstile && window.turnstile.reset) window.turnstile.reset();
      });
  }

  // --- initial submit --------------------------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var urlInput = form.querySelector('input[name="url"]');
    var tokenInput = form.querySelector('[name="cf-turnstile-response"]');
    var token = tokenInput ? tokenInput.value : '';

    if (!urlInput || !urlInput.value.trim()) { setStatus('Enter your site first.'); return; }
    if (!token) { setStatus('Complete the verification first.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = SCAN_BTN_LOADING; }
    setStatus('Scanning\u2026 the speed check runs a full Lighthouse pass, so this can take up to 30 seconds.');

    submitScan(urlInput.value.trim(), token, null, function (err, result) {
      if (btn) { btn.disabled = false; btn.textContent = SCAN_BTN_IDLE; }
      if (err) { setStatus('Network error. Try again in a moment.'); return; }
      if (result.ok) { setStatus(''); renderResults(result.data); }
      else { setStatus(result.data.error || 'Something went wrong. Try again.'); }
    });
  });

  // --- unlock (second step: email -> full findings) -------------------------
  if (unlockSubmitBtn) {
    unlockSubmitBtn.addEventListener('click', function () {
      var email = unlockEmailInput ? unlockEmailInput.value.trim() : '';
      if (!EMAIL_RE.test(email)) { setUnlockStatus('Enter a valid email.'); return; }
      if (!lastScannedUrl) { setUnlockStatus('Run a scan first.'); return; }

      // A fresh token should already be sitting here: the initial submit's
      // finally block reset the widget the moment that scan completed, and
      // Turnstile's managed mode typically re-solves silently within a
      // second or two without visible interaction. If it hasn't resolved
      // yet (visitor clicked unlock unusually fast), ask them to wait a beat
      // rather than send a request we already know will fail verification.
      var tokenInput = form.querySelector('[name="cf-turnstile-response"]');
      var token = tokenInput ? tokenInput.value : '';
      if (!token) {
        setUnlockStatus('Still verifying, one second and try again.');
        return;
      }

      unlockSubmitBtn.disabled = true;
      unlockSubmitBtn.textContent = UNLOCK_BTN_LOADING;
      setUnlockStatus('Unlocking\u2026 this re-runs the check, another 20 to 30 seconds.');

      submitScan(lastScannedUrl, token, email, function (err, result) {
        unlockSubmitBtn.disabled = false;
        unlockSubmitBtn.textContent = UNLOCK_BTN_IDLE;
        if (err) { setUnlockStatus('Network error. Try again in a moment.'); return; }
        if (result.ok) {
          if (result.data.gated) {
            // Valid-looking email that the server still rejected for some
            // reason (defense in depth beyond the client-side regex above).
            setUnlockStatus('That email could not be verified. Try another.');
          } else {
            setUnlockStatus('');
            renderResults(result.data);
          }
        } else {
          setUnlockStatus(result.data.error || 'Something went wrong. Try again.');
        }
      });
    });
  }
})();
