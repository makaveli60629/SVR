import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-368-CARD-DEALER-ANIMATION-LOCK';

const ASSET_TEXT_URL = new URL('../assets/models/dealer/Cards.fbx.b64', import.meta.url);
const ASSET_BYTES = 2511648;
const ASSET_ANIMATION_SECONDS = 9;
const TARGET_HEIGHT = 1.72;
const DEALER_GAP = 0.38;
const PLAYBACK_RATE = 2.15;

const state = {
  build: BUILD,
  asset: 'assets/models/dealer/Cards.fbx.b64',
  sourceFormat: 'FBX 7700 / Mixamo humanoid',
  sourceBytes: ASSET_BYTES,
  sourceAnimationSeconds: ASSET_ANIMATION_SECONDS,
  active: false,
  loaded: false,
  visible: false,
  platform: null,
  rootName: null,
  clipName: null,
  clipDuration: 0,
  plays: 0,
  lastPlayReason: null,
  lastHandNo: -1,
  lastCommunityCount: -1,
  loadStartedAt: null,
  loadedAt: null,
  lastAlignedAt: null,
  lastError: null
};

let scene = null;
let dealer = null;
let mixer = null;
let action = null;
let deckProp = null;
let tickTimer = 0;
let alignTimer = 0;
let lastTickAt = performance.now();
let lastPlayAt = -Infinity;
let objectUrl = null;
let loadPromise = null;
let normalizedScale = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function platform() {
  const params = new URLSearchParams(location.search);
  const ua = navigator.userAgent || '';
  return String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (
    /Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop'
  )).toLowerCase();
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

async function decodeAssetUrl() {
  const response = await fetch(ASSET_TEXT_URL, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Dealer asset request failed: ${response.status}`);
  const encoded = (await response.text()).replace(/\s+/g, '');
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (bytes.length !== ASSET_BYTES) throw new Error(`Dealer asset byte mismatch: ${bytes.length}`);
  const signature = new TextDecoder().decode(bytes.subarray(0, 20));
  if (!signature.startsWith('Kaydara FBX Binary')) throw new Error('Dealer asset is not a binary FBX');
  objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  return objectUrl;
}

function tuneMaterials(root) {
  root.traverse((object) => {
    if (!object?.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const tuned = materials.filter((material) => material?.isMaterial).map((material) => {
      const clone = material.clone();
      clone.transparent = false;
      clone.opacity = 1;
      clone.depthWrite = true;
      clone.side = THREE.FrontSide;
      if ('roughness' in clone) clone.roughness = 0.72;
      if ('metalness' in clone) clone.metalness = 0.03;
      if (clone.color && !Number.isFinite(clone.color.r + clone.color.g + clone.color.b)) clone.color.set(0x7c4038);
      clone.needsUpdate = true;
      return clone;
    });
    if (tuned.length) object.material = Array.isArray(object.material) ? tuned : tuned[0];
  });
}

function addDealerDeck(info) {
  if (deckProp) {
    deckProp.position.set(info.center.x, info.topY + 0.012, info.center.z - info.size.z * 0.18);
    return deckProp;
  }
  const group = new THREE.Group();
  group.name = 'PHASE368_CARD_DEALER_DECK';
  const cardGeometry = new THREE.BoxGeometry(0.064, 0.0016, 0.09);
  const back = new THREE.MeshStandardMaterial({ color: 0x25154d, roughness: 0.58, metalness: 0.05 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.88, metalness: 0 });
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

  dealer.scale.setScalar(1);
  dealer.position.set(0, 0, 0);
  dealer.rotation.set(0, 0, 0);
  dealer.updateWorldMatrix(true, true);
  let bounds = new THREE.Box3().setFromObject(dealer, true);
  if (normalizedScale == null) {
    const height = Math.max(0.001, bounds.max.y - bounds.min.y);
    normalizedScale = THREE.MathUtils.clamp(TARGET_HEIGHT / height, 0.001, 10);
  }
  dealer.scale.setScalar(normalizedScale);
  dealer.updateWorldMatrix(true, true);
  bounds = new THREE.Box3().setFromObject(dealer, true);

  const dealerX = info.center.x;
  const dealerZ = info.box.min.z - DEALER_GAP;
  dealer.position.x += dealerX - (bounds.min.x + bounds.max.x) * 0.5;
  dealer.position.y += 0 - bounds.min.y;
  dealer.position.z += dealerZ - (bounds.min.z + bounds.max.z) * 0.5;

  const dx = info.center.x - dealerX;
  const dz = info.center.z - dealerZ;
  dealer.rotation.y = Math.atan2(-dx, -dz);
  dealer.updateWorldMatrix(true, true);
  dealer.visible = true;
  state.visible = true;
  state.lastAlignedAt = new Date().toISOString();
  addDealerDeck(info);
  return true;
}

function playDeal(reason = 'manual') {
  if (!action || performance.now() - lastPlayAt < 700) return false;
  lastPlayAt = performance.now();
  action.stop();
  action.reset();
  action.enabled = true;
  action.clampWhenFinished = true;
  action.setLoop(THREE.LoopOnce, 1);
  action.setEffectiveTimeScale(PLAYBACK_RATE);
  action.fadeIn(0.08);
  action.play();
  state.plays += 1;
  state.lastPlayReason = reason;
  window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
  return true;
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

function startMixerClock() {
  clearInterval(tickTimer);
  lastTickAt = performance.now();
  tickTimer = window.setInterval(() => {
    const now = performance.now();
    const delta = Math.min(0.08, Math.max(0, (now - lastTickAt) / 1000));
    lastTickAt = now;
    if (!document.hidden) mixer?.update(delta);
  }, 33);
}

async function loadDealer() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    state.loadStartedAt = new Date().toISOString();
    const ready = await waitForRuntime();
    if (!ready) throw new Error('Dealer runtime/table authority was not ready');

    const url = await decodeAssetUrl();
    const loaded = await new Promise((resolve, reject) => {
      new FBXLoader().load(url, resolve, undefined, reject);
    });
    dealer = loaded;
    dealer.name = 'PHASE368_CARD_DEALER_ROOT';
    dealer.userData = {
      ...(dealer.userData || {}),
      svrCardDealer: true,
      sourceAsset: 'Cards.fbx',
      approvedVisibleDealer: true,
      build: BUILD
    };
    tuneMaterials(dealer);
    scene.add(dealer);

    const clips = [...(loaded.animations || [])].sort((first, second) => second.duration - first.duration);
    if (!clips.length) throw new Error('Dealer FBX contains no animation clips');
    const clip = clips[0];
    mixer = new THREE.AnimationMixer(dealer);
    action = mixer.clipAction(clip);
    mixer.addEventListener('finished', () => {
      window.SVR_PHASE368_CARD_DEALER_STATE = { ...state, playing: false };
    });

    alignDealer();
    startMixerClock();
    state.loaded = true;
    state.active = true;
    state.rootName = dealer.name;
    state.clipName = clip.name || 'Cards';
    state.clipDuration = +clip.duration.toFixed(3);
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
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };
    throw error;
  });
  return loadPromise;
}

function schedule() {
  state.platform = platform();
  const delay = state.platform === 'android' ? 2600 : state.platform === 'quest' ? 3600 : 900;
  const launch = () => window.setTimeout(() => loadDealer().catch(console.error), delay);
  if (window.SVR_PLATFORM_READY || window.__SVR_GAME_READY__) launch();
  else window.addEventListener('svr:platform-ready', launch, { once: true });
}

window.addEventListener('svr:poker-state', onPokerState);
window.addEventListener('svr:table-authority-changed', () => alignDealer());
window.SVR_PHASE368_PLAY_CARD_DEALER = playDeal;
window.SVR_PHASE368_ALIGN_CARD_DEALER = alignDealer;
window.SVR_PHASE368_LOAD_CARD_DEALER = loadDealer;
window.SVR_PHASE368_CARD_DEALER_STATE = { ...state };

alignTimer = window.setInterval(() => {
  if (dealer && tableInfo()) alignDealer();
}, 5000);

window.addEventListener('beforeunload', () => {
  clearInterval(tickTimer);
  clearInterval(alignTimer);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}, { once: true });

schedule();
