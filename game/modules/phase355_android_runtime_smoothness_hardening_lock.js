import * as THREE from 'three';

export const BUILD = 'PHASE-355-ANDROID-RUNTIME-SMOOTHNESS-HARDENING-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const stats = {
  build: BUILD,
  active: ACTIVE,
  assetSubstitutions: 0,
  invalidMaterials: 0,
  hiddenInvalidMeshes: 0,
  duplicateControllerRootsRemoved: 0,
  fallbackTableCreated: false,
  rendererBudgetApplied: false,
  startedAt: new Date().toISOString(),
  lastError: null
};

const svgData = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const TILE = {
  logo: svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256" viewBox="0 0 512 256"><rect width="512" height="256" rx="28" fill="#040811"/><rect x="12" y="12" width="488" height="232" rx="22" fill="none" stroke="#d8b55a" stroke-width="10"/><text x="256" y="126" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-weight="900" font-size="92">SVR</text><text x="256" y="194" text-anchor="middle" fill="#d8b55a" font-family="Arial,sans-serif" font-weight="900" font-size="48">POKER</text></svg>`),
  felt: svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#06351f"/><path d="M0 8h32M0 24h32M8 0v32M24 0v32" stroke="#0b462b" stroke-width="1" opacity=".35"/></svg>`),
  leather: svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#111216"/><circle cx="7" cy="8" r="1" fill="#25272d"/><circle cx="23" cy="19" r="1" fill="#25272d"/></svg>`),
  bump: svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#8080ff"/></svg>`),
  clear: svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="transparent"/></svg>`)
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
  if (!ACTIVE || window.__SVR_PHASE355_IMAGE_SUBSTITUTIONS__) return;
  window.__SVR_PHASE355_IMAGE_SUBSTITUTIONS__ = true;
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
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function phase355SetAttribute(name, value) {
    if (this instanceof HTMLImageElement && String(name).toLowerCase() === 'src') {
      const replacement = replacementFor(value);
      if (replacement) {
        stats.assetSubstitutions += 1;
        return originalSetAttribute.call(this, name, replacement);
      }
    }
    return originalSetAttribute.call(this, name, value);
  };
}

function scene() { return window.__SVR_SCENE__ || null; }
function worldRoot() { return scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene(); }
function findUsableTable() {
  const root = worldRoot();
  const candidates = [
    window.SVR_TABLE_AUTHORITY,
    root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'),
    root?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT'),
    root?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED'),
    root?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
  ].filter(Boolean);
  return candidates.find((candidate) => {
    try {
      candidate.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(candidate);
      const size = new THREE.Vector3();
      box.getSize(size);
      return !box.isEmpty() && size.x > 1.5 && size.z > 0.8;
    } catch { return false; }
  }) || null;
}

function ensureFallbackTable() {
  if (!ACTIVE) return null;
  const root = worldRoot();
  if (!root) return null;
  const usable = findUsableTable();
  if (usable) {
    window.SVR_TABLE_AUTHORITY = usable;
    return usable;
  }
  root.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')?.removeFromParent?.();
  const group = new THREE.Group();
  group.name = 'PHASE326_ANDROID_TABLE_FALLBACK';
  group.position.set(0, 0, 0.75);

  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 0.22, 64),
    new THREE.MeshStandardMaterial({ color: 0x171016, roughness: 0.58, metalness: 0.05 })
  );
  rail.name = 'PHASE355_ANDROID_TABLE_RAIL';
  rail.scale.z = 0.64;
  rail.position.y = 0.78;
  rail.castShadow = false;
  rail.receiveShadow = false;
  group.add(rail);

  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.04, 2.04, 0.055, 64),
    new THREE.MeshStandardMaterial({ color: 0x06351f, roughness: 0.84, metalness: 0.01 })
  );
  felt.name = 'PHASE355_ANDROID_TABLE_FELT';
  felt.scale.z = 0.55;
  felt.position.y = 0.925;
  felt.castShadow = false;
  felt.receiveShadow = false;
  group.add(felt);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.82, 0.72, 40),
    new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.66, metalness: 0.18 })
  );
  pedestal.name = 'PHASE355_ANDROID_TABLE_PEDESTAL';
  pedestal.position.y = 0.36;
  pedestal.castShadow = false;
  pedestal.receiveShadow = false;
  group.add(pedestal);

  root.add(group);
  window.SVR_TABLE_AUTHORITY = group;
  stats.fallbackTableCreated = true;
  return group;
}

function sanitizeMaterials() {
  const currentScene = scene();
  if (!currentScene) return 0;
  let repaired = 0;
  currentScene.traverse((object) => {
    if (!object?.isMesh) return;
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
  });
  return repaired;
}

function applyRendererBudget() {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return false;
  try {
    renderer.setPixelRatio(Math.min(Number(window.devicePixelRatio || 1), 1.2));
    if (renderer.shadowMap) renderer.shadowMap.enabled = false;
    renderer.sortObjects = true;
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
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      if (element.id === 'svr347Root') continue;
      element.remove();
      removed += 1;
    }
  }
  stats.duplicateControllerRootsRemoved += removed;
  return removed;
}

function govern() {
  if (!ACTIVE) return stats;
  ensureFallbackTable();
  sanitizeMaterials();
  applyRendererBudget();
  if (document.querySelector('#svr347Root')) removeLegacyControllerRoots();
  stats.checkedAt = new Date().toISOString();
  window.SVR_PHASE355_RUNTIME_STATE = { ...stats };
  return stats;
}

function qa() {
  const renderer = window.__SVR_RENDERER__;
  const table = findUsableTable();
  const result = {
    ...stats,
    active: ACTIVE,
    table: table?.name || null,
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
  result.pass = Boolean(table)
    && result.legacyControllerRoots === 0
    && result.renderer?.pixelRatio <= 1.21
    && result.renderer?.shadows === false;
  window.SVR_PHASE355_QA_STATE = result;
  return result;
}

if (ACTIVE) {
  installImageSubstitutions();
  window.SVR_PHASE355_GOVERN = govern;
  window.SVR_PHASE355_QA = qa;
  [0, 120, 320, 700, 1400, 2600, 4800, 8000, 12000].forEach((delay) => setTimeout(govern, delay));
  window.addEventListener('svr:platform-ready', () => setTimeout(govern, 0));
  window.addEventListener('svr:platform-deferred-ready', () => setTimeout(govern, 0));
}
