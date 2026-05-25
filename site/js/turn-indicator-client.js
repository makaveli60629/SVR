// SVR Phase 185 — internal turn indicator client only. Public Matrix page untouched.
(function(){
  const API_BASE = window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '';
  async function postTurnIndicator(payload){
    if (!API_BASE) return;
    try {
      await fetch(`${API_BASE}/api/game/turn-indicator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (_) {}
  }
  window.addEventListener('svr_poker_turn_indicator_update', (event) => postTurnIndicator(event.detail || {}));
  window.addEventListener('svr_watch_turn_indicator_update', (event) => {
    window.SVR_LAST_WATCH_TURN = event.detail || {};
  });
})();
