import { account } from './phase366-player-account-resilience.js?v=phase366';

const BUILD = 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK';
const stage = document.getElementById('profileShowroom');
const statusNode = document.getElementById('showroomStatus');
const retryButton = document.getElementById('showroomRetry');
const modePill = document.getElementById('modePill');
let attempts = 0;
let resolved = false;
let fallbackFinalized = false;
let lastError = null;
let timer = null;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function state351() {
  return window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || null;
}

function ensureLiveBadge() {
  if (!stage || document.getElementById('svr366LiveCameraBadge')) return;
  const badge = document.createElement('div');
  badge.id = 'svr366LiveCameraBadge';
  badge.textContent = '● LIVE AVATAR CAM';
  badge.setAttribute('aria-label', 'Live avatar camera status');
  badge.style.cssText = 'position:absolute;left:16px;top:16px;z-index:8;padding:8px 11px;border:1px solid rgba(127,252,255,.58);border-radius:999px;background:rgba(0,0,0,.62);backdrop-filter:blur(10px);color:#dffcff;font:900 11px Orbitron,system-ui;letter-spacing:.08em;box-shadow:0 0 22px rgba(127,252,255,.18);pointer-events:none';
  stage.appendChild(badge);
}

function ensureVrRoomButton() {
  const controls = stage?.querySelector('.showroom-controls');
  if (!controls || document.getElementById('svr366VrDressingRoom')) return;
  const link = document.createElement('a');
  link.id = 'svr366VrDressingRoom';
  link.className = 'btn ghost';
  link.href = '../game/avatar-vr.html?v=phase366';
  link.textContent = 'Open VR Dressing Room';
  controls.appendChild(link);
}

function paint(mode, message, retry = false) {
  if (statusNode) statusNode.textContent = message;
  if (retryButton) retryButton.hidden = !retry;
  stage?.classList.toggle('is-ready', mode === '3d-ready');
  stage?.classList.toggle('is-fallback', mode !== '3d-ready');
  if (modePill && mode === 'fallback-ready') modePill.textContent = 'FALLBACK CAM';
  const badge = document.getElementById('svr366LiveCameraBadge');
  if (badge) {
    badge.textContent = mode === '3d-ready' ? '● LIVE AVATAR CAM' : '● FALLBACK AVATAR CAM';
    badge.style.borderColor = mode === '3d-ready' ? 'rgba(127,252,255,.72)' : 'rgba(255,217,138,.72)';
    badge.style.color = mode === '3d-ready' ? '#dffcff' : '#ffe3a6';
  }
}

async function attemptRecovery(source = 'boot') {
  attempts += 1;
  lastError = null;
  ensureLiveBadge();
  ensureVrRoomButton();
  try {
    await account.bootstrap();
    if (!account.snapshot().profile) {
      paint('profile-required', 'Create or sign in to a profile to activate the avatar camera.', false);
      resolved = true;
      return snapshot(source);
    }

    const existing = state351();
    if (existing?.status === '3d-ready' || existing?.ready === true || existing?.viewer?.modelLoaded) {
      resolved = true;
      fallbackFinalized = false;
      paint('3d-ready', 'Live 3D avatar camera ready.', false);
      return snapshot(source);
    }

    paint('loading', 'Loading saved avatar into the 3D profile room…', false);
    await window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.();

    const deadline = performance.now() + 9000;
    while (performance.now() < deadline) {
      const current = state351();
      if (current?.status === '3d-ready' || current?.ready === true || current?.viewer?.modelLoaded) {
        resolved = true;
        fallbackFinalized = false;
        paint('3d-ready', 'Live 3D avatar camera ready.', false);
        return snapshot(source);
      }
      await wait(250);
    }

    fallbackFinalized = true;
    paint('fallback-ready', '3D model did not finish on this device. The animated fallback room is active; tap Retry 3D when ready.', true);
    return snapshot(source);
  } catch (error) {
    lastError = String(error?.message || error);
    fallbackFinalized = true;
    paint('fallback-ready', 'The live avatar camera recovered to fallback mode. Tap Retry 3D to try the saved model again.', true);
    return snapshot(source);
  }
}

function snapshot(source = 'qa') {
  const current = state351();
  return {
    build: BUILD,
    source,
    accountReady: Boolean(account.snapshot().ready),
    profile: Boolean(account.snapshot().profile),
    attempts,
    resolved,
    fallbackFinalized,
    showroomStatus: current?.status || null,
    viewerLoaded: Boolean(current?.viewer?.modelLoaded || current?.ready),
    lastError,
    pass: Boolean(account.snapshot().ready && (resolved || fallbackFinalized)),
    checkedAt: new Date().toISOString()
  };
}

function schedule(source, delay = 0) {
  clearTimeout(timer);
  timer = setTimeout(() => attemptRecovery(source), delay);
}

retryButton?.addEventListener('click', () => schedule('manual-retry', 0), { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !resolved) schedule('visibility-resume', 300);
});
window.addEventListener('pageshow', () => {
  if (!resolved) schedule('pageshow', 250);
});
window.addEventListener('svr:account-change', () => schedule('account-change', 100));
window.addEventListener('svr:avatar-outfit-preview', () => schedule('outfit-change', 100));

window.SVR_PHASE366_PROFILE_LIVE_CAMERA_QA = () => snapshot('qa');
window.SVR_PHASE366_PROFILE_LIVE_CAMERA_RETRY = () => attemptRecovery('api-retry');
window.SVR_PHASE366_OPEN_VR_DRESSING_ROOM = () => { location.href = '../game/avatar-vr.html?v=phase366'; };
window.SVR_PHASE366_PROFILE_LIVE_CAMERA_STATE = snapshot('installed');

schedule('boot', 80);
