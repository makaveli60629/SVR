import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const ACTIVE = params.get('platform') === 'quest'
  || params.get('platform') === 'android'
  || /Quest|Oculus|Meta Quest/i.test(ua)
  || (/Android/i.test(ua) && /android-lobby\.html$/i.test(location.pathname))
  || params.has('desktop')
  || params.has('standard');
const TARGET = Object.freeze({ length: 2.734, depth: 1.46, centerX: 0, centerZ: 0.75 });
const PRIMARY_URL = new URL('../assets/models/table.glb', import.meta.url).href;
const FALLBACK_URL = new URL('../assets/table.fbx', import.meta.url).href;
const COMPETING_NAMES = new Set([
  'PHASE379_PROCEDURAL_TABLE_AUTHORITY',
  'PHASE358_QUEST_TABLE_FALLBACK',
  'PHASE326_ANDROID_TABLE_FALLBACK',
  'PHASE155_ENHANCED_REAL_TABLE_FALLBACK',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
  'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT',
  'PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT',
  'PHASE157_ACTUAL_FBX_TABLE_ROOT',
  'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
  'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY',
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'
]);

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  source: null,
  authority: null,
  authorityTrapInstalled: false,
  visibleMeshes: 0,
  removedCompetingTables: 0,
  rejectedAuthorityWrites: 0,
  reassertions: 0,
  measured: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
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
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { box, size, center };
}

function forceVisible(object) {
  let meshes = 0;
  walk(object, (node) => {
    node.visible = true;
    if (!node.isMesh) return;
    meshes += 1;
    node.frustumCulled = false;
    node.castShadow = false;
    node.receiveShadow = true;
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const fixed = source.map((material) => {
      if (!material?.isMaterial) {
        return new THREE.MeshStandardMaterial({ color: 0x17131f, roughness: 0.72, side: THREE.DoubleSide });
      }
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
    node.material = Array.isArray(node.material) ? fixed : fixed[0];
  });
  state.visibleMeshes = meshes;
  return meshes;
}

function removeCompetitors() {
  const remove = [];
  walk(worldRoot(), (object) => {
    if (!object?.isObject3D || object === table) return;
    if (COMPETING_NAMES.has(String(object.name || ''))) remove.push(object);
  });
  for (const object of remove) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.removedCompetingTables += remove.length;
}

function installAuthorityTrap() {
  if (!table?.isObject3D) return false;
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
        state.rejectedAuthorityWrites += 1;
        if (value?.isObject3D && COMPETING_NAMES.has(String(value.name || ''))) {
          value.visible = false;
          value.removeFromParent?.();
        }
        queueMicrotask(() => reassert('rejected-authority-write'));
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
  const scale = Math.min(
    TARGET.length / Math.max(value.size.x, 0.001),
    TARGET.depth / Math.max(value.size.z, 0.001)
  );
  object.scale.setScalar(scale);
  value = measure(object);
  object.position.x += TARGET.centerX - value.center.x;
  object.position.y += -value.box.min.y;
  object.position.z += TARGET.centerZ - value.center.z;
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
  if (!table.parent && worldRoot()?.isObject3D) worldRoot().add(table);
  table.visible = true;
  forceVisible(table);
  removeCompetitors();
  window.SVR_PHASE380_ORIGINAL_TABLE = table;
  window.SVR_PHASE380_ORIGINAL_TABLE_STATE = { ...state, reason, checkedAt: new Date().toISOString() };
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
    object.name = 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY';
    normalizeOriginal(object);
    forceVisible(object);
    removeCompetitors();
    worldRoot()?.add(object);
    table = object;
    state.authority = object.name;
    installAuthorityTrap();
    state.installed = true;
    state.installedAt = new Date().toISOString();
    reassert('installed');
    for (const delay of [300, 900, 1800, 3200, 6000]) setTimeout(() => reassert(`bounded-${delay}`), delay);
    window.dispatchEvent(new CustomEvent('svr:phase380-original-table-ready', { detail: qa() }));
    return object;
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE380_ORIGINAL_TABLE_STATE = { ...state };
    return null;
  });
  return installPromise;
}

function qa() {
  const value = table?.isObject3D ? measure(table) : null;
  const pass = Boolean(
    state.installed
    && table?.parent
    && window.SVR_TABLE_AUTHORITY === table
    && state.visibleMeshes > 0
    && value
    && !value.box.isEmpty()
    && value.size.x > 1.5
    && value.size.z > 0.8
    && !state.lastError
  );
  const result = {
    ...state,
    currentAuthority: window.SVR_TABLE_AUTHORITY?.name || null,
    authorityIsOriginal: window.SVR_TABLE_AUTHORITY === table,
    pass,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE380_ORIGINAL_TABLE_STATE = result;
  return result;
}

window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT = reassert;
window.SVR_PHASE380_ORIGINAL_TABLE_QA = qa;
window.addEventListener('svr:phase373-core-ready', () => reassert('quest-core-ready'));
window.addEventListener('svr:phase379-core-ready', () => reassert('phase379-core-ready'));
window.addEventListener('svr:phase381-lobby-ready', () => reassert('phase381-lobby-ready'));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => install(), { once: true });
else install();