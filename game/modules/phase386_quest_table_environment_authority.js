/* PHASE-386-QUEST-TABLE-ENVIRONMENT-AUTHORITY-LOCK */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-386-QUEST-TABLE-ENVIRONMENT-AUTHORITY-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(
  window.SVR_PLATFORM
  || params.get('platform')
  || document.body?.dataset?.platform
  || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop')
).toLowerCase();
const ACTIVE = platform === 'quest' || params.get('questfix') === '1' || params.has('desktop') || params.has('standard');

const TABLE_TARGET = Object.freeze({ length: 2.74, depth: 1.46, height: 0.80, centerX: 0, centerZ: 0.75 });
const PLAYER_FRONT_GAP = 0.68;
const PLAYER_CORRECTION_TOLERANCE = 0.07;
const ERIC_HEIGHT = 1.78;
const ERIC_GAP = 0.46;
const MOON_RADIUS = 2.35;
const MOON_OFFSET = Object.freeze({ x: -4.6, y: 8.6, z: -16.5 });
const LOCK_FLAGS = [
  'SVR_TELEPORT_ENABLED',
  'SVR_HAND_TELEPORT_ENABLED',
  'SVR_WATCH_TELEPORT_ENABLED',
  'SVR_GRIP_TELEPORT_ENABLED',
  'SVR_POINTER_ENABLED',
  'SVR_HAND_RAY_ENABLED',
  'SVR_TABLE_TRAVEL_ENABLED',
  'SVR_LOCOMOTION_ENABLED',
  'SVR_STICK_MOVE_ENABLED'
];
const TELEPORT_METHODS = ['teleport', 'teleportTo', 'setTeleportPosition'];
const TELEPORT_VISUAL_RX = /(teleport|landing|reticle|marker|arc|raycast|ray[_ -]?line)/i;
const OVERLAY_NAME_RX = /(head|camera|screen|visor|comfort|tunnel|fade|vignette|mask|overlay|film|black[_ -]?(square|quad|panel)|debug[_ -]?(quad|screen|panel))/i;
const SAFE_HEAD_OBJECT_RX = /(hand|controller|watch|forearm|wrist|card|poker|table|logo|button|action|avatar|dealer|eric|moon|mars|star)/i;
const SAFE_TELEPORT_OBJECT_RX = /(card|poker|table|logo|button|action|avatar|dealer|eric|moon|mars|star)/i;
const ERIC_RX = /(PHASE381_APPROVED_CARD_DEALER_RIG|approvedDealer|eric|card[_ -]?dealer[_ -]?rig)/i;
const SKELETON_RX = /(skeleton[_ -]?helper|external[_ -]?skeleton|debug[_ -]?skeleton|bone[_ -]?structure|PHASE368_CARD_DEALER_ROOT)/i;
const MOON_RX = /(^|[^a-z])(moon|luna)([^a-z]|$)/i;

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  sceneReady: false,
  tableReady: false,
  tableSized: false,
  tableVisibleMeshes: 0,
  tableMaterialsPolished: 0,
  competingTablesHidden: 0,
  feltInstalled: false,
  logoInstalled: false,
  lightingInstalled: false,
  rendererExposure: null,
  playerFrontApplications: 0,
  playerAnchorCorrections: 0,
  forcedQuickSeatBlocks: 0,
  teleportLocked: false,
  teleportMethodsWrapped: 0,
  teleportMovesBlocked: 0,
  teleportVisualsHidden: 0,
  overlaysHidden: 0,
  unnamedHeadQuadsHidden: 0,
  ericLoaded: false,
  ericFallbackLoaded: false,
  ericVisible: false,
  ericHeight: null,
  ericTexturedMaterials: 0,
  duplicateEricsHidden: 0,
  externalSkeletonsHidden: 0,
  moonInstalled: false,
  moonTextured: false,
  moonDuplicatesHidden: 0,
  lastMode: 'booting',
  lastReason: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let camera = null;
let renderer = null;
let table = null;
let eric = null;
let felt = null;
let logo = null;
let lighting = null;
let moon = null;
let moonTexture = null;
let timer = 0;
let frameHandle = 0;
let loadingEric = null;
let lastSweep = 0;
let lastAnchorCorrection = 0;
let internalMove = false;
let anchor = null;
let autoSeatWrapped = false;
const savedFlags = new Map();
const savedTeleportVisibility = new Map();
const wrappedTeleportRigs = new WeakSet();
const textureCache = new Map();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

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

function isInside(object, root) {
  let current = object;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function rootUnderScene(object) {
  let current = object;
  while (current?.parent && current.parent !== scene && current.parent?.name !== 'PHASE200_ORDERED_GRAND_LOBBY_ROOT') current = current.parent;
  return current || object;
}

function worldRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}

function rig() {
  return window.SVR_TELEPORT_RIG_REF
    || window.SVR_TELEPORT_RIG
    || window.SVR_PLAYER_RIG
    || window.__SVR_PLAYER_RIG
    || null;
}

function activeCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}

function seatedNow() {
  return Boolean(
    window.SVR_PHASE361_STATE?.seated
    || window.SVR_PHASE363_STATE?.joined
    || window.SVR_PHASE365_STATE?.joined
    || document.body?.classList?.contains('svr361-seated')
    || document.body?.classList?.contains('svr363-seated')
    || document.body?.classList?.contains('svr365-seated')
    || document.body?.dataset?.svrSeated === 'true'
  );
}

function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}

function validBounds(value) {
  return Boolean(value && !value.box.isEmpty() && value.size.x > 0.2 && value.size.y > 0.02 && value.size.z > 0.2);
}

function worldDelta(object, delta) {
  if (!object?.parent) {
    object?.position?.add(delta);
    return;
  }
  object.parent.updateWorldMatrix?.(true, false);
  object.parent.getWorldQuaternion(tmpQ).invert();
  object.parent.getWorldScale(tmpScale);
  tmp.copy(delta).applyQuaternion(tmpQ);
  tmp.x /= Math.abs(tmpScale.x) > 1e-6 ? tmpScale.x : 1;
  tmp.y /= Math.abs(tmpScale.y) > 1e-6 ? tmpScale.y : 1;
  tmp.z /= Math.abs(tmpScale.z) > 1e-6 ? tmpScale.z : 1;
  object.position.add(tmp);
}

function candidateTable() {
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
      if (validBounds(value) && value.size.x > 1.2 && value.size.z > 0.65) return object;
    } catch {}
  }
  return null;
}

function hideCompetingTables() {
  if (!scene || !table) return 0;
  const names = new Set([
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
  let hidden = 0;
  walk(worldRoot(), (object) => {
    if (!object?.isObject3D || object === table || isInside(object, table)) return;
    if (!names.has(String(object.name || ''))) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase386CompetingTableHidden: true };
    hidden += 1;
  });
  state.competingTablesHidden = Math.max(state.competingTablesHidden, hidden);
  return hidden;
}

function materialLabel(object, material) {
  return `${object?.name || ''} ${material?.name || ''}`.toLowerCase();
}

function polishTableMesh(object, whole) {
  if (!object?.isMesh || !object.material) return 0;
  object.visible = true;
  object.frustumCulled = false;
  object.castShadow = false;
  object.receiveShadow = true;
  const value = bounds(object);
  const yRatio = whole.size.y > 0.001 ? (value.center.y - whole.box.min.y) / whole.size.y : 0.5;
  const list = Array.isArray(object.material) ? object.material : [object.material];
  const next = list.map((source) => {
    if (source?.userData?.svrPhase386TablePolished) {
      source.visible = true;
      source.opacity = 1;
      source.transparent = false;
      source.colorWrite = true;
      source.depthWrite = true;
      source.depthTest = true;
      source.needsUpdate = true;
      return source;
    }
    const material = source?.clone?.() || new THREE.MeshStandardMaterial();
    const label = materialLabel(object, source);
    const feltLike = /felt|cloth|baize|surface|playing|tabletop|top[_ -]?cloth/.test(label) || yRatio > 0.78;
    const metalLike = /metal|chrome|steel|frame|leg|base/.test(label) || yRatio < 0.42;
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
    } else if (feltLike) {
      material.color?.setHex?.(0x123a2a);
    } else if (metalLike) {
      material.color?.setHex?.(0x50465a);
    } else {
      material.color?.setHex?.(0x2b2432);
    }
    if ('roughness' in material) material.roughness = feltLike ? 0.88 : metalLike ? 0.34 : 0.56;
    if ('metalness' in material) material.metalness = feltLike ? 0 : metalLike ? 0.28 : 0.08;
    if ('emissive' in material && feltLike) {
      material.emissive.setHex(0x04130d);
      material.emissiveIntensity = 0.14;
    }
    material.userData = { ...(material.userData || {}), svrPhase386TablePolished: true };
    material.needsUpdate = true;
    return material;
  });
  object.material = Array.isArray(object.material) ? next : next[0];
  return next.length;
}

function removeOldTableOverlays() {
  if (!scene) return;
  walk(scene, (object) => {
    if (!object?.isObject3D) return;
    if (/PHASE384_(PROFESSIONAL_SVR_FELT|SVR_TABLE_LOGO)|PHASE386_(PROFESSIONAL_SVR_FELT|SVR_TABLE_LOGO)/.test(String(object.name || ''))) {
      if (object !== felt && object !== logo) object.visible = false;
    }
  });
}

function feltMap() {
  if (textureCache.has('felt')) return textureCache.get('felt');
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(512, 240, 20, 512, 256, 620);
  gradient.addColorStop(0, '#215943');
  gradient.addColorStop(0.55, '#123a2a');
  gradient.addColorStop(1, '#06150f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 11000; i += 1) {
    const shade = 70 + ((i * 29) % 85);
    ctx.fillStyle = `rgb(${Math.floor(shade * 0.48)},${shade},${Math.floor(shade * 0.68)})`;
    ctx.fillRect((i * 71) % 1024, (i * 47) % 512, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d7bd72';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(512, 256, 455, 205, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(512, 256, 398, 170, 0, 0, Math.PI * 2);
  ctx.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 2);
  map.needsUpdate = true;
  textureCache.set('felt', map);
  return map;
}

function installFeltAndLogo(info) {
  if (!scene || !validBounds(info)) return false;
  removeOldTableOverlays();
  if (!felt) {
    felt = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshStandardMaterial({ map: feltMap(), roughness: 0.94, metalness: 0, side: THREE.DoubleSide })
    );
    felt.name = 'PHASE386_PROFESSIONAL_SVR_FELT';
    felt.rotation.x = -Math.PI / 2;
    scene.add(felt);
  }
  felt.position.set(info.center.x, info.box.max.y + 0.009, info.center.z);
  felt.scale.set(info.size.x * 0.445, info.size.z * 0.405, 1);
  felt.visible = true;
  state.feltInstalled = true;

  if (!logo) {
    const logoTexture = new THREE.TextureLoader().load('/logo.png', (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 2);
      map.needsUpdate = true;
    });
    logo = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    logo.name = 'PHASE386_SVR_TABLE_LOGO';
    logo.rotation.x = -Math.PI / 2;
    logo.renderOrder = 12;
    scene.add(logo);
  }
  logo.position.set(info.center.x, info.box.max.y + 0.021, info.center.z + info.size.z * 0.03);
  logo.scale.set(info.size.x * 0.34, info.size.z * 0.34, 1);
  logo.visible = true;
  state.logoInstalled = true;
  return true;
}

function normalizeTable() {
  table = candidateTable();
  if (!table?.isObject3D) return false;
  table.visible = true;
  let info = bounds(table);
  if (!validBounds(info)) return false;
  if (info.size.z > info.size.x * 1.1) {
    table.rotation.y += Math.PI / 2;
    info = bounds(table);
  }
  const sx = THREE.MathUtils.clamp(TABLE_TARGET.length / Math.max(info.size.x, 0.001), 0.65, 1.45);
  const sy = THREE.MathUtils.clamp(TABLE_TARGET.height / Math.max(info.size.y, 0.001), 0.65, 1.45);
  const sz = THREE.MathUtils.clamp(TABLE_TARGET.depth / Math.max(info.size.z, 0.001), 0.65, 1.45);
  if (Math.abs(1 - sx) > 0.025 || Math.abs(1 - sy) > 0.025 || Math.abs(1 - sz) > 0.025) {
    table.scale.set(table.scale.x * sx, table.scale.y * sy, table.scale.z * sz);
    info = bounds(table);
  }
  worldDelta(table, new THREE.Vector3(
    TABLE_TARGET.centerX - info.center.x,
    -info.box.min.y,
    TABLE_TARGET.centerZ - info.center.z
  ));
  info = bounds(table);
  let meshes = 0;
  let materials = 0;
  walk(table, (object) => {
    object.visible = true;
    if (!object.isMesh) return;
    meshes += 1;
    materials += polishTableMesh(object, info);
  });
  table.userData = { ...(table.userData || {}), svrPhase386TableAuthority: true, svrPhase386Target: TABLE_TARGET };
  window.SVR_TABLE_AUTHORITY = table;
  window.SVR_PHASE386_TABLE_AUTHORITY = table;
  hideCompetingTables();
  installFeltAndLogo(info);
  state.tableReady = meshes > 0;
  state.tableSized = Math.abs(info.size.x - TABLE_TARGET.length) < 0.18 && Math.abs(info.size.z - TABLE_TARGET.depth) < 0.14;
  state.tableVisibleMeshes = Math.max(state.tableVisibleMeshes, meshes);
  state.tableMaterialsPolished = Math.max(state.tableMaterialsPolished, materials);
  return state.tableReady;
}

function installLighting() {
  if (!scene || !table) return false;
  const info = bounds(table);
  if (!validBounds(info)) return false;
  if (!lighting) {
    lighting = new THREE.Group();
    lighting.name = 'PHASE386_PROFESSIONAL_TABLE_LIGHTING_RIG';
    const ambient = new THREE.AmbientLight(0xd7e7ff, 0.52);
    ambient.name = 'PHASE386_AMBIENT_FILL';
    const hemisphere = new THREE.HemisphereLight(0xbfe9ff, 0x120b18, 1.25);
    hemisphere.name = 'PHASE386_HEMISPHERE_LIGHT';
    const key = new THREE.DirectionalLight(0xffe4b8, 1.95);
    key.name = 'PHASE386_WARM_KEY_LIGHT';
    key.position.set(info.center.x + 2.8, info.box.max.y + 5.2, info.center.z + 3.4);
    key.castShadow = false;
    const fill = new THREE.DirectionalLight(0x8fdfff, 1.15);
    fill.name = 'PHASE386_COOL_FILL_LIGHT';
    fill.position.set(info.center.x - 3.4, info.box.max.y + 3.2, info.center.z - 2.8);
    fill.castShadow = false;
    const dealerLight = new THREE.SpotLight(0xffd79a, 34, 8.5, Math.PI * 0.30, 0.72, 1.3);
    dealerLight.name = 'PHASE386_DEALER_SPOT';
    dealerLight.position.set(info.center.x, info.box.max.y + 3.8, info.box.min.z - 1.5);
    dealerLight.target.position.set(info.center.x, info.box.max.y + 0.55, info.box.min.z - 0.4);
    dealerLight.castShadow = false;
    const playerFill = new THREE.SpotLight(0x8fe8ff, 22, 7.5, Math.PI * 0.34, 0.78, 1.4);
    playerFill.name = 'PHASE386_PLAYER_SIDE_FILL';
    playerFill.position.set(info.center.x, info.box.max.y + 2.8, info.box.max.z + 1.9);
    playerFill.target.position.set(info.center.x, info.box.max.y + 0.15, info.center.z);
    playerFill.castShadow = false;
    lighting.add(ambient, hemisphere, key, fill, dealerLight, dealerLight.target, playerFill, playerFill.target);
    scene.add(lighting);
  }
  lighting.visible = true;
  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    state.rendererExposure = renderer.toneMappingExposure;
  }
  state.lightingInstalled = true;
  return true;
}

function makePatternTexture(kind) {
  if (textureCache.has(kind)) return textureCache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const palette = {
    skin: ['#b87855', '#7a4936', '#edb18b'],
    hair: ['#2d1710', '#0c0705', '#5b3526'],
    shirt: ['#f3f5f7', '#bfc8d1', '#ffffff'],
    suit: ['#20283a', '#070b13', '#51627b'],
    pants: ['#161d2a', '#05070b', '#35445a'],
    shoes: ['#1d1c1b', '#030303', '#5e5549']
  }[kind] || ['#20283a', '#070b13', '#51627b'];
  const gradient = ctx.createLinearGradient(0, 0, 384, 384);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.62, palette[1]);
  gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 384, 384);
  ctx.globalAlpha = kind === 'skin' ? 0.08 : 0.16;
  ctx.strokeStyle = kind === 'skin' ? '#ffe1c5' : '#a9cce4';
  ctx.lineWidth = kind === 'skin' ? 1 : 2;
  const step = kind === 'skin' ? 32 : 14;
  for (let x = -384; x < 768; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 384, 384);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(kind === 'skin' ? 1 : 3, kind === 'skin' ? 1 : 3);
  map.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 2);
  map.needsUpdate = true;
  textureCache.set(kind, map);
  return map;
}

function ericMaterialKind(label, yRatio) {
  const value = label.toLowerCase();
  if (/hair|brow|lash|beard/.test(value)) return 'hair';
  if (/shoe|boot|sole|foot/.test(value)) return 'shoes';
  if (/pant|trouser|jean|leg/.test(value)) return 'pants';
  if (/shirt|collar|cuff|tie/.test(value)) return 'shirt';
  if (/skin|face|head|hand|arm|neck|ear|nose|lip/.test(value)) return 'skin';
  if (yRatio > 0.78) return 'skin';
  if (yRatio < 0.34) return 'pants';
  return 'suit';
}

function textureEric(root) {
  if (!root?.isObject3D) return 0;
  if (root.userData?.svrPhase386Textured) {
    walk(root, (object) => {
      object.visible = true;
      if (object.isMesh) {
        object.frustumCulled = false;
        object.receiveShadow = true;
      }
    });
    return state.ericTexturedMaterials;
  }
  const whole = bounds(root);
  if (!validBounds(whole)) return 0;
  let changed = 0;
  walk(root, (object) => {
    if (!object.isMesh || !object.material) return;
    object.visible = true;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = true;
    const center = bounds(object).center;
    const yRatio = whole.size.y > 0.001 ? (center.y - whole.box.min.y) / whole.size.y : 0.5;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    const next = list.map((source) => {
      const material = source?.clone?.() || new THREE.MeshStandardMaterial();
      const kind = ericMaterialKind(`${object.name || ''} ${source?.name || ''}`, yRatio);
      if (!material.map?.image) material.map = makePatternTexture(kind);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.needsUpdate = true;
      material.color?.setHex?.(0xffffff);
      material.side = THREE.DoubleSide;
      material.visible = true;
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;
      material.depthTest = true;
      if ('roughness' in material) material.roughness = kind === 'skin' ? 0.72 : kind === 'shoes' ? 0.30 : 0.56;
      if ('metalness' in material) material.metalness = kind === 'shoes' ? 0.14 : 0.03;
      if ('emissive' in material) {
        material.emissive.setHex(kind === 'skin' ? 0x120806 : 0x020305);
        material.emissiveIntensity = kind === 'skin' ? 0.08 : 0.03;
      }
      material.userData = { ...(material.userData || {}), svrPhase386EricTexture: kind };
      material.needsUpdate = true;
      changed += 1;
      return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
  });
  root.userData = { ...(root.userData || {}), svrPhase386Textured: true };
  state.ericTexturedMaterials = Math.max(state.ericTexturedMaterials, changed);
  return changed;
}

function findEric() {
  let found = null;
  walk(scene, (object) => {
    if (found || !object?.isObject3D) return;
    if (object.userData?.svrPhase381Approved || object.userData?.svrApprovedDealerRig || object.name === 'PHASE381_APPROVED_CARD_DEALER_RIG') found = object;
  });
  if (found) return found;
  walk(scene, (object) => {
    if (found || !object?.isObject3D) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (ERIC_RX.test(label) && !object.isBone && !object.isSkeletonHelper) found = rootUnderScene(object);
  });
  return found;
}

function uprightAndScaleEric(object) {
  const rotations = [[0,0,0],[-Math.PI/2,0,0],[Math.PI/2,0,0],[0,0,Math.PI/2],[0,0,-Math.PI/2],[0,Math.PI,0]];
  object.position.set(0, 0, 0);
  object.scale.setScalar(1);
  let best = null;
  for (const rotation of rotations) {
    object.rotation.set(...rotation);
    const value = bounds(object);
    const score = value.size.y / Math.max(value.size.x, value.size.z, 0.001);
    if (!best || score > best.score) best = { score, rotation: object.rotation.clone() };
  }
  if (best) object.rotation.copy(best.rotation);
  let value = bounds(object);
  object.scale.multiplyScalar(ERIC_HEIGHT / Math.max(value.size.y, 0.001));
  value = bounds(object);
  object.position.x -= value.center.x;
  object.position.z -= value.center.z;
  object.position.y -= value.box.min.y;
  object.name = 'PHASE381_APPROVED_CARD_DEALER_RIG';
  object.userData = {
    ...(object.userData || {}),
    svrApprovedDealerRig: true,
    svrPhase381Approved: true,
    svrPhase386Approved: true,
    sourceAsset: 'game/assets/models/eric/eric.fbx',
    build: BUILD
  };
}

async function loadEricFallback() {
  if (loadingEric) return loadingEric;
  loadingEric = (async () => {
    try {
      const object = await new FBXLoader().loadAsync(new URL('../assets/models/eric/eric.fbx', import.meta.url).href);
      uprightAndScaleEric(object);
      scene.add(object);
      state.ericFallbackLoaded = true;
      return object;
    } catch (error) {
      state.lastError = `ERIC_LOAD:${error?.message || error}`;
      return null;
    }
  })();
  return loadingEric;
}

function hideDuplicateErics() {
  if (!scene || !eric) return 0;
  const roots = new Set();
  walk(scene, (object) => {
    if (!object?.isObject3D || object === eric || isInside(object, eric)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (ERIC_RX.test(label)) roots.add(rootUnderScene(object));
  });
  let hidden = 0;
  for (const root of roots) {
    if (!root || root === eric || isInside(root, eric)) continue;
    root.visible = false;
    root.userData = { ...(root.userData || {}), svrPhase386DuplicateEricHidden: true };
    hidden += 1;
  }
  state.duplicateEricsHidden = Math.max(state.duplicateEricsHidden, hidden);
  return hidden;
}

function hideExternalSkeletons() {
  if (!scene || !eric) return 0;
  let hidden = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === eric || isInside(object, eric)) return;
    const label = String(object.name || '');
    if (!object.isSkeletonHelper && !SKELETON_RX.test(label)) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase386ExternalSkeletonHidden: true };
    hidden += 1;
  });
  state.externalSkeletonsHidden = Math.max(state.externalSkeletonsHidden, hidden);
  return hidden;
}

function alignEric() {
  if (!eric || !table) return false;
  const info = bounds(table);
  if (!validBounds(info)) return false;
  const eInfo = bounds(eric);
  if (validBounds(eInfo) && Math.abs(eInfo.size.y - ERIC_HEIGHT) > 0.16) {
    eric.scale.multiplyScalar(ERIC_HEIGHT / Math.max(eInfo.size.y, 0.001));
  }
  eric.position.set(info.center.x, 0, info.box.min.z - ERIC_GAP);
  eric.rotation.y = Math.PI;
  eric.visible = true;
  let current = eric.parent;
  while (current) {
    current.visible = true;
    current = current.parent;
  }
  const final = bounds(eric);
  state.ericVisible = true;
  state.ericHeight = Number(final.size.y.toFixed(3));
  return true;
}

async function ensureEric() {
  eric = findEric() || eric;
  if (!eric) eric = await loadEricFallback();
  if (!eric) return false;
  state.ericLoaded = true;
  textureEric(eric);
  alignEric();
  hideDuplicateErics();
  hideExternalSkeletons();
  window.SVR_PHASE386_ERIC_AUTHORITY = eric;
  return true;
}

function computeAnchor() {
  if (!table) return null;
  const info = bounds(table);
  if (!validBounds(info)) return null;
  const frontZ = info.box.max.z + PLAYER_FRONT_GAP;
  const target = new THREE.Vector3(info.center.x, info.box.max.y + 0.10, info.center.z - info.size.z * 0.05);
  return {
    x: info.center.x,
    z: frontZ,
    target,
    tableTopY: info.box.max.y,
    tableCenter: info.center.clone(),
    seatedEyeY: info.box.max.y + 0.56,
    standingEyeY: Math.max(1.58, info.box.max.y + 0.78)
  };
}

function setRigPose(x, y, z, target) {
  const value = rig();
  internalMove = true;
  let ok = false;
  try {
    if (value?.position) {
      value.position.set(x, y, z);
      ok = true;
    } else if (!renderer?.xr?.isPresenting && camera?.position) {
      camera.position.set(x, y + 1.62, z);
      ok = true;
    }
    if (target) {
      const dx = target.x - x;
      const dz = target.z - z;
      if (value?.rotation) value.rotation.y = Math.atan2(-dx, -dz);
      else if (!renderer?.xr?.isPresenting) camera?.lookAt?.(target);
    }
  } finally {
    internalMove = false;
  }
  return ok;
}

function placePlayerFront(reason = 'manual') {
  anchor = computeAnchor();
  if (!anchor) return false;
  const value = rig();
  const head = activeCamera();
  head?.getWorldPosition?.(tmp);
  const seated = seatedNow();
  const currentY = Number(value?.position?.y || 0);
  const desiredEyeY = seated ? anchor.seatedEyeY : anchor.standingEyeY;
  const adjustment = Number.isFinite(tmp.y) && tmp.y > 0.2 ? desiredEyeY - tmp.y : 0;
  const y = seated ? THREE.MathUtils.clamp(currentY + adjustment, -0.72, 0.34) : 0;
  const ok = setRigPose(anchor.x, y, anchor.z, anchor.target);
  if (ok) {
    state.playerFrontApplications += 1;
    state.lastMode = seated ? 'seated-front' : 'standing-front';
    state.lastReason = reason;
  }
  lockTeleport();
  hideTeleportVisuals();
  return ok;
}

function correctPlayerAnchor(time = performance.now()) {
  if (!anchor || time - lastAnchorCorrection < 180) return false;
  lastAnchorCorrection = time;
  const value = rig();
  if (!value?.position) return false;
  const dx = value.position.x - anchor.x;
  const dz = value.position.z - anchor.z;
  if (Math.hypot(dx, dz) <= PLAYER_CORRECTION_TOLERANCE) return false;
  const y = seatedNow() ? value.position.y : 0;
  if (setRigPose(anchor.x, y, anchor.z, anchor.target)) {
    state.playerAnchorCorrections += 1;
    return true;
  }
  return false;
}

function lockTeleport() {
  for (const key of LOCK_FLAGS) {
    if (!savedFlags.has(key)) savedFlags.set(key, window[key]);
    window[key] = false;
  }
  window.SVR_TABLE_MOVEMENT_LOCKED = true;
  window.SVR_PHASE386_FRONT_TABLE_LOCK = true;
  state.teleportLocked = true;
  const value = rig();
  if (value && !wrappedTeleportRigs.has(value)) {
    for (const name of TELEPORT_METHODS) {
      const original = value[name];
      if (typeof original !== 'function') continue;
      value[name] = function phase386TeleportGuard(...args) {
        if (!internalMove) {
          state.teleportMovesBlocked += 1;
          return false;
        }
        return original.apply(this, args);
      };
      state.teleportMethodsWrapped += 1;
    }
    wrappedTeleportRigs.add(value);
  }
  return true;
}

function hideTeleportVisuals() {
  if (!scene) return 0;
  let hidden = 0;
  walk(scene, (object) => {
    const label = String(object?.name || '');
    if (!TELEPORT_VISUAL_RX.test(label) || SAFE_TELEPORT_OBJECT_RX.test(label)) return;
    if (!savedTeleportVisibility.has(object)) savedTeleportVisibility.set(object, object.visible);
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase386TeleportHidden: true };
    hidden += 1;
  });
  state.teleportVisualsHidden = Math.max(state.teleportVisualsHidden, hidden);
  return hidden;
}

function neutralizeForcedQuickSeat() {
  if (autoSeatWrapped) return;
  const stableSeat = window.SVR_PHASE373_STABLE_SEAT;
  const seatLock = window.SVR_PHASE381_SEAT_LOCK;
  if (typeof stableSeat === 'function') {
    window.SVR_PHASE373_STABLE_SEAT = function phase386StableSeat(reason = 'manual', ...rest) {
      if (/phase384-quick-play-demo|quick-play-demo|table-inspection/i.test(String(reason))) {
        state.forcedQuickSeatBlocks += 1;
        return placePlayerFront('phase386-blocked-auto-seat');
      }
      return stableSeat.call(this, reason, ...rest);
    };
  }
  if (typeof seatLock === 'function') {
    window.SVR_PHASE381_SEAT_LOCK = function phase386SeatLock(reason = 'manual', ...rest) {
      if (/phase384-quick-play-demo|quick-play-demo/i.test(String(reason)) && !seatedNow()) {
        state.forcedQuickSeatBlocks += 1;
        return placePlayerFront('phase386-blocked-auto-seat-lock');
      }
      return seatLock.call(this, reason, ...rest);
    };
  }
  autoSeatWrapped = typeof stableSeat === 'function' || typeof seatLock === 'function';
}

function materialLuminance(material) {
  const color = material?.color;
  if (!color) return 1;
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

function cameraAttached(object, head, rootCamera) {
  let current = object?.parent;
  while (current) {
    if (current === head || current === rootCamera || current === camera) return true;
    current = current.parent;
  }
  return false;
}

function planeLike(object) {
  if (!object?.isMesh || !object.geometry) return false;
  const type = String(object.geometry.type || '');
  if (/Plane|Quad/i.test(type)) return true;
  try {
    object.geometry.computeBoundingBox?.();
    const box = object.geometry.boundingBox;
    if (!box) return false;
    const size = box.getSize(tmp2);
    const sorted = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => a - b);
    return sorted[0] < Math.max(0.018, sorted[2] * 0.045) && sorted[2] > 0.16;
  } catch {
    return false;
  }
}

function cleanupHeadOverlay() {
  if (!scene) return 0;
  const rootCamera = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  const head = activeCamera();
  if (!head) return 0;
  head.getWorldPosition(tmp);
  let hidden = 0;
  let unnamed = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === head || object === rootCamera || object === camera) return;
    const name = String(object.name || '');
    if (SAFE_HEAD_OBJECT_RX.test(name)) return;
    const attached = cameraAttached(object, head, rootCamera);
    object.getWorldPosition?.(tmp2);
    const nearHead = tmp2.distanceTo(tmp) < 1.25;
    const materials = object.isMesh ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    const dark = materials.some((material) => material && materialLuminance(material) < 0.22);
    const screenMaterial = materials.some((material) => material && (
      material.depthTest === false
      || material.depthWrite === false
      || material.transparent
      || Number(material.opacity) < 0.985
      || Number(object.renderOrder || 0) >= 50
    ));
    const namedBad = OVERLAY_NAME_RX.test(name);
    const unnamedBad = !name && attached && planeLike(object) && (dark || screenMaterial);
    const nearBad = nearHead && planeLike(object) && dark && screenMaterial;
    if (!(namedBad && (attached || nearHead)) && !unnamedBad && !nearBad) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase386HeadOverlayRemoved: true };
    hidden += 1;
    if (unnamedBad) unnamed += 1;
  });
  for (const key of ['SVR_VIGNETTE_ENABLED', 'SVR_COMFORT_MASK_ENABLED', 'SVR_HEAD_OVERLAY_ENABLED', 'SVR_VISOR_ENABLED', 'SVR_POSTPROCESSING_ENABLED']) window[key] = false;
  try { if (window.SVR_POSTFX) window.SVR_POSTFX.enabled = false; } catch {}
  for (const selector of ['#safeStage', '#log', '#err', '[data-vr-overlay="true"]', '.vr-vignette', '.comfort-mask', '.head-overlay']) {
    document.querySelectorAll(selector).forEach((element) => {
      if (selector === '#safeStage' && !document.body.classList.contains('boot-released')) return;
      element.style.setProperty('display', 'none', 'important');
    });
  }
  state.overlaysHidden = Math.max(state.overlaysHidden, hidden);
  state.unnamedHeadQuadsHidden = Math.max(state.unnamedHeadQuadsHidden, unnamed);
  return hidden;
}

function makeMoonTexture() {
  if (moonTexture) return moonTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, '#8b9099');
  gradient.addColorStop(0.35, '#d9dce1');
  gradient.addColorStop(0.68, '#aeb2ba');
  gradient.addColorStop(1, '#666b75');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i += 1) {
    const x = (i * 137 + 53) % 1024;
    const y = (i * 83 + 31) % 512;
    const radius = 4 + (i % 18) * 2.4;
    const shade = 0.08 + (i % 7) * 0.025;
    ctx.fillStyle = `rgba(32,35,43,${shade})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.25, radius, (i * 0.31) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i += 1) {
    ctx.beginPath();
    ctx.ellipse((i * 193) % 1024, (i * 109) % 512, 55 + (i % 6) * 17, 5 + (i % 5) * 2, i * 0.21, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  moonTexture = new THREE.CanvasTexture(canvas);
  moonTexture.colorSpace = THREE.SRGBColorSpace;
  moonTexture.wrapS = THREE.RepeatWrapping;
  moonTexture.wrapT = THREE.ClampToEdgeWrapping;
  moonTexture.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 2);
  moonTexture.needsUpdate = true;
  return moonTexture;
}

function hideOldMoons() {
  if (!scene || !moon) return 0;
  let hidden = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === moon || isInside(object, moon)) return;
    const name = String(object.name || '');
    if (!MOON_RX.test(name) || /light|label|text|button|portal|reiki/i.test(name)) return;
    if (!object.isMesh && !object.isSprite && !object.isGroup) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase386MoonDuplicateHidden: true };
    hidden += 1;
  });
  state.moonDuplicatesHidden = Math.max(state.moonDuplicatesHidden, hidden);
  return hidden;
}

function installMoon() {
  if (!scene || !table) return false;
  const info = bounds(table);
  if (!validBounds(info)) return false;
  if (!moon) {
    const texture = makeMoonTexture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.045,
      roughness: 0.94,
      metalness: 0,
      emissive: 0x20242b,
      emissiveIntensity: 0.22
    });
    moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_RADIUS, 56, 36), material);
    moon.name = 'PHASE386_AUTHORITATIVE_TEXTURED_MOON';
    moon.frustumCulled = false;
    moon.renderOrder = 4;
    scene.add(moon);
  }
  moon.position.set(
    info.center.x + MOON_OFFSET.x,
    MOON_OFFSET.y,
    info.center.z + MOON_OFFSET.z
  );
  moon.visible = true;
  hideOldMoons();
  state.moonInstalled = true;
  state.moonTextured = Boolean(moon.material?.map?.image || moon.material?.map);
  window.SVR_PHASE386_MOON_AUTHORITY = moon;
  return true;
}

function sweep(reason = 'interval') {
  scene = window.__SVR_SCENE__ || scene;
  camera = window.__SVR_CAMERA__ || camera;
  renderer = window.__SVR_RENDERER__ || renderer;
  state.sceneReady = Boolean(scene && camera && renderer);
  if (!scene) return false;
  neutralizeForcedQuickSeat();
  window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.(`phase386-${reason}`);
  const tableReady = normalizeTable();
  if (tableReady) {
    installLighting();
    installMoon();
    ensureEric();
    if (!anchor) placePlayerFront(`phase386-${reason}`);
  }
  lockTeleport();
  hideTeleportVisuals();
  cleanupHeadOverlay();
  return tableReady;
}

function tick(time = 0) {
  scene = window.__SVR_SCENE__ || scene;
  camera = window.__SVR_CAMERA__ || camera;
  renderer = window.__SVR_RENDERER__ || renderer;
  if (time - lastSweep > 850) {
    lastSweep = time;
    sweep('frame-sweep');
  }
  correctPlayerAnchor(time);
  if (moon?.visible) moon.rotation.y += 0.00042;
  if (eric?.visible) alignEric();
  frameHandle = requestAnimationFrame(tick);
}

function qa() {
  const tableInfo = table?.isObject3D ? bounds(table) : null;
  const head = activeCamera();
  const headPosition = new THREE.Vector3();
  head?.getWorldPosition?.(headPosition);
  state.checkedAt = new Date().toISOString();
  return {
    ...state,
    tableMeasured: tableInfo && validBounds(tableInfo) ? {
      length: Number(tableInfo.size.x.toFixed(3)),
      height: Number(tableInfo.size.y.toFixed(3)),
      depth: Number(tableInfo.size.z.toFixed(3)),
      centerX: Number(tableInfo.center.x.toFixed(3)),
      centerZ: Number(tableInfo.center.z.toFixed(3))
    } : null,
    anchor: anchor ? { x: anchor.x, z: anchor.z, seatedEyeY: anchor.seatedEyeY, standingEyeY: anchor.standingEyeY } : null,
    head: { x: Number(headPosition.x.toFixed(3)), y: Number(headPosition.y.toFixed(3)), z: Number(headPosition.z.toFixed(3)) },
    lockedFlags: Object.fromEntries(LOCK_FLAGS.map((key) => [key, window[key]])),
    pass: !ACTIVE || Boolean(
      state.sceneReady
      && state.tableReady
      && state.tableSized
      && state.feltInstalled
      && state.logoInstalled
      && state.lightingInstalled
      && state.ericLoaded
      && state.ericVisible
      && state.ericTexturedMaterials > 0
      && state.teleportLocked
      && state.moonInstalled
      && state.moonTextured
    )
  };
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  document.body.dataset.questEnvironmentBuild = BUILD;
  for (const eventName of [
    'svr:phase380-original-table-ready',
    'svr:phase381-core-ready',
    'svr:phase384-core-ready',
    'svr:phase373-table-ready',
    'svr:phase361-table-joined',
    'svr:phase361-table-left'
  ]) window.addEventListener(eventName, () => {
    anchor = null;
    sweep(eventName);
    setTimeout(() => placePlayerFront(eventName), 80);
  });
  timer = window.setInterval(() => sweep('interval'), 900);
  frameHandle = requestAnimationFrame(tick);
  for (const delay of [0, 250, 800, 1800, 3600, 6500]) {
    window.setTimeout(() => {
      sweep(`boot-${delay}`);
      if (table) placePlayerFront(`boot-${delay}`);
    }, delay);
  }
  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    cancelAnimationFrame(frameHandle);
  }, { once: true });
}

install();
window.SVR_PHASE386_QUEST_SWEEP = sweep;
window.SVR_PHASE386_PLACE_FRONT = placePlayerFront;
window.SVR_PHASE386_OVERLAY_SWEEP = cleanupHeadOverlay;
window.SVR_PHASE386_LIGHTING_SWEEP = installLighting;
window.SVR_PHASE386_ALIGN_ERIC = alignEric;
window.SVR_PHASE386_QA = qa;
window.SVR_PHASE386_STATE = state;
