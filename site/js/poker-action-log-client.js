// SVR Phase 178 internal action log hook. No secrets. Public page untouched.
(function() {
  const BUILD = 'PHASE-178-ACTION-LOG-BOT-DECISION-LOCK';
  window.addEventListener('svr_poker_action_log_update', function(event) {
    window.SVR_LAST_POKER_ACTION_LOG = { build: BUILD, detail: event.detail || null, at: new Date().toISOString() };
  });
})();
