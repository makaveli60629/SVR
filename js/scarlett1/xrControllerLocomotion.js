import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function attachXRControllerLocomotion(renderer, rig, camera, log){
  const tmp = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const speed = 2.0;
  const turnSpeed = 1.6;

  function axesFor(controller){
    const gp = controller?.gamepad;
    if(!gp || !gp.axes) return null;
    return gp.axes;
  }

  function update(dt){
    const s = dt * speed;
    const t = dt * turnSpeed;

    // Left controller: move
    const c0 = renderer.xr.getController(0);
    const c1 = renderer.xr.getController(1);

    const a0 = axesFor(c0);
    const a1 = axesFor(c1);

    const axMove = a0 ? a0[2] ?? a0[0] : 0;
    const ayMove = a0 ? a0[3] ?? a0[1] : 0;

    camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    right.copy(fwd).cross(camera.up).normalize();

    rig.position.addScaledVector(fwd, -ayMove * s);
    rig.position.addScaledVector(right, axMove * s);

    // Right controller: turn
    const axTurn = a1 ? a1[2] ?? a1[0] : 0;
    rig.rotation.y -= axTurn * t;
  }

  log?.("[xr] controller locomotion ready");
  return { update };
}
