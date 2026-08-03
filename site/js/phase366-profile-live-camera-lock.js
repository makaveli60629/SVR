const BUILD = 'PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK';
const stage = document.getElementById('profileShowroom');
const canvas = document.getElementById('profileShowroomCanvas');

const runtime = {
  build: BUILD,
  active: Boolean(stage && canvas),
  mode: 'full',
  live3d: false,
  fallbackVisible: true,
  recoveryAttempts: 0,
  cameraChanges: 0,
  outfitSyncs: 0,
  vrRoomLinked: false,
  dressingRoomLinked: false,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let recoveryTimer = 0;
let statusTimer = 0;
let toolbar = null;
let badge = null;
let cameraStatus = null;

const MODES = new Set(['full', 'portrait', 'outfit', 'orbit']);

function existingState() {
  return window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || {};
}

function updateStatus(message) {
  if (cameraStatus) cameraStatus.textContent = message;
}

function updateBadge() {
  const state = existingState();
  runtime.live3d = state.status === '3d-ready' || Boolean(state.viewerReady && state.roomReady);
  runtime.fallbackVisible = !runtime.live3d;
  if (badge) {
    badge.dataset.state = runtime.live3d ? 'live' : 'fallback';
    badge.textContent = runtime.live3d ? 'Live Avatar Cam' : 'Avatar Cam Fallback';
  }
  updateStatus(runtime.live3d
    ? `${runtime.mode.toUpperCase()} CAMERA • saved profile avatar`
    : 'Fallback room visible • 3D retry remains available');
  publish('badge');
}

function ensureToolbar() {
  if (!stage || toolbar) return toolbar;
  badge = document.createElement('div');
  badge.className = 'svr366-live-camera-badge';
  badge.textContent = 'Avatar Cam Fallback';
  badge.dataset.state = 'fallback';
  stage.appendChild(badge);

  cameraStatus = document.createElement('div');
  cameraStatus.className = 'svr366-camera-status';
  cameraStatus.textContent = 'Connecting to saved avatar…';
  stage.appendChild(cameraStatus);

  toolbar = document.createElement('div');
  toolbar.id = 'svr366LiveCameraToolbar';
  toolbar.className = 'svr366-live-camera-toolbar';
  toolbar.setAttribute('aria-label', 'Avatar live camera controls');
  toolbar.innerHTML = `
    <button type="button" data-camera-mode="full" aria-pressed="true">Full Body</button>
    <button type="button" data-camera-mode="portrait" aria-pressed="false">Portrait</button>
    <button type="button" data-camera-mode="outfit" aria-pressed="false">Outfit</button>
    <button type="button" data-camera-mode="orbit" aria-pressed="false">Live Orbit</button>
    <button type="button" data-camera-action="retry">Retry 3D</button>
    <a href="avatar.html?v=phase366">Website Dressing Room</a>
    <a href="../game/avatar-vr.html?v=phase353">VR Dressing Room</a>
  `;
  stage.appendChild(toolbar);
  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const mode = button.dataset.cameraMode;
    const action = button.dataset.cameraAction;
    if (mode) setMode(mode);
    if (action === 'retry') retry3d('toolbar');
  });
  runtime.vrRoomLinked = Boolean(toolbar.querySelector('a[href*="avatar-vr.html"]'));
  runtime.dressingRoomLinked = Boolean(toolbar.querySelector('a[href*="avatar.html"]'));
  return toolbar;
}

function setPressed(mode) {
  toolbar?.querySelectorAll('[data-camera-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.cameraMode === mode));
  });
}

function ensureRotation(on) {
  const rotate = document.getElementById('showroomRotate');
  if (!rotate) return;
  const paused = /resume/i.test(rotate.textContent || '');
  if (on && paused) rotate.click();
  if (!on && !paused) rotate.click();
}

function setMode(next = 'full') {
  const mode = MODES.has(next) ? next : 'full';
  runtime.mode = mode;
  runtime.cameraChanges += 1;
  stage?.classList.remove('svr366-camera-full', 'svr366-camera-portrait', 'svr366-camera-outfit', 'svr366-live-orbit');
  stage?.classList.add(mode === 'orbit' ? 'svr366-camera-full' : `svr366-camera-${mode}`);
  stage?.classList.toggle('svr366-live-orbit', mode === 'orbit');
  if (mode === 'full') {
    window.SVR_PHASE351_PROFILE_SHOWROOM_RESET?.();
    ensureRotation(false);
  } else if (mode === 'portrait') {
    window.SVR_PHASE351_PROFILE_SHOWROOM_RESET?.();
    ensureRotation(false);
  } else if (mode === 'outfit') {
    window.SVR_PHASE351_PROFILE_SHOWROOM_RESET?.();
    ensureRotation(false);
  } else if (mode === 'orbit') {
    window.SVR_PHASE351_PROFILE_SHOWROOM_RESET?.();
    ensureRotation(true);
  }
  setPressed(mode);
  updateBadge();
  publish(`camera:${mode}`);
  return mode;
}

async function retry3d(reason = 'manual') {
  runtime.recoveryAttempts += 1;
  updateStatus('Retrying the live 3D avatar camera…');
  try {
    await window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.();
    window.setTimeout(updateBadge, 350);
    window.setTimeout(updateBadge, 1800);
  } catch (error) {
    runtime.lastError = String(error?.message || error);
    updateStatus('3D retry did not finish. The visible fallback remains available.');
  }
  publish(`retry:${reason}`);
}

function scheduleRecovery() {
  clearTimeout(recoveryTimer);
  recoveryTimer = window.setTimeout(() => {
    const state = existingState();
    if (state.status !== '3d-ready' && runtime.recoveryAttempts < 1) retry3d('stuck-loading');
    else updateBadge();
  }, 12000);
}

function handleShowroomReady() {
  updateBadge();
  setMode(runtime.mode);
  scheduleRecovery();
}

function handleOutfitChange() {
  runtime.outfitSyncs += 1;
  updateStatus('Refreshing the saved avatar and outfit…');
  window.setTimeout(() => {
    window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.();
    updateBadge();
  }, 80);
  publish('outfit-change');
}

function publish(reason = 'sync') {
  runtime.checkedAt = new Date().toISOString();
  window.SVR_PHASE366_PROFILE_CAMERA_STATE = { ...runtime, reason, phase351: existingState() };
  window.dispatchEvent(new CustomEvent('svr:phase366-profile-camera-state', { detail: window.SVR_PHASE366_PROFILE_CAMERA_STATE }));
  return window.SVR_PHASE366_PROFILE_CAMERA_STATE;
}

async function qa() {
  ensureToolbar();
  const phase351 = await window.SVR_PHASE351_PROFILE_SHOWROOM_QA?.();
  updateBadge();
  const result = {
    ...runtime,
    phase351,
    toolbarReady: Boolean(toolbar),
    cameraModes: toolbar?.querySelectorAll('[data-camera-mode]').length || 0,
    liveCameraOrFallback: Boolean(runtime.live3d || phase351?.fallbackUsed || existingState().fallbackUsed),
    pass: Boolean(runtime.active
      && toolbar
      && (toolbar.querySelectorAll('[data-camera-mode]').length === 4)
      && runtime.vrRoomLinked
      && runtime.dressingRoomLinked
      && (runtime.live3d || phase351?.fallbackUsed || existingState().fallbackUsed)),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE366_PROFILE_CAMERA_QA_STATE = result;
  return result;
}

function install() {
  if (!stage || !canvas || runtime.installedAt) return;
  runtime.installedAt = new Date().toISOString();
  ensureToolbar();
  stage.classList.add('svr366-camera-full');
  window.addEventListener('svr:profile-showroom-ready', handleShowroomReady);
  window.addEventListener('svr:avatar-outfit-preview', handleOutfitChange);
  window.addEventListener('svr:account-change', handleOutfitChange);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateBadge();
      scheduleRecovery();
    }
  });
  clearInterval(statusTimer);
  statusTimer = window.setInterval(updateBadge, 1500);
  scheduleRecovery();
  window.setTimeout(updateBadge, 50);
  publish('installed');
}

window.SVR_PHASE366_PROFILE_CAMERA_QA = qa;
window.SVR_PHASE366_PROFILE_CAMERA_SET = setMode;
window.SVR_PHASE366_PROFILE_CAMERA_RETRY = retry3d;
window.SVR_PHASE366_PROFILE_CAMERA_STATE = { ...runtime };

install();
