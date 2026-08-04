// SVR Phase 180 internal showdown hook. No secrets. Public page untouched.
(function() {
  const BUILD = 'PHASE-180-SHOWDOWN-WINNING-CARDS-LOCK';
  window.addEventListener('svr_poker_showdown_reveal', function(event) {
    window.SVR_LAST_POKER_SHOWDOWN = { build: BUILD, detail: event.detail || null, at: new Date().toISOString() };
  });
})();
