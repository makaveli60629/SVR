import * as THREE from "three";

const LABEL = "PHASE-173-STABLE-HAND-PINCH-TELEPORT-LOCK";
const ROOT_NAME = "PHASE173_STABLE_HAND_PINCH_TELEPORT_ROOT";
const MIN_AIM_MS = 550;
const STABLE_TARGET_MS = 520;
const TARGET_DRIFT_LIMIT = 0.075;
const FACE_TOGGLE_COOLDOWN_MS = 950;
const SAFE_Y = 0;

let scene, camera, renderer, rig;
let root, rayLine, marker;
let enabled = false;
let aiming = false;
let moveArmed = false;
let aimStartedAt = 0;
let stableStartedAt = 0;
let target = null;
let stableTarget = null;
let preAimPose = null;
let lastAllowedMoveAt = 0;
let patched = false;
let wasAimHeld = false;
let wasFaceFistHeld = false;
let wasButtonToggleHeld = false;
let suppressUntilHandRelease = false;
let lastFaceToggleAt = 0;
let lastPanel = null;
let installStarted = false;

function t(){ return performance.now(); }
function isQuest(){ return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ""); }
function getRig(){ return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null; }
function camObj(){ return renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera; }
function playerPose(){
  const p = new THREE.Vector3();
  if(renderer?.xr?.isPresenting) renderer.xr.getCamera(camera).getWorldPosition(p);
  else if(camera) p.copy(camera.position);
  return { x:p.x, z:p.z };
}
function clampPoint(p){
  return new THREE.Vector3(THREE.MathUtils.clamp(p.x, -17.5, 17.5), SAFE_Y, THREE.MathUtils.clamp(p.z, -15.8, 15.8));
}
function setPose(x, y=0, z){
  lastAllowedMoveAt = t();
  if(rig?.setPlayerPose){ rig.setPlayerPose(x,y,z); return true; }
  if(camera){ camera.position.x = x; camera.position.z = z; return true; }
  return false;
}
function restoreIfMovedByOldPath(){
  if(!preAimPose) return;
  const p = playerPose();
  const d = Math.hypot(p.x - preAimPose.x, p.z - preAimPose.z);
  if(d > 0.32 && t() - lastAllowedMoveAt > 260){
    setPose(preAimPose.x, 0, preAimPose.z);
    window.SVR_PHASE173_LAST_DRIFT_BLOCK = { build:LABEL, restored:true, distance:+d.toFixed(3), checkedAt:new Date().toISOString() };
  }
}
function ensureRoot(){
  if(root?.parent) return root;
  if(!scene) return null;
  const old = scene.getObjectByName?.(ROOT_NAME);
  if(old) old.parent?.remove(old);
  root = new THREE.Group(); root.name = ROOT_NAME; scene.add(root);
  rayLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]),
    new THREE.LineBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.96 })
  );
  rayLine.name = "PHASE173_STABLE_HAND_AIM_RAY_NO_MOVE_UNTIL_RELEASE";
  root.add(rayLine);
  marker = new THREE.Mesh(
    new THREE.RingGeometry(.20,.34,56),
    new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.86, side:THREE.DoubleSide, depthWrite:false })
  );
  marker.name = "PHASE173_STABLE_TARGET_MARKER_RELEASE_ONLY";
  marker.rotation.x = -Math.PI/2;
  root.add(marker);
  root.visible = false;
  return root;
}
function input(){ return window.SVR_PHASE170_HAND_INPUT || {}; }
function handObj(){ return window.SVR_PHASE170_HAND_SOURCE || null; }
function handPoint(){
  const h = handObj();
  const tip = h?.joints?.["index-finger-tip"] || h?.joints?.["middle-finger-tip"];
  const wrist = h?.joints?.wrist;
  const out = new THREE.Vector3();
  if(tip){ tip.getWorldPosition(out); return out; }
  if(wrist){ wrist.getWorldPosition(out); return out; }
  return null;
}
function faceFistHeld(){
  const i = input();
  if(!i.held || !(i.leftFist || i.rightFist)) return false;
  const hp = handPoint();
  if(!hp || !camera) return false;
  const cp3 = new THREE.Vector3();
  const cam = camObj();
  cam.getWorldPosition(cp3);
  const fwd = new THREE.Vector3();
  cam.getWorldDirection(fwd).normalize();
  const v = hp.clone().sub(cp3);
  const dist = v.length();
  if(dist < 0.10 || dist > 0.70) return false;
  const dot = fwd.dot(v.clone().normalize());
  const vertical = hp.y - cp3.y;
  return dot > 0.28 && vertical > -0.38 && vertical < 0.24;
}
function handAimSource(){
  const h = handObj();
  const wrist = h?.joints?.wrist;
  const tip = h?.joints?.["index-finger-tip"] || h?.joints?.["middle-finger-tip"];
  if(!wrist || !tip) return null;
  const wp = new THREE.Vector3(), tp = new THREE.Vector3();
  wrist.getWorldPosition(wp); tip.getWorldPosition(tp);
  const dir = tp.clone().sub(wp);
  if(dir.lengthSq() < 0.000001) return null;
  dir.normalize();
  if(dir.y > -0.06) dir.y = -0.06;
  dir.normalize();
  return { pos:tp, dir };
}
function controllerHeld(){
  const session = renderer?.xr?.getSession?.();
  const sources = session ? Array.from(session.inputSources || []) : [];
  for(const s of sources){
    const gp = s.gamepad;
    if(gp?.buttons?.[0]?.pressed || gp?.buttons?.[1]?.pressed) return true;
  }
  return false;
}
function controllerTogglePressed(){
  const session = renderer?.xr?.getSession?.();
  const sources = session ? Array.from(session.inputSources || []) : [];
  for(const s of sources){
    const gp = s.gamepad;
    if(gp?.buttons?.[4]?.pressed || gp?.buttons?.[5]?.pressed || gp?.buttons?.[3]?.pressed) return true;
  }
  return false;
}
function held(){ return controllerHeld() || !!input().held; }
function resetStability(){ stableTarget = null; target = null; stableStartedAt = t(); }
function updateTarget(){
  const src = input().held ? handAimSource() : null;
  const fallback = { pos:new THREE.Vector3(), dir:new THREE.Vector3(0,0,-1) };
  let aim = src || fallback;
  if(!src){ const c = camObj(); c.updateMatrixWorld?.(true); c.getWorldPosition(aim.pos); c.getWorldDirection(aim.dir); }
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const hit = new THREE.Vector3();
  if(!new THREE.Ray(aim.pos, aim.dir).intersectPlane(plane, hit)) return null;
  const next = clampPoint(hit);
  if(!stableTarget || next.distanceTo(stableTarget) > TARGET_DRIFT_LIMIT){
    stableTarget = next.clone();
    stableStartedAt = t();
  }else{
    stableTarget.lerp(next, 0.28);
  }
  target = stableTarget.clone();
  const r = ensureRoot();
  if(r){
    r.visible = enabled && aiming;
    rayLine.geometry.setFromPoints([aim.pos, target.clone().setY(.04)]);
    marker.position.copy(target).setY(.035);
    const ready = t() - aimStartedAt >= MIN_AIM_MS && t() - stableStartedAt >= STABLE_TARGET_MS;
    marker.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
    rayLine.material.color.setHex(ready ? 0x8dffb4 : 0x7ffcff);
  }
  return target;
}
function toggleTeleport(force){
  enabled = typeof force === "boolean" ? force : !enabled;
  if(!enabled) cancelAim("toggle_off");
  window.SVR_PHASE170_TELEPORT_ENABLED = enabled;
  window.SVR_PHASE173_LAST_TOGGLE = { build:LABEL, enabled, checkedAt:new Date().toISOString() };
  return enabled;
}
function beginAim(){
  if(!enabled || aiming || suppressUntilHandRelease) return;
  aiming = true;
  moveArmed = true;
  aimStartedAt = t();
  preAimPose = playerPose();
  resetStability();
  updateTarget();
}
function cancelAim(reason="cancelled"){
  aiming = false;
  moveArmed = false;
  if(root) root.visible = false;
  window.SVR_PHASE173_LAST_CANCEL = { build:LABEL, reason, checkedAt:new Date().toISOString() };
}
function releaseAim(){
  if(!aiming || !moveArmed){ cancelAim("not_armed"); return false; }
  updateTarget();
  const heldMs = t() - aimStartedAt;
  const stableMs = t() - stableStartedAt;
  const ok = !!enabled && !!target && heldMs >= MIN_AIM_MS && stableMs >= STABLE_TARGET_MS;
  aiming = false;
  moveArmed = false;
  if(root) root.visible = false;
  if(!ok){
    if(preAimPose) setPose(preAimPose.x, 0, preAimPose.z);
    window.SVR_PHASE173_LAST_NO_MOVE_RELEASE = { build:LABEL, heldMs:Math.round(heldMs), stableMs:Math.round(stableMs), checkedAt:new Date().toISOString() };
    return false;
  }
  setPose(target.x, 0, target.z);
  window.SVR_PHASE173_LAST_RELEASE_MOVE = { build:LABEL, x:+target.x.toFixed(3), z:+target.z.toFixed(3), heldMs:Math.round(heldMs), stableMs:Math.round(stableMs), checkedAt:new Date().toISOString() };
  return true;
}
function patchRig(){
  rig = getRig();
  if(!rig || patched) return false;
  patched = true;
  rig.toggleMode = () => toggleTeleport();
  rig.isEnabled = () => enabled;
  window.SVR_SAFE_TELEPORT_TOGGLE = toggleTeleport;
  window.SVR_SAFE_TELEPORT_CANCEL = cancelAim;
  window.SVR_SAFE_TELEPORT_MOVE = releaseAim;
  window.SVR_PHASE170_HAND_TELEPORT_AUTHORITY = true;
  return true;
}
function installPanel(){
  if(isQuest() || lastPanel?.isConnected) return;
  const p = document.createElement("div");
  p.id = "svr-phase173-teleport-panel";
  p.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:2147483646;padding:9px 11px;border:1px solid rgba(141,255,180,.65);border-radius:12px;background:rgba(0,0,0,.72);color:#dff;font:12px ui-monospace,monospace;white-space:pre;pointer-events:none";
  document.body.appendChild(p); lastPanel = p;
}
function updatePanel(){
  if(!lastPanel) return;
  const stableMs = aiming ? Math.max(0, t() - stableStartedAt) : 0;
  lastPanel.textContent = [
    "SVR STABLE HAND TELEPORT",
    `enabled: ${enabled ? "ON" : "OFF"}`,
    `pinch/fist: ${input().held ? "HELD" : "--"}`,
    `aiming: ${aiming ? "YES" : "NO"}`,
    `stable: ${Math.round(stableMs)}ms / ${STABLE_TARGET_MS}ms`,
    `target: ${target ? `x:${target.x.toFixed(2)} z:${target.z.toFixed(2)}` : "--"}`,
    "OFF blocks pinch | hold steady | release moves once"
  ].join("\n");
}
function tick(){
  patchRig(); ensureRoot();
  const btnToggle = controllerTogglePressed();
  if(btnToggle && !wasButtonToggleHeld) toggleTeleport();
  wasButtonToggleHeld = btnToggle;

  const h = held();
  const faceToggle = faceFistHeld();
  if(faceToggle && !wasFaceFistHeld && t() - lastFaceToggleAt > FACE_TOGGLE_COOLDOWN_MS){
    lastFaceToggleAt = t();
    preAimPose = playerPose();
    suppressUntilHandRelease = true;
    cancelAim("face_fist_toggle");
    toggleTeleport();
  }
  wasFaceFistHeld = faceToggle;
  if(!h) suppressUntilHandRelease = false;

  if(!enabled && h){
    if(!preAimPose) preAimPose = playerPose();
    restoreIfMovedByOldPath();
    wasAimHeld = false;
    updatePanel();
  }else{
    const allowed = enabled && h && !faceToggle && !suppressUntilHandRelease;
    if(allowed && !wasAimHeld) beginAim();
    if(allowed && aiming){ updateTarget(); restoreIfMovedByOldPath(); }
    if(wasAimHeld && !allowed) releaseAim();
    if(!allowed && aiming) cancelAim("not_allowed");
    wasAimHeld = allowed;
    updatePanel();
  }

  window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK = {
    build:LABEL, active:true, enabled, aiming, pinchOnlyWhenTeleportOn:true, noMoveUntilRelease:true,
    stableHandTeleport:true, stableTargetMs:STABLE_TARGET_MS, targetDriftLimit:TARGET_DRIFT_LIMIT,
    baseHandAutoMoveSuppressed:true, rigFound:!!rig, handHeld:!!input().held, faceFistHeld:faceToggle,
    target:target ? {x:+target.x.toFixed(3), z:+target.z.toFixed(3)} : null,
    siteTouched:false, checkedAt:new Date().toISOString()
  };
}
function install(){
  scene = window.__SVR_SCENE__; camera = window.__SVR_CAMERA__; renderer = window.__SVR_RENDERER__;
  if(!scene || !camera || !renderer) return false;
  installPanel(); patchRig();
  window.addEventListener("keydown", e=>{ if(e.code === "KeyT"){ e.preventDefault(); toggleTeleport(); } if(e.code === "Escape") cancelAim("escape"); }, { capture:true });
  if(!installStarted){ installStarted = true; setInterval(tick, 50); }
  window.SVR_RUN_PHASE170_TELEPORT_AUDIT = () => window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK;
  window.SVR_RUN_PHASE173_HAND_TELEPORT_AUDIT = () => window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK;
  window.SVR_LOCKED_FINAL_BUILD = LABEL; window.SVR_LIVE_BUILD_POINTER = LABEL;
  return true;
}

[100,300,700,1300,2500,5000,9000].forEach(ms=>setTimeout(install,ms));
install();
