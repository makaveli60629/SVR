import * as THREE from "three";
import { CONFIG } from "./config.js";

export function createDesktopControls({ camera, domElement, roomClamp = 25 }){
  const state = { yaw: 0, pitch: 0, keys: new Set(), locked: false };

  domElement.addEventListener("click", ()=>{
    if (!state.locked) domElement.requestPointerLock?.();
  });
  document.addEventListener("pointerlockchange", ()=>{
    state.locked = document.pointerLockElement === domElement;
  });

  document.addEventListener("mousemove", (e)=>{
    if (!state.locked) return;
    const sens = 0.0023;
    state.yaw -= e.movementX * sens;
    state.pitch -= e.movementY * sens;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
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
    if (state.keys.has("KeyW")) mf += 1;
    if (state.keys.has("KeyS")) mf -= 1;
    if (state.keys.has("KeyD")) mr += 1;
    if (state.keys.has("KeyA")) mr -= 1;
    if (state.keys.has("Space")) mu += 1;
    if (state.keys.has("ShiftLeft") || state.keys.has("ShiftRight")) mu -= 1;

    const boost = (state.keys.has("ControlLeft") || state.keys.has("ControlRight")) ? CONFIG.DESKTOP_BOOST : 1;
    const speed = CONFIG.DESKTOP_SPEED * boost;

    camera.position.addScaledVector(fwd, mf * speed * dt);
    camera.position.addScaledVector(right, mr * speed * dt);
    camera.position.y = Math.max(0.2, camera.position.y + mu * speed * dt);
    if (Number.isFinite(roomClamp) && roomClamp > 0){
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -roomClamp, roomClamp);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -roomClamp, roomClamp);
    }
  }

  return { update };
}
