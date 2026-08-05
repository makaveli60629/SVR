/* PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const active = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua) || params.has('desktop') || params.has('standard');
const state = {
  build: BUILD,
  active,
  installed: false,
  ericFound: false,
  ericTexturedMaterials: 0,
  duplicateEricsHidden: 0,
  externalSkeletonsHidden: 0,
  tablePolished: false,
  feltInstalled: false,
  logoInstalled: false,
  quickSeatRequested: false,
  dealerMotionRequested: false,
  lastError: null,
  installedAt: null,
  checkedAt: null
};
const textureCache = new Map();
let scene = null;
let table = null;
let eric = null;
let felt = null;
let logo = null;
let timer = 0;
let seatTimer = 0;

function walk(root, visitor, limit = 24000) {
  const stack = root ? [root] : [];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object) stack.push(child);
  }
}
function isInside(object, root) {
  let current = object;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}
function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}
function canvasTexture(kind = 'suit') {
  if (textureCache.has(kind)) return textureCache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const colors = {
    skin: ['#a96e50', '#744331'], hair: ['#2b160e', '#0d0705'], shirt: ['#f2f4f7', '#bec6d0'],
    suit: ['#171c29', '#05080f'], pants: ['#111721', '#04060b'], shoes: ['#141414', '#010101']
  }[kind] || ['#171c29', '#05080f'];
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = kind === 'skin' ? 0.1 : 0.16;
  ctx.strokeStyle = kind === 'skin' ? '#ffe0c5' : '#a9c8d8';
  ctx.lineWidth = kind === 'skin' ? 1 : 2;
  for (let i = -256; i < 512; i += kind === 'skin' ? 24 : 12) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(kind === 'skin' ? 1 : 3, kind === 'skin' ? 1 : 3);
  map.needsUpdate = true;
  textureCache.set(kind, map);
  return map;
}
function materialKind(label = '', yRatio = 0.5) {
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
  const whole = bounds(root);
  let changed = 0;
  walk(root, (object) => {
    if (!object.isMesh || !object.material) return;
    const center = bounds(object).center;
    const yRatio = whole.size.y > 0.001 ? (center.y - whole.box.min.y) / whole.size.y : 0.5;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const next = materials.map((source) => {
      const material = source?.clone?.() || new THREE.MeshStandardMaterial();
      const kind = materialKind(`${object.name || ''} ${source?.name || ''}`, yRatio);
      if (!material.map || !material.map.image) material.map = canvasTexture(kind);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.needsUpdate = true;
      material.color?.set?.(0xffffff);
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      if ('roughness' in material) material.roughness = kind === 'skin' ? 0.7 : kind === 'shoes' ? 0.28 : 0.56;
      if ('metalness' in material) material.metalness = kind === 'shoes' ? 0.16 : 0.04;
      material.userData = { ...(material.userData || {}), svrPhase384EricTexture: kind };
      material.needsUpdate = true;
      changed += 1;
      return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true;
    object.frustumCulled = false;
  });
  root.userData = { ...(root.userData || {}), svrPhase384Textured: true };
  state.ericTexturedMaterials = Math.max(state.ericTexturedMaterials, changed);
  return changed;
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
  while (current?.parent && current.parent !== scene && current.parent?.name !== 'PHASE200_ORDERED_GRAND_LOBBY_ROOT') current = current.parent;
  return current || object;
}
function dedupeDealer() {
  if (!scene || !eric) return 0;
  const roots = new Set();
  walk(scene, (object) => {
    if (object === eric || isInside(object, eric)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (/eric|approvedDealer|card[_ -]?dealer[_ -]?rig/i.test(label)) roots.add(rootUnderScene(object));
  });
  for (const root of roots) {
    if (!root || root === eric || isInside(root, eric)) continue;
    root.visible = false;
    root.userData = { ...(root.userData || {}), svrPhase384DuplicateEricHidden: true };
  }
  state.duplicateEricsHidden = Math.max(state.duplicateEricsHidden, roots.size);
  return roots.size;
}
function hideExternalSkeletons() {
  if (!scene || !eric) return 0;
  let hidden = 0;
  walk(scene, (object) => {
    if (object === eric || isInside(object, eric)) return;
    const label = String(object.name || '');
    const helper = object.isSkeletonHelper || /skeleton|armature|bone[_ -]?structure|phase368_card_dealer_root/i.test(label);
    const visibleBone = object.isBone && !isInside(object, eric);
    if (helper || visibleBone) {
      const root = helper ? object : rootUnderScene(object);
      root.visible = false;
      root.userData = { ...(root.userData || {}), svrPhase384ExternalSkeletonHidden: true };
      hidden += 1;
    }
  });
  state.externalSkeletonsHidden = Math.max(state.externalSkeletonsHidden, hidden);
  return hidden;
}
function feltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(512, 256, 20, 512, 256, 600);
  gradient.addColorStop(0, '#193127');
  gradient.addColorStop(0.62, '#0a1b15');
  gradient.addColorStop(1, '#03100c');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1024, 512);
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 8000; i++) {
    const g = 80 + Math.floor(Math.random() * 90);
    ctx.fillStyle = `rgb(${g},${g + 20},${g})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d8b45f'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(512, 256, 456, 206, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(512, 256, 398, 170, 0, 0, Math.PI * 2); ctx.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 2;
  map.needsUpdate = true;
  return map;
}
function polishTable() {
  table = window.SVR_TABLE_AUTHORITY || table;
  if (!table?.isObject3D) return false;
  const info = bounds(table);
  if (info.box.isEmpty()) return false;
  walk(table, (object) => {
    if (!object.isMesh || !object.material) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    const next = list.map((source) => {
      const material = source?.clone?.() || new THREE.MeshStandardMaterial({ color: 0x17131f });
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.color?.set?.(0xffffff);
      } else {
        const label = `${object.name || ''} ${material.name || ''}`;
        material.color?.setHex?.(/felt|cloth|baize|surface|top/i.test(label) ? 0x0b251b : /metal|frame|leg/i.test(label) ? 0x2a2630 : 0x17131f);
      }
      material.side = THREE.DoubleSide;
      if ('roughness' in material) material.roughness = 0.55;
      if ('metalness' in material) material.metalness = 0.12;
      material.needsUpdate = true;
      return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true;
    object.receiveShadow = true;
  });
  if (!felt) {
    felt = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: 0.92, metalness: 0, side: THREE.DoubleSide })
    );
    felt.name = 'PHASE384_PROFESSIONAL_SVR_FELT';
    felt.rotation.x = -Math.PI / 2;
    felt.position.set(info.center.x, info.box.max.y + 0.008, info.center.z);
    felt.scale.set(info.size.x * 0.45, info.size.z * 0.40, 1);
    scene.add(felt);
    state.feltInstalled = true;
  }
  if (!logo) {
    const logoTexture = new THREE.TextureLoader().load('/logo.png', (map) => { map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true; });
    logo = new THREE.Mesh(
      new THREE.PlaneGeometry(info.size.x * 0.42, info.size.z * 0.34),
      new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
    );
    logo.name = 'PHASE384_SVR_TABLE_LOGO';
    logo.rotation.x = -Math.PI / 2;
    logo.position.set(info.center.x, info.box.max.y + 0.016, info.center.z);
    scene.add(logo);
    state.logoInstalled = true;
  }
  state.tablePolished = true;
  return true;
}
function alignDealer() {
  if (!eric || !table) return false;
  const info = bounds(table);
  eric.position.set(info.center.x, 0, info.box.min.z - 0.42);
  eric.rotation.y = Math.PI;
  eric.visible = true;
  return true;
}
function requestQuickPlay() {
  if (state.quickSeatRequested || params.get('walk') === '1') return;
  window.SVR_PHASE373_STABLE_LOBBY?.('phase384-table-inspection');
  seatTimer = window.setTimeout(() => {
    if (!window.SVR_PHASE361_STATE?.seated && !document.body.classList.contains('svr361-seated')) {
      window.SVR_PHASE373_STABLE_SEAT?.('phase384-quick-play-demo');
      window.SVR_PHASE381_SEAT_LOCK?.('phase384-quick-play-demo');
    }
    state.quickSeatRequested = true;
  }, 6500);
}
function pulseDealer() {
  if (!eric) return;
  window.SVR_PHASE381_PLAY_ERIC?.('phase384-quick-play-demo');
  state.dealerMotionRequested = true;
}
function sweep() {
  scene = window.__SVR_SCENE__ || scene;
  table = window.SVR_TABLE_AUTHORITY || table;
  eric = approvedEric() || eric;
  if (!scene || !table || !eric) return false;
  state.ericFound = true;
  textureEric(eric);
  dedupeDealer();
  hideExternalSkeletons();
  polishTable();
  alignDealer();
  requestQuickPlay();
  if (!state.dealerMotionRequested) pulseDealer();
  return true;
}
function qa() {
  state.checkedAt = new Date().toISOString();
  return { ...state, pass: !active || (state.ericFound && state.ericTexturedMaterials > 0 && state.tablePolished && state.feltInstalled && state.logoInstalled) };
}
function install() {
  if (!active || state.installed) return;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  timer = window.setInterval(sweep, 650);
  window.addEventListener('svr:phase381-core-ready', sweep);
  window.addEventListener('svr:phase380-original-table-ready', sweep);
  window.addEventListener('beforeunload', () => { clearInterval(timer); clearTimeout(seatTimer); }, { once: true });
}
install();
window.SVR_PHASE384_QUEST_SWEEP = sweep;
window.SVR_PHASE384_QUEST_QA = qa;
window.SVR_PHASE384_QUEST_STATE = state;
