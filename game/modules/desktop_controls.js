import * as THREE from "three";
import { CONFIG } from "./config.js";

export function createDesktopControls({ camera, domElement }){
  const state = { yaw: 0, pitch: 0, keys: new Set(), locked: false, dragging: false, lockFailed: false };

  function tryLock(){
    if (state.locked || state.lockFailed || !domElement?.requestPointerLock) return;
    if (document.visibilityState && document.visibilityState !== "visible") return;
    try {
      const req = domElement.requestPointerLock();
      if (req && typeof req.catch === "function") req.catch(()=>{ state.lockFailed = true; });
    } catch (_) {
      state.lockFailed = true;
    }
  }

  domElement?.addEventListener("click", tryLock);
  document.addEventListener("pointerlockchange", ()=>{
    state.locked = document.pointerLockElement === domElement;
  });
  document.addEventListener("pointerlockerror", ()=>{
    state.lockFailed = true;
    state.locked = false;
  });

  domElement?.addEventListener("pointerdown", (e)=>{
    if (state.locked) return;
    state.dragging = true;
    try { domElement.setPointerCapture?.(e.pointerId); } catch (_) {}
  });
  domElement?.addEventListener("pointerup", (e)=>{
    state.dragging = false;
    try { domElement.releasePointerCapture?.(e.pointerId); } catch (_) {}
  });
  domElement?.addEventListener("pointercancel", ()=>{ state.dragging = false; });

  function rotate(dx, dy){
    const sens = 0.0023;
    state.yaw -= dx * sens;
    state.pitch -= dy * sens;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
  }

  document.addEventListener("mousemove", (e)=>{
    if (!state.locked) return;
    rotate(e.movementX || 0, e.movementY || 0);
  });
  domElement?.addEventListener("pointermove", (e)=>{
    if (state.locked || !state.dragging) return;
    rotate(e.movementX || 0, e.movementY || 0);
  });

  document.addEventListener("keydown", (e)=>{
    state.keys.add(e.code);
    if (e.code === "Escape") document.exitPointerLock?.();
  });
  document.addEventListener("keyup", (e)=> state.keys.delete(e.code));

  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  function update(dt){
    camera.rotation.order = "YXZ";
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;

    fwd.set(0, 0, -1).applyAxisAngle(up, state.yaw).normalize();
    right.copy(fwd).cross(up).normalize();

    let mf = 0, mr = 0, mu = 0;
    if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) mf += 1;
    if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) mf -= 1;
    if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) mr += 1;
    if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) mr -= 1;
    if (state.keys.has("Space")) mu += 1;
    if (state.keys.has("ShiftLeft") || state.keys.has("ShiftRight")) mu -= 1;

    const boost = (state.keys.has("ControlLeft") || state.keys.has("ControlRight")) ? CONFIG.DESKTOP_BOOST : 1;
    const speed = CONFIG.DESKTOP_SPEED * boost;

    camera.position.addScaledVector(fwd, mf * speed * dt);
    camera.position.addScaledVector(right, mr * speed * dt);
    camera.position.y = Math.max(0.2, camera.position.y + mu * speed * dt);
  }

  return { update, state };
}
