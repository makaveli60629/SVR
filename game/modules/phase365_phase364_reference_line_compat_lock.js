export const BUILD = 'PHASE-365-PHASE364-REFERENCE-LINE-COMPAT-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const TARGET = Object.freeze({ length: 2.74, height: 0.80, depth: 1.46 });
const LINE_TOLERANCE = 0.01;
const SIZE_TOLERANCE = 0.09;

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  adaptations: 0,
  originalTablePasses: 0,
  visibleLinePasses: 0,
  lastResult: null,
  installedAt: null,
  checkedAt: null
};

let originalQa = null;
let installTimer = 0;

function dimensionsPass(measured) {
  return Boolean(measured
    && Math.abs(Number(measured.size?.x || 0) - TARGET.length) <= SIZE_TOLERANCE
    && Math.abs(Number(measured.size?.y || 0) - TARGET.height) <= SIZE_TOLERANCE
    && Math.abs(Number(measured.size?.z || 0) - TARGET.depth) <= SIZE_TOLERANCE);
}

function referenceLinePass(measured) {
  const alignment = window.SVR_PHASE365_TABLE_ALIGNMENT;
  const lineY = Number(alignment?.referenceLineY);
  return Boolean(
    dimensionsPass(measured)
    && alignment?.object
    && Number.isFinite(lineY)
    && Math.abs(lineY) <= LINE_TOLERANCE
    && Math.abs(Number(alignment?.lineOffset || 0.065) - 0.065) <= 0.002
  );
}

function adapt() {
  const base = originalQa?.();
  if (!base || typeof base !== 'object') return base;
  const visibleLinePass = referenceLinePass(base.measuredTable);
  const originalTablePass = base.tablePass === true;
  const tablePass = originalTablePass || visibleLinePass;
  if (originalTablePass) state.originalTablePasses += 1;
  if (visibleLinePass) state.visibleLinePasses += 1;
  state.adaptations += 1;
  state.checkedAt = new Date().toISOString();

  const result = {
    ...base,
    tablePass,
    phase365ReferenceLinePass: visibleLinePass,
    phase365ReferenceLineY: window.SVR_PHASE365_TABLE_ALIGNMENT?.referenceLineY ?? null,
    phase365ReferenceLineOffset: window.SVR_PHASE365_TABLE_ALIGNMENT?.lineOffset ?? 0.065,
    phase365GeometrySuccessor: visibleLinePass ? BUILD : null,
    pass: Boolean(
      ACTIVE
      && tablePass
      && base.floorAuthority
      && !base.lastError
    )
  };
  state.lastResult = result;
  window.SVR_PHASE364_QA_STATE = result;
  window.SVR_PHASE365_PHASE364_COMPAT_STATE = { ...state };
  return result;
}

function install() {
  if (!ACTIVE || state.installed) return state.installed;
  const candidate = window.SVR_PHASE364_QA;
  if (typeof candidate !== 'function') return false;
  if (candidate.__svrPhase365ReferenceLineCompat) {
    state.installed = true;
    return true;
  }
  originalQa = candidate;
  adapt.__svrPhase365ReferenceLineCompat = true;
  adapt.__svrPhase365OriginalQa = candidate;
  window.SVR_PHASE364_QA = adapt;
  window.SVR_PHASE365_PHASE364_COMPAT_QA = () => {
    const result = adapt();
    return {
      ...state,
      tablePass: result?.tablePass === true,
      originalTablePass: result?.tablePass === true && result?.phase365ReferenceLinePass !== true,
      visibleLinePass: result?.phase365ReferenceLinePass === true,
      referenceLineY: result?.phase365ReferenceLineY ?? null,
      pass: Boolean(result?.tablePass),
      checkedAt: new Date().toISOString()
    };
  };
  state.installed = true;
  state.installedAt = new Date().toISOString();
  adapt();
  return true;
}

function schedule() {
  clearInterval(installTimer);
  let attempts = 0;
  installTimer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 120) clearInterval(installTimer);
  }, 80);
}

if (ACTIVE) {
  window.addEventListener('svr:platform-ready', schedule);
  window.addEventListener('svr:phase365-state', () => {
    if (!state.installed) schedule();
    else adapt();
  });
  schedule();
}
