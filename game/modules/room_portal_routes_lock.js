// Phase 98S-W — Room Portal Enablement Lock
// Enables private-room routing without adding lobby geometry or broad visual overlays.

const ROOM_ROUTES = {
  scorpion: './scorpion.html?v=phase98sw-room-portals',
  pga: './pga-drive.html?v=phase98sw-room-portals',
  pgaDrive: './pga-drive.html?v=phase98sw-room-portals',
  pgaChip: './pga-chip-putt.html?v=phase98sw-room-portals',
  reikiRoom: './reiki-room.html?v=phase98sw-room-portals',
  smoker: './smoker-lounge.html?v=phase98sw-room-portals',
  store: './store-room.html?v=phase98sw-room-portals'
};

function routeTo(key) {
  const url = ROOM_ROUTES[key];
  if (!url) return false;
  window.location.href = url;
  return true;
}

function addButton(label, key) {
  const nav = document.getElementById('sceneNav');
  if (!nav || nav.querySelector(`[data-room-route="${key}"]`)) return;
  const btn = document.createElement('button');
  btn.className = 'scene-btn';
  btn.type = 'button';
  btn.textContent = label;
  btn.dataset.roomRoute = key;
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    routeTo(key);
  });
  nav.appendChild(btn);
}

function enhanceExistingSceneButtons() {
  const reikiRoom = document.querySelector('[data-scene="reikiRoom"]');
  if (reikiRoom && !reikiRoom.dataset.routeLocked) {
    reikiRoom.dataset.routeLocked = 'true';
    reikiRoom.title = 'Open private Reiki Room';
    reikiRoom.addEventListener('click', (event) => {
      if (event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      routeTo('reikiRoom');
    }, true);
  }

  const pga = document.querySelector('[data-scene="pga"]');
  if (pga && !pga.dataset.routeLocked) {
    pga.dataset.routeLocked = 'true';
    pga.title = 'Open PGA Driving Range';
    pga.addEventListener('click', (event) => {
      if (event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      routeTo('pgaDrive');
    }, true);
  }

  const scorpion = document.querySelector('[data-scene="scorpion"]');
  if (scorpion && !scorpion.dataset.routeLocked) {
    scorpion.dataset.routeLocked = 'true';
    scorpion.title = 'Open Scorpion Room';
    scorpion.addEventListener('click', (event) => {
      if (event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      routeTo('scorpion');
    }, true);
  }
}

function install() {
  addButton('PGA Drive', 'pgaDrive');
  addButton('PGA Chip/Putt', 'pgaChip');
  addButton('Reiki Private', 'reikiRoom');
  addButton('Smoker Lounge', 'smoker');
  addButton('VR Store', 'store');
  addButton('Scorpion Play', 'scorpion');
  enhanceExistingSceneButtons();

  window.SVR_ROOM_PORTAL_ROUTES_LOCK = {
    phase: '98S-W',
    installed: true,
    routes: ROOM_ROUTES,
    visualOverlayAdded: false,
    lobbyGeometryMoved: false,
    badStorefrontOverlayStillDisabled: true
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

export { ROOM_ROUTES, routeTo };
