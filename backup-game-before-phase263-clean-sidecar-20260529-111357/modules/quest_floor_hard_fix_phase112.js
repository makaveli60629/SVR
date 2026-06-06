import * as THREE from "three";

const PHASE112 = "PHASE-112-QUEST-STABLE-FLOOR-NO-BLINK";
let lastScene = null;
let installedScene = null;
let lastSweep = 0;

function isMesh(obj){ return !!obj?.isMesh && !!obj.geometry; }
function worldBox(obj){
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { size, center };
}
function mats(obj){ return Array.isArray(obj.material) ? obj.material : [obj.material]; }
function isProtected(obj){
  let p = obj;
  while (p){
    const n = String(p.name || "").toLowerCase();
    if (/portal|button|marker|teleport|pointer|chair|seat|card|chip|table|watch|ball|cup|pga_phase110|pga_pro|reiki_room_symbols|hologram/.test(n)) return true;
    if (p.userData?.portalKey) return true;
    p = p.parent;
  }
  return false;
}
function isBadLowFloor(obj){
  if (!isMesh(obj) || isProtected(obj)) return false;
  const { size, center } = worldBox(obj);
  if (center.y < -0.16 || center.y > 0.18 || size.y > 0.24) return false;
  const type = String(obj.geometry?.type || "");
  const lowPlane = /PlaneGeometry|CircleGeometry|RingGeometry|ShapeGeometry|BufferGeometry/.test(type);
  const large = size.x > 1.2 && size.z > 1.2;
  if (!lowPlane || !large) return false;
  const n = String(obj.name || "").toLowerCase();
  const transparent = mats(obj).some(m => m && (m.transparent || m.opacity < 0.99 || m.depthWrite === false || m.blending !== THREE.NormalBlending));
  const floorNamed = /floor|grid|glow|shadow|halo|ring|circle|carpet|rug|deck|logo|overlay/.test(n);
  return transparent || floorNamed || size.x > 7 || size.z > 7;
}

function makeStableGridTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#08090d";
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,150,170,0.20)";
  x.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= c.width; i += step){
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(c.width, i); x.stroke();
  }
  x.strokeStyle = "rgba(120,255,210,0.07)";
  x.lineWidth = 2;
  for (let i = 0; i <= c.width; i += step * 4){
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(c.width, i); x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 2;
  return tex;
}

function addStableFloor(scene){
  let floor = scene.getObjectByName("SVR_PHASE112_STABLE_OPAQUE_FLOOR");
  if (floor) return floor;
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70, 1, 1),
    new THREE.MeshBasicMaterial({ map: makeStableGridTexture(), color: 0xffffff, transparent: false, depthWrite: true, depthTest: true, side: THREE.FrontSide, toneMapped: false })
  );
  floor.name = "SVR_PHASE112_STABLE_OPAQUE_FLOOR";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.006, 0);
  floor.renderOrder = -9999;
  floor.frustumCulled = false;
  floor.userData.phase112StableFloor = true;
  scene.add(floor);
  return floor;
}

function sweepFloor(scene){
  if (!scene?.traverse) return;
  let hidden = 0;
  scene.traverse((obj)=>{
    if (obj?.userData?.phase112StableFloor) return;
    if (!isBadLowFloor(obj)) return;
    obj.visible = false;
    obj.layers.disableAll?.();
    obj.userData.phase112HiddenBlinkFloor = true;
    hidden++;
  });
  const floor = addStableFloor(scene);
  floor.visible = true;
  floor.layers.enableAll?.();
  scene.userData.phase112FloorHiddenCount = hidden;
}

function install(scene){
  if (!scene) return;
  lastScene = scene;
  if (installedScene !== scene){
    installedScene = scene;
    sweepFloor(scene);
    console.log(`[${PHASE112}] stable floor installed; hidden blink layers=${scene.userData.phase112FloorHiddenCount || 0}`);
  }
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrFloorPhase112Render){
  THREE.WebGLRenderer.prototype.__svrFloorPhase112Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    install(scene);
    const now = performance.now();
    if (scene && now - lastSweep > 2500){
      sweepFloor(scene);
      lastSweep = now;
    }
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ if (lastScene) sweepFloor(lastScene); }, 3000);
console.log(`[${PHASE112}] loaded`);
