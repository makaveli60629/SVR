import * as THREE from "three";

const PHASE163 = "PHASE-163-FLOOR-NO-BLINK-TABLE-TAG-CLEANUP";
let lastScene = null;
let installedScene = null;
let lastSweep = 0;

function makeFloorTexture(){
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#07080d";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(130,145,165,.22)";
  x.lineWidth = 1;
  for(let i=0;i<=c.width;i+=48){
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,c.height); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(c.width,i); x.stroke();
  }
  x.strokeStyle = "rgba(113,247,255,.08)";
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

function addCleanFloor(scene){
  let floor = scene.getObjectByName("SVR_PHASE163_SINGLE_LOCKED_FLOOR");
  if(floor) return floor;
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(82,82,1,1),
    new THREE.MeshBasicMaterial({ map:makeFloorTexture(), color:0xffffff, transparent:false, depthWrite:true, depthTest:true, side:THREE.FrontSide, toneMapped:false, polygonOffset:true, polygonOffsetFactor:1, polygonOffsetUnits:1 })
  );
  floor.name = "SVR_PHASE163_SINGLE_LOCKED_FLOOR";
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0,-0.035,0);
  floor.renderOrder = -100000;
  floor.frustumCulled = false;
  floor.userData.phase163StableFloor = true;
  scene.add(floor);
  return floor;
}

function isFlatFloorCandidate(obj){
  if(!obj?.isMesh || !obj.geometry || obj.userData?.phase163StableFloor) return false;
  let p = obj;
  while(p){
    const n = String(p.name || "").toLowerCase();
    if(/table|card|chip|watch|hand|button|portal_marker|teleport|pointer|planet|moon|mars|cat|sign|panel|billboard|text|label/.test(n)) return false;
    p = p.parent;
  }
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  if(center.y < -0.11 || center.y > 0.12) return false;
  if(size.y > 0.18) return false;
  const flatLarge = size.x > 5.5 && size.z > 5.5;
  const name = String(obj.name || "").toLowerCase();
  const floorNamed = /floor|ground|grid|deck|shadow|mat|overlay|plane/.test(name);
  const transparent = Array.isArray(obj.material) ? obj.material.some(m=>m?.transparent || m?.opacity < .99 || m?.depthWrite === false) : (obj.material?.transparent || obj.material?.opacity < .99 || obj.material?.depthWrite === false);
  return flatLarge || floorNamed || transparent;
}

function cleanupFloors(scene){
  let hidden = 0;
  scene.traverse((obj)=>{
    if(!isFlatFloorCandidate(obj)) return;
    obj.visible = false;
    obj.layers?.disableAll?.();
    obj.userData.phase163HiddenBlinkFloor = true;
    hidden++;
  });
  const floor = addCleanFloor(scene);
  floor.visible = true;
  floor.layers?.enableAll?.();
  scene.userData.phase163HiddenFloors = hidden;
}

function findRootPad(obj){
  let p = obj;
  while(p){
    if(/^PHASE147_HAND_SEAT_PAD_/.test(String(p.name || ""))) return p;
    p = p.parent;
  }
  return null;
}

function tuneSeatLabels(scene){
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if(!/^PHASE147_SEAT_SIGN_/.test(name) || !obj.isMesh) return;
    obj.scale.setScalar(0.46);
    obj.position.set(0,0.70,0.16);
    obj.renderOrder = 120000;
    if(obj.material){
      obj.material.opacity = 0.82;
      obj.material.depthTest = true;
      obj.material.depthWrite = false;
      obj.material.needsUpdate = true;
    }
    obj.userData.phase163CompactSeatSign = true;
  });

  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if(!/^PHASE147_SEAT_RING_/.test(name) || !obj.isMesh) return;
    obj.scale.setScalar(0.82);
    obj.position.y = 0.055;
    if(obj.material){ obj.material.opacity = Math.min(obj.material.opacity || .55, .62); obj.material.needsUpdate = true; }
  });
}

function tuneStatusPanels(scene){
  scene.traverse((obj)=>{
    if(!obj?.isMesh) return;
    const n = String(obj.name || "").toLowerCase();
    if(!/status|action|poker.*panel/.test(n)) return;
    if(obj.geometry?.parameters?.width > 2.5){
      obj.scale.setScalar(0.78);
      obj.position.y = Math.max(obj.position.y, 2.0);
      obj.renderOrder = 119000;
      if(obj.material){ obj.material.depthTest = true; obj.material.depthWrite = false; obj.material.needsUpdate = true; }
    }
  });
}

function install(scene){
  if(!scene) return;
  lastScene = scene;
  if(installedScene !== scene){
    installedScene = scene;
    cleanupFloors(scene);
    tuneSeatLabels(scene);
    tuneStatusPanels(scene);
    console.log(`[${PHASE163}] installed`, { hiddenFloors: scene.userData.phase163HiddenFloors || 0 });
  }
}

const oldRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase163FloorTags){
  THREE.WebGLRenderer.prototype.__svrPhase163FloorTags = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    install(scene);
    const now = performance.now();
    if(scene && now - lastSweep > 1600){
      cleanupFloors(scene);
      tuneSeatLabels(scene);
      tuneStatusPanels(scene);
      lastSweep = now;
    }
    return oldRender.call(this,scene,camera);
  };
}
setInterval(()=>{ if(lastScene){ cleanupFloors(lastScene); tuneSeatLabels(lastScene); tuneStatusPanels(lastScene); } },2200);
console.log(`[${PHASE163}] loaded`);
