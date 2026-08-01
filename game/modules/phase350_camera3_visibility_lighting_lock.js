import * as THREE from 'three';

const BUILD = 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK';
const ROOT_NAME = 'PHASE350_CAMERA3_LIGHTING_ROOT';
const ACTIVE = /\/game\/camera3\.html$/i.test(location.pathname)
  || new URLSearchParams(location.search).get('cam') === 'director'
  || new URLSearchParams(location.search).has('director');
let root = null;
let installed = false;
let materialRepairs = 0;
let lightRepairs = 0;
let lastError = null;

const scene = () => window.__SVR_SCENE__ || null;
const renderer = () => window.__SVR_RENDERER__ || null;
function worldRoot() { return scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene(); }
function table() {
  const root = worldRoot();
  return root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || root?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT')
    || root?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED')
    || root?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
    || null;
}
function tableInfo() {
  const object = table();
  if (!object) return null;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  return { object, box, center, size, top: box.max.y };
}
function removeDuplicateRoots() {
  const current = scene();
  if (!current) return;
  const roots = [];
  current.traverse((object) => { if (object.name === ROOT_NAME) roots.push(object); });
  root = roots.shift() || null;
  for (const duplicate of roots) { duplicate.removeFromParent?.(); lightRepairs += 1; }
}
function makeLightRoot() {
  const current = scene();
  if (!current) return null;
  removeDuplicateRoots();
  if (root) return root;
  root = new THREE.Group();
  root.name = ROOT_NAME;
  const hemisphere = new THREE.HemisphereLight(0xdffbff, 0x16091f, 2.15);
  hemisphere.name = 'PHASE350_CAMERA3_HEMISPHERE';
  const ambient = new THREE.AmbientLight(0xffffff, 0.72);
  ambient.name = 'PHASE350_CAMERA3_AMBIENT';
  const key = new THREE.DirectionalLight(0xfff4dc, 2.35);
  key.name = 'PHASE350_CAMERA3_KEY'; key.position.set(4.5, 7.5, 4.8); key.castShadow = false;
  const fill = new THREE.DirectionalLight(0x8defff, 1.55);
  fill.name = 'PHASE350_CAMERA3_FILL'; fill.position.set(-5.2, 4.0, 2.5); fill.castShadow = false;
  const rim = new THREE.PointLight(0x8b68ff, 2.4, 12, 2);
  rim.name = 'PHASE350_CAMERA3_RIM'; rim.position.set(0, 4.2, -3.5); rim.castShadow = false;
  const gold = new THREE.PointLight(0xffd98a, 1.65, 9, 2);
  gold.name = 'PHASE350_CAMERA3_GOLD'; gold.position.set(2.5, 2.8, 2.0); gold.castShadow = false;
  root.add(hemisphere, ambient, key, fill, rim, gold);
  current.add(root);
  return root;
}
function tuneRenderer() {
  const value = renderer();
  if (!value) return false;
  value.outputColorSpace = THREE.SRGBColorSpace;
  value.toneMapping = THREE.ACESFilmicToneMapping;
  value.toneMappingExposure = 1.22;
  value.shadowMap.enabled = false;
  value.setPixelRatio(Math.min(1.2, window.devicePixelRatio || 1));
  return true;
}
function tuneScene() {
  const current = scene();
  if (!current) return false;
  current.background = new THREE.Color(0x050814);
  current.fog = null;
  return true;
}
function tuneMaterials() {
  const info = tableInfo();
  const current = scene();
  if (!current) return;
  const bounds = info?.box?.clone()?.expandByScalar(1.8) || null;
  current.traverse((object) => {
    if (!object.isMesh || !object.visible || !object.material) return;
    if (bounds) {
      const position = object.getWorldPosition(new THREE.Vector3());
      if (!bounds.containsPoint(position) && !/(CARD|CHIP|POT|LOGO|DEALER|PLAYER|BOT|ERIC|CLAUDIA)/i.test(object.name || '')) return;
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || material.userData?.phase350Camera3) continue;
      material.userData = { ...(material.userData || {}), phase350Camera3: true };
      if ('roughness' in material) material.roughness = Math.min(.82, Math.max(.22, Number(material.roughness ?? .55)));
      if ('metalness' in material) material.metalness = Math.min(.82, Math.max(0, Number(material.metalness ?? .05)));
      if (material.color && material.emissive && 'emissiveIntensity' in material) {
        material.emissive.copy(material.color).multiplyScalar(.07);
        material.emissiveIntensity = Math.max(.10, Number(material.emissiveIntensity || 0));
      }
      material.needsUpdate = true;
      materialRepairs += 1;
    }
  });
}
function alignLights() {
  const info = tableInfo();
  if (!info || !root) return;
  const key = root.getObjectByName('PHASE350_CAMERA3_KEY');
  const fill = root.getObjectByName('PHASE350_CAMERA3_FILL');
  const rim = root.getObjectByName('PHASE350_CAMERA3_RIM');
  const gold = root.getObjectByName('PHASE350_CAMERA3_GOLD');
  key?.position.set(info.center.x + info.size.x * .75, info.top + 5.0, info.center.z + info.size.z * .85);
  key?.target?.position.set(info.center.x, info.top, info.center.z); if (key?.target && !key.target.parent) root.add(key.target);
  fill?.position.set(info.center.x - info.size.x * .85, info.top + 3.2, info.center.z + info.size.z * .45);
  fill?.target?.position.set(info.center.x, info.top, info.center.z); if (fill?.target && !fill.target.parent) root.add(fill.target);
  rim?.position.set(info.center.x, info.top + 3.0, info.center.z - info.size.z * 1.5);
  gold?.position.set(info.center.x + info.size.x * .65, info.top + 1.8, info.center.z + info.size.z * .65);
}
function enforce() {
  if (!ACTIVE) return;
  try {
    makeLightRoot(); tuneScene(); tuneRenderer(); alignLights(); tuneMaterials();
    document.body.style.background = '#050814';
    document.body.classList.add('svr-camera3-visible');
    lastError = null;
  } catch (error) { lastError = String(error?.message || error); }
}
function qa() {
  const lights = [];
  root?.traverse?.((object) => { if (object.isLight) lights.push({ name: object.name, intensity: object.intensity }); });
  const value = renderer();
  const result = {
    build: BUILD,
    active: ACTIVE,
    root: Boolean(root),
    lightCount: lights.length,
    lights,
    table: Boolean(tableInfo()),
    background: scene()?.background?.getHexString?.() || null,
    toneMappingExposure: value?.toneMappingExposure ?? null,
    outputColorSpace: value?.outputColorSpace ?? null,
    shadows: value?.shadowMap?.enabled ?? null,
    materialRepairs,
    lightRepairs,
    lastError,
    checkedAt: new Date().toISOString()
  };
  result.pass = ACTIVE && result.root && result.lightCount >= 5 && result.table && Number(result.toneMappingExposure || 0) >= 1.1 && result.shadows === false;
  window.SVR_PHASE350_CAMERA3_QA_STATE = result;
  return result;
}
function install() {
  if (installed || !ACTIVE) return;
  installed = true;
  [0, 250, 800, 1800, 3500].forEach((delay) => setTimeout(enforce, delay));
  setInterval(enforce, 2500);
  window.SVR_PHASE350_CAMERA3_QA = qa;
  window.SVR_PHASE350_CAMERA3_RELIGHT = () => { enforce(); return qa(); };
}
install();
