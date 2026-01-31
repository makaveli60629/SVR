/**
 * SCARLETT1 SPINE — XR EVENTS + TELEPORT (HAND + CONTROLLER) + AXIS MOVE
 * PERMANENT: edit only /js/scarlett1/*
 */

export async function init(ctx) {
  const { THREE, scene, camera, renderer, log } = ctx;

  log('[spine] init V3 xr locomotion');

  // -------------------------
  // PLAYER RIG (move this)
  // -------------------------
  const playerRig = new THREE.Group();
  playerRig.name = 'playerRig';
  scene.add(playerRig);
  playerRig.add(camera);
  camera.position.set(0, 1.6, 0);

  window.__SCARLETT_PLAYER__ = playerRig;

  // -------------------------
  // CONTROLLERS + EVENTS
  // -------------------------
  const controllers = [];
  const aiming = [false, false];
  const lastHit = [null, null];

  const raycaster = new THREE.Raycaster();
  const tmpMat4 = new THREE.Matrix4();
  const tmpDir = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();

  const teleportMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.25, 40),
    new THREE.MeshBasicMaterial({ color: 0x2bffcc, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  teleportMarker.rotation.x = -Math.PI / 2;
  teleportMarker.visible = false;
  scene.add(teleportMarker);

  function makeControllerViz() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x9b7cff, roughness: 0.35, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.11, 12), mat);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.06;
    g.add(body);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), mat);
    tip.position.z = -0.125;
    g.add(tip);
    return g;
  }

  function makeRay() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.Line(geo, mat);
    line.scale.z = 14;
    line.visible = false;
    return line;
  }

  const rays = [makeRay(), makeRay()];

  function getFloors() {
    const floors = [];
    scene.traverse(obj => {
      if (obj?.userData?.isFloor) floors.push(obj);
    });
    return floors;
  }

  function raycastFloor(i) {
    const c = controllers[i];
    if (!c) return null;

    tmpMat4.identity().extractRotation(c.matrixWorld);
    tmpDir.set(0, 0, -1).applyMatrix4(tmpMat4).normalize();
    tmpPos.setFromMatrixPosition(c.matrixWorld);

    raycaster.set(tmpPos, tmpDir);

    const hits = raycaster.intersectObjects(getFloors(), true);
    if (hits && hits.length) return hits[0].point.clone();
    return null;
  }

  function commitTeleport(i) {
    const p = lastHit[i];
    if (!p) return;

    // Keep current rig Y, move XZ
    playerRig.position.set(p.x, playerRig.position.y, p.z);

    teleportMarker.visible = false;
    lastHit[i] = null;
    aiming[i] = false;
    rays[i].visible = false;

    log('[spine] teleport ✅');
  }

  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i);
    c.add(makeControllerViz());
    c.add(rays[i]);
    playerRig.add(c);
    controllers.push(c);

    // Works for controllers AND hand tracking pinch (select events)
    c.addEventListener('selectstart', () => {
      aiming[i] = true;
      rays[i].visible = true;
      log('[input] selectstart (tele aim)');
    });
    c.addEventListener('selectend', () => {
      // teleport on release
      commitTeleport(i);
      log('[input] selectend (tele commit)');
    });

    // Squeeze can also aim/commit
    c.addEventListener('squeezestart', () => {
      aiming[i] = true;
      rays[i].visible = true;
      log('[input] squeezestart (tele aim)');
    });
    c.addEventListener('squeezeend', () => {
      commitTeleport(i);
      log('[input] squeezeend (tele commit)');
    });
  }

  // -------------------------
  // SMOOTH MOVE + SNAP TURN (only if axes exist)
  // -------------------------
  const MOVE_SPEED = 2.2;
  const SNAP_DEG = 30;
  const dz = 0.15;
  let turnCooldown = 0;

  function getSession() {
    return renderer.xr.getSession?.() || null;
  }

  function getInputGamepads(session) {
    // returns { left: gp|null, right: gp|null }
    const out = { left: null, right: null };
    if (!session) return out;
    for (const src of session.inputSources) {
      if (!src?.gamepad) continue;
      if (src.handedness === 'left') out.left = src.gamepad;
      if (src.handedness === 'right') out.right = src.gamepad;
    }
    // fallback: first two gamepads if handedness missing
    if (!out.left || !out.right) {
      const gps = session.inputSources.filter(s => s?.gamepad).map(s => s.gamepad);
      out.left = out.left || gps[0] || null;
      out.right = out.right || gps[1] || null;
    }
    return out;
  }

  function pickStickAxes(gp, preferPairIndex = 0) {
    // Robustly pick a pair: [0,1] or [2,3] depending on which has stronger signal
    if (!gp?.axes || gp.axes.length < 2) return [0, 0];

    const a0 = gp.axes[0] ?? 0, a1 = gp.axes[1] ?? 0;
    const a2 = gp.axes[2] ?? 0, a3 = gp.axes[3] ?? 0;

    const mag01 = Math.abs(a0) + Math.abs(a1);
    const mag23 = Math.abs(a2) + Math.abs(a3);

    // If both exist, pick the pair with greater activity (or preferPairIndex)
    if (gp.axes.length >= 4) {
      if (preferPairIndex === 0) return (mag01 >= mag23 ? [a0, a1] : [a2, a3]);
      return (mag23 >= mag01 ? [a2, a3] : [a0, a1]);
    }

    return [a0, a1];
  }

  function yawForward() {
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    fwd.y = 0;
    fwd.normalize();
    return fwd;
  }

  function yawRight(fwd) {
    const r = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    r.multiplyScalar(-1);
    return r;
  }

  // -------------------------
  // UPDATE LOOP
  // -------------------------
  function update(dt) {
    if (!dt || !isFinite(dt)) dt = 0.016;

    const session = getSession();
    const inXR = !!session;

    // Update teleport aiming marker
    if (inXR) {
      for (let i = 0; i < 2; i++) {
        if (!aiming[i]) continue;
        const hit = raycastFloor(i);
        if (hit) {
          lastHit[i] = hit;
          teleportMarker.position.set(hit.x, hit.y + 0.01, hit.z);
          teleportMarker.visible = true;
        } else {
          lastHit[i] = null;
          teleportMarker.visible = false;
        }
      }
    }

    // Smooth locomotion only if gamepad axes exist
    if (inXR) {
      turnCooldown = Math.max(0, turnCooldown - dt);

      const { left, right } = getInputGamepads(session);
      const fwd = yawForward();
      const rgt = yawRight(fwd);

      // LEFT stick move
      if (left) {
        const [sx, sy] = pickStickAxes(left, 0);
        const mx = Math.abs(sx) > dz ? sx : 0;
        const my = Math.abs(sy) > dz ? sy : 0;

        if (mx || my) {
          const move = new THREE.Vector3();
          move.addScaledVector(rgt, mx);
          move.addScaledVector(fwd, -my);
          move.normalize().multiplyScalar(MOVE_SPEED * dt);
          playerRig.position.add(move);
        }
      }

      // RIGHT stick snap turn
      if (right && turnCooldown <= 0) {
        // prefer second pair if exists
        const [rx] = pickStickAxes(right, 1);
        if (rx > 0.7) {
          playerRig.rotation.y -= THREE.MathUtils.degToRad(SNAP_DEG);
          turnCooldown = 0.25;
        } else if (rx < -0.7) {
          playerRig.rotation.y += THREE.MathUtils.degToRad(SNAP_DEG);
          turnCooldown = 0.25;
        }
      }
    }
  }

  // -------------------------
  // RESET SPAWN API
  // -------------------------
  function resetSpawn() {
    const sp = window.__SCARLETT_SPAWN__;
    if (sp?.position) {
      playerRig.position.set(sp.position.x, 0, sp.position.z);
      playerRig.rotation.set(0, 0, 0);
      log('[spine] reset spawn -> spawn pad ✅');
      return;
    }
    playerRig.position.set(0, 0, 12);
    playerRig.rotation.set(0, 0, 0);
    log('[spine] reset spawn -> fallback');
  }
  window.__SCARLETT_RESET_SPAWN__ = resetSpawn;

  log('[spine] ready ✅ (teleport via pinch/trigger/select)');

  return { updates: [update], interactables: [] };
  }
