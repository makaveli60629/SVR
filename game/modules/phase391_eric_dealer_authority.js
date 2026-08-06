/* PHASE-391-ERIC-UPRIGHT-DEALER-AUTHORITY-LOCK */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-391-ERIC-UPRIGHT-DEALER-AUTHORITY-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase();
const ACTIVE = platform === 'quest' || platform === 'camera3' || params.has('desktop') || params.has('standard');
const TARGET_HEIGHT = 1.78;
const DEALER_GAP = 0.52;
const state = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installed: false,
  loaded: false,
  visible: false,
  upright: false,
  grounded: false,
  height: null,
  anatomicalUpDot: null,
  texturedMeshes: 0,
  duplicateDealersRemoved: 0,
  placements: 0,
  source: 'game/assets/models/eric/eric.fbx',
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let table = null;
let eric = null;
let loading = null;
let timer = 0;
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();
const box3 = new THREE.Box3();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function walk(root, visitor, limit = 18000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object && !seen.has(child)) stack.push(child);
  }
  return seen.size;
}
function inside(object, root) {
  for (let current = object; current; current = current.parent) if (current === root) return true;
  return false;
}
function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}
function valid(value) {
  return Boolean(value && !value.box.isEmpty() && value.size.x > 0.02 && value.size.y > 0.02 && value.size.z > 0.02);
}
function cleanBoneName(value) {
  return String(value || '').replace(/^[^:]+:/, '').replace(/[^a-z0-9]/ig, '').toLowerCase();
}
function findBone(root, patterns) {
  let found = null;
  walk(root, (object) => {
    if (found || !object?.isBone) return;
    const name = cleanBoneName(object.name);
    if (patterns.some((pattern) => pattern.test(name))) found = object;
  }, 12000);
  return found;
}
function findTable() {
  return window.SVR_TABLE_AUTHORITY
    || window.SVR_PHASE380_ORIGINAL_TABLE
    || scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')
    || table
    || null;
}
function removeDuplicateDealers() {
  if (!scene) return 0;
  const remove = [];
  walk(scene, (object) => {
    if (!object?.isObject3D || object === eric || inside(object, eric)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (object.isSkeletonHelper || /(PHASE368_CARD_DEALER_ROOT|PHASE381_APPROVED_CARD_DEALER_RIG|PHASE388_AUTHORITATIVE_DEALER_MODEL|approvedDealer|eric[_ -]?(dealer|avatar|rig)|external[_ -]?skeleton|debug[_ -]?skeleton)/i.test(label)) remove.push(object);
  });
  for (const object of remove) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.duplicateDealersRemoved += remove.length;
  return remove.length;
}
function anatomicalData(root) {
  const head = findBone(root, [/^head$/, /^headend$/, /head/]);
  const leftFoot = findBone(root, [/^footl$/, /footl/, /leftfoot/, /anklel/, /toe.*l$/]);
  const rightFoot = findBone(root, [/^footr$/, /footr/, /rightfoot/, /ankler/, /toe.*r$/]);
  if (!head || (!leftFoot && !rightFoot)) return null;
  head.getWorldPosition(v1);
  const feet = [];
  if (leftFoot) { leftFoot.getWorldPosition(v2); feet.push(v2.clone()); }
  if (rightFoot) { rightFoot.getWorldPosition(v2); feet.push(v2.clone()); }
  v3.set(0, 0, 0);
  for (const foot of feet) v3.add(foot);
  v3.multiplyScalar(1 / feet.length);
  return { head: v1.clone(), feet: v3.clone(), up: v1.clone().sub(v3).normalize() };
}
function orientUpright(wrapper, model) {
  const candidates = [
    [0, 0, 0],
    [-Math.PI / 2, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, 0, -Math.PI / 2],
    [0, 0, Math.PI / 2],
    [Math.PI, 0, 0],
    [0, 0, Math.PI]
  ];
  let best = null;
  for (const candidate of candidates) {
    wrapper.rotation.set(...candidate);
    wrapper.updateWorldMatrix?.(true, true);
    const anatomy = anatomicalData(model);
    const value = bounds(wrapper);
    if (!anatomy || !valid(value)) continue;
    const dot = anatomy.up.dot(new THREE.Vector3(0, 1, 0));
    const aspect = value.size.y / Math.max(value.size.x, value.size.z, 0.001);
    const score = dot * 100 + aspect;
    if (!best || score > best.score) best = { score, rotation: wrapper.rotation.clone(), dot };
  }
  if (!best) return false;
  wrapper.rotation.copy(best.rotation);
  wrapper.updateWorldMatrix?.(true, true);
  const anatomy = anatomicalData(model);
  state.anatomicalUpDot = anatomy ? +anatomy.up.dot(new THREE.Vector3(0, 1, 0)).toFixed(4) : null;
  state.upright = Number(state.anatomicalUpDot || 0) > 0.985;
  return state.upright;
}
async function texture(url, colorSpace = null) {
  try {
    const value = await new THREE.TextureLoader().loadAsync(new URL(url, import.meta.url).href);
    if (colorSpace) value.colorSpace = colorSpace;
    value.anisotropy = 2;
    value.needsUpdate = true;
    return value;
  } catch {
    return null;
  }
}
async function textureEric(model) {
  const [diffuse, normal] = await Promise.all([
    texture('../assets/models/eric/rp_eric_rigged_001_dif.jpg', THREE.SRGBColorSpace),
    texture('../assets/models/eric/rp_eric_rigged_001_norm.jpg')
  ]);
  let count = 0;
  walk(model, (object) => {
    if (!object?.isMesh || !object.geometry?.attributes?.position) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const materials = source.map((entry) => {
      const material = entry?.isMaterial ? entry.clone() : new THREE.MeshStandardMaterial();
      material.visible = true;
      material.opacity = 1;
      material.transparent = false;
      material.side = THREE.DoubleSide;
      material.colorWrite = true;
      material.depthWrite = true;
      material.depthTest = true;
      material.color?.setHex?.(0xffffff);
      if (diffuse && !material.map) material.map = diffuse;
      if (normal && !material.normalMap) material.normalMap = normal;
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }
      if ('roughness' in material) material.roughness = 0.62;
      if ('metalness' in material) material.metalness = 0.02;
      if ('emissive' in material) {
        material.emissive.setHex(0x050507);
        material.emissiveIntensity = 0.08;
      }
      material.userData = { ...(material.userData || {}), svrPhase391EricMaterial: true };
      material.needsUpdate = true;
      return material;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
    object.visible = true;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = true;
    count += 1;
  }, 14000);
  state.texturedMeshes = count;
  return count;
}
function normalizeRoot(model) {
  const root = new THREE.Group();
  const wrapper = new THREE.Group();
  root.name = 'PHASE391_AUTHORITATIVE_ERIC_DEALER';
  wrapper.name = 'PHASE391_ERIC_UPRIGHT_WRAPPER';
  wrapper.add(model);
  root.add(wrapper);
  orientUpright(wrapper, model);
  let value = bounds(root);
  if (valid(value)) wrapper.scale.multiplyScalar(TARGET_HEIGHT / Math.max(value.size.y, 0.001));
  value = bounds(root);
  wrapper.position.x -= value.center.x;
  wrapper.position.z -= value.center.z;
  wrapper.position.y -= value.box.min.y;
  root.userData = {
    svrPhase391EricAuthority: true,
    sourceAsset: state.source,
    build: BUILD
  };
  return root;
}
function placeEric() {
  table = findTable() || table;
  if (!eric?.parent || !table) return false;
  const info = bounds(table);
  if (!valid(info)) return false;
  table.getWorldQuaternion(q1);
  v1.set(0, 0, 1).applyQuaternion(q1).setY(0);
  if (v1.lengthSq() < 0.001) v1.set(0, 0, 1);
  v1.normalize();
  const half = Math.abs(v1.x) > Math.abs(v1.z) ? info.size.x / 2 : info.size.z / 2;
  const dealerPosition = info.center.clone().addScaledVector(v1, -(half + DEALER_GAP));
  eric.position.set(dealerPosition.x, 0, dealerPosition.z);
  const playerTarget = info.center.clone().addScaledVector(v1, half + 0.50);
  eric.lookAt(playerTarget.x, 1.05, playerTarget.z);
  eric.updateWorldMatrix?.(true, true);
  let value = bounds(eric);
  if (valid(value)) eric.position.y -= value.box.min.y;
  eric.updateWorldMatrix?.(true, true);
  value = bounds(eric);
  const anatomy = anatomicalData(eric);
  state.anatomicalUpDot = anatomy ? +anatomy.up.dot(new THREE.Vector3(0, 1, 0)).toFixed(4) : state.anatomicalUpDot;
  state.height = valid(value) ? +value.size.y.toFixed(3) : null;
  state.grounded = valid(value) && Math.abs(value.box.min.y) <= 0.035;
  state.upright = Number(state.anatomicalUpDot || 0) > 0.985;
  state.visible = true;
  state.placements += 1;
  eric.visible = true;
  return state.grounded && state.upright;
}
async function ensureEric() {
  if (eric?.parent) return eric;
  if (loading) return loading;
  loading = (async () => {
    scene = window.__SVR_SCENE__ || scene;
    if (!scene) return null;
    removeDuplicateDealers();
    const model = await new FBXLoader().loadAsync(new URL('../assets/models/eric/eric.fbx', import.meta.url).href);
    await textureEric(model);
    eric = normalizeRoot(model);
    scene.add(eric);
    window.SVR_PHASE391_ERIC_AUTHORITY = eric;
    window.SVR_PHASE388_ERIC_AUTHORITY = eric;
    state.loaded = true;
    placeEric();
    return eric;
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    return null;
  }).finally(() => { loading = null; });
  return loading;
}
async function sweep(reason = 'interval') {
  if (!ACTIVE) return false;
  scene = window.__SVR_SCENE__ || scene;
  table = findTable() || table;
  if (!scene || !table) return false;
  await ensureEric();
  removeDuplicateDealers();
  const ok = placeEric();
  state.installed = Boolean(eric?.parent);
  state.installedAt ||= new Date().toISOString();
  state.lastReason = reason;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE391_ERIC_STATE = { ...state };
  return ok;
}
function qa() {
  const value = eric?.parent ? bounds(eric) : null;
  const result = {
    ...state,
    liveHeight: value && valid(value) ? +value.size.y.toFixed(3) : null,
    pass: Boolean(state.installed && state.loaded && state.visible && state.upright && state.grounded && state.texturedMeshes > 0 && !state.lastError),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE391_ERIC_STATE = result;
  return result;
}
window.SVR_PHASE391_ENSURE_ERIC = ensureEric;
window.SVR_PHASE391_ERIC_SWEEP = sweep;
window.SVR_PHASE391_ERIC_QA = qa;
window.SVR_PHASE388_ENSURE_ERIC = ensureEric;

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    table = findTable() || table;
    if (scene && table) break;
    await wait(100);
  }
  await sweep('install');
  for (const delay of [150, 450, 900, 1800, 3200, 6000]) setTimeout(() => { void sweep(`bounded-${delay}`); }, delay);
  if (!timer) timer = window.setInterval(() => { void sweep('interval'); }, 1200);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void install(); }, { once: true });
else void install();
