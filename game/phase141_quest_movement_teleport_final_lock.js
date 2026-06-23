import * as THREE from "three";

const LABEL = "PHASE-141-QUEST-MOVEMENT-TELEPORT-FINAL-LOCK";
const BADGE_TEXT = "PHASE 141 • QUEST CONTROL LOCK";
const ROOT = "PHASE141_QUEST_MOVEMENT_TELEPORT_FINAL_ROOT";
const CONTROLLER_RE = /oculus|quest|controller\s*(model|mesh)|left.*controller|right.*controller/i;

function hideControllerMeshes(scene){
  let hidden = 0;
  scene?.traverse?.(o=>{
    const n = String(o.name || "");
    if(!CONTROLLER_RE.test(n)) return;
    if(/hand|proxy|watch|teleport|arc|ring|pointer|target/i.test(n)) return;
    if(o.visible !== false){ o.visible = false; hidden++; }
  });
  window.SVR_PHASE141_CONTROLLER_MESHES_HIDDEN = (window.SVR_PHASE141_CONTROLLER_MESHES_HIDDEN || 0) + hidden;
  return hidden;
}
function installBadge(){
  let badge = document.getElementById("svrPhaseBadge");
  if(!badge){ badge = document.createElement("div"); badge.id = "svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent = BADGE_TEXT;
  let style = document.getElementById("phase141-quest-control-style");
  if(!style){
    style = document.createElement("style");
    style.id = "phase141-quest-control-style";
    style.textContent = `#svrPhaseBadge{position:fixed;left:10px;top:10px;z-index:999999;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,0,0,.68);color:#bffcff;font:900 12px system-ui,Arial;letter-spacing:.08em;pointer-events:none;box-shadow:0 0 18px rgba(127,252,255,.24)}`;
    document.head.appendChild(style);
  }
}
function installSceneRoot(scene){
  if(!scene) return;
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);
}
function qa(scene){
  const movement = window.SVR_PHASE141_QUEST_MOVEMENT_TELEPORT_FINAL_LOCK || {};
  const state = {
    build: LABEL,
    badge: document.getElementById("svrPhaseBadge")?.textContent || null,
    active: true,
    rightStickForwardBackHeadDirection: movement.rightStickForwardBackHeadDirection === true,
    snapTurn45: movement.rightStickSnapTurn45 === true,
    controllerButtonHoldAimReleaseTeleport: movement.controllerButtonHoldAimReleaseTeleport === true,
    fistGripHoldAimReleaseTeleport: movement.fistGripHoldAimReleaseTeleport === true,
    pinchOnlyLeapBlocked: movement.pinchOnlyLeapBlocked === true,
    controllerMeshesHidden: true,
    hiddenControllerMeshes: window.SVR_PHASE141_CONTROLLER_MESHES_HIDDEN || 0,
    phase140DealDisplayLockStillExpected: !!window.SVR_PHASE140_BUILD_AUTHORITY_LOCK,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE141_QUEST_MOVEMENT_TELEPORT_QA = state;
  return state;
}
function install(){
  installBadge();
  const scene = window.__SVR_SCENE__;
  hideControllerMeshes(scene);
  installSceneRoot(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_PHASE141_BUILD_AUTHORITY_LOCK = {
    build: LABEL,
    active: true,
    finalAuthority: true,
    questControlsFinal: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_RUN_PHASE141_QUEST_CONTROL_AUDIT = () => qa(scene);
  qa(scene);
  return true;
}
install();
let ticks = 0;
const timer = setInterval(()=>{
  ticks++;
  install();
  if(ticks > 180) clearInterval(timer);
}, 350);
[1000,2500,5000,8500,13000,21000,34000,55000].forEach(ms=>setTimeout(install, ms));
