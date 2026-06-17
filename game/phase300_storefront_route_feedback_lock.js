import * as THREE from "three";

const LABEL = "PHASE-300-STOREFRONT-ROUTE-FEEDBACK-LOCK";
const TARGETS = {
  "meditation-room": { x:-12, y:1.75, z:-11.4, text:"Reiki / Meditation room selected" },
  "driving-range": { x:-6, y:1.75, z:-11.4, text:"PGA driving range selected" },
  "table-select": { x:0, y:1.75, z:3.9, text:"Poker table select selected" },
  "store-preview": { x:6, y:1.75, z:-11.4, text:"SVR Store selected" },
  "private-room": { x:12, y:1.75, z:-11.4, text:"Scorpion room selected" },
  "theater-lounge": { x:15.35, y:1.75, z:5.8, text:"Theater lounge selected" }
};
function status(text){
  const el = document.getElementById("status");
  if(el) el.textContent = text;
}
function movePreview(target){
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  if(!camera || renderer?.xr?.isPresenting) return false;
  camera.position.set(target.x, target.y, target.z);
  camera.lookAt(0, 1.55, -3.5);
  return true;
}
function handle(detail){
  const target = TARGETS[detail?.target];
  if(!target) return false;
  const movedPreview = movePreview(target);
  window.SVR_PHASE300_LAST_ROUTE_FEEDBACK = {
    build: LABEL,
    active: true,
    key: detail?.key || "unknown",
    target: detail?.target,
    label: detail?.label || "Storefront",
    movedPreview,
    xrNeedsSceneRouter: window.__SVR_RENDERER__?.xr?.isPresenting || false,
    siteTouched: false,
    publicRootTouched: false,
    checkedAt: new Date().toISOString()
  };
  status(`${target.text}${movedPreview ? " • preview moved" : " • route event armed"}`);
  return true;
}
function install(){
  if(window.__SVR_PHASE300_ROUTE_FEEDBACK__) return true;
  window.__SVR_PHASE300_ROUTE_FEEDBACK__ = true;
  window.addEventListener("svr-portal-selected", (event)=>handle(event.detail));
  window.SVR_PHASE300_STOREFRONT_ROUTE_FEEDBACK_LOCK = {
    build: LABEL,
    active: true,
    targetCount: Object.keys(TARGETS).length,
    siteTouched: false,
    publicRootTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
setInterval(install, 3000);
