// Diagnosis form: fetch-submit with inline status.
// Lives as a static external file so the strict CSP (script-src 'self',
// no 'unsafe-inline') holds — Astro would otherwise inline small scripts.
(function () {
  var form = document.getElementById('diagnosis-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var setStatus = function (msg) { if (status) status.textContent = msg; };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus('Sending…');

    fetch('/api/contact', { method: 'POST', body: new FormData(form) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          form.reset();
          if (window.turnstile && window.turnstile.reset) window.turnstile.reset();
          setStatus('Received. We\u2019ll reply from a real inbox shortly.');
        } else {
          setStatus(data.error || 'Something went wrong. Try again.');
        }
      })
      .catch(function () { setStatus('Network error. Email us directly instead.'); })
      .finally(function () { if (btn) btn.disabled = false; });
  });
})();
