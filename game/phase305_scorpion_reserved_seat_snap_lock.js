import * as THREE from "three";

const LABEL = "PHASE-305-SCORPION-RESERVED-SEAT-SNAP-LOCK";
const SEAT_TARGET = { x:12, y:0, z:-9.95, lookX:0, lookY:1.5, lookZ:-3.5 };
let installed = false;
let pending = null;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function getApi(){ return window.SVR_TELEPORT_RIG_API || window.__SVR_TELEPORT_RIG__ || window.SVR_PHASE101J_TELEPORT_API || null; }
function desktopSnap(target){
  const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
  if(!camera || renderer?.xr?.isPresenting) return false;
  camera.position.set(target.x, 1.62, target.z);
  camera.lookAt(target.lookX, target.lookY, target.lookZ);
  return true;
}
async function xrSnapFallback(target){
  const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
  const session=renderer?.xr?.getSession?.();
  if(!renderer?.xr?.isPresenting || !session || !camera || typeof XRRigidTransform==="undefined") return false;
  try{
    const ref=await session.requestReferenceSpace("local-floor");
    const xrCam=renderer.xr.getCamera(camera);
    const head=new THREE.Vector3(); xrCam.getWorldPosition(head);
    const xf=new XRRigidTransform({x:head.x-target.x,y:0,z:head.z-target.z});
    renderer.xr.setReferenceSpace(ref.getOffsetReferenceSpace(xf));
    return true;
  }catch(e){ window.SVR_PHASE305_XR_SNAP_ERROR=String(e?.message||e); return false; }
}
async function snapToSeat(detail){
  if(!detail || detail.action!=="join") return false;
  const target = detail.routeTarget || SEAT_TARGET;
  const renderer=window.__SVR_RENDERER__;
  const xr=!!renderer?.xr?.isPresenting;
  const api=getApi();
  let moved=false, used="none";
  try{
    if(xr && api?.setPlayerPose){ moved=!!api.setPlayerPose(target.x,target.y||0,target.z); used="teleport-api"; }
    else if(xr && api?.setPlayerXZ){ moved=!!api.setPlayerXZ(target.x,target.z); used="teleport-xz-api"; }
    else if(xr){ moved=await xrSnapFallback({...SEAT_TARGET,...target}); used="xr-reference-fallback"; }
    else { moved=desktopSnap({...SEAT_TARGET,...target}); used="desktop-camera"; }
  }catch(e){ window.SVR_PHASE305_SNAP_ERROR=String(e?.message||e); }
  pending = moved ? null : { detail, at:Date.now() };
  const state={
    build:LABEL,
    active:true,
    tableKey:detail.tableKey,
    title:detail.title,
    seatId:detail.seatId,
    seatIndex:detail.seatIndex,
    moved,
    used,
    xr,
    pending:!!pending,
    target:{...SEAT_TARGET,...target},
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_PHASE305_LAST_RESERVED_SEAT_SNAP=state;
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-seat-snap-complete",{detail:state})); }catch{}
  status(`${detail.title || "Scorpion"} reserved seat ${moved ? "snap complete" : "snap pending"}`);
  return moved;
}
function retry(){ if(pending) snapToSeat(pending.detail); }
function install(){
  if(installed) return true;
  installed=true;
  window.addEventListener("svr-scorpion-seat-reserved", e=>snapToSeat(e.detail));
  window.SVR_PHASE305_SCORPION_RESERVED_SEAT_SNAP_LOCK={
    build:LABEL,
    active:true,
    listensFor:"svr-scorpion-seat-reserved",
    emits:"svr-scorpion-seat-snap-complete",
    target:SEAT_TARGET,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
setInterval(()=>{install(); retry();},2500);
