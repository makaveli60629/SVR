/* PHASE-389-PROFILE-AVATAR-SHOWROOM-VISIBLE-REFRESH-LOCK */
import { account } from './phase345-demo-activity-persistence.js?v=phase389';
import { SVRAvatarViewer } from './phase346-avatar-viewer.js?v=phase389';

export const BUILD = 'PHASE-389-PROFILE-AVATAR-SHOWROOM-VISIBLE-REFRESH-LOCK';
const canvas = document.getElementById('profileShowroomCanvas');
const stage = document.getElementById('profileShowroom');
const state = { build: BUILD, ready: false, viewer: null, catalog: null, signature: '', rotating: true, lastError: null, attempts: 0 };
const $ = (id) => document.getElementById(id);

function setStatus(message, type = '') {
  const node = $('showroomStatus');
  if (node) node.textContent = message;
  stage?.classList.toggle('is-ready', type === 'ok');
  stage?.classList.toggle('is-fallback', type !== 'ok');
  const retry = $('showroomRetry');
  if (retry) retry.hidden = type !== 'error';
}

function selected(profile) {
  const outfit = profile?.equippedOutfit && Object.keys(profile.equippedOutfit).length ? profile.equippedOutfit : state.catalog?.defaultOutfit || {};
  const model = state.catalog?.avatarModels?.find((entry) => entry.id === outfit.modelId) || state.catalog?.avatarModels?.[0];
  return { outfit, model };
}

function cameraPreset(name = 'full') {
  const viewer = state.viewer;
  if (!viewer) return;
  if (name === 'face') {
    viewer.camera.position.set(0, 1.55, 1.5);
    viewer.controls.target.set(0, 1.48, 0);
  } else if (name === 'upper') {
    viewer.camera.position.set(0, 1.28, 2.2);
    viewer.controls.target.set(0, 1.15, 0);
  } else {
    viewer.resetView();
  }
  viewer.controls.update();
}

async function ensure(force = false) {
  if (!canvas) return null;
  state.attempts += 1;
  setStatus('Loading saved avatar and outfit…');
  try {
    await account.bootstrap();
    const profile = account.snapshot().profile;
    if (!profile) {
      location.replace(`/site/login.html?next=${encodeURIComponent('/site/profile.html?v=phase389')}`);
      return null;
    }
    if (!state.catalog || force) {
      const response = await fetch('/site/data/avatar-catalog.json?v=phase389', { cache: 'no-store' });
      if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
      state.catalog = await response.json();
    }
    if (force && state.viewer) {
      state.viewer.dispose?.();
      state.viewer = null;
    }
    if (!state.viewer) {
      state.viewer = new SVRAvatarViewer({ canvas, catalog: state.catalog, autoRotate: true, compact: false });
      window.SVR_PHASE389_PROFILE_VIEWER = state.viewer;
    }
    const { outfit, model } = selected(profile);
    if (!model) throw new Error('PROFILE_AVATAR_MODEL_MISSING');
    const modelUrl = profile.avatarUrl || new URL(model.assetUrl, location.origin).href;
    const signature = JSON.stringify({ modelUrl, outfit });
    if (force || signature !== state.signature) {
      state.signature = signature;
      await state.viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72));
      state.viewer.applyOutfit(outfit);
    }
    state.viewer.setAutoRotate(state.rotating);
    cameraPreset('full');
    $('showroomAvatarName').textContent = profile.displayName || 'Player';
    $('showroomOutfit').textContent = [model.label, outfit.palette, outfit.top].filter(Boolean).join(' • ') || 'Eric • Default';
    $('modePill').textContent = account.snapshot().mode === 'api' ? 'DATABASE ACCOUNT' : 'LOCAL DEMO';
    state.ready = true;
    state.lastError = null;
    setStatus(state.viewer.fallbackUsed ? 'Safe mannequin active. Retry full 3D when the model is available.' : 'Live avatar loaded. Outfit changes now refresh this profile demo.', state.viewer.fallbackUsed ? 'error' : 'ok');
    window.SVR_PHASE389_PROFILE_STATE = state;
    window.dispatchEvent(new CustomEvent('svr:phase389-profile-showroom-ready', { detail: qa() }));
    return state.viewer;
  } catch (error) {
    state.lastError = String(error?.message || error);
    setStatus(`Profile demo recovery: ${state.lastError}`, 'error');
    window.SVR_PHASE389_PROFILE_STATE = state;
    return null;
  }
}

function qa() {
  const viewer = state.viewer?.audit?.() || null;
  const result = {
    build: BUILD,
    ready: state.ready,
    profileAvailable: Boolean(account.snapshot().profile),
    viewerReady: Boolean(state.viewer),
    modelLoaded: Boolean(viewer?.modelLoaded),
    fallbackUsed: Boolean(viewer?.fallbackUsed),
    rotating: state.rotating,
    attempts: state.attempts,
    lastError: state.lastError,
    viewer,
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(result.ready && result.profileAvailable && result.viewerReady && result.modelLoaded);
  window.SVR_PHASE389_PROFILE_QA_STATE = result;
  return result;
}

$('showroomRotate')?.addEventListener('click', () => {
  state.rotating = !state.rotating;
  state.viewer?.setAutoRotate(state.rotating);
  $('showroomRotate').textContent = state.rotating ? 'Pause Rotation' : 'Resume Rotation';
});
$('showroomReset')?.addEventListener('click', () => cameraPreset('full'));
$('showroomFace')?.addEventListener('click', () => cameraPreset('face'));
$('showroomUpper')?.addEventListener('click', () => cameraPreset('upper'));
$('showroomRetry')?.addEventListener('click', () => void ensure(true));
$('showroomFullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await stage?.requestFullscreen?.();
    else await document.exitFullscreen?.();
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
});
window.addEventListener('svr:account-change', () => void ensure());
window.addEventListener('svr:avatar-saved', () => void ensure(true));
window.addEventListener('svr:avatar-outfit-preview', () => void ensure());
window.SVR_PHASE389_PROFILE_QA = qa;
window.SVR_PHASE389_PROFILE_RETRY = () => ensure(true);
void ensure();
