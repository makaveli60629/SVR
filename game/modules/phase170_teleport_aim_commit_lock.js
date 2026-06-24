import * as THREE from "three";

const LABEL = "PHASE-171-HAND-TELEPORT-RELEASE-GATE-FACE-FIST-TOGGLE-LOCK";
const ROOT_NAME = "PHASE171_HAND_TELEPORT_RELEASE_GATE_ROOT";
const MIN_AIM_MS = 380;
const STABLE_TARGET_MS = 120;
const SAFE_Y = 0;
const FACE_TOGGLE_COOLDOWN_MS = 900;

let scene = null;
let camera = null;
let renderer = null;
let rig = null;
let root = null;
let rayLine = null;
let marker = null;
let enabled = false;
let aiming = false;
let aimStartedAt = 0;
let target = null;
let lastTargetAt = 0;
let preAimPose = null;
let lastAllowedMoveAt = 0;
let patched = false;
let wasAimHeld = false;
let wasToggleHeld = false;
let wasFaceFistHeld = false;
let suppressUntilHandRelease = false;
let lastFaceToggleAt = 0;
let lastPanel = null;
let installStarted = false;

function now(){ return performance.now(); }
function isQuest(){ return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ""); }
function getRig(){ return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null; }
function getXrCamPos(){
  const p = new THREE.Vector3();
  if(renderer?.xr?.isPresenting){ renderer.xr.getCamera(camera).getWorldPosition(p); return p; }
  return camera?.position?.clone?.() || p;
}
function roomClampPoint(p){
  const x = THREE.MathUtils.clamp(p.x, -17.5, 17.5);
  const z = THREE.MathUtils.clamp(p.z, -15.8, 15.8);
  return new THREE.Vector3(x, SAFE_Y, z);
}
function setPlayerPose(x, y=0, z){
  lastAllowedMoveAt = now();
  if(rig?.setPlayerPose){ rig.setPlayerPose(x,y,z); return true; }
  if(camera){ camera.position.x = x; camera.position.z = z; return true; }
  return false;
}
function currentPoseXZ(){ const p=getXrCamPos(); return { x:p.x, z:p.z }; }
function restorePoseIfOldSystemMoved(){
  if(!preAimPose) return;
  const p = currentPoseXZ();
  const d = Math.hypot(p.x-preAimPose.x, p.z-preAimPose.z);
  if(d > 0.45 && now() - lastAllowedMoveAt > 420){
    setPlayerPose(preAimPose.x, 0, preAimPose.z);
    window.SVR_PHASE171_LAST_OLD_HAND_MOVE_BLOCK = { build:LABEL, restored:true, distance:+d.toFixed(3), checkedAt:new Date().toISOString() };
  }
}
function ensureRoot(){
  if(root?.parent) return root;
  if(!scene) return null;
  const old = scene.getObjectByName?.(ROOT_NAME);
  if(old) old.parent?.remove(old);
  root = new THREE.Group(); root.name = ROOT_NAME; scene.add(root);
  const mat = new THREE.LineBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.96 });
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]);
  rayLine = new THREE.Line(geo, mat); rayLine.name = "PHASE171_HAND_TELEPORT_AIM_RAY_RELEASE_ONLY"; root.add(rayLine);
  const ringGeo = new THREE.RingGeometry(.20,.34,56);
  const ringMat = new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.84, side:THREE.DoubleSide, depthWrite:false });
  marker = new THREE.Mesh(ringGeo, ringMat); marker.name = "PHASE171_HAND_TELEPORT_TARGET_MARKER_RELEASE_ONLY"; marker.rotation.x = -Math.PI/2; root.add(marker);
  root.visible = false;
  return root;
}
function handPosition(){
  const hand = window.SVR_PHASE170_HAND_SOURCE;
  const wrist = hand?.joints?.wrist;
  const tip = hand?.joints?.["index-finger-tip"] || hand?.joints?.["middle-finger-tip"];
  const out = new THREE.Vector3();
  if(tip){ tip.getWorldPosition(out); return out; }
  if(wrist){ wrist.getWorldPosition(out); return out; }
  return null;
}
function faceFistHeld(){
  const input = window.SVR_PHASE170_HAND_INPUT;
  if(!input?.held || !(input.leftFist || input.rightFist)) return false;
  const hp = handPosition();
  if(!hp || !camera) return false;
  const cp = getXrCamPos();
  const fwd = new THREE.Vector3();
  const cam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  cam.getWorldDirection(fwd); fwd.normalize();
  const v = hp.clone().sub(cp);
  const dist = v.length();
  if(dist < 0.08 || dist > 0.72) return false;
  const dot = fwd.dot(v.clone().normalize());
  const vertical = hp.y - cp.y;
  return dot > 0.24 && vertical > -0.38 && vertical < 0.22;
}
function handAimSource(){
  const hand = window.SVR_PHASE170_HAND_SOURCE;
  const wrist = hand?.joints?.wrist;
  const tip = hand?.joints?.["index-finger-tip"] || hand?.joints?.["middle-finger-tip"];
  if(!wrist || !tip) return null;
  const wristPos = new THREE.Vector3();
  const tipPos = new THREE.Vector3();
  wrist.getWorldPosition(wristPos);
  tip.getWorldPosition(tipPos);
  const dir = tipPos.clone().sub(wristPos);
  if(dir.lengthSq() < 0.000001) return null;
  dir.normalize();
  if(dir.y > -0.045) dir.y = -0.045;
  dir.normalize();
  return { pos:tipPos, dir, hand:true };
}
function aimSource(){
  const handSrc = window.SVR_PHASE170_HAND_INPUT?.held ? handAimSource() : null;
  if(handSrc) return handSrc;
  const src = { pos:new THREE.Vector3(), dir:new THREE.Vector3(0,0,-1), hand:false };
  const controller = renderer?.xr?.getController?.(0);
  if(renderer?.xr?.isPresenting && controller){
    controller.updateMatrixWorld(true);
    src.pos.setFromMatrixPosition(controller.matrixWorld);
    src.dir.set(0,0,-1).applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion())).normalize();
    return src;
  }
  camera.updateMatrixWorld?.(true);
  camera.getWorldPosition(src.pos);
  camera.getWorldDirection(src.dir);
  return src;
}
function updateTarget(){
  const src = aimSource();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
  const hit = new THREE.Vector3();
  if(!new THREE.Ray(src.pos, src.dir).intersectPlane(plane, hit)) return null;
  const safe = roomClampPoint(hit);
  if(!target || safe.distanceTo(target) > 0.08){ lastTargetAt = now(); }
  target = safe;
  const r = ensureRoot();
  if(r){
    r.visible = enabled && aiming;
    rayLine.geometry.setFromPoints([src.pos, target.clone().setY(.04)]);
    marker.position.copy(target).setY(.035);
    const ready = now() - aimStartedAt >= MIN_AIM_MS && now() - lastTargetAt >= STABLE_TARGET_MS;
    marker.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
    rayLine.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
  }
  return target;
}
function controllerHeld(){
  const session = renderer?.xr?.getSession?.();
  const sources = session ? Array.from(session.inputSources || []) : [];
  for(const src of sources){
    const gp = src.gamepad; if(!gp?.buttons) continue;
    if(gp.buttons[0]?.pressed || gp.buttons[1]?.pressed) return true;
  }
  return false;
}
function handHeld(){ return !!window.SVR_PHASE170_HAND_INPUT?.held; }
function aimHeld(){ return controllerHeld() || handHeld(); }
function isTogglePressed(){
  const session = renderer?.xr?.getSession?.();
  const sources = session ? Array.from(session.inputSources || []) : [];
  for(const src of sources){
    const gp = src.gamepad; if(!gp?.buttons) continue;
    if(gp.buttons[4]?.pressed || gp.buttons[5]?.pressed || gp.buttons[3]?.pressed) return true;
  }
  return false;
}
function toggleTeleport(force){
  enabled = typeof force === "boolean" ? force : !enabled;
  if(!enabled) endAim(false);
  window.SVR_PHASE170_TELEPORT_ENABLED = enabled;
  window.SVR_PHASE171_LAST_TOGGLE = { build:LABEL, enabled, checkedAt:new Date().toISOString() };
  return enabled;
}
function beginAim(){
  if(!enabled || aiming || suppressUntilHandRelease) return;
  aiming = true;
  aimStartedAt = now();
  lastTargetAt = aimStartedAt;
  preAimPose = currentPoseXZ();
  updateTarget();
}
function endAim(move){
  if(!aiming) return false;
  updateTarget();
  const held = now() - aimStartedAt;
  const stable = now() - lastTargetAt;
  const ok = !!move && !!target && held >= MIN_AIM_MS && stable >= STABLE_TARGET_MS;
  aiming = false;
  if(root) root.visible = false;
  if(ok){
    setPlayerPose(target.x, 0, target.z);
    window.SVR_PHASE171_LAST_RELEASE_MOVE = { build:LABEL, x:+target.x.toFixed(3), z:+target.z.toFixed(3), heldMs:Math.round(held), stableMs:Math.round(stable), checkedAt:new Date().toISOString() };
    return true;
  }
  if(preAimPose && move){ setPlayerPose(preAimPose.x, 0, preAimPose.z); }
  window.SVR_PHASE171_LAST_CANCEL = { build:LABEL, reason: move ? "aim_not_ready" : "cancelled", heldMs:Math.round(held), stableMs:Math.round(stable), checkedAt:new Date().toISOString() };
  return false;
}
function patchRig(){
  rig = getRig();
  if(!rig || patched) return false;
  patched = true;
  const originalToggle = typeof rig.toggleMode === "function" ? rig.toggleMode.bind(rig) : null;
  rig.toggleMode = () => toggleTeleport();
  rig.isEnabled = () => enabled;
  rig.phase171OriginalToggleMode = originalToggle;
  window.SVR_SAFE_TELEPORT_TOGGLE = toggleTeleport;
  window.SVR_SAFE_TELEPORT_CANCEL = () => endAim(false);
  window.SVR_SAFE_TELEPORT_MOVE = () => endAim(true);
  window.SVR_PHASE170_HAND_TELEPORT_AUTHORITY = true;
  return true;
}
function installPanel(){
  if(isQuest()) return;
  if(lastPanel?.isConnected) return;
  const p = document.createElement("div");
  p.id = "svr-phase171-teleport-panel";
  p.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:2147483646;padding:9px 11px;border:1px solid rgba(141,255,180,.65);border-radius:12px;background:rgba(0,0,0,.72);color:#dff;font:12px ui-monospace,monospace;white-space:pre;pointer-events:none";
  document.body.appendChild(p); lastPanel = p;
}
function updatePanel(){
  if(!lastPanel) return;
  const input = window.SVR_PHASE170_HAND_INPUT;
  lastPanel.textContent = [
    "SVR HAND TELEPORT RELEASE-GATE",
    `enabled: ${enabled ? "ON" : "OFF"}`,
    `aiming: ${aiming ? "YES" : "NO"}`,
    `face fist toggle: ${faceFistHeld() ? "HELD" : "--"}`,
    `hand: ${input?.held ? input.source || "held" : "--"}`,
    `target: ${target ? `x:${target.x.toFixed(2)} z:${target.z.toFixed(2)}` : "--"}`,
    "Fist near face toggles ON/OFF | hold away to aim | release moves"
  ].join("\n");
}
function tick(){
  patchRig();
  ensureRoot();
  const togglePressed = isTogglePressed();
  if(togglePressed && !wasToggleHeld) toggleTeleport();
  wasToggleHeld = togglePressed;

  const held = aimHeld();
  const faceToggle = faceFistHeld();
  if(faceToggle && !wasFaceFistHeld && now() - lastFaceToggleAt > FACE_TOGGLE_COOLDOWN_MS){
    lastFaceToggleAt = now();
    suppressUntilHandRelease = true;
    endAim(false);
    preAimPose = currentPoseXZ();
    toggleTeleport();
  }
  wasFaceFistHeld = faceToggle;
  if(!held) suppressUntilHandRelease = false;

  const aimAllowedHeld = held && !faceToggle && !suppressUntilHandRelease;
  if(enabled && aimAllowedHeld && !wasAimHeld) beginAim();
  if(enabled && aimAllowedHeld && aiming){ updateTarget(); restorePoseIfOldSystemMoved(); }
  if(wasAimHeld && !aimAllowedHeld) endAim(true);
  if((aiming || suppressUntilHandRelease || (held && !enabled)) && preAimPose) restorePoseIfOldSystemMoved();
  wasAimHeld = aimAllowedHeld;

  updatePanel();
  const input = window.SVR_PHASE170_HAND_INPUT || null;
  window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK = {
    build:LABEL, active:true, enabled, aiming, noMoveUntilRelease:true, faceFistToggle:true,
    handTeleportFixed:true, handAimBeforeMove:true, releaseToMove:true, baseHandAutoMoveSuppressed:true,
    togglePatched:patched, rigFound:!!rig, handHeld:!!input?.held, faceFistHeld:faceToggle, suppressUntilHandRelease,
    handSource:input?.source || null, target:target ? {x:+target.x.toFixed(3), z:+target.z.toFixed(3)} : null,
    siteTouched:false, checkedAt:new Date().toISOString()
  };
}
function install(){
  scene = window.__SVR_SCENE__; camera = window.__SVR_CAMERA__; renderer = window.__SVR_RENDERER__;
  if(!scene || !camera || !renderer) return false;
  installPanel();
  patchRig();
  window.addEventListener("keydown", e=>{
    if(e.code === "KeyT"){ e.preventDefault(); toggleTeleport(); }
    if(e.code === "Escape") endAim(false);
  }, { capture:true });
  if(!installStarted){ installStarted = true; setInterval(tick, 50); }
  window.SVR_RUN_PHASE170_TELEPORT_AUDIT = () => window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK;
  window.SVR_RUN_PHASE171_HAND_TELEPORT_AUDIT = () => window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK;
  window.SVR_LOCKED_FINAL_BUILD = LABEL; window.SVR_LIVE_BUILD_POINTER = LABEL;
  return true;
}

[100,300,700,1300,2500,5000,9000].forEach(ms=>setTimeout(install,ms));
install();
