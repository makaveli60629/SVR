import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-178-LOBBY-BOUNDS-LOCK";
const A = 11.85;
const R = 0.42;
const LIM = A - R;
const DLIM = A * Math.SQRT2 - R;

function project(x,z,nx,nz,lim){
  const d = nx*x + nz*z - lim;
  if(d <= 0) return { x,z };
  return { x:x-nx*d, z:z-nz*d };
}
export function constrainLobbyBounds(x,z){
  let px = Number.isFinite(x) ? x : 0;
  let pz = Number.isFinite(z) ? z : 0;
  const ox = px, oz = pz;
  px = Math.max(-LIM, Math.min(LIM, px));
  pz = Math.max(-LIM, Math.min(LIM, pz));
  const h = 1 / Math.SQRT2;
  for(const p of [[h,h], [h,-h], [-h,h], [-h,-h]]){
    const q = project(px,pz,p[0],p[1],DLIM);
    px = q.x; pz = q.z;
  }
  return { x:px, z:pz, blocked: Math.abs(px-ox) > 0.001 || Math.abs(pz-oz) > 0.001 };
}
export function installPhase178Bounds(){
  window.SVR_CONSTRAIN_LOBBY_BOUNDS = constrainLobbyBounds;
  let hits = 0;
  const timer = setInterval(()=>{
    const cam = window.__SVR_CAMERA__;
    const renderer = window.__SVR_RENDERER__;
    if(cam && !renderer?.xr?.isPresenting){
      const p = constrainLobbyBounds(cam.position.x, cam.position.z);
      if(p.blocked){ cam.position.x = p.x; cam.position.z = p.z; hits++; }
    }
    window.SVR_PHASE178_BOUNDS = { label:LABEL, locked:true, apothem:A, playerRadius:R, desktopCorrections:hits, checkedAt:new Date().toISOString() };
  }, 120);
  console.log("[Phase178] lobby bounds active");
  return timer;
}
