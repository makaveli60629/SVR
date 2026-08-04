
/** SVR Phase 187 internal decision-aid client. Public root page untouched. */
(function() {
  const BUILD = 'PHASE-187-DECISION-AID-POT-ODDS-LOCK';
  window.SVRDecisionAidClient = {
    build: BUILD,
    latest: null,
    onDecisionAid(payload) {
      this.latest = payload;
      console.log('[SVR decision aid]', payload);
    }
  };
  window.addEventListener('svr_poker_decision_aid_update', (event) => window.SVRDecisionAidClient.onDecisionAid(event.detail || {}));
})();
