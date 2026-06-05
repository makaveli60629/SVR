import * as THREE from "three";

const BUILD = "PHASE-117-UNDERGROUND-GARAGE-POKER-ROOM-LOCK";

function makeText(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1100;
  c.height = opts.h || 480;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(4,8,10,.96)");
  g.addColorStop(.55, opts.bg1 || "rgba(12,13,16,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,25,24,.92)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(140,255,242,.82)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(140,255,242,.55)";
  x.shadowBlur = 18;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 58px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 112, c.width - 90);
  x.shadowBlur = 8;
  x.fillStyle = opts.lineColor || "#cafff8";
  x.font = opts.lineFont || "800 30px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 205) + i * (opts.gap || 46), c.width - 100));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, mat, rot = [0, 0, 0], order = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = order;
  root.add(mesh);
  return mesh;
}

function makeParkingTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#24282c";
  x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const v = 25 + Math.random() * 70 | 0;
    x.fillStyle = `rgba(${v},${v},${v},${.035 + Math.random() * .12})`;
    x.fillRect(Math.random() * c.width, Math.random() * c.height, 1 + Math.random() * 4, 1 + Math.random() * 4);
  }
  x.strokeStyle = "rgba(255,255,255,.42)";
  x.lineWidth = 8;
  for (let y = 120; y < c.height; y += 230) {
    x.beginPath();
    x.moveTo(80, y);
    x.lineTo(944, y);
    x.stroke();
  }
  x.strokeStyle = "rgba(255,220,80,.42)";
  x.lineWidth = 6;
  x.beginPath(); x.moveTo(512, 0); x.lineTo(512, 1024); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.anisotropy = 8;
  return t;
}

function garageMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ map: makeParkingTexture(), color: 0xffffff, roughness: .92, metalness: .02 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x2b3034, roughness: .88, metalness: .03, emissive: 0x030405, emissiveIntensity: .05 }),
    pillar: new THREE.MeshStandardMaterial({ color: 0x5b6064, roughness: .82, metalness: .04 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x06080b, roughness: .66, metalness: .14, emissive: 0x020506, emissiveIntensity: .08 }),
    neon: new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .66, depthWrite: false, blending: THREE.AdditiveBlending }),
    red: new THREE.MeshBasicMaterial({ color: 0xff3158, transparent: true, opacity: .62, depthWrite: false, blending: THREE.AdditiveBlending }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffd35a, roughness: .36, metalness: .28, emissive: 0x4b2900, emissiveIntensity: .15 })
  };
}

function addParkingGarage(root, scene) {
  const mat = garageMaterials();
  addBox(root, "SVR_PHASE117_GARAGE_FLOOR", [48, .16, 54], [0, -.08, 0], mat.floor);
  addBox(root, "SVR_PHASE117_GARAGE_CEILING", [48, .26, 54], [0, 6.0, 0], mat.wall);
  addBox(root, "SVR_PHASE117_BACK_WALL", [48, 6, .34], [0, 3, -27], mat.wall);
  addBox(root, "SVR_PHASE117_FRONT_WALL_LOW", [48, 3.4, .30], [0, 1.7, 27], mat.wall);
  addBox(root, "SVR_PHASE117_LEFT_WALL", [.34, 6, 54], [-24, 3, 0], mat.wall);
  addBox(root, "SVR_PHASE117_RIGHT_WALL", [.34, 6, 54], [24, 3, 0], mat.wall);

  const pillarSpots = [[-16,-16],[-8,-16],[8,-16],[16,-16],[-16,0],[-8,0],[8,0],[16,0],[-16,16],[-8,16],[8,16],[16,16]];
  pillarSpots.forEach(([x,z], i) => {
    addBox(root, `SVR_PHASE117_CONCRETE_PILLAR_${i}`, [1.15, 6.05, 1.15], [x, 3, z], mat.pillar);
    addBox(root, `SVR_PHASE117_PILLAR_YELLOW_BAND_${i}`, [1.22, .34, 1.22], [x, 1.15, z], mat.gold);
    addBox(root, `SVR_PHASE117_PILLAR_BLACK_CAP_${i}`, [1.24, .18, 1.24], [x, 1.34, z], mat.dark);
  });

  for (let z = -22; z <= 22; z += 7.5) {
    addBox(root, `SVR_PHASE117_CEILING_LIGHT_BAR_${z}`, [19.5, .08, .12], [-11.6, 5.82, z], mat.neon);
    addBox(root, `SVR_PHASE117_CEILING_LIGHT_BAR_R_${z}`, [19.5, .08, .12], [11.6, 5.82, z], mat.neon.clone());
    const light = new THREE.PointLight(0x8ffff0, .28, 13, 2.3);
    light.name = `SVR_PHASE117_FLICKER_LIGHT_${z}`;
    light.position.set(0, 5.15, z);
    root.add(light);
  }

  // Pipes / industrial ceiling detail inspired by the uploaded Underground Garage OBJ material set.
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x161b20, roughness: .48, metalness: .36 });
  for (let x = -18; x <= 18; x += 9) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 50, 16), pipeMat);
    pipe.name = `SVR_PHASE117_CEILING_PIPE_${x}`;
    pipe.position.set(x, 5.72, 0);
    pipe.rotation.x = Math.PI * .5;
    root.add(pipe);
  }

  addPlane(root, "SVR_PHASE117_GARAGE_TITLE", [8.4, 1.65], [0, 4.05, -26.78], new THREE.MeshBasicMaterial({ map: makeText("UNDERGROUND POKER", ["private garage room", "Scorpion-style side room"], { w: 1400, h: 360, titleFont: "900 62px system-ui,Arial", lineFont: "800 29px system-ui,Arial", titleY: 98, startY: 190, gap: 44 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 220);
  return mat;
}

function addPokerTable(root, mat) {
  const table = new THREE.Group();
  table.name = "SVR_PHASE117_UNDERGROUND_POKER_TABLE";
  table.position.set(0, .05, 0);
  root.add(table);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, .22, 72), new THREE.MeshStandardMaterial({ color: 0x062b24, roughness: .70, metalness: .02, emissive: 0x01261f, emissiveIntensity: .16 }));
  felt.scale.z = .62;
  felt.position.y = .78;
  table.add(felt);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.30, .13, 16, 96), mat.gold);
  rim.position.y = .92;
  rim.scale.z = .62;
  table.add(rim);
  addPlane(table, "SVR_PHASE117_TABLE_LOGO", [2.10, .82], [0, 1.0, 0], new THREE.MeshBasicMaterial({ map: makeText("SVR", ["Garage Table"], { w: 900, h: 380, titleFont: "900 90px system-ui,Arial", lineFont: "800 32px system-ui,Arial", titleY: 135, startY: 240 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [-Math.PI / 2, 0, 0], 180);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const chair = addBox(table, `SVR_PHASE117_CHAIR_${i}`, [1.0, .30, .92], [Math.cos(a) * 4.65, .48, Math.sin(a) * 2.95], mat.dark);
    chair.rotation.y = -a;
  }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, .18, 32), mat.gold);
  pot.name = "SVR_PHASE117_CHIP_POT_PLACEHOLDER";
  pot.position.set(0, 1.02, .15);
  table.add(pot);
}

function addPortal(root, title, sub, href, pos, ry = 0) {
  const group = new THREE.Group();
  group.name = `SVR_PHASE117_PORTAL_${title.replace(/\W+/g, "_").toUpperCase()}`;
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.y = ry;
  root.add(group);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 3.10), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  back.position.set(0, 1.72, 0);
  group.add(back);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.92, .028, 12, 96), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .72, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.position.set(0, 1.55, .05);
  group.add(ring);
  addPlane(group, "SVR_PHASE117_PORTAL_SIGN", [2.85, .82], [0, 3.42, .08], new THREE.MeshBasicMaterial({ map: makeText(title, [sub], { w: 900, h: 300, titleFont: "900 44px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 80, startY: 162 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  const light = new THREE.PointLight(0x8ffff0, .55, 6, 2.1);
  light.position.set(0, 1.8, .5);
  group.add(light);
  group.userData.activate = () => { window.location.href = href; };
  group.userData.tick = (t) => { ring.rotation.z = t * .00075; light.intensity = .45 + Math.sin(t * .002) * .16; };
  return group;
}

function addHud(camera) {
  const hud = document.createElement("div");
  hud.id = "underground-status";
  hud.style.cssText = "position:fixed;left:12px;top:12px;z-index:20;background:rgba(0,0,0,.72);border:1px solid rgba(140,255,242,.62);color:#dffffb;border-radius:12px;padding:10px 12px;font:12px/1.35 ui-monospace,monospace;white-space:pre;pointer-events:none";
  document.body.appendChild(hud);
  return { tick() { const p = camera.position; hud.textContent = `${BUILD}\nWASD move • mouse drag/look\nX ${p.x.toFixed(2)} Y ${p.y.toFixed(2)} Z ${p.z.toFixed(2)}`; } };
}

function installDesktopControls(camera, dom) {
  const keys = new Set();
  let yaw = 0, pitch = 0, dragging = false, lx = 0, ly = 0;
  dom.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; dom.focus?.(); });
  window.addEventListener("pointerup", () => { dragging = false; });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    yaw -= dx * .004;
    pitch = clamp(pitch - dy * .004, -1.1, 1.1);
  });
  document.addEventListener("keydown", e => keys.add(e.code));
  document.addEventListener("keyup", e => keys.delete(e.code));
  const f = new THREE.Vector3(), r = new THREE.Vector3(), up = new THREE.Vector3(0,1,0);
  return { update(dt) {
    if (keys.has("ArrowLeft") || keys.has("KeyQ")) yaw += dt * 1.4;
    if (keys.has("ArrowRight") || keys.has("KeyE")) yaw -= dt * 1.4;
    camera.rotation.order = "YXZ"; camera.rotation.y = yaw; camera.rotation.x = pitch;
    f.set(0,0,-1).applyAxisAngle(up, yaw).normalize(); r.copy(f).cross(up).normalize();
    const speed = keys.has("ShiftLeft") ? 5.8 : 3.2;
    if (keys.has("KeyW") || keys.has("ArrowUp")) camera.position.addScaledVector(f, speed * dt);
    if (keys.has("KeyS") || keys.has("ArrowDown")) camera.position.addScaledVector(f, -speed * dt);
    if (keys.has("KeyA")) camera.position.addScaledVector(r, -speed * dt);
    if (keys.has("KeyD")) camera.position.addScaledVector(r, speed * dt);
    camera.position.y = 1.6;
  }};
}

export function buildUndergroundGarageScene({ scene, camera, renderer, log = console.log }) {
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.Fog(0x05070a, 24, 78);
  const root = new THREE.Group();
  root.name = "SVR_PHASE117_UNDERGROUND_GARAGE_ROOT";
  scene.add(root);
  const materials = addParkingGarage(root, scene);
  addPokerTable(root, materials);
  const lobbyPortal = addPortal(root, "LOBBY RETURN", "back to main lobby", "./index.html?v=phase117-return", [-8.5, 0, 24.6], Math.PI);
  const scorpionPortal = addPortal(root, "SCORPION ROOM", "private poker room", "./scorpion.html?v=phase117", [8.5, 0, 24.6], Math.PI);
  const garagePortal = addPortal(root, "GARAGE TABLE", "private underground poker", "#", [0, 0, -23.8], 0);

  const ambient = new THREE.HemisphereLight(0x8ffff0, 0x050608, .36);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xa7fff5, .44);
  key.position.set(-8, 12, 10);
  scene.add(key);
  camera.position.set(0, 1.6, 15.5);
  camera.lookAt(0, 1.2, 0);
  const hud = addHud(camera);
  const controls = installDesktopControls(camera, renderer.domElement);
  const portals = [lobbyPortal, scorpionPortal, garagePortal];

  const raycaster = new THREE.Raycaster();
  const point = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    point.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    point.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(point, camera);
    for (const hit of raycaster.intersectObjects(scene.children, true)) {
      let o = hit.object;
      while (o) { if (o.userData?.activate) { o.userData.activate(); return; } o = o.parent; }
    }
  }, { passive: true });

  const tick = (dt) => {
    controls.update(dt);
    hud.tick();
    const t = performance.now();
    portals.forEach(p => p.userData.tick?.(t));
  };
  window.SVR_PHASE117_UNDERGROUND_GARAGE = { build: BUILD, note: "Procedural optimized garage based on uploaded Underground Garage OBJ/MTL reference. Full OBJ is large and should be optimized before direct runtime use." };
  log?.("Phase 117 underground garage room active", window.SVR_PHASE117_UNDERGROUND_GARAGE);
  return { root, tick };
}
