export const BUILD = 'PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  calibrated: false,
  seated: false,
  orientation: screen.orientation?.type || (innerWidth > innerHeight ? 'landscape' : 'portrait'),
  viewportWidth: 0,
  viewportHeight: 0,
  viewportScale: 1,
  viewportUpdates: 0,
  orientationUpdates: 0,
  stabilizationRequests: 0,
  stabilizationApplied: 0,
  pointerEvents: 0,
  moveTouches: 0,
  lookTouches: 0,
  actionTouches: 0,
  controllerRoots: 0,
  moveControls: 0,
  lookControls: 0,
  visibleNavigationWhileSeated: 0,
  lastReason: 'boot',
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let lastViewport = { width: 0, height: 0, orientation: runtime.orientation };
let viewportTimer = 0;
let stabilizeTimer = 0;
let lastStabilizedAt = 0;
let observer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function isSeated() {
  return Boolean(
    window.SVR_PHASE363_STATE?.joined
    || window.SVR_PHASE347_STATE?.seated
    || document.body.classList.contains('svr363-seated')
    || document.body.classList.contains('svr365-seated')
  );
}

function viewportSnapshot() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.round(viewport?.width || innerWidth || document.documentElement.clientWidth || 1)),
    height: Math.max(1, Math.round(viewport?.height || innerHeight || document.documentElement.clientHeight || 1)),
    scale: Number(viewport?.scale || 1),
    offsetLeft: Number(viewport?.offsetLeft || 0),
    offsetTop: Number(viewport?.offsetTop || 0),
    orientation: screen.orientation?.type || ((viewport?.width || innerWidth) > (viewport?.height || innerHeight) ? 'landscape' : 'portrait')
  };
}

function installStyle() {
  if ($('#svr366-device-style')) return;
  const style = document.createElement('style');
  style.id = 'svr366-device-style';
  style.textContent = `
:root{--svr366-vw:100vw;--svr366-vh:100vh;--svr366-offset-x:0px;--svr366-offset-y:0px;--svr366-ui-scale:1}
html,body,#app{width:var(--svr366-vw)!important;height:var(--svr366-vh)!important;max-height:var(--svr366-vh)!important}
body.svr366-device-ready{overscroll-behavior:none;-webkit-text-size-adjust:100%}
body.svr366-seated #svr347Actions{max-height:calc(var(--svr366-vh) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)!important}
body.svr366-seated #svr347Hole{bottom:max(12px,calc(env(safe-area-inset-bottom) + 8px))!important}
body.svr366-seated #svr363Bankroll{top:max(12px,calc(env(safe-area-inset-top) + 8px))!important;right:max(10px,calc(env(safe-area-inset-right) + 8px))!important}
body.svr366-seated #svr357TurnPanel{top:max(52px,calc(env(safe-area-inset-top) + 44px))!important}
body.svr366-seated #svr365BrandSlot{left:max(6px,env(safe-area-inset-left))!important;top:max(6px,env(safe-area-inset-top))!important;transform:scale(.92);transform-origin:top left}
body.svr366-seated #svr347Actions button{min-height:44px;touch-action:manipulation}
@media(max-height:430px) and (orientation:landscape){body.svr366-seated #svr347Actions{width:min(40vw,286px)!important;right:max(8px,env(safe-area-inset-right))!important}body.svr366-seated #svr347Hole{transform:scale(.9)!important;transform-origin:bottom left}body.svr366-seated #svr363Bankroll{transform:scale(.88);transform-origin:top right}}
`;
  document.head.appendChild(style);
}

function applyViewport(reason = 'viewport') {
  if (!ACTIVE) return false;
  const next = viewportSnapshot();
  const root = document.documentElement;
  root.style.setProperty('--svr366-vw', `${next.width}px`);
  root.style.setProperty('--svr366-vh', `${next.height}px`);
  root.style.setProperty('--svr366-offset-x', `${next.offsetLeft}px`);
  root.style.setProperty('--svr366-offset-y', `${next.offsetTop}px`);
  root.style.setProperty('--svr366-ui-scale', String(Math.max(.82, Math.min(1.08, next.width / 412))));

  const orientationChanged = next.orientation !== lastViewport.orientation;
  const materialHeightChange = Math.abs(next.height - lastViewport.height) > 72;
  runtime.viewportWidth = next.width;
  runtime.viewportHeight = next.height;
  runtime.viewportScale = next.scale;
  runtime.orientation = next.orientation;
  runtime.viewportUpdates += 1;
  runtime.lastReason = reason;
  if (orientationChanged) runtime.orientationUpdates += 1;
  lastViewport = next;
  document.body.classList.add('svr366-device-ready');
  runtime.calibrated = true;

  if (isSeated() && (orientationChanged || materialHeightChange)) requestStabilization(`viewport:${reason}`);
  publish(reason);
  return true;
}

function requestStabilization(reason = 'manual') {
  runtime.stabilizationRequests += 1;
  clearTimeout(stabilizeTimer);
  stabilizeTimer = window.setTimeout(() => {
    if (!isSeated()) return;
    const now = performance.now();
    if (now - lastStabilizedAt < 900) return;
    lastStabilizedAt = now;
    try {
      window.SVR_PHASE365_SYNC?.();
      window.SVR_PHASE365_STABILIZE_SEAT?.();
      runtime.stabilizationApplied += 1;
      runtime.lastReason = reason;
    } catch (error) {
      runtime.lastError = String(error?.message || error);
    }
    publish(reason);
  }, 220);
}

function syncSeatedState(reason = 'state') {
  runtime.seated = isSeated();
  document.body.classList.toggle('svr366-seated', runtime.seated);
  if (runtime.seated) {
    window.SVR_PHASE365_SYNC?.();
    requestStabilization(reason);
  }
  auditDom();
  publish(reason);
}

function visible(element) {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > .02 && rect.width > 1 && rect.height > 1;
}

function auditDom() {
  runtime.controllerRoots = $$('#svr347AndroidController').length;
  runtime.moveControls = $$('#svr347Move').length;
  runtime.lookControls = $$('#svr347Look').length;
  const navigation = $$('button,a').filter((element) => /^(LOBBY|CENTER|CENTER VIEW)$/i.test((element.textContent || '').trim()));
  runtime.visibleNavigationWhileSeated = runtime.seated ? navigation.filter(visible).length : 0;
  return runtime;
}

function classifyTouch(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  runtime.pointerEvents += 1;
  if (target.closest('#svr347Move')) runtime.moveTouches += 1;
  else if (target.closest('#svr347Look')) runtime.lookTouches += 1;
  else if (target.closest('#svr347Actions,#svr363JoinControl,#svr357Ante')) runtime.actionTouches += 1;
}

function publish(reason = 'sync') {
  runtime.checkedAt = new Date().toISOString();
  runtime.lastReason = reason;
  window.SVR_PHASE366_DEVICE_STATE = { ...runtime };
  window.dispatchEvent(new CustomEvent('svr:phase366-device-state', { detail: { ...runtime } }));
  return runtime;
}

function qa() {
  syncSeatedState('qa');
  const phase365 = window.SVR_PHASE365_QA?.() || window.SVR_PHASE365_STATE || null;
  const result = {
    ...runtime,
    phase365,
    singleController: runtime.controllerRoots === 1 && runtime.moveControls === 1 && runtime.lookControls === 1,
    seatedNavigationClean: !runtime.seated || runtime.visibleNavigationWhileSeated === 0,
    pass: Boolean(runtime.active && runtime.calibrated
      && runtime.controllerRoots === 1
      && runtime.moveControls === 1
      && runtime.lookControls === 1
      && (!runtime.seated || runtime.visibleNavigationWhileSeated === 0)),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE366_DEVICE_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || runtime.installedAt) return;
  installStyle();
  runtime.installedAt = new Date().toISOString();
  applyViewport('install');
  document.addEventListener('pointerdown', classifyTouch, true);
  window.visualViewport?.addEventListener('resize', () => {
    clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => applyViewport('visual-viewport-resize'), 120);
  });
  window.visualViewport?.addEventListener('scroll', () => applyViewport('visual-viewport-scroll'));
  window.addEventListener('orientationchange', () => {
    clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => applyViewport('orientationchange'), 260);
  });
  window.addEventListener('resize', () => {
    clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => applyViewport('window-resize'), 140);
  });
  window.addEventListener('svr:phase363-immediate-join-state', () => window.setTimeout(() => syncSeatedState('join-event'), 0));
  window.addEventListener('svr:phase365-state', () => syncSeatedState('phase365-state'));
  observer = new MutationObserver(() => {
    clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => syncSeatedState('dom-mutation'), 80);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  window.setTimeout(() => syncSeatedState('post-boot'), 900);
  publish('installed');
}

window.SVR_PHASE366_DEVICE_QA = qa;
window.SVR_PHASE366_DEVICE_CALIBRATE = () => applyViewport('manual');
window.SVR_PHASE366_DEVICE_STABILIZE = () => requestStabilization('manual');
window.SVR_PHASE366_DEVICE_STATE = { ...runtime };

install();
