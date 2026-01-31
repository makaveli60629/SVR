/**
 * SCARLETT1 SPINE — XR RIG + LOCOMOTION (PERMANENT)
 * - Player rig you can move in VR
 * - Controllers visible (simple meshes)
 * - Smooth locomotion (thumbstick) + snap turn
 * - Teleport (trigger) using raycast to floor
 * - Safe: no Three.js example imports
 */

export async function init(ctx) {
  const { THREE, scene, camera, renderer, log } = ctx;

  log('[spine] init scarlett1 spine');

  // -------------------------
  // PLAYER RIG (move this, not the XR camera)
  // -------------------------
  const playerRig = new THREE.Group();
  playerRig.name = 'playerRig';
  scene.add(playerRig);

  // put camera inside rig
  playerRig.add(camera);

  // default standing height for non-XR (XR overrides pose)
  camera.position.set(0, 1.6, 0);

  // expose for buttons (Reset Spawn, etc)
  window.__SCARLETT_PLAYER__ = playerRig;

  // -------------------------
  // CONTROLLERS (VISIBLE)
  // -------------------------
  const controllers = [];
  const controllerGrips = []; // optional later

  function makeControllerViz() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x9b7cff, roughness: 0.35, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.10, 12), mat);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.05;
    g.add(body);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 12), mat);
    tip.position.z = -0.11;
    g.add(tip);
    return g;
  }

  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i);
    c.add(makeControllerViz());
    playerRig.add(c);
    controllers.push(c);

    // Optional: grips later with controller models
    const grip = renderer.xr.getControllerGrip(i);
    playerRig.add(grip);
    controllerGrips.push(grip);
  }

  // -------------------------
  // RAY + TELEPORT TARGET
  // -------------------------
  const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  function makeRay() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);
    const line = new THREE.Line(geo, rayMat);
    line.name = 'teleRay';
    line.scale.z = 12;
    line.visible = false;
    return line;
  }

  const rays = [makeRay(), makeRay()];
  controllers[0].add(rays[0]);
  controllers[1].add(rays[1]);

  const teleportMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.24, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  teleportMarker.rotation.x = -Math.PI / 2;
  teleportMarker.visible = false;
  scene.add(teleportMarker);

  // we will raycast against "floor" meshes tagged with userData.isFloor = true
  const raycaster = new THREE.Raycaster();
  const tmpMat4 = new THREE.Matrix4();
  const tmpDir = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();

  // -------------------------
  // MOVEMENT SETTINGS
  // -------------------------
  const MOVE_SPEED = 2.2;      // meters/sec
  const TURN_DEG = 30;         // snap turn degrees
  const TURN_COOLDOWN = 0.25;  // seconds
  let turnCooldownT = 0;

  // Button state
  const state = {
    teleportArmed: [false, false],
    teleportHit: null,
  };

  function getGamepad(i) {
    const s = renderer.xr.getSession?.();
    if (!s) return null;
    const src = s.inputSources;
    for (let k = 0; k < src.length; k++) {
      const gp = src[k]?.gamepad;
      if (!gp) continue;
      // map by handedness if possible
      const handed = src[k].handedness; // 'left'/'right'
      if (i === 0 && handed === 'left') return gp;
      if (i === 1 && handed === 'right') return gp;
    }
    // fallback: first 2 gamepads
    const gps = [];
    for (let k = 0; k < src.length; k++) if (src[k]?.gamepad) gps.push(src[k].gamepad);
    return gps[i] || null;
  }

  function yawFromCamera() {
    // yaw-only direction based on camera forward
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    fwd.y = 0;
    fwd.normalize();
    return fwd;
  }

  function rightFromYaw(fwd) {
    const r = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    // cross(forward, up) gives left; invert for right
    r.multiplyScalar(-1);
    return r;
  }

  function tryTeleportFromController(i) {
    const c = controllers[i];
    const ray = rays[i];

    // ray origin + direction
    tmpMat4.identity().extractRotation(c.matrixWorld);
    tmpDir.set(0, 0, -1).applyMatrix4(tmpMat4).normalize();
    tmpPos.setFromMatrixPosition(c.matrixWorld);

    raycaster.set(tmpPos, tmpDir);

    // find all floor candidates
    const floors = [];
    scene.traverse(obj => {
      if (obj?.userData?.isFloor) floors.push(obj);
    });

    const hits = raycaster.intersectObjects(floors, true);
    if (hits && hits.length) {
      const p = hits[0].point;
      teleportMarker.position.set(p.x, p.y + 0.01, p.z);
      teleportMarker.visible = true;
      state.teleportHit = p.clone();
      ray.visible = true;
      return true;
    }

    teleportMarker.visible = false;
    state.teleportHit = null;
    ray.visible = true;
    return false;
  }

  function commitTeleport() {
    if (!state.teleportHit) return;
    // move rig so camera ends up over target. Use camera world position as offset.
    const camWorld = new THREE.Vector3();
    camera.getWorldPosition(camWorld);

    // playerRig world position
    const rigWorld = new THREE.Vector3();
    playerRig.getWorldPosition(rigWorld);

    // offset from rig to camera (world)
    const offset = camWorld.sub(rigWorld);

    // set rig position so camera lands on hit
    playerRig.position.set(
      state.teleportHit.x - offset.x,
      playerRig.position.y, // keep current rig Y (floor is y=0)
      state.teleportHit.z - offset.z
    );

    teleportMarker.visible = false;
    state.teleportHit = null;
  }

  // -------------------------
  // UPDATE LOOP
  // -------------------------
  function update(dt) {
    // dt in seconds
    if (!dt || !isFinite(dt)) dt = 0.016;

    // snap turn cooldown
    turnCooldownT = Math.max(0, turnCooldownT - dt);

    const session = renderer.xr.getSession?.();
    const inXR = !!session;

    // In XR: controller locomotion + teleport
    if (inXR) {
      const fwd = yawFromCamera();
      const right = rightFromYaw(fwd);

      // Smooth move uses LEFT stick (axes 2/3 commonly, but varies)
      const gpL = getGamepad(0);
      const gpR = getGamepad(1);

      // default
      let axX = 0, axY = 0;

      if (gpL?.axes?.length >= 2) {
        // pick last two axes (works for many controllers)
        axX = gpL.axes[2] ?? gpL.axes[0] ?? 0;
        axY = gpL.axes[3] ?? gpL.axes[1] ?? 0;
      }

      // deadzone
      const dz = 0.15;
      const mx = Math.abs(axX) > dz ? axX : 0;
      const my = Math.abs(axY) > dz ? axY : 0;

      // move
      if (mx || my) {
        const move = new THREE.Vector3();
        move.addScaledVector(right, mx);
        move.addScaledVector(fwd, my * -1); // push forward is usually -Y
        move.normalize().multiplyScalar(MOVE_SPEED * dt);
        playerRig.position.add(move);
      }

      // Snap turn uses RIGHT stick X
      if (gpR?.axes?.length >= 2 && turnCooldownT <= 0) {
        const rx = gpR.axes[2] ?? gpR.axes[0] ?? 0;
        if (rx > 0.7) {
          playerRig.rotation.y -= THREE.MathUtils.degToRad(TURN_DEG);
          turnCooldownT = TURN_COOLDOWN;
        } else if (rx < -0.7) {
          playerRig.rotation.y += THREE.MathUtils.degToRad(TURN_DEG);
          turnCooldownT = TURN_COOLDOWN;
        }
      }

      // Teleport: hold trigger to aim, release to teleport
      // Many gamepads: buttons[0] trigger, buttons[1] squeeze. We'll check a couple.
      for (let i = 0; i < 2; i++) {
        const gp = i === 0 ? gpL : gpR;
        if (!gp?.buttons?.length) continue;

        const trigger = gp.buttons[0]?.value ?? 0;
        const pressed = trigger > 0.2;

        if (pressed) {
          state.teleportArmed[i] = true;
          tryTeleportFromController(i);
        } else if (state.teleportArmed[i]) {
          // release commits teleport
          state.teleportArmed[i] = false;
          // hide rays
          rays[0].visible = false;
          rays[1].visible = false;
          commitTeleport();
        }
      }

      // If not aiming, hide rays
      if (!state.teleportArmed[0] && !state.teleportArmed[1]) {
        rays[0].visible = false;
        rays[1].visible = false;
        teleportMarker.visible = false;
      }
    }
  }

  // -------------------------
  // API FOR ROOT BUTTONS
  // -------------------------
  function resetSpawn() {
    // if world defined a spawn pad, use it
    const sp = window.__SCARLETT_SPAWN__;
    if (sp?.position) {
      playerRig.position.set(sp.position.x, 0, sp.position.z);
      playerRig.rotation.set(0, 0, 0);
      log('[spine] reset spawn -> spawn pad');
      return;
    }
    playerRig.position.set(0, 0, 10);
    playerRig.rotation.set(0, 0, 0);
    log('[spine] reset spawn -> fallback');
  }

  window.__SCARLETT_RESET_SPAWN__ = resetSpawn;

  log('[spine] XR rig ready ✅');

  return {
    updates: [update],
    interactables: [],
  };
    }
