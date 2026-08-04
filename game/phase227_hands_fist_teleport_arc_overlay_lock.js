import * as THREE from "three";

const LABEL = "UPDATE-3.1-G-HANDS-FIST-TELEPORT-ARC-REALIGN-LOCK";

function stamp(){
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE227 = {
    build: LABEL,
    active: true,
    phase: "3.1-G",
    siteTouched: false,
    handsOnly: true,
    controllerVisualRemoved: true,
    fistReleaseTeleport: true,
    roundParticleArc: true,
    faceOverlayCleanup: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-G",
    handsFistTeleport: true,
    roundParticleArc: true,
    noControllerVisualModel: true,
    faceSquaresCleaned: true,
    checkedAt: new Date().toISOString()
  });
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
  window.SVR_PHASE227_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE226_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE224_FLOOR_HEIGHT = floorY;
}

function cleanControllerVisuals(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return;
  const remove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(/PHASE226_.*CONTROLLER|PHASE226_RIGHT_QUEST_CONTROLLER_VISIBLE_MODEL|PHASE226_LEFT_QUEST_CONTROLLER_VISIBLE_MODEL|CONTROLLER_VISIBLE_MODEL/i.test(n)) remove.push(o);
  });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); });
  window.SVR_PHASE227_CONTROLLER_VISUAL_CLEANUP = { build:LABEL, removed:remove.length, checkedAt:new Date().toISOString() };
}

function cleanDom(){
  ["svrDiagPanel","svrUpdate31Badge","bootFallback","log","err","status","mode"].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(id === "svrDiagPanel" || id === "svrUpdate31Badge") el.remove();
    else { el.style.display="none"; el.style.visibility="hidden"; el.style.opacity="0"; el.style.pointerEvents="none"; }
  });
}

function nearHeadTransparentSquare(o, head){
  if(!o?.isMesh || !o.geometry || !o.material) return false;
  const n=String(o.name||"");
  if(/Watch|Wrist|Hand|Teleport|Target|Beam|Arc|Ring|Moon|Mars|Star/i.test(n)) return false;
  const type=String(o.geometry.type||"");
  const transparent=Array.isArray(o.material) ? o.material.some(m=>m?.transparent) : !!o.material.transparent;
  if(!transparent || !/Plane|Circle|Ring/.test(type)) return false;
  const p=new THREE.Vector3(); o.getWorldPosition(p);
  return p.distanceTo(head) < 1.35;
}

function cleanFaceSquares(){
  const scene=window.__SVR_SCENE__;
  const camera=window.__SVR_CAMERA__;
  const renderer=window.__SVR_RENDERER__;
  if(!scene || !camera) return;
  const roots=[camera];
  try{ const xr=renderer?.xr?.getCamera?.(camera); if(xr) roots.push(xr); }catch{}
  const badName=/FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|CAMERA_PANEL|SCREEN_OVERLAY|TRANSPARENT_SQUARE|DARK_SQUARE|RETICLE_PANEL|DIAG|DIAGNOSTIC|UPDATE31C_WORLD_DIAGNOSTIC|PHASE204_VISUAL|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE203_ACTION/i;
  let removed=0;
  roots.forEach(root=>{
    root.children?.slice?.().forEach(child=>{
      const n=String(child.name||"");
      const flat=child.isSprite || (child.isMesh && /Plane|Circle|Ring/.test(child.geometry?.type||"") && child.material?.transparent);
      if(flat || badName.test(n)){ child.visible=false; child.parent?.remove(child); removed++; }
    });
  });
  const head=new THREE.Vector3();
  try{ (renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera).getWorldPosition(head); }catch{ camera.getWorldPosition(head); }
  const remove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(badName.test(n) || nearHeadTransparentSquare(o, head)) remove.push(o);
  });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); removed++; });
  window.SVR_PHASE227_FACE_SQUARE_CLEANUP = { build:LABEL, removed, checkedAt:new Date().toISOString() };
}

function install(){
  stamp();
  installFloorAlias();
  cleanDom();
  cleanControllerVisuals();
  cleanFaceSquares();
  return !!window.__SVR_SCENE__;
}

stamp();
installFloorAlias();
cleanDom();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>180) clearInterval(timer); },200);
setInterval(()=>{ stamp(); cleanDom(); cleanControllerVisuals(); cleanFaceSquares(); },320);
[500,1200,2500,5000,9000,14000,22000].forEach(ms=>setTimeout(install,ms));
