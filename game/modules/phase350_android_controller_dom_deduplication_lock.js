const BUILD = 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''))
  || /\/game\/android\.html$/i.test(location.pathname);
const AUTHORITY_ID = 'svr347Root';
const LEGACY_SELECTORS = [
  '#svr326Root', '#svr343Hud', '#svr344ActionToast', '#svrAndroidGamePad', '#svrTapMovePanel',
  '#svrAndroidSafeBadge153', '#svrAndroidLiteHud', '#svrAndroidRecoverView', '#svrAndroidControls',
  '#svrMobileControls', '#svrTouchControls', '#androidControls', '#mobileControls',
  '[id^="svr324"]', '[id^="svr325"]', '[id^="svr329"]', '[id^="svr330"]',
  '[id^="phase324"]', '[id^="phase325"]', '[id^="phase329"]', '[id^="phase330"]',
  '[data-svr-controller-authority]:not([data-svr-controller-authority="phase347"])'
].join(',');
const LEGACY_STYLE_IDS = [
  'svr326-style', 'svr343-style', 'svr344-style', 'svr324-style', 'svr325-style', 'svr329-style', 'svr330-style',
  'android-controls-style', 'svr-android-controls-style', 'svr-mobile-controls-style'
];
let installed = false;
let observer = null;
let scheduled = false;
let sweeps = 0;
let removedRoots = 0;
let removedSticks = 0;
let removedStyles = 0;
let duplicateAuthorityRoots = 0;
let lastError = null;

function removeNode(node, type = 'root') {
  if (!node || node.id === AUTHORITY_ID || node.closest?.(`#${AUTHORITY_ID}`)) return false;
  node.remove?.();
  if (type === 'stick') removedSticks += 1;
  else removedRoots += 1;
  return true;
}
function sweep() {
  if (!ACTIVE) return;
  scheduled = false;
  sweeps += 1;
  try {
    const authorities = [...document.querySelectorAll(`#${AUTHORITY_ID}`)];
    const authority = authorities.shift() || null;
    for (const duplicate of authorities) {
      duplicate.remove();
      duplicateAuthorityRoots += 1;
    }
    for (const node of document.querySelectorAll(LEGACY_SELECTORS)) removeNode(node);
    for (const node of document.querySelectorAll('.svr-stick,.svr326Stick,.android-stick,.mobile-stick,.virtual-joystick')) {
      if (!node.closest?.(`#${AUTHORITY_ID}`)) removeNode(node, 'stick');
    }
    for (const id of LEGACY_STYLE_IDS) {
      const style = document.getElementById(id);
      if (style) { style.remove(); removedStyles += 1; }
    }
    if (authority) {
      authority.dataset.svrControllerAuthority = 'phase347';
      authority.style.display = '';
      authority.style.visibility = 'visible';
      authority.style.opacity = '1';
      authority.style.pointerEvents = 'none';
      const move = authority.querySelector('#svr347Move');
      const look = authority.querySelector('#svr347Look');
      if (move) move.style.pointerEvents = 'auto';
      if (look) look.style.pointerEvents = 'auto';
    }
    document.body.classList.add('svr350-controller-deduplicated');
    lastError = null;
  } catch (error) { lastError = String(error?.message || error); }
  window.SVR_PHASE350_ANDROID_CONTROLLER_STATE = snapshot();
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(sweep);
}
function snapshot() {
  const authorities = [...document.querySelectorAll(`#${AUTHORITY_ID}`)];
  const authority = authorities[0] || null;
  const visibleLegacy = [...document.querySelectorAll(LEGACY_SELECTORS)].filter((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  });
  const externalSticks = [...document.querySelectorAll('.svr-stick,.svr326Stick,.android-stick,.mobile-stick,.virtual-joystick')]
    .filter((node) => !node.closest?.(`#${AUTHORITY_ID}`));
  return {
    build: BUILD,
    active: ACTIVE,
    authorityRoots: authorities.length,
    moveControls: authority?.querySelectorAll?.('#svr347Move')?.length || 0,
    lookControls: authority?.querySelectorAll?.('#svr347Look')?.length || 0,
    actionPanels: authority?.querySelectorAll?.('#svr347Actions')?.length || 0,
    visibleLegacyRoots: visibleLegacy.length,
    externalSticks: externalSticks.length,
    sweeps,
    removedRoots,
    removedSticks,
    removedStyles,
    duplicateAuthorityRoots,
    lastError,
    checkedAt: new Date().toISOString()
  };
}
function qa() {
  sweep();
  const result = snapshot();
  result.pass = ACTIVE
    && result.authorityRoots === 1
    && result.moveControls === 1
    && result.lookControls === 1
    && result.actionPanels === 1
    && result.visibleLegacyRoots === 0
    && result.externalSticks === 0;
  window.SVR_PHASE350_ANDROID_CONTROLLER_QA_STATE = result;
  return result;
}
function install() {
  if (!ACTIVE || installed) return;
  installed = true;
  [0, 150, 500, 1200, 2600, 5000].forEach((delay) => setTimeout(sweep, delay));
  observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(sweep, 1800);
  window.SVR_PHASE350_ANDROID_CONTROLLER_QA = qa;
  window.SVR_PHASE350_ANDROID_CONTROLLER_SWEEP = () => { sweep(); return snapshot(); };
}
install();
