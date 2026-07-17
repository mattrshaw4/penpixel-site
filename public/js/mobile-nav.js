// Mobile nav toggle. External static file (not inline) so the strict CSP
// (script-src 'self', no 'unsafe-inline') holds — same pattern as contact-form.js.
(function () {
  var toggle = document.getElementById('mobile-nav-toggle');
  var panel = document.getElementById('mobile-nav');
  var iconOpen = document.getElementById('icon-open');
  var iconClose = document.getElementById('icon-close');
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);
  }

  toggle.addEventListener('click', function () {
    setOpen(panel.classList.contains('hidden'));
  });

  // Close on Escape for keyboard users.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // If the viewport grows past the mobile breakpoint while the panel is open
  // (e.g. rotating a tablet), reset state so it doesn't get stuck open.
  var mq = window.matchMedia('(min-width: 640px)');
  mq.addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
})();
