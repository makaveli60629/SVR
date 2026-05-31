// SVR Phase 88 local event bus.
// Safe, backend-free bridge for future charity, sponsor, store, portal, and mission-wall events.
export function installSvrEventBus(){
  if (window.SVR_EVENT_BUS?.installed) return window.SVR_EVENT_BUS;
  const history = [];
  const listeners = new Map();
  const api = {
    installed: true,
    version: 'PHASE-88-REFINED-MISSION-PORTAL-SKY-LOCK',
    history,
    emit(type, detail = {}){
      const payload = { type, detail, at: Date.now() };
      history.push(payload);
      if (history.length > 80) history.shift();
      window.dispatchEvent(new CustomEvent(type, { detail }));
      const set = listeners.get(type);
      if (set) set.forEach(fn=>{ try{ fn(detail, payload); }catch(err){ console.warn('[SVR bus listener]', type, err); } });
      return payload;
    },
    on(type, fn){
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return ()=>listeners.get(type)?.delete(fn);
    }
  };
  window.SVR_EVENT_BUS = api;
  window.dispatchEvent(new CustomEvent('svr_phase88_bus_ready', { detail: { version: api.version } }));
  return api;
}
