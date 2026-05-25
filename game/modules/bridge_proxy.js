/**
 * SVR Poker — Bridge Proxy Runtime Guard
 * Build: PHASE-233-OPTIONAL-MODULE-LOADER-LOCK
 * Purpose: install a no-crash proxy before poker/runtime modules dispatch telemetry.
 * The proxy returns safe functions for any record* method so missing recorder aliases
 * cannot freeze the render loop.
 */
const BUILD = 'PHASE-233-OPTIONAL-MODULE-LOADER-LOCK';
const STORE_KEY = '__svrBridgeProxyQueue';

function safePayload(value){
  try { return JSON.parse(JSON.stringify(value ?? {})); }
  catch (_) { return { unserializable: true, summary: String(value).slice(0, 1200) }; }
}

function methodToType(prop){
  return String(prop || 'generic')
    .replace(/^record/, '')
    .replace(/[A-Z]/g, m => '_' + m.toLowerCase())
    .replace(/^_/, '')
    || 'generic';
}

function makeEvent(type, payload){
  return { type, build: BUILD, at: new Date().toISOString(), payload: safePayload(payload) };
}

const state = window[STORE_KEY] || { pending: [], calls: [], patched: [], errors: [] };
window[STORE_KEY] = state;

const base = window.SVR_ENTERPRISE_BRIDGE || window.SVREnterpriseBridge || {};
if (!Array.isArray(base.pending)) base.pending = state.pending;
base.build = base.build || BUILD;
base.proxyBuild = BUILD;
base.proxyActive = true;
base.enqueue = typeof base.enqueue === 'function' ? base.enqueue.bind(base) : function(type, payload = {}){
  const event = makeEvent(type || 'generic', payload);
  state.pending.push(event);
  if (state.pending.length > 250) state.pending.shift();
  try { window.dispatchEvent(new CustomEvent('svr_enterprise_bridge_queue', { detail: event })); } catch (_) {}
  return event;
};
base.queue = typeof base.queue === 'function' ? base.queue.bind(base) : (type, payload = {}) => base.enqueue(type || 'generic', payload);
base.postTelemetry = typeof base.postTelemetry === 'function' ? base.postTelemetry.bind(base) : (type, payload = {}) => base.enqueue(type || 'telemetry', payload);
base.recordGeneric = typeof base.recordGeneric === 'function' ? base.recordGeneric.bind(base) : (type, payload = {}) => base.enqueue(type || 'generic', payload);

const proxy = new Proxy(base, {
  get(target, prop, receiver){
    if (prop in target) {
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    }
    if (typeof prop === 'string' && (prop.startsWith('record') || prop === 'queue' || prop === 'postTelemetry')) {
      const fn = function(payload = {}){
        const type = prop === 'queue' || prop === 'postTelemetry' ? 'telemetry' : methodToType(prop);
        state.calls.push({ method: prop, type, at: new Date().toISOString() });
        if (state.calls.length > 100) state.calls.shift();
        return target.enqueue ? target.enqueue(type, payload) : base.enqueue(type, payload);
      };
      target[prop] = fn;
      state.patched.push(prop);
      if (state.patched.length > 100) state.patched.shift();
      return fn;
    }
    return undefined;
  },
  set(target, prop, value){
    target[prop] = value;
    return true;
  }
});

window.SVR_ENTERPRISE_BRIDGE = proxy;
window.SVREnterpriseBridge = proxy;
window.SVR_BRIDGE_PROXY = {
  build: BUILD,
  state,
  getBridge(){ return proxy; },
  ensure(method){
    if (!method) return false;
    const fn = proxy[method];
    return typeof fn === 'function';
  },
  report(){
    return {
      build: BUILD,
      at: new Date().toISOString(),
      proxyActive: true,
      pending: state.pending.length,
      patched: state.patched.slice(-30),
      recentCalls: state.calls.slice(-30),
    };
  }
};

try { window.dispatchEvent(new CustomEvent('svr_bridge_proxy_ready', { detail: window.SVR_BRIDGE_PROXY.report() })); } catch (_) {}
export default window.SVR_BRIDGE_PROXY;
