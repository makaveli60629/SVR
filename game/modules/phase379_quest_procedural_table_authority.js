import * as THREE from 'three';

export const BUILD = 'PHASE-380-QUEST-PROCEDURAL-TABLE-FALLBACK-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const active = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua);
const FALLBACK_DELAY_MS = 10000;
const startedAt = performance.now();
const preferredNames = [
  'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY',
  'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY',
  'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY',
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'
];
const state = {
  build: BUILD,
  active,
  created: false,
  recoveredExisting: false,
  originalPreferred: true,
  tableName: null,
  attempts: 0,
  lastError: null,
  checkedAt: null
};
let fallback = null;

const scene = () => window.__SVR_SCENE__ || window.SVR_SCENE || window.scene || null;
const camera = () => window.__SVR_CAMERA__ || window.SVR_CAMERA || window.camera || null;
const world = () => scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene();

function scanScene(predicate) {
  const s = scene();
  if (!s) return null;
  let found = null;
  s.traverse?.((object) => {
    if (!found && object?.isObject3D && predicate(object)) found = object;
  });
  return found;
}

function preferredOriginal() {
  const direct = window.SVR_PHASE380_ORIGINAL_TABLE;
  if (direct?.isObject3D) return direct;
  return scanScene((object) => preferredNames.includes(String(object.name || '')));
}

function existingNonFallbackTable() {
  const original = preferredOriginal();
  if (original) return original;
  const authority = window.SVR_TABLE_AUTHORITY;
  if (authority?.isObject3D && authority !== fallback && authority.name !== 'PHASE379_PROCEDURAL_TABLE_AUTHORITY') return authority;
  return scanScene((object) => {
    if (object === fallback) return false;
    const name = String(object.name || '');
    return /POKER_TABLE|TABLE_GLB_AUTHORITY|UPLOADED_TABLE|INTENDED_LOBBY_POKER_TABLE/i.test(name)
      && name !== 'PHASE379_PROCEDURAL_TABLE_AUTHORITY';
  });
}

function forceVisible(object) {
  if (!object?.isObject3D) return false;
  let meshes = 0;
  let cursor = object;
  while (cursor) { cursor.visible = true; cursor = cursor.parent; }
  object.traverse?.((child) => {
    child.visible = true;
    if (!child.isMesh) return;
    meshes += 1;
    child.frustumCulled = false;
    child.castShadow = false;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => {
      material.opacity = 1;
      material.transparent = false;
      material.colorWrite = true;
      material.depthWrite = true;
      material.depthTest = true;
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    });
  });
  state.tableName = object.name || 'unnamed-table';
  return meshes > 0;
}

function removeFallback(reason = 'original-ready') {
  if (fallback?.parent) fallback.parent.remove(fallback);
  fallback = null;
  state.created = false;
  state.reason = reason;
}

function makeMaterial(color, roughness = .72, metalness = .08, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? .35 : 0, side: THREE.DoubleSide });
}

function buildProceduralTable() {
  const s = scene();
  const root = world();
  if (!s || !root || preferredOriginal()) return null;
  const group = new THREE.Group();
  group.name = 'PHASE379_PROCEDURAL_TABLE_AUTHORITY';
  group.userData.svrEmergencyTableOnly = true;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.38, .58, .62, 24), makeMaterial(0x11131a, .5, .25));
  base.position.y = .31;
  base.name = 'PHASE379_TABLE_PEDESTAL';
  group.add(base);

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(1.47, 1.47, .20, 64), makeMaterial(0x12151b, .42, .3));
  frame.scale.z = .56;
  frame.position.y = .76;
  frame.name = 'PHASE379_TABLE_FRAME';
  group.add(frame);

  const felt = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, .075, 64), makeMaterial(0x09050f, .94, .02, 0x220033));
  felt.scale.z = .54;
  felt.position.y = .895;
  felt.name = 'PHASE379_BLACK_FELT';
  group.add(felt);

  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.18, .055, 12, 64), makeMaterial(0xffd98a, .35, .42, 0x5c3900));
  rail.rotation.x = Math.PI / 2;
  rail.scale.z = .53;
  rail.position.y = .948;
  rail.name = 'PHASE379_GOLD_PASS_LINE';
  group.add(rail);

  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 256;
  const ctx = logoCanvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 72px system-ui';
  ctx.fillStyle = '#7ffcff';
  ctx.fillText('SVR', 256, 98);
  ctx.font = '800 34px system-ui';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText('POKER', 256, 160);
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, .54),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(logoCanvas), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  logo.rotation.x = -Math.PI / 2;
  logo.position.y = .94;
  logo.name = 'PHASE379_CENTER_LOGO';
  group.add(logo);

  const chipMat = makeMaterial(0x7ffcff, .45, .18, 0x00333b);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .035, 24), chipMat.clone());
    pad.position.set(Math.sin(angle) * 1.05, .955, Math.cos(angle) * .55);
    pad.name = `PHASE379_SEAT_PAD_${i + 1}`;
    group.add(pad);
  }

  const cam = camera();
  if (cam) {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    cam.getWorldPosition(position);
    cam.getWorldDirection(direction);
    direction.y = 0;
    if (direction.lengthSq() < .01) direction.set(0, 0, -1);
    direction.normalize();
    group.position.set(position.x + direction.x * 2.25, 0, position.z + direction.z * 2.25);
    group.rotation.y = Math.atan2(direction.x, direction.z);
  } else {
    group.position.set(0, 0, .75);
  }

  root.add(group);
  group.updateMatrixWorld(true);
  fallback = group;
  if (!window.SVR_PHASE380_ORIGINAL_TABLE) window.SVR_TABLE_AUTHORITY = group;
  window.SVR_PHASE379_TABLE_AUTHORITY = group;
  state.created = true;
  state.tableName = group.name;
  window.dispatchEvent(new CustomEvent('svr:phase379-table-ready', { detail: { ...state } }));
  return group;
}

function run(reason = 'timer') {
  if (!active) return state;
  state.attempts += 1;
  try {
    const original = preferredOriginal();
    if (original && forceVisible(original)) {
      state.recoveredExisting = true;
      state.tableName = original.name || 'original-table';
      removeFallback('original-table-adopted');
      try { window.SVR_TABLE_AUTHORITY = original; } catch {}
    } else {
      const existing = existingNonFallbackTable();
      if (existing && forceVisible(existing)) {
        state.recoveredExisting = true;
        state.tableName = existing.name || 'existing-table';
        removeFallback('existing-table-adopted');
      } else if (fallback) {
        forceVisible(fallback);
      } else if (performance.now() - startedAt >= FALLBACK_DELAY_MS) {
        buildProceduralTable();
      } else {
        state.reason = 'waiting-for-uploaded-table';
      }
    }
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  state.checkedAt = new Date().toISOString();
  state.reason = reason;
  window.SVR_PHASE379_TABLE_STATE = { ...state };
  return state;
}

window.SVR_PHASE379_FORCE_TABLE = run;
window.SVR_PHASE379_TABLE_QA = () => ({
  ...state,
  originalPresent: Boolean(preferredOriginal()),
  fallbackPresent: Boolean(fallback?.parent),
  tableExists: Boolean(preferredOriginal() || existingNonFallbackTable() || fallback?.parent),
  checkedAt: new Date().toISOString()
});
if (active) {
  [1200, 3500, 7000, 10500, 15000].forEach((delay) => setTimeout(() => run(`delay-${delay}`), delay));
  window.addEventListener('svr:phase380-original-table-ready', () => run('phase380-original-table-ready'));
  window.addEventListener('svr:phase373-core-ready', () => run('phase373-core-ready'));
  window.addEventListener('svr:phase364-ready', () => run('phase364-ready'));
  setInterval(() => run('watchdog'), 5000);
}