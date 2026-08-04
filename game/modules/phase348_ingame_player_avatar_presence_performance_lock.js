import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BUILD = 'PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK';
const ROOT_NAME = 'PHASE348_LOCAL_PLAYER_AVATAR_ROOT';
const BODY_NAME = 'PHASE348_LOCAL_PLAYER_AVATAR_BODY';
const EQUIPMENT_NAME = 'PHASE348_LOCAL_PLAYER_EQUIPMENT';
const CAMERA3 = /\/game\/camera3\.html$/i.test(location.pathname)
  || new URLSearchParams(location.search).get('cam') === 'director'
  || new URLSearchParams(location.search).has('director');
const PLATFORM = (() => {
  const value = String(window.SVR_PLATFORM || '').toLowerCase();
  if (value) return value;
  const ua = navigator.userAgent || '';
  if (/Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
  if (/Android/i.test(ua) || /\/game\/android\.html$/i.test(location.pathname)) return 'android';
  return 'desktop';
})();
const ACTIVE = !CAMERA3 && ['android', 'quest', 'desktop'].includes(PLATFORM);
const BUDGET = {
  android: { updateHz: 24, animationHz: 18, maxEquipment: 6, maxPixelRatio: 1.25 },
  quest: { updateHz: 30, animationHz: 24, maxEquipment: 5, maxPixelRatio: 1.20 },
  desktop: { updateHz: 60, animationHz: 30, maxEquipment: 8, maxPixelRatio: 1.75 }
}[PLATFORM] || { updateHz: 30, animationHz: 24, maxEquipment: 6, maxPixelRatio: 1.25 };

let installed = false;
let root = null;
let bodyPivot = null;
let body = null;
let equipmentRoot = null;
let mixer = null;
let activeAction = null;
let headBone = null;
let neckBone = null;
let profileSignature = '';
let loadedUrl = '';
let targetHeight = 1.72;
let fallbackUsed = false;
let loadError = null;
let updateTimer = 0;
let animationTimer = 0;
let lastTick = performance.now();
let frameCount = 0;
let measuredFps = 0;
let fpsWindowAt = performance.now();
let seatedTransitions = 0;
let lastSeated = false;
let profileChanges = 0;
let equipmentMeshes = 0;
let duplicateRepairs = 0;
let loadToken = 0;
let idlePhase = Math.random() * Math.PI * 2;

const scene = () => window.__SVR_SCENE__ || null;
const renderer = () => window.__SVR_RENDERER__ || null;
const baseCamera = () => window.__SVR_CAMERA__ || null;
const activeCamera = () => renderer()?.xr?.isPresenting
  ? renderer().xr.getCamera(baseCamera())
  : baseCamera();
const rig = () => window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
const layout = () => window.SVR_PHASE341_TABLE_LAYOUT || null;
const profile = () => window.SVR_PLAYER_AVATAR_PROFILE || null;

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose?.();
  }
  material.dispose?.();
}

function disposeObject(object) {
  object?.traverse?.((item) => {
    item.geometry?.dispose?.();
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.filter(Boolean).forEach(disposeMaterial);
  });
}

function clearGroup(group) {
  while (group?.children?.length) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    disposeObject(child);
  }
}

function canonicalSeat() {
  const current = layout();
  if (!current?.seats?.[0]) return null;
  const seat = current.seats[0];
  const yaw = Math.atan2(current.center.x - seat.x, current.center.z - seat.z);
  return {
    x: Number(seat.x),
    y: Number(current.top || seat.y || 1) - 0.82,
    z: Number(seat.z),
    yaw,
    center: current.center,
    top: Number(current.top || 1)
  };
}

function seatedNow() {
  return Boolean(
    window.SVR_PHASE347_STATE?.seated
    || window.SVR_PHASE343_STATE?.seated
    || window.SVR_PHASE335_STATE?.seated
    || window.SVR_PLAYER_SEATED
    || document.body.classList.contains('svr347-seated')
    || document.body.classList.contains('svr343-seated')
    || document.body.classList.contains('svr-seated')
  );
}

function worldCameraPose() {
  const camera = activeCamera();
  if (!camera) return null;
  camera.updateWorldMatrix?.(true, false);
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();
  camera.getWorldPosition(position);
  camera.getWorldDirection(direction);
  direction.y = 0;
  if (direction.lengthSq() < 0.0001) direction.set(0, 0, -1);
  direction.normalize();
  return {
    camera,
    position,
    direction,
    yaw: Math.atan2(direction.x, direction.z)
  };
}

function ensureRoot() {
  const currentScene = scene();
  if (!currentScene) return false;
  const duplicates = [];
  currentScene.traverse?.((object) => {
    if (object.name === ROOT_NAME && object !== root) duplicates.push(object);
  });
  duplicates.forEach((object) => {
    object.removeFromParent?.();
    disposeObject(object);
    duplicateRepairs += 1;
  });
  if (root?.parent) return true;
  root = new THREE.Group();
  root.name = ROOT_NAME;
  root.userData.phase348 = true;
  root.userData.localPlayer = true;
  bodyPivot = new THREE.Group();
  bodyPivot.name = 'PHASE348_LOCAL_PLAYER_BODY_PIVOT';
  equipmentRoot = new THREE.Group();
  equipmentRoot.name = EQUIPMENT_NAME;
  bodyPivot.add(equipmentRoot);
  root.add(bodyPivot);
  currentScene.add(root);
  return true;
}

function cloneBodyMaterials(model, palette = '#c9cdd8') {
  model.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const clones = source.map((material) => {
      const copy = material.clone?.() || material;
      copy.side = THREE.FrontSide;
      copy.transparent = Boolean(copy.transparent);
      if (copy.color && !copy.map) copy.color.lerp(new THREE.Color(palette), 0.18);
      if ('roughness' in copy) copy.roughness = Math.max(0.40, Number(copy.roughness ?? 0.58));
      if ('metalness' in copy) copy.metalness = Math.min(0.22, Number(copy.metalness ?? 0.06));
      copy.depthWrite = true;
      copy.needsUpdate = true;
      return copy;
    });
    object.material = Array.isArray(object.material) ? clones : clones[0];
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    object.renderOrder = 3480;
  });
}

function normalizeBody(model, desiredHeight) {
  model.updateWorldMatrix(true, true);
  let box = new THREE.Box3().setFromObject(model);
  const height = Math.max(0.001, box.max.y - box.min.y);
  model.scale.multiplyScalar(desiredHeight / height);
  model.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
  model.updateWorldMatrix(true, true);
}

function locateHeadBones(model) {
  headBone = null;
  neckBone = null;
  model.traverse((object) => {
    const name = String(object.name || '').toLowerCase();
    if (!headBone && object.isBone && /(^|[_\-. ])head($|[_\-. ])/i.test(name)) headBone = object;
    if (!neckBone && object.isBone && /neck/i.test(name)) neckBone = object;
  });
}

function createFallbackBody() {
  const group = new THREE.Group();
  group.name = 'PHASE348_FALLBACK_PLAYER_BODY';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xbfc5d2, roughness: 0.62, metalness: 0.04, side: THREE.FrontSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x11182b, roughness: 0.48, metalness: 0.12, side: THREE.FrontSide });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.52, 6, 12), dark);
  torso.position.set(0, 1.03, 0);
  torso.scale.z = 0.72;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), bodyMaterial);
  head.name = 'PHASE348_FALLBACK_HEAD';
  head.position.y = 1.57;
  head.scale.z = 0.86;
  group.add(head);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.46, 5, 10), dark);
    arm.position.set(side * 0.30, 1.04, 0);
    arm.rotation.z = side * 0.08;
    group.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.58, 5, 10), dark);
    leg.position.set(side * 0.115, 0.40, 0);
    group.add(leg);
  }
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
    }
  });
  return group;
}

function paletteFor(input) {
  const id = String(input?.outfit?.palette || 'midnight');
  const palettes = {
    midnight: { body: '#c9cdd8', primary: '#11172a', secondary: '#7ffcff', metal: '#b9c7d8' },
    royal: { body: '#d5c7c3', primary: '#271347', secondary: '#b892ff', metal: '#d5b768' },
    crimson: { body: '#d1c6c1', primary: '#3a0b17', secondary: '#ff5b8c', metal: '#d7a86e' },
    emerald: { body: '#c9d1c8', primary: '#082d22', secondary: '#66ffc2', metal: '#b7c7bd' },
    gold: { body: '#d5cec0', primary: '#2c2108', secondary: '#ffd98a', metal: '#f0c45c' }
  };
  return palettes[id] || palettes.midnight;
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.42,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: THREE.FrontSide
  });
}

function addEquipment(mesh, yScale = 1) {
  if (!mesh || equipmentMeshes >= BUDGET.maxEquipment) {
    disposeObject(mesh);
    return null;
  }
  mesh.position.multiplyScalar(yScale);
  mesh.scale.multiplyScalar(yScale);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = true;
  equipmentRoot.add(mesh);
  equipmentMeshes += 1;
  return mesh;
}

function rebuildEquipment(input) {
  if (!equipmentRoot) return;
  clearGroup(equipmentRoot);
  equipmentMeshes = 0;
  const outfit = input?.outfit || {};
  const palette = paletteFor(input);
  const scale = targetHeight / 1.72;
  const primary = () => makeMaterial(palette.primary);
  const accent = () => makeMaterial(palette.secondary, { emissive: palette.secondary, emissiveIntensity: 0.16, metalness: 0.26 });
  const metal = () => makeMaterial(palette.metal, { roughness: 0.22, metalness: 0.76 });

  if (['jacket', 'hoodie', 'vest'].includes(outfit.top)) {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.24), primary());
    torso.name = `PHASE348_TOP_${outfit.top}`;
    torso.position.set(0, 1.08, 0);
    addEquipment(torso, scale);
  }

  if (outfit.headwear === 'cap') {
    const cap = new THREE.Group();
    cap.name = 'PHASE348_HEADWEAR_CAP';
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), primary());
    crown.position.y = 1.69;
    crown.scale.z = 0.90;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.025, 0.18), accent());
    brim.position.set(0, 1.66, 0.145);
    cap.add(crown, brim);
    addEquipment(cap, scale);
  } else if (outfit.headwear === 'beanie') {
    const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.66), primary());
    beanie.name = 'PHASE348_HEADWEAR_BEANIE';
    beanie.position.y = 1.70;
    beanie.scale.z = 0.90;
    addEquipment(beanie, scale);
  } else if (outfit.headwear === 'crown') {
    const crown = new THREE.Group();
    crown.name = 'PHASE348_HEADWEAR_CROWN';
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.10, 24, 1, true), metal());
    band.position.y = 1.70;
    crown.add(band);
    for (let index = 0; index < 5; index += 1) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.17, 7), accent());
      const angle = index / 5 * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.15, 1.82, Math.sin(angle) * 0.15);
      crown.add(spike);
    }
    addEquipment(crown, scale);
  }

  if (outfit.eyewear === 'glasses-round') {
    const glasses = new THREE.Group();
    glasses.name = 'PHASE348_EYEWEAR_GLASSES';
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.011, 7, 22), accent());
      lens.position.set(side * 0.084, 1.56, 0.175);
      glasses.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.012), metal());
    bridge.position.set(0, 1.56, 0.176);
    glasses.add(bridge);
    addEquipment(glasses, scale);
  } else if (outfit.eyewear === 'visor') {
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.105, 0.035),
      makeMaterial(palette.secondary, { transparent: true, opacity: 0.70, emissive: palette.secondary, emissiveIntensity: 0.55, roughness: 0.12 })
    );
    visor.name = 'PHASE348_EYEWEAR_VISOR';
    visor.position.set(0, 1.56, 0.18);
    addEquipment(visor, scale);
  }

  if (outfit.accessory === 'watch') {
    const watch = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 7, 18), accent());
    watch.name = 'PHASE348_ACCESSORY_WATCH';
    watch.position.set(-0.34, 0.93, 0);
    watch.rotation.z = Math.PI / 2;
    addEquipment(watch, scale);
  } else if (outfit.accessory === 'chain') {
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 7, 24, Math.PI * 1.45), metal());
    chain.name = 'PHASE348_ACCESSORY_CHAIN';
    chain.position.set(0, 1.35, 0.12);
    chain.rotation.z = Math.PI * 0.78;
    addEquipment(chain, scale);
  } else if (outfit.accessory === 'badge') {
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18), accent());
    badge.name = 'PHASE348_ACCESSORY_BADGE';
    badge.position.set(0.15, 1.22, 0.135);
    addEquipment(badge, scale);
  }
}

async function loadBody(input = profile()) {
  if (!ACTIVE || !input || !ensureRoot()) return false;
  const token = ++loadToken;
  const url = String(input.modelUrl || '/game/assets/models/eric/eric.fbx');
  const format = String(input.modelFormat || '').toLowerCase();
  targetHeight = THREE.MathUtils.clamp(Number(input.targetHeightMeters || 1.72), 1.45, 2.05);
  loadError = null;
  fallbackUsed = false;

  if (body) {
    bodyPivot.remove(body);
    disposeObject(body);
    body = null;
  }
  mixer?.stopAllAction?.();
  mixer = null;
  activeAction = null;

  try {
    const isFbx = format === 'fbx' || /\.fbx(?:[?#]|$)/i.test(url);
    const loaded = isFbx ? await new FBXLoader().loadAsync(url) : await new GLTFLoader().loadAsync(url);
    if (token !== loadToken) return false;
    const model = isFbx ? loaded : loaded.scene || loaded.scenes?.[0];
    if (!model) throw new Error('PHASE348_AVATAR_MODEL_MISSING');
    model.name = BODY_NAME;
    normalizeBody(model, targetHeight);
    cloneBodyMaterials(model, paletteFor(input).body);
    locateHeadBones(model);
    body = model;
    bodyPivot.add(body);
    const clips = isFbx ? loaded.animations || [] : loaded.animations || [];
    if (clips.length) {
      mixer = new THREE.AnimationMixer(body);
      activeAction = mixer.clipAction(clips[0]);
      activeAction.enabled = true;
      activeAction.setEffectiveWeight(0.72);
      activeAction.play();
    }
    loadedUrl = url;
  } catch (error) {
    if (token !== loadToken) return false;
    loadError = String(error?.message || error);
    fallbackUsed = true;
    body = createFallbackBody();
    body.name = BODY_NAME;
    normalizeBody(body, targetHeight);
    bodyPivot.add(body);
    locateHeadBones(body);
    loadedUrl = url;
  }

  rebuildEquipment(input);
  profileChanges += 1;
  window.dispatchEvent(new CustomEvent('svr:phase348-avatar-ready', { detail: qa() }));
  return true;
}

function profileKey(input = profile()) {
  if (!input) return '';
  return JSON.stringify({
    modelUrl: input.modelUrl,
    modelFormat: input.modelFormat,
    targetHeightMeters: input.targetHeightMeters,
    outfit: input.outfit
  });
}

function syncProfile() {
  const input = profile();
  if (!input) return false;
  const signature = profileKey(input);
  if (signature === profileSignature && body) return true;
  profileSignature = signature;
  loadBody(input).catch((error) => {
    loadError = String(error?.message || error);
  });
  return true;
}

function angleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function updateHeadLook(cameraPose, seated) {
  if (!cameraPose || !seated) {
    if (headBone) {
      headBone.rotation.y *= 0.86;
      headBone.rotation.x *= 0.86;
    }
    if (neckBone) {
      neckBone.rotation.y *= 0.90;
      neckBone.rotation.x *= 0.90;
    }
    return;
  }
  const yaw = THREE.MathUtils.clamp(angleDelta(cameraPose.yaw, root.rotation.y), -0.62, 0.62);
  const pitch = THREE.MathUtils.clamp(Number(cameraPose.camera.rotation?.x || 0), -0.28, 0.25);
  if (headBone) {
    headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, yaw * 0.72, 0.18);
    headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, pitch * 0.65, 0.18);
  }
  if (neckBone) {
    neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, yaw * 0.30, 0.14);
    neckBone.rotation.x = THREE.MathUtils.lerp(neckBone.rotation.x, pitch * 0.25, 0.14);
  }
}

function updatePose(now) {
  if (!root || !body || !root.parent) return;
  const cameraPose = worldCameraPose();
  if (!cameraPose) return;
  const seated = seatedNow();
  if (seated !== lastSeated) {
    lastSeated = seated;
    seatedTransitions += 1;
  }

  if (seated) {
    const seat = canonicalSeat();
    if (seat) {
      root.position.set(seat.x, seat.y, seat.z);
      root.rotation.set(0, seat.yaw, 0);
      bodyPivot.position.set(0, -0.02, 0);
      bodyPivot.rotation.x = -0.035;
    }
  } else {
    const behind = cameraPose.direction.clone().multiplyScalar(-0.055);
    const y = cameraPose.position.y - targetHeight * 0.94;
    root.position.set(cameraPose.position.x + behind.x, y, cameraPose.position.z + behind.z);
    root.rotation.set(0, cameraPose.yaw, 0);
    bodyPivot.position.set(0, 0, 0);
    bodyPivot.rotation.x = 0;
  }

  idlePhase += 0.014 * (BUDGET.updateHz / 30);
  const breath = Math.sin(idlePhase) * 0.004;
  bodyPivot.scale.set(1, 1 + breath, 1);
  updateHeadLook(cameraPose, seated);
  root.visible = true;
  root.userData.seated = seated;
  root.userData.platform = PLATFORM;
  root.userData.profileSource = profile()?.source || 'unknown';
  root.userData.updatedAt = new Date().toISOString();
  window.SVR_PHASE348_STATE = stateSnapshot();
}

function animate(now) {
  if (!installed) return;
  frameCount += 1;
  if (now - fpsWindowAt >= 1000) {
    measuredFps = Math.round(frameCount * 1000 / Math.max(1, now - fpsWindowAt));
    frameCount = 0;
    fpsWindowAt = now;
  }

  const poseInterval = 1000 / BUDGET.updateHz;
  const animationInterval = 1000 / BUDGET.animationHz;
  if (now - updateTimer >= poseInterval) {
    updateTimer = now;
    hideDuplicateAvatarRoots();
    syncProfile();
    updatePose(now);
  }
  if (mixer && now - animationTimer >= animationInterval) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTick) / 1000));
    mixer.update(dt);
    animationTimer = now;
  }
  lastTick = now;
  requestAnimationFrame(animate);
}

function hideDuplicateAvatarRoots() {
  const currentScene = scene();
  if (!currentScene || !root) return;
  const duplicates = [];
  currentScene.traverse((object) => {
    if (object !== root && object.name === ROOT_NAME) duplicates.push(object);
  });
  duplicates.forEach((object) => {
    object.removeFromParent?.();
    disposeObject(object);
    duplicateRepairs += 1;
  });
}

function meshCount() {
  let count = 0;
  root?.traverse?.((object) => { if (object.isMesh) count += 1; });
  return count;
}

function stateSnapshot() {
  const currentProfile = profile();
  const seat = canonicalSeat();
  const seated = seatedNow();
  const seatDistance = seated && seat && root
    ? Math.hypot(root.position.x - seat.x, root.position.z - seat.z)
    : 0;
  return {
    build: BUILD,
    active: ACTIVE,
    platform: PLATFORM,
    camera3Excluded: CAMERA3,
    profileLoaded: Boolean(currentProfile),
    displayName: currentProfile?.displayName || 'Player',
    modelUrl: loadedUrl || currentProfile?.modelUrl || '',
    modelId: currentProfile?.outfit?.modelId || '',
    bodyLoaded: Boolean(body),
    fallbackUsed,
    loadError,
    seated,
    seatDistance: Number(seatDistance.toFixed(3)),
    equipmentMeshes,
    totalMeshes: meshCount(),
    updateHz: BUDGET.updateHz,
    animationHz: BUDGET.animationHz,
    measuredFps,
    duplicateRepairs,
    seatedTransitions,
    profileChanges,
    checkedAt: new Date().toISOString()
  };
}

function qa() {
  const snapshot = stateSnapshot();
  const roots = [];
  scene()?.traverse?.((object) => { if (object.name === ROOT_NAME) roots.push(object); });
  const maxMeshes = PLATFORM === 'desktop' ? 22 : 18;
  const result = {
    ...snapshot,
    roots: roots.length,
    singleRoot: roots.length === 1,
    seatAligned: !snapshot.seated || snapshot.seatDistance <= 0.08,
    withinMeshBudget: snapshot.totalMeshes <= maxMeshes,
    withinEquipmentBudget: snapshot.equipmentMeshes <= BUDGET.maxEquipment,
    avatarProfileBridge: Boolean(window.SVR_PLAYER_AVATAR_PROFILE),
    tableLayout: Boolean(layout()?.seats?.[0]),
    camera3ManifestSafe: !CAMERA3
  };
  result.pass = ACTIVE
    && result.singleRoot
    && result.bodyLoaded
    && result.avatarProfileBridge
    && result.tableLayout
    && result.seatAligned
    && result.withinMeshBudget
    && result.withinEquipmentBudget;
  window.SVR_PHASE348_QA_STATE = result;
  return result;
}

function recenterAvatar() {
  updatePose(performance.now());
  return qa();
}

function reloadAvatar() {
  profileSignature = '';
  return loadBody(profile()).then(() => qa());
}

function install() {
  if (installed || !ACTIVE) {
    if (CAMERA3) window.SVR_PHASE348_CAMERA3_EXCLUDED = true;
    return;
  }
  installed = true;
  const start = () => {
    if (!ensureRoot()) return false;
    syncProfile();
    requestAnimationFrame(animate);
    window.dispatchEvent(new CustomEvent('svr:phase348-ready', { detail: qa() }));
    return true;
  };
  if (!start()) {
    const timer = setInterval(() => {
      if (start()) clearInterval(timer);
    }, 250);
    setTimeout(() => clearInterval(timer), 15000);
  }
  window.addEventListener('svr:player-avatar-profile', () => {
    profileSignature = '';
    syncProfile();
  });
  window.addEventListener('svr:account-change', () => {
    profileSignature = '';
    syncProfile();
  });
  window.SVR_PHASE348_QA = qa;
  window.SVR_PHASE348_RELOAD = reloadAvatar;
  window.SVR_PHASE348_RECENTER = recenterAvatar;
  window.SVR_PHASE348_GET_ROOT = () => root;
  window.SVR_PHASE348_BUDGET = { ...BUDGET };
}

install();
