import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-363-ANDROID-CANONICAL-TABLE-ASSET-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const CANDIDATES = [
  { url: new URL('../assets/models/table.glb', import.meta.url).href, format: 'glb', verified: true },
  { url: new URL('../assets/table.fbx', import.meta.url).href, format: 'fbx', verified: true }
];
const TARGET_LENGTH = 4.28;
const TARGET_DEPTH = 2.18;
const TARGET_CENTER_Z = 0.75;

const runtime = {
  build: BUILD,
  active: ACTIVE,
  candidates: CANDIDATES.map((entry) => entry.url),
  loaded: false,
  format: null,
  assetUrl: null,
  authority: null,
  removedCompetingTables: 0,
  size: null,
  scale: null,
  error: null,
  installedAt: null
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeWalk(root, visitor, limit = 18000) {
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

function find(root, name) {
  let found = null;
  safeWalk(root, (object) => {
    if (!found && object?.name === name) found = object;
  });
  return found;
}

async function waitForScene(timeoutMs = 20000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (window.__SVR_SCENE__) return window.__SVR_SCENE__;
    await wait(60);
  }
  return null;
}

function bounds(object) {
  object.updateMatrixWorld?.(true);
  const box = new THREE.Box3().setFromObject(object, true);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { box, size, center };
}

function stabilize(object) {
  safeWalk(object, (node) => {
    if (!node?.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    node.frustumCulled = true;
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const fixed = source.map((material) => {
      if (!material?.isMaterial) return new THREE.MeshStandardMaterial({ color: 0x21161c, roughness: 0.72, metalness: 0.05, side: THREE.DoubleSide });
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      if ('roughness' in material) material.roughness = Math.max(0.48, Number(material.roughness ?? 0.62));
      if ('metalness' in material) material.metalness = Math.min(0.28, Number(material.metalness ?? 0.08));
      material.needsUpdate = true;
      return material;
    });
    node.material = Array.isArray(node.material) ? fixed : fixed[0];
  });
}

function normalize(object) {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.setScalar(1);
  let measured = bounds(object);
  if (measured.size.y > Math.max(measured.size.x, measured.size.z) * 0.82) {
    object.rotation.x = -Math.PI / 2;
    measured = bounds(object);
  }
  if (measured.size.z > measured.size.x * 1.18) {
    object.rotation.y += Math.PI / 2;
    measured = bounds(object);
  }
  const scale = THREE.MathUtils.clamp(Math.min(
    TARGET_LENGTH / Math.max(0.001, measured.size.x),
    TARGET_DEPTH / Math.max(0.001, measured.size.z)
  ), 0.0002, 3);
  object.scale.multiplyScalar(scale);
  measured = bounds(object);
  object.position.x -= measured.center.x;
  object.position.z -= measured.center.z;
  object.position.y -= measured.box.min.y;
  measured = bounds(object);
  return {
    scale,
    size: {
      x: +measured.size.x.toFixed(3),
      y: +measured.size.y.toFixed(3),
      z: +measured.size.z.toFixed(3)
    }
  };
}

function removeCompetingTables(root) {
  const remove = [];
  safeWalk(root, (object) => {
    const name = String(object?.name || '');
    if (!name) return;
    if (/PHASE326_ANDROID_TABLE_FALLBACK|PHASE155_ENHANCED_REAL_TABLE_FALLBACK|PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED|PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT|PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT|PHASE157_ACTUAL_FBX_TABLE_ROOT|PHASE358_QUEST_TABLE_FALLBACK|PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER/.test(name)) remove.push(object);
  });
  for (const object of remove) object.removeFromParent?.();
  runtime.removedCompetingTables += remove.length;
}

async function loadCandidate(candidate) {
  if (candidate.format === 'fbx') return new FBXLoader().loadAsync(candidate.url);
  const loaded = await new GLTFLoader().loadAsync(candidate.url);
  return loaded.scene || loaded.scenes?.[0] || null;
}

async function install() {
  if (!ACTIVE) return null;
  runtime.installedAt = new Date().toISOString();
  const scene = await waitForScene();
  if (!scene) {
    runtime.error = 'ANDROID_SCENE_NOT_READY';
    return null;
  }
  const host = find(scene, 'PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
  const existing = find(scene, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
  if (existing && window.SVR_TABLE_AUTHORITY === existing) {
    runtime.loaded = true;
    runtime.format = 'existing';
    runtime.assetUrl = window.SVR_PHASE358_UPLOADED_TABLE_STATE?.assetUrl || null;
    runtime.authority = existing.name;
    return existing;
  }

  let lastError = null;
  for (const candidate of CANDIDATES) {
    try {
      const object = await loadCandidate(candidate);
      if (!object) throw new Error('TABLE_OBJECT_MISSING');
      object.name = 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';
      stabilize(object);
      const normalized = normalize(object);
      removeCompetingTables(host);
      const container = new THREE.Group();
      container.name = 'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER';
      container.position.set(0, 0, TARGET_CENTER_Z);
      container.add(object);
      host.add(container);
      window.SVR_TABLE_AUTHORITY = object;
      window.SVR_PHASE363_TABLE_ROOT = container;
      runtime.loaded = true;
      runtime.format = candidate.format;
      runtime.assetUrl = candidate.url;
      runtime.authority = object.name;
      runtime.size = normalized.size;
      runtime.scale = normalized.scale;
      runtime.error = null;
      window.dispatchEvent(new CustomEvent('svr:phase363-table-ready', { detail: { ...runtime } }));
      return object;
    } catch (error) {
      lastError = error;
    }
  }
  runtime.error = String(lastError?.stack || lastError?.message || lastError || 'CANONICAL_TABLE_ASSET_NOT_FOUND');
  window.dispatchEvent(new CustomEvent('svr:phase363-table-error', { detail: { ...runtime } }));
  return null;
}

function qa() {
  const authority = window.SVR_TABLE_AUTHORITY;
  return {
    ...runtime,
    currentAuthority: authority?.name || null,
    correctAssetAuthority: Boolean(runtime.loaded && authority?.name === 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'),
    emergencyFallbackPresent: Boolean(
      find(window.__SVR_SCENE__, 'PHASE326_ANDROID_TABLE_FALLBACK')
      || find(window.__SVR_SCENE__, 'PHASE358_QUEST_TABLE_FALLBACK')
      || find(window.__SVR_SCENE__, 'PHASE155_ENHANCED_REAL_TABLE_FALLBACK')
    ),
    pass: Boolean(runtime.loaded && authority && !runtime.error),
    checkedAt: new Date().toISOString()
  };
}

window.SVR_PHASE363_TABLE_QA = qa;
window.SVR_PHASE363_TABLE_STATE = runtime;
await install();
window.SVR_PHASE363_TABLE_STATE = runtime;
