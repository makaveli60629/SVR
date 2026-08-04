import { createTeleportRig as baseRig } from "./teleport_phase298_hand_release_commit.js?v=phase98-stable-hand-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-98-STABLE-HAND-AIM-RELEASE-TELEPORT-LOCK";
const RELEASE_GRACE_MS = 160;
const MIN_VISIBLE_AIM_MS = 320;

function gestureHeld(hand){
  if(!hand?.joints) return false;
  try { return !!(isPinching(hand) || isFist(hand)); } catch { return false; }
}
function makeStableHand(){
  return { joints:null, inputSource:null, handedness:null, userData:{ phase98StableHandProxy:true } };
}
function copyHand(dst, src, side){
  if(!src){ dst.joints = null; dst.inputSource = null; dst.handedness = side; return dst; }
  dst.joints = src.joints || null;
  dst.inputSource = src.inputSource || src.userData?.inputSource || null;
  dst.handedness = src.handedness || side;
  dst.userData = { ...(src.userData || {}), phase98StableHandProxy:true, phase98Side:side };
  return dst;
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  const stableLeft = makeStableHand();
  const stableRight = makeStableHand();
  let aiming = false;
  let aimStartedAt = 0;
  let lastHeldAt = 0;
  let activeSide = null;

  rig.update = (args = {}) => {
    const now = performance.now();
    const leftHeld = gestureHeld(args.leftHand);
    const rightHeld = gestureHeld(args.rightHand);
    const anyHeld = leftHeld || rightHeld;

    if(anyHeld){
      if(!aiming){
        aiming = true;
        aimStartedAt = now;
        activeSide = rightHeld ? "right" : "left";
      }
      lastHeldAt = now;
      if(rightHeld) activeSide = "right";
      else if(leftHeld && !activeSide) activeSide = "left";
    }

    copyHand(stableLeft, args.leftHand, "left");
    copyHand(stableRight, args.rightHand, "right");

    const visibleAge = aiming ? now - aimStartedAt : 0;
    const releaseAge = now - lastHeldAt;
    const inReleaseGrace = aiming && !anyHeld && releaseAge < RELEASE_GRACE_MS;
    const forceHoldUntilVisible = aiming && anyHeld && visibleAge < MIN_VISIBLE_AIM_MS;

    const nextArgs = { ...args };
    if(aiming || anyHeld || inReleaseGrace || forceHoldUntilVisible){
      nextArgs.leftHand = activeSide === "left" || leftHeld ? stableLeft : null;
      nextArgs.rightHand = activeSide === "right" || rightHeld ? stableRight : null;
    }

    originalUpdate(nextArgs);

    if(aiming && !anyHeld && releaseAge >= RELEASE_GRACE_MS){
      aiming = false;
      activeSide = null;
      aimStartedAt = 0;
    }

    window.SVR_PHASE98_STABLE_HAND_AIM_RELEASE_TELEPORT_LOCK = {
      build: LABEL,
      active: true,
      aiming,
      activeSide,
      anyHeld,
      leftHeld,
      rightHeld,
      visibleAgeMs: Math.round(visibleAge),
      releaseAgeMs: Math.round(releaseAge),
      releaseGraceMs: RELEASE_GRACE_MS,
      minVisibleAimMs: MIN_VISIBLE_AIM_MS,
      stableHandProxy: true,
      earlyJumpGuard: true,
      showRayBeforeRelease: true,
      commitOnlyAfterRelease: true,
      preservesPhase298Fallback: true,
      siteTouched: false,
      checkedAt: new Date().toISOString()
    };
  };

  return rig;
}
