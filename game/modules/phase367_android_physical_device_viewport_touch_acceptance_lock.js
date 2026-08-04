export const BUILD = 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  calibrated: false,
  seated: false,
  orientation: screen.orientation?.type || (innerWidth > innerHeight ? 'landscape' : 'portrait'),
  viewportWidth: 0,
  viewportHeight: 0,
  viewportScale: 1,
  offsetLeft: 0,
  offsetTop: 0,
  viewportUpdates: 0,
  orientationUpdates: 0,
  stabilizationRequests: 0,
  stabilizationApplied: 0,
  stabilizationSkipped: 0,
  pointerEvents: 0,
  moveTouches: 0,
  lookTouches: 0,
  actionTouches: 0,
  controllerRoots: 0,
  moveControls: 0,
  lookControls: 0,
  actionPanels: 0,
  visibleNavigationWhileSeated: 0,
  safeAreaReady: false,
  lastReason: 'boot',
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let lastViewport = {
  width: 0,
  height: 0,
  scale: 1,
  offsetLeft: 0,
  offsetTop: 0,
  orientation: runtime.orientation
};
let viewportTimer = 0;
let stabilizeTimer = 0;
let auditTimer = 0;
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
  const width = Math.max(1, Math.round(viewport?.width || innerWidth || document.documentElement.clientWidth || 1));
  const height = Math.max(1, Math.round(viewport?.height || innerHeight || document.documentElement.clientHeight || 1));
  return {
    width,
    height,
    scale: Number(viewport?.scale || 1),
    offsetLeft: Number(viewport?.offsetLeft || 0),
    offsetTop: Number(viewport?.offsetTop || 0),
    orientation: screen.orientation?.type || (width > height ? 'landscape-primary' : 'portrait-primary')
  };
}

function installStyle() {
  if ($('#svr367-device-style')) return;
  const style = document.createElement('style');
  style.id = 'svr367-device-style';
  style.textContent = `
:root{
  --svr367-vw:100vw;
  --svr367-vh:100vh;
  --svr367-offset-x:0px;
  --svr367-offset-y:0px;
  --svr367-ui-scale:1;
}
html,body,#app{
  width:var(--svr367-vw)!important;
  height:var(--svr367-vh)!important;
  max-width:var(--svr367-vw)!important;
  max-height:var(--svr367-vh)!important;
}
body.svr367-device-ready{
  overscroll-behavior:none;
  -webkit-text-size-adjust:100%;
}
body.svr367-seated #svr347Actions{
  max-height:calc(var(--svr367-vh) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px)!important;
}
body.svr367-seated #svr347Hole{
  bottom:max(12px,calc(env(safe-area-inset-bottom) + 8px))!important;
  left:max(12px,calc(env(safe-area-inset-left) + 8px))!important;
}
body.svr367-seated #svr363Bankroll{
  top:max(10px,calc(env(safe-area-inset-top) + 6px))!important;
  right:max(10px,calc(env(safe-area-inset-right) + 6px))!important;
}
body.svr367-seated #svr357TurnPanel{
  top:max(50px,calc(env(safe-area-inset-top) + 42px))!important;
}
body.svr367-seated #svr365BrandSlot{
  left:max(6px,env(safe-area-inset-left))!important;
  top:max(6px,env(safe-area-inset-top))!important;
  transform:scale(.92);
  transform-origin:top left;
}
body.svr367-seated #svr347Actions button,
body.svr367-seated #svr363JoinControl,
body.svr367-seated #svr357Ante{
  min-height:44px;
  touch-action:manipulation;
}
@media(max-height:430px) and (orientation:landscape){
  body.svr367-seated #svr347Actions{
    width:min(40vw,286px)!important;
    right:max(8px,env(safe-area-inset-right))!important;
  }
  body.svr367-seated #svr347Hole{
    transform:scale(.9)!important;
    transform-origin:bottom left;
  }
  body.svr367-seated #svr363Bankroll{
    transform:scale(.88);
    transform-origin:top right;
  }
}
`;
  document.head.appendChild(style);
}

function visible(element) {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number(style.opacity || 1) > 0.02
    && rect.width > 1
    && rect.height > 1;
}

function auditDom() {
  runtime.controllerRoots = $$('#svr347Root').length;
  runtime.moveControls = $$('#svr347Move').length;
  runtime.lookControls = $$('#svr347Look').length;
  runtime.actionPanels = $$('#svr347Actions').length;
  const navigation = $$('button,a').filter((element) => /^(LOBBY|CENTER|CENTER VIEW)$/i.test((element.textContent || '').trim()));
  runtime.visibleNavigationWhileSeated = runtime.seated ? navigation.filter(visible).length : 0;
  return runtime;
}

function publish(reason = 'sync') {
  runtime.checkedAt = new Date().toISOString();
  runtime.lastReason = reason;
  auditDom();
  window.SVR_PHASE367_DEVICE_STATE = { ...runtime };
  window.dispatchEvent(new CustomEvent('svr:phase367-device-state', { detail: { ...runtime } }));
  return runtime;
}

function requestStabilization(reason = 'manual') {
  runtime.stabilizationRequests += 1;
  if (stabilizeTimer) {
    clearTimeout(stabilizeTimer);
    runtime.stabilizationSkipped += 1;
  }
  stabilizeTimer = window.setTimeout(() => {
    stabilizeTimer = 0;
    if (!isSeated()) {
      runtime.stabilizationSkipped += 1;
      publish(`skip-unseated:${reason}`);
      return;
    }
    const now = performance.now();
    if (now - lastStabilizedAt < 900) {
      runtime.stabilizationSkipped += 1;
      publish(`skip-rate-limit:${reason}`);
      return;
    }
    lastStabilizedAt = now;
    try {
      window.SVR_PHASE365_SYNC?.();
      window.SVR_PHASE365_STABILIZE_SEAT?.();
      runtime.stabilizationApplied += 1;
      runtime.lastError = null;
    } catch (error) {
      runtime.lastError = String(error?.message || error);
    }
    publish(`stabilized:${reason}`);
  }, 220);
}

function applyViewport(reason = 'viewport') {
  if (!ACTIVE) return false;
  const next = viewportSnapshot();
  const root = document.documentElement;
  root.style.setProperty('--svr367-vw', `${next.width}px`);
  root.style.setProperty('--svr367-vh', `${next.height}px`);
  root.style.setProperty('--svr367-offset-x', `${next.offsetLeft}px`);
  root.style.setProperty('--svr367-offset-y', `${next.offsetTop}px`);
  root.style.setProperty('--svr367-ui-scale', String(Math.max(0.82, Math.min(1.08, next.width / 412))));

  const orientationChanged = next.orientation !== lastViewport.orientation;
  const materialWidthChange = Math.abs(next.width - lastViewport.width) > 72;
  const materialHeightChange = Math.abs(next.height - lastViewport.height) > 72;
  const offsetChanged = Math.abs(next.offsetLeft - lastViewport.offsetLeft) > 8
    || Math.abs(next.offsetTop - lastViewport.offsetTop) > 8;

  runtime.viewportWidth = next.width;
  runtime.viewportHeight = next.height;
  runtime.viewportScale = next.scale;
  runtime.offsetLeft = next.offsetLeft;
  runtime.offsetTop = next.offsetTop;
  runtime.orientation = next.orientation;
  runtime.viewportUpdates += 1;
  runtime.lastReason = reason;
  runtime.safeAreaReady = true;
  if (orientationChanged) runtime.orientationUpdates += 1;

  lastViewport = next;
  document.body.classList.add('svr367-device-ready');
  runtime.calibrated = true;

  if (isSeated() && (orientationChanged || materialWidthChange || materialHeightChange || offsetChanged)) {
    requestStabilization(`viewport:${reason}`);
  }
  publish(reason);
  return true;
}

function syncSeatedState(reason = 'state') {
  const next = isSeated();
  const changed = next !== runtime.seated;
  runtime.seated = next;
  document.body.classList.toggle('svr367-seated', runtime.seated);
  if (runtime.seated && changed) {
    window.SVR_PHASE365_SYNC?.();
    requestStabilization(reason);
  }
  publish(reason);
}

function classifyTouch(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  runtime.pointerEvents += 1;
  if (target.closest('#svr347Move')) runtime.moveTouches += 1;
  else if (target.closest('#svr347Look')) runtime.lookTouches += 1;
  else if (target.closest('#svr347Actions,#svr363JoinControl,#svr357Ante,#svr347Raise')) runtime.actionTouches += 1;
  publish('pointerdown');
}

function qa() {
  syncSeatedState('qa');
  const phase365 = window.SVR_PHASE365_QA?.() || window.SVR_PHASE365_STATE || null;
  const result = {
    ...runtime,
    phase365,
    singleController: runtime.controllerRoots === 1
      && runtime.moveControls === 1
      && runtime.lookControls === 1
      && runtime.actionPanels === 1,
    seatedNavigationClean: !runtime.seated || runtime.visibleNavigationWhileSeated === 0,
    pass: Boolean(
      runtime.active
      && runtime.calibrated
      && runtime.safeAreaReady
      && runtime.controllerRoots === 1
      && runtime.moveControls === 1
      && runtime.lookControls === 1
      && runtime.actionPanels === 1
      && (!runtime.seated || runtime.visibleNavigationWhileSeated === 0)
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE367_DEVICE_QA_STATE = result;
  return result;
}

function scheduleViewport(reason, delay = 140) {
  clearTimeout(viewportTimer);
  viewportTimer = window.setTimeout(() => applyViewport(reason), delay);
}

function scheduleAudit(reason = 'dom-mutation') {
  clearTimeout(auditTimer);
  auditTimer = window.setTimeout(() => syncSeatedState(reason), 100);
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  installStyle();
  applyViewport('install');
  document.addEventListener('pointerdown', classifyTouch, true);

  window.visualViewport?.addEventListener('resize', () => scheduleViewport('visual-viewport-resize', 120));
  window.visualViewport?.addEventListener('scroll', () => scheduleViewport('visual-viewport-scroll', 80));
  window.addEventListener('orientationchange', () => scheduleViewport('orientationchange', 260));
  window.addEventListener('resize', () => scheduleViewport('window-resize', 140), { passive: true });
  window.addEventListener('svr:phase363-immediate-join-state', () => window.setTimeout(() => syncSeatedState('join-event'), 0));
  window.addEventListener('svr:phase365-state', () => syncSeatedState('phase365-state'));

  observer = new MutationObserver(() => scheduleAudit());
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden']
  });

  window.setTimeout(() => syncSeatedState('post-boot'), 900);
  window.setTimeout(() => applyViewport('post-boot'), 1300);
  publish('installed');
}

window.SVR_PHASE367_DEVICE_QA = qa;
window.SVR_PHASE367_DEVICE_CALIBRATE = () => applyViewport('manual');
window.SVR_PHASE367_DEVICE_STABILIZE = () => requestStabilization('manual');
window.SVR_PHASE367_DEVICE_STATE = { ...runtime };

install();
