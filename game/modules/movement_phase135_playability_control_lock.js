import * as THREE from "three";
import { createTeleportRig as baseRig } from "./movement_phase286_input_lock.js?v=phase141-control-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-141-QUEST-MOVEMENT-TELEPORT-FINAL-LOCK";
const MOVE_SPEED = 5.85;
const CONTROLLER_HIDE_RE = /oculus|quest|controller\s*(model|mesh|ray|grip)|left.*controller|right.*controller/i;

const vDir = new THREE.Vector3();

function pinching(hand){
  if(!hand?.joints) return false;
  try { return !!isPinching(hand); } catch { return false; }
}
function fisted(hand){
  if(!hand?.joints) return false;
  try { return !!isFist(hand); } catch { return false; }
}
function anyPinch(args){ return pinching(args?.leftHand) || pinching(args?.rightHand); }
function anyFist(args){ return fisted(args?.leftHand) || fisted(args?.rightHand); }
function anyHandGesture(args){ return anyPinch(args) || anyFist(args); }
function poseDist(a,b){ return Math.hypot(Number((a?.x||0)-(b?.x||0)), Number((a?.z||0)-(b?.z||0))); }
function pad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
function axes(proxy){ return Array.from(pad(proxy)?.axes || []); }
function stick(args){
  const r = axes(args?.rightController), l = axes(args?.leftController);
  let x = 0, y = 0;
  if(r.length >= 4){ x = Number(r[2] || 0); y = Number(r[3] || 0); }
  if(Math.abs(x) < .14 && r.length >= 2) x = Number(r[0] || 0);
  if(Math.abs(y) < .14 && r.length >= 2) y = Number(r[1] || 0);
  if(Math.abs(x) < .14 && l.length >= 2) x = Number(l[0] || 0);
  if(Math.abs(y) < .14 && l.length >= 2) y = Number(l[1] || 0);
  if(Math.abs(x) < .18) x = 0;
  if(Math.abs(y) < .18) y = 0;
  return {x,y};
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
  let blockedPinchOnly = 0;
  let forcedForward = 0;
  let snapPass = 0;
  let hiddenControllerMeshes = 0;
  let pokerTeleportBlocks = 0;
  let earlyJumpReverts = 0;

  function setPose(p){
    if(!p) return false;
    if(typeof rig.setPlayerPose === "function") return rig.setPlayerPose(p.x, p.y, p.z);
    if(typeof rig.setPlayerXZ === "function") return rig.setPlayerXZ(p.x, p.z);
    return false;
  }

  rig.update = (args = {}) => {
    const before = rig.getPlayerPose?.();
    const rawPinch = anyPinch(args);
    const rawFist = anyFist(args);
    const rawGesture = anyHandGesture(args);
    const blockForPoker = !!window.SVR_PHASE136_BLOCK_TELEPORT_FOR_POKER_ACTION;
    let updateArgs = args;

    hiddenControllerMeshes += hideControllerMeshes(opts?.scene);

    if(blockForPoker){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
      pokerTeleportBlocks++;
    }else if(rawPinch && !rawFist){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
      blockedPinchOnly++;
    }

    originalUpdate(updateArgs);

    const after = rig.getPlayerPose?.();
    const moved = poseDist(before, after);
    const state = rig.getState?.() || {};
    const s = stick(args);

    if(blockForPoker && moved > .02){
      setPose(before);
      earlyJumpReverts++;
    }

    if(opts?.renderer?.xr?.isPresenting && s.y && !state.mode && !rawGesture && before){
      const f = headForward(opts.renderer, opts.camera).clone();
      const move = -s.y;
      const dt = Math.min(Math.max(args.dt || .016, .008), .05);
      rig.setPlayerXZ?.(before.x + f.x * move * MOVE_SPEED * dt, before.z + f.z * move * MOVE_SPEED * dt);
      forcedForward++;
    }
    if(Math.abs(s.x) > .18) snapPass++;

    const stateNow = {
      build: LABEL,
      active: true,
      rightStickForwardBackHeadDirection: true,
      rightStickSnapTurn45: true,
      controllerButtonHoldAimReleaseTeleport: true,
      aGripTriggerHoldReleaseTeleport: true,
      fistGripHoldAimReleaseTeleport: true,
      pinchOnlyLeapBlocked: true,
      blockedPinchOnly,
      pokerActionTeleportBlock: true,
      pokerTeleportBlocks,
      earlyJumpReverts,
      forcedHeadForwardStickMovement: true,
      forcedForward,
      snapTurnInputPasses: snapPass,
      moveSpeed: MOVE_SPEED,
      controllerMeshesHidden: true,
      hiddenControllerMeshes,
      handProxyPreserved: true,
      siteTouched: false,
      checkedAt: new Date().toISOString()
    };
    window.SVR_PHASE141_QUEST_MOVEMENT_TELEPORT_FINAL_LOCK = stateNow;
    window.SVR_PHASE138_FIST_TELEPORT_HEAD_FORWARD_CONTROLLER_LOCK = stateNow;
    window.SVR_PHASE137_FIST_ARMED_TELEPORT_RELEASE_COMMIT_LOCK = stateNow;
    window.SVR_PHASE135_PLAYABILITY_MOVEMENT_CONTROL_LOCK = stateNow;
  };

  return rig;
}
