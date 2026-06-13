import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-182-EXPANDED-ORIGINAL-WALL-BOUNDS-LOCK";
const HALF_W = 30.65;
const HALF_D = 23.15;
const PLAYER_R = 0.42;
const X_LIM = HALF_W - PLAYER_R;
const Z_LIM = HALF_D - PLAYER_R;

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
      shape: "expanded-rectangle",
      halfWidth: HALF_W,
      halfDepth: HALF_D,
      playerRadius: PLAYER_R,
      desktopCorrections: hits,
      checkedAt: new Date().toISOString()
    };
  }, 120);
  console.log("[Phase178/182] expanded original rectangular lobby bounds active");
  return timer;
}
