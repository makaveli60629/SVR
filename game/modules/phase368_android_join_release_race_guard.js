export const BUILD = 'PHASE-368-ANDROID-JOIN-RELEASE-RACE-GUARD';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  controlsSanitized: 0,
  legacyTargetListenersRemoved: false,
  authorityCapturePresent: false,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let observer = null;
let timer = 0;

function seatControl() {
  return document.querySelector('#svr347Actions [data-ui="seat"]');
}

function sanitize() {
  if (!ACTIVE) return false;
  const seat = seatControl();
  if (!seat) return false;
  if (seat.dataset.phase368RaceGuard === '1') {
    runtime.authorityCapturePresent = typeof window.SVR_PHASE363_TOGGLE_JOIN === 'function';
    return true;
  }

  try {
    const replacement = seat.cloneNode(true);
    replacement.dataset.phase368RaceGuard = '1';
    replacement.dataset.phase363Bound = '1';
    replacement.removeAttribute('inert');
    replacement.hidden = false;
    replacement.removeAttribute('aria-hidden');
    seat.replaceWith(replacement);
    runtime.controlsSanitized += 1;
    runtime.legacyTargetListenersRemoved = true;
    runtime.authorityCapturePresent = typeof window.SVR_PHASE363_TOGGLE_JOIN === 'function';
    runtime.checkedAt = new Date().toISOString();
    window.SVR_PHASE368_JOIN_RELEASE_RACE_STATE = { ...runtime };
    return true;
  } catch (error) {
    runtime.lastError = String(error?.message || error);
    return false;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = window.setTimeout(sanitize, 45);
}

function qa() {
  sanitize();
  const seat = seatControl();
  const result = {
    ...runtime,
    seatPresent: Boolean(seat),
    sanitized: seat?.dataset.phase368RaceGuard === '1',
    legacyTargetBindingQuarantined: seat?.dataset.phase363Bound === '1',
    captureApi: typeof window.SVR_PHASE363_TOGGLE_JOIN === 'function',
    pass: Boolean(
      ACTIVE
      && seat
      && seat.dataset.phase368RaceGuard === '1'
      && seat.dataset.phase363Bound === '1'
      && typeof window.SVR_PHASE363_TOGGLE_JOIN === 'function'
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE368_JOIN_RELEASE_RACE_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  [0, 80, 220, 600, 1200].forEach((delay) => window.setTimeout(sanitize, delay));
  observer = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList' && record.addedNodes.length)) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.SVR_PHASE368_JOIN_RELEASE_RACE_QA = qa;
  window.SVR_PHASE368_JOIN_RELEASE_RACE_STATE = { ...runtime };
  window.dispatchEvent(new CustomEvent('svr:phase368-join-release-race-ready', {
    detail: { build: BUILD }
  }));
}

install();
