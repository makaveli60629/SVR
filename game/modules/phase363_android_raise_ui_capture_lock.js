export const BUILD = 'PHASE-363-ANDROID-RAISE-UI-CAPTURE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  opens: 0,
  confirms: 0,
  closes: 0,
  duplicateEventsBlocked: 0,
  lastKey: null,
  lastAt: 0,
  lastAccepted: null,
  installedAt: null
};

function closePanel() {
  document.getElementById('svr347Raise')?.classList.remove('open');
  document.body.classList.remove('svr347-raise-open');
}

function actionKey(event) {
  if (event.target?.closest?.('#svr347Actions [data-ui="raise"]')) return 'open';
  if (event.target?.closest?.('#svr347RaiseConfirm')) return 'confirm';
  if (event.target?.closest?.('#svr347RaiseClose')) return 'close';
  return null;
}

function activate(event, source) {
  const key = actionKey(event);
  if (!key) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  const now = performance.now();
  if (key === runtime.lastKey && now - runtime.lastAt < 500) {
    runtime.duplicateEventsBlocked += 1;
    return true;
  }
  runtime.lastKey = key;
  runtime.lastAt = now;

  if (key === 'close') {
    runtime.closes += 1;
    closePanel();
    return true;
  }

  if (key === 'open') {
    runtime.opens += 1;
    window.SVR_PHASE363_CONFIGURE_RAISE?.();
    return true;
  }

  runtime.confirms += 1;
  const slider = document.getElementById('svr347RaiseSlider');
  const target = Number(slider?.value || window.SVR_ANDROID_RAISE_AMOUNT || 0);
  runtime.lastAccepted = window.SVR_PHASE363_RAISE_TO?.(target) !== false;
  if (runtime.lastAccepted) closePanel();
  window.SVR_PHASE363_RAISE_UI_CAPTURE_STATE = { ...runtime, source, target };
  return true;
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  window.addEventListener('pointerdown', (event) => activate(event, 'pointerdown'), true);
  window.addEventListener('click', (event) => activate(event, 'click'), true);
  window.SVR_PHASE363_RAISE_UI_CAPTURE_STATE = runtime;
  window.SVR_PHASE363_RAISE_UI_CAPTURE_QA = () => ({
    ...runtime,
    panelPresent: Boolean(document.getElementById('svr347Raise')),
    raiseButtonPresent: Boolean(document.querySelector('#svr347Actions [data-ui="raise"]')),
    pass: Boolean(document.getElementById('svr347Raise') && document.querySelector('#svr347Actions [data-ui="raise"]')),
    checkedAt: new Date().toISOString()
  });
}

install();
