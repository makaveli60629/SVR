export const BUILD = 'PHASE-372-ANDROID-POINTER-CAPTURE-SAFETY-LOCK';

const ua = navigator.userAgent || '';
const ACTIVE = String(window.SVR_PLATFORM || document.body?.dataset?.platform || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(ua) && !/Quest|Oculus|Meta Quest/i.test(ua));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  successfulCaptures: 0,
  interruptedCapturesIgnored: 0,
  unexpectedErrors: 0,
  installedAt: null,
  checkedAt: null
};

function install() {
  if (!ACTIVE || state.installed) return false;
  const prototype = globalThis.Element?.prototype;
  const original = prototype?.setPointerCapture;
  if (typeof original !== 'function') return false;
  if (original.svrPhase372PointerCaptureSafety) {
    state.installed = true;
    state.installedAt = new Date().toISOString();
    return true;
  }

  const safeSetPointerCapture = function safeSetPointerCapture(pointerId) {
    try {
      const result = original.call(this, pointerId);
      state.successfulCaptures += 1;
      return result;
    } catch (error) {
      const message = String(error?.message || error || '');
      if (error?.name === 'NotFoundError' || /No active pointer with the given id|setPointerCapture/i.test(message)) {
        state.interruptedCapturesIgnored += 1;
        return false;
      }
      state.unexpectedErrors += 1;
      throw error;
    }
  };
  safeSetPointerCapture.svrPhase372PointerCaptureSafety = true;
  safeSetPointerCapture.svrPhase372Original = original;
  prototype.setPointerCapture = safeSetPointerCapture;

  state.installed = true;
  state.installedAt = new Date().toISOString();
  window.SVR_PHASE372_POINTER_CAPTURE_STATE = state;
  window.SVR_PHASE372_POINTER_CAPTURE_QA = () => {
    state.checkedAt = new Date().toISOString();
    return {
      ...state,
      wrapped: Boolean(Element.prototype.setPointerCapture?.svrPhase372PointerCaptureSafety),
      pass: state.installed && state.unexpectedErrors === 0,
      checkedAt: state.checkedAt
    };
  };
  window.dispatchEvent(new CustomEvent('svr:phase372-pointer-capture-safe', {
    detail: window.SVR_PHASE372_POINTER_CAPTURE_QA()
  }));
  return true;
}

install();