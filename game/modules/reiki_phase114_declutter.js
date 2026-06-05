import * as THREE from "three";

const BUILD = "PHASE-114-REIKI-DECLUTTER-PRESENTATION-POLISH-LOCK";
const STORE_CENTER = new THREE.Vector3(19.95, 0, 0);

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1100;
  c.height = opts.h || 620;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(2,9,12,.96)");
  g.addColorStop(.55, opts.bg1 || "rgba(15,4,26,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,29,24,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(140,255,242,.92)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(140,255,242,.62)";
  x.shadowBlur = 18;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 58px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 118, c.width - 90);
  x.shadowBlur = 8;
  x.fillStyle = opts.lineColor || "#cafff8";
  x.font = opts.lineFont || "800 30px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 215) + i * (opts.gap || 48), c.width - 100));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, material, rot = [0, 0, 0], order = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = order;
  root.add(mesh);
  return mesh;
}

function glowMat(color = 0x8ffff0, opacity = .55) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}

function glassMat(opacity = .16) {
  return new THREE.MeshStandardMaterial({ color: 0xa7fff7, transparent: true, opacity, roughness: .04, metalness: .18, emissive: 0x1b7d78, emissiveIntensity: .25, side: THREE.DoubleSide, depthWrite: false });
}

function loadTexture(urls) {
  const t = new THREE.Texture();
  const loader = new THREE.TextureLoader();
  let index = 0;
  const next = () => {
    if (index >= urls.length) return;
    loader.load(urls[index++], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      t.copy(loaded);
      t.needsUpdate = true;
    }, undefined, next);
  };
  next();
  return t;
}

function addPlant(root, x, z, scale = .72, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE114_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .23 * scale, .32 * scale, 24), new THREE.MeshStandardMaterial({ color: 0x431316, roughness: .82 }));
  pot.position.y = .16 * scale;
  group.add(pot);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x1d743b, roughness: .66, emissive: 0x062714, emissiveIntensity: .14, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.09 * scale, 12, 8), leafMaterial);
    leaf.scale.set(.50, 1.7, .12);
    const a = i / 7 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .12 * scale, .52 * scale + (i % 3) * .055 * scale, Math.sin(a) * .12 * scale);
    leaf.rotation.set(.55, a, i % 2 ? .32 : -.32);
    group.add(leaf);
  }
  root.add(group);
  return group;
}

function addPole(root, x, z, label) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: .92, roughness: .18, emissive: 0x151515, emissiveIntensity: .06 });
  const group = new THREE.Group();
  group.name = `SVR_PHASE114_POLE_${label}`;
  group.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.043, .052, 1.05, 20), silver);
  stem.position.y = .55;
  group.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.10, 20, 10), silver);
  cap.position.y = 1.12;
  group.add(cap);
  root.add(group);
  return group.position;
}

function addRope(root, a, b, label) {
  const red = new THREE.MeshStandardMaterial({ color: 0xb4001f, roughness: .36, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .32 });
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const geo = new THREE.CylinderGeometry(.040, .040, len, 16);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, red);
  mesh.name = `SVR_PHASE114_ROPE_${label}`;
  mesh.position.set((a.x + b.x) / 2, 1.03, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(b.z - a.z, b.x - a.x);
  root.add(mesh);
  return mesh;
}

function removeCrowdedReikiObjects(scene) {
  const names = [
    "SVR_PHASE110_FINAL_POLISHED_HUB",
    "SVR_PHASE111_FINAL_POLISHED_HUB",
    "SVR_PHASE110_ALIGNED_HOLOGRAMS_AT_POSITION_PANEL_LOCATION",
    "SVR_PHASE111_ALIGNED_HOLOGRAMS_AT_POSITION_PANEL_LOCATION",
    "SVR_PHASE110_REIKI_WALL_SYMBOLS_JAPANESE",
    "SVR_PHASE111_REIKI_WALL_SYMBOLS_JAPANESE",
    "SVR_PHASE107_REIKI_STORE_VISIBLE_LOCK",
    "SVR_PHASE110_POLISHED_REIKI_HUB_LOCK",
    "SVR_PHASE110_POLISHED_GLASS_STORE_FRONT",
    "SVR_PHASE111_TRAINING_PORTAL_MARKER"
  ];
  let removed = 0;
  names.forEach((name) => {
    const o = scene.getObjectByName(name);
    if (o?.parent) { o.parent.remove(o); removed++; }
  });

  // Remove leftover duplicated Reiki presentation objects without touching portals or coffee stand.
  const kill = [];
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/SVR_PHASE11[01]_Hologram|SVR_PHASE11[01]_CENTER_VIDEO|SVR_PHASE11[01]_REIKI_WALL_SYMBOL|SVR_PHASE11[01]_SYMBOL|SVR_PHASE11[01]_VISIBLE_CHAKRA|SVR_PHASE11[01]_FRONT_SIGN/i.test(n)) kill.push(obj);
  });
  kill.forEach((obj) => { if (obj.parent) { obj.parent.remove(obj); removed++; } });

  // Remove old duplicate videos to stop overlapping audio/video playback.
  document.querySelectorAll("video").forEach((v) => {
    const src = String(v.currentSrc || v.src || "").toLowerCase();
    if (src.includes("reiki_hologram") || src.includes("hologram")) { try { v.pause(); v.remove(); } catch {} }
  });
  return removed;
}

function addVideoHologram(root, scene) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE114_SINGLE_CENTER_VIDEO_HOLOGRAM";
  group.position.set(0, 0, .24);
  root.add(group);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.74, 1.08, .18, 64), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: 0x0b8178, emissiveIntensity: .45, metalness: .82, roughness: .22 }));
  base.position.y = .58;
  group.add(base);

  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.22, .80, 2.72, 64, 1, true), glowMat(0x8ffff0, .10));
  beam.position.y = 1.65;
  group.add(beam);

  const mat = new THREE.MeshBasicMaterial({ map: makeTexture("REIKI VIDEO", ["single centered hologram", "tap once for audio"], { w: 840, h: 1120, titleY: 190, startY: 330 }), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 2.16), mat);
  panel.name = "SVR_PHASE114_VIDEO_PANEL";
  panel.position.set(0, 1.86, .16);
  panel.renderOrder = 260;
  group.add(panel);

  const video = document.createElement("video");
  video.src = "/site/assets/video/reiki_hologram.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.style.display = "none";
  video.volume = .48;
  document.body.appendChild(video);
  const unlock = () => { video.muted = false; video.play().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  video.addEventListener("loadeddata", () => video.play().catch(() => {}));
  video.load();

  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const camWorld = new THREE.Vector3();
  const meshWorld = new THREE.Vector3();
  group.userData.tick = (t) => {
    if (video.readyState >= 2 && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    panel.getWorldPosition(meshWorld);
    const cam = scene.userData._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    const dist = camWorld.distanceTo(meshWorld);
    video.volume = clamp(dist < 8 ? .50 + ((8 - dist) / 6.7) * .42 : .12, .10, .92);
    beam.material.opacity = .07 + (.5 + .5 * Math.sin(t * .0025)) * .07;
  };
  return group;
}

function addWallSymbols(root) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE114_BACK_WALL_REIKI_SYMBOLS";
  group.position.set(0, 0, -1.45);
  root.add(group);

  const symbols = [
    ["根", 0xff3148], ["丹", 0xff8a2d], ["陽", 0xffd447], ["心", 0x36e875], ["声", 0x38c9ff], ["眼", 0x7270ff], ["冠", 0xd696ff]
  ];
  symbols.forEach(([kanji, color], i) => {
    const x = -3.15 + i * 1.05;
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.28, 48), glowMat(color, .50));
    disk.name = `SVR_PHASE114_SMALL_SYMBOL_${i}`;
    disk.position.set(x, 4.34, .06);
    group.add(disk);
    const label = addPlane(group, `SVR_PHASE114_KANJI_${i}`, [.58, .32], [x, 3.92, .08], new THREE.MeshBasicMaterial({ map: makeTexture(kanji, [], { w: 280, h: 180, titleFont: "900 74px system-ui,Arial", titleY: 86, border: "rgba(255,255,255,.38)", line: 4 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  });

  addPlane(group, "SVR_PHASE114_JAPANESE_WRITING", [4.85, .74], [0, 5.18, .08], new THREE.MeshBasicMaterial({ map: makeTexture("霊気 • 癒し • 調和", ["光 • 呼吸 • 平和"], { w: 1200, h: 310, titleFont: "900 62px system-ui,Arial", lineFont: "800 28px system-ui,Arial", titleY: 96, startY: 190, border: "rgba(145,255,240,.70)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 240);

  return group;
}

function addPresentationPanels(root) {
  const founderTexture = loadTexture(["./assets/ui/trueitive-founder.png", "../game/assets/ui/trueitive-founder.png"]);
  const founderPanel = new THREE.Group();
  founderPanel.name = "SVR_PHASE114_LEFT_FOUNDER_ZONE";
  founderPanel.position.set(-3.38, 0, -1.22);
  root.add(founderPanel);
  addPlane(founderPanel, "SVR_PHASE114_FOUNDER_PHOTO", [1.10, 1.58], [0, 2.25, .10], new THREE.MeshBasicMaterial({ map: founderTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  addPlane(founderPanel, "SVR_PHASE114_FOUNDER_LABEL", [1.85, .74], [0, .95, .12], new THREE.MeshBasicMaterial({ map: makeTexture("FOUNDER", ["presentation bio", "approval pending"], { w: 760, h: 300, titleFont: "900 46px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 86, startY: 160, gap: 38, border: "rgba(145,255,240,.70)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);

  const servicePanel = new THREE.Group();
  servicePanel.name = "SVR_PHASE114_RIGHT_SERVICE_ZONE";
  servicePanel.position.set(3.38, 0, -1.22);
  root.add(servicePanel);
  addPlane(servicePanel, "SVR_PHASE114_SERVICES_PANEL", [2.05, 1.48], [0, 2.10, .12], new THREE.MeshBasicMaterial({ map: makeTexture("REIKI HUB", ["guided healing preview", "private session room", "storefront + booking", "presentation only"], { w: 820, h: 620, titleFont: "900 48px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 82, startY: 170, gap: 54, border: "rgba(255,80,100,.78)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
}

function buildCleanStorefront(scene) {
  const root = new THREE.Group();
  root.name = "SVR_PHASE114_CLEAN_REIKI_STOREFRONT";
  root.position.copy(STORE_CENTER);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  scene.add(root);

  const glass = glassMat(.16);
  const trim = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, metalness: .86, roughness: .20, emissive: 0x1b2d30, emissiveIntensity: .24 });
  const carpet = new THREE.MeshStandardMaterial({ color: 0x940018, roughness: .86, metalness: .02, emissive: 0x2d0008, emissiveIntensity: .22, side: THREE.DoubleSide });

  const W = 13.8, H = 6.3, F = .82, B = -2.55, S = W / 2, GAP = 4.7, GW = (W - GAP) / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2), MID = (F + B) / 2;

  // Open, clean glass shell: no opaque black wall.
  addBox(root, "SVR_PHASE114_TOP_HEADER", [W, .20, .30], [0, H, F], trim);
  addBox(root, "SVR_PHASE114_BOTTOM_TRACK", [W, .075, .22], [0, .34, F], trim);
  addBox(root, "SVR_PHASE114_LEFT_FRAME", [.20, H, .30], [-S, H / 2, F], trim);
  addBox(root, "SVR_PHASE114_RIGHT_FRAME", [.20, H, .30], [S, H / 2, F], trim);
  addBox(root, "SVR_PHASE114_LEFT_ENTRY_POST", [.16, H - .55, .28], [-GAP / 2, H / 2, F], trim);
  addBox(root, "SVR_PHASE114_RIGHT_ENTRY_POST", [.16, H - .55, .28], [GAP / 2, H / 2, F], trim);

  addPlane(root, "SVR_PHASE114_FRONT_GLASS_LEFT", [GW, H - .95], [LX, H / 2 + .08, F + .025], glass, [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE114_FRONT_GLASS_RIGHT", [GW, H - .95], [RX, H / 2 + .08, F + .025], glass.clone(), [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE114_LEFT_SIDE_GLASS_HINT", [F - B, H - 1.1], [-S + .04, H / 2 + .08, MID], glass.clone(), [0, Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE114_RIGHT_SIDE_GLASS_HINT", [F - B, H - 1.1], [S - .04, H / 2 + .08, MID], glass.clone(), [0, -Math.PI / 2, 0], 88);

  addPlane(root, "SVR_PHASE114_RED_CARPET_CLEAN", [4.85, 7.4], [0, .02, 3.15], carpet, [-Math.PI / 2, 0, 0], 12);
  const zs = [1.00, 2.15, 3.30, 4.45, 5.60];
  const left = zs.map((z, i) => addPole(root, -2.38, z, `L${i}`));
  const right = zs.map((z, i) => addPole(root, 2.38, z, `R${i}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }

  // Corner-only plants. Clear sightline through center.
  [[-5.95, -1.75, "backL"], [5.95, -1.75, "backR"], [-3.15, 5.90, "entryL"], [3.15, 5.90, "entryR"]].forEach(([x, z, label]) => addPlant(root, x, z, .78, label));

  addPlane(root, "SVR_PHASE114_MAIN_SIGN", [4.85, .94], [0, 5.95, F + .08], new THREE.MeshBasicMaterial({ map: makeTexture("REIKI / RIKI STOREFRONT", ["clean sponsor presentation", "approval pending"], { w: 1200, h: 320, titleFont: "900 50px system-ui,Arial", lineFont: "800 26px system-ui,Arial", titleY: 90, startY: 174, gap: 42, border: "rgba(255,80,100,.78)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 240);

  addWallSymbols(root);
  addPresentationPanels(root);
  const video = addVideoHologram(root, scene);
  return { root, video };
}

export function applyReikiPhase114Declutter(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE114_REIKI_DECLUTTER_LOCK")) return null;
  const removed = removeCrowdedReikiObjects(scene);
  const master = new THREE.Group();
  master.name = "SVR_PHASE114_REIKI_DECLUTTER_LOCK";
  scene.add(master);
  const clean = buildCleanStorefront(scene);
  master.add(clean.root);

  const oldPanel = document.getElementById("svr-position-panel");
  if (oldPanel) oldPanel.remove();
  const panel = document.createElement("div");
  panel.id = "svr-position-panel";
  panel.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:310px;background:rgba(0,0,0,.74);border:1px solid rgba(140,255,242,.68);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(panel);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    clean.video?.userData?.tick?.(t);
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nDecluttered 3-zone Reiki storefront\nSingle center video hologram\nSmall Japanese wall symbols only\nRemoved old crowded objects: ${removed}`;
  };

  scene.userData.SVR_PHASE114_REIKI_LOCK = { build: BUILD, removed };
  window.SVR_PHASE114_REIKI_LOCK = scene.userData.SVR_PHASE114_REIKI_LOCK;
  log?.("Phase 114 Reiki declutter polish loaded", scene.userData.SVR_PHASE114_REIKI_LOCK);
  return master;
}
