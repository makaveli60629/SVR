import * as THREE from "three";

const LABEL = "UPDATE-3.1-F-SINGLE-RUNTIME-QUEST-CONTROLLER-OVERLAY-LOCK";
const MOON_NAME = "UPDATE31D_ONLY_SKY_MOON_LEFT_EYE_CANDY";
const MARS_NAME = "UPDATE31D_TEXTURED_MARS_HIGH_SKY";
const HALO_NAME = "UPDATE31D_ONLY_SKY_MOON_HALO";

function stamp(){
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-F",
    singleRuntimeLock: true,
    legacyAutoloadDisabled: true,
    questControllerVisible: true,
    faceOverlayPurged: true,
    oneMoonOneMars: true,
    headForwardMovement: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE226 = {
    build: LABEL,
    active: true,
    phase: "3.1-F",
    siteTouched: false,
    locksFinalRuntime: true,
    removesFaceSquares: true,
    keepsRightControllerVisible: true,
    keepsMoonHigh: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE106 = Object.assign(window.SVR_PHASE106 || {}, { build: LABEL });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function floorY(x,z){
  const ax=Math.abs(x);
  if(ax>=9.2&&ax<=19.6&&z<=9.8&&z>=-0.35) return THREE.MathUtils.clamp(((8.65-z)/8.15)*3.42,0,3.42);
  if(z<=-9.85&&z>=-16.55&&ax<=20.0) return 3.42;
  if(ax>=14.5&&ax<=20.0&&z<=7.55&&z>=-13.65) return 3.42;
  return 0;
}
function installFloorAlias(){
  window.SVR_PHASE226_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE224_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE215_FLOOR_HEIGHT = floorY;
}

function purgeDom(){
  ["svrDiagPanel","svrUpdate31Badge","bootFallback","log","err","status","mode"].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(id === "svrDiagPanel" || id === "svrUpdate31Badge") el.remove();
    else { el.style.display="none"; el.style.visibility="hidden"; el.style.opacity="0"; el.style.pointerEvents="none"; }
  });
}

function shouldRemoveNearFace(o, head){
  if(!o?.isMesh || !o.geometry || !o.material) return false;
  const n=String(o.name || "");
  if(/Watch|Wrist|Controller|Hand|Teleport|Target|Beam|Ring/i.test(n)) return false;
  const g=String(o.geometry.type || "");
  const transparent = Array.isArray(o.material) ? o.material.some(m=>m?.transparent) : !!o.material.transparent;
  const flat = /Plane|Circle|Ring/.test(g);
  if(!transparent || !flat) return false;
  const p=new THREE.Vector3();
  o.getWorldPosition(p);
  return p.distanceTo(head) < 0.82;
}

function purgeFaceSquares(){
  const scene=window.__SVR_SCENE__;
  const camera=window.__SVR_CAMERA__;
  const renderer=window.__SVR_RENDERER__;
  if(!scene || !camera) return;
  const roots=[camera];
  try{ const xr=renderer?.xr?.getCamera?.(camera); if(xr) roots.push(xr); }catch{}
  const kill=/FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|CAMERA_PANEL|SCREEN_OVERLAY|TRANSPARENT_SQUARE|DIAG|DIAGNOSTIC|UPDATE31C_WORLD_DIAGNOSTIC|PHASE204_VISUAL|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE203_ACTION/i;
  let removed=0;
  roots.forEach(root=>{
    root.children?.slice?.().forEach(child=>{
      const n=String(child.name||"");
      const flat = child.isSprite || (child.isMesh && /Plane|Circle|Ring/.test(child.geometry?.type||"") && child.material?.transparent);
      if(flat || kill.test(n)){ child.visible=false; child.parent?.remove(child); removed++; }
    });
  });
  const head=new THREE.Vector3();
  try{ (renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera).getWorldPosition(head); }catch{ camera.getWorldPosition(head); }
  const toRemove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(kill.test(n) || shouldRemoveNearFace(o, head)) toRemove.push(o);
    if(/UPDATE31E_TEXTURE_REUSE_LABEL/i.test(n)) toRemove.push(o);
  });
  toRemove.forEach(o=>{ o.visible=false; o.parent?.remove(o); removed++; });
  window.SVR_PHASE226_FACE_SQUARE_PURGE = { build:LABEL, removed, checkedAt:new Date().toISOString() };
}

function removeLegacyRoots(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return;
  const remove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(/UPDATE31B_LOBBY_STRUCTURE_COMPLETION_ROOT|UPDATE31B_|UPDATE31C_|UPDATE31E_TEXTURE_REUSE_LABEL/i.test(n)) remove.push(o);
  });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); });
  if(remove.length) window.SVR_PHASE226_LEGACY_ROOTS_REMOVED = (window.SVR_PHASE226_LEGACY_ROOTS_REMOVED || 0) + remove.length;
}

function isExtraMoon(o){
  const n=String(o.name||"");
  if(n === MOON_NAME || n === HALO_NAME) return false;
  if(/moon/i.test(n)) return true;
  if(!o.isMesh || !o.geometry || !o.material) return false;
  o.geometry.computeBoundingSphere?.();
  const r=(o.geometry.boundingSphere?.radius||0)*Math.max(o.scale.x||1,o.scale.y||1,o.scale.z||1);
  const p=new THREE.Vector3(); o.getWorldPosition(p);
  return r>2.2 && r<22 && p.y<35;
}
function isExtraMars(o){
  const n=String(o.name||"");
  if(n === MARS_NAME) return false;
  return /mars/i.test(n);
}

async function tryRealMoonTexture(moon){
  if(!moon || moon.userData.phase226TextureAttempted) return;
  moon.userData.phase226TextureAttempted = true;
  const candidates = [
    "./assets/moon/Diffuse_2K.png",
    "./assets/moon/diffuse_2k.png",
    "./assets/moon/moon_diffuse_2k.png",
    "./assets/textures/moon/Diffuse_2K.png",
    "./assets/textures/moon_diffuse_2k.png",
    "./assets/moon.jpg",
    "./assets/moon.png",
    "./assets/textures/moon.jpg",
    "./assets/textures/moon.png"
  ];
  const loader = new THREE.TextureLoader();
  for(const rel of candidates){
    const url = new URL(rel, import.meta.url).toString();
    try{
      const tex = await new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      moon.material.map = tex;
      moon.material.needsUpdate = true;
      moon.userData.phase226RealTexture = rel;
      window.SVR_PHASE226_REAL_MOON_TEXTURE = { build:LABEL, loaded:rel, checkedAt:new Date().toISOString() };
      return;
    }catch{}
  }
  window.SVR_PHASE226_REAL_MOON_TEXTURE = { build:LABEL, loaded:null, note:"No repo moon texture path found; keeping current high-sky moon material.", checkedAt:new Date().toISOString() };
}

function normalizeSky(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return;
  const remove=[];
  scene.traverse(o=>{ if(isExtraMoon(o) || isExtraMars(o)) remove.push(o); });
  remove.forEach(o=>o.parent?.remove(o));
  const moon=scene.getObjectByName(MOON_NAME);
  const mars=scene.getObjectByName(MARS_NAME);
  const halo=scene.getObjectByName(HALO_NAME);
  if(moon){ moon.position.set(-16.5,27.5,-44); moon.visible=true; moon.scale.setScalar(1); tryRealMoonTexture(moon); }
  if(halo){ halo.position.set(-16.5,27.5,-44); halo.visible=true; }
  if(mars){ mars.position.set(-7.8,24.9,-49.4); mars.visible=true; mars.scale.setScalar(1); }
  window.SVR_PHASE226_SKY_NORMALIZED = { build:LABEL, oneMoon:!!moon, oneMars:!!mars, removed:remove.length, checkedAt:new Date().toISOString() };
}

function install(){
  stamp();
  installFloorAlias();
  purgeDom();
  purgeFaceSquares();
  removeLegacyRoots();
  normalizeSky();
  return !!window.__SVR_SCENE__;
}

stamp();
installFloorAlias();
purgeDom();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>180) clearInterval(timer); },200);
setInterval(()=>{ stamp(); purgeDom(); purgeFaceSquares(); },350);
[500,1200,2500,5000,9000,14000,22000].forEach(ms=>setTimeout(install,ms));
