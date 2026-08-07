/* PHASE-392-CAMERA3-TABLE-SHOWCASE-LOCK */
import * as THREE from 'three';
export const BUILD = 'PHASE-392-CAMERA3-TABLE-SHOWCASE-LOCK';

const state = {
  build: BUILD,
  installed: false,
  tableReady: false,
  cardsReady: false,
  ericReady: false,
  lightingReady: false,
  cameraReady: false,
  visibleMeshes: 0,
  shotIndex: 0,
  frames: 0,
  fps: 0,
  lastError: null,
  checkedAt: null
};
let scene, camera, renderer, table, lights, raf = 0, timer = 0;
let shotStart = performance.now(), fpsStart = performance.now(), fpsFrames = 0;
const from = new THREE.Vector3(), to = new THREE.Vector3(), target = new THREE.Vector3();

function walk(root, fn, limit = 24000) {
  const stack = root ? [root] : [];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { fn(object); } catch {}
    for (const child of object.children || []) if (child && !seen.has(child)) stack.push(child);
  }
}
function info(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()), top: box.max.y };
}
function findTable() {
  return window.SVR_TABLE_AUTHORITY
    || window.SVR_PHASE380_ORIGINAL_TABLE
    || scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')
    || null;
}
function show(root) {
  let meshes = 0;
  walk(root, (object) => {
    object.visible = true;
    if (!object.isMesh) return;
    meshes++;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      material.visible = true;
      material.side = THREE.DoubleSide;
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
        material.color?.set?.(0xffffff);
      }
      material.needsUpdate = true;
    });
  });
  state.visibleMeshes = meshes;
}
function makeLights(tableInfo) {
  lights?.removeFromParent?.();
  lights = new THREE.Group();
  lights.name = 'PHASE389_CAMERA3_PRODUCTION_LIGHTING';
  lights.userData = { ...(lights.userData || {}), phase392Showcase: true, build: BUILD };
  const ambient = new THREE.AmbientLight(0xffffff, 1.35);
  const hemi = new THREE.HemisphereLight(0xe8fbff, 0x16051f, 2.8);
  const key = new THREE.SpotLight(0xfff1dc, 14, 18, Math.PI / 4.1, .45, 1.2);
  const fill = new THREE.DirectionalLight(0x8fefff, 4.2);
  const rim = new THREE.PointLight(0xa66cff, 7.2, 12, 1.7);
  const gold = new THREE.PointLight(0xffd98a, 5.2, 10, 1.8);
  key.position.set(tableInfo.center.x + tableInfo.size.x * .75, tableInfo.top + 4.4, tableInfo.center.z + tableInfo.size.z * .9);
  key.target.position.copy(tableInfo.center).setY(tableInfo.top - .03);
  fill.position.set(tableInfo.center.x - tableInfo.size.x, tableInfo.top + 2.8, tableInfo.center.z + tableInfo.size.z * .4);
  fill.target.position.copy(tableInfo.center);
  rim.position.set(tableInfo.center.x, tableInfo.top + 1.7, tableInfo.center.z - tableInfo.size.z * 1.5);
  gold.position.set(tableInfo.center.x + tableInfo.size.x * .62, tableInfo.top + .9, tableInfo.center.z + tableInfo.size.z * .35);
  lights.add(ambient, hemi, key, key.target, fill, fill.target, rim, gold);
  scene.add(lights);
  state.lightingReady = true;
}
function shots(tableInfo) {
  const long = Math.max(tableInfo.size.x, tableInfo.size.z);
  const near = Math.max(2.7, long * .92);
  const y = tableInfo.top + Math.max(1.15, tableInfo.size.z * .48);
  return [
    new THREE.Vector3(tableInfo.center.x, y + .35, tableInfo.center.z + near),
    new THREE.Vector3(tableInfo.center.x + near * .68, y, tableInfo.center.z + near * .72),
    new THREE.Vector3(tableInfo.center.x - near * .68, y + .15, tableInfo.center.z + near * .72)
  ];
}
function selectShot(tableInfo, index, immediate = false) {
  const list = shots(tableInfo);
  state.shotIndex = ((index % list.length) + list.length) % list.length;
  from.copy(camera.position);
  to.copy(list[state.shotIndex]);
  target.copy(tableInfo.center).setY(tableInfo.top - .02);
  shotStart = performance.now();
  if (immediate) {
    camera.position.copy(to);
    camera.lookAt(target);
  }
}
function tuneRenderer() {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(1.4, window.devicePixelRatio || 1));
  renderer.setClearColor(0x02040a, 1);
  scene.background = new THREE.Color(0x02040a);
  scene.fog = null;
}
function cardCount() {
  let count = 0;
  const root = scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  walk(root, (object) => {
    if (object?.isMesh && /^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(object.name || '')) count++;
  }, 4000);
  return count;
}
function frame(now) {
  if (!state.installed) return;
  try {
    const tableInfo = info(table);
    if ((now - shotStart) > 6500) selectShot(tableInfo, state.shotIndex + 1);
    const t = Math.min(1, (now - shotStart) / 1200);
    const smooth = t * t * (3 - 2 * t);
    camera.position.lerpVectors(from, to, smooth);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    state.frames++;
    fpsFrames++;
    if (now - fpsStart > 1000) {
      state.fps = Math.round(fpsFrames * 1000 / Math.max(1, now - fpsStart));
      fpsFrames = 0;
      fpsStart = now;
    }
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  raf = requestAnimationFrame(frame);
}
async function enforce(reason = 'interval') {
  scene = window.__SVR_SCENE__ || scene;
  camera = window.__SVR_CAMERA__ || camera;
  renderer = window.__SVR_RENDERER__ || renderer;
  if (!scene || !camera || !renderer) return false;
  try { window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.(`phase392-showcase-${reason}`); } catch {}
  table = findTable() || table;
  if (!table) return false;
  table.visible = true;
  show(table);
  const tableInfo = info(table);
  if (!state.lightingReady) makeLights(tableInfo);
  tuneRenderer();
  state.cardsReady = cardCount() >= 17;
  state.ericReady = Boolean(window.SVR_PHASE391_ERIC_QA?.().pass || window.SVR_PHASE391_ERIC_STATE?.loaded);
  if (!state.cameraReady) {
    selectShot(tableInfo, 0, true);
    state.cameraReady = true;
  }
  state.tableReady = true;
  state.installed = true;
  state.checkedAt = new Date().toISOString();
  document.body.classList.add('showcase-ready');
  return true;
}
async function install() {
  const started = performance.now();
  while (performance.now() - started < 30000) {
    if (await enforce('boot')) break;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  if (!state.tableReady) {
    state.lastError = 'SHOWCASE_TABLE_NOT_READY';
    return;
  }
  for (const delay of [180, 550, 1300, 2800, 5200]) setTimeout(() => void enforce(`burst-${delay}`), delay);
  timer = setInterval(() => void enforce('heartbeat'), 3500);
  raf = requestAnimationFrame(frame);
  addEventListener('beforeunload', () => { clearInterval(timer); cancelAnimationFrame(raf); }, { once: true });
}
function qa() {
  return {
    ...state,
    cardCount: cardCount(),
    tableName: table?.name || null,
    pass: Boolean(state.installed && state.tableReady && state.cameraReady && state.lightingReady && state.visibleMeshes > 0 && cardCount() >= 17 && state.ericReady && !state.lastError),
    checkedAt: new Date().toISOString()
  };
}
window.SVR_PHASE392_SHOWCASE_ENFORCE = enforce;
window.SVR_PHASE392_SHOWCASE_QA = qa;
window.SVR_PHASE392_SHOWCASE_STATE = state;
install().catch((error) => { state.lastError = String(error?.stack || error); });