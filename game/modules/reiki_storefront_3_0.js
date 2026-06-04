import * as THREE from "three";

const BUILD = "PHASE-100-UPDATE-3.0-REIKI-ALIGN-PLANTS-MOON-MARS-LOCK";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTextTexture(lines, { width = 1024, height = 512, bg = "rgba(8,10,14,0.92)", border = "rgba(145,255,240,0.92)", title = "#ffffff", accent = "#ff3148" } = {}) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  x.clearRect(0, 0, width, height);
  const g = x.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, bg);
  g.addColorStop(1, "rgba(20,2,12,0.88)");
  x.fillStyle = g;
  x.fillRect(0, 0, width, height);
  x.strokeStyle = border;
  x.lineWidth = 8;
  x.strokeRect(18, 18, width - 36, height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  lines.forEach((line, idx) => {
    const y = 82 + idx * 70;
    x.fillStyle = line.color || (idx === 0 ? title : (line.accent ? accent : "#c9fff5"));
    x.font = line.font || (idx === 0 ? "bold 50px system-ui, Arial" : "bold 32px system-ui, Arial");
    x.fillText(line.text, width / 2, y, width - 70);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function planetTexture(kind) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const moon = kind === "moon";
  x.fillStyle = moon ? "#d8d0bf" : "#a94b2d";
  x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < (moon ? 90 : 70); i++) {
    const px = Math.random() * c.width, py = Math.random() * c.height;
    const r = moon ? 8 + Math.random() * 36 : 10 + Math.random() * 55;
    x.beginPath();
    x.fillStyle = moon ? `rgba(${95 + Math.random() * 70},${90 + Math.random() * 65},${82 + Math.random() * 60},${0.18 + Math.random() * 0.24})` : `rgba(${80 + Math.random() * 60},${24 + Math.random() * 32},${15 + Math.random() * 24},${0.18 + Math.random() * 0.28})`;
    x.ellipse(px, py, r, r * (0.55 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addBox(root, name, size, pos, mat, { rot = null, renderOrder = 0 } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = renderOrder;
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, mat, { rot = null, renderOrder = 0 } = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = renderOrder;
  root.add(mesh);
  return mesh;
}

function addGlowLine(root, name, size, pos, color = 0x8ffff0) {
  return addBox(root, name, size, pos, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }));
}

function addSilverPole(root, x, z, label = "") {
  const silver = new THREE.MeshStandardMaterial({ color: 0xd7d7d7, roughness: 0.22, metalness: 0.88, emissive: 0x101014, emissiveIntensity: 0.10 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf1f1f1, roughness: 0.16, metalness: 0.96, emissive: 0x1c1c22, emissiveIntensity: 0.12 });
  const pole = new THREE.Group();
  pole.name = `SVR_UPDATE3_SILVER_REIKI_POLE_${label}`;
  pole.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.10, 22), silver);
  stem.position.y = 0.58;
  pole.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.065, 32), capMat);
  base.position.y = 0.035;
  pole.add(base);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 12), capMat);
  cap.position.y = 1.16;
  pole.add(cap);
  root.add(pole);
  return pole;
}

function addRopeBetween(root, a, b, label = "") {
  const redRopeMat = new THREE.MeshStandardMaterial({ color: 0xb5001f, roughness: 0.36, metalness: 0.05, emissive: 0x52000e, emissiveIntensity: 0.36 });
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const geo = new THREE.CylinderGeometry(0.045, 0.045, len, 18);
  geo.rotateZ(Math.PI * 0.5);
  const rope = new THREE.Mesh(geo, redRopeMat);
  rope.name = `SVR_UPDATE3_RED_ROPE_${label}`;
  rope.position.set((a.x + b.x) / 2, 1.07, (a.z + b.z) / 2);
  rope.rotation.y = Math.atan2(dz, dx);
  root.add(rope);
  return rope;
}

function addPlanter(root, x, z, scale = 1, label = "") {
  const g = new THREE.Group();
  g.name = `SVR_UPDATE3_REIKI_BEAUTY_PLANT_${label}`;
  g.position.set(x, 0, z);
  const potMat = new THREE.MeshStandardMaterial({ color: 0x4a1718, roughness: 0.82, metalness: 0.04, emissive: 0x130304, emissiveIntensity: 0.08 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x17100b, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d743b, roughness: 0.65, metalness: 0.02, emissive: 0x062714, emissiveIntensity: 0.16, side: THREE.DoubleSide });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.20 * scale, 0.26 * scale, 0.36 * scale, 28), potMat);
  pot.position.y = 0.18 * scale;
  g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.205 * scale, 0.205 * scale, 0.025 * scale, 28), soilMat);
  soil.position.y = 0.37 * scale;
  g.add(soil);
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.105 * scale, 14, 8), leafMat);
    leaf.scale.set(0.55, 1.95, 0.15);
    const a = (i / 8) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.12 * scale, 0.62 * scale + (i % 3) * 0.06 * scale, Math.sin(a) * 0.12 * scale);
    leaf.rotation.set(0.55 + (i % 2) * 0.22, a, (i % 2 ? 0.35 : -0.35));
    g.add(leaf);
  }
  root.add(g);
  return g;
}

function addPositionPanel(scene) {
  if (document.getElementById("svr-position-panel")) return null;
  const el = document.createElement("div");
  el.id = "svr-position-panel";
  el.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:250px;background:rgba(0,0,0,.72);border:1px solid rgba(140,255,242,.65);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(el);
  const panel = { tick() {
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    el.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nReiki aligned glass / plants / high Moon+Mars`;
  }};
  scene.userData._svrPositionPanel3 = panel;
  return panel;
}

function makeSiteVideoPanel(scene) {
  const fallback = makeTextTexture([
    { text: "REIKI VIDEO HOLOGRAM", font: "bold 50px system-ui, Arial" },
    { text: "tap once to unlock audio", font: "bold 34px system-ui, Arial" },
    { text: "site MP4 linked", font: "bold 28px system-ui, Arial", color: "#bafff2" }
  ], { width: 820, height: 1120 });
  const mat = new THREE.MeshBasicMaterial({ map: fallback, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 2.06), mat);
  mesh.name = "SVR_UPDATE3_SITE_REIKI_MP4_HOLOGRAM_PANEL_AUDIO";
  mesh.renderOrder = 160;

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.style.display = "none";
  video.volume = 0.50;
  document.body.appendChild(video);

  const sources = [
    "../site/assets/video/reiki_hologram.mp4",
    "/site/assets/video/reiki_hologram.mp4",
    "https://svrpoker.com/site/assets/video/reiki_hologram.mp4",
    "./assets/video/reiki_hologram.mp4",
    "./assets/video/reiki-hologram.mp4",
    "./assets/video/hologram.mp4"
  ];
  let i = 0;
  let loaded = false;
  let audioUnlocked = false;
  const next = () => {
    if (i >= sources.length) { mesh.userData.videoMissing = true; return; }
    video.src = sources[i++];
    video.load();
  };
  const unlockAudio = () => { audioUnlocked = true; video.muted = false; video.play().catch(() => {}); };
  video.addEventListener("loadeddata", () => { loaded = true; video.play().catch(() => {}); });
  video.addEventListener("error", next);
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);
  next();

  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const meshWorld = new THREE.Vector3();
  const camWorld = new THREE.Vector3();
  mesh.userData.tick = () => {
    if (loaded && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    const cam = scene?.userData?._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    else if (cam?.position) camWorld.copy(cam.position);
    mesh.getWorldPosition(meshWorld);
    const dist = camWorld.distanceTo(meshWorld);
    const near = 1.35;
    const entrance = 6.75;
    let volume = dist <= entrance ? 0.50 + ((entrance - dist) / (entrance - near)) * 0.45 : Math.max(0.12, 0.50 - (dist - entrance) * 0.10);
    video.volume = clamp(volume, 0.12, 0.95);
    if (audioUnlocked && video.muted) video.muted = false;
  };
  return mesh;
}

function addSiteVideoHologram(root, scene) {
  const group = new THREE.Group();
  group.name = "SVR_UPDATE3_REIKI_SITE_MP4_HOLOGRAM_STAGE_PREMIUM";
  group.position.set(0, 0.02, 0.18);
  root.add(group);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 1.05, 0.16, 64), new THREE.MeshStandardMaterial({ color: 0x061315, metalness: 0.84, roughness: 0.22, emissive: 0x0b8178, emissiveIntensity: 0.48 }));
  base.position.set(0, 0.62, 0.02);
  group.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.74, 2.72, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0.105, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(0, 1.70, 0.04);
  group.add(beam);
  const vid = makeSiteVideoPanel(scene);
  vid.position.set(0, 1.90, 0.11);
  group.add(vid);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.46), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  glass.position.set(0, 1.90, 0.145);
  group.add(glass);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.018, 10, 96), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }));
  ringA.position.set(0, 1.92, 0.16);
  group.add(ringA);
  const light = new THREE.PointLight(0x8ffff0, 1.18, 7.4, 2.1);
  light.position.set(0, 1.18, 0.54);
  group.add(light);
  group.userData.tick = (t) => {
    vid.userData.tick?.(t);
    const p = 0.5 + 0.5 * Math.sin(t * 0.003);
    beam.material.opacity = 0.065 + p * 0.080;
    glass.material.opacity = 0.11 + p * 0.10;
    ringA.rotation.z += 0.004;
    light.intensity = 0.78 + p * 0.58;
  };
  return group;
}

function addHighMoonMarsLock(scene) {
  if (scene.getObjectByName("SVR_UPDATE3_HIGH_MOON_MARS_LOCK")) return null;
  const g = new THREE.Group();
  g.name = "SVR_UPDATE3_HIGH_MOON_MARS_LOCK";
  scene.add(g);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.95, 56, 28), new THREE.MeshBasicMaterial({ map: planetTexture("moon") }));
  moon.name = "SVR_UPDATE3_HIGH_REAL_MOON";
  moon.position.set(-20, 42, -58);
  g.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.62, 48, 24), new THREE.MeshBasicMaterial({ map: planetTexture("mars") }));
  mars.name = "SVR_UPDATE3_HIGH_MARS";
  mars.position.set(24, 36, -68);
  g.add(mars);
  const moonGlow = new THREE.PointLight(0xd9d2c2, 0.45, 120, 2.2);
  moonGlow.position.copy(moon.position);
  g.add(moonGlow);
  g.userData.tick = (dt = 0.016) => { moon.rotation.y += 0.12 * dt; mars.rotation.y += 0.18 * dt; };
  return g;
}

export function enhanceReikiStorefront3(scene, { roomRadius = 24, wallHeight = 16, log = console.log } = {}) {
  if (!scene || scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK) return null;
  scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK = true;

  const R = roomRadius;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.012, Math.sin(angle) * (R - 4.05));
  const root = new THREE.Group();
  root.name = "SVR_UPDATE3_REIKI_ALIGNED_GLASS_PLANTS_PLANETS_LOCK";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 0.30, metalness: 0.38, emissive: 0x10242b, emissiveIntensity: 0.22 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.20, metalness: 0.82, emissive: 0x1b2d30, emissiveIntensity: 0.30 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9dfff6, transparent: true, opacity: 0.17, roughness: 0.02, metalness: 0.15, emissive: 0x1b7d78, emissiveIntensity: 0.34, side: THREE.DoubleSide, depthWrite: false });
  const redCarpetMat = new THREE.MeshStandardMaterial({ color: 0xa5001f, roughness: 0.84, metalness: 0.02, emissive: 0x340008, emissiveIntensity: 0.28, side: THREE.DoubleSide });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x06090d, roughness: 0.70, metalness: 0.14, emissive: 0x061318, emissiveIntensity: 0.20 });

  // Full framed wall shell. The glass is now tied into the storefront wall and the red-carpet entrance line.
  addBox(root, "SVR_UPDATE3_REIKI_BACK_WALL_FLUSH_ALIGNED", [17.3, 6.90, 0.22], [0, 3.38, -2.58], wallMat);
  addBox(root, "SVR_UPDATE3_REIKI_LEFT_WALL_RETURN_FLUSH", [0.20, 6.00, 3.80], [-8.55, 3.00, -0.76], frameMat);
  addBox(root, "SVR_UPDATE3_REIKI_RIGHT_WALL_RETURN_FLUSH", [0.20, 6.00, 3.80], [8.55, 3.00, -0.76], frameMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_FRONT_HEADER_FLUSH", [17.3, 0.18, 0.30], [0, 5.98, 1.02], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_BACK_HEADER_FLUSH", [17.3, 0.18, 0.30], [0, 5.98, -2.70], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_LEFT_FRONT_COLUMN_FLUSH", [0.18, 5.90, 0.34], [-8.55, 2.96, 1.02], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_RIGHT_FRONT_COLUMN_FLUSH", [0.18, 5.90, 0.34], [8.55, 2.96, 1.02], trimMat);

  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_LEFT_FLUSH", [4.95, 4.56], [-5.52, 2.72, 1.025], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_RIGHT_FLUSH", [4.95, 4.56], [5.52, 2.72, 1.025], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_REAR_GLASS_WALL_FLUSH", [13.4, 5.08], [0, 2.86, -2.445], glassMat.clone(), { renderOrder: 34 });
  addPlane(root, "SVR_UPDATE3_REIKI_LEFT_SIDE_GLASS_CONNECTED", [3.82, 4.60], [-8.46, 2.70, -0.82], glassMat, { rot: [0, Math.PI * 0.5, 0], renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_RIGHT_SIDE_GLASS_CONNECTED", [3.82, 4.60], [8.46, 2.70, -0.82], glassMat, { rot: [0, -Math.PI * 0.5, 0], renderOrder: 35 });

  // Entry wings now start at the beginning of the carpet and connect visually into the storefront frame.
  addPlane(root, "SVR_UPDATE3_REIKI_ENTRANCE_GLASS_LEFT_CONNECTED", [6.95, 2.70], [-2.92, 1.74, 4.10], glassMat.clone(), { rot: [0, Math.PI * 0.5, 0], renderOrder: 36 });
  addPlane(root, "SVR_UPDATE3_REIKI_ENTRANCE_GLASS_RIGHT_CONNECTED", [6.95, 2.70], [2.92, 1.74, 4.10], glassMat.clone(), { rot: [0, -Math.PI * 0.5, 0], renderOrder: 36 });
  addGlowLine(root, "SVR_UPDATE3_REIKI_LEFT_GLASS_TOP_CONNECTED", [0.04, 0.045, 6.95], [-2.94, 3.10, 4.10]);
  addGlowLine(root, "SVR_UPDATE3_REIKI_RIGHT_GLASS_TOP_CONNECTED", [0.04, 0.045, 6.95], [2.94, 3.10, 4.10]);
  addGlowLine(root, "SVR_UPDATE3_REIKI_LEFT_GLASS_BOTTOM_CONNECTED", [0.04, 0.035, 6.95], [-2.94, 0.36, 4.10]);
  addGlowLine(root, "SVR_UPDATE3_REIKI_RIGHT_GLASS_BOTTOM_CONNECTED", [0.04, 0.035, 6.95], [2.94, 0.36, 4.10]);

  addPlane(root, "SVR_UPDATE3_REIKI_RED_CARPET_MAIN_ALIGNED", [5.55, 9.16], [0, 0.018, 1.90], redCarpetMat, { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 12 });
  addPlane(root, "SVR_UPDATE3_REIKI_RED_CARPET_ENTRY_ALIGNED", [4.10, 5.90], [0, 0.022, 5.92], redCarpetMat.clone(), { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 13 });
  addGlowLine(root, "SVR_UPDATE3_REIKI_CARPET_LEFT_CYAN_EDGE", [0.035, 0.035, 11.0], [-2.72, 0.070, 3.52]);
  addGlowLine(root, "SVR_UPDATE3_REIKI_CARPET_RIGHT_CYAN_EDGE", [0.035, 0.035, 11.0], [2.72, 0.070, 3.52]);

  const poleZ = [1.05, 2.16, 3.27, 4.38, 5.49, 6.60];
  const poleX = 2.62;
  const leftPoles = poleZ.map((z, idx) => addSilverPole(root, -poleX, z, `L${idx + 1}`).position);
  const rightPoles = poleZ.map((z, idx) => addSilverPole(root, poleX, z, `R${idx + 1}`).position);
  for (let i = 0; i < poleZ.length - 1; i++) {
    addRopeBetween(root, leftPoles[i], leftPoles[i + 1], `LEFT_${i + 1}`);
    addRopeBetween(root, rightPoles[i], rightPoles[i + 1], `RIGHT_${i + 1}`);
  }

  // Beautification: symmetrical plants outside rails and at storefront corners, kept clear of walkway.
  [[-3.65, 0.70, 0.95, "frontL"], [3.65, 0.70, 0.95, "frontR"], [-3.55, 2.70, 0.82, "midL"], [3.55, 2.70, 0.82, "midR"], [-3.55, 5.95, 0.78, "entryL"], [3.55, 5.95, 0.78, "entryR"], [-7.55, 1.04, 0.92, "wallL"], [7.55, 1.04, 0.92, "wallR"]].forEach(([x, z, s, label]) => addPlanter(root, x, z, s, label));

  const entranceTex = makeTextTexture([
    { text: "REIKI / RIKI STOREFRONT", font: "bold 48px system-ui, Arial" },
    { text: "PREMIUM GLASS ENTRY", font: "bold 30px system-ui, Arial" },
    { text: "SILVER POLES • RED ROPE • PLANTS", font: "bold 26px system-ui, Arial", color: "#ffced5" },
    { text: "AWAITING APPROVAL", font: "bold 32px system-ui, Arial", accent: true }
  ], { width: 1100, height: 370 });
  addPlane(root, "SVR_UPDATE3_REIKI_ALIGNMENT_SIGN_HIGH_CLEAN", [4.38, 1.34], [0, 5.18, 1.08], new THREE.MeshBasicMaterial({ map: entranceTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), { renderOrder: 48 });

  const videoStage = addSiteVideoHologram(root, scene);
  const posPanel = addPositionPanel(scene);
  const planetLock = addHighMoonMarsLock(scene);

  const lampMat = new THREE.MeshBasicMaterial({ color: 0x88fff2, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false });
  [-8.36, 8.36, -2.92, 2.92].forEach((x, idx) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(idx < 2 ? 0.12 : 0.085, 16, 10), lampMat);
    lamp.position.set(x, idx < 2 ? 5.78 : 3.08, idx < 2 ? 1.02 : 7.05);
    root.add(lamp);
    const light = new THREE.PointLight(0x88fff2, idx < 2 ? 0.58 : 0.38, idx < 2 ? 5.5 : 3.8, 2.0);
    light.position.copy(lamp.position);
    root.add(light);
  });

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    videoStage?.userData?.tick?.(t);
    posPanel?.tick?.(t);
    planetLock?.userData?.tick?.(1 / 60);
  };

  log?.("Update 3.0 Reiki: aligned connected glass/wall, inward rails, beautification plants, and high Moon/Mars lock applied.");
  return root;
}
