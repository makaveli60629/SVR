import { createTeleportRig as baseRig } from "./teleport_phase101j_forward_lock.js?v=phase101jforwardlock";

const LABEL = "PHASE-286-QUEST-INPUT-PRIORITY-LOCK";

function pad(proxy){
  return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || null;
}
function livePad(proxy){
  const g = pad(proxy);
  if (!g) return false;
  const axes = Array.from(g.axes || []);
  const buttons = Array.from(g.buttons || []);
  return axes.some(v => Math.abs(Number(v || 0)) > 0.18) || buttons.some(b => b?.pressed || Number(b?.value || 0) > 0.18);
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  rig.update = (args = {}) => {
    const xr = !!opts?.renderer?.xr?.isPresenting;
    const usingPad = livePad(args.leftController) || livePad(args.rightController);
    window.SVR_PHASE286_QUEST_INPUT_PRIORITY_LOCK = {
      build: LABEL,
      active: true,
      xr,
      usingPad,
      controllerFallbackProtected: true,
      headForwardMoveProtected: true,
      teleportForwardRayProtected: true,
      siteTouched: false,
      checkedAt: new Date().toISOString()
    };
    if (xr && usingPad) return originalUpdate({ ...args, leftHand: null, rightHand: null });
    return originalUpdate(args);
  };
  return rig;
}
