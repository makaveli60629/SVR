import * as THREE from "three";
import { createTeleportRig as baseRig } from "./movement_phase286_input_lock.js?v=phase135-control-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-135-PLAYABILITY-MOVEMENT-CONTROL-LOCK";
const MIN_HAND_AIM_MS = 680;
const MOVE_SPEED = 5.25;
const BOOST_SPEED = 0.85;

function held(hand){
  if(!hand?.joints) return false;
  try { return !!(isPinching(hand) || isFist(hand)); } catch { return false; }
}
function anyHand(args){ return held(args?.leftHand) || held(args?.rightHand); }
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
function headForward(renderer,camera){
  const v = new THREE.Vector3();
  const xr = renderer?.xr?.getCamera?.(camera) || camera;
  const src = xr?.cameras?.[0] || xr;
  src?.updateWorldMatrix?.(true,false);
  src?.getWorldDirection?.(v);
  v.y = 0;
  if(v.lengthSq() < 1e-5) v.set(0,0,-1);
  return v.normalize();
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  let aiming = false;
  let aimStartedAt = 0;
  let wasHeld = false;
  let revertedEarly = 0;
  let correctedForward = 0;
  let boostedForward = 0;

  function setPose(p){
    if(!p) return false;
    if(typeof rig.setPlayerPose === "function") return rig.setPlayerPose(p.x, p.y, p.z);
    if(typeof rig.setPlayerXZ === "function") return rig.setPlayerXZ(p.x, p.z);
    return false;
  }

  rig.update = (args = {}) => {
    const before = rig.getPlayerPose?.();
    const now = performance.now();
    const handHeldBefore = anyHand(args);
    if(handHeldBefore && !aiming){ aiming = true; aimStartedAt = now; }

    originalUpdate(args);

    const after = rig.getPlayerPose?.();
    const moved = poseDist(before, after);
    const heldAge = aiming ? now - aimStartedAt : 0;
    const releasedThisFrame = aiming && wasHeld && !handHeldBefore;

    if(aiming && handHeldBefore && moved > .035){
      setPose(before);
      revertedEarly++;
    }else if(releasedThisFrame && heldAge < MIN_HAND_AIM_MS && moved > .035){
      setPose(before);
      revertedEarly++;
    }

    const y = stickY(args);
    const state = rig.getState?.() || {};
    if(opts?.renderer?.xr?.isPresenting && y && !state.mode && !handHeldBefore){
      const p0 = before;
      const p1 = rig.getPlayerPose?.();
      const dx = Number((p1?.x||0) - (p0?.x||0));
      const dz = Number((p1?.z||0) - (p0?.z||0));
      const movedLen = Math.hypot(dx,dz);
      const f = headForward(opts.renderer, opts.camera);
      const move = -y;
      if(movedLen > .002){
        const d = new THREE.Vector3(dx,0,dz).normalize();
        const dot = d.dot(f);
        if(dot < .72){
          rig.setPlayerXZ?.(p0.x + f.x * move * MOVE_SPEED * (args.dt || .016), p0.z + f.z * move * MOVE_SPEED * (args.dt || .016));
          correctedForward++;
        }else{
          rig.setPlayerXZ?.(p1.x + f.x * move * BOOST_SPEED * (args.dt || .016), p1.z + f.z * move * BOOST_SPEED * (args.dt || .016));
          boostedForward++;
        }
      }
    }

    if(releasedThisFrame || (!handHeldBefore && aiming && heldAge > 1200)){ aiming = false; aimStartedAt = 0; }
    wasHeld = handHeldBefore;

    window.SVR_PHASE135_PLAYABILITY_MOVEMENT_CONTROL_LOCK = {
      build: LABEL,
      active: true,
      minHandAimMs: MIN_HAND_AIM_MS,
      handReleaseOnlyCommitGuard: true,
      earlyHandJumpReverts: revertedEarly,
      headForwardStickCorrection: true,
      correctedForward,
      boostedForward,
      moveSpeed: MOVE_SPEED,
      handAiming: aiming,
      heldAgeMs: Math.round(heldAge || 0),
      siteTouched: false,
      checkedAt: new Date().toISOString()
    };
  };

  return rig;
}
