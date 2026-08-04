// SVR Phase 179 internal legal-action hook. No secrets. Public page untouched.
(function() {
  const BUILD = 'PHASE-179-BETTING-ROUND-CONSISTENCY-LOCK';
  window.addEventListener('svr_poker_legal_actions_update', function(event) {
    window.SVR_LAST_POKER_LEGAL_ACTIONS = { build: BUILD, detail: event.detail || null, at: new Date().toISOString() };
  });
})();
