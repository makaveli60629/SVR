import * as THREE from 'three';
import { DEALER_MOTION } from './phase368_card_dealer_motion.js';

export const BUILD = 'PHASE-368-CARD-DEALER-ANIMATION-LOCK';

const TARGET_HEIGHT = 1.72;
const DEALER_GAP = 0.42;
const PLAYBACK_RATE = 2.15;
const DEG = Math.PI / 180;

const state = {
  build: BUILD,
  sourceAsset: DEALER_MOTION.source.name,
  sourceBytes: DEALER_MOTION.source.bytes,
  sourceSha256: DEALER_MOTION.source.sha256,
  sourceFbxVersion: DEALER_MOTION.source.fbxVersion,
  sourceAnimationSeconds: DEALER_MOTION.source.animationSeconds,
  optimizedMotionFrames: DEALER_MOTION.frames,
  optimizedMotionFps: DEALER_MOTION.fps,
  active: false,
  loaded: false,
  visible: false,
  playing: false,
  platform: null,
  rootName: null,
  plays: 0,
  lastPlayReason: null,
  lastHandNo: -1,
  lastCommunityCount: -1,
  loadedAt: null,
  lastAlignedAt: null,
  lastError: null
};

let scene = null;
let dealer = null;
let deckProp = null;
let timer = 0;
let alignTimer = 0;
let startedAt = 0;
let lastPlayAt = -Infinity;
let bones = new Map();
let restRotations = new Map();
let rotationData = null;
let translationData = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function platform() {
  const params = new URLSearchParams(location.search);
  const ua = navigator.userAgent || '';
  return String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (
    /Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop'
  )).toLowerCase();
}

function decodeInt16(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Int16Array(bytes.buffer);
}

function tableInfo() {
  const table = window.SVR_TABLE_AUTHORITY;
  if (!table?.isObject3D) return null;
  table.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(table, true);
  if (box.isEmpty()) return null;
  return {
    table,
    box,
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3()),
    topY: box.max.y
  };
}

async function waitForRuntime(timeoutMs = 30000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    scene = window.__SVR_SCENE__ || scene;
    if (scene && tableInfo()) return true;
    await wait(100);
  }
  return false;
}

function material(color, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function joint(name, parent, position) {
  const group = new THREE.Group();
  group.name = `PHASE368_${name}`;
  group.position.copy(position);
  parent.add(group);
  bones.set(name, group);
  restRotations.set(name, group.rotation.clone());
  return group;
}

function sphere(parent, radius, color, position = new THREE.Vector3()) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material(color));
  mesh.position.copy(position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function box(parent, size, color, position = new THREE.Vector3()) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z, 1, 1, 1), material(color));
  mesh.position.copy(position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function segment(parent, vector, radius, color) {
  const length = vector.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, length, 10), material(color));
  mesh.position.copy(vector).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize());
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildDealer() {
  const root = new THREE.Group();
  root.name = 'PHASE368_CARD_DEALER_ROOT';
  root.userData = {
    svrCardDealer: true,
    sourceAsset: DEALER_MOTION.source.name,
    sourceSha256: DEALER_MOTION.source.sha256,
    optimizedFromUploadedFbx: true,
    approvedVisibleDealer: true,
    build: BUILD
  };

  const skin = 0xb97858;
  const jacket = 0x251335;
  const shirt = 0xe8e0cf;
  const pants = 0x151821;
  const shoes = 0x0a0b0e;
  const gold = 0xd5b46a;

  const hips = joint('Hips', root, new THREE.Vector3(0, 0.90, 0));
  sphere(hips, 0.13, pants);
  box(hips, new THREE.Vector3(0.34, 0.20, 0.20), pants, new THREE.Vector3(0, 0.08, 0));

  const spine = joint('Spine', hips, new THREE.Vector3(0, 0.15, 0));
  const spine1 = joint('Spine1', spine, new THREE.Vector3(0, 0.15, 0));
  const spine2 = joint('Spine2', spine1, new THREE.Vector3(0, 0.17, 0));
  box(spine, new THREE.Vector3(0.38, 0.42, 0.22), jacket, new THREE.Vector3(0, 0.19, 0));
  box(spine2, new THREE.Vector3(0.12, 0.23, 0.225), shirt, new THREE.Vector3(0, 0.02, -0.004));

  const neck = joint('Neck', spine2, new THREE.Vector3(0, 0.20, 0));
  segment(neck, new THREE.Vector3(0, 0.09, 0), 0.055, skin);
  const head = joint('Head', neck, new THREE.Vector3(0, 0.09, 0));
  sphere(head, 0.115, skin, new THREE.Vector3(0, 0.10, 0));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.119, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), material(0x18110f));
  hair.position.set(0, 0.125, 0);
  head.add(hair);

  const leftShoulder = joint('LeftShoulder', spine2, new THREE.Vector3(0.19, 0.14, 0));
  const leftArm = joint('LeftArm', leftShoulder, new THREE.Vector3(0.12, 0, 0));
  const leftForeArm = joint('LeftForeArm', leftArm, new THREE.Vector3(0.27, -0.01, 0));
  const leftHand = joint('LeftHand', leftForeArm, new THREE.Vector3(0.25, 0, 0));
  segment(leftShoulder, new THREE.Vector3(0.12, 0, 0), 0.075, jacket);
  segment(leftArm, new THREE.Vector3(0.27, -0.01, 0), 0.070, jacket);
  segment(leftForeArm, new THREE.Vector3(0.25, 0, 0), 0.057, skin);
  box(leftHand, new THREE.Vector3(0.12, 0.055, 0.09), skin, new THREE.Vector3(0.05, 0, 0));

  const rightShoulder = joint('RightShoulder', spine2, new THREE.Vector3(-0.19, 0.14, 0));
  const rightArm = joint('RightArm', rightShoulder, new THREE.Vector3(-0.12, 0, 0));
  const rightForeArm = joint('RightForeArm', rightArm, new THREE.Vector3(-0.27, -0.01, 0));
  const rightHand = joint('RightHand', rightForeArm, new THREE.Vector3(-0.25, 0, 0));
  segment(rightShoulder, new THREE.Vector3(-0.12, 0, 0), 0.075, jacket);
  segment(rightArm, new THREE.Vector3(-0.27, -0.01, 0), 0.070, jacket);
  segment(rightForeArm, new THREE.Vector3(-0.25, 0, 0), 0.057, skin);
  box(rightHand, new THREE.Vector3(0.12, 0.055, 0.09), skin, new THREE.Vector3(-0.05, 0, 0));

  const leftUpLeg = joint('LeftUpLeg', hips, new THREE.Vector3(0.11, -0.02, 0));
  const leftLeg = joint('LeftLeg', leftUpLeg, new THREE.Vector3(0, -0.42, 0));
  const leftFoot = joint('LeftFoot', leftLeg, new THREE.Vector3(0, -0.42, 0));
  segment(leftUpLeg, new THREE.Vector3(0, -0.42, 0), 0.09, pants);
  segment(leftLeg, new THREE.Vector3(0, -0.42, 0), 0.075, pants);
  box(leftFoot, new THREE.Vector3(0.15, 0.09, 0.27), shoes, new THREE.Vector3(0, -0.03, -0.08));

  const rightUpLeg = joint('RightUpLeg', hips, new THREE.Vector3(-0.11, -0.02, 0));
  const rightLeg = joint('RightLeg', rightUpLeg, new THREE.Vector3(0, -0.42, 0));
  const rightFoot = joint('RightFoot', rightLeg, new THREE.Vector3(0, -0.42, 0));
  segment(rightUpLeg, new THREE.Vector3(0, -0.42, 0), 0.09, pants);
  segment(rightLeg, new THREE.Vector3(0, -0.42, 0), 0.075, pants);
  box(rightFoot, new THREE.Vector3(0.15, 0.09, 0.27), shoes, new THREE.Vector3(0, -0.03, -0.08));

  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.035, 18), material(gold, 0.35));
  badge.position.set(-0.12, 0.19, -0.116);
  badge.rotation.y = Math.PI;
  spine2.add(badge);

  root.scale.setScalar(TARGET_HEIGHT / 1.72);
  return root;
}

function addDealerDeck(info) {
  if (deckProp) {
    deckProp.position.set(info.center.x, info.topY + 0.012, info.center.z - info.size.z * 0.18);
    return;
  }
  const group = new THREE.Group();
  group.name = 'PHASE368_CARD_DEALER_DECK';
  const cardGeometry = new THREE.BoxGeometry(0.064, 0.0016, 0.09);
  const back = material(0x25154d, 0.58);
  const edge = material(0xf7f4ea, 0.88);
  for (let index = 0; index < 4; index += 1) {
    const card = new THREE.Mesh(cardGeometry, [edge, edge, edge, edge, back, back]);
    card.position.y = index * 0.0018;
    card.rotation.y = index * 0.012;
    group.add(card);
  }
  group.position.set(info.center.x, info.topY + 0.012, info.center.z - info.size.z * 0.18);
  scene.add(group);
  deckProp = group;
}

function alignDealer() {
  if (!dealer || !scene) return false;
  const info = tableInfo();
  if (!info) return false;
  dealer.position.set(info.center.x, 0, info.box.min.z - DEALER_GAP);
  dealer.rotation.set(0, Math.PI, 0);
  dealer.visible = true;
  state.visible = true;
  state.lastAlignedAt = new Date().toISOString();
  addDealerDeck(info);
  return true;
}

function applyFrame(frameFloat) {
  if (!dealer || !rotationData) return;
  const frame0 = Math.floor(frameFloat) % DEALER_MOTION.frames;
  const frame1 = (frame0 + 1) % DEALER_MOTION.frames;
  const alpha = frameFloat - Math.floor(frameFloat);
  const stride = DEALER_MOTION.bones.length * 3;
  for (let boneIndex = 0; boneIndex < DEALER_MOTION.bones.length; boneIndex += 1) {
    const name = DEALER_MOTION.bones[boneIndex];
    const bone = bones.get(name);
    const rest = restRotations.get(name);
    if (!bone || !rest) continue;
    const offset0 = frame0 * stride + boneIndex * 3;
    const offset1 = frame1 * stride + boneIndex * 3;
    const x = THREE.MathUtils.lerp(rotationData[offset0], rotationData[offset1], alpha) / DEALER_MOTION.scale;
    const y = THREE.MathUtils.lerp(rotationData[offset0 + 1], rotationData[offset1 + 1], alpha) / DEALER_MOTION.scale;
    const z = THREE.MathUtils.lerp(rotationData[offset0 + 2], rotationData[offset1 + 2], alpha) / DEALER_MOTION.scale;
    bone.rotation.set(rest.x + x * DEG, rest.y + y * DEG, rest.z + z * DEG, 'XYZ');
  }
  const t0 = frame0 * 3;
  const t1 = frame1 * 3;
  const hips = bones.get('Hips');
  if (hips && translationData) {
    hips.position.x = THREE.MathUtils.lerp(translationData[t0], translationData[t1], alpha) / DEALER_MOTION.scale * 0.006;
    hips.position.y = 0.90 + THREE.MathUtils.lerp(translationData[t0 + 1], translationData[t1 + 1], alpha) / DEALER_MOTION.scale * 0.003;
    hips.position.z = THREE.MathUtils.lerp(translationData[t0 + 2], translationData[t1 + 2], alpha) / DEALER_MOTION.scale * 0.004;
  }
}

function playDeal(reason = 'manual') {
  if (!dealer || performance.now() - lastPlayAt < 700) return false;
  lastPlayAt = performance.now();
  startedAt = performance.now();
  state.playing = true;
  state.plays += 1;
  state.lastPlayReason = reason;
  window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
  return true;
}

function tick() {
  if (!dealer) return;
  if (!state.playing) {
    applyFrame(0);
    return;
  }
  const elapsed = (performance.now() - startedAt) / 1000 * PLAYBACK_RATE;
  const motionTime = Math.min(DEALER_MOTION.duration, elapsed);
  applyFrame(motionTime * DEALER_MOTION.fps);
  if (elapsed >= DEALER_MOTION.duration) {
    state.playing = false;
    applyFrame(0);
    window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
  }
}

function onPokerState(event) {
  const detail = event?.detail || window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
  const handNo = Number(detail.handNo ?? -1);
  const communityCount = Array.isArray(detail.community) ? detail.community.length : 0;
  if (handNo > state.lastHandNo) playDeal('new-hand');
  else if (communityCount > state.lastCommunityCount) playDeal(`street-${detail.phase || 'deal'}`);
  state.lastHandNo = Math.max(state.lastHandNo, handNo);
  state.lastCommunityCount = communityCount;
}

async function loadDealer() {
  if (dealer) return dealer;
  try {
    const ready = await waitForRuntime();
    if (!ready) throw new Error('Dealer runtime/table authority was not ready');
    rotationData = decodeInt16(DEALER_MOTION.rotationBase64);
    translationData = decodeInt16(DEALER_MOTION.translationBase64);
    dealer = buildDealer();
    scene.add(dealer);
    alignDealer();
    timer = window.setInterval(tick, 33);
    state.loaded = true;
    state.active = true;
    state.rootName = dealer.name;
    state.loadedAt = new Date().toISOString();
    state.lastError = null;
    const current = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
    state.lastHandNo = Number(current.handNo ?? -1);
    state.lastCommunityCount = Array.isArray(current.community) ? current.community.length : -1;
    playDeal(current.handNo > 0 ? 'active-hand-load' : 'dealer-ready');
    window.SVR_PHASE368_CARD_DEALER = dealer;
    window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
    window.dispatchEvent(new CustomEvent('svr:phase368-card-dealer-ready', { detail: { ...state } }));
    return dealer;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
    throw error;
  }
}

function schedule() {
  state.platform = platform();
  const delay = state.platform === 'android' ? 2200 : state.platform === 'quest' ? 3000 : 700;
  const launch = () => window.setTimeout(() => loadDealer().catch(console.error), delay);
  if (window.SVR_PLATFORM_READY || window.__SVR_GAME_READY__) launch();
  else window.addEventListener('svr:platform-ready', launch, { once: true });
}

window.addEventListener('svr:poker-state', onPokerState);
window.addEventListener('svr:table-authority-changed', alignDealer);
window.SVR_PHASE368_PLAY_CARD_DEALER = playDeal;
window.SVR_PHASE368_ALIGN_CARD_DEALER = alignDealer;
window.SVR_PHASE368_LOAD_CARD_DEALER = loadDealer;
window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };

alignTimer = window.setInterval(() => {
  if (dealer && tableInfo()) alignDealer();
}, 5000);

window.addEventListener('beforeunload', () => {
  clearInterval(timer);
  clearInterval(alignTimer);
}, { once: true });

schedule();
