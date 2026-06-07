import * as THREE from "three";
import { CONFIG } from "./config.js";

export function createDesktopControls({ camera, domElement }){
  const state = { yaw: camera.rotation.y || 0, pitch: camera.rotation.x || 0, keys: new Set(), locked: false, dragging: false, lastX: 0, lastY: 0 };

  domElement.tabIndex = 0;
  domElement.addEventListener("click", ()=>{ domElement.focus?.(); if (!state.locked) domElement.requestPointerLock?.(); });
  document.addEventListener("pointerlockchange", ()=>{ state.locked = document.pointerLockElement === domElement; });

  domElement.addEventListener("pointerdown", (e)=>{ domElement.focus?.(); state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY; });
  window.addEventListener("pointerup", ()=>{ state.dragging = false; });
  window.addEventListener("pointercancel", ()=>{ state.dragging = false; });

  document.addEventListener("mousemove", (e)=>{
    if (!state.locked && !state.dragging) return;
    const sens = state.locked ? 0.0023 : 0.0045;
    const dx = state.locked ? e.movementX : (e.clientX - state.lastX);
    const dy = state.locked ? e.movementY : (e.clientY - state.lastY);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.yaw -= dx * sens;
    state.pitch -= dy * sens;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
  });

  document.addEventListener("keydown", (e)=>{ state.keys.add(e.code); if (e.code === "Escape") document.exitPointerLock?.(); });
  document.addEventListener("keyup", (e)=> state.keys.delete(e.code));

  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  function update(dt){
    const turnSpeed = 1.55;
    if (state.keys.has("KeyQ") || state.keys.has("ArrowLeft")) state.yaw += turnSpeed * dt;
    if (state.keys.has("KeyE") || state.keys.has("ArrowRight")) state.yaw -= turnSpeed * dt;

    camera.rotation.order = "YXZ";
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;

    fwd.set(0, 0, -1).applyAxisAngle(up, state.yaw).normalize();
    right.copy(fwd).cross(up).normalize();

    let mf = 0, mr = 0, mu = 0;
    if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) mf += 1;
    if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) mf -= 1;
    if (state.keys.has("KeyD")) mr += 1;
    if (state.keys.has("KeyA")) mr -= 1;
    if (state.keys.has("Space")) mu += 1;
    if (state.keys.has("ShiftLeft") || state.keys.has("ShiftRight")) mu -= 1;

    const boost = (state.keys.has("ControlLeft") || state.keys.has("ControlRight")) ? CONFIG.DESKTOP_BOOST : 1;
    const speed = (CONFIG.DESKTOP_SPEED || 3.2) * boost;
    camera.position.addScaledVector(fwd, mf * speed * dt);
    camera.position.addScaledVector(right, mr * speed * dt);
    camera.position.y = Math.max(1.2, Math.min(3.0, camera.position.y + mu * speed * dt));
  }

  return { update };
}
