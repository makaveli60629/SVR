/* PHASE-390-QUEST-TABLE-GEOMETRY-CARDS-SPAWN-AUTHORITY-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-390-QUEST-TABLE-GEOMETRY-CARDS-SPAWN-AUTHORITY-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(
  window.SVR_PLATFORM
  || params.get('platform')
  || document.body?.dataset?.platform
  || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop')
).toLowerCase();
const QUEST = platform === 'quest' || params.get('direct') === '1' || params.get('questfix') === '1';
const ACTIVE = QUEST || platform === 'camera3' || params.has('desktop') || params.has('standard');
const TARGET_RECESS_METERS = 0.165;
const TARGET_ERIC_HEIGHT = 1.78;
const FRONT_GAP = 0.50;

const state = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installed: false,
  tableReady: false,
  sourceSurfaceFound: false,
  sourceSurfaceName: null,
  sourceSurfaceMaterial: null,
  brandedSurfaceReady: false,
  brandedSurfaceName: null,
  railTopY: null,
  playSurfaceTopY: null,
  recessMeters: null,
  recessInches: null,
  armrestMeshesPolished: 0,
  phase388OverlayDetached: 0,
  cardRootReady: false,
  cardMeshesReady: 0,
  cardRebuilds: 0,
  handStartAttempts: 0,
  ericReady: false,
  ericWrapperCorrected: false,
  ericHeight: null,
  ericUpDot: null,
  frontSpawnReady: false,
  frontSpawnApplications: 0,
  lastReason: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let renderer = null;
let camera = null;
let table = null;
let sourceSurface = null;
let brandedSurface = null;
let eric = null;
let timer = 0;
let patchTimer = 0;
let originalPhase388Seat = null;
let seatWrapped = false;
let surfaceTexturePromise = null;
let rebuildingCards = null;
let lastTableSweep = 0;
let lastCardSweep = 0;
let lastEricSweep = 0;
let lastSpawnSweep = 0;
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function walk(root, visitor, limit = 26000) {
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
  return Boolean(value && !value.box.isEmpty() && value.size.x > 0.01 && value.size.y >= 0 && value.size.z > 0.01);
}

function materialLabel(object) {
  const list = Array.isArray(object?.material) ? object.material : [object?.material];
  return `${object?.name || ''} ${list.map((material) => material?.name || '').join(' ')}`.toLowerCase();
}

function activeCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}

function rig() {
  return window.SVR_TELEPORT_RIG_REF
    || window.SVR_TELEPORT_RIG
    || window.SVR_PLAYER_RIG
    || window.__SVR_PLAYER_RIG
    || null;
}

function findTable() {
  const candidates = [
    window.SVR_TABLE_AUTHORITY,
    window.SVR_PHASE380_ORIGINAL_TABLE,
    scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY'),
    scene?.getObjectByName?.('PHASE373_VISIBLE_TABLE_GLB_AUTHORITY'),
    table
  ];
  for (const object of candidates) {
    if (!object?.isObject3D) continue;
    try {
      const value = bounds(object);
      if (valid(value) && value.size.x > 1.5 && value.size.z > 0.8) return object;
    } catch {}
  }
  return null;
}

function identifySourceSurface() {
  table = findTable() || table;
  if (!table) return null;
  if (sourceSurface?.isMesh && inside(sourceSurface, table)) {
    const value = bounds(sourceSurface);
    if (valid(value)) return { object: sourceSurface, value, score: Infinity, label: materialLabel(sourceSurface) };
  }
  const whole = bounds(table);
  if (!valid(whole)) return null;
  let best = null;
  walk(table, (object) => {
    if (!object?.isMesh || object === brandedSurface || object.userData?.svrPhase390BrandedSurface) return;
    let value;
    try { value = bounds(object); } catch { return; }
    if (!valid(value) || value.size.x < whole.size.x * 0.55 || value.size.z < whole.size.z * 0.50) return;
    const label = materialLabel(object);
    const flatness = Math.max(value.size.x, value.size.z) / Math.max(value.size.y, 0.0005);
    const heightRatio = (value.center.y - whole.box.min.y) / Math.max(whole.size.y, 0.001);
    let score = value.size.x * value.size.z * 10 + Math.min(flatness, 400) * 0.12;
    if (/polotno/.test(label)) score += 1200;
    if (/felt|cloth|baize|playing|tabletop/.test(label)) score += 800;
    if (/object002/.test(label)) score += 450;
    if (heightRatio > 0.72 && heightRatio < 0.94) score += 180;
    if (value.box.max.y < whole.box.max.y - 0.025) score += 160;
    if (!best || score > best.score) best = { object, value, score, label };
  });
  if (!best) return null;
  sourceSurface = best.object;
  state.sourceSurfaceFound = true;
  state.sourceSurfaceName = sourceSurface.name || '(unnamed)';
  state.sourceSurfaceMaterial = best.label;
  return best;
}

function image(url) {
  return new Promise((resolve) => {
    const element = new Image();
    element.crossOrigin = 'anonymous';
    element.onload = () => resolve(element);
    element.onerror = () => resolve(null);
    element.src = `${url}${url.includes('?') ? '&' : '?'}v=phase390`;
  });
}

async function brandedFeltTexture() {
  if (surfaceTexturePromise) return surfaceTexturePromise;
  surfaceTexturePromise = (async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(1024, 485, 60, 1024, 510, 1180);
    gradient.addColorStop(0, '#6f2388');
    gradient.addColorStop(0.48, '#42105d');
    gradient.addColorStop(1, '#170720');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.10;
    ctx.font = '58px Georgia';
    const suits = ['♠', '♥', '♣', '♦'];
    for (let row = 0; row < 12; row += 1) {
      for (let column = 0; column < 22; column += 1) {
        ctx.fillStyle = column % 3 === 0 ? '#d7a7ff' : '#754294';
        ctx.fillText(suits[(row + column) % suits.length], column * 104 - 28, row * 94 + 56);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.88)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(1024, 512, 905, 405, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#d8b85c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(1024, 512, 840, 350, 0, 0, Math.PI * 2);
    ctx.stroke();
    const logo = await image('/logo.png');
    if (logo) {
      const scale = Math.min(430 / logo.naturalWidth, 430 / logo.naturalHeight);
      const width = logo.naturalWidth * scale;
      const height = logo.naturalHeight * scale;
      ctx.drawImage(logo, 1024 - width / 2, 512 - height / 2, width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 150px system-ui';
      ctx.fillText('SVR', 1024, 500);
      ctx.fillStyle = '#d8b85c';
      ctx.font = '900 64px system-ui';
      ctx.fillText('POKER', 1024, 585);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 2);
    texture.needsUpdate = true;
    return texture;
  })();
  return surfaceTexturePromise;
}

function detachPhase388Overlay() {
  if (!scene) return 0;
  const remove = [];
  walk(scene, (object) => {
    if (!object?.isObject3D || object === brandedSurface || inside(object, brandedSurface)) return;
    const name = String(object.name || '');
    if (/PHASE388_OFFICIAL_SITE_LOGO_FELT|PHASE386_PROFESSIONAL_SVR_FELT|PHASE384_PROFESSIONAL_SVR_FELT/i.test(name)) remove.push(object);
  });
  for (const object of remove) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.phase388OverlayDetached += remove.length;
  return remove.length;
}

function worldDelta(object, delta) {
  const parent = object?.parent;
  if (!object) return;
  if (!parent) {
    object.position.add(delta);
    return;
  }
  parent.updateWorldMatrix?.(true, false);
  parent.getWorldQuaternion(q1).invert();
  parent.getWorldScale(v3);
  v2.copy(delta).applyQuaternion(q1);
  v2.x /= Math.abs(v3.x) > 1e-6 ? v3.x : 1;
  v2.y /= Math.abs(v3.y) > 1e-6 ? v3.y : 1;
  v2.z /= Math.abs(v3.z) > 1e-6 ? v3.z : 1;
  object.position.add(v2);
}

function polishArmrest(whole, playTop) {
  let count = 0;
  walk(table, (object) => {
    if (!object?.isMesh || object === sourceSurface || object === brandedSurface) return;
    let value;
    try { value = bounds(object); } catch { return; }
    if (!valid(value)) return;
    const label = materialLabel(object);
    const isUpperRail = value.box.max.y > playTop + 0.035
      && (value.size.x > whole.size.x * 0.68 || value.size.z > whole.size.z * 0.68);
    const isNamedRail = /armrest|handrest|rail|leather|padding|circle02|object001/.test(label);
    if (!isUpperRail && !isNamedRail) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const materials = source.map((entry) => {
      if (entry?.userData?.svrPhase390Armrest) return entry;
      const material = entry?.clone?.() || new THREE.MeshStandardMaterial();
      material.visible = true;
      material.opacity = 1;
      material.transparent = false;
      material.colorWrite = true;
      material.depthWrite = true;
      material.depthTest = true;
      material.side = THREE.DoubleSide;
      if (material.map?.image) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
        material.color?.setHex?.(0xffffff);
      } else {
        material.color?.setHex?.(/silver|chrome|metal|trim/.test(label) ? 0x716b7b : 0x17111d);
      }
      if ('roughness' in material) material.roughness = /silver|chrome|metal|trim/.test(label) ? 0.28 : 0.46;
      if ('metalness' in material) material.metalness = /silver|chrome|metal|trim/.test(label) ? 0.68 : 0.08;
      material.userData = { ...(material.userData || {}), svrPhase390Armrest: true };
      material.needsUpdate = true;
      return material;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
    object.visible = true;
    object.frustumCulled = false;
    object.receiveShadow = true;
    count += materials.length;
  });
  state.armrestMeshesPolished = count;
  return count;
}

async function buildRecessedSurface() {
  table = findTable() || table;
  if (!table) return false;
  const whole = bounds(table);
  if (!valid(whole)) return false;
  const found = identifySourceSurface();
  if (!found) return false;
  detachPhase388Overlay();
  const targetTop = whole.box.max.y - TARGET_RECESS_METERS;
  if (!brandedSurface?.parent) {
    const source = found.object;
    brandedSurface = new THREE.Mesh(source.geometry.clone(), new THREE.MeshStandardMaterial({
      map: await brandedFeltTexture(),
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0,
      emissive: 0x08020d,
      emissiveIntensity: 0.10,
      side: THREE.DoubleSide
    }));
    brandedSurface.name = 'PHASE390_RECESSED_BRANDED_PLAYING_SURFACE';
    brandedSurface.userData = {
      svrPhase390BrandedSurface: true,
      build: BUILD,
      sourceSurface: source.name || null,
      targetRecessMeters: TARGET_RECESS_METERS
    };
    source.updateWorldMatrix?.(true, false);
    source.matrixWorld.decompose(brandedSurface.position, brandedSurface.quaternion, brandedSurface.scale);
    scene.add(brandedSurface);
    table.attach(brandedSurface);
    source.visible = false;
    source.userData = { ...(source.userData || {}), svrPhase390RetiredSurface: true };
    source.name = 'PHASE390_RETIRED_INNER_BASE';
    const originalMaterials = Array.isArray(source.material) ? source.material : [source.material];
    for (const material of originalMaterials) if (material) material.name = 'phase390-retired-inner-base';
  }
  sourceSurface.visible = false;
  sourceSurface.userData = { ...(sourceSurface.userData || {}), svrPhase390RetiredSurface: true };
  brandedSurface.visible = true;
  brandedSurface.frustumCulled = false;
  brandedSurface.renderOrder = 120;
  brandedSurface.material.depthWrite = true;
  brandedSurface.material.depthTest = true;
  brandedSurface.material.transparent = false;
  let brandedBounds = bounds(brandedSurface);
  worldDelta(brandedSurface, new THREE.Vector3(0, targetTop - brandedBounds.box.max.y, 0));
  brandedBounds = bounds(brandedSurface);
  state.tableReady = true;
  state.brandedSurfaceReady = true;
  state.brandedSurfaceName = brandedSurface.name;
  state.railTopY = +whole.box.max.y.toFixed(4);
  state.playSurfaceTopY = +brandedBounds.box.max.y.toFixed(4);
  state.recessMeters = +(whole.box.max.y - brandedBounds.box.max.y).toFixed(4);
  state.recessInches = +((whole.box.max.y - brandedBounds.box.max.y) * 39.3700787).toFixed(2);
  polishArmrest(whole, brandedBounds.box.max.y);
  window.SVR_PHASE390_PLAY_SURFACE = brandedSurface;
  window.SVR_PHASE390_PLAY_SURFACE_INFO = {
    topY: brandedBounds.box.max.y,
    center: brandedBounds.center.clone(),
    size: brandedBounds.size.clone(),
    recessMeters: whole.box.max.y - brandedBounds.box.max.y
  };
  return true;
}

function cardObjects() {
  const root = scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  const cards = [];
  if (root) walk(root, (object) => {
    if (object?.isMesh && /^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(object.name || ''))) cards.push(object);
  }, 3000);
  return { root, cards };
}

async function ensureCards(reason = 'sweep') {
  if (rebuildingCards) return rebuildingCards;
  rebuildingCards = (async () => {
    detachPhase388Overlay();
    const before = cardObjects();
    if (!before.root || before.cards.length < 17 || !window.SVR_PHASE341_TABLE_LAYOUT) {
      if (typeof window.SVR_PHASE341_REBUILD === 'function') {
        state.cardRebuilds += 1;
        await window.SVR_PHASE341_REBUILD();
      } else {
        try {
          await import('./phase341_canonical_table_geometry_card_motion_lock.js?v=phase390');
          state.cardRebuilds += 1;
          await window.SVR_PHASE341_REBUILD?.();
        } catch (error) {
          state.lastError = `CARDS_IMPORT:${error?.message || error}`;
        }
      }
    }
    const result = cardObjects();
    if (result.root) {
      result.root.visible = true;
      result.root.traverse?.((object) => {
        if (!object?.isMesh) return;
        object.frustumCulled = false;
        if (/^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(object.name || ''))) {
          object.renderOrder = 9341;
          const list = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of list) {
            if (!material) continue;
            material.depthTest = true;
            material.depthWrite = false;
            material.transparent = true;
            material.needsUpdate = true;
          }
        }
      });
    }
    state.cardRootReady = Boolean(result.root);
    state.cardMeshesReady = result.cards.length;
    const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
    if (QUEST && result.root && result.cards.length >= 17 && ['idle', 'showdown'].includes(String(audit?.phase || '').toLowerCase())) {
      const hasVisibleCards = result.cards.some((object) => object.visible);
      if (!hasVisibleCards && typeof window.SVR_POKER_NEXT_HAND === 'function') {
        state.handStartAttempts += 1;
        try { window.SVR_POKER_NEXT_HAND(); } catch {}
      }
    }
    state.lastReason = reason;
    return state.cardRootReady;
  })().finally(() => { rebuildingCards = null; });
  return rebuildingCards;
}

function cleanBoneName(value) {
  return String(value || '').replace(/^[^:]+:/, '').replace(/[^a-z0-9]/ig, '').toLowerCase();
}

function findBone(root, patterns) {
  let result = null;
  walk(root, (object) => {
    if (result || !object?.isBone) return;
    const name = cleanBoneName(object.name);
    if (patterns.some((pattern) => pattern.test(name))) result = object;
  }, 12000);
  return result;
}

function findEric() {
  return window.SVR_PHASE388_ERIC_AUTHORITY
    || scene?.getObjectByName?.('PHASE388_AUTHORITATIVE_DEALER_MODEL')
    || eric
    || null;
}

function fixEricUpright() {
  eric = findEric();
  if (!eric?.isObject3D) return false;
  const wrapper = eric.getObjectByName?.('PHASE388_ERIC_UPRIGHT_WRAPPER') || eric.children?.[0] || eric;
  const head = findBone(eric, [/^head$/, /head/]);
  const leftFoot = findBone(eric, [/leftfoot/, /footl$/, /anklel/, /toel/]);
  const rightFoot = findBone(eric, [/rightfoot/, /footr$/, /ankler/, /toer/]);
  if (!head || (!leftFoot && !rightFoot)) return false;
  head.getWorldPosition(v1);
  const feet = [];
  if (leftFoot) { leftFoot.getWorldPosition(v2); feet.push(v2.clone()); }
  if (rightFoot) { rightFoot.getWorldPosition(v2); feet.push(v2.clone()); }
  v3.set(0, 0, 0);
  for (const foot of feet) v3.add(foot);
  v3.multiplyScalar(1 / feet.length);
  const parent = wrapper.parent || eric;
  parent.updateWorldMatrix?.(true, true);
  const headLocal = parent.worldToLocal(v1.clone());
  const feetLocal = parent.worldToLocal(v3.clone());
  const anatomicalUp = headLocal.sub(feetLocal).normalize();
  const dotBefore = anatomicalUp.dot(new THREE.Vector3(0, 1, 0));
  if (dotBefore < 0.998) {
    q1.setFromUnitVectors(anatomicalUp, new THREE.Vector3(0, 1, 0));
    wrapper.quaternion.premultiply(q1).normalize();
    wrapper.updateWorldMatrix?.(true, true);
    state.ericWrapperCorrected = true;
  }
  let value = bounds(eric);
  if (valid(value) && Math.abs(value.size.y - TARGET_ERIC_HEIGHT) > 0.025) {
    wrapper.scale.multiplyScalar(TARGET_ERIC_HEIGHT / Math.max(value.size.y, 0.001));
    wrapper.updateWorldMatrix?.(true, true);
    value = bounds(eric);
  }
  eric.position.y -= value.box.min.y;
  eric.updateWorldMatrix?.(true, true);
  value = bounds(eric);
  head.getWorldPosition(v1);
  v3.set(0, 0, 0);
  if (leftFoot) { leftFoot.getWorldPosition(v2); v3.add(v2); }
  if (rightFoot) { rightFoot.getWorldPosition(v2); v3.add(v2); }
  v3.multiplyScalar(1 / feet.length);
  const finalUp = v1.sub(v3).normalize();
  state.ericReady = true;
  state.ericHeight = +value.size.y.toFixed(3);
  state.ericUpDot = +finalUp.dot(new THREE.Vector3(0, 1, 0)).toFixed(4);
  eric.visible = true;
  return state.ericUpDot > 0.985;
}

function fixedFrontDirection() {
  table?.updateWorldMatrix?.(true, false);
  table?.getWorldQuaternion?.(q1);
  v1.set(0, 0, 1).applyQuaternion(q1).setY(0);
  if (v1.lengthSq() < 0.001) v1.set(0, 0, 1);
  return v1.normalize().clone();
}

function setRigWorldHead(targetHead, lookTarget, turn = true) {
  const playerRig = rig();
  const currentCamera = activeCamera();
  if (!playerRig?.position || !currentCamera) return false;
  currentCamera.getWorldPosition(v1);
  playerRig.getWorldPosition(v2);
  v3.copy(v2).add(targetHead).sub(v1);
  let local = v3.clone();
  if (playerRig.parent) {
    playerRig.parent.updateWorldMatrix?.(true, false);
    local = playerRig.parent.worldToLocal(local);
  }
  playerRig.position.set(local.x, local.y, local.z);
  if (turn) {
    currentCamera.getWorldQuaternion(q1);
    v1.set(0, 0, -1).applyQuaternion(q1).setY(0).normalize();
    currentCamera.getWorldPosition(v2);
    v3.set(lookTarget.x - v2.x, 0, lookTarget.z - v2.z).normalize();
    const delta = Math.atan2(v3.x, v3.z) - Math.atan2(v1.x, v1.z);
    playerRig.rotation.y += Math.atan2(Math.sin(delta), Math.cos(delta));
  }
  return true;
}

function placeFront(reason = 'manual', callPhase388 = true) {
  if (!QUEST) return false;
  table = findTable() || table;
  if (!table) return false;
  const tableInfo = bounds(table);
  const surfaceInfo = brandedSurface?.parent ? bounds(brandedSurface) : null;
  if (!valid(tableInfo)) return false;
  const front = fixedFrontDirection();
  const horizontalHalf = Math.abs(front.x) > Math.abs(front.z) ? tableInfo.size.x / 2 : tableInfo.size.z / 2;
  const center = surfaceInfo?.center || tableInfo.center;
  const surfaceTop = surfaceInfo?.box.max.y ?? tableInfo.box.max.y - TARGET_RECESS_METERS;
  const head = center.clone().addScaledVector(front, horizontalHalf + FRONT_GAP);
  head.y = surfaceTop + 0.66;
  const look = center.clone();
  look.y = surfaceTop + 0.08;
  const moved = setRigWorldHead(head, look, true);
  if (moved) {
    state.frontSpawnReady = true;
    state.frontSpawnApplications += 1;
    state.lastReason = reason;
    window.SVR_PHASE390_FRONT_SEAT = { head: head.clone(), look: look.clone(), front: front.clone(), reason };
    if (callPhase388 && typeof originalPhase388Seat === 'function') {
      setTimeout(() => {
        try { originalPhase388Seat(`phase390-front:${reason}`); } catch {}
      }, 20);
    }
  }
  return moved;
}

function wrapPhase388Seat() {
  const current = window.SVR_PHASE388_DIRECT_SEAT;
  if (seatWrapped && current === window.SVR_PHASE390_DIRECT_FRONT_SEAT) return true;
  if (typeof current === 'function' && current !== window.SVR_PHASE390_DIRECT_FRONT_SEAT) originalPhase388Seat = current;
  const frontSeat = (reason = 'api') => placeFront(reason, true);
  frontSeat.__phase390 = true;
  window.SVR_PHASE390_DIRECT_FRONT_SEAT = frontSeat;
  window.SVR_PHASE388_DIRECT_SEAT = frontSeat;
  seatWrapped = true;
  return true;
}

async function sweep(reason = 'interval') {
  if (!ACTIVE) return false;
  scene = window.__SVR_SCENE__ || scene;
  renderer = window.__SVR_RENDERER__ || renderer;
  camera = window.__SVR_CAMERA__ || camera;
  table = findTable() || table;
  if (!scene || !table) return false;
  try {
    await buildRecessedSurface();
    detachPhase388Overlay();
    await ensureCards(reason);
    fixEricUpright();
    if (QUEST) {
      wrapPhase388Seat();
      placeFront(reason, true);
    }
    state.installed = true;
    state.installedAt ||= new Date().toISOString();
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE390_STATE = { ...state };
    return true;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE390_STATE = { ...state };
    return false;
  }
}

function frame(now = 0) {
  if (!ACTIVE) return;
  if (now - lastTableSweep > 650) {
    lastTableSweep = now;
    void buildRecessedSurface().catch(() => {});
    detachPhase388Overlay();
  }
  if (now - lastCardSweep > 1300) {
    lastCardSweep = now;
    void ensureCards('frame').catch(() => {});
  }
  if (now - lastEricSweep > 420) {
    lastEricSweep = now;
    fixEricUpright();
  }
  if (QUEST && now - lastSpawnSweep > 900) {
    lastSpawnSweep = now;
    wrapPhase388Seat();
    if (!state.frontSpawnReady || state.frontSpawnApplications < 8) placeFront('bounded-front-spawn', true);
  }
  timer = requestAnimationFrame(frame);
}

function qa() {
  const cards = cardObjects();
  const surfaceInfo = brandedSurface?.parent ? bounds(brandedSurface) : null;
  const tableInfo = table?.parent ? bounds(table) : null;
  const pass = Boolean(
    state.installed
    && state.tableReady
    && state.brandedSurfaceReady
    && state.recessInches >= 6
    && state.recessInches <= 7
    && state.phase388OverlayDetached >= 1
    && state.cardRootReady
    && state.cardMeshesReady >= 17
    && (!QUEST || (state.frontSpawnReady && state.ericReady && state.ericUpDot > 0.985))
    && !state.lastError
  );
  const result = {
    ...state,
    currentTable: table?.name || null,
    currentSurface: brandedSurface?.name || null,
    liveCardRoot: cards.root?.name || null,
    liveCardMeshes: cards.cards.length,
    measuredTable: tableInfo ? {
      width: +tableInfo.size.x.toFixed(3),
      height: +tableInfo.size.y.toFixed(3),
      depth: +tableInfo.size.z.toFixed(3)
    } : null,
    measuredSurface: surfaceInfo ? {
      width: +surfaceInfo.size.x.toFixed(3),
      topY: +surfaceInfo.box.max.y.toFixed(4),
      depth: +surfaceInfo.size.z.toFixed(3)
    } : null,
    pass,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE390_STATE = result;
  return result;
}

window.SVR_PHASE390_SWEEP = sweep;
window.SVR_PHASE390_QA = qa;
window.addEventListener('svr:phase380-original-table-ready', () => { void sweep('table-ready'); });
window.addEventListener('svr:platform-ready', () => { void sweep('platform-ready'); });
window.addEventListener('svr:phase389-core-ready', () => { void sweep('phase389-ready'); });
window.addEventListener('svr:poker-state', () => { void ensureCards('poker-state'); });
window.addEventListener('svr:hand-start', () => { void ensureCards('hand-start'); });

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    renderer = window.__SVR_RENDERER__ || renderer;
    camera = window.__SVR_CAMERA__ || camera;
    table = findTable() || table;
    if (scene && table) break;
    await wait(100);
  }
  await sweep('install');
  for (const delay of [80, 220, 500, 900, 1500, 2600, 4300, 7000]) {
    setTimeout(() => { void sweep(`bounded-${delay}`); }, delay);
  }
  if (!timer) timer = requestAnimationFrame(frame);
  if (QUEST && !patchTimer) patchTimer = window.setInterval(wrapPhase388Seat, 700);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void install(); }, { once: true });
else void install();
