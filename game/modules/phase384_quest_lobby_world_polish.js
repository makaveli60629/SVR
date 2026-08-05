/* PHASE-384-QUEST-LOBBY-WORLD-INTERACTION-POLISH-LOCK */
import * as THREE from 'three';
import { applyPhase155SkylineAdRingMoonGlow } from './phase155_skyline_ad_ring_moon_glow.js';

export const BUILD = 'PHASE-384-QUEST-LOBBY-WORLD-INTERACTION-POLISH-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase();
const ACTIVE = platform === 'quest' || params.has('desktop') || params.has('standard');
const TELEPORT_FLAGS = [
  'SVR_TELEPORT_ENABLED','SVR_HAND_TELEPORT_ENABLED','SVR_WATCH_TELEPORT_ENABLED','SVR_GRIP_TELEPORT_ENABLED',
  'SVR_CONTROLLER_TELEPORT_ENABLED','SVR_LEFT_TELEPORT_ENABLED','SVR_RIGHT_TELEPORT_ENABLED','SVR_POINTER_ENABLED',
  'SVR_HAND_RAY_ENABLED','SVR_TABLE_TRAVEL_ENABLED','SVR_LOCOMOTION_ENABLED','SVR_MOVEMENT_ENABLED','SVR_STICK_MOVE_ENABLED'
];
const KEEP_OVERLAY_RX = /(watch|wrist|forearm|hand|controller|card|chip|table|felt|logo|dealer|eric|wall|floor|building|moon|mars)/i;
const BAD_OVERLAY_RX = /(overlay|screen[_ -]?quad|debug[_ -]?(panel|screen|quad)|vignette|comfort[_ -]?mask|fade[_ -]?plane|visor[_ -]?screen|black[_ -]?(square|quad|panel)|play[_ -]?leave[_ -]?panel)/i;
const state = {
  build: BUILD, platform, active: ACTIVE, installed: false,
  blackSquaresHidden: 0, actionPanelHiddenWhileSeated: false,
  lobbyLightsAdded: 0, tableFocusLightsAdded: 0, backgroundDimmed: false,
  autoSeatRequested: false, seated: false, teleportLockPasses: 0,
  watchRestored: false, watchButtonsReady: false,
  tableScaled: false, tableScaleFactor: 1.075, tableLineRemoved: 0,
  feltFitted: false, logoFitted: false,
  ericFound: false, ericFacingPlayer: false, ericTexturedMaterials: 0, duplicateEricsHidden: 0, skeletonsHidden: 0,
  physicalCards: 0, physicalChips: 0, grabs: 0, releases: 0, collisions: 0,
  fourthWallReady: false, skylineReady: false, buildingsVisible: 0, adsReady: 0,
  moonReady: false, marsReady: false, moonGlowReady: false, movingReflectionLight: false,
  ambienceEnabled: localStorage.getItem('svrAmbientEnabled') !== 'false', ambienceUnlocked: false, soundEvents: 0,
  spotifyLauncherReady: false, lastError: null, installedAt: null, checkedAt: null
};

let scene = null, camera = null, renderer = null, table = null, eric = null;
let worldRoot = null, lightingRoot = null, focusRoot = null, watchRoot = null, watchScreen = null, watchTexture = null;
let felt = null, tableLogo = null, interactionRoot = null, worldPolishRoot = null, planetRoot = null, moon = null, marsPivot = null, mars = null, moonGlow = null, moonLight = null;
let fourthWall = null, timer = 0, raf = 0, lastSweep = 0, autoSeatTimer = 0, audioContext = null, ambienceNodes = [];
const savedLightIntensity = new WeakMap();
const grabbables = new Set();
const held = new Map();
const physics = new Map();
const controllers = [];
const hands = [];
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const raycaster = new THREE.Raycaster();
const textureCache = new Map();

function walk(root, visitor, limit = 28000) {
  const stack = root ? [root] : [];
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
function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}
function isInside(object, root) {
  let current = object;
  while (current) { if (current === root) return true; current = current.parent; }
  return false;
}
function seatedNow() {
  return Boolean(window.SVR_PHASE361_STATE?.seated || window.SVR_PHASE381_STATE?.seated || document.body.classList.contains('svr361-seated') || document.body.dataset.svrSeated === 'true');
}
function activeCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}
function getTable() {
  const candidate = window.SVR_TABLE_AUTHORITY || window.SVR_PHASE380_ORIGINAL_TABLE || table;
  if (!candidate?.isObject3D) return null;
  const info = bounds(candidate);
  if (info.box.isEmpty() || info.size.x < 1.4 || info.size.z < 0.7) return null;
  table = candidate;
  return table;
}
function approvedEric() {
  let found = null;
  walk(scene, (object) => {
    if (found) return;
    if (object.userData?.svrPhase381Approved || object.userData?.svrApprovedDealerRig || object.name === 'PHASE381_APPROVED_CARD_DEALER_RIG') found = object;
  });
  return found;
}
function rootUnderScene(object) {
  let current = object;
  while (current?.parent && current.parent !== scene && current.parent !== worldRoot) current = current.parent;
  return current || object;
}
function worldDelta(object, delta) {
  if (!object?.parent) { object?.position?.add(delta); return; }
  object.parent.updateWorldMatrix?.(true, false);
  object.parent.getWorldQuaternion(tmpQ).invert();
  const scale = object.parent.getWorldScale(tmp3);
  tmp.copy(delta).applyQuaternion(tmpQ);
  tmp.x /= Math.abs(scale.x) > 1e-6 ? scale.x : 1;
  tmp.y /= Math.abs(scale.y) > 1e-6 ? scale.y : 1;
  tmp.z /= Math.abs(scale.z) > 1e-6 ? scale.z : 1;
  object.position.add(tmp);
}
function canvasTexture(key, width, height, draw) {
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

function cleanupBlackSquare() {
  const head = activeCamera();
  if (!scene || !head) return 0;
  head.getWorldPosition(tmp);
  let hidden = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === head || KEEP_OVERLAY_RX.test(String(object.name || ''))) return;
    const name = String(object.name || '');
    object.getWorldPosition?.(tmp2);
    const nearHead = tmp2.distanceTo(tmp) < 1.15;
    const geometryType = String(object.geometry?.type || '');
    const planar = /Plane|Box/.test(geometryType);
    const materials = object.isMesh ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    const black = materials.some((material) => {
      if (!material) return false;
      const color = material.color?.getRGB?.({ r: 0, g: 0, b: 0 });
      const dark = color ? color.r + color.g + color.b < 0.16 : false;
      return dark && !material.map && (material.depthTest === false || material.transparent || Number(material.opacity) < 1);
    });
    let attached = false, parent = object.parent;
    while (parent) { if (parent === head || parent === camera) { attached = true; break; } parent = parent.parent; }
    if (BAD_OVERLAY_RX.test(name) || ((attached || nearHead) && planar && black)) {
      object.visible = false;
      object.userData = { ...(object.userData || {}), svrPhase384BlackSquareRemoved: true };
      hidden += 1;
    }
  });
  const actionPanel = scene.getObjectByName?.('PHASE361_QUEST_PLAY_LEAVE_PANEL_ROOT');
  if (actionPanel) {
    actionPanel.visible = !seatedNow();
    state.actionPanelHiddenWhileSeated = seatedNow() && !actionPanel.visible;
  }
  state.blackSquaresHidden = Math.max(state.blackSquaresHidden, hidden);
  return hidden;
}

function ensureLighting() {
  if (!scene || lightingRoot) return lightingRoot;
  lightingRoot = new THREE.Group();
  lightingRoot.name = 'PHASE384_PROFESSIONAL_LOBBY_LIGHTING_ROOT';
  const hemi = new THREE.HemisphereLight(0xc8e9ff, 0x12091c, 1.35);
  hemi.name = 'PHASE384_LOBBY_HEMISPHERE';
  lightingRoot.add(hemi);
  const ambient = new THREE.AmbientLight(0x8eb5cc, 0.42);
  ambient.name = 'PHASE384_LOBBY_AMBIENT';
  lightingRoot.add(ambient);
  const palette = [0x66eaff, 0xb36cff, 0xffcf6a, 0x8dffb4];
  const positions = [[-16,7,-14],[16,7,-14],[-16,7,14],[16,7,14]];
  positions.forEach((position, index) => {
    const light = new THREE.PointLight(palette[index], 3.2, 34, 1.7);
    light.name = `PHASE384_LOBBY_ACCENT_${index}`;
    light.position.set(...position);
    lightingRoot.add(light);
  });
  scene.add(lightingRoot);
  state.lobbyLightsAdded = lightingRoot.children.length;
  return lightingRoot;
}
function ensureFocusLights() {
  const tableObject = getTable();
  if (!tableObject || focusRoot) return focusRoot;
  const info = bounds(tableObject);
  focusRoot = new THREE.Group();
  focusRoot.name = 'PHASE384_TABLE_FOCUS_LIGHTING_ROOT';
  const configs = [
    [-1.65, 3.2, 1.2, 0xffffff, 5.4],
    [1.65, 3.0, 0.8, 0x9feaff, 4.6],
    [0, 2.6, -1.4, 0xffd98a, 3.6]
  ];
  configs.forEach(([x,y,z,color,intensity], index) => {
    const light = new THREE.SpotLight(color, intensity, 9, Math.PI * 0.32, 0.65, 1.35);
    light.name = `PHASE384_TABLE_SPOT_${index}`;
    light.position.set(info.center.x + x, info.box.max.y + y, info.center.z + z);
    light.target.position.set(info.center.x, info.box.max.y, info.center.z);
    focusRoot.add(light, light.target);
  });
  scene.add(focusRoot);
  state.tableFocusLightsAdded = 3;
  return focusRoot;
}
function updateLightingFocus() {
  ensureLighting(); ensureFocusLights();
  const seated = seatedNow();
  state.seated = seated;
  walk(scene, (object) => {
    if (!object?.isLight || isInside(object, focusRoot) || object === moonLight) return;
    if (!savedLightIntensity.has(object)) savedLightIntensity.set(object, Number(object.intensity || 0));
    const base = savedLightIntensity.get(object);
    if (seated) object.intensity = isInside(object, lightingRoot) ? base * 0.34 : base * 0.26;
    else object.intensity = base;
  });
  if (focusRoot) focusRoot.visible = seated;
  if (moonLight) moonLight.intensity = seated ? 1.2 : 3.8;
  state.backgroundDimmed = seated;
}

function removeTableFloorLine() {
  const tableObject = getTable();
  if (!tableObject || !scene) return 0;
  const info = bounds(tableObject);
  let removed = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === tableObject || isInside(object, tableObject) || object === felt || object === tableLogo) return;
    const name = String(object.name || '');
    if (!/(reference[_ -]?line|resting[_ -]?line|floor[_ -]?line|baseline|guide[_ -]?line|table[_ -]?bottom[_ -]?line)/i.test(name)) return;
    const value = bounds(object);
    if (value.box.isEmpty()) return;
    const nearFloor = value.box.max.y < Math.max(0.28, info.box.min.y + 0.2);
    if (!nearFloor) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase384FloorLineRemoved: true };
    removed += 1;
  });
  state.tableLineRemoved = Math.max(state.tableLineRemoved, removed);
  return removed;
}
function scaleTableSlightly() {
  const object = getTable();
  if (!object || object.userData?.svrPhase384Scaled) { state.tableScaled = Boolean(object?.userData?.svrPhase384Scaled); return state.tableScaled; }
  const before = bounds(object);
  const factor = state.tableScaleFactor;
  object.scale.x *= factor; object.scale.z *= factor; object.scale.y *= 1.025;
  const after = bounds(object);
  worldDelta(object, before.center.clone().sub(after.center));
  object.userData = { ...(object.userData || {}), svrPhase384Scaled: true, svrPhase384ScaleFactor: factor };
  state.tableScaled = true;
  return true;
}
function findSurfaceInfo(object) {
  const whole = bounds(object);
  let best = null;
  walk(object, (mesh) => {
    if (!mesh.isMesh) return;
    const label = `${mesh.name || ''} ${Array.isArray(mesh.material) ? mesh.material.map(m => m?.name || '').join(' ') : mesh.material?.name || ''}`;
    const value = bounds(mesh);
    if (value.box.isEmpty() || value.size.x < whole.size.x * 0.42 || value.size.z < whole.size.z * 0.38) return;
    const horizontal = value.size.y < Math.max(0.2, Math.min(value.size.x, value.size.z) * 0.16);
    const score = (/(felt|cloth|baize|surface|top|playing)/i.test(label) ? 20 : 0) + (horizontal ? 8 : 0) + value.center.y;
    if (!best || score > best.score) best = { ...value, score };
  });
  return best || {
    box: whole.box,
    size: new THREE.Vector3(whole.size.x * 0.82, 0.02, whole.size.z * 0.72),
    center: new THREE.Vector3(whole.center.x, whole.box.min.y + whole.size.y * 0.72, whole.center.z)
  };
}
function feltTexture() {
  return canvasTexture('phase384-fitted-felt', 1024, 512, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w/2,h/2,10,w/2,h/2,w*.58);
    gradient.addColorStop(0,'#153b2b'); gradient.addColorStop(.68,'#071d15'); gradient.addColorStop(1,'#02100b');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = .13;
    for (let i=0;i<6500;i++) { const value=80+Math.floor(Math.random()*80); ctx.fillStyle=`rgb(${value-30},${value},${value-35})`; ctx.fillRect(Math.random()*w,Math.random()*h,1,1); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle='#d9b862'; ctx.lineWidth=8; ctx.beginPath(); ctx.ellipse(w/2,h/2,w*.44,h*.39,0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(w/2,h/2,w*.385,h*.33,0,0,Math.PI*2); ctx.stroke();
  });
}
function fitFeltAndLogo() {
  const object = getTable();
  if (!object || !scene) return false;
  const existingFelt = scene.getObjectByName?.('PHASE384_PROFESSIONAL_SVR_FELT');
  const existingLogo = scene.getObjectByName?.('PHASE384_SVR_TABLE_LOGO');
  if (existingFelt && existingFelt !== felt) existingFelt.visible = false;
  if (existingLogo && existingLogo !== tableLogo) existingLogo.visible = false;
  const surface = findSurfaceInfo(object);
  const insetX = surface.size.x * 0.43;
  const insetZ = surface.size.z * 0.39;
  const y = surface.center.y + Math.max(0.003, surface.size.y * 0.5 + 0.002);
  if (!felt) {
    felt = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: .94, metalness: 0, side: THREE.DoubleSide }));
    felt.name = 'PHASE384_FITTED_INSET_SVR_FELT';
    felt.rotation.x = -Math.PI / 2;
    scene.add(felt);
  }
  felt.position.set(surface.center.x, y, surface.center.z);
  felt.scale.set(insetX, insetZ, 1);
  felt.visible = true;
  if (!tableLogo) {
    const logoMap = new THREE.TextureLoader().load('/logo.png', (map) => { map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true; });
    tableLogo = new THREE.Mesh(new THREE.PlaneGeometry(1, .55), new THREE.MeshBasicMaterial({ map: logoMap, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    tableLogo.name = 'PHASE384_FITTED_SVR_TABLE_LOGO';
    tableLogo.rotation.x = -Math.PI / 2;
    scene.add(tableLogo);
  }
  tableLogo.position.set(surface.center.x, y + .004, surface.center.z);
  tableLogo.scale.set(Math.min(surface.size.x * .32, .9), Math.min(surface.size.z * .28, .42), 1);
  tableLogo.visible = true;
  state.feltFitted = true; state.logoFitted = true;
  return true;
}

function materialKind(label = '', ratio = .5) {
  const text = label.toLowerCase();
  if (/hair|brow|lash|beard/.test(text)) return 'hair';
  if (/shoe|boot|sole|foot/.test(text)) return 'shoes';
  if (/pant|trouser|jean|leg/.test(text)) return 'pants';
  if (/shirt|collar|cuff|tie/.test(text)) return 'shirt';
  if (/skin|face|head|hand|arm|neck|ear|nose|lip/.test(text) || ratio > .78) return 'skin';
  return ratio < .32 ? 'pants' : 'suit';
}
function avatarTexture(kind) {
  const palette = {
    skin:['#b87959','#75412f'], hair:['#27140d','#090403'], shirt:['#f5f6f8','#aab5c2'],
    suit:['#27203a','#070911'], pants:['#171c28','#05070b'], shoes:['#1a1718','#030303']
  }[kind] || ['#27203a','#070911'];
  return canvasTexture(`phase384-eric-${kind}`, 512, 512, (ctx,w,h) => {
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,palette[0]); g.addColorStop(1,palette[1]); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=kind==='skin'?.08:.18; ctx.strokeStyle=kind==='skin'?'#ffe2c8':'#9baac2'; ctx.lineWidth=2;
    for(let i=-w;i<w*2;i+=kind==='skin'?42:18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+w,h);ctx.stroke();}
    ctx.globalAlpha=1;
  });
}
function textureEric() {
  eric = approvedEric() || eric;
  if (!eric) return 0;
  const whole = bounds(eric);
  let changed = 0;
  walk(eric, (object) => {
    if (!object.isMesh || !object.material) return;
    const value = bounds(object);
    const ratio = whole.size.y > .001 ? (value.center.y - whole.box.min.y) / whole.size.y : .5;
    const sources = Array.isArray(object.material) ? object.material : [object.material];
    const next = sources.map((source) => {
      if (source?.userData?.svrPhase384WorldTextureApplied) return source;
      const kind = materialKind(`${object.name || ''} ${source?.name || ''}`, ratio);
      const material = source?.clone?.() || new THREE.MeshStandardMaterial();
      if (!material.map?.image) material.map = avatarTexture(kind);
      material.map.colorSpace = THREE.SRGBColorSpace; material.map.needsUpdate = true;
      material.color?.set?.(0xffffff); material.side = THREE.DoubleSide; material.transparent = false; material.opacity = 1;
      if ('roughness' in material) material.roughness = kind === 'skin' ? .72 : kind === 'shoes' ? .3 : .55;
      if ('metalness' in material) material.metalness = kind === 'shoes' ? .16 : .04;
      material.emissive?.setHex?.(kind === 'suit' ? 0x080510 : 0x000000);
      material.emissiveIntensity = kind === 'suit' ? .08 : 0;
      material.userData = { ...(material.userData || {}), svrPhase384WorldTextureApplied: kind };
      material.needsUpdate = true; changed += 1; return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true; object.frustumCulled = false; object.receiveShadow = true;
  });
  eric.userData = { ...(eric.userData || {}), svrPhase384FullyTextured: true };
  state.ericTexturedMaterials = Math.max(state.ericTexturedMaterials, changed);
  return changed;
}
function alignEricToPlayer() {
  const object = getTable();
  eric = approvedEric() || eric;
  if (!object || !eric) return false;
  const info = bounds(object);
  eric.position.set(info.center.x, 0, info.box.min.z - .48);
  eric.rotation.set(eric.rotation.x, 0, eric.rotation.z);
  eric.visible = true;
  state.ericFound = true; state.ericFacingPlayer = true;
  return true;
}
function dedupeEricAndSkeletons() {
  if (!scene || !eric) return;
  let duplicates = 0, skeletons = 0;
  const roots = new Set();
  walk(scene, (object) => {
    if (object === eric || isInside(object, eric)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (/eric|approvedDealer|card[_ -]?dealer[_ -]?rig/i.test(label)) roots.add(rootUnderScene(object));
    if (object.isSkeletonHelper || object.isBone || /skeleton[_ -]?helper|armature[_ -]?debug|bone[_ -]?structure|phase368_card_dealer_root/i.test(label)) {
      const root = object.isBone ? rootUnderScene(object) : object;
      root.visible = false; root.userData = { ...(root.userData || {}), svrPhase384SkeletonHidden: true }; skeletons += 1;
    }
  });
  for (const root of roots) {
    if (!root || root === eric || isInside(root, eric)) continue;
    root.visible = false; root.userData = { ...(root.userData || {}), svrPhase384DuplicateEricHidden: true }; duplicates += 1;
  }
  state.duplicateEricsHidden = Math.max(state.duplicateEricsHidden, duplicates);
  state.skeletonsHidden = Math.max(state.skeletonsHidden, skeletons);
}

function ensureWorldPolishRoot() {
  if (worldPolishRoot || !scene) return worldPolishRoot;
  worldPolishRoot = new THREE.Group(); worldPolishRoot.name = 'PHASE384_LOBBY_WORLD_POLISH_ROOT'; scene.add(worldPolishRoot); return worldPolishRoot;
}
function ensureFourthWall() {
  if (!scene || fourthWall) return fourthWall;
  const root = ensureWorldPolishRoot();
  fourthWall = new THREE.Group(); fourthWall.name = 'PHASE384_FOURTH_LOBBY_WALL';
  const wallMat = new THREE.MeshStandardMaterial({ color:0x171323, roughness:.62, metalness:.2, emissive:0x08040f, emissiveIntensity:.22 });
  const trimMat = new THREE.MeshStandardMaterial({ color:0xc6a858, roughness:.28, metalness:.72, emissive:0x241702, emissiveIntensity:.25 });
  const panelMat = new THREE.MeshStandardMaterial({ color:0x241438, roughness:.48, metalness:.16, emissive:0x160622, emissiveIntensity:.3 });
  const z = -22.5, height = 9, width = 44, opening = 8.5;
  const left = new THREE.Mesh(new THREE.BoxGeometry((width-opening)/2,height,.42),wallMat); left.position.set(-(opening/2+(width-opening)/4),height/2,z);
  const right = left.clone(); right.position.x *= -1;
  const top = new THREE.Mesh(new THREE.BoxGeometry(opening,2.2,.42),wallMat); top.position.set(0,height-1.1,z);
  fourthWall.add(left,right,top);
  for(const x of [-width/2,-opening/2,opening/2,width/2]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.48,height+.5,.65),trimMat);pillar.position.set(x,height/2,z+.02);fourthWall.add(pillar);}
  for(let i=0;i<6;i++){const panel=new THREE.Mesh(new THREE.BoxGeometry(4.4,2.1,.08),panelMat);panel.position.set(-15+i*6,4.8,z+.26);fourthWall.add(panel);}
  const header = new THREE.Mesh(new THREE.BoxGeometry(width+.6,.28,.72),trimMat); header.position.set(0,height+.05,z); fourthWall.add(header);
  root.add(fourthWall); state.fourthWallReady = true; return fourthWall;
}
function adTexture(title, subtitle, accent) {
  return canvasTexture(`phase384-ad-${title}`, 1024, 512, (ctx,w,h) => {
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#02040a');g.addColorStop(.5,'#101326');g.addColorStop(1,'#040109');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=accent;ctx.lineWidth=18;ctx.strokeRect(24,24,w-48,h-48);ctx.shadowColor=accent;ctx.shadowBlur=28;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 92px system-ui';ctx.fillText(title,w/2,225,w-90);ctx.shadowBlur=0;ctx.fillStyle=accent;ctx.font='800 42px system-ui';ctx.fillText(subtitle,w/2,330,w-100);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(120,380,w-240,54);
  });
}
function ensureSkylineAndAds() {
  if (!scene) return false;
  try { applyPhase155SkylineAdRingMoonGlow({ scene, log:()=>{}, setStatus:()=>{} }, {}); } catch {}
  const buildings = [];
  walk(scene, (object) => { if (object?.isGroup && /(SKYLINE.*BUILDING|AD BUILDING|BACKDROP BUILDING)/i.test(String(object.name || ''))) buildings.push(object); });
  if (!buildings.length) {
    const root = ensureWorldPolishRoot();
    for(let i=0;i<24;i++){
      const angle=i/24*Math.PI*2, width=6+(i%4), height=22+(i%7)*3.2;
      const group=new THREE.Group();group.name=`PHASE384_SKYLINE_BUILDING_${i}`;group.position.set(Math.cos(angle)*64,0,Math.sin(angle)*64);group.lookAt(0,0,0);
      const body=new THREE.Mesh(new THREE.BoxGeometry(width,height,2.6),new THREE.MeshStandardMaterial({color:0x101827,roughness:.44,metalness:.34,emissive:0x030916,emissiveIntensity:.22}));body.position.y=height/2;body.name='PHASE384_REFLECTIVE_BUILDING_BODY';group.add(body);root.add(group);buildings.push(group);
    }
  }
  buildings.forEach((group,index)=>{
    group.visible = index < 24;
    if (!group.visible) return;
    group.traverse((mesh)=>{if(!mesh.isMesh||!mesh.material)return;const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];list.forEach((m)=>{if('metalness'in m)m.metalness=Math.max(.3,Number(m.metalness||0));if('roughness'in m)m.roughness=Math.min(.48,Number(m.roughness??.48));m.needsUpdate=true;});});
    if(index>=12)return;
    if(group.getObjectByName?.('PHASE384_MARKETING_TIER_AD'))return;
    const body=group.children.find(c=>c.isMesh&&c.geometry?.type==='BoxGeometry');
    const p=body?.geometry?.parameters||{width:7,height:28,depth:2.6};
    const tier=index<4?1:index<8?2:3;
    const content=index%3===0?['ESPRESSO','COFFEE WITH CREAM','#ffd36a']:index%3===1?['ALL-IN','PLAY BOLD • WIN BIG','#ff4f78']:['SVR POKER','PREMIUM SOCIAL VR','#7ffcff'];
    const ad=new THREE.Mesh(new THREE.PlaneGeometry((p.width||7)*(tier===1?.95:.82),(p.height||28)*(tier===1?.34:tier===2?.24:.17)),new THREE.MeshBasicMaterial({map:adTexture(...content),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    ad.name='PHASE384_MARKETING_TIER_AD';ad.userData.svrMarketingTier=tier;ad.position.set(0,(p.height||28)*.62,(p.depth||2.6)/2+.08);group.add(ad);
  });
  state.buildingsVisible = buildings.filter(b=>b.visible).length; state.adsReady = Math.min(12,buildings.length); state.skylineReady = state.buildingsVisible>=16; return true;
}
function moonTexture() {
  return canvasTexture('phase384-moon-craters',1024,512,(ctx,w,h)=>{
    const g=ctx.createRadialGradient(w*.42,h*.35,20,w*.5,h*.5,w*.64);g.addColorStop(0,'#fff');g.addColorStop(.45,'#cfd7df');g.addColorStop(1,'#697582');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const seed=(n)=>{const x=Math.sin(n*999)*43758.5453;return x-Math.floor(x)};
    for(let i=0;i<180;i++){const x=seed(i)*w,y=seed(i+200)*h,r=4+seed(i+400)*34;const c=ctx.createRadialGradient(x-r*.25,y-r*.25,1,x,y,r);c.addColorStop(0,'rgba(255,255,255,.35)');c.addColorStop(.4,'rgba(80,90,100,.4)');c.addColorStop(1,'rgba(20,25,30,0)');ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  });
}
function marsTexture() {
  return canvasTexture('phase384-mars',512,256,(ctx,w,h)=>{const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#9b3d25');g.addColorStop(.5,'#d06a36');g.addColorStop(1,'#5c2119');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.28;for(let i=0;i<110;i++){ctx.fillStyle=i%2?'#43150e':'#ef9b5c';ctx.beginPath();ctx.ellipse(Math.random()*w,Math.random()*h,4+Math.random()*28,2+Math.random()*12,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;});
}
function glowTexture() {
  return canvasTexture('phase384-moon-glow',512,512,(ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,8,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(215,235,255,.48)');g.addColorStop(.58,'rgba(112,180,255,.18)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);});
}
function ensurePlanets() {
  if (!scene || planetRoot) return planetRoot;
  const root=ensureWorldPolishRoot();
  walk(scene,(object)=>{if(isInside(object,root))return;const name=String(object.name||'');if(/(^|[^a-z])(moon|mars)([^a-z]|$)/i.test(name)){object.visible=false;object.userData={...(object.userData||{}),svrPhase384PlanetReplaced:true};}});
  planetRoot=new THREE.Group();planetRoot.name='PHASE384_AUTHORITATIVE_MOON_MARS_ROOT';
  moon=new THREE.Mesh(new THREE.SphereGeometry(5.8,48,32),new THREE.MeshStandardMaterial({map:moonTexture(),roughness:.82,metalness:.04,emissive:0x26384a,emissiveIntensity:.34}));moon.name='PHASE384_TEXTURED_GLOWING_MOON';planetRoot.add(moon);
  moonGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,opacity:.62}));moonGlow.name='PHASE384_RADIANT_MOON_GLOW';moonGlow.scale.set(18,18,1);planetRoot.add(moonGlow);
  marsPivot=new THREE.Group();marsPivot.name='PHASE384_MARS_ORBIT_PIVOT';moon.add(marsPivot);
  mars=new THREE.Mesh(new THREE.SphereGeometry(1.7,32,22),new THREE.MeshStandardMaterial({map:marsTexture(),roughness:.88,emissive:0x2b0904,emissiveIntensity:.15}));mars.name='PHASE384_TEXTURED_MARS';mars.position.set(10.5,1.6,0);marsPivot.add(mars);
  moonLight=new THREE.PointLight(0xbadfff,3.8,105,1.25);moonLight.name='PHASE384_MOVING_MOON_REFLECTION_LIGHT';moonLight.position.copy(moon.position);planetRoot.add(moonLight);
  root.add(planetRoot);state.moonReady=true;state.marsReady=true;state.moonGlowReady=true;state.movingReflectionLight=true;return planetRoot;
}
function updatePlanets(time) {
  if (!planetRoot || !moon || !marsPivot) return;
  const t=time*.001, angle=t*.016;
  moon.position.set(Math.cos(angle)*43,25+Math.sin(t*.06)*2.2,Math.sin(angle)*43);
  moon.rotation.y=t*.018;moonGlow.position.copy(moon.position);moonGlow.scale.setScalar(17+Math.sin(t*.8)*1.4);
  moonLight.position.copy(moon.position);marsPivot.rotation.y=t*.22;mars.rotation.y=t*.12;
}

function cardTexture(face=false) {
  const key=face?'phase384-card-face':'phase384-card-back';
  return canvasTexture(key,512,768,(ctx,w,h)=>{
    roundRect(ctx,8,8,w-16,h-16,44);ctx.fillStyle=face?'#f9f5e9':'#10052a';ctx.fill();ctx.strokeStyle=face?'#18131f':'#7ffcff';ctx.lineWidth=14;ctx.stroke();
    if(face){ctx.fillStyle='#8b1235';ctx.textAlign='center';ctx.font='900 190px Georgia';ctx.fillText('A',w/2,250);ctx.font='900 260px Georgia';ctx.fillText('♥',w/2,540);}else{ctx.fillStyle='#fff';ctx.textAlign='center';ctx.shadowColor='#7ffcff';ctx.shadowBlur=28;ctx.font='900 130px system-ui';ctx.fillText('SVR',w/2,330);ctx.shadowBlur=0;ctx.fillStyle='#ffd98a';ctx.font='900 52px system-ui';ctx.fillText('POKER',w/2,410);}
  });
}
function chipTexture(color,key) {
  return canvasTexture(`phase384-chip-${key}`,256,256,(ctx,w,h)=>{ctx.fillStyle=color;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#fff';ctx.lineWidth=18;ctx.beginPath();ctx.arc(w/2,h/2,100,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#05070d';ctx.beginPath();ctx.arc(w/2,h/2,58,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 42px system-ui';ctx.fillText('SVR',w/2,143);});
}
function registerPhysics(object, kind, radius=.04) {
  object.userData={...(object.userData||{}),svrPhase384Grabbable:true,svrPhysicsKind:kind};grabbables.add(object);physics.set(object,{velocity:new THREE.Vector3(),radius,held:false,home:object.position.clone(),lastPosition:new THREE.Vector3()});return object;
}
function ensureInteractionKit() {
  const object=getTable();if(!object||interactionRoot)return interactionRoot;
  const surface=findSurfaceInfo(object),y=surface.center.y+Math.max(.018,surface.size.y*.5+.008);
  interactionRoot=new THREE.Group();interactionRoot.name='PHASE384_PHYSICAL_CARD_CHIP_KIT';scene.add(interactionRoot);
  const cardGeometry=new THREE.BoxGeometry(.064,.002,.09);
  const faceMat=new THREE.MeshStandardMaterial({map:cardTexture(true),roughness:.7,side:THREE.DoubleSide});
  const backMat=new THREE.MeshStandardMaterial({map:cardTexture(false),roughness:.62,side:THREE.DoubleSide});
  for(let i=0;i<2;i++){const card=new THREE.Mesh(cardGeometry,[backMat,backMat,backMat,backMat,faceMat,backMat]);card.name=`PHASE384_GRABBABLE_PLAYER_CARD_${i}`;card.position.set(surface.center.x+(i-.5)*.085,y,surface.center.z+surface.size.z*.27);registerPhysics(card,'card',.052);interactionRoot.add(card);}
  const colors=[['#d13848','red'],['#2a68d8','blue'],['#151820','black'],['#e8d7ae','white']];
  for(let i=0;i<16;i++){const [color,key]=colors[i%colors.length];const chip=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.009,24),new THREE.MeshStandardMaterial({map:chipTexture(color,key),roughness:.48,metalness:.08}));chip.name=`PHASE384_GRABBABLE_CHIP_${i}`;chip.rotation.x=Math.PI/2;chip.position.set(surface.center.x+surface.size.x*.29+(i%4)*.014,y+.008+Math.floor(i/4)*.009,surface.center.z+surface.size.z*.23);registerPhysics(chip,'chip',.03);interactionRoot.add(chip);}
  state.physicalCards=2;state.physicalChips=16;return interactionRoot;
}
function controllerRay(controller) {
  controller.updateWorldMatrix?.(true,false);controller.getWorldPosition(tmp);controller.getWorldQuaternion(tmpQ);tmp2.set(0,0,-1).applyQuaternion(tmpQ).normalize();raycaster.set(tmp,tmp2);raycaster.far=1.8;return raycaster;
}
function nearestGrabbable(position,max=.11) {
  let best=null,bestDistance=max;
  for(const object of grabbables){if(!object.visible||physics.get(object)?.held)continue;object.getWorldPosition(tmp2);const d=tmp2.distanceTo(position);if(d<bestDistance){bestDistance=d;best=object;}}return best;
}
function beginGrab(holder,object) {
  if(!holder||!object||held.has(holder))return false;const body=physics.get(object);if(!body||body.held)return false;
  object.updateWorldMatrix?.(true,true);holder.updateWorldMatrix?.(true,true);holder.attach(object);body.held=true;body.velocity.set(0,0,0);body.lastPosition.copy(object.getWorldPosition(tmp3));held.set(holder,object);state.grabs++;playSound(body.kind==='chip'?'chip':'card');return true;
}
function endGrab(holder) {
  const object=held.get(holder);if(!object)return false;const body=physics.get(object);object.getWorldPosition(tmp);scene.attach(object);object.position.copy(tmp);body.held=false;body.velocity.copy(tmp).sub(body.lastPosition).multiplyScalar(18).clampLength(0,2.2);held.delete(holder);state.releases++;playSound(body.kind==='chip'?'chip':'card');return true;
}
function onSelectStart(event) {
  const holder=event.currentTarget||event.target;if(!holder||held.has(holder))return;
  const watchHit=watchRoot?controllerRay(holder).intersectObject(watchRoot,true)[0]:null;
  if(watchHit?.object?.userData?.svrWatchAction==='music'){toggleAmbience();return;}
  if(watchHit?.object?.userData?.svrWatchAction==='spotify'){openSpotify();return;}
  const hits=controllerRay(holder).intersectObjects([...grabbables],true);const hit=hits.find(v=>v.object?.userData?.svrPhase384Grabbable);if(hit)beginGrab(holder,hit.object);
}
function onSelectEnd(event){endGrab(event.currentTarget||event.target);}
function setupInputSources() {
  if(!renderer?.xr)return;
  for(let i=0;i<2;i++){
    const controller=renderer.xr.getController?.(i);if(controller&&!controller.userData.svrPhase384Physics){controller.userData.svrPhase384Physics=true;controller.addEventListener('selectstart',onSelectStart);controller.addEventListener('selectend',onSelectEnd);controllers.push(controller);}
    const hand=renderer.xr.getHand?.(i);if(hand&&!hands.includes(hand))hands.push(hand);
  }
}
function updateHandPinches() {
  for(const hand of hands){const thumb=hand.joints?.['thumb-tip'],index=hand.joints?.['index-finger-tip'];if(!thumb||!index)continue;thumb.getWorldPosition(tmp);index.getWorldPosition(tmp2);const pinching=tmp.distanceTo(tmp2)<.029;const was=Boolean(hand.userData.svrPhase384Pinching);if(pinching&&!was){const point=tmp.add(tmp2).multiplyScalar(.5);const object=nearestGrabbable(point,.12);if(object)beginGrab(index,object);}else if(!pinching&&was){endGrab(index);}hand.userData.svrPhase384Pinching=pinching;}
}
function updatePhysics(dt) {
  const object=getTable();if(!object)return;const info=bounds(object),surface=findSurfaceInfo(object),tableY=surface.center.y+surface.size.y*.5+.006;
  for(const [item,body] of physics){if(body.held){item.getWorldPosition(tmp);body.lastPosition.lerp(tmp,.6);continue;}body.velocity.y-=5.8*dt;item.position.addScaledVector(body.velocity,dt);const p=item.position;const inside=p.x>info.box.min.x&&p.x<info.box.max.x&&p.z>info.box.min.z&&p.z<info.box.max.z;const floor=inside?tableY:0.035;if(p.y-body.radius<floor){p.y=floor+body.radius;if(Math.abs(body.velocity.y)>.15){body.velocity.y=Math.abs(body.velocity.y)*.22;state.collisions++;playSound(body.kind==='chip'?'chip':'card',.35);}else body.velocity.y=0;body.velocity.x*=.88;body.velocity.z*=.88;}if(p.y<-2||Math.abs(p.x)>90||Math.abs(p.z)>90){p.copy(body.home);body.velocity.set(0,0,0);}}
}

function ensureWatch() {
  if(!renderer?.xr||watchRoot)return watchRoot;
  let parent=null;
  for(let i=0;i<2;i++){const candidate=renderer.xr.getHand?.(i);const handed=candidate?.inputSource?.handedness||candidate?.userData?.handedness;if(handed==='left'){parent=candidate;break;}}
  if(!parent)parent=renderer.xr.getController?.(0)||camera;if(!parent)return null;
  watchRoot=new THREE.Group();watchRoot.name='PHASE384_LEFT_FOREARM_WATCH_ROOT';
  const cuff=new THREE.Mesh(new THREE.BoxGeometry(.18,.03,.105),new THREE.MeshStandardMaterial({color:0x080a10,roughness:.56,metalness:.34}));cuff.position.z=.006;watchRoot.add(cuff);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=280;const ctx=canvas.getContext('2d');const paint=()=>{ctx.clearRect(0,0,512,280);roundRect(ctx,8,8,496,264,30);ctx.fillStyle='rgba(2,6,14,.98)';ctx.fill();ctx.strokeStyle=seatedNow()?'#ff5b7f':'#7ffcff';ctx.lineWidth=10;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 62px system-ui';ctx.fillText('SVR',256,80);ctx.fillStyle='#ffd98a';ctx.font='900 34px system-ui';ctx.fillText(seatedNow()?'TABLE LOCKED':'QUICK PLAY',256,132);ctx.fillStyle='#c9fbff';ctx.font='800 24px system-ui';ctx.fillText(state.ambienceEnabled?'AMBIENT ON':'AMBIENT OFF',256,180);ctx.fillStyle='#8dffb4';ctx.font='800 18px system-ui';ctx.fillText('MUSIC   •   SPOTIFY',256,226);watchTexture.needsUpdate=true;};
  watchTexture=new THREE.CanvasTexture(canvas);watchTexture.colorSpace=THREE.SRGBColorSpace;watchScreen=new THREE.Mesh(new THREE.PlaneGeometry(.17,.093),new THREE.MeshBasicMaterial({map:watchTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));watchScreen.position.z=-.048;watchScreen.renderOrder=9384;watchRoot.add(watchScreen);
  const makeButton=(label,x,action,color)=>{const map=canvasTexture(`phase384-watch-${action}`,256,128,(c,w,h)=>{roundRect(c,4,4,w-8,h-8,24);c.fillStyle='#050914';c.fill();c.strokeStyle=color;c.lineWidth=8;c.stroke();c.fillStyle='#fff';c.textAlign='center';c.font='900 34px system-ui';c.fillText(label,w/2,78);});const button=new THREE.Mesh(new THREE.PlaneGeometry(.078,.032),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));button.position.set(x,-.064,-.049);button.userData.svrWatchAction=action;button.renderOrder=9385;watchRoot.add(button);};
  makeButton('MUSIC',-.044,'music','#7ffcff');makeButton('SPOTIFY',.044,'spotify','#8dffb4');
  parent.add(watchRoot);watchRoot.position.set(.025,-.055,-.105);watchRoot.rotation.set(-.38,Math.PI,-.08);watchRoot.userData.paint=paint;paint();state.watchRestored=true;state.watchButtonsReady=true;state.spotifyLauncherReady=true;return watchRoot;
}
function updateWatch(){ensureWatch();watchRoot?.userData?.paint?.();if(watchRoot)watchRoot.visible=true;}

function ensureAudio() {
  if(audioContext)return audioContext;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;audioContext=new C();state.ambienceUnlocked=true;return audioContext;
}
function tone(freq,duration=.08,type='sine',gain=.035,delay=0) {
  const c=ensureAudio();if(!c||!state.ambienceEnabled)return false;const oscillator=c.createOscillator(),g=c.createGain(),now=c.currentTime+delay;oscillator.type=type;oscillator.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);oscillator.connect(g).connect(c.destination);oscillator.start(now);oscillator.stop(now+duration+.03);state.soundEvents++;return true;
}
function noise(duration=.06,gain=.018,delay=0) {
  const c=ensureAudio();if(!c||!state.ambienceEnabled)return false;const length=Math.max(1,Math.floor(c.sampleRate*duration)),buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=c.createBufferSource(),g=c.createGain(),now=c.currentTime+delay;source.buffer=buffer;g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(g).connect(c.destination);source.start(now);state.soundEvents++;return true;
}
function playSound(kind='card',scale=1){if(!state.ambienceEnabled)return;if(kind==='chip'){for(let i=0;i<3;i++)tone(880+i*110,.04,'square',.012*scale,i*.025);noise(.035,.008*scale);}else if(kind==='winner'){tone(523,.13,'sine',.045);tone(659,.13,'sine',.045,.11);tone(784,.22,'sine',.05,.22);}else{noise(.045,.018*scale);tone(420,.035,'triangle',.012*scale);}}
function startAmbience() {
  const c=ensureAudio();if(!c||!state.ambienceEnabled||ambienceNodes.length)return;
  const master=c.createGain();master.gain.value=.014;master.connect(c.destination);
  const low=c.createOscillator();low.type='sine';low.frequency.value=48;low.connect(master);low.start();
  const high=c.createOscillator();high.type='triangle';high.frequency.value=96;const hg=c.createGain();hg.gain.value=.16;high.connect(hg).connect(master);high.start();
  ambienceNodes=[low,high,master,hg];
}
function stopAmbience(){for(const node of ambienceNodes){try{node.stop?.()}catch{}try{node.disconnect?.()}catch{}}ambienceNodes=[];}
function toggleAmbience(force){state.ambienceEnabled=typeof force==='boolean'?force:!state.ambienceEnabled;localStorage.setItem('svrAmbientEnabled',String(state.ambienceEnabled));if(state.ambienceEnabled){ensureAudio()?.resume?.();startAmbience();tone(660,.08,'sine',.025);}else stopAmbience();updateWatch();return state.ambienceEnabled;}
function openSpotify(){window.open('https://open.spotify.com/','_blank','noopener,noreferrer');return true;}
function bindAudioUnlock(){const unlock=()=>{if(state.ambienceEnabled){ensureAudio()?.resume?.();startAmbience();}};for(const event of ['pointerdown','touchstart','keydown'])window.addEventListener(event,unlock,{once:true,passive:true});}

function lockAllTeleport() {
  if(!seatedNow())return false;for(const key of TELEPORT_FLAGS)window[key]=false;window.SVR_TABLE_MOVEMENT_LOCKED=true;window.SVR_PHASE384_ALL_TELEPORT_LOCKED=true;
  walk(scene,(object)=>{const name=String(object.name||'');if(/teleport|landing|reticle|ray|arc|marker/i.test(name)&&!/watch|hand|controller/i.test(name))object.visible=false;});state.teleportLockPasses++;return true;
}
function requestAutoSeat() {
  if(state.autoSeatRequested||params.get('walk')==='1')return;
  state.autoSeatRequested=true;
  autoSeatTimer=window.setTimeout(()=>{
    const seated=window.SVR_PHASE361_PLAY_GAME?.() || window.SVR_PHASE373_STABLE_SEAT?.('phase384-spawn-auto-seat');
    window.SVR_PHASE381_SEAT_LOCK?.('phase384-spawn-auto-seat');
    state.seated=Boolean(seatedNow()||seated);lockAllTeleport();updateLightingFocus();
  },2200);
}
function hookPokerSounds() {
  for(const event of ['svr:phase359-hand-start','svr:phase360-hand-start','svr:poker-state'])window.addEventListener(event,()=>{playSound('card');window.SVR_PHASE381_PLAY_ERIC?.('phase384-hand-event');});
  window.addEventListener('svr:poker-winner',()=>playSound('winner'));
}

function sweep() {
  scene=window.__SVR_SCENE__||scene;camera=window.__SVR_CAMERA__||camera;renderer=window.__SVR_RENDERER__||renderer;worldRoot=scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||scene;
  if(!scene||!camera||!renderer||!getTable())return false;
  ensureLighting();ensureFocusLights();scaleTableSlightly();removeTableFloorLine();fitFeltAndLogo();
  eric=approvedEric()||eric;if(eric){textureEric();alignEricToPlayer();dedupeEricAndSkeletons();}
  cleanupBlackSquare();ensureFourthWall();ensureSkylineAndAds();ensurePlanets();ensureInteractionKit();setupInputSources();updateWatch();updateLightingFocus();requestAutoSeat();lockAllTeleport();
  return true;
}
function frame(time=0) {
  if(!ACTIVE)return;const now=performance.now(),dt=Math.min(.035,Math.max(.001,(now-(state.lastFrameAt||now))/1000));state.lastFrameAt=now;
  updatePlanets(time);updatePhysics(dt);updateHandPinches();updateLightingFocus();if(seatedNow())lockAllTeleport();
  if(time-lastSweep>900){lastSweep=time;sweep();}
  raf=requestAnimationFrame(frame);
}
function qa() {
  state.checkedAt=new Date().toISOString();
  const seated=seatedNow();
  const teleportLocked=!seated||TELEPORT_FLAGS.every(key=>window[key]===false);
  return {...state,seated,teleportLocked,pass:!ACTIVE||Boolean(state.installed&&state.blackSquaresHidden>=0&&state.tableScaled&&state.feltFitted&&state.logoFitted&&state.ericFound&&state.ericFacingPlayer&&state.ericTexturedMaterials>0&&state.watchRestored&&state.fourthWallReady&&state.skylineReady&&state.moonReady&&state.marsReady&&state.physicalCards>=2&&state.physicalChips>=8&&teleportLocked)};
}
function install() {
  if(!ACTIVE||state.installed)return;state.installed=true;state.installedAt=new Date().toISOString();bindAudioUnlock();hookPokerSounds();timer=window.setInterval(sweep,700);raf=requestAnimationFrame(frame);
  window.addEventListener('svr:phase384-core-ready',sweep);window.addEventListener('svr:phase381-core-ready',sweep);window.addEventListener('svr:phase361-ready',sweep);
  window.addEventListener('beforeunload',()=>{clearInterval(timer);clearTimeout(autoSeatTimer);cancelAnimationFrame(raf);stopAmbience();audioContext?.close?.();for(const controller of controllers){controller.removeEventListener('selectstart',onSelectStart);controller.removeEventListener('selectend',onSelectEnd);}},{once:true});
}
install();
window.SVR_PHASE384_WORLD_SWEEP=sweep;
window.SVR_PHASE384_WORLD_QA=qa;
window.SVR_PHASE384_AMBIENT_TOGGLE=toggleAmbience;
window.SVR_PHASE384_OPEN_SPOTIFY=openSpotify;
window.SVR_PHASE384_WORLD_STATE=state;
