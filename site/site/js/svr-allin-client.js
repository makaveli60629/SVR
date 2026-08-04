// SVR Phase 181 internal all-in/contribution client. Public Matrix page untouched.
(function(){
  window.SVR_PHASE181_ALLIN_CLIENT = {
    build: 'PHASE-181-ALLIN-CONTRIBUTION-LOCK',
    last: null,
    async send(payload){
      this.last = payload || null;
      try {
        const api = window.SVR_API_BASE || localStorage.getItem('SVR_API_BASE') || '';
        if (!api) return false;
        const res = await fetch(api + '/api/game/contributions', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload || {})
        });
        return res.ok;
      } catch(_) { return false; }
    }
  };
  window.addEventListener('svr_poker_allin_update', (ev) => window.SVR_PHASE181_ALLIN_CLIENT.send(ev.detail));
})();
