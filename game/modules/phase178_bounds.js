import * as THREE from "three";

const LABEL = "PHASE-155-TIGHT-LOBBY-WALL-PERIMETER-LOCK";
const FLOOR_LIMIT_X = 18.50;
const FLOOR_LIMIT_Z = 15.40;
const PLAYER_R = 0.45;
const X_LIM = FLOOR_LIMIT_X - PLAYER_R;
const Z_LIM = FLOOR_LIMIT_Z - PLAYER_R;

export function constrainLobbyBounds(x, z){
  const ox = Number.isFinite(x) ? x : 0;
  const oz = Number.isFinite(z) ? z : 0;
  const px = THREE.MathUtils.clamp(ox, -X_LIM, X_LIM);
  const pz = THREE.MathUtils.clamp(oz, -Z_LIM, Z_LIM);
  return {
    x: px,
    z: pz,
    blocked: Math.abs(px - ox) > 0.001 || Math.abs(pz - oz) > 0.001
  };
}

export function installPhase178Bounds(){
  window.SVR_CONSTRAIN_LOBBY_BOUNDS = constrainLobbyBounds;
  let hits = 0;
  const timer = setInterval(()=>{
    const cam = window.__SVR_CAMERA__;
    const renderer = window.__SVR_RENDERER__;
    if (cam && !renderer?.xr?.isPresenting){
      const p = constrainLobbyBounds(cam.position.x, cam.position.z);
      if (p.blocked){
        cam.position.x = p.x;
        cam.position.z = p.z;
        hits++;
      }
    }
    window.SVR_PHASE178_BOUNDS = {
      label: LABEL,
      locked: true,
      shape: "phase200-tight-lobby-rectangle",
      floorLimitX: FLOOR_LIMIT_X,
      floorLimitZ: FLOOR_LIMIT_Z,
      xLimit: X_LIM,
      zLimit: Z_LIM,
      playerRadius: PLAYER_R,
      desktopCorrections: hits,
      voidEscapeBlocked: true,
      wallPerimeterLocked: true,
      checkedAt: new Date().toISOString()
    };
  }, 120);
  console.log("[Phase155] tight lobby wall perimeter bounds active");
  return timer;
}
