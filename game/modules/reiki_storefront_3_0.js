import * as THREE from "three";

const BUILD = "PHASE-100-UPDATE-3.0-REIKI-PREMIUM-AUDIO-RAIL-ALIGN";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTextTexture(lines, {
  width = 1024,
  height = 512,
  bg = "rgba(8,10,14,0.92)",
  border = "rgba(145,255,240,0.92)",
  title = "#ffffff",
  accent = "#ff3148"
} = {}) {
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
    const y = 88 + idx * 74;
    x.fillStyle = line.color || (idx === 0 ? title : (line.accent ? accent : "#c9fff5"));
    x.font = line.font || (idx === 0 ? "bold 52px system-ui, Arial" : "bold 34px system-ui, Arial");
    x.fillText(line.text, width / 2, y, width - 70);
  });
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
  return addBox(root, name, size, pos, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.74, blending: THREE.AdditiveBlending, depthWrite: false }));
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

function addPositionPanel(scene) {
  if (document.getElementById("svr-position-panel")) return null;
  const el = document.createElement("div");
  el.id = "svr-position-panel";
  el.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:250px;background:rgba(0,0,0,.72);border:1px solid rgba(140,255,242,.65);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(el);
  const panel = { tick() {
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    el.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nReiki premium glass / inward rails / MP4 audio`;
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
    if (i >= sources.length) {
      mesh.userData.videoMissing = true;
      return;
    }
    video.src = sources[i++];
    video.load();
  };
  const unlockAudio = () => {
    audioUnlocked = true;
    video.muted = false;
    video.play().catch(() => {});
  };
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
    if (loaded && mat.map !== vt) {
      mat.map = vt;
      mat.needsUpdate = true;
    }
    const cam = scene?.userData?._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    else if (cam?.position) camWorld.copy(cam.position);
    mesh.getWorldPosition(meshWorld);
    const dist = camWorld.distanceTo(meshWorld);
    const near = 1.35;
    const entrance = 6.75;
    let volume;
    if (dist <= entrance) volume = 0.50 + ((entrance - dist) / (entrance - near)) * 0.45;
    else volume = Math.max(0.12, 0.50 - (dist - entrance) * 0.10);
    video.volume = clamp(volume, 0.12, 0.95);
    if (audioUnlocked && video.muted) video.muted = false;
  };
  mesh.userData.unlockAudio = unlockAudio;
  return mesh;
}

function addSiteVideoHologram(root, scene) {
  const group = new THREE.Group();
  group.name = "SVR_UPDATE3_REIKI_SITE_MP4_HOLOGRAM_STAGE_PREMIUM";
  group.position.set(0, 0.02, 0.28);
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

export function enhanceReikiStorefront3(scene, { roomRadius = 24, wallHeight = 16, log = console.log } = {}) {
  if (!scene || scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK) return null;
  scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK = true;

  const R = roomRadius;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.012, Math.sin(angle) * (R - 4.05));
  const root = new THREE.Group();
  root.name = "SVR_UPDATE3_REIKI_PREMIUM_INWARD_RAIL_GLASS_AUDIO_LOCK";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 0.30, metalness: 0.38, emissive: 0x10242b, emissiveIntensity: 0.22 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.20, metalness: 0.82, emissive: 0x1b2d30, emissiveIntensity: 0.30 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9dfff6, transparent: true, opacity: 0.17, roughness: 0.02, metalness: 0.15, emissive: 0x1b7d78, emissiveIntensity: 0.34, side: THREE.DoubleSide, depthWrite: false });
  const redCarpetMat = new THREE.MeshStandardMaterial({ color: 0xa5001f, roughness: 0.84, metalness: 0.02, emissive: 0x340008, emissiveIntensity: 0.28, side: THREE.DoubleSide });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x06090d, roughness: 0.70, metalness: 0.14, emissive: 0x061318, emissiveIntensity: 0.20 });

  // Expanded storefront wall, aligned to the red-carpet entrance axis.
  addBox(root, "SVR_UPDATE3_REIKI_EXPANDED_BACK_WALL_PREMIUM", [17.1, 6.85, 0.20], [0, 3.36, -2.54], wallMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_SILVER_HEADER_PREMIUM", [17.1, 0.18, 0.30], [0, 5.94, 0.98], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_BACK_HEADER_PREMIUM", [17.1, 0.18, 0.30], [0, 5.94, -2.62], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_LEFT_SILVER_COLUMN_PREMIUM", [0.18, 5.86, 0.34], [-8.48, 2.94, 0.98], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_RIGHT_SILVER_COLUMN_PREMIUM", [0.18, 5.86, 0.34], [8.48, 2.94, 0.98], trimMat);

  // Large rear/side glass plus new entrance glass wings that start at the red-carpet line.
  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_LEFT_PREMIUM", [4.65, 4.48], [-5.40, 2.68, 1.02], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_RIGHT_PREMIUM", [4.65, 4.48], [5.40, 2.68, 1.02], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_LEFT_SIDE_GLASS_PREMIUM", [5.88, 4.58], [-8.34, 2.66, -0.58], glassMat, { rot: [0, Math.PI * 0.5, 0], renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_RIGHT_SIDE_GLASS_PREMIUM", [5.88, 4.58], [8.34, 2.66, -0.58], glassMat, { rot: [0, -Math.PI * 0.5, 0], renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_REAR_GLASS_SOFT_GLOW_PREMIUM", [13.2, 4.98], [0, 2.82, -2.42], glassMat.clone(), { renderOrder: 34 });
  addPlane(root, "SVR_UPDATE3_REIKI_ENTRANCE_GLASS_LEFT_WING", [7.0, 2.75], [-3.10, 1.74, 4.12], glassMat.clone(), { rot: [0, Math.PI * 0.5, 0], renderOrder: 36 });
  addPlane(root, "SVR_UPDATE3_REIKI_ENTRANCE_GLASS_RIGHT_WING", [7.0, 2.75], [3.10, 1.74, 4.12], glassMat.clone(), { rot: [0, -Math.PI * 0.5, 0], renderOrder: 36 });
  addBox(root, "SVR_UPDATE3_REIKI_ENTRANCE_LEFT_SILVER_RAIL_FRAME", [0.10, 2.95, 7.15], [-3.16, 1.54, 4.12], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_ENTRANCE_RIGHT_SILVER_RAIL_FRAME", [0.10, 2.95, 7.15], [3.16, 1.54, 4.12], trimMat);

  // Red carpet tightened to match the inward rails.
  addPlane(root, "SVR_UPDATE3_REIKI_WIDE_RED_CARPET_MAIN_PREMIUM", [5.70, 9.12], [0, 0.018, 1.88], redCarpetMat, { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 12 });
  addPlane(root, "SVR_UPDATE3_REIKI_RED_CARPET_ENTRY_TONGUE_PREMIUM", [4.15, 5.90], [0, 0.022, 5.92], redCarpetMat.clone(), { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 13 });
  const carpetEdgeMat = trimMat.clone();
  carpetEdgeMat.emissiveIntensity = 0.16;
  addBox(root, "SVR_UPDATE3_REIKI_CARPET_LEFT_SILVER_TRIM_PREMIUM", [0.055, 0.025, 11.0], [-2.92, 0.045, 3.52], carpetEdgeMat);
  addBox(root, "SVR_UPDATE3_REIKI_CARPET_RIGHT_SILVER_TRIM_PREMIUM", [0.055, 0.025, 11.0], [2.92, 0.045, 3.52], carpetEdgeMat);
  addGlowLine(root, "SVR_UPDATE3_REIKI_CARPET_LEFT_CYAN_EDGE", [0.035, 0.035, 11.0], [-2.80, 0.070, 3.52]);
  addGlowLine(root, "SVR_UPDATE3_REIKI_CARPET_RIGHT_CYAN_EDGE", [0.035, 0.035, 11.0], [2.80, 0.070, 3.52]);

  // Inward rails: silver poles and red rope are closer to the carpet now.
  const poleZ = [0.90, 2.08, 3.26, 4.44, 5.62, 6.80];
  const poleX = 2.86;
  const leftPoles = poleZ.map((z, idx) => addSilverPole(root, -poleX, z, `L${idx + 1}`).position);
  const rightPoles = poleZ.map((z, idx) => addSilverPole(root, poleX, z, `R${idx + 1}`).position);
  for (let i = 0; i < poleZ.length - 1; i++) {
    addRopeBetween(root, leftPoles[i], leftPoles[i + 1], `LEFT_${i + 1}`);
    addRopeBetween(root, rightPoles[i], rightPoles[i + 1], `RIGHT_${i + 1}`);
  }

  // Smaller high sign so the hologram/picture area is not blocked.
  const entranceTex = makeTextTexture([
    { text: "REIKI / RIKI STOREFRONT", font: "bold 50px system-ui, Arial" },
    { text: "PREMIUM GLASS ENTRY", font: "bold 32px system-ui, Arial" },
    { text: "SILVER POLES • RED ROPE", font: "bold 28px system-ui, Arial", color: "#ffced5" },
    { text: "AWAITING APPROVAL", font: "bold 34px system-ui, Arial", accent: true }
  ], { width: 1100, height: 390 });
  addPlane(root, "SVR_UPDATE3_REIKI_ALIGNMENT_SIGN_PREMIUM_HIGH", [4.55, 1.42], [0, 5.08, 1.08], new THREE.MeshBasicMaterial({ map: entranceTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), { renderOrder: 48 });

  const videoStage = addSiteVideoHologram(root, scene);
  const posPanel = addPositionPanel(scene);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0x88fff2, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false });
  [-8.36, 8.36, -3.10, 3.10].forEach((x, idx) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(idx < 2 ? 0.12 : 0.085, 16, 10), lampMat);
    lamp.position.set(x, idx < 2 ? 5.74 : 2.94, idx < 2 ? 0.98 : 6.95);
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
  };

  log?.("Update 3.0 premium Reiki storefront: inward rails, aligned glass/wall, site MP4 hologram volume gradient applied.");
  return root;
}
