import * as THREE from "three";
import { createTeleportRig as baseRig } from "./movement_phase286_input_lock.js?v=phase138-control-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-138-FIST-TELEPORT-HEAD-FORWARD-CONTROLLER-LOCK";
const MIN_HAND_AIM_MS = 180;
const MOVE_SPEED = 5.65;
const FIST_TOGGLE_COOLDOWN_MS = 390;
const FIST_LOOK_DOT = 0.18;

const vHead = new THREE.Vector3();
const vHand = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vToHand = new THREE.Vector3();

function held(hand){
  if(!hand?.joints) return false;
  try { return !!(isPinching(hand) || isFist(hand)); } catch { return false; }
}
function pinching(hand){
  if(!hand?.joints) return false;
  try { return !!isPinching(hand); } catch { return false; }
}
function fisted(hand){
  if(!hand?.joints) return false;
  try { return !!isFist(hand); } catch { return false; }
}
function anyHand(args){ return held(args?.leftHand) || held(args?.rightHand); }
function anyPinch(args){ return pinching(args?.leftHand) || pinching(args?.rightHand); }
function anyFist(args){ return fisted(args?.leftHand) || fisted(args?.rightHand); }
function poseDist(a,b){ return Math.hypot(Number((a?.x||0)-(b?.x||0)), Number((a?.z||0)-(b?.z||0))); }
function pad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
function axes(proxy){ return Array.from(pad(proxy)?.axes || []); }
function stickY(args){
  const r = axes(args?.rightController), l = axes(args?.leftController);
  let y = 0;
  if(r.length >= 4) y = Number(r[3] || 0);
  if(Math.abs(y) < .14 && r.length >= 2) y = Number(r[1] || 0);
  if(Math.abs(y) < .14 && l.length >= 2) y = Number(l[1] || 0);
  return Math.abs(y) > .16 ? y : 0;
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
function handWorldPosition(hand){
  const wrist = hand?.joints?.wrist || hand?.joints?.["index-finger-tip"];
  if(!wrist) return null;
  wrist.updateWorldMatrix?.(true,false);
  wrist.getWorldPosition(vHand);
  return vHand;
}
function lookingAtHand(hand, renderer, camera){
  const hp = handWorldPosition(hand);
  if(!hp) return true;
  const src = xrCamera(renderer,camera);
  src?.updateWorldMatrix?.(true,false);
  src?.getWorldPosition?.(vHead);
  const f = headForward(renderer,camera).clone();
  vToHand.copy(hp).sub(vHead);
  if(vToHand.lengthSq() < .01) return true;
  vToHand.normalize();
  return f.dot(vToHand) > FIST_LOOK_DOT;
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  let aiming = false;
  let aimStartedAt = 0;
  let wasHeld = false;
  let wasFist = false;
  let revertedEarly = 0;
  let forcedForward = 0;
  let pokerTeleportBlocks = 0;
  let fistTeleportArmed = false;
  let lastFistToggleAt = 0;
  let blockedUnarmedPinches = 0;
  let releasePasses = 0;

  function setPose(p){
    if(!p) return false;
    if(typeof rig.setPlayerPose === "function") return rig.setPlayerPose(p.x, p.y, p.z);
    if(typeof rig.setPlayerXZ === "function") return rig.setPlayerXZ(p.x, p.z);
    return false;
  }
  function toggleByFist(args, now){
    const lf = fisted(args.leftHand), rf = fisted(args.rightHand);
    const fistNow = lf || rf;
    const fistEdge = fistNow && !wasFist;
    const hand = rf ? args.rightHand : args.leftHand;
    const lookOk = hand ? lookingAtHand(hand, opts.renderer, opts.camera) : true;
    if(fistEdge && lookOk && now - lastFistToggleAt > FIST_TOGGLE_COOLDOWN_MS){
      fistTeleportArmed = !fistTeleportArmed;
      lastFistToggleAt = now;
      window.SVR_PHASE138_FIST_TELEPORT_TOGGLE_EVENT = {
        build: LABEL,
        armed: fistTeleportArmed,
        side: rf ? "right" : "left",
        lookOk,
        checkedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  rig.update = (args = {}) => {
    const before = rig.getPlayerPose?.();
    const now = performance.now();
    const fistToggleFrame = toggleByFist(args, now);
    const rawPinch = anyPinch(args);
    const rawHandHeld = anyHand(args);
    const blockHandTeleportForPoker = !!window.SVR_PHASE136_BLOCK_TELEPORT_FOR_POKER_ACTION;
    const recentlyToggled = now - lastFistToggleAt < 260;

    let updateArgs = args;
    if(blockHandTeleportForPoker){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
      pokerTeleportBlocks++;
    }else if(fistToggleFrame || recentlyToggled){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
    }else if(!fistTeleportArmed && rawPinch){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
      blockedUnarmedPinches++;
    }else if(!fistTeleportArmed && rawHandHeld && !rawPinch){
      updateArgs = { ...updateArgs, leftHand:null, rightHand:null };
    }

    const handHeldBefore = anyHand(updateArgs);
    if(handHeldBefore && !aiming){ aiming = true; aimStartedAt = now; }

    originalUpdate(updateArgs);

    const after = rig.getPlayerPose?.();
    const moved = poseDist(before, after);
    const heldAge = aiming ? now - aimStartedAt : 0;
    const releasedThisFrame = aiming && wasHeld && !handHeldBefore;

    if(blockHandTeleportForPoker && moved > .02){
      setPose(before);
      revertedEarly++;
    }else if(aiming && handHeldBefore && moved > .035){
      setPose(before);
      revertedEarly++;
    }else if(releasedThisFrame){
      releasePasses++;
      if(moved > .05) fistTeleportArmed = false;
    }

    const y = stickY(args);
    const state = rig.getState?.() || {};
    if(opts?.renderer?.xr?.isPresenting && y && !state.mode && !rawHandHeld && before){
      const f = headForward(opts.renderer, opts.camera);
      const move = -y;
      const dt = Math.min(Math.max(args.dt || .016, .008), .05);
      rig.setPlayerXZ?.(before.x + f.x * move * MOVE_SPEED * dt, before.z + f.z * move * MOVE_SPEED * dt);
      forcedForward++;
    }

    if(releasedThisFrame || blockHandTeleportForPoker || (!handHeldBefore && aiming && heldAge > 1200)){ aiming = false; aimStartedAt = 0; }
    wasHeld = handHeldBefore && !blockHandTeleportForPoker;
    wasFist = anyFist(args);

    const stateNow = {
      build: LABEL,
      active: true,
      minHandAimMs: MIN_HAND_AIM_MS,
      fistTeleportArmed,
      fistLookToggle: true,
      pinchRequiresFistArm: true,
      handReleaseCommitPass: true,
      releasePasses,
      blockedUnarmedPinches,
      pokerActionTeleportBlock: true,
      pokerTeleportBlocks,
      earlyHandJumpReverts: revertedEarly,
      headForwardStickCorrection: true,
      forcedHeadForwardStickMovement: true,
      forcedForward,
      moveSpeed: MOVE_SPEED,
      handAiming: aiming,
      heldAgeMs: Math.round(heldAge || 0),
      siteTouched: false,
      checkedAt: new Date().toISOString()
    };
    window.SVR_PHASE135_PLAYABILITY_MOVEMENT_CONTROL_LOCK = stateNow;
    window.SVR_PHASE136_PLAYABILITY_MOVEMENT_POKER_ACTION_GUARD = stateNow;
    window.SVR_PHASE137_FIST_ARMED_TELEPORT_RELEASE_COMMIT_LOCK = stateNow;
    window.SVR_PHASE138_FIST_TELEPORT_HEAD_FORWARD_CONTROLLER_LOCK = stateNow;
  };

  return rig;
}
