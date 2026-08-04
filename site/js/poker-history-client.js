// SVR Poker internal site client — PHASE-177-HAND-HISTORY-STACK-LOCK
// Safe frontend only. No SQL strings, no Stripe secret keys.
(function() {
  const API = window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '';
  window.SVRPokerHistoryClient = {
    build: 'PHASE-177-HAND-HISTORY-STACK-LOCK',
    async latest(limit = 20) {
      if (!API) return { ok:false, error:'API base not configured' };
      const res = await fetch(`${API}/api/game/hand-history?limit=${encodeURIComponent(limit)}`, { cache:'no-store' });
      return res.json();
    }
  };
})();
