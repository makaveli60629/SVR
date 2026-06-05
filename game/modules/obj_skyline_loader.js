import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const BUILD = "PHASE-121-BRIGHT-ALIGNED-OBJ-SKYLINE-LOCK";
const MODEL_PATHS = ["./assets/models/skyline/buildings_sprite.obj", "./assets/models/skyline/skyline_03.obj", "./assets/models/skyline/skyline_04.obj"];

function hashString(input = "") { let h = 2166136261; for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rand(seed) { let s = seed >>> 0; return () => { s = Math.imul(1664525, s) + 1013904223; return ((s >>> 0) / 4294967296); }; }

function makeWindowTexture(name = "building") {
  const seed = hashString(name); const r = rand(seed);
  const c = document.createElement("canvas"); c.width = 512; c.height = 1024; const x = c.getContext("2d");
  const grad = x.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#3a6a7c"); grad.addColorStop(.42, "#28586b"); grad.addColorStop(1, "#183646");
  x.fillStyle = grad; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 2;
  for (let yy = 18; yy < c.height; yy += 38) { x.beginPath(); x.moveTo(0, yy); x.lineTo(c.width, yy); x.stroke(); }
  for (let xx = 26; xx < c.width; xx += 50) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, c.height); x.stroke(); }
  for (let row = 0; row < 24; row++) for (let col = 0; col < 9; col++) {
    const on = r() > .22; const wx = 24 + col * 52 + r() * 6; const wy = 28 + row * 40 + r() * 6;
    x.fillStyle = on ? `rgba(${150 + r()*80|0},${220 + r()*30|0},255,${.55 + r()*.35})` : "rgba(12,24,34,.65)";
    x.fillRect(wx, wy, 25 + r()*12, 16 + r()*8);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.2, 2.8); tex.anisotropy = 8; return tex;
}

function makeRoofTexture(name = "roof") {
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d"); const r = rand(hashString(name));
  x.fillStyle = "#697178"; x.fillRect(0,0,512,512);
  for (let i=0;i<1000;i++){ const v=80+r()*90|0; x.fillStyle=`rgba(${v},${v},${v},${.04+r()*.12})`; x.fillRect(r()*512,r()*512,1+r()*3,1+r()*3); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.1,1.1); return tex;
}

function materialForName(name = "Building") {
  const n = String(name).toLowerCase(); const roof = /top|roof|concrete|air_conditioner|side/.test(n);
  if (roof) return new THREE.MeshStandardMaterial({ map: makeRoofTexture(name), color: 0xffffff, roughness: .72, metalness: .06, emissive: 0x1b2226, emissiveIntensity: .18, side: THREE.DoubleSide });
  return new THREE.MeshBasicMaterial({ map: makeWindowTexture(name), color: 0xffffff, side: THREE.DoubleSide });
}

function setObjectMaterial(object) {
  let i = 0; object.traverse((child) => { if (!child.isMesh) return; child.castShadow = false; child.receiveShadow = false; child.frustumCulled = true; child.material = materialForName(child.material?.name || child.name || `building_${i++}`); });
}
function bounds(object) { object.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(object); const size = new THREE.Vector3(); const center = new THREE.Vector3(); box.getSize(size); box.getCenter(center); return { box, size, center }; }
function makeUpright(object) { let { size } = bounds(object); if (size.z > size.y * 1.35 && size.z > size.x * .9) object.rotation.x = -Math.PI / 2; else if (size.x > size.y * 1.35 && size.x > size.z * .9) object.rotation.z = Math.PI / 2; object.updateMatrixWorld(true); return object; }
function normalizeBuilding(object, targetHeight = 38) { makeUpright(object); let b = bounds(object); if (b.size.y > .0001) object.scale.multiplyScalar(targetHeight / b.size.y); object.updateMatrixWorld(true); b = bounds(object); object.position.x -= b.center.x; object.position.z -= b.center.z; object.position.y -= b.box.min.y; return object; }

function cloneForSkyline(source, index, total) {
  const clone = source.clone(true); clone.name = `SVR_PHASE121_ALIGNED_REAL_OBJ_BUILDING_${index + 1}`;
  const angle = (-145 + (290 / Math.max(1, total - 1)) * index) * THREE.MathUtils.DEG2RAD; const radius = 94 + (index % 4) * 7;
  clone.scale.multiplyScalar(.86 + (index % 5) * .11); clone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  clone.rotation.set(0, Math.PI / 2 - angle, 0); clone.userData.phase121Skyline = true; return clone;
}
function addFallbackSkyline(group) { for (let i=0;i<24;i++){ const angle=i/24*Math.PI*2; const radius=92+(i%5)*4; const h=24+(i%8)*4; const mesh=new THREE.Mesh(new THREE.BoxGeometry(4+(i%3),h,3), materialForName("fallback"+i)); mesh.name=`SVR_PHASE121_ALIGNED_FALLBACK_BUILDING_${i+1}`; mesh.position.set(Math.cos(angle)*radius,h*.5,Math.sin(angle)*radius); mesh.rotation.y=Math.PI/2-angle; group.add(mesh); } }

export async function applyObjSkylineBackground(scene, { log = console.log } = {}) {
  if (!scene) return null;
  ["SVR_PHASE115_TEXTURED_OBJ_SKYLINE_BACKGROUND_LOCK", "SVR_PHASE84_OBJ_SKYLINE_BACKGROUND_LOCK", "SVR_PHASE121_ALIGNED_BRIGHT_OBJ_SKYLINE_LOCK"].forEach((n)=>{ const o=scene.getObjectByName(n); if(o?.parent) o.parent.remove(o); });
  const group = new THREE.Group(); group.name = "SVR_PHASE121_ALIGNED_BRIGHT_OBJ_SKYLINE_LOCK"; group.userData.build = BUILD; scene.add(group);
  const loader = new OBJLoader(); const sources = [];
  for (const path of MODEL_PATHS) { try { const obj = await loader.loadAsync(path); obj.name = `SVR_PHASE121_SOURCE_${path.split("/").pop()}`; setObjectMaterial(obj); normalizeBuilding(obj, 38 + sources.length * 5); sources.push(obj); log?.("Phase 121 real OBJ skyline loaded", path); } catch (err) { log?.("Phase 121 OBJ skyline miss", path, err?.message || err); } }
  if (!sources.length) addFallbackSkyline(group); else { const placements = Math.min(12, sources.length * 4); for (let i=0;i<placements;i++) group.add(cloneForSkyline(sources[i % sources.length], i, placements)); }
  const light = new THREE.HemisphereLight(0x9fefff, 0x0b1018, .45); light.name = "SVR_PHASE121_SKYLINE_EXTRA_LIGHT"; group.add(light);
  window.SVR_PHASE121_OBJ_SKYLINE = { build: BUILD, realObjCount: sources.length, aligned: true, bright: true };
  scene.userData.SVR_PHASE121_OBJ_SKYLINE = window.SVR_PHASE121_OBJ_SKYLINE; log?.("Phase 121 aligned bright OBJ skyline active", window.SVR_PHASE121_OBJ_SKYLINE); return group;
}
