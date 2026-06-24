import * as THREE from "three";

const LABEL = "PHASE-170-TELEPORT-AIM-COMMIT-LOCK";
const ROOT_NAME = "PHASE170_TELEPORT_AIM_COMMIT_LOCK_ROOT";
const MIN_AIM_MS = 420;
const STABLE_TARGET_MS = 180;
const SAFE_Y = 0;

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
let lastAllowedCommitAt = 0;
let patched = false;
let wasTriggerHeld = false;
let wasToggleHeld = false;
let lastPanel = null;
let installStarted = false;

function now(){ return performance.now(); }
function isQuest(){ return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ""); }
function getRig(){ return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || window.__SVR_TELEPORT_RIG__ || null; }
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
  lastAllowedCommitAt = now();
  if(rig?.setPlayerPose){ rig.setPlayerPose(x,y,z); return true; }
  if(camera){ camera.position.x = x; camera.position.z = z; return true; }
  return false;
}
function currentPoseXZ(){ const p=getXrCamPos(); return { x:p.x, z:p.z }; }
function restorePreAimIfAutoJumped(){
  if(!aiming || !preAimPose) return;
  const p = currentPoseXZ();
  const d = Math.hypot(p.x-preAimPose.x, p.z-preAimPose.z);
  if(d > 0.55 && now() - lastAllowedCommitAt > 750){
    setPlayerPose(preAimPose.x, 0, preAimPose.z);
    window.SVR_PHASE170_LAST_AUTO_JUMP_BLOCK = { build:LABEL, restored:true, distance:+d.toFixed(3), checkedAt:new Date().toISOString() };
  }
}
function ensureRoot(){
  if(root?.parent) return root;
  if(!scene) return null;
  const old = scene.getObjectByName?.(ROOT_NAME);
  if(old) old.parent?.remove(old);
  root = new THREE.Group(); root.name = ROOT_NAME; scene.add(root);
  const mat = new THREE.LineBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.92 });
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]);
  rayLine = new THREE.Line(geo, mat); rayLine.name = "PHASE170_TELEPORT_AIM_RAY_HOLD_ONLY"; root.add(rayLine);
  const ringGeo = new THREE.RingGeometry(.20,.32,48);
  const ringMat = new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.78, side:THREE.DoubleSide, depthWrite:false });
  marker = new THREE.Mesh(ringGeo, ringMat); marker.name = "PHASE170_TELEPORT_TARGET_MARKER_RELEASE_TO_COMMIT"; marker.rotation.x = -Math.PI/2; root.add(marker);
  root.visible = false;
  return root;
}
function aimSource(){
  const src = { pos:new THREE.Vector3(), dir:new THREE.Vector3(0,0,-1) };
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
    const pts = [src.pos, target.clone().setY(.04)];
    rayLine.geometry.setFromPoints(pts);
    marker.position.copy(target).setY(.035);
    const ready = now() - aimStartedAt >= MIN_AIM_MS && now() - lastTargetAt >= STABLE_TARGET_MS;
    marker.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
    rayLine.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
  }
  return target;
}
function isTriggerHeld(){
  const session = renderer?.xr?.getSession?.();
  const sources = session ? Array.from(session.inputSources || []) : [];
  for(const src of sources){
    const gp = src.gamepad; if(!gp?.buttons) continue;
    const trigger = gp.buttons[0]?.pressed || false;
    const grip = gp.buttons[1]?.pressed || false;
    const a = gp.buttons[4]?.pressed || gp.buttons[5]?.pressed || false;
    if(trigger || grip) return true;
    if(a) window.SVR_PHASE170_LAST_A_BUTTON_SEEN = true;
  }
  return false;
}
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
  return enabled;
}
function beginAim(){
  if(!enabled || aiming) return;
  aiming = true;
  aimStartedAt = now();
  lastTargetAt = aimStartedAt;
  preAimPose = currentPoseXZ();
  updateTarget();
}
function endAim(commit){
  if(!aiming) return false;
  updateTarget();
  const held = now() - aimStartedAt;
  const stable = now() - lastTargetAt;
  const ok = !!commit && !!target && held >= MIN_AIM_MS && stable >= STABLE_TARGET_MS;
  aiming = false;
  if(root) root.visible = false;
  if(ok){
    setPlayerPose(target.x, 0, target.z);
    window.SVR_PHASE170_LAST_COMMIT = { build:LABEL, x:+target.x.toFixed(3), z:+target.z.toFixed(3), heldMs:Math.round(held), stableMs:Math.round(stable), checkedAt:new Date().toISOString() };
    return true;
  }
  if(preAimPose && commit){ setPlayerPose(preAimPose.x, 0, preAimPose.z); }
  window.SVR_PHASE170_LAST_CANCEL = { build:LABEL, reason: commit ? "aim_not_ready" : "cancelled", heldMs:Math.round(held), stableMs:Math.round(stable), checkedAt:new Date().toISOString() };
  return false;
}
function patchRig(){
  rig = getRig();
  if(!rig || patched) return false;
  patched = true;
  const originalToggle = typeof rig.toggleMode === "function" ? rig.toggleMode.bind(rig) : null;
  rig.toggleMode = () => toggleTeleport();
  rig.isEnabled = () => enabled;
  rig.phase170OriginalToggleMode = originalToggle;
  window.SVR_SAFE_TELEPORT_TOGGLE = toggleTeleport;
  window.SVR_SAFE_TELEPORT_CANCEL = () => endAim(false);
  window.SVR_SAFE_TELEPORT_COMMIT = () => endAim(true);
  return true;
}
function installPanel(){
  if(isQuest()) return;
  if(lastPanel?.isConnected) return;
  const p = document.createElement("div");
  p.id = "svr-phase170-teleport-panel";
  p.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:2147483646;padding:9px 11px;border:1px solid rgba(141,255,180,.65);border-radius:12px;background:rgba(0,0,0,.72);color:#dff;font:12px ui-monospace,monospace;white-space:pre;pointer-events:none";
  document.body.appendChild(p); lastPanel = p;
}
function updatePanel(){
  if(!lastPanel) return;
  lastPanel.textContent = [
    "SVR TELEPORT AIM-COMMIT",
    `enabled: ${enabled ? "ON" : "OFF"}`,
    `aiming: ${aiming ? "YES" : "NO"}`,
    `target: ${target ? `x:${target.x.toFixed(2)} z:${target.z.toFixed(2)}` : "--"}`,
    "T/A toggles | hold trigger/grip aim | release commit"
  ].join("\n");
}
function tick(){
  patchRig();
  ensureRoot();
  const togglePressed = isTogglePressed();
  if(togglePressed && !wasToggleHeld) toggleTeleport();
  wasToggleHeld = togglePressed;
  const held = isTriggerHeld();
  if(enabled && held && !wasTriggerHeld) beginAim();
  if(enabled && held && aiming){ updateTarget(); restorePreAimIfAutoJumped(); }
  if(wasTriggerHeld && !held) endAim(true);
  wasTriggerHeld = held;
  updatePanel();
  window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK = {
    build:LABEL, active:true, enabled, aiming, aimBeforeCommit:true, releaseToTeleport:true,
    autoPointJumpBlocked:true, togglePatched:patched, rigFound:!!rig, target:target ? {x:+target.x.toFixed(3), z:+target.z.toFixed(3)} : null,
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
  window.SVR_LOCKED_FINAL_BUILD = LABEL; window.SVR_LIVE_BUILD_POINTER = LABEL;
  return true;
}

[100,300,700,1300,2500,5000,9000].forEach(ms=>setTimeout(install,ms));
install();
