/**
 * SVR Poker — Safe Event Bus
 * Build: PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK
 * Purpose: sandbox SVR custom-event listeners so a missing recorder/listener cannot freeze gameplay.
 */
const BUILD = 'PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK';
const ORIGINAL_ADD = EventTarget.prototype.addEventListener;
const ORIGINAL_REMOVE = EventTarget.prototype.removeEventListener;
const ORIGINAL_DISPATCH = EventTarget.prototype.dispatchEvent;
const WRAP_MAP = new WeakMap();
const SAFE_PREFIXES = ['svr_', 'SVR_'];

function isSvrEvent(type) {
  return typeof type === 'string' && SAFE_PREFIXES.some(prefix => type.startsWith(prefix));
}
function asText(error) { return String(error?.stack || error?.message || error || 'unknown listener error'); }
function safeClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? {})); }
  catch (_) { return { unserializable: true, summary: String(value).slice(0, 1000) }; }
}
function report(kind, type, error, extra={}) {
  const payload = {
    build: BUILD,
    kind,
    type: String(type || 'unknown'),
    at: new Date().toISOString(),
    message: error?.message || String(error),
    stack: asText(error),
    extra: safeClone(extra)
  };
  try { window.SVR_RUNTIME_CRASH_SHIELD?.record?.('safe_event_bus', error, payload); } catch (_) {}
  try { window.SVR_EVENT_FIREWALL?.recordError?.('safe_event_bus', payload.message, payload); } catch (_) {}
  try { window.SVR_ENTERPRISE_BRIDGE?.queue?.('safe_event_bus', payload); } catch (_) {}
  try { ORIGINAL_DISPATCH.call(window, new CustomEvent('svr_safe_event_bus_error', { detail: payload })); } catch (_) {}
  return payload;
}
function wrapListener(type, listener) {
  if (!isSvrEvent(type) || !listener) return listener;
  if (WRAP_MAP.has(listener)) return WRAP_MAP.get(listener);
  let wrapped;
  if (typeof listener === 'function') {
    wrapped = function(event) {
      try { return listener.call(this, event); }
      catch (error) { report('listener', type, error, { detail: safeClone(event?.detail) }); return undefined; }
    };
  } else if (typeof listener.handleEvent === 'function') {
    wrapped = { handleEvent(event) {
      try { return listener.handleEvent(event); }
      catch (error) { report('listener_object', type, error, { detail: safeClone(event?.detail) }); return undefined; }
    } };
  } else { return listener; }
  WRAP_MAP.set(listener, wrapped);
  return wrapped;
}
if (!window.__SVR_SAFE_EVENT_BUS_INSTALLED__) {
  window.__SVR_SAFE_EVENT_BUS_INSTALLED__ = true;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    return ORIGINAL_ADD.call(this, type, wrapListener(type, listener), options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    return ORIGINAL_REMOVE.call(this, type, WRAP_MAP.get(listener) || listener, options);
  };
}
const SafeEventBus = {
  build: BUILD,
  installed: true,
  dispatch(type, detail={}) {
    try { return ORIGINAL_DISPATCH.call(window, new CustomEvent(type, { detail: safeClone(detail) })); }
    catch (error) { report('dispatch', type, error, { detail }); return false; }
  },
  report,
  isSvrEvent
};
window.SVR_SAFE_EVENT_BUS = SafeEventBus;
try { ORIGINAL_DISPATCH.call(window, new CustomEvent('svr_safe_event_bus_ready', { detail: { build: BUILD } })); } catch (_) {}
export default SafeEventBus;
