import * as THREE from 'three';
import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const FLOOR_Y = 0;
const TABLE_LINE_OFFSET = 0.065;
const WALK_SPEED = 1.85;
const LOOK_SPEED = 1.65;
const SEATED_PARALLAX = 0.035;
const BOT_NAMES = ['NOVA', 'ROOK', 'ACE', 'VEGA', 'IVY'];
const BRAND_DEFAULT = Object.freeze({
  id: 'svr',
  name: 'SVR POKER',
  logoUrl: 'assets/ui/logo.png',
  fallbackLogoUrl: 'logo.png'
});

const runtime = {
  build: BUILD,
  active: ACTIVE,
  tableLineOffset: TABLE_LINE_OFFSET,
  tableAligned: false,
  tableMinY: null,
  tableReferenceLineY: null,
  controllerBound: false,
  moveEvents: 0,
  lookEvents: 0,
  seated: false,
  sticksHiddenWhileSeated: false,
  navButtonsHidden: 0,
  gyroAvailable: 'DeviceOrientationEvent' in window,
  gyroPermission: 'not-requested',
  gyroEvents: 0,
  seatStabilizations: 0,
  potDisplayClean: false,
  cardBacksBranded: 0,
  hudBrandReady: false,
  avatarsAligned: 0,
  nameTagsReady: 0,
  profileShowroomVerified: false,
  vrDressingRoomVerified: false,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

const move = { pointerId: null, x: 0, y: 0 };
const look = { pointerId: null, x: 0, y: 0 };
let scene = null;
let camera = null;
let renderer = null;
let brand = { ...BRAND_DEFAULT };
let brandImage = null;
let brandTexture = null;
let cleanPotTexture = null;
let potSprite = null;
let table = null;
let tableDropAppliedTo = null;
let tableDropY = 0;
let observer = null;
let frame = 0;
let lastFrame = performance.now();
let lastPot = -1;
let touchYaw = 0;
let touchPitch = 0;
let gyroBase = null;
let gyroYaw = 0;
let gyroPitch = 0;
let seatBase = null;
let seatedLast = false;
let lastUiSync = 0;
let lastWorldSync = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = THREE.MathUtils.clamp;

function isSeated() {
  return Boolean(
    window.SVR_PHASE363_STATE?.joined
    || window.SVR_PHASE347_STATE?.seated
    || document.body.classList.contains('svr363-seated')
    || document.body.classList.contains('svr347-seated')
  );
}

function worldRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}

function tableObject() {
  return window.SVR_TABLE_AUTHORITY
    || worldRoot()?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || worldRoot()?.getObjectByName?.('PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER')
    || worldRoot()?.getObjectByName?.('PHASE358_QUEST_UPLOADED_ASSET_CONTAINER')
    || null;
}

function tableBounds(object = tableObject()) {
  if (!object?.isObject3D) return null;
  object.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  if (box.isEmpty()) return null;
  return {
    object,
    box,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3()),
    top: box.max.y,
    minY: box.min.y
  };
}

function moveWorldY(object, deltaY) {
  if (!object || !Number.isFinite(deltaY)) return false;
  if (!object.parent) {
    object.position.y += deltaY;
    return true;
  }
  object.parent.updateWorldMatrix?.(true, false);
  const scale = new THREE.Vector3();
  object.parent.getWorldScale(scale);
  object.position.y += deltaY / (Math.abs(scale.y) > 1e-6 ? scale.y : 1);
  return true;
}

function alignTableReferenceLine(force = false) {
  const metrics = tableBounds();
  if (!metrics) return false;
  table = metrics.object;
  const referenceLineY = metrics.minY + TABLE_LINE_OFFSET;
  const delta = FLOOR_Y - referenceLineY;
  if (!force && table === tableDropAppliedTo && Math.abs(delta) < 0.006) return true;
  if (Math.abs(delta) > 0.003) moveWorldY(table, delta);
  table.updateWorldMatrix?.(true, true);
  const after = tableBounds(table);
  if (!after) return false;
  tableDropAppliedTo = table;
  tableDropY += delta;
  table.userData.phase365ReferenceLineOffset = TABLE_LINE_OFFSET;
  table.userData.phase365FloorLineAligned = true;
  window.SVR_TABLE_TOP_Y = after.top;
  window.SVR_TABLE_FLOOR_Y = FLOOR_Y;
  window.SVR_PHASE365_TABLE_ALIGNMENT = {
    object: table.name || 'table-authority',
    floorY: FLOOR_Y,
    lineOffset: TABLE_LINE_OFFSET,
    minY: +after.minY.toFixed(3),
    referenceLineY: +(after.minY + TABLE_LINE_OFFSET).toFixed(3),
    topY: +after.top.toFixed(3),
    appliedWorldDeltaY: +tableDropY.toFixed(3)
  };
  runtime.tableAligned = Math.abs(after.minY + TABLE_LINE_OFFSET - FLOOR_Y) < 0.008;
  runtime.tableMinY = +after.minY.toFixed(3);
  runtime.tableReferenceLineY = +(after.minY + TABLE_LINE_OFFSET).toFixed(3);
  window.setTimeout(() => window.SVR_PHASE341_REBUILD?.(), 30);
  return runtime.tableAligned;
}

function installStyle() {
  if ($('#svr365-style')) return;
  const style = document.createElement('style');
  style.id = 'svr365-style';
  style.textContent = `
#svr365BrandSlot{position:fixed;z-index:2147483570;left:10px;top:max(58px,calc(env(safe-area-inset-top) + 50px));display:flex;align-items:center;gap:7px;max-width:124px;padding:5px 8px 5px 5px;border:1px solid rgba(127,252,255,.28);border-radius:12px;background:rgba(1,5,13,.52);backdrop-filter:blur(7px);box-shadow:0 8px 24px rgba(0,0,0,.22);pointer-events:none;color:#fff;font:900 9px/1 system-ui;letter-spacing:.08em}
#svr365BrandSlot img{width:34px;height:34px;object-fit:contain;border-radius:8px;background:rgba(0,0,0,.28)}
#svr365BrandSlot span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.svr365-seated #svr347Move,body.svr365-seated #svr347Look{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
body.svr365-seated [data-svr365-nav-hidden="1"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
body.svr365-seated #svr357TurnPanel{top:max(62px,calc(env(safe-area-inset-top) + 54px))!important;width:min(62vw,460px)!important;padding:6px 9px!important;border-color:rgba(127,252,255,.34)!important;background:rgba(1,6,14,.48)!important;box-shadow:none!important}
body.svr365-seated #svr357Bets{display:none!important}
body.svr365-seated #svr357TurnName{font-size:10px!important}
body.svr365-seated #svr357TurnDetail{font-size:9px!important}
body.svr365-seated #svr363Bankroll{background:rgba(15,12,18,.48)!important;border-color:rgba(226,202,153,.34)!important;box-shadow:none!important;padding:6px 8px!important}
body.svr365-seated #svr347Hole{bottom:20px!important;left:12px!important;transform:none!important;background:rgba(0,0,0,.46)!important;box-shadow:none!important}
body.svr365-seated #svr347Actions{bottom:18px!important;right:12px!important;left:auto!important;transform:none!important;width:min(43vw,310px)!important}
body.svr365-seated #svr347Actions button{height:44px!important;background:rgba(7,10,18,.70)!important;box-shadow:none!important}
@media(orientation:landscape){#svr365BrandSlot{top:max(8px,env(safe-area-inset-top));left:8px}body.svr365-seated #svr357TurnPanel{left:16px!important;top:55px!important;width:min(46vw,500px)!important}body.svr365-seated #svr347Hole{bottom:18px!important}body.svr365-seated #svr347Actions{top:50%!important;bottom:auto!important;transform:translateY(-50%)!important}}
`;
  document.head.appendChild(style);
}

function resolveBrand() {
  const configured = window.SVR_ANDROID_BRAND_SLOT;
  if (configured && typeof configured === 'object') brand = { ...BRAND_DEFAULT, ...configured };
  window.SVR_ANDROID_BRAND_SLOT = { ...brand };
  return brand;
}

function ensureBrandHud() {
  resolveBrand();
  let root = $('#svr365BrandSlot');
  if (!root) {
    root = document.createElement('aside');
    root.id = 'svr365BrandSlot';
    root.setAttribute('aria-label', 'Current table sponsor');
    root.innerHTML = '<img alt=""><span></span>';
    document.body.appendChild(root);
  }
  const image = $('img', root);
  const label = $('span', root);
  label.textContent = brand.name || 'SVR POKER';
  image.alt = `${brand.name || 'SVR Poker'} logo`;
  if (image.dataset.brandId !== brand.id) {
    image.dataset.brandId = brand.id;
    image.onerror = () => {
      if (image.dataset.fallback !== '1') {
        image.dataset.fallback = '1';
        image.src = brand.fallbackLogoUrl || 'logo.png';
      } else image.style.display = 'none';
    };
    image.onload = () => { image.style.display = ''; runtime.hudBrandReady = true; };
    image.src = brand.logoUrl || BRAND_DEFAULT.logoUrl;
  }
  runtime.hudBrandReady = true;
  return root;
}

function drawBrandTexture() {
  if (brandTexture) return brandTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#26124f');
    gradient.addColorStop(1, '#050c1a');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#7ffcff';
    context.lineWidth = 16;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.strokeStyle = '#d9b45c';
    context.lineWidth = 5;
    context.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);
    if (brandImage?.complete && brandImage.naturalWidth) {
      const maxW = 300;
      const maxH = 260;
      const ratio = Math.min(maxW / brandImage.naturalWidth, maxH / brandImage.naturalHeight);
      const width = brandImage.naturalWidth * ratio;
      const height = brandImage.naturalHeight * ratio;
      context.drawImage(brandImage, (canvas.width - width) / 2, 170, width, height);
    } else {
      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.font = '900 104px system-ui';
      context.fillText('SVR', canvas.width / 2, 350);
    }
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.font = '900 58px system-ui';
    context.fillText(brand.name || 'SVR POKER', canvas.width / 2, 505);
    context.fillStyle = '#d9b45c';
    context.font = '900 27px system-ui';
    context.fillText('TOURNAMENT BRAND SLOT', canvas.width / 2, 555);
  };
  brandImage = new Image();
  brandImage.crossOrigin = 'anonymous';
  brandImage.onload = () => { draw(); brandTexture.needsUpdate = true; };
  brandImage.onerror = () => {
    if (brandImage.src.endsWith(brand.fallbackLogoUrl || 'logo.png')) return;
    brandImage.src = brand.fallbackLogoUrl || 'logo.png';
  };
  brandImage.src = new URL(brand.logoUrl || BRAND_DEFAULT.logoUrl, document.baseURI).href;
  draw();
  brandTexture = new THREE.CanvasTexture(canvas);
  brandTexture.colorSpace = THREE.SRGBColorSpace;
  brandTexture.name = 'PHASE365_BRANDED_CARD_BACK_TEXTURE';
  return brandTexture;
}

function brandCardBacks() {
  if (!scene) return 0;
  const texture = drawBrandTexture();
  let count = 0;
  scene.traverse((object) => {
    if (!object?.isMesh || !object.material) return;
    const name = String(object.name || '');
    const burn = /^PHASE341_BURN_/i.test(name);
    const botHole = /^PHASE341_HOLE_([1-5])_/i.test(name);
    if (!burn && !botHole) return;
    if (botHole && String(state.phase || '').toLowerCase() === 'showdown') return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      if (material.map !== texture) {
        material.map = texture;
        material.transparent = true;
        material.needsUpdate = true;
      }
    }
    object.userData.phase365BrandedCardBack = true;
    count += 1;
  });
  runtime.cardBacksBranded = count;
  return count;
}

function cleanPotCanvas(amount) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgba(0,0,0,.85)';
  context.shadowBlur = 16;
  context.fillStyle = 'rgba(255,255,255,.94)';
  context.font = '900 42px system-ui';
  context.fillText('POT', canvas.width / 2, 62);
  context.fillStyle = '#e6c56d';
  context.font = '1000 92px system-ui';
  context.fillText(`$${Math.max(0, Number(amount || 0)).toLocaleString()}`, canvas.width / 2, 145);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = 'PHASE365_CLEAN_TRANSPARENT_POT_TEXTURE';
  return texture;
}

function cleanPotDisplay() {
  if (!scene) return false;
  potSprite = scene.getObjectByName?.('PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY')
    || scene.getObjectByName?.('PHASE365_ANDROID_CLEAN_POT_DISPLAY')
    || null;
  if (!potSprite?.isSprite) return false;
  const metrics = tableBounds();
  if (!metrics) return false;
  const amount = Number(state.pot || 0);
  if (amount !== lastPot || !cleanPotTexture) {
    cleanPotTexture?.dispose?.();
    cleanPotTexture = cleanPotCanvas(amount);
    potSprite.material.map = cleanPotTexture;
    potSprite.material.needsUpdate = true;
    lastPot = amount;
  }
  potSprite.name = 'PHASE365_ANDROID_CLEAN_POT_DISPLAY';
  potSprite.material.transparent = true;
  potSprite.material.opacity = 0.88;
  potSprite.material.depthTest = false;
  potSprite.material.depthWrite = false;
  potSprite.scale.set(0.62, 0.18, 1);
  potSprite.position.set(metrics.center.x, metrics.top + 0.27, metrics.center.z - metrics.size.z * 0.02);
  potSprite.renderOrder = 36540;
  runtime.potDisplayClean = true;
  return true;
}

function tintTable() {
  const object = tableObject();
  if (!object || object.userData.phase365BrandPolish) return false;
  object.traverse((node) => {
    if (!node?.isMesh || !node.material) return;
    const name = `${node.name || ''} ${(Array.isArray(node.material) ? node.material : [node.material]).map((m) => m?.name || '').join(' ')}`.toLowerCase();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      if (/felt|cloth|polotno|baize|surface/.test(name)) {
        material.color?.setHex?.(0x082d22);
        if ('roughness' in material) material.roughness = 0.82;
      } else if (/rail|leather|pad|armrest/.test(name)) {
        material.color?.setHex?.(0x130b1f);
        if ('roughness' in material) material.roughness = 0.52;
      }
      material.needsUpdate = true;
    }
  });
  object.userData.phase365BrandPolish = true;
  return true;
}

function makeNameTexture(name, stack) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(2,8,18,.70)';
  if (context.roundRect) {
    context.beginPath();
    context.roundRect(8, 8, 496, 128, 32);
    context.fill();
  } else context.fillRect(8, 8, 496, 128);
  context.strokeStyle = 'rgba(127,252,255,.62)';
  context.lineWidth = 5;
  context.strokeRect(10, 10, 492, 124);
  context.textAlign = 'center';
  context.fillStyle = '#fff';
  context.font = '900 47px system-ui';
  context.fillText(name, 256, 61);
  context.fillStyle = '#e6c56d';
  context.font = '900 31px system-ui';
  context.fillText(`$${Number(stack || 0).toLocaleString()}`, 256, 105);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function alignAvatars() {
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  const group = worldRoot()?.getObjectByName?.('PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS');
  if (!layout?.seats?.length || !group) return 0;
  let aligned = 0;
  BOT_NAMES.forEach((name, index) => {
    const avatar = group.getObjectByName?.(`PHASE356_BOT_AVATAR_${index + 1}`) || group.children[index];
    const seat = layout.seats[index + 1];
    if (!avatar || !seat) return;
    const dx = seat.x - layout.center.x;
    const dz = seat.z - layout.center.z;
    avatar.position.set(layout.center.x + dx * 1.23, FLOOR_Y + 0.02, layout.center.z + dz * 1.30);
    avatar.lookAt(layout.center.x, layout.top + 0.22, layout.center.z);
    avatar.userData.phase365Seat = index + 1;
    let tag = avatar.getObjectByName?.(`PHASE365_NAME_TAG_${index + 1}`);
    if (!tag) {
      tag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
      tag.name = `PHASE365_NAME_TAG_${index + 1}`;
      tag.position.set(0, 1.57, 0);
      tag.scale.set(0.76, 0.215, 1);
      tag.renderOrder = 36550;
      avatar.add(tag);
    }
    const player = players[index + 1];
    const signature = `${name}:${Number(player?.stack || 0)}`;
    if (tag.userData.signature !== signature) {
      tag.material.map?.dispose?.();
      tag.material.map = makeNameTexture(name, player?.stack || 0);
      tag.material.needsUpdate = true;
      tag.userData.signature = signature;
    }
    aligned += 1;
  });
  runtime.avatarsAligned = aligned;
  runtime.nameTagsReady = aligned;
  return aligned;
}

function markNavigationButtons(seated) {
  let hidden = 0;
  for (const element of $$('button,a,[role="button"]')) {
    if (element.closest?.('#svr347Actions') || element.closest?.('#svr357Showdown')) continue;
    const text = String(element.textContent || '').trim().replace(/\s+/g, ' ').toUpperCase();
    const navigation = text === 'LOBBY' || text === 'CENTER' || text === 'CENTER VIEW';
    if (!navigation) continue;
    if (seated) {
      element.dataset.svr365NavHidden = '1';
      hidden += 1;
    } else delete element.dataset.svr365NavHidden;
  }
  runtime.navButtonsHidden = hidden;
  return hidden;
}

function syncUi() {
  const seated = isSeated();
  runtime.seated = seated;
  document.body.classList.toggle('svr365-seated', seated);
  markNavigationButtons(seated);
  const moveRoot = $('#svr347Move');
  const lookRoot = $('#svr347Look');
  runtime.sticksHiddenWhileSeated = seated
    ? Boolean(moveRoot && getComputedStyle(moveRoot).display === 'none' && lookRoot && getComputedStyle(lookRoot).display === 'none')
    : false;
  if (seated && !seatedLast) {
    seatBase = null;
    requestGyroPermission();
    window.setTimeout(() => stabilizeSeat(true), 120);
  }
  if (!seated) {
    seatBase = null;
    gyroBase = null;
    gyroYaw = 0;
    gyroPitch = 0;
  }
  seatedLast = seated;
}

function pointerValue(root, event) {
  const rect = root.getBoundingClientRect();
  const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
  return {
    x: clamp((event.clientX - (rect.left + rect.width / 2)) / radius, -1, 1),
    y: clamp((event.clientY - (rect.top + rect.height / 2)) / radius, -1, 1)
  };
}

function setStick(root, stateValue, event) {
  const value = pointerValue(root, event);
  stateValue.x = value.x;
  stateValue.y = value.y;
  const knob = $('b', root);
  if (knob) knob.style.transform = `translate(${value.x * 27}px,${value.y * 27}px)`;
}

function releaseStick(root, stateValue) {
  stateValue.pointerId = null;
  stateValue.x = 0;
  stateValue.y = 0;
  const knob = $('b', root);
  if (knob) knob.style.transform = '';
}

function bindStick(root, stateValue, kind) {
  if (!root || root.dataset.phase365Bound === '1') return false;
  root.dataset.phase365Bound = '1';
  root.addEventListener('pointerdown', (event) => {
    if (isSeated()) return;
    stateValue.pointerId = event.pointerId;
    root.setPointerCapture?.(event.pointerId);
    setStick(root, stateValue, event);
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  root.addEventListener('pointermove', (event) => {
    if (stateValue.pointerId !== event.pointerId || isSeated()) return;
    setStick(root, stateValue, event);
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  const release = (event) => {
    if (stateValue.pointerId !== event.pointerId) return;
    releaseStick(root, stateValue);
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  root.addEventListener('pointerup', release, true);
  root.addEventListener('pointercancel', release, true);
  root.addEventListener('lostpointercapture', () => releaseStick(root, stateValue), true);
  root.dataset.phase365Kind = kind;
  return true;
}

function bindController() {
  const moveRoot = $('#svr347Move');
  const lookRoot = $('#svr347Look');
  if (!moveRoot || !lookRoot) return false;
  bindStick(moveRoot, move, 'move');
  bindStick(lookRoot, look, 'look');
  runtime.controllerBound = moveRoot.dataset.phase365Bound === '1' && lookRoot.dataset.phase365Bound === '1';
  return runtime.controllerBound;
}

function cameraYaw() {
  if (!camera) return 0;
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  return euler.y;
}

function applyLobbyController(dt) {
  if (isSeated() || !camera) return;
  const activeMove = Math.abs(move.x) > 0.025 || Math.abs(move.y) > 0.025;
  const activeLook = Math.abs(look.x) > 0.025 || Math.abs(look.y) > 0.025;
  if (activeMove) {
    const yaw = cameraYaw();
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const delta = forward.multiplyScalar(-move.y * WALK_SPEED * dt).add(right.multiplyScalar(move.x * WALK_SPEED * dt));
    const playerRig = window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
    if (playerRig?.position) playerRig.position.add(delta);
    else camera.position.add(delta);
    runtime.moveEvents += 1;
  }
  if (activeLook) {
    touchYaw -= look.x * LOOK_SPEED * dt;
    touchPitch = clamp(touchPitch - look.y * LOOK_SPEED * 0.72 * dt, -0.62, 0.62);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = touchYaw;
    camera.rotation.x = touchPitch;
    runtime.lookEvents += 1;
  }
}

async function requestGyroPermission() {
  if (!runtime.gyroAvailable) return false;
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const result = await DeviceOrientationEvent.requestPermission();
      runtime.gyroPermission = result;
      return result === 'granted';
    }
    runtime.gyroPermission = 'granted';
    return true;
  } catch (error) {
    runtime.gyroPermission = 'denied';
    runtime.lastError = String(error?.message || error);
    return false;
  }
}

function onOrientation(event) {
  if (!isSeated() || event.alpha == null || event.beta == null) return;
  if (!gyroBase) gyroBase = { alpha: event.alpha, beta: event.beta };
  const wrap = (value) => ((value + 540) % 360) - 180;
  gyroYaw = THREE.MathUtils.degToRad(clamp(wrap(event.alpha - gyroBase.alpha), -65, 65));
  gyroPitch = THREE.MathUtils.degToRad(clamp(event.beta - gyroBase.beta, -32, 32));
  runtime.gyroEvents += 1;
}

function seatMetrics() {
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  const metrics = tableBounds();
  if (!metrics) return null;
  const center = layout?.center ? new THREE.Vector3(layout.center.x, metrics.top, layout.center.z) : metrics.center.clone();
  const depth = Number(layout?.size?.z || metrics.size.z);
  return { center, top: metrics.top, depth };
}

function stabilizeSeat(force = false) {
  if (!isSeated() || !camera) return false;
  const metrics = seatMetrics();
  if (!metrics) return false;
  if (!seatBase || force) {
    seatBase = new THREE.Vector3(metrics.center.x, metrics.top + 0.55, metrics.center.z + metrics.depth * 0.5 + 0.30);
  }
  const target = seatBase.clone();
  target.x += clamp(Math.sin(gyroYaw) * SEATED_PARALLAX, -SEATED_PARALLAX, SEATED_PARALLAX);
  camera.position.lerp(target, force ? 1 : 0.16);
  const lookTarget = new THREE.Vector3(metrics.center.x, metrics.top + 0.10, metrics.center.z);
  const direction = lookTarget.sub(camera.position).normalize();
  const baseQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
  const gyroQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(gyroPitch * 0.72, -0.42, 0.42), clamp(-gyroYaw, -1.05, 1.05), 0, 'YXZ'));
  camera.quaternion.slerp(baseQuat.multiply(gyroQuat), force ? 1 : 0.20);
  runtime.seatStabilizations += 1;
  return true;
}

function verifyProfileRoutes() {
  runtime.profileShowroomVerified = Boolean(window.SVR_PHASE351_PROFILE_SHOWROOM_QA);
  runtime.vrDressingRoomVerified = Boolean(window.SVR_PHASE353_QA);
}

function publish(reason = 'sync') {
  runtime.checkedAt = new Date().toISOString();
  window.SVR_PHASE365_STATE = { ...runtime, reason, brand: { ...brand } };
  window.dispatchEvent(new CustomEvent('svr:phase365-state', { detail: window.SVR_PHASE365_STATE }));
}

function qa() {
  const seated = isSeated();
  const navVisible = $$('[data-svr365-nav-hidden="1"]').filter((element) => getComputedStyle(element).display !== 'none').length;
  const moveRoot = $('#svr347Move');
  const lookRoot = $('#svr347Look');
  const avatarGroup = worldRoot()?.getObjectByName?.('PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS');
  const result = {
    build: BUILD,
    active: ACTIVE,
    tableAligned: runtime.tableAligned,
    tableReferenceLineY: runtime.tableReferenceLineY,
    controllerBound: runtime.controllerBound,
    seated,
    sticks: {
      move: moveRoot ? 1 : 0,
      look: lookRoot ? 1 : 0,
      hiddenWhileSeated: seated ? runtime.sticksHiddenWhileSeated : null
    },
    navigationVisibleWhileSeated: seated ? navVisible : null,
    gyroAvailable: runtime.gyroAvailable,
    potDisplayClean: runtime.potDisplayClean,
    cardBacksBranded: runtime.cardBacksBranded,
    hudBrandReady: runtime.hudBrandReady,
    avatarsAligned: runtime.avatarsAligned,
    nameTagsReady: runtime.nameTagsReady,
    avatarGroup: avatarGroup?.name || null,
    checkedAt: new Date().toISOString()
  };
  result.pass = result.active
    && result.tableAligned
    && result.controllerBound
    && result.sticks.move === 1
    && result.sticks.look === 1
    && result.potDisplayClean
    && result.cardBacksBranded >= 3
    && result.hudBrandReady
    && result.avatarsAligned === 5
    && result.nameTagsReady === 5
    && (!seated || (result.sticks.hiddenWhileSeated && navVisible === 0));
  window.SVR_PHASE365_QA_STATE = result;
  return result;
}

function syncWorld(force = false) {
  scene = window.__SVR_SCENE__ || scene;
  camera = window.__SVR_CAMERA__ || camera;
  renderer = window.__SVR_RENDERER__ || renderer;
  if (!scene || !camera) return false;
  alignTableReferenceLine(force);
  tintTable();
  cleanPotDisplay();
  brandCardBacks();
  alignAvatars();
  verifyProfileRoutes();
  return true;
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (ACTIVE) {
    applyLobbyController(dt);
    if (isSeated()) stabilizeSeat(false);
    if (now - lastUiSync > 320) {
      syncUi();
      bindController();
      ensureBrandHud();
      lastUiSync = now;
    }
    if (now - lastWorldSync > 900) {
      syncWorld(false);
      publish('frame-sync');
      lastWorldSync = now;
    }
  }
  frame = requestAnimationFrame(loop);
}

function install() {
  if (!ACTIVE || window.__SVR_PHASE365_INSTALLED__) return;
  window.__SVR_PHASE365_INSTALLED__ = true;
  installStyle();
  ensureBrandHud();
  window.addEventListener('deviceorientation', onOrientation, true);
  window.addEventListener('svr:poker-state', () => window.setTimeout(() => syncWorld(false), 0));
  window.addEventListener('svr:phase363-state', () => window.setTimeout(syncUi, 0));
  window.addEventListener('svr:platform-ready', () => window.setTimeout(() => syncWorld(true), 80));
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest?.('[data-ui="seat"]') || event.target.closest?.('#svr363JoinControl')) requestGyroPermission();
  }, true);
  observer = new MutationObserver(() => {
    syncUi();
    bindController();
    ensureBrandHud();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.SVR_PHASE365_SET_BRAND = (next = {}) => {
    brand = { ...brand, ...next };
    window.SVR_ANDROID_BRAND_SLOT = { ...brand };
    brandTexture?.dispose?.();
    brandTexture = null;
    brandImage = null;
    ensureBrandHud();
    brandCardBacks();
    publish('brand-changed');
    return { ...brand };
  };
  window.SVR_PHASE365_ALIGN_TABLE = () => alignTableReferenceLine(true);
  window.SVR_PHASE365_STABILIZE_SEAT = () => stabilizeSeat(true);
  window.SVR_PHASE365_REQUEST_GYRO = requestGyroPermission;
  window.SVR_PHASE365_QA = qa;
  window.SVR_PHASE365_SYNC = () => {
    syncUi();
    syncWorld(true);
    return qa();
  };
  [250, 700, 1400, 2600, 4800].forEach((delay) => window.setTimeout(() => {
    bindController();
    syncUi();
    syncWorld(delay >= 1400);
  }, delay));
  runtime.installedAt = new Date().toISOString();
  publish('installed');
  frame = requestAnimationFrame(loop);
}

install();
