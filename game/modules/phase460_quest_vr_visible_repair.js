/* PHASE-460-QUEST-VR-VISIBLE-REPAIR */
import * as THREE from 'three';
import { clearQuestTableObstructions } from './quest_table_clearance.js?v=phase461';

export const BUILD = 'PHASE-460-QUEST-VR-VISIBLE-REPAIR';
const params = new URLSearchParams(location.search);
const ACTIVE = params.get('platform') === 'quest' || params.get('tableonly') === '1' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const LEGACY = /LOBBY|STOREFRONT|PORTAL|ATRIUM|GIVEAWAY|MOON|MARS|SKYLINE|BUILDING|BALCONY|LOUNGE|HUB/i;
const KEEP = /PHASE453_DIRECT_TABLE_ROOM|PHASE441_TABLE_SAFE_DECALS|PHASE441_PASS_LINE|PHASE441_CENTER_SVR_LOGO|CARD|CHIP|POT|HAND|PLAYER|ERIC|SVR_WRIST_WATCH/i;
const state = { build: BUILD, active: ACTIVE, installed: false, watchGuarded: false, hiddenLegacy: 0, clearance: null, lastError: null, checkedAt: null };
let timer = 0;
let lightRig = null;
const tableBox = new THREE.Box3();
const tableCenter = new THREE.Vector3();
const tableSize = new THREE.Vector3();

function effectiveVisible(object){
  for (let p = object; p; p = p.parent) if (p.visible === false) return false;
  return Boolean(object?.parent);
}

function belongsTo(object, root){
  if (!object || !root) return false;
  for (let p = object; p; p = p.parent) if (p === root) return true;
  return false;
}

function touchesProtectedAuthority(object, runtime){
  const protectedObjects = [
    runtime?.table?.group,
    runtime?.table?.table,
    runtime?.dealer?.group,
    runtime?.dealer?.propGroup,
    window.__SVR_SCENE__?.getObjectByName('PHASE438_APPROVED_DEALER_TABLE_LIGHT_RIG'),
    window.__SVR_SCENE__?.getObjectByName('PHASE462_PROFESSIONAL_TABLE_ROOM'),
    window.SVR_WRIST_WATCH?.object
  ].filter(Boolean);
  return protectedObjects.some(item => belongsTo(item, object) || belongsTo(object, item));
}

function hideLegacy(runtime){
  const scene = window.__SVR_SCENE__;
  if (!scene) return 0;
  let hidden = 0;
  for (const object of [...scene.children]){
    if (!object || KEEP.test(String(object.name || '')) || touchesProtectedAuthority(object, runtime)) continue;
    if (LEGACY.test(String(object.name || '')) && effectiveVisible(object)){
      object.visible = false;
      object.userData = { ...(object.userData || {}), svrPhase460LegacyHidden:true, build:BUILD };
      hidden++;
    }
  }
  state.hiddenLegacy = Math.max(state.hiddenLegacy, hidden);
  return hidden;
}

function hardDedupe(runtime){
  const scene = window.__SVR_SCENE__;
  const approvedDealer = runtime?.dealer?.group;
  const approvedTable = runtime?.table?.group;
  if (!scene || !approvedDealer || !approvedTable) return { dealers:0, tables:0 };
  const dealerRx = /DEALER|ERIC|SKELETON|CARD_DEALER|AVATAR_RIG/i;
  const tableRx = /LEGACY.*TABLE|DUPLICATE.*TABLE|ORIGINAL.*TABLE|PROCEDURAL.*TABLE|TABLE.*AUTHORITY|TABLE_FALLBACK/i;
  const candidates = [];
  scene.traverse(object => {
    if (!object?.parent || object === approvedDealer || object === approvedTable) return;
    if (touchesProtectedAuthority(object, runtime)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (dealerRx.test(label)) candidates.push({ object, kind:'dealer' });
    else if (tableRx.test(label)) candidates.push({ object, kind:'table' });
  });
  const roots = candidates.filter(({object}) => !candidates.some(({object:other}) => other !== object && belongsTo(object, other)));
  let dealers = 0, tables = 0;
  for (const entry of roots){
    entry.object.visible = false;
    entry.object.userData = { ...(entry.object.userData || {}), svrPhase460HardDeduped:true, build:BUILD };
    if (entry.kind === 'dealer') dealers++; else tables++;
  }
  return { dealers, tables };
}

function alignApprovedAuthority(runtime){
  const table = runtime?.table?.table;
  const dealer = runtime?.dealer;
  if (!table || !dealer?.group) return false;
  table.updateWorldMatrix?.(true, true);
  tableBox.setFromObject(table, true);
  if (tableBox.isEmpty()) return false;
  tableBox.getCenter(tableCenter);
  tableBox.getSize(tableSize);
  const x = tableCenter.x - 0.10;
  const z = tableCenter.z + Math.max(0.58, tableSize.z * 0.43);
  if (Math.abs((dealer.params?.x ?? x) - x) > 0.01 || Math.abs((dealer.params?.z ?? z) - z) > 0.01) dealer.setParams?.({ x, z, scale:0.0047 });
  dealer.groundToFloor?.(0);
  dealer.group.visible = true;
  if (dealer.model) dealer.model.visible = true;
  return true;
}

function ensureBrightLightRig(runtime){
  const scene = window.__SVR_SCENE__;
  if (!scene || !runtime?.table?.table) return false;
  const professionalRoom = scene.getObjectByName('PHASE462_PROFESSIONAL_TABLE_ROOM');
  const startup = scene.getObjectByName('QUEST_STARTUP_LIGHTING');
  if (professionalRoom?.visible) {
    if (startup) startup.visible = false;
    if (lightRig) lightRig.visible = false;
    return true;
  }
  // Phase 460 no longer creates a competing light rig. The startup world owns
  // temporary boot illumination until Phase 462 installs the professional room.
  if (startup) startup.visible = true;
  scene.background = new THREE.Color(0x17131f);
  return true;
}

function cameraFacingPose(source, side = 'left'){
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  const controller = source?.userData?.controller || source;
  if (!controller?.getWorldPosition || !controller?.getWorldQuaternion || !camera) return null;
  const position = controller.getWorldPosition(new THREE.Vector3());
  const q = controller.getWorldQuaternion(new THREE.Quaternion());
  position.add(new THREE.Vector3(side === 'left' ? -0.055 : 0.055, 0.048, -0.065).applyQuaternion(q));
  const activeCamera = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  const cam = activeCamera.getWorldPosition(new THREE.Vector3());
  const z = cam.sub(position).normalize();
  const up = new THREE.Vector3(0,1,0);
  const x = new THREE.Vector3().crossVectors(up,z);
  if (x.lengthSq() < 1e-6) x.set(1,0,0); else x.normalize();
  const y = new THREE.Vector3().crossVectors(z,x).normalize();
  const matrix = new THREE.Matrix4().makeBasis(x,y,z);
  return { position, quaternion:new THREE.Quaternion().setFromRotationMatrix(matrix) };
}

function guardWatch(){
  const watch = window.SVR_WRIST_WATCH;
  if (!watch?.object || typeof watch.update !== 'function' || watch.__svrPhase460Wrapped) return false;
  const original = watch.update.bind(watch);
  watch.update = (dt, input, legacyRightHand) => {
    original(dt, input, legacyRightHand);
    if (!window.__SVR_RENDERER__?.xr?.isPresenting) return;
    const leftController = input?.leftController;
    const rightController = input?.rightController;
    const source = leftController || rightController;
    if (!source) return;
    const pose = cameraFacingPose(source, leftController ? 'left' : 'right');
    if (!pose) return;
    const object = watch.object;
    if (!object.visible || !Number.isFinite(object.position.x) || object.position.distanceTo(pose.position) > 0.20){
      object.visible = true;
      object.position.copy(pose.position);
      object.quaternion.copy(pose.quaternion);
      object.updateMatrixWorld(true);
    }
  };
  watch.__svrPhase460Wrapped = true;
  state.watchGuarded = true;
  return true;
}

function sweep(reason = 'guard'){
  if (!ACTIVE) return false;
  try {
    const scene = window.__SVR_SCENE__;
    const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
    if (!scene || !runtime?.table?.table) return false;
    hideLegacy(runtime);
    const dedupe = hardDedupe(runtime);
    alignApprovedAuthority(runtime);
    ensureBrightLightRig(runtime);
    guardWatch();
    state.clearance = clearQuestTableObstructions(scene, runtime);
    const room = scene.getObjectByName?.('PHASE453_DIRECT_TABLE_ROOM');
    if (room) room.visible = true;
    if (runtime.table.group) runtime.table.group.visible = true;
    runtime.table.table.visible = true;
    if (runtime.dealer?.group) runtime.dealer.group.visible = true;
    state.installed = true;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE460_STATE = { ...state, reason, dedupe };
    return qa();
  } catch (error){
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE460_STATE = { ...state, reason };
    return false;
  }
}

function qa(){
  const scene = window.__SVR_SCENE__;
  const room = scene?.getObjectByName?.('PHASE453_DIRECT_TABLE_ROOM');
  const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
  const tableVisible = Boolean(runtime?.table?.table && effectiveVisible(runtime.table.table));
  return {
    ...state,
    roomVisible: Boolean(room?.visible !== false && room?.parent),
    tableVisible,
    watchObjectPresent: Boolean(window.SVR_WRIST_WATCH?.object),
    pass: Boolean(state.installed && state.watchGuarded && room?.visible !== false && tableVisible && !state.lastError),
    checkedAt: new Date().toISOString()
  };
}

async function install(){
  if (!ACTIVE) return false;
  const started = performance.now();
  while (performance.now() - started < 30000){
    if (window.__SVR_SCENE__ && (window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE)?.table?.table) break;
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  sweep('install');
  window.__SVR_RENDERER__?.xr?.addEventListener?.('sessionstart', () => setTimeout(() => sweep('xr-sessionstart'), 120));
  for (const delay of [150, 400, 900, 1800, 3500]) setTimeout(() => sweep(`settle-${delay}`), delay);
  if (!timer) timer = window.setInterval(() => sweep('guard'), 350);
  return qa();
}

window.SVR_PHASE460_SWEEP = sweep;
window.SVR_PHASE460_QA = qa;
window.SVR_PHASE460_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once:true });
