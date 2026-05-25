
/** SVR Phase 186 internal dealer/rebuy client. Public root page untouched. */
(function() {
  const BUILD = 'PHASE-186-DEALER-BLIND-REBUY-LOCK';
  window.SVRDealerRebuyClient = {
    build: BUILD,
    latestDealer: null,
    latestRebuy: null,
    onDealer(payload) { this.latestDealer = payload; console.log('[SVR dealer button]', payload); },
    onRebuy(payload) { this.latestRebuy = payload; console.log('[SVR rebuy]', payload); }
  };
  window.addEventListener('svr_poker_dealer_button_update', (event) => window.SVRDealerRebuyClient.onDealer(event.detail || {}));
  window.addEventListener('svr_poker_rebuy_update', (event) => window.SVRDealerRebuyClient.onRebuy(event.detail || {}));
})();
