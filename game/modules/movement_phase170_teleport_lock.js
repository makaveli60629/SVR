import { createTeleportRig as phase169Rig } from "./movement_phase169_locomotion_polish_lock.js?v=phase169-locomotion-polish";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-171-HAND-TELEPORT-RELEASE-GATE-FACE-FIST-TOGGLE-LOCK";

function safeFist(hand){
  if(!hand?.joints) return false;
  try { return !!isFist(hand); } catch { return false; }
}
function safePinch(hand){
  if(!hand?.joints) return false;
  try { return !!isPinching(hand); } catch { return false; }
}
function handLabel(leftHeld, rightHeld){
  if(rightHeld) return "right-hand";
  if(leftHeld) return "left-hand";
  return null;
}

export function createTeleportRig(opts){
  const rig = phase169Rig(opts);
  window.SVR_TELEPORT_RIG_REF = rig;
  window.SVR_TELEPORT_RIG = rig;

  const baseUpdate = typeof rig.update === "function" ? rig.update.bind(rig) : null;
  if(baseUpdate){
    rig.update = (args = {}) => {
      const leftFist = safeFist(args.leftHand);
      const rightFist = safeFist(args.rightHand);
      const leftPinch = safePinch(args.leftHand);
      const rightPinch = safePinch(args.rightHand);
      const leftHeld = leftFist || leftPinch;
      const rightHeld = rightFist || rightPinch;
      const held = leftHeld || rightHeld;
      const sourceHand = rightHeld ? args.rightHand : leftHeld ? args.leftHand : null;

      window.SVR_PHASE170_HAND_INPUT = {
        build: LABEL,
        held,
        leftHeld,
        rightHeld,
        leftFist,
        rightFist,
        leftPinch,
        rightPinch,
        source: handLabel(leftHeld, rightHeld),
        checkedAt: new Date().toISOString()
      };
      window.SVR_PHASE170_HAND_SOURCE = sourceHand;

      const phase170OwnsHandTeleport = window.SVR_PHASE170_HAND_TELEPORT_AUTHORITY !== false;
      const safeArgs = held && phase170OwnsHandTeleport ? { ...args, leftHand:null, rightHand:null } : args;
      return baseUpdate(safeArgs);
    };
  }

  window.SVR_PHASE170_MOVEMENT_BRIDGE = {
    build: LABEL,
    active: true,
    handInputExported: true,
    fistPinchStateExported: true,
    baseHandTeleportSuppressedWhenPhase170Active: true,
    phase169LocomotionPreserved: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  return rig;
}
