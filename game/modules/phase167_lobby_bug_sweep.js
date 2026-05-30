import * as THREE from "three";

const PHASE167 = "PHASE-167-LOBBY-BUG-SWEEP-AWS-RULE";
let lastScene = null;
let lastSweep = 0;
let stableFloor = null;

function makeFloorTexture(){
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#07080d";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(150,165,185,.20)";
  x.lineWidth = 1;
  for(let i=0;i<=c.width;i+=48){
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,c.height); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(c.width,i); x.stroke();
  }
  x.strokeStyle = "rgba(113,247,255,.09)";
  x.lineWidth = 2;
  for(let i=0;i<=c.width;i+=192){
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,c.height); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(c.width,i); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(18,18);
  t.anisotropy = 2;
  return t;
}

function ensureStableFloor(scene){
  if(stableFloor && stableFloor.parent === scene) return stableFloor;
  stableFloor = scene.getObjectByName("SVR_PHASE167_SINGLE_STABLE_FLOOR");
  if(stableFloor) return stableFloor;
  stableFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(84,84,1,1),
    new THREE.MeshBasicMaterial({ map:makeFloorTexture(), color:0xffffff, side:THREE.FrontSide, depthTest:true, depthWrite:true, transparent:false, toneMapped:false })
  );
  stableFloor.name = "SVR_PHASE167_SINGLE_STABLE_FLOOR";
  stableFloor.rotation.x = -Math.PI/2;
  stableFloor.position.set(0,-0.052,0);
  stableFloor.renderOrder = -200000;
  stableFloor.frustumCulled = false;
  stableFloor.userData.phase167StableFloor = true;
  scene.add(stableFloor);
  return stableFloor;
}

function shouldHideFloor(obj){
  if(!obj?.isMesh || obj.userData?.phase167StableFloor) return false;
  const name = String(obj.name || "").toLowerCase();
  if(/table|felt|card|chip|watch|hand|button|portal|marker|teleport|pointer|planet|moon|mars|cat|sign|panel|billboard|label|seat|bot|avatar|character/.test(name)) return false;
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  if(center.y < -0.18 || center.y > 0.18) return false;
  if(size.y > 0.22) return false;
  const largeFlat = size.x > 5.0 && size.z > 5.0;
  const namedFloor = /floor|ground|grid|deck|shadow|mat|overlay|plane/.test(name);
  const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
  const riskyTransparency = !!(mat?.transparent || mat?.depthWrite === false || (Number.isFinite(mat?.opacity) && mat.opacity < .99));
  return largeFlat || namedFloor || riskyTransparency;
}

function compactSeatAndTableTags(scene){
  const candidates = [];
  scene.traverse((obj)=>{
    if(!obj?.isMesh || !obj.visible || obj.userData?.phase167StableFloor) return;
    const name = String(obj.name || "").toLowerCase();
    if(/card|chip|felt|table|floor|ground|portal|moon|mars|planet|watch|hand|cat|storefront|reiki|pga|lounge|scorpion.*hologram/.test(name)) return;
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);
    const dist = Math.hypot(center.x, center.z);
    const looksLikeTag = center.y > .45 && center.y < 2.65 && dist < 5.4 && Math.max(size.x,size.z) > 1.0 && size.y < 1.45;
    const textLike = /bot|seat|south|north|edge|back|front|right|left|status|action|plaque|sign|label/.test(name);
    const hasMap = !!(Array.isArray(obj.material) ? obj.material.some(m=>m?.map) : obj.material?.map);
    if(looksLikeTag && (textLike || hasMap)) candidates.push({obj,center,size,dist});
  });

  candidates.sort((a,b)=>Math.atan2(a.center.z,a.center.x)-Math.atan2(b.center.z,b.center.x));
  candidates.forEach((rec,idx)=>{
    const obj = rec.obj;
    const angle = Math.atan2(rec.center.z, rec.center.x);
    const radius = 3.45 + (idx % 2) * .22;
    const y = .92 + Math.floor(idx/2) * .08;
    const targetWorld = new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius);
    if(obj.parent){
      const local = obj.parent.worldToLocal(targetWorld.clone());
      obj.position.copy(local);
    } else obj.position.copy(targetWorld);
    obj.scale.multiplyScalar(obj.userData.phase167Compacted ? 1 : .42);
    obj.userData.phase167Compacted = true;
    obj.renderOrder = 85000;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat)=>{
      if(!mat) return;
      mat.depthTest = true;
      mat.depthWrite = false;
      if(Number.isFinite(mat.opacity)) mat.opacity = Math.min(mat.opacity, .82);
      mat.needsUpdate = true;
    });
  });
  scene.userData.phase167CompactedTags = candidates.length;
}

function hideBlinkFloors(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    if(!shouldHideFloor(obj)) return;
    obj.visible = false;
    obj.userData.phase167HiddenBlinkFloor = true;
    hidden++;
  });
  ensureStableFloor(scene).visible = true;
  scene.userData.phase167HiddenFloors = hidden;
}

function tuneRenderer(renderer){
  if(!renderer || renderer.__phase167Tune) return;
  renderer.__phase167Tune = true;
  try{
    const questLike = /Quest|OculusBrowser|MetaQuest|VR/i.test(navigator.userAgent || "");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, questLike ? 1.0 : 1.25));
    renderer.shadowMap.enabled = false;
  }catch(_){}
}

function install(scene, renderer){
  if(!scene) return;
  lastScene = scene;
  tuneRenderer(renderer);
  hideBlinkFloors(scene);
  compactSeatAndTableTags(scene);
}

const oldRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase167BugSweep){
  THREE.WebGLRenderer.prototype.__svrPhase167BugSweep = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    const now = performance.now();
    if(scene && now - lastSweep > 1200){
      install(scene, this);
      lastSweep = now;
    }
    return oldRender.call(this, scene, camera);
  };
}
setInterval(()=>{ if(lastScene) install(lastScene, null); }, 2000);
console.log(`[${PHASE167}] loaded`);
