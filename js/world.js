import * as THREE from 'three';
import { initVideoFeed } from './modules/videoFeed.js';
import { initStoreDisplay } from './modules/storeDisplay.js';

export function createWorld(scene) {
  // Atmosphere
  scene.fog = new THREE.FogExp2(0x000000, 0.085);

  // === SEALED LOBBY (walls + ceiling) ===
  const room = new THREE.Group();
  room.name = "LOBBY_ROOM";
  scene.add(room);

  // Big interior box (inward-facing)
  const roomMat = new THREE.MeshStandardMaterial({
    color: 0x050505, roughness: 0.35, metalness: 0.35,
    emissive: 0x000600, emissiveIntensity: 0.7,
    side: THREE.BackSide
  });
  const roomBox = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 120), roomMat);
  roomBox.position.set(0, 16, 0);
  room.add(roomBox);

  // Floor (high ground ring) + pit
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const high = new THREE.Mesh(
    new THREE.RingGeometry(4.5, 34, 96),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.15, metalness: 0.85, emissive: 0x001000, emissiveIntensity: 0.6 })
  );
  high.rotation.x = -Math.PI/2;
  high.position.y = 1.6;
  worldGroup.add(high);

  const pit = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 96),
    new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.9, emissive: 0x000800, emissiveIntensity: 0.55 })
  );
  pit.rotation.x = -Math.PI/2;
  pit.position.y = 0.0;
  worldGroup.add(pit);

  // Neon rim lip
  // === AVATAR PEDESTALS (selection stations) ===
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x101010, emissive: 0x00ff00, emissiveIntensity: 0.25, roughness: 0.6 });
  const pedTopMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  for (let i=0;i<6;i++){
    const a = (i/6) * Math.PI * 2;
    const px = Math.cos(a) * 7.0;
    const pz = Math.sin(a) * 7.0;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.25, 28), pedMat);
    ped.position.set(px, 1.6 + 0.13, pz);
    scene.add(ped);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), pedTopMat);
    top.rotation.x = -Math.PI/2;
    top.position.set(px, 1.6 + 0.26, pz);
    scene.add(top);
  }

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 3.5, roughness: 0.2, metalness: 0.3
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.05, 18, 180), rimMat);
  rim.rotation.x = Math.PI/2;
  rim.position.y = 1.62;
  worldGroup.add(rim);

  // Steps/ramp into pit (simple wedge)
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.6, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x040404, emissive: 0x000600, emissiveIntensity: 0.5, roughness: 0.6 })
  );
  ramp.position.set(0, 0.8, 4.5);
  ramp.rotation.y = Math.PI;
  worldGroup.add(ramp);

  // Center poker table
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.32, 48),
    new THREE.MeshStandardMaterial({ color: 0x004400, roughness: 0.85, emissive: 0x001100, emissiveIntensity: 0.9 })
  );
  table.position.set(0, 0.95, 0);
  worldGroup.add(table);
  scene.userData.table = table;

  // Decorative pillars around the space
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.25, metalness: 0.6, emissive: 0x000400, emissiveIntensity: 0.5 });
  for (let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    const x = Math.cos(a)*22;
    const z = Math.sin(a)*22;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,14,18), pillarMat);
    p.position.set(x, 7, z);
    worldGroup.add(p);

    // pillar neon strip
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 10, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    strip.position.set(x, 7, z);
    worldGroup.add(strip);
  }

  // === LOTS OF LIGHTS (safe + pretty) ===
  // Soft ambient base so nothing goes black
  scene.add(new THREE.AmbientLight(0x203040, 0.8));

  // Big "god ray" spotlight over table
  const god = new THREE.SpotLight(0x00ff88, 35, 40, Math.PI/5, 0.35, 1.0);
  god.position.set(0, 18, 0);
  god.target = table;
  scene.add(god);
  scene.add(god.target);

  // Ceiling ring of point lights
  const lightGroup = new THREE.Group();
  scene.add(lightGroup);
  const ringR = 18;
  for (let i=0;i<16;i++){
    const a = (i/16)*Math.PI*2;
    const x = Math.cos(a)*ringR;
    const z = Math.sin(a)*ringR;
    const l = new THREE.PointLight(0x00ff66, 2.2, 35, 2.0);
    l.position.set(x, 14, z);
    lightGroup.add(l);

    // visible bulbs (emissive)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    bulb.position.copy(l.position);
    lightGroup.add(bulb);
  }

  // Wall wash lights (blue/purple for depth)
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const x = Math.cos(a)*45;
    const z = Math.sin(a)*45;
    const c = (i%2===0) ? 0x2233ff : 0x6622ff;
    const w = new THREE.PointLight(c, 3.0, 60, 2.0);
    w.position.set(x, 10, z);
    scene.add(w);
  }

  // === JUMBOTRONS + LIVE FEED ===
  function createJumbotron(x, z, ry, id, mode='live') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 5.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.2, metalness: 0.8, emissive: 0x001000, emissiveIntensity: 0.8 })
    );
    frame.position.set(x, 6.2, z);
    frame.rotation.y = ry;
    scene.add(frame);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00ff00, emissiveIntensity: 0.3, side: THREE.DoubleSide })
    );
    screen.position.set(x, 6.2, z + Math.cos(ry)*0.11);
    screen.rotation.y = ry;
    scene.add(screen);

    if (mode === 'store') initStoreDisplay(screen);
    else initVideoFeed(screen, id);

    return screen;
  }

  createJumbotron(0, -16, 0, "main", "live");
  createJumbotron(16, 0, -Math.PI/2, "side", "live");
  createJumbotron(-16, 0,  Math.PI/2, "store", "store");

  window.updateJumbotron = (title, status) => {
    window.__jumbotronUpdate?.("main", title, status);
    window.__jumbotronUpdate?.("side", title, status);
    window.__jumbotronUpdate?.("side2", title, status);
  };
  window.updateJumbotron("Scarlett Empire", "Lobby Active");

  // === MOVEMENT VISIBILITY (keep) ===
  const beacon = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.03, 12, 64),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  beacon.rotation.x = Math.PI / 2;
  beacon.position.set(0, 0.02, 8);
  scene.add(beacon);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.6, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0.06, 7.2);
  scene.add(arrow);

  // Decorative floor grid for depth (lighter)
  const grid = new THREE.GridHelper(160, 160, 0x00ff00, 0x0a0a0a);
  grid.position.y = 0.01;
  scene.add(grid);
}

export function updateWorld(dt, playerGroup, camera) {
  // reserved for future world animation
}
