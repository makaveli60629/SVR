import * as THREE from "three";

const LABEL = "PHASE-301-XR-STOREFRONT-ROUTE-EXECUTION-LOCK";
const TARGETS = {
  "meditation-room": { x:-12, y:0, z:-11.4, yaw:0, text:"Reiki route executed" },
  "driving-range": { x:-6, y:0, z:-11.4, yaw:0, text:"PGA route executed" },
  "table-select": { x:0, y:0, z:3.9, yaw:0, text:"Table route executed" },
  "store-preview": { x:6, y:0, z:-11.4, yaw:0, text:"Store route executed" },
  "private-room": { x:12, y:0, z:-11.4, yaw:0, text:"Scorpion route executed" },
  "theater-lounge": { x:15.35, y:0, z:5.8, yaw:-1.57, text:"Theater route executed" }
};
let baseRefSpace = null;
let pending = null;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function getApi(){ return window.SVR_TELEPORT_RIG_API || window.__SVR_TELEPORT_RIG__ || window.SVR_PHASE101J_TELEPORT_API || null; }
async function ensureBase(){
  const renderer = window.__SVR_RENDERER__;
  const session = renderer?.xr?.getSession?.();
  if(!renderer?.xr?.isPresenting || !session) return null;
  if(baseRefSpace) return baseRefSpace;
  try{ baseRefSpace = await session.requestReferenceSpace("local-floor"); }catch(e){ baseRefSpace = null; }
  return baseRefSpace;
}
function desktopMove(target){
  const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
  if(!camera || renderer?.xr?.isPresenting) return false;
  camera.position.set(target.x, 1.65, target.z);
  camera.lookAt(0,1.55,-3.5);
  return true;
}
async function xrReferenceFallback(target){
  const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
  const ref = await ensureBase();
  if(!renderer?.xr?.isPresenting || !ref || !camera || typeof XRRigidTransform === "undefined") return false;
  try{
    const xrCam = renderer.xr.getCamera(camera);
    const head = new THREE.Vector3();
    xrCam.getWorldPosition(head);
    const dx = head.x - target.x;
    const dz = head.z - target.z;
    const xf = new XRRigidTransform({ x: dx, y: 0, z: dz });
    renderer.xr.setReferenceSpace(ref.getOffsetReferenceSpace(xf));
    return true;
  }catch(e){
    window.SVR_PHASE301_XR_FALLBACK_ERROR = String(e?.message || e);
    return false;
  }
}
async function execute(detail){
  const target = TARGETS[detail?.target];
  if(!target) return false;
  const renderer = window.__SVR_RENDERER__;
  const xr = !!renderer?.xr?.isPresenting;
  const api = getApi();
  let used = "none";
  let moved = false;
  try{
    if(xr && api?.setPlayerPose){ moved = !!api.setPlayerPose(target.x, target.y, target.z); used = "teleport-api"; }
    else if(xr && api?.setPlayerXZ){ moved = !!api.setPlayerXZ(target.x, target.z); used = "teleport-xz-api"; }
    else if(xr){ moved = await xrReferenceFallback(target); used = "xr-reference-fallback"; }
    else { moved = desktopMove(target); used = "desktop-camera"; }
  }catch(e){
    window.SVR_PHASE301_EXECUTION_ERROR = String(e?.message || e);
  }
  pending = moved ? null : { detail, target, at:Date.now() };
  window.SVR_PHASE301_LAST_ROUTE_EXECUTION = {
    build: LABEL,
    active: true,
    key: detail?.key || "unknown",
    label: detail?.label || "Storefront",
    target: detail?.target,
    moved,
    used,
    xr,
    pending: !!pending,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  status(`${target.text}${moved ? "" : " pending"}`);
  return moved;
}
function retryPending(){ if(pending) execute(pending.detail); }
function install(){
  if(window.__SVR_PHASE301_XR_ROUTE_EXECUTION__) return true;
  window.__SVR_PHASE301_XR_ROUTE_EXECUTION__ = true;
  window.SVR_PHASE301_EXECUTE_ROUTE = execute;
  window.addEventListener("svr-portal-selected", e=>execute(e.detail));
  window.SVR_PHASE301_XR_STOREFRONT_ROUTE_EXECUTION_LOCK = {
    build: LABEL,
    active:true,
    targetCount:Object.keys(TARGETS).length,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
setInterval(()=>{ install(); retryPending(); }, 2500);
