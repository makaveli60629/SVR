import * as THREE from 'three';

export const BUILD = 'PHASE-356-ANDROID-REAL-DEVICE-FREEZE-RECOVERY-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const stats = {
  build: BUILD,
  active: ACTIVE,
  lowPower: false,
  freezeRecoveries: 0,
  longestFrameGapMs: 0,
  contextLosses: 0,
  assetSubstitutions: 0,
  invalidMaterials: 0,
  hiddenInvalidMeshes: 0,
  duplicateControllerRootsRemoved: 0,
  fallbackTableCreated: false,
  lightweightAvatarsCreated: false,
  rendererBudgetApplied: false,
  fullSceneScans: 0,
  startedAt: new Date().toISOString(),
  lastError: null
};

const svgData = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const TILE = {
  logo: svgData('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256"><rect width="512" height="256" rx="28" fill="#040811"/><rect x="12" y="12" width="488" height="232" rx="22" fill="none" stroke="#d8b55a" stroke-width="10"/><text x="256" y="126" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="900" font-size="92">SVR</text><text x="256" y="194" text-anchor="middle" fill="#d8b55a" font-family="Arial" font-weight="900" font-size="48">POKER</text></svg>'),
  felt: svgData('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#06351f"/><path d="M0 8h32M0 24h32M8 0v32M24 0v32" stroke="#0b462b" opacity=".35"/></svg>'),
  leather: svgData('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#111216"/><circle cx="7" cy="8" r="1" fill="#25272d"/><circle cx="23" cy="19" r="1" fill="#25272d"/></svg>'),
  bump: svgData('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#8080ff"/></svg>'),
  clear: svgData('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="transparent"/></svg>')
};

function replacementFor(value) {
  const text = String(value || '');
  if (!text || text.startsWith('data:') || text.startsWith('blob:')) return null;
  let pathname = text;
  try { pathname = new URL(text, document.baseURI).pathname.toLowerCase(); }
  catch { pathname = text.toLowerCase().split(/[?#]/)[0]; }
  if (pathname.endsWith('/undefined')) return TILE.clear;
  if (pathname.endsWith('/logo.png') || pathname.endsWith('/assets/ui/logo.png')) return TILE.logo;
  if (pathname.endsWith('/polotno.jpg')) return TILE.felt;
  if (pathname.endsWith('/leather_dark.jpg')) return TILE.leather;
  if (pathname.endsWith('/leather_dark_bump.jpg') || pathname.endsWith('/14_5_2_bump.jpg')) return TILE.bump;
  return null;
}

function installImageSubstitutions() {
  if (!ACTIVE || window.__SVR_PHASE356_IMAGE_SUBSTITUTIONS__) return;
  window.__SVR_PHASE356_IMAGE_SUBSTITUTIONS__ = true;
  const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (descriptor?.set && descriptor?.get) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value) {
        const replacement = replacementFor(value);
        if (replacement) stats.assetSubstitutions += 1;
        return descriptor.set.call(this, replacement || value);
      }
    });
  }
}

function currentScene() { return window.__SVR_SCENE__ || null; }
function worldRoot() {
  const scene = currentScene();
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}
function findTable() {
  const root = worldRoot();
  return [
    window.SVR_TABLE_AUTHORITY,
    root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'),
    root?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT'),
    root?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED'),
    root?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
  ].find((item) => item?.isObject3D && item.visible !== false) || null;
}

function ensureFallbackTable() {
  if (!ACTIVE) return null;
  const root = worldRoot();
  if (!root) return null;
  const existing = findTable();
  if (existing) {
    window.SVR_TABLE_AUTHORITY = existing;
    return existing;
  }
  const prior = root.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK');
  if (prior) return prior;

  const group = new THREE.Group();
  group.name = 'PHASE326_ANDROID_TABLE_FALLBACK';
  group.position.set(0, 0, 0.75);

  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 0.22, 40),
    new THREE.MeshStandardMaterial({ color: 0x171016, roughness: 0.65, metalness: 0.04 })
  );
  rail.scale.z = 0.64;
  rail.position.y = 0.78;
  group.add(rail);

  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.04, 2.04, 0.055, 40),
    new THREE.MeshStandardMaterial({ color: 0x06351f, roughness: 0.88, metalness: 0.01 })
  );
  felt.scale.z = 0.55;
  felt.position.y = 0.925;
  group.add(felt);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.82, 0.72, 28),
    new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.72, metalness: 0.12 })
  );
  pedestal.position.y = 0.36;
  group.add(pedestal);

  group.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });
  root.add(group);
  window.SVR_TABLE_AUTHORITY = group;
  stats.fallbackTableCreated = true;
  return group;
}

function createAvatar(color, accent, name) {
  const avatar = new THREE.Group();
  avatar.name = name;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02 });
  const accentMaterial = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xcaa88f, roughness: 0.9, metalness: 0 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.48, 4, 8), bodyMaterial);
  torso.position.y = 0.72;
  torso.scale.set(1.05, 1, 0.72);
  avatar.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), skinMaterial);
  head.position.y = 1.23;
  avatar.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.065, 0.035), accentMaterial);
  visor.position.set(0, 1.25, -0.145);
  avatar.add(visor);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.11, 0.24), bodyMaterial);
  shoulders.position.y = 0.96;
  avatar.add(shoulders);

  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), accentMaterial);
  badge.position.set(0.11, 0.87, -0.19);
  avatar.add(badge);

  avatar.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
  });
  return avatar;
}

function ensureLightweightAvatars() {
  if (!ACTIVE) return null;
  const root = worldRoot();
  if (!root) return null;
  const prior = root.getObjectByName?.('PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS');
  if (prior) return prior;

  const group = new THREE.Group();
  group.name = 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS';
  const seats = [
    { x: -2.15, z: -0.55, color: 0x151d36, accent: 0x7ffcff },
    { x: -1.3, z: -1.45, color: 0x2d0711, accent: 0xff4f78 },
    { x: 0, z: -1.78, color: 0x241a08, accent: 0xffd36a },
    { x: 1.3, z: -1.45, color: 0x052b20, accent: 0x68f5bf },
    { x: 2.15, z: -1.45, color: 0x26134f, accent: 0xb37cff }
  ];
  seats.forEach((seat, index) => {
    const avatar = createAvatar(seat.color, seat.accent, `PHASE356_BOT_AVATAR_${index + 1}`);
    avatar.position.set(seat.x, 0.02, seat.z + 0.75);
    avatar.lookAt(0, 0.9, 0.75);
    group.add(avatar);
  });
  root.add(group);
  stats.lightweightAvatarsCreated = true;
  return group;
}

function sanitizeMaterialsOnce() {
  const scene = currentScene();
  if (!scene || stats.fullSceneScans > 0) return 0;
  stats.fullSceneScans += 1;
  let repaired = 0;
  let inspected = 0;
  const stack = [scene];
  while (stack.length && inspected < 240) {
    const object = stack.pop();
    inspected += 1;
    if (object?.children?.length) stack.push(...object.children);
    if (!object?.isMesh) continue;
    if (Array.isArray(object.material)) {
      const valid = object.material.filter((material) => material?.isMaterial === true);
      if (valid.length !== object.material.length) {
        stats.invalidMaterials += object.material.length - valid.length;
        repaired += 1;
        if (valid.length) object.material = valid;
        else {
          object.visible = false;
          stats.hiddenInvalidMeshes += 1;
        }
      }
    } else if (!object.material?.isMaterial) {
      stats.invalidMaterials += 1;
      object.visible = false;
      stats.hiddenInvalidMeshes += 1;
      repaired += 1;
    }
    object.castShadow = false;
    object.receiveShadow = false;
  }
  stats.boundedSceneNodesInspected = inspected;
  return repaired;
}

function applyRendererBudget(forceLow = stats.lowPower) {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return false;
  try {
    const target = forceLow ? 0.78 : Math.min(Number(window.devicePixelRatio || 1), 1);
    renderer.setPixelRatio(target);
    if (renderer.shadowMap) renderer.shadowMap.enabled = false;
    renderer.sortObjects = true;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    stats.rendererBudgetApplied = true;
    return true;
  } catch (error) {
    stats.lastError = String(error?.message || error);
    return false;
  }
}

function removeLegacyControllerRoots() {
  const selectors = [
    '#svr326Root', '#svr343Hud', '#svrAndroidGamePad', '#svrTapMovePanel',
    '#svrAndroidSafeBadge153', '#svrAndroidLiteHud', '#svrAndroidRecoverView'
  ];
  let removed = 0;
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.id !== 'svr347Root') {
        element.remove();
        removed += 1;
      }
    });
  });
  stats.duplicateControllerRootsRemoved += removed;
  return removed;
}

function showRecovery(message) {
  const panel = document.getElementById('runtimeRecovery');
  const text = document.getElementById('runtimeRecoveryText');
  if (text) text.textContent = message;
  if (panel) panel.hidden = false;
}

function enterLowPower(reason = 'manual') {
  if (!ACTIVE) return stats;
  stats.lowPower = true;
  applyRendererBudget(true);
  document.body.classList.add('svr-android-low-power');
  window.SVR_ANDROID_LOW_POWER_MODE = true;
  window.dispatchEvent(new CustomEvent('svr:android-low-power', { detail: { build: BUILD, reason } }));
  return stats;
}

function recoverFromFrameGap(gap) {
  stats.freezeRecoveries += 1;
  stats.longestFrameGapMs = Math.max(stats.longestFrameGapMs, Math.round(gap));
  enterLowPower('frame-gap');
  const renderer = window.__SVR_RENDERER__;
  try { renderer?.resetState?.(); } catch {}
  showRecovery('Android performance recovery applied. Continue playing, or reload the table if controls do not respond.');
}

function installFreezeWatchdog() {
  if (!ACTIVE || window.__SVR_PHASE356_FREEZE_WATCHDOG__) return;
  window.__SVR_PHASE356_FREEZE_WATCHDOG__ = true;
  let last = performance.now();
  const watch = (now) => {
    const gap = now - last;
    last = now;
    if (!document.hidden && gap > 1800) recoverFromFrameGap(gap);
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);

  const attachCanvasRecovery = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas || canvas.dataset.phase356Recovery === '1') return false;
    canvas.dataset.phase356Recovery = '1';
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      stats.contextLosses += 1;
      enterLowPower('webgl-context-lost');
      showRecovery('Graphics context paused. Press Reload Table to restore the game.');
    }, { passive: false });
    canvas.addEventListener('webglcontextrestored', () => {
      applyRendererBudget(true);
      govern({ fullScan: false });
    });
    return true;
  };
  [0, 400, 1200, 3000].forEach((delay) => setTimeout(attachCanvasRecovery, delay));
}

function govern(options = {}) {
  if (!ACTIVE) return stats;
  ensureFallbackTable();
  ensureLightweightAvatars();
  applyRendererBudget();
  if (options.fullScan === true) sanitizeMaterialsOnce();
  if (document.querySelector('#svr347Root')) removeLegacyControllerRoots();
  stats.checkedAt = new Date().toISOString();
  window.SVR_PHASE356_RUNTIME_STATE = { ...stats };
  window.SVR_PHASE355_RUNTIME_STATE = { ...stats, compatibilityAlias: true };
  return stats;
}

function qa() {
  const renderer = window.__SVR_RENDERER__;
  const result = {
    ...stats,
    table: findTable()?.name || null,
    lightweightAvatars: currentScene()?.getObjectByName?.('PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS')?.children?.length || 0,
    controllerRoots: document.querySelectorAll('#svr347Root').length,
    legacyControllerRoots: document.querySelectorAll('#svr326Root,#svr343Hud,#svrAndroidGamePad,#svrTapMovePanel').length,
    renderer: renderer?.info ? {
      calls: renderer.info.render?.calls || 0,
      triangles: renderer.info.render?.triangles || 0,
      geometries: renderer.info.memory?.geometries || 0,
      textures: renderer.info.memory?.textures || 0,
      pixelRatio: renderer.getPixelRatio?.() || null,
      shadows: Boolean(renderer.shadowMap?.enabled)
    } : null,
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(result.table)
    && result.lightweightAvatars >= 5
    && result.legacyControllerRoots === 0
    && (!result.renderer || result.renderer.pixelRatio <= 1.01)
    && (!result.renderer || result.renderer.shadows === false);
  window.SVR_PHASE356_QA_STATE = result;
  window.SVR_PHASE355_QA_STATE = result;
  return result;
}

if (ACTIVE) {
  installImageSubstitutions();
  installFreezeWatchdog();
  window.SVR_PHASE356_GOVERN = govern;
  window.SVR_PHASE356_QA = qa;
  window.SVR_PHASE356_ENTER_LOW_POWER = enterLowPower;
  window.SVR_PHASE355_GOVERN = govern;
  window.SVR_PHASE355_QA = qa;

  document.getElementById('runtimeReloadButton')?.addEventListener('click', () => location.reload());
  document.getElementById('runtimeLowPowerButton')?.addEventListener('click', () => {
    enterLowPower('user');
    document.getElementById('runtimeRecovery')?.setAttribute('hidden', '');
  });

  setTimeout(() => govern({ fullScan: false }), 0);
  setTimeout(() => govern({ fullScan: true }), 950);
  setTimeout(() => govern({ fullScan: false }), 2600);
  window.addEventListener('svr:platform-ready', () => setTimeout(() => govern({ fullScan: false }), 0), { once: true });
}
