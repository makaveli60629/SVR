import { account } from './phase345-demo-activity-persistence.js?v=phase366';

export const BUILD = 'PHASE-366-PROFILE-AVATAR-LIVE-CAMERA-CONTINUITY-LOCK';

const ROUTES = Object.freeze({
  profile: '/site/profile.html?v=phase366',
  websiteDressingRoom: '/site/avatar.html?v=phase366',
  vrDressingRoom: '/game/avatar-vr.html?v=phase366',
  android: '/game/android.html?channel=stable&v=phase366',
  quest: '/game/index.html?platform=quest&v=phase364'
});

const runtime = {
  build: BUILD,
  installed: false,
  accountMode: 'unknown',
  profileSignature: '',
  refreshes: 0,
  liveCameraState: 'starting',
  lastError: null,
  updatedAt: null,
  routes: { ...ROUTES }
};

let pollTimer = 0;
let refreshing = false;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function profileSignature(profile = {}) {
  return JSON.stringify({
    displayName: profile.displayName || '',
    avatarUrl: profile.avatarUrl || '',
    equippedOutfit: profile.equippedOutfit || {}
  });
}

function rewriteRoutes() {
  for (const link of $$('a[href]')) {
    const raw = link.getAttribute('href') || '';
    if (/avatar-vr\.html/i.test(raw)) link.href = ROUTES.vrDressingRoom;
    else if (/(^|\/)avatar\.html/i.test(raw)) link.href = ROUTES.websiteDressingRoom;
    else if (/(^|\/)profile\.html/i.test(raw)) link.href = ROUTES.profile;
    else if (/android\.html/i.test(raw)) link.href = ROUTES.android;
    else if (/game\/index\.html/i.test(raw) || /\.\.\/game\/index\.html/i.test(raw)) link.href = ROUTES.quest;
  }
}

function ensureStyle() {
  if ($('#svr366-profile-style')) return;
  const style = document.createElement('style');
  style.id = 'svr366-profile-style';
  style.textContent = `
#svr366LiveCameraBadge{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(127,252,255,.48);border-radius:999px;padding:7px 10px;background:rgba(2,8,18,.62);color:#dffcff;font:900 10px/1 Orbitron,system-ui;letter-spacing:.08em;box-shadow:0 0 22px rgba(127,252,255,.12)}
#svr366LiveCameraBadge:before{content:"";width:8px;height:8px;border-radius:50%;background:#ff6b8d;box-shadow:0 0 12px #ff6b8d;animation:svr366pulse 1.6s infinite}
#svr366LiveCameraBadge.ready:before{background:#7ffcff;box-shadow:0 0 12px #7ffcff}
#svr366AvatarSyncStatus{font-weight:800;color:#bcd9e3}
@keyframes svr366pulse{50%{opacity:.38}}
`;
  document.head.appendChild(style);
}

function ensureControls() {
  ensureStyle();
  const controls = $('.showroom-controls');
  if (!controls) return;
  if (!$('#svr366VrDressingRoom')) {
    const link = document.createElement('a');
    link.id = 'svr366VrDressingRoom';
    link.className = 'btn secondary';
    link.href = ROUTES.vrDressingRoom;
    link.textContent = 'Open VR Dressing Room';
    controls.appendChild(link);
  }
  if (!$('#svr366WebsiteDressingRoom')) {
    const link = document.createElement('a');
    link.id = 'svr366WebsiteDressingRoom';
    link.className = 'btn ghost';
    link.href = ROUTES.websiteDressingRoom;
    link.textContent = 'Edit Outfit';
    controls.appendChild(link);
  }

  const top = $('.showroom-top');
  if (top && !$('#svr366LiveCameraBadge')) {
    const badge = document.createElement('span');
    badge.id = 'svr366LiveCameraBadge';
    badge.textContent = 'LIVE AVATAR CAMERA';
    top.appendChild(badge);
  }

  const statusCard = $('.showroom-status-card');
  if (statusCard && !$('#svr366AvatarSyncStatus')) {
    const sync = document.createElement('div');
    sync.id = 'svr366AvatarSyncStatus';
    sync.textContent = 'Avatar profile synchronization starting…';
    statusCard.appendChild(sync);
  }
}

function showroomQa() {
  try {
    return window.SVR_PHASE351_PROFILE_SHOWROOM_QA?.() || null;
  } catch {
    return null;
  }
}

function updateCameraState() {
  const qa = showroomQa();
  const badge = $('#svr366LiveCameraBadge');
  const state = String(qa?.state?.status || window.SVR_PHASE351_PROFILE_SHOWROOM_STATE?.status || 'fallback-ready');
  const ready = Boolean(qa?.pass || state === '3d-ready');
  runtime.liveCameraState = ready ? '3d-live' : state;
  badge?.classList.toggle('ready', ready);
  if (badge) badge.textContent = ready ? 'LIVE AVATAR CAMERA' : 'CAMERA FALLBACK READY';
  return ready;
}

async function refreshShowroom(reason = 'profile-sync', force = false) {
  if (refreshing) return false;
  refreshing = true;
  try {
    await account.bootstrap();
    const snapshot = account.snapshot();
    runtime.accountMode = snapshot.mode || 'unknown';
    const nextSignature = profileSignature(snapshot.profile || {});
    const changed = nextSignature !== runtime.profileSignature;
    runtime.profileSignature = nextSignature;

    if (changed || force) {
      await window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.();
      runtime.refreshes += 1;
    }

    const sync = $('#svr366AvatarSyncStatus');
    if (sync) {
      const mode = runtime.accountMode === 'api' ? 'database profile' : 'local demo profile';
      sync.textContent = `${changed || force ? 'Camera refreshed' : 'Camera synchronized'} from ${mode}.`;
    }
    runtime.lastError = null;
    runtime.updatedAt = new Date().toISOString();
    updateCameraState();
    window.SVR_PHASE366_PROFILE_CAMERA_STATE = state();
    window.dispatchEvent(new CustomEvent('svr:phase366-profile-camera', { detail: { reason, ...state() } }));
    return true;
  } catch (error) {
    runtime.lastError = String(error?.message || error);
    const sync = $('#svr366AvatarSyncStatus');
    if (sync) sync.textContent = 'The 2D showroom fallback is active. Retry the live camera when ready.';
    updateCameraState();
    window.SVR_PHASE366_PROFILE_CAMERA_STATE = state();
    return false;
  } finally {
    refreshing = false;
  }
}

function state() {
  return {
    ...runtime,
    routes: { ...ROUTES },
    hasCanvas: Boolean($('#profileShowroomCanvas')),
    hasVrDressingRoomLink: Boolean($('#svr366VrDressingRoom')),
    hasWebsiteDressingRoomLink: Boolean($('#svr366WebsiteDressingRoom')),
    hasLiveCameraBadge: Boolean($('#svr366LiveCameraBadge')),
    showroom: window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || null
  };
}

function qa() {
  const snapshot = state();
  const checks = {
    installed: runtime.installed,
    profileCanvas: snapshot.hasCanvas,
    liveCameraBadge: snapshot.hasLiveCameraBadge,
    websiteDressingRoom: snapshot.hasWebsiteDressingRoomLink,
    vrDressingRoom: snapshot.hasVrDressingRoomLink,
    androidRouteCurrent: ROUTES.android.includes('phase366'),
    questRouteProtected: ROUTES.quest.includes('phase364'),
    profileAuthorityPreserved: typeof window.SVR_PHASE351_PROFILE_SHOWROOM_QA === 'function',
    fallbackProtected: Boolean(window.SVR_PHASE351_PROFILE_SHOWROOM_STATE)
  };
  return { build: BUILD, checks, state: snapshot, pass: Object.values(checks).every(Boolean) };
}

function install() {
  if (runtime.installed) return;
  runtime.installed = true;
  document.body.dataset.profileCamera = 'phase366';
  rewriteRoutes();
  ensureControls();
  window.addEventListener('storage', (event) => {
    if (/svr|avatar|profile|outfit/i.test(event.key || '')) refreshShowroom('storage-change', true);
  });
  window.addEventListener('svr:account-change', () => refreshShowroom('account-change', true));
  window.addEventListener('svr:avatar-saved', () => refreshShowroom('avatar-saved', true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshShowroom('page-visible');
  });
  pollTimer = window.setInterval(() => {
    if (!document.hidden) refreshShowroom('continuity-poll');
  }, 3500);
  window.setTimeout(() => refreshShowroom('install', true), 180);
}

window.SVR_PHASE366_PROFILE_CAMERA_QA = qa;
window.SVR_PHASE366_PROFILE_CAMERA_REFRESH = () => refreshShowroom('manual', true);
window.SVR_PHASE366_PROFILE_CAMERA_ROUTES = { ...ROUTES };
window.SVR_PHASE366_PROFILE_CAMERA_STATE = state();
window.addEventListener('beforeunload', () => clearInterval(pollTimer), { once: true });

install();
