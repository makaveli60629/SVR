import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK';
export const PROTECTED_ASSIGNMENT_MARKER = 'window.SVR_TABLE_AUTHORITY = table';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = /Quest|Oculus|Meta Quest/i.test(ua) || params.get('platform') === 'quest'
  ? 'quest'
  : (/Android/i.test(ua) ? 'android' : 'desktop');
const ACTIVE = platform === 'android' || platform === 'quest';
const TARGET = Object.freeze({ length: 2.734, height: 0.801, depth: 1.46, centerX: 0, centerZ: 0.75 });
const PRIMARY_URL = new URL('../assets/models/table.glb', import.meta.url).href;
const FALLBACK_URL = new URL('../assets/table.fbx', import.meta.url).href;
const COMPETING_NAMES = [
  'PHASE326_ANDROID_TABLE_FALLBACK',
  'PHASE155_ENHANCED_REAL_TABLE_FALLBACK',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
  'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT',
  'PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT',
  'PHASE157_ACTUAL_FBX_TABLE_ROOT',
  'PHASE358_QUEST_TABLE_FALLBACK',
  'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
  'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY',
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'
];

const state = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installed: false,
  source: null,
  authority: null,
  authorityTrapInstalled: false,
  rejectedAuthorityWrites: 0,
  lastRejectedAuthority: null,
  visibleMeshes: 0,
  removedCompetingTables: 0,
  exactOriginalDimensionsMeters: { ...TARGET },
  measured: null,
  loadAttempts: 0,
  reassertions: 0,
  lastError: null,
  installedAt: null,
  checkedAt: null,
  pass: false
};

let scene = null;
let table = null;
let installPromise = null;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const authorityGetter = () => table;

function walk(root, visitor, limit = 22000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object) stack.push(child);
  }
  return seen.size;
}

function worldRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}

function measure(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}

function valid(value) {
  return Boolean(value && !value.box.isEmpty() && value.size.x > 1.5 && value.size.z > 0.8 && value.size.y > 0.3);
}

function worldDelta(object, delta) {
  if (!object?.parent) { object?.position?.add(delta); return; }
  object.parent.updateWorldMatrix?.(true, false);
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  object.parent.getWorldQuaternion(q).invert();
  object.parent.getWorldScale(scale);
  delta.applyQuaternion(q);
  delta.x /= Math.abs(scale.x) > 1e-6 ? scale.x : 1;
  delta.y /= Math.abs(scale.y) > 1e-6 ? scale.y : 1;
  delta.z /= Math.abs(scale.z) > 1e-6 ? scale.z : 1;
  object.position.add(delta);
}

function forceOriginalMaterials(object) {
  let meshes = 0;
  walk(object, (node) => {
    node.visible = true;
    if (!node.isMesh) return;
    meshes += 1;
    node.frustumCulled = false;
    node.castShadow = false;
    node.receiveShadow = true;
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const next = source.map((material) => {
      if (!material?.isMaterial) return new THREE.MeshStandardMaterial({ color: 0x17131f, roughness: 0.7, side: THREE.DoubleSide });
      material.visible = true;
      material.opacity = 1;
      material.transparent = false;
      material.colorWrite = true;
      material.depthWrite = true;
      material.depthTest = true;
      material.side = THREE.DoubleSide;
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
        material.color?.setHex?.(0xffffff);
      }
      if ('roughness' in material) material.roughness = Math.max(0.45, Number(material.roughness ?? 0.68));
      if ('metalness' in material) material.metalness = Math.min(0.3, Number(material.metalness ?? 0.08));
      material.needsUpdate = true;
      return material;
    });
    node.material = Array.isArray(node.material) ? next : next[0];
  });
  state.visibleMeshes = meshes;
  return meshes;
}

function removeRejectedTable(object) {
  if (!object?.isObject3D || object === table) return false;
  const name = String(object.name || 'unnamed-table');
  object.visible = false;
  if (COMPETING_NAMES.includes(name)) object.removeFromParent?.();
  state.lastRejectedAuthority = name;
  state.rejectedAuthorityWrites += 1;
  return true;
}

function removeCompetingTables() {
  const remove = [];
  walk(worldRoot(), (object) => {
    if (!object?.isObject3D || object === table) return;
    const name = String(object.name || '');
    if (COMPETING_NAMES.includes(name)) remove.push(object);
  });
  for (const object of remove) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.removedCompetingTables += remove.length;
}

function installAuthorityTrap() {
  if (!ACTIVE || !table?.isObject3D) return false;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'SVR_TABLE_AUTHORITY');
    if (descriptor?.get === authorityGetter) {
      state.authorityTrapInstalled = true;
      return true;
    }
    if (descriptor?.configurable === false) {
      state.lastError = 'NON_CONFIGURABLE_TABLE_AUTHORITY';
      return false;
    }
    Object.defineProperty(window, 'SVR_TABLE_AUTHORITY', {
      configurable: true,
      enumerable: true,
      get: authorityGetter,
      set(value) {
        if (!value || value === table) return;
        removeRejectedTable(value);
        queueMicrotask(() => {
          if (!table?.isObject3D) return;
          table.visible = true;
          forceOriginalMaterials(table);
          removeCompetingTables();
        });
      }
    });
    state.authorityTrapInstalled = true;
    return true;
  } catch (error) {
    state.lastError = String(error?.message || error);
    return false;
  }
}

function normalizeOriginal(object) {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.setScalar(1);
  let value = measure(object);
  if (value.size.z > value.size.x) {
    object.rotation.y = Math.PI / 2;
    value = measure(object);
  }
  const uniformScale = Math.min(
    TARGET.length / Math.max(value.size.x, 0.001),
    TARGET.depth / Math.max(value.size.z, 0.001)
  );
  object.scale.setScalar(uniformScale);
  value = measure(object);
  worldDelta(object, new THREE.Vector3(
    TARGET.centerX - value.center.x,
    -value.box.min.y,
    TARGET.centerZ - value.center.z
  ));
  value = measure(object);
  state.measured = {
    length: +value.size.x.toFixed(3),
    height: +value.size.y.toFixed(3),
    depth: +value.size.z.toFixed(3),
    minY: +value.box.min.y.toFixed(4),
    centerX: +value.center.x.toFixed(3),
    centerZ: +value.center.z.toFixed(3)
  };
}

async function loadOriginal() {
  state.loadAttempts += 1;
  try {
    const gltf = await new GLTFLoader().loadAsync(PRIMARY_URL);
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root?.isObject3D) throw new Error('ORIGINAL_TABLE_GLB_SCENE_MISSING');
    state.source = 'game/assets/models/table.glb';
    return root;
  } catch (glbError) {
    try {
      const root = await new FBXLoader().loadAsync(FALLBACK_URL);
      if (!root?.isObject3D) throw new Error('ORIGINAL_TABLE_FBX_SCENE_MISSING');
      state.source = 'game/assets/table.fbx';
      return root;
    } catch (fbxError) {
      throw new Error(`ORIGINAL_TABLE_LOAD_FAILED:${glbError?.message || glbError}:${fbxError?.message || fbxError}`);
    }
  }
}

function reassert(reason = 'manual') {
  if (!table?.isObject3D) return false;
  state.reassertions += 1;
  installAuthorityTrap();
  table.visible = true;
  forceOriginalMaterials(table);
  removeCompetingTables();
  window.SVR_PHASE374_ORIGINAL_TABLE_ROOT = table;
  window.SVR_PHASE341_TABLE_LAYOUT = {
    ...(window.SVR_PHASE341_TABLE_LAYOUT || {}),
    center: { x: TARGET.centerX, y: TARGET.height * 0.5, z: TARGET.centerZ },
    top: TARGET.height,
    size: { x: TARGET.length, y: TARGET.height, z: TARGET.depth },
    source: state.source,
    authority: BUILD,
    reason
  };
  state.checkedAt = new Date().toISOString();
  state.pass = state.visibleMeshes > 0 && state.measured?.minY === 0 && window.SVR_TABLE_AUTHORITY === table;
  window.SVR_PHASE374_TABLE_STATE = { ...state };
  return true;
}

async function install() {
  if (!ACTIVE || state.installed) return table;
  if (installPromise) return installPromise;
  installPromise = (async () => {
    const started = performance.now();
    while (performance.now() - started < 30000) {
      scene = window.__SVR_SCENE__ || scene;
      if (scene) break;
      await wait(100);
    }
    if (!scene) throw new Error('SCENE_NOT_READY_FOR_ORIGINAL_TABLE');
    const object = await loadOriginal();
    object.name = 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY';
    normalizeOriginal(object);
    forceOriginalMaterials(object);
    removeCompetingTables();
    worldRoot()?.add(object);
    table = object;
    state.authority = object.name;
    installAuthorityTrap();
    state.installed = true;
    state.installedAt = new Date().toISOString();
    reassert('installed');
    for (const delay of [300, 900, 1800, 3200, 6000]) setTimeout(() => reassert(`bounded-${delay}`), delay);
    window.dispatchEvent(new CustomEvent('svr:phase374-original-table-ready', { detail: qa() }));
    return object;
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE374_TABLE_STATE = { ...state };
    return null;
  });
  return installPromise;
}

function qa() {
  const value = table?.isObject3D ? measure(table) : null;
  const result = {
    ...state,
    currentAuthority: window.SVR_TABLE_AUTHORITY?.name || null,
    authorityIsOriginal: window.SVR_TABLE_AUTHORITY === table,
    visibleMeshes: table ? forceOriginalMaterials(table) : 0,
    boundsValid: valid(value),
    pass: Boolean(
      state.installed
      && state.authorityTrapInstalled
      && window.SVR_TABLE_AUTHORITY === table
      && table?.parent
      && state.visibleMeshes > 0
      && valid(value)
      && !state.lastError
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE374_TABLE_STATE = result;
  return result;
}

window.SVR_PHASE374_ORIGINAL_TABLE_REASSERT = reassert;
window.SVR_PHASE374_ORIGINAL_TABLE_QA = qa;
window.addEventListener('svr:phase372-core-ready', () => reassert('android-core-ready'));
window.addEventListener('svr:phase373-core-ready', () => reassert('quest-core-ready'));
window.addEventListener('svr:phase363-immediate-join-state', () => reassert('join-state'));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => install(), { once: true });
else install();