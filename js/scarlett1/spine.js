/**
 * SCARLETT1 • SPINE (PERMANENT)
 * Phase1 adds: sealed bright lobby + spawn marker + basic movement with sticks.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = (() => {
  let scene, camera, renderer, clock;
  let rig;
  let hemi, key, fill;
  let lobbyGroup;

  const spawn = { x: 0, y: 1.6, z: 6, yaw: 0 };

  function start({ Diagnostics }) {
    Diagnostics?.log?.('[boot] spine starting…');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 2000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    rig = new THREE.Group();
    rig.position.set(spawn.x, spawn.y, spawn.z);
    rig.rotation.y = spawn.yaw;
    rig.add(camera);
    scene.add(rig);

    // Lighting (bright by default)
    hemi = new THREE.HemisphereLight(0xffffff, 0x223366, 1.35);
    key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 12, 6);
    fill = new THREE.DirectionalLight(0xffffff, 0.65);
    fill.position.set(-7, 5, -4);
    scene.add(hemi, key, fill);

    // Lobby world (sealed room)
    lobbyGroup = buildLobby();
    scene.add(lobbyGroup);

    // Spawn marker
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.05, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a6bff, emissive: 0x0a1b4f, emissiveIntensity: 0.6 })
    );
    marker.position.set(0, 0.03, 0);
    scene.add(marker);

    // Grid (debug)
    const grid = new THREE.GridHelper(40, 40, 0x4466aa, 0x1b2a44);
    grid.position.y = 0.001;
    scene.add(grid);

    // Events
    window.addEventListener('resize', onResize);
    window.addEventListener('scarlett:reset-spawn', () => resetSpawn(Diagnostics));
    window.addEventListener('scarlett:lights', (e) => setLights(!!e.detail?.on, Diagnostics));

    // Music toggle stub (we'll wire streams later)
    window.addEventListener('scarlett:music-toggle', () => {
      Diagnostics?.log?.('[music] stub: streams module will be added next');
    });

    Diagnostics?.log?.('[scene] loaded ✅');
    Diagnostics?.log?.('[lobby] sealed bright room ✅');
    Diagnostics?.log?.('[spawn] ready ✅');
    Diagnostics?.log?.('[controls] sticks movement + turn ✅');

    clock = new THREE.Clock();
    renderer.setAnimationLoop(() => tick(Diagnostics));
  }

  function buildLobby() {
    const g = new THREE.Group();
    g.name = 'SCARLETT1_LOBBY';

    // Materials
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x101522, roughness: 0.9, metalness: 0.05 });
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0x0e1220, roughness: 0.85, metalness: 0.1 });
    const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x0b0f1b, roughness: 0.95, metalness: 0.0 });
    const trimMat  = new THREE.MeshStandardMaterial({ color: 0x16306a, emissive: 0x081a44, emissiveIntensity: 0.35 });

    // Dimensions (in meters)
    const W = 20, D = 26, H = 6;

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    g.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    g.add(ceil);

    // Walls (4)
    const wallGeoW = new THREE.PlaneGeometry(W, H);
    const wallGeoD = new THREE.PlaneGeometry(D, H);

    const north = new THREE.Mesh(wallGeoW, wallMat);
    north.position.set(0, H/2, -D/2);
    g.add(north);

    const south = new THREE.Mesh(wallGeoW, wallMat);
    south.position.set(0, H/2, D/2);
    south.rotation.y = Math.PI;
    g.add(south);

    const west = new THREE.Mesh(wallGeoD, wallMat);
    west.position.set(-W/2, H/2, 0);
    west.rotation.y = Math.PI / 2;
    g.add(west);

    const east = new THREE.Mesh(wallGeoD, wallMat);
    east.position.set(W/2, H/2, 0);
    east.rotation.y = -Math.PI / 2;
    g.add(east);

    // Neon trim ring
    const trim = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), trimMat);
    trim.position.set(0, 1.05, 0);
    trim.scale.set(1.02, 1, 1.02);
    g.add(trim);

    // Door frames (simple markers)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1f2b44, emissive: 0x0b1430, emissiveIntensity: 0.2 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.15), doorMat);
    door.position.set(0, 1.6, -D/2 + 0.08);
    g.add(door);

    return g;
  }

  function setLights(on, Diagnostics) {
    if (!hemi || !key || !fill) return;
    const mul = on ? 1 : 0.15;
    hemi.intensity = 1.35 * mul;
    key.intensity = 1.4 * mul;
    fill.intensity = 0.65 * mul;
    Diagnostics?.log?.(`[lights] ${on ? 'bright' : 'dim'} (${mul.toFixed(2)}x)`);
  }

  function resetSpawn(Diagnostics) {
    rig.position.set(spawn.x, spawn.y, spawn.z);
    rig.rotation.y = spawn.yaw;
    Diagnostics?.log?.('[spawn] reset ✅');
  }

  function tick(Diagnostics) {
    const dt = Math.min(clock.getDelta(), 0.05);
    const inpad = window.__scarlettInput || { moveX: 0, moveZ: 0, yaw: 0 };

    const speed = 2.4;     // m/s
    const turnSpeed = 2.4; // rad/s

    rig.rotation.y -= (inpad.yaw || 0) * turnSpeed * dt;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rig.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rig.quaternion);

    const move = new THREE.Vector3()
      .addScaledVector(right, (inpad.moveX || 0))
      .addScaledVector(forward, (inpad.moveZ || 0));

    if (move.lengthSq() > 0.0001) {
      move.normalize().multiplyScalar(speed * dt);
      rig.position.add(move);
    }

    // lock y
    rig.position.y = spawn.y;

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  return { start };
})();
