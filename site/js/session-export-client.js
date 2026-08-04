// SVR Phase 190 internal site hook — session export reader/client shell.
// Safe internal page helper only; does not touch root public Matrix launch page.
(function(){
  window.SVR_SESSION_EXPORT_CLIENT = {
    build: 'PHASE-190-SESSION-EXPORT-LOCK',
    parse(text){ try { return JSON.parse(text); } catch { return null; } },
    summarize(payload){
      if (!payload) return 'No session payload loaded.';
      const events = Array.isArray(payload.events) ? payload.events.length : 0;
      const latest = payload.latest || {};
      const turn = latest.turn_indicator || latest.turn || {};
      return `Build: ${payload.build || 'unknown'} | Events: ${events} | Turn: ${turn.actor || '-'} ${turn.stage || ''}`;
    }
  };
})();
