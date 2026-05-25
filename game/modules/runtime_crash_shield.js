/**
 * SVR Poker — Runtime Crash Shield
 * Build: PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK
 * Purpose: keep render/game loop alive, capture runtime errors, and prevent bridge/listener crashes from freezing the game.
 */
const BUILD = 'PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK';
const KNOWN_RECOVERABLE = [
  /record[A-Za-z0-9_]+ is not a function/i,
  /SVR_ENTERPRISE_BRIDGE/i,
  /enterprise_bridge/i,
  /bridge_proxy/i,
  /svr_poker_/i,
  /svr_watch_/i,
  /Cannot read properties of undefined/i,
];

function stackOf(error){
  return String(error?.stack || error?.message || error || 'unknown runtime error');
}
function isKnownRecoverable(error){
  const stack = stackOf(error);
  return KNOWN_RECOVERABLE.some(rx => rx.test(stack));
}
function safeClone(value){
  try { return JSON.parse(JSON.stringify(value ?? {})); }
  catch (_) { return { unserializable: true, summary: String(value).slice(0, 1200) }; }
}

const state = window.__SVR_RUNTIME_CRASH_SHIELD_STATE || {
  build: BUILD,
  installedAt: new Date().toISOString(),
  animationErrors: [],
  globalErrors: [],
  recovered: 0,
  fatal: 0,
  lastStatusAt: 0,
};
window.__SVR_RUNTIME_CRASH_SHIELD_STATE = state;

function pushLimited(list, item, limit = 60){
  list.push(item);
  while (list.length > limit) list.shift();
}
function emit(type, payload){
  try { window.dispatchEvent(new CustomEvent(type, { detail: safeClone(payload) })); } catch (_) {}
}
function setStatus(text){
  const now = performance.now ? performance.now() : Date.now();
  if (now - state.lastStatusAt < 1000) return;
  state.lastStatusAt = now;
  try {
    const el = document.getElementById('status');
    if (el) el.textContent = text;
  } catch (_) {}
}

const Shield = {
  build: BUILD,
  state,
  isKnownRecoverable,
  report(){
    return {
      build: BUILD,
      at: new Date().toISOString(),
      recovered: state.recovered,
      fatal: state.fatal,
      animationErrors: state.animationErrors.slice(-10),
      globalErrors: state.globalErrors.slice(-10),
    };
  },
  record(source, error, extra = {}){
    const stack = stackOf(error);
    const event = {
      build: BUILD,
      source,
      at: new Date().toISOString(),
      message: error?.message || String(error),
      stack,
      recoverable: isKnownRecoverable(error),
      extra: safeClone(extra),
    };
    if (source === 'animation_loop') pushLimited(state.animationErrors, event);
    else pushLimited(state.globalErrors, event);
    emit('svr_runtime_crash_shield_update', event);
    try { window.SVR_EVENT_FIREWALL?.recordError?.('runtime_crash_shield', event.message, event); } catch (_) {}
    try { window.SVR_ENTERPRISE_BRIDGE?.queue?.('runtime_crash_shield', event); } catch (_) {}
    return event;
  },
  handleAnimationError(error, extra = {}){
    const event = this.record('animation_loop', error, extra);
    state.recovered++;
    setStatus(event.recoverable ? 'Runtime recovered from safe event error' : 'Runtime shield caught error — continuing');
    return true; // keep render loop alive; full details are in report/export tools
  },
  handleGlobalError(error, source = 'global'){
    const event = this.record(source, error);
    if (event.recoverable) {
      state.recovered++;
      setStatus('Runtime recovered from bridge/event error');
      return true;
    }
    state.fatal++;
    return false;
  },
  clear(){
    state.animationErrors.length = 0;
    state.globalErrors.length = 0;
    state.recovered = 0;
    state.fatal = 0;
    emit('svr_runtime_crash_shield_update', this.report());
  }
};

window.SVR_RUNTIME_CRASH_SHIELD = Shield;

window.addEventListener('error', (event) => {
  const err = event?.error || event?.message || 'window error';
  if (Shield.handleGlobalError(err, 'window_error')) {
    try { event.preventDefault(); event.stopImmediatePropagation(); } catch (_) {}
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const err = event?.reason || 'unhandled promise rejection';
  if (Shield.handleGlobalError(err, 'unhandledrejection')) {
    try { event.preventDefault(); event.stopImmediatePropagation(); } catch (_) {}
    return false;
  }
}, true);

emit('svr_runtime_crash_shield_ready', Shield.report());
export default Shield;
