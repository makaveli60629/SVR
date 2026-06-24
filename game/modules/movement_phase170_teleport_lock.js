import { createTeleportRig as phase169Rig } from "./movement_phase169_locomotion_polish_lock.js?v=phase169-locomotion-polish";

const LABEL = "PHASE-170-TELEPORT-AIM-COMMIT-LOCK";

export function createTeleportRig(opts){
  const rig = phase169Rig(opts);
  window.SVR_TELEPORT_RIG_REF = rig;
  window.SVR_TELEPORT_RIG = rig;
  window.SVR_PHASE170_MOVEMENT_BRIDGE = {
    build: LABEL,
    active: true,
    exportedExistingTeleportRig: true,
    phase169LocomotionPreserved: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  return rig;
}
