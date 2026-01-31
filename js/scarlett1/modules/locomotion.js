export function createLocomotion(THREE, renderer, rig, camera) {
  const keys = { w:false, a:false, s:false, d:false };
  let yaw = 0;

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (k === "arrowleft") yaw += 0.08;
    if (k === "arrowright") yaw -= 0.08;
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  });

  function moveFlat(dt) {
    const speed = 1.8; // m/s
    const forward = (keys.w ? 1 : 0) + (keys.s ? -1 : 0);
    const strafe  = (keys.d ? 1 : 0) + (keys.a ? -1 : 0);

    rig.rotation.y = yaw;

    if (forward === 0 && strafe === 0) return;

    const dir = new THREE.Vector3(strafe, 0, -forward).normalize();
    dir.applyAxisAngle(new THREE.Vector3(0,1,0), rig.rotation.y);

    rig.position.addScaledVector(dir, speed * dt);
  }

  return {
    update(dt) {
      // If XR presenting, do nothing here (we’ll add controller locomotion next)
      if (renderer.xr.isPresenting) return;
      moveFlat(dt);
    }
  };
}
