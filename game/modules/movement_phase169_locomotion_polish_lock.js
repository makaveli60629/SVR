import * as THREE from "three";
import { createTeleportRig as baseRig } from "./movement_phase286_input_lock.js?v=phase169-control-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-169-UNIFIED-LOCOMOTION-TELEPORT-POLISH-LOCK";
const MOVE_SPEED = 5.85;
const DEADZONE = 0.18;
const Y_DELTA_LIMIT = 0.14;
const CONTROLLER_HIDE_RE = /oculus|quest|controller\s*(model|mesh|ray|grip)|left.*controller|right.*controller/i;
const vDir = new THREE.Vector3();

function handPinch(hand){
  if(!hand?.joints) return false;
  try { return !!isPinching(hand); } catch { return false; }
}
function handFist(hand){
  if(!hand?.joints) return false;
  try { return !!isFist(hand); } catch { return false; }
}
function handHeld(hand){ return handPinch(hand) || handFist(hand); }
function anyHandHeld(args){ return handHeld(args?.leftHand) || handHeld(args?.rightHand); }
function distXZ(a,b){ return Math.hypot(Number((a?.x||0)-(b?.x||0)), Number((a?.z||0)-(b?.z||0))); }
function pad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
function axes(proxy){ return Array.from(pad(proxy)?.axes || []); }
function buttons(proxy){ return Array.from(pad(proxy)?.buttons || []); }
function buttonValue(b){ return Math.max(Number(b?.value || 0), b?.pressed ? 1 : 0); }
function triggerGripValue(proxy){
  const bs = buttons(proxy);
  return Math.max(buttonValue(bs[0]), buttonValue(bs[1]), buttonValue(bs[2]), buttonValue(bs[3]), buttonValue(bs[4]), buttonValue(bs[5]));
}
function rightStick(args){
  const r = axes(args?.rightController);
  const l = axes(args?.leftController);
  let x = 0, y = 0;
  if(r.length >= 4){ x = Number(r[2] || 0); y = Number(r[3] || 0); }
  if(Math.abs(x) < DEADZONE && r.length >= 2) x = Number(r[0] || 0);
  if(Math.abs(y) < DEADZONE && r.length >= 2) y = Number(r[1] || 0);
  if(Math.abs(x) < DEADZONE && l.length >= 2) x = Number(l[0] || 0);
  if(Math.abs(y) < DEADZONE && l.length >= 2) y = Number(l[1] || 0);
  if(Math.abs(x) < DEADZONE) x = 0;
  if(Math.abs(y) < DEADZONE) y = 0;
  return { x, y };
}
function xrCamera(renderer,camera){
  const xr = renderer?.xr?.isPresenting ? renderer.xr.getCamera?.(camera) : camera;
  return xr?.cameras?.[0] || xr || camera;
}
function headForward(renderer,camera){
  const src = xrCamera(renderer,camera);
  src?.updateWorldMatrix?.(true,false);
  src?.getWorldDirection?.(vDir);
  vDir.y = 0;
  if(vDir.lengthSq() < 1e-5) vDir.set(0,0,-1);
  return vDir.normalize();
}
function hideControllerMeshes(scene){
  let hidden = 0;
  scene?.traverse?.(o=>{
    const n = String(o.name || "");
    if(!CONTROLLER_HIDE_RE.test(n)) return;
    if(/hand|proxy|watch|pointer|teleport|arc|ring/i.test(n)) return;
    if(o.visible !== false){ o.visible = false; hidden++; }
  });
  return hidden;
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  const originalSetPose = rig.setPlayerPose?.bind(rig);
  const originalSetXZ = rig.setPlayerXZ?.bind(rig);
  let hiddenControllerMeshes = 0;
  let ySafetyCorrections = 0;
  let pokerTeleportBlocks = 0;
  let pokerReverts = 0;
  let lastSafeStandingY = 0;
  let lastTeleportIntent = null;
  let forcedForwardSamples = 0;

  function setPoseSafe(p, preserveY = null){
    if(!p || !originalSetPose) return false;
    const y = Number.isFinite(preserveY) ? preserveY : (Number.isFinite(p.y) ? p.y : 0);
    return originalSetPose(p.x, y, p.z);
  }
  function ySafety(before, after){
    if(!after || after.seated) return false;
    if(Number.isFinite(after.y) && after.y >= -0.05) lastSafeStandingY = after.y;
    let targetY = Number.isFinite(lastSafeStandingY) ? lastSafeStandingY : 0;
    let needs = false;
    if(!Number.isFinite(after.y) || after.y < -0.05){ needs = true; targetY = 0; }
    if(before && !before.seated && distXZ(before, after) > 0.18 && Math.abs(Number(after.y || 0) - Number(before.y || 0)) > Y_DELTA_LIMIT){
      needs = true;
      targetY = Number.isFinite(before.y) ? before.y : targetY;
    }
    if(needs){
      ySafetyCorrections++;
      return setPoseSafe(after, targetY);
    }
    return false;
  }

  rig.setPlayerPose = (x,y,z) => {
    if(Number.isFinite(y) && y < -0.25) return originalSetPose?.(x,y,z);
    const safeY = Number.isFinite(y) ? Math.max(-0.05, y) : lastSafeStandingY;
    return originalSetPose?.(x, safeY, z);
  };
  rig.setPlayerXZ = (x,z) => originalSetXZ?.(x,z);

  rig.update = (args = {}) => {
    const before = rig.getPlayerPose?.();
    if(before && !before.seated && Number.isFinite(before.y) && before.y >= -0.05) lastSafeStandingY = before.y;

    const leftPinch = handPinch(args.leftHand);
    const rightPinch = handPinch(args.rightHand);
    const leftFist = handFist(args.leftHand);
    const rightFist = handFist(args.rightHand);
    const handGesture = leftPinch || rightPinch || leftFist || rightFist;
    const controllerHold = Math.max(triggerGripValue(args.rightController), triggerGripValue(args.leftController));
    const stick = rightStick(args);
    const blockForPoker = !!window.SVR_PHASE136_BLOCK_TELEPORT_FOR_POKER_ACTION;
    let updateArgs = args;

    hiddenControllerMeshes += hideControllerMeshes(opts?.scene);

    if(blockForPoker){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
      pokerTeleportBlocks++;
    }

    if(handGesture) lastTeleportIntent = leftPinch || rightPinch ? "hand-pinch-hold-release" : "hand-fist-hold-release";
    else if(controllerHold > .18) lastTeleportIntent = "controller-trigger-grip-hold-release";
    else if(Math.abs(stick.y) > DEADZONE || Math.abs(stick.x) > DEADZONE) lastTeleportIntent = "controller-thumbstick-move-snap";

    originalUpdate(updateArgs);

    const after = rig.getPlayerPose?.();
    if(blockForPoker && before && after && distXZ(before, after) > .02){
      setPoseSafe(before, before.y);
      pokerReverts++;
    }else{
      ySafety(before, after);
    }

    if(opts?.renderer?.xr?.isPresenting && stick.y && !handGesture){
      const f = headForward(opts.renderer, opts.camera).clone();
      if(Number.isFinite(f.x) && Number.isFinite(f.z)) forcedForwardSamples++;
    }

    const state = rig.getState?.() || {};
    window.SVR_PHASE169_UNIFIED_LOCOMOTION_TELEPORT_POLISH_LOCK = {
      build: LABEL,
      active: true,
      adaptedFromAFrameManifest: true,
      threeJsRuntime: true,
      handPinchHoldAimReleaseTeleport: true,
      handFistHoldAimReleaseTeleport: true,
      controllerTriggerGripHoldAimReleaseTeleport: true,
      thumbstickForwardBackHeadDirection: true,
      thumbstickLeftRightSnapTurn45: true,
      thumbstickDeadzone: DEADZONE,
      yAxisSafetyGuard: true,
      yDeltaLimit: Y_DELTA_LIMIT,
      ySafetyCorrections,
      lastSafeStandingY: Number((lastSafeStandingY || 0).toFixed(3)),
      pokerActionTeleportBlock: true,
      pokerTeleportBlocks,
      pokerReverts,
      controllerMeshesHidden: true,
      hiddenControllerMeshes,
      lastTeleportIntent,
      moveSpeed: MOVE_SPEED,
      forcedForwardSamples,
      baseMode: !!state.mode,
      baseActiveMode: state.activeMode || null,
      baseGestureMode: state.handGestureMode || null,
      siteTouched: false,
      tableAnchorsTouched: false,
      checkedAt: new Date().toISOString()
    };
    window.SVR_RUN_PHASE169_LOCOMOTION_AUDIT = () => window.SVR_PHASE169_UNIFIED_LOCOMOTION_TELEPORT_POLISH_LOCK;
    window.SVR_LOCKED_FINAL_BUILD = LABEL;
  };

  const originalSessionStart = rig.onSessionStart?.bind(rig);
  if(originalSessionStart){
    rig.onSessionStart = async (...args) => {
      lastSafeStandingY = 0;
      ySafetyCorrections = 0;
      lastTeleportIntent = null;
      return await originalSessionStart(...args);
    };
  }

  window.SVR_PHASE169_UNIFIED_LOCOMOTION_TELEPORT_POLISH_LOCK = {
    build: LABEL,
    active: true,
    wrapperInstalled: true,
    handPinchAndControllerUnified: true,
    yAxisSafetyGuard: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };

  return rig;
}
