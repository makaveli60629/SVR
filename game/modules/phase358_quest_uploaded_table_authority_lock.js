import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-358-QUEST-UPLOADED-TABLE-AUTHORITY-LOCK';
const ASSET_URL = new URL('../assets/table.fbx', import.meta.url).href;
const TARGET_LENGTH = 4.28;
const TARGET_DEPTH = 2.18;
const TABLE_BOTTOM_Y = 0.02;
const TABLE_CENTER_Z = 0.75;
const PHASE374_AUTHORITY = 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const state = {
  build: BUILD,
  assetUrl: ASSET_URL,
  loaded: false,
  authority: null,
  successorAuthority: false,
  successorBuild: null,
  fallbackRemoved: false,
  orientation: null,
  size: null,
  elapsedMs: null,
  error: null,
  startedAt: new Date().toISOString()
};

function safeWalk(root, visitor, limit = 14000) {
  if (typeof window.SVR_PHASE358_SAFE_WALK === 'function') return window.SVR_PHASE358_SAFE_WALK(root, visitor, limit);
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

function safeFind(root, name) {
  if (typeof window.SVR_PHASE358_SAFE_FIND === 'function') return window.SVR_PHASE358_SAFE_FIND(root, name);
  let found = null;
  safeWalk(root, (object) => {
    if (!found && object?.name === name) found = object;
  });
  return found;
}

async function waitForScene(timeoutMs = 10000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (window.__SVR_SCENE__) return window.__SVR_SCENE__;
    await wait(75);
  }
  return null;
}

function bounds(object) {
  object.updateMatrixWorld?.(true);
  const box = new THREE.Box3().setFromObject(object, true);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function score(size) {
  const footprint = Math.max(size.x, size.z, 0.001);
  const short = Math.max(Math.min(size.x, size.z), 0.001);
  const aspect = footprint / short;
  const targetAspect = TARGET_LENGTH / TARGET_DEPTH;
  const heightRatio = size.y / footprint;
  return heightRatio + Math.abs(aspect - targetAspect) * 0.35 + (heightRatio > 0.82 ? 10 : 0);
}

function chooseOrientation(object) {
  const quarter = Math.PI / 2;
  const rotations = [
    ['as-imported', 0, 0, 0],
    ['x-minus-90', -quarter, 0, 0],
    ['x-plus-90', quarter, 0, 0],
    ['z-plus-90', 0, 0, quarter],
    ['z-minus-90', 0, 0, -quarter],
    ['yaw-90', 0, quarter, 0],
    ['x-minus-90-yaw-90', -quarter, quarter, 0],
    ['x-plus-90-yaw-90', quarter, quarter, 0],
    ['z-plus-90-yaw-90', 0, quarter, quarter],
    ['z-minus-90-yaw-90', 0, quarter, -quarter]
  ];
  let best = null;
  for (const [name, x, y, z] of rotations) {
    object.rotation.set(x, y, z);
    object.position.set(0, 0, 0);
    object.scale.setScalar(1);
    const measured = bounds(object);
    const value = score(measured.size);
    if (!best || value < best.value) best = { name, x, y, z, value };
  }
  object.rotation.set(best.x, best.y, best.z);
  object.position.set(0, 0, 0);
  object.scale.setScalar(1);
  return best;
}

function normalize(object) {
  const orientation = chooseOrientation(object);
  let measured = bounds(object);
  if (measured.size.z > measured.size.x * 1.18) {
    object.rotation.y += Math.PI / 2;
    measured = bounds(object);
  }
  const scale = THREE.MathUtils.clamp(Math.min(
    TARGET_LENGTH / Math.max(measured.size.x, 0.001),
    TARGET_DEPTH / Math.max(measured.size.z, 0.001)
  ), 0.0002, 3);
  object.scale.multiplyScalar(scale);
  measured = bounds(object);
  object.position.x -= measured.center.x;
  object.position.z -= measured.center.z;
  object.position.y += TABLE_BOTTOM_Y - measured.box.min.y;
  measured = bounds(object);
  return {
    orientation: orientation.name,
    scale,
    size: {
      x: +measured.size.x.toFixed(3),
      y: +measured.size.y.toFixed(3),
      z: +measured.size.z.toFixed(3)
    }
  };
}

function stabilize(object) {
  safeWalk(object, (node) => {
    if (!node?.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    node.frustumCulled = true;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const fixed = Array.from(materials, (material) => {
      if (!material?.isMaterial) {
        return new THREE.MeshStandardMaterial({ color: 0x241b1d, roughness: 0.76, metalness: 0.04 });
      }
      material.transparent = false;
      material.opacity = 1;
      material.side = THREE.DoubleSide;
      if ('roughness' in material) material.roughness = Math.max(Number(material.roughness ?? 0.62), 0.56);
      if ('metalness' in material) material.metalness = Math.min(Number(material.metalness ?? 0.08), 0.24);
      if ('emissiveIntensity' in material) material.emissiveIntensity = Math.min(Number(material.emissiveIntensity || 0), 0.12);
      material.needsUpdate = true;
      return material;
    });
    node.material = Array.isArray(node.material) ? fixed : fixed[0];
  });
}

function removeCompetingTables(host) {
  const remove = [];
  safeWalk(host, (object) => {
    if (!object?.name) return;
    if (/^(?:PHASE358_QUEST_TABLE_FALLBACK|PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT|PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT|PHASE157_ACTUAL_FBX_TABLE_ROOT|PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED)$/.test(object.name)) {
      remove.push(object);
    }
  });
  for (const object of remove) object.removeFromParent?.();
  state.fallbackRemoved = remove.some((object) => object.name === 'PHASE358_QUEST_TABLE_FALLBACK');
}

function currentPhase374Authority() {
  const authority = window.SVR_TABLE_AUTHORITY;
  if (!authority?.isObject3D || authority.name !== PHASE374_AUTHORITY) return null;
  const qa = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.();
  if (qa && qa.pass === false) return null;
  return authority;
}

function adoptPhase374Authority(authority) {
  const measured = bounds(authority);
  state.loaded = true;
  state.authority = authority.name;
  state.successorAuthority = true;
  state.successorBuild = 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK';
  state.orientation = 'phase374-original-glb';
  state.size = {
    x: +measured.size.x.toFixed(3),
    y: +measured.size.y.toFixed(3),
    z: +measured.size.z.toFixed(3)
  };
  state.scale = Number(authority.scale?.x || 1);
  state.error = null;
  window.SVR_PHASE358_UPLOADED_TABLE_ROOT = authority;
  return authority;
}

async function install() {
  const started = performance.now();
  try {
    const scene = await waitForScene();
    if (!scene) throw new Error('PHASE358_QUEST_SCENE_NOT_READY');
    const successor = currentPhase374Authority();
    if (successor) return adoptPhase374Authority(successor);

    const host = safeFind(scene, 'PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
    const existing = safeFind(host, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
    if (existing) {
      window.SVR_TABLE_AUTHORITY = existing;
      const trappedSuccessor = currentPhase374Authority();
      if (trappedSuccessor) return adoptPhase374Authority(trappedSuccessor);
      state.loaded = true;
      state.authority = existing.name;
      return existing;
    }
    const object = await new FBXLoader().loadAsync(ASSET_URL);
    object.name = 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';
    stabilize(object);
    const normalized = normalize(object);
    const authorityRoot = new THREE.Group();
    authorityRoot.name = 'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER';
    authorityRoot.position.set(0, 0, TABLE_CENTER_Z);
    authorityRoot.add(object);
    removeCompetingTables(host);
    host.add(authorityRoot);
    window.SVR_TABLE_AUTHORITY = object;
    const trappedSuccessor = currentPhase374Authority();
    if (trappedSuccessor) {
      authorityRoot.removeFromParent?.();
      return adoptPhase374Authority(trappedSuccessor);
    }
    window.SVR_PHASE358_UPLOADED_TABLE_ROOT = authorityRoot;
    state.loaded = true;
    state.authority = object.name;
    state.orientation = normalized.orientation;
    state.size = normalized.size;
    state.scale = normalized.scale;
    return object;
  } catch (error) {
    state.error = String(error?.stack || error?.message || error);
    window.SVR_PHASE358_BOOT_GOVERN?.();
    return null;
  } finally {
    state.elapsedMs = +(performance.now() - started).toFixed(1);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE358_UPLOADED_TABLE_STATE = { ...state };
  }
}

window.SVR_PHASE358_UPLOADED_TABLE_QA = () => {
  const scene = window.__SVR_SCENE__;
  const legacyAuthority = safeFind(scene, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
  const successorAuthority = currentPhase374Authority();
  const acceptedAuthority = successorAuthority || legacyAuthority;
  return {
    ...state,
    currentAuthority: window.SVR_TABLE_AUTHORITY?.name || null,
    uploadedTablePresent: Boolean(acceptedAuthority),
    legacyUploadedTablePresent: Boolean(legacyAuthority),
    phase374OriginalTablePresent: Boolean(successorAuthority),
    fallbackPresent: Boolean(safeFind(scene, 'PHASE358_QUEST_TABLE_FALLBACK')),
    pass: Boolean(state.loaded && acceptedAuthority && window.SVR_TABLE_AUTHORITY === acceptedAuthority && !state.error),
    checkedAt: new Date().toISOString()
  };
};

await install();