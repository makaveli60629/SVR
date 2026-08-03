import * as THREE from 'three';

export const BUILD = 'PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const STORAGE_KEY = 'svr.phase366.androidCalibration.v1';
const DEFAULTS = Object.freeze({
  tableYOffset: 0,
  seatDistanceOffset: 0,
  seatHeightOffset: 0,
  hudScale: 1,
  potOpacity: 0.88,
  potScale: 1,
  gyroSensitivity: 1,
  avatarRadialOffset: 0,
  avatarHeightOffset: 0
});
const LIMITS = Object.freeze({
  tableYOffset: [-0.12, 0.12, 0.005],
  seatDistanceOffset: [-0.30, 0.30, 0.01],
  seatHeightOffset: [-0.20, 0.20, 0.01],
  hudScale: [0.78, 1.18, 0.01],
  potOpacity: [0.30, 1, 0.01],
  potScale: [0.55, 1.20, 0.01],
  gyroSensitivity: [0.55, 1.45, 0.01],
  avatarRadialOffset: [-0.25, 0.25, 0.01],
  avatarHeightOffset: [-0.20, 0.20, 0.01]
});

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  panelOpen: false,
  applied: false,
  tableOffsetApplied: 0,
  seatOffsetApplied: [0, 0, 0],
  potObjects: 0,
  avatarObjects: 0,
  hudScaleApplied: 1,
  gyroEvents: 0,
  profileLiveCameraRoute: '/site/profile.html?v=phase366',
  websiteDressingRoomRoute: '/site/avatar.html?v=phase366',
  vrDressingRoomRoute: '/game/avatar-vr.html?v=phase366',
  lastError: null,
  updatedAt: null
};

let settings = loadSettings();
let scene = null;
let camera = null;
let table = null;
let tableAppliedTo = null;
let seatAppliedCamera = null;
let seatAppliedVector = new THREE.Vector3();
let gyroBase = null;
let gyroExtraYaw = 0;
let gyroExtraPitch = 0;
let syncTimer = 0;
const avatarApplied = new WeakMap();

const $ = (selector, root = document) => root.querySelector(selector);
const clamp = THREE.MathUtils.clamp;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(next = {}) {
  const clean = {};
  for (const [key, fallback] of Object.entries(DEFAULTS)) {
    const [minimum, maximum] = LIMITS[key];
    clean[key] = clamp(number(next[key], fallback), minimum, maximum);
  }
  return clean;
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return normalize({ ...DEFAULTS, ...parsed });
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    runtime.lastError = String(error?.message || error);
  }
}

function isSeated() {
  return Boolean(
    window.SVR_PHASE363_STATE?.joined
    || window.SVR_PHASE347_STATE?.seated
    || document.body.classList.contains('svr363-seated')
    || document.body.classList.contains('svr365-seated')
  );
}

function resolveScene() {
  return window.__SVR_SCENE__
    || window.SVR_RUNTIME?.scene
    || window.SVR_APP?.scene
    || window.SVR_GAME?.scene
    || null;
}

function resolveCamera() {
  return window.__SVR_CAMERA__
    || window.SVR_RUNTIME?.camera
    || window.SVR_APP?.camera
    || window.SVR_GAME?.camera
    || null;
}

function resolveTable() {
  const root = resolveScene();
  return window.SVR_TABLE_AUTHORITY
    || root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || root?.getObjectByName?.('PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER')
    || root?.getObjectByName?.('PHASE358_QUEST_UPLOADED_ASSET_CONTAINER')
    || null;
}

function bounds(object) {
  if (!object?.isObject3D) return null;
  object.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  if (box.isEmpty()) return null;
  return {
    box,
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3()),
    minY: box.min.y,
    topY: box.max.y
  };
}

function worldPosition(object) {
  return object?.getWorldPosition?.(new THREE.Vector3()) || new THREE.Vector3();
}

function setWorldPosition(object, target) {
  if (!object?.isObject3D || !target?.isVector3) return false;
  if (!object.parent) {
    object.position.copy(target);
    return true;
  }
  object.parent.updateWorldMatrix?.(true, false);
  object.position.copy(object.parent.worldToLocal(target.clone()));
  return true;
}

function moveWorldY(object, deltaY) {
  if (!object?.isObject3D || !Number.isFinite(deltaY)) return false;
  if (!object.parent) {
    object.position.y += deltaY;
    return true;
  }
  object.parent.updateWorldMatrix?.(true, false);
  const scale = object.parent.getWorldScale(new THREE.Vector3());
  object.position.y += deltaY / (Math.abs(scale.y) > 1e-6 ? scale.y : 1);
  return true;
}

function applyTableCalibration() {
  const nextTable = resolveTable();
  if (!nextTable) return false;
  table = nextTable;

  if (tableAppliedTo && tableAppliedTo !== table && runtime.tableOffsetApplied) {
    moveWorldY(tableAppliedTo, -runtime.tableOffsetApplied);
    runtime.tableOffsetApplied = 0;
  }
  tableAppliedTo = table;

  if (runtime.tableOffsetApplied) {
    moveWorldY(table, -runtime.tableOffsetApplied);
    runtime.tableOffsetApplied = 0;
  }

  window.SVR_PHASE365_ALIGN_TABLE?.();
  if (Math.abs(settings.tableYOffset) > 0.0001) {
    moveWorldY(table, settings.tableYOffset);
    runtime.tableOffsetApplied = settings.tableYOffset;
  }

  table.updateWorldMatrix?.(true, true);
  const metrics = bounds(table);
  if (metrics) {
    window.SVR_TABLE_TOP_Y = metrics.topY;
    window.SVR_PHASE366_TABLE_CALIBRATION = {
      offsetY: settings.tableYOffset,
      minY: +metrics.minY.toFixed(3),
      topY: +metrics.topY.toFixed(3),
      phase365ReferenceLineOffset: 0.065,
      calibratedReferenceLineY: +(metrics.minY + 0.065).toFixed(3)
    };
  }
  window.setTimeout(() => window.SVR_PHASE341_REBUILD?.(), 30);
  return true;
}

function removeSeatCalibration() {
  if (!seatAppliedCamera?.isObject3D || seatAppliedVector.lengthSq() < 1e-8) return;
  const current = worldPosition(seatAppliedCamera);
  setWorldPosition(seatAppliedCamera, current.sub(seatAppliedVector));
  seatAppliedVector.set(0, 0, 0);
}

function applySeatCalibration() {
  camera = resolveCamera();
  if (!camera?.isObject3D || !isSeated()) return false;
  removeSeatCalibration();
  window.SVR_PHASE365_STABILIZE_SEAT?.();

  camera.updateWorldMatrix?.(true, false);
  const tableMetrics = bounds(resolveTable());
  const cameraWorld = worldPosition(camera);
  const center = tableMetrics?.center || new THREE.Vector3(0, cameraWorld.y, 0);
  const outward = cameraWorld.clone().sub(center);
  outward.y = 0;
  if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
  outward.normalize();

  seatAppliedVector = outward.multiplyScalar(settings.seatDistanceOffset);
  seatAppliedVector.y = settings.seatHeightOffset;
  setWorldPosition(camera, cameraWorld.add(seatAppliedVector));
  seatAppliedCamera = camera;
  runtime.seatOffsetApplied = seatAppliedVector.toArray().map((value) => +value.toFixed(4));
  return true;
}

function applyHudScale() {
  document.documentElement.style.setProperty('--svr366-hud-scale', String(settings.hudScale));
  runtime.hudScaleApplied = settings.hudScale;
}

function findPotObjects() {
  scene = resolveScene();
  if (!scene?.traverse) return [];
  const found = [];
  scene.traverse((object) => {
    const name = String(object?.name || '');
    if (!object?.isObject3D) return;
    if (
      name === 'PHASE365_ANDROID_CLEAN_POT_DISPLAY'
      || name === 'PHASE347_ANDROID_RAISED_POT_DISPLAY'
      || object.userData?.phase365CleanPotDisplay
      || (/POT_DISPLAY/i.test(name) && object.isSprite)
    ) found.push(object);
  });
  return [...new Set(found)];
}

function applyPotCalibration() {
  const objects = findPotObjects();
  for (const object of objects) {
    if (!object.userData.phase366BaseScale) object.userData.phase366BaseScale = object.scale.clone();
    object.scale.copy(object.userData.phase366BaseScale).multiplyScalar(settings.potScale);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      material.transparent = true;
      material.opacity = settings.potOpacity;
      material.depthWrite = false;
      material.needsUpdate = true;
    }
  }
  runtime.potObjects = objects.length;
  return objects.length;
}

function avatarRoot() {
  scene = resolveScene();
  return scene?.getObjectByName?.('PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS') || null;
}

function avatarCandidates() {
  const root = avatarRoot();
  if (!root) return [];
  const candidates = [];
  for (const child of root.children || []) {
    const name = String(child?.name || '');
    if (!child?.isObject3D) continue;
    if (/NAME_TAG|LABEL|CHIP|CARD/i.test(name)) continue;
    if (/NOVA|ROOK|ACE|VEGA|IVY|BOT|AVATAR/i.test(name) || child.userData?.seatIndex != null || child.userData?.phase356SeatIndex != null) {
      candidates.push(child);
    }
  }
  return candidates.length ? candidates : (root.children || []).filter((child) => child?.isGroup);
}

function applyAvatarCalibration() {
  const tableMetrics = bounds(resolveTable());
  if (!tableMetrics) return 0;
  const avatars = avatarCandidates();
  for (const avatar of avatars) {
    const previous = avatarApplied.get(avatar) || new THREE.Vector3();
    const base = worldPosition(avatar).sub(previous);
    const radial = base.clone().sub(tableMetrics.center);
    radial.y = 0;
    if (radial.lengthSq() < 1e-6) radial.set(0, 0, 1);
    radial.normalize().multiplyScalar(settings.avatarRadialOffset);
    radial.y = settings.avatarHeightOffset;
    setWorldPosition(avatar, base.clone().add(radial));
    avatarApplied.set(avatar, radial);
  }
  runtime.avatarObjects = avatars.length;
  return avatars.length;
}

function applyGyroCorrection(event) {
  if (!ACTIVE || !isSeated()) return;
  camera = resolveCamera();
  if (!camera?.rotation) return;
  const alpha = number(event.alpha, 0);
  const beta = number(event.beta, 0);
  const gamma = number(event.gamma, 0);
  if (!gyroBase) gyroBase = { alpha, beta, gamma };

  camera.rotation.y -= gyroExtraYaw;
  camera.rotation.x -= gyroExtraPitch;
  const multiplier = settings.gyroSensitivity - 1;
  gyroExtraYaw = clamp(THREE.MathUtils.degToRad((gamma - gyroBase.gamma) * 0.16 * multiplier), -0.16, 0.16);
  gyroExtraPitch = clamp(THREE.MathUtils.degToRad((beta - gyroBase.beta) * 0.12 * multiplier), -0.12, 0.12);
  camera.rotation.y += gyroExtraYaw;
  camera.rotation.x += gyroExtraPitch;
  runtime.gyroEvents += 1;
}

function installStyle() {
  if ($('#svr366-style')) return;
  const style = document.createElement('style');
  style.id = 'svr366-style';
  style.textContent = `
:root{--svr366-hud-scale:1}
#svr366CalibrationButton{position:fixed;z-index:2147483600;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));width:42px;height:42px;border:1px solid rgba(127,252,255,.42);border-radius:50%;background:rgba(3,8,18,.72);color:#dffcff;font:900 17px/1 system-ui;box-shadow:none;backdrop-filter:blur(8px);touch-action:manipulation}
#svr366CalibrationPanel{position:fixed;z-index:2147483601;right:max(10px,env(safe-area-inset-right));top:max(58px,calc(env(safe-area-inset-top) + 48px));width:min(92vw,360px);max-height:calc(100dvh - 76px);overflow:auto;padding:13px;border:1px solid rgba(127,252,255,.38);border-radius:18px;background:rgba(2,6,15,.94);color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.48);backdrop-filter:blur(14px);font:700 12px/1.25 system-ui}
#svr366CalibrationPanel[hidden]{display:none!important}
#svr366CalibrationPanel h2{margin:0 0 5px;font-size:15px;letter-spacing:.08em}
#svr366CalibrationPanel p{margin:0 0 11px;color:#b9d6df;font-size:11px}
.svr366-row{display:grid;grid-template-columns:1fr 96px 48px;align-items:center;gap:8px;margin:8px 0}
.svr366-row input{width:100%}.svr366-row output{color:#ffd98a;text-align:right;font-variant-numeric:tabular-nums}
.svr366-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.svr366-actions button{flex:1;min-width:82px;padding:9px;border:1px solid rgba(255,255,255,.18);border-radius:11px;background:rgba(20,26,42,.86);color:#fff;font-weight:900}.svr366-actions .primary{background:linear-gradient(135deg,#7ffcff,#8f5cff);color:#02040a;border:0}
body.svr365-seated #svr366CalibrationButton{display:none!important}
#svr347Actions,#svr347Hole,#svr357TurnPanel,#svr363Bankroll{zoom:var(--svr366-hud-scale)}
@media(max-width:520px){#svr366CalibrationPanel{left:8px;right:8px;width:auto}.svr366-row{grid-template-columns:1fr 88px 44px}}
`;
  document.head.appendChild(style);
}

const LABELS = Object.freeze({
  tableYOffset: 'Table height',
  seatDistanceOffset: 'Seat distance',
  seatHeightOffset: 'Seat eye height',
  hudScale: 'HUD scale',
  potOpacity: 'Pot transparency',
  potScale: 'Pot size',
  gyroSensitivity: 'Gyro sensitivity',
  avatarRadialOffset: 'Avatar chair distance',
  avatarHeightOffset: 'Avatar seat height'
});

function formatValue(key, value) {
  if (/Opacity|Scale|Sensitivity/.test(key) || ['hudScale', 'potOpacity', 'potScale', 'gyroSensitivity'].includes(key)) return value.toFixed(2);
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}m`;
}

function ensureUi() {
  installStyle();
  let button = $('#svr366CalibrationButton');
  if (!button) {
    button = document.createElement('button');
    button.id = 'svr366CalibrationButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open device calibration');
    button.textContent = '⚙';
    document.body.appendChild(button);
  }

  let panel = $('#svr366CalibrationPanel');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'svr366CalibrationPanel';
    panel.hidden = true;
    panel.innerHTML = '<h2>DEVICE CALIBRATION</h2><p>Fine-tune this phone only. Phase 365 remains the reset baseline.</p><div id="svr366CalibrationRows"></div><div class="svr366-actions"><button data-action="close">Close</button><button data-action="reset">Reset</button><button class="primary" data-action="apply">Apply & Save</button></div>';
    document.body.appendChild(panel);

    const rows = $('#svr366CalibrationRows', panel);
    for (const [key, label] of Object.entries(LABELS)) {
      const [minimum, maximum, step] = LIMITS[key];
      const row = document.createElement('label');
      row.className = 'svr366-row';
      row.innerHTML = `<span>${label}</span><input data-key="${key}" type="range" min="${minimum}" max="${maximum}" step="${step}"><output data-output="${key}"></output>`;
      rows.appendChild(row);
    }
  }

  const render = () => {
    for (const key of Object.keys(DEFAULTS)) {
      const input = panel.querySelector(`[data-key="${key}"]`);
      const output = panel.querySelector(`[data-output="${key}"]`);
      if (input) input.value = String(settings[key]);
      if (output) output.textContent = formatValue(key, settings[key]);
    }
  };

  button.onclick = () => {
    panel.hidden = !panel.hidden;
    runtime.panelOpen = !panel.hidden;
    render();
  };
  panel.addEventListener('input', (event) => {
    const key = event.target?.dataset?.key;
    if (!key || !(key in DEFAULTS)) return;
    settings = normalize({ ...settings, [key]: event.target.value });
    const output = panel.querySelector(`[data-output="${key}"]`);
    if (output) output.textContent = formatValue(key, settings[key]);
    applyAll(false);
  });
  panel.addEventListener('click', (event) => {
    const action = event.target?.dataset?.action;
    if (action === 'close') {
      panel.hidden = true;
      runtime.panelOpen = false;
    } else if (action === 'reset') {
      settings = { ...DEFAULTS };
      saveSettings();
      render();
      applyAll(true);
    } else if (action === 'apply') {
      saveSettings();
      applyAll(true);
      panel.hidden = true;
      runtime.panelOpen = false;
    }
  });
  render();
  return { button, panel };
}

function applyAll(forceSeat = false) {
  try {
    scene = resolveScene();
    camera = resolveCamera();
    applyHudScale();
    applyTableCalibration();
    applyPotCalibration();
    applyAvatarCalibration();
    if (isSeated() || forceSeat) window.setTimeout(applySeatCalibration, 70);
    runtime.applied = true;
    runtime.updatedAt = new Date().toISOString();
    runtime.lastError = null;
    window.SVR_PHASE366_CALIBRATION = { ...settings };
    window.SVR_PHASE366_STATE = snapshot();
    window.dispatchEvent(new CustomEvent('svr:phase366-calibration', { detail: snapshot() }));
    return true;
  } catch (error) {
    runtime.lastError = String(error?.stack || error);
    window.SVR_PHASE366_STATE = snapshot();
    return false;
  }
}

function snapshot() {
  return {
    ...runtime,
    settings: { ...settings },
    seated: isSeated(),
    hasScene: Boolean(resolveScene()),
    hasCamera: Boolean(resolveCamera()),
    hasTable: Boolean(resolveTable()),
    panelCount: document.querySelectorAll('#svr366CalibrationPanel').length,
    buttonCount: document.querySelectorAll('#svr366CalibrationButton').length
  };
}

function qa() {
  const state = snapshot();
  const checks = {
    active: ACTIVE,
    singleButton: state.buttonCount === 1,
    singlePanel: state.panelCount === 1,
    phase365Preserved: typeof window.SVR_PHASE365_QA === 'function',
    tableAuthority: state.hasTable,
    cameraAuthority: state.hasCamera,
    finiteSettings: Object.values(settings).every(Number.isFinite),
    profileLiveCamera: runtime.profileLiveCameraRoute.includes('profile.html'),
    websiteDressingRoom: runtime.websiteDressingRoomRoute.includes('avatar.html'),
    vrDressingRoom: runtime.vrDressingRoomRoute.includes('avatar-vr.html'),
    noApkUpdate: window.SVR_ANDROID_UPDATE_POLICY?.apkVersionName === '0.1.0-rc1'
  };
  return { build: BUILD, checks, state, pass: Object.values(checks).every(Boolean) };
}

function setCalibration(partial = {}, persist = true) {
  settings = normalize({ ...settings, ...partial });
  if (persist) saveSettings();
  ensureUi();
  applyAll(true);
  return snapshot();
}

function reset() {
  settings = { ...DEFAULTS };
  saveSettings();
  ensureUi();
  applyAll(true);
  return snapshot();
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  runtime.installed = true;
  ensureUi();
  window.addEventListener('deviceorientation', applyGyroCorrection);
  window.addEventListener('svr:phase363-immediate-join-state', (event) => {
    const joined = Boolean(event.detail?.joined);
    gyroBase = null;
    gyroExtraYaw = 0;
    gyroExtraPitch = 0;
    if (joined) {
      const panel = $('#svr366CalibrationPanel');
      if (panel) panel.hidden = true;
      runtime.panelOpen = false;
      window.setTimeout(() => applyAll(true), 120);
    } else {
      removeSeatCalibration();
      window.setTimeout(() => applyAll(false), 80);
    }
  });
  window.addEventListener('resize', () => applyHudScale(), { passive: true });
  syncTimer = window.setInterval(() => {
    if (!runtime.applied || resolveTable() !== table || findPotObjects().length !== runtime.potObjects) applyAll(false);
  }, 1600);
  window.setTimeout(() => applyAll(false), 250);
  window.setTimeout(() => applyAll(false), 1200);
}

window.SVR_PHASE366_QA = qa;
window.SVR_PHASE366_OPEN_CALIBRATION = () => {
  const { panel } = ensureUi();
  panel.hidden = false;
  runtime.panelOpen = true;
  return snapshot();
};
window.SVR_PHASE366_CLOSE_CALIBRATION = () => {
  const panel = $('#svr366CalibrationPanel');
  if (panel) panel.hidden = true;
  runtime.panelOpen = false;
  return snapshot();
};
window.SVR_PHASE366_APPLY = () => applyAll(true);
window.SVR_PHASE366_SET_CALIBRATION = setCalibration;
window.SVR_PHASE366_RESET = reset;
window.SVR_PHASE366_EXPORT_CALIBRATION = () => JSON.stringify({ build: BUILD, settings }, null, 2);
window.SVR_PHASE366_STATE = snapshot();
window.addEventListener('beforeunload', () => clearInterval(syncTimer), { once: true });

install();
