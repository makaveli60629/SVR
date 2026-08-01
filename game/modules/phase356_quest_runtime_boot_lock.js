import * as THREE from 'three';

export const BUILD = 'PHASE-356-QUEST-RUNTIME-BOOT-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || new URLSearchParams(location.search).get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const stats = {
  build: BUILD,
  active: ACTIVE,
  fallbackTableCreated: false,
  invalidMaterials: 0,
  androidRootsRemoved: 0,
  rendererBudgetApplied: false,
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
      set(value) { return descriptor.set.call(this, replacementFor(value) || value); }
    });
  }
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function phase356SetAttribute(name, value) {
    if (this instanceof HTMLImageElement && String(name).toLowerCase() === 'src') {
      return originalSetAttribute.call(this, name, replacementFor(value) || value);
    }
    return originalSetAttribute.call(this, name, value);
  };
}

function safeWalk(root, visitor, limit = 12000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    count += 1;
    try { visitor(object); } catch {}
    const children = Array.isArray(object.children) ? object.children : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
  return count;
}

function scene() { return window.__SVR_SCENE__ || null; }
function worldRoot() { return scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene(); }

function validTable(candidate) {
  if (!candidate) return false;
  try {
    candidate.updateWorldMatrix?.(true, true);
    const box = new THREE.Box3().setFromObject(candidate);
    const size = new THREE.Vector3();
    box.getSize(size);
    return !box.isEmpty() && size.x > 1.5 && size.z > 0.8;
  } catch { return false; }
}

function findTable() {
  const root = worldRoot();
  const candidates = [
    window.SVR_TABLE_AUTHORITY,
    root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'),
    root?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT'),
    root?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED'),
    root?.getObjectByName?.('PHASE356_QUEST_TABLE_FALLBACK')
  ];
  return candidates.find(validTable) || null;
}

function ensureTable() {
  const root = worldRoot();
  if (!ACTIVE || !root) return null;
  const existing = findTable();
  if (existing) {
    window.SVR_TABLE_AUTHORITY = existing;
    return existing;
  }
  root.getObjectByName?.('PHASE356_QUEST_TABLE_FALLBACK')?.removeFromParent?.();
  const group = new THREE.Group();
  group.name = 'PHASE356_QUEST_TABLE_FALLBACK';
  group.position.set(0, 0, 0.75);
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 0.22, 64),
    new THREE.MeshStandardMaterial({ color: 0x171016, roughness: 0.58, metalness: 0.05 })
  );
  rail.name = 'PHASE356_QUEST_TABLE_RAIL';
  rail.scale.z = 0.64;
  rail.position.y = 0.78;
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.04, 2.04, 0.055, 64),
    new THREE.MeshStandardMaterial({ color: 0x06351f, roughness: 0.84, metalness: 0.01 })
  );
  felt.name = 'PHASE356_QUEST_TABLE_FELT';
  felt.scale.z = 0.55;
  felt.position.y = 0.925;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.82, 0.72, 40),
    new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.66, metalness: 0.18 })
  );
  pedestal.name = 'PHASE356_QUEST_TABLE_PEDESTAL';
  pedestal.position.y = 0.36;
  group.add(rail, felt, pedestal);
  safeWalk(group, (object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  root.add(group);
  window.SVR_TABLE_AUTHORITY = group;
  stats.fallbackTableCreated = true;
  return group;
}

function sanitizeScene() {
  const current = scene();
  if (!current) return 0;
  let repaired = 0;
  safeWalk(current, (object) => {
    if (!object?.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const valid = materials.filter((material) => material?.isMaterial === true);
    if (valid.length !== materials.length) {
      stats.invalidMaterials += materials.length - valid.length;
      repaired += 1;
      if (valid.length) object.material = Array.isArray(object.material) ? valid : valid[0];
      else object.visible = false;
    }
    object.castShadow = false;
    object.receiveShadow = false;
  });
  return repaired;
}

function removeAndroidControls() {
  let removed = 0;
  for (const selector of ['#svr347Root','#svr343Root','#svr326Root','#svr339Root','[data-svr-android-controller]','.svr-android-controller','.virtual-stick']) {
    for (const element of document.querySelectorAll(selector)) {
      element.remove();
      removed += 1;
    }
  }
  stats.androidRootsRemoved += removed;
  return removed;
}

function applyRendererBudget() {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return false;
  try {
    renderer.setPixelRatio(Math.min(Number(devicePixelRatio || 1), 1.25));
    renderer.shadowMap.enabled = false;
    renderer.xr.enabled = true;
    stats.rendererBudgetApplied = true;
    return true;
  } catch (error) {
    stats.lastError = String(error?.message || error);
    return false;
  }
}

function govern() {
  if (!ACTIVE) return stats;
  removeAndroidControls();
  ensureTable();
  sanitizeScene();
  applyRendererBudget();
  stats.checkedAt = new Date().toISOString();
  window.SVR_PHASE356_BOOT_STATE = { ...stats, table: findTable()?.name || null };
  return window.SVR_PHASE356_BOOT_STATE;
}

if (ACTIVE) {
  installImageSubstitutions();
  window.SVR_PHASE356_SAFE_WALK = safeWalk;
  window.SVR_PHASE356_BOOT_GOVERN = govern;
  [0, 100, 250, 500, 900, 1500, 2600, 4200].forEach((delay) => setTimeout(govern, delay));
  window.addEventListener('svr:platform-ready', () => setTimeout(govern, 0));
}
