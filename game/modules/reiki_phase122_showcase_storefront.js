import * as THREE from "three";

const BUILD = "PHASE-122-REIKI-SHOWCASE-STOREFRONT-LOCK";
const STORE_CENTER = new THREE.Vector3(19.95, 0, 0);

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(2,8,12,.96)");
  g.addColorStop(.55, opts.bg1 || "rgba(14,4,28,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,34,28,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(145,255,240,.88)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(145,255,240,.64)";
  x.shadowBlur = 18;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 54px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 98, c.width - 90);
  x.shadowBlur = 7;
  x.fillStyle = opts.lineColor || "#cafff8";
  x.font = opts.lineFont || "800 28px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 176) + i * (opts.gap || 42), c.width - 100));
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

function glassMat(opacity = .14) {
  return new THREE.MeshStandardMaterial({ color: 0x9ffff5, transparent: true, opacity, roughness: .04, metalness: .18, emissive: 0x16877b, emissiveIntensity: .24, side: THREE.DoubleSide, depthWrite: false });
}

function glowMat(color = 0x8ffff0, opacity = .36) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}

function loadTexture(urls) {
  const tex = new THREE.Texture();
  const loader = new THREE.TextureLoader();
  let i = 0;
  const next = () => {
    if (i >= urls.length) return;
    loader.load(urls[i++], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      tex.copy(loaded);
      tex.needsUpdate = true;
    }, undefined, next);
  };
  next();
  return tex;
}

function addPlant(root, x, z, scale = .7, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE122_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .23 * scale, .32 * scale, 24), new THREE.MeshStandardMaterial({ color: 0x431316, roughness: .82 }));
  pot.position.y = .16 * scale;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a40, roughness: .66, emissive: 0x062714, emissiveIntensity: .16, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.085 * scale, 12, 8), leafMat);
    leaf.scale.set(.50, 1.75, .12);
    const a = i / 9 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .13 * scale, .52 * scale + (i % 3) * .055 * scale, Math.sin(a) * .13 * scale);
    leaf.rotation.set(.56, a, i % 2 ? .32 : -.32);
    group.add(leaf);
  }
  root.add(group);
  return group;
}

function addPole(root, x, z, label) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: .92, roughness: .18, emissive: 0x151515, emissiveIntensity: .06 });
  const group = new THREE.Group();
  group.name = `SVR_PHASE122_POLE_${label}`;
  group.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.02, 20), silver);
  stem.position.y = .52;
  group.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 10), silver);
  cap.position.y = 1.08;
  group.add(cap);
  root.add(group);
  return group.position;
}

function addRope(root, a, b, label) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb4001f, roughness: .36, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .32 });
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const geo = new THREE.CylinderGeometry(.038, .038, len, 16);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `SVR_PHASE122_ROPE_${label}`;
  mesh.position.set((a.x + b.x) / 2, 1.02, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(b.z - a.z, b.x - a.x);
  root.add(mesh);
  return mesh;
}

function purgeOldReiki(scene) {
  const kill = [];
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/SVR_PHASE10[1-9].*REIKI|SVR_PHASE11[0-9].*REIKI|SVR_PHASE12[0-1].*REIKI|TRUEITIVE|CHAKRA|FOUNDER_PRESENTATION/i.test(n)) kill.push(obj);
  });
  let removed = 0;
  kill.forEach((obj) => { if (obj.parent) { obj.parent.remove(obj); removed++; } });
  document.querySelectorAll("video").forEach((v) => {
    const src = String(v.src || v.currentSrc || "").toLowerCase();
    if (src.includes("hologram") || src.includes("reiki")) { try { v.pause(); v.remove(); } catch {} }
  });
  return removed;
}

function buildShell(root) {
  const trim = new THREE.MeshStandardMaterial({ color: 0xd6dde2, metalness: .86, roughness: .2, emissive: 0x1b2d30, emissiveIntensity: .24 });
  const carpet = new THREE.MeshStandardMaterial({ color: 0x980019, roughness: .86, metalness: .02, emissive: 0x2d0008, emissiveIntensity: .22, side: THREE.DoubleSide });
  const glass = glassMat(.13);
  const W = 15.1, H = 6.45, F = 1.08, B = -3.20, S = W / 2, GAP = 5.2, GW = (W - GAP) / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2), MID = (F + B) / 2;
  addBox(root, "SVR_PHASE122_TOP_HEADER", [W, .22, .32], [0, H, F], trim);
  addBox(root, "SVR_PHASE122_BOTTOM_TRACK", [W, .08, .24], [0, .34, F], trim);
  addBox(root, "SVR_PHASE122_LEFT_FRAME", [.22, H, .32], [-S, H / 2, F], trim);
  addBox(root, "SVR_PHASE122_RIGHT_FRAME", [.22, H, .32], [S, H / 2, F], trim);
  addBox(root, "SVR_PHASE122_LEFT_ENTRY_POST", [.17, H - .55, .30], [-GAP / 2, H / 2, F], trim);
  addBox(root, "SVR_PHASE122_RIGHT_ENTRY_POST", [.17, H - .55, .30], [GAP / 2, H / 2, F], trim);
  addPlane(root, "SVR_PHASE122_FRONT_GLASS_LEFT", [GW, H - .95], [LX, H / 2 + .08, F + .025], glass, [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE122_FRONT_GLASS_RIGHT", [GW, H - .95], [RX, H / 2 + .08, F + .025], glass.clone(), [0, 0, 0], 90);
  addPlane(root, "SVR_PHASE122_LEFT_SIDE_GLASS", [F - B, H - 1.1], [-S + .04, H / 2 + .08, MID], glass.clone(), [0, Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE122_RIGHT_SIDE_GLASS", [F - B, H - 1.1], [S - .04, H / 2 + .08, MID], glass.clone(), [0, -Math.PI / 2, 0], 88);
  addPlane(root, "SVR_PHASE122_RED_CARPET_CLEAR_WALKWAY", [4.7, 9.55], [0, .02, 3.22], carpet, [-Math.PI / 2, 0, 0], 12);
  const zs = [1.12, 2.42, 3.72, 5.02, 6.32];
  const left = zs.map((z, i) => addPole(root, -2.38, z, `L${i}`));
  const right = zs.map((z, i) => addPole(root, 2.38, z, `R${i}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }
  [[-6.20,-2.18,"back_left"],[6.20,-2.18,"back_right"],[-3.30,6.45,"entry_left"],[3.30,6.45,"entry_right"],[-6.25,.88,"left_mid"],[6.25,.88,"right_mid"]].forEach(([x,z,label]) => addPlant(root, x, z, .72, label));
  addPlane(root, "SVR_PHASE122_MAIN_SIGN", [5.45, .96], [0, 6.15, F + .08], new THREE.MeshBasicMaterial({ map: makeTexture("REIKI SHOWCASE", ["hologram presentation storefront", "approval pending"], { w: 1200, h: 320, titleFont: "900 50px system-ui,Arial", lineFont: "800 26px system-ui,Arial", titleY: 88, startY: 174, gap: 42, border: "rgba(255,80,100,.78)" }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 240);
}

function addMiniHologram(root, name, x, z, texture, title, color = 0x8ffff0) {
  const g = new THREE.Group();
  g.name = `SVR_PHASE122_HOLOGRAM_${name}`;
  g.position.set(x, 0, z);
  root.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.34, .46, .10, 36), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: color, emissiveIntensity: .28, metalness: .75, roughness: .25 }));
  base.position.y = .58;
  g.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.12, .36, 1.75, 36, 1, true), glowMat(color, .075));
  beam.position.y = 1.32;
  g.add(beam);
  const panel = addPlane(g, `SVR_PHASE122_${name}_PANEL`, [1.10, 1.34], [0, 1.68, .09], new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .92 }), [0, 0, 0], 230);
  const label = addPlane(g, `SVR_PHASE122_${name}_LABEL`, [1.25, .34], [0, .82, .15], new THREE.MeshBasicMaterial({ map: makeTexture(title, [], { w: 500, h: 160, titleFont: "900 32px system-ui,Arial", titleY: 78, border: "rgba(145,255,240,.55)", line: 5 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 232);
  g.userData.tick = (t) => { panel.position.y = 1.68 + Math.sin(t * .0017 + x) * .02; beam.material.opacity = .055 + Math.sin(t * .002 + x) * .018; };
  return g;
}

function addLeftHologramGallery(root) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE122_LEFT_GLASS_HOLOGRAM_INFO_GALLERY";
  group.position.set(-3.95, 0, -.05);
  group.rotation.y = .10;
  root.add(group);
  addPlane(group, "SVR_PHASE122_LEFT_GALLERY_BACKGLOW", [2.95, 4.95], [0, 2.82, -.10], glowMat(0x8ffff0, .09), [0, 0, 0], 200);
  const logo = loadTexture(["./assets/ui/trueitive-logo.png", "../game/assets/ui/trueitive-logo.png"]);
  const founder = loadTexture(["./assets/ui/trueitive-founder.png", "../game/assets/ui/trueitive-founder.png"]);
  const h1 = addMiniHologram(group, "LOGO", -.68, .05, logo, "BRAND", 0x8ffff0);
  const h2 = addMiniHologram(group, "FOUNDER", .68, .05, founder, "FOUNDER", 0xff9de8);
  const h3 = addMiniHologram(group, "MISSION", -.68, -1.18, makeTexture("MISSION", ["calm preview", "healing path", "wellness room"], { w: 640, h: 760, titleFont: "900 54px system-ui,Arial", lineFont: "800 30px system-ui,Arial", titleY: 120, startY: 250, gap: 72 }), "MISSION", 0x9fff8f);
  const h4 = addMiniHologram(group, "BOOKING", .68, -1.18, makeTexture("BOOKING", ["private session", "VR room", "store path"], { w: 640, h: 760, titleFont: "900 54px system-ui,Arial", lineFont: "800 30px system-ui,Arial", titleY: 120, startY: 250, gap: 72 }), "SESSION", 0xffd56a);
  addPlane(group, "SVR_PHASE122_LEFT_ABOUT_SUMMARY", [2.50, .76], [0, 4.98, .06], new THREE.MeshBasicMaterial({ map: makeTexture("WALKTHROUGH INFO", ["all holograms behind glass"], { w: 900, h: 260, titleFont: "900 40px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 78, startY: 150 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 235);
  group.userData.tick = (t) => [h1, h2, h3, h4].forEach(h => h.userData.tick?.(t));
  return group;
}

function addRightSymbolWall(root) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE122_RIGHT_GLOWING_SYMBOL_WALL";
  group.position.set(3.95, 0, -.52);
  group.rotation.y = -.10;
  root.add(group);
  addPlane(group, "SVR_PHASE122_SYMBOL_WALL_BACKGLOW", [3.0, 5.12], [0, 3.06, -.09], glowMat(0x7658ff, .12), [0, 0, 0], 205);
  const items = [["ROOT",0xff3148],["SACRAL",0xff8a2d],["SOLAR",0xffd447],["HEART",0x36e875],["THROAT",0x38c9ff],["VISION",0x7270ff],["CROWN",0xd696ff]];
  items.forEach(([label, color], i) => {
    const y = 4.86 - i * .50;
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.23, 48), glowMat(color, .52));
    disk.name = `SVR_PHASE122_SYMBOL_DISC_${i}`;
    disk.position.set(-.78, y, .04);
    group.add(disk);
    addPlane(group, `SVR_PHASE122_SYMBOL_LABEL_${i}`, [1.35, .28], [.08, y, .06], new THREE.MeshBasicMaterial({ map: makeTexture(label, [], { w: 420, h: 140, titleFont: "900 35px system-ui,Arial", titleY: 70, border: "rgba(255,255,255,.32)", line: 4 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  });
  addPlane(group, "SVR_PHASE122_RIGHT_SYMBOL_TEXT", [2.55, .76], [0, 1.02, .06], new THREE.MeshBasicMaterial({ map: makeTexture("HEALING WALL", ["balance • calm • focus"], { w: 900, h: 300, titleFont: "900 44px system-ui,Arial", lineFont: "800 25px system-ui,Arial", titleY: 86, startY: 180 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  group.userData.tick = (t) => { group.children.forEach((o, i) => { if (o.material?.opacity && /DISC|BACKGLOW/.test(o.name || "")) o.material.opacity = Math.max(.06, o.material.opacity + Math.sin(t * .0018 + i) * .0014); }); };
  return group;
}

function addVideoAndPortal(root, scene, gotoScene) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE122_CENTER_VIDEO_HOLOGRAM_AND_PORTAL";
  group.position.set(0, 0, -.74);
  root.add(group);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.58, .84, .15, 56), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: 0x0b8178, emissiveIntensity: .36, metalness: .82, roughness: .24 }));
  base.position.y = .54;
  group.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.16, .55, 2.10, 56, 1, true), glowMat(0x8ffff0, .075));
  beam.position.y = 1.40;
  group.add(beam);
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture("REIKI VIDEO", ["center showcase", "tap once for audio"], { w: 820, h: 1040, titleY: 170, startY: 305 }), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.00, 1.84), mat);
  panel.name = "SVR_PHASE122_VIDEO_PANEL";
  panel.position.set(0, 1.56, .12);
  panel.renderOrder = 250;
  group.add(panel);
  const video = document.createElement("video");
  video.src = "/site/assets/video/reiki_hologram.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.style.display = "none";
  video.volume = .42;
  document.body.appendChild(video);
  const unlock = () => { video.muted = false; video.play().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  video.addEventListener("loadeddata", () => video.play().catch(() => {}));
  video.load();
  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const portal = new THREE.Group();
  portal.name = "SVR_PHASE122_ABOUT_PRIVATE_ROOM_PORTAL";
  portal.position.set(0, 0, -2.62);
  root.add(portal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.84, .026, 12, 96), glowMat(0x8ffff0, .66));
  ring.position.set(0, 1.52, .04);
  portal.add(ring);
  addPlane(portal, "SVR_PHASE122_PORTAL_BACK", [2.20, 2.78], [0, 1.58, 0], glassMat(.13), [0, 0, 0], 95);
  addPlane(portal, "SVR_PHASE122_PORTAL_SIGN", [2.66, .74], [0, 3.25, .08], new THREE.MeshBasicMaterial({ map: makeTexture("ABOUT / PRIVATE ROOM", ["walk here after preview", "tap portal to enter"], { w: 900, h: 300, titleFont: "900 42px system-ui,Arial", lineFont: "800 24px system-ui,Arial", titleY: 80, startY: 158, gap: 40 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], 230);
  portal.userData.activate = () => { if (gotoScene?.("reikiRoom")) return; window.location.href = "./reiki.html?v=phase122"; };
  const camWorld = new THREE.Vector3();
  const panelWorld = new THREE.Vector3();
  group.userData.tick = (t) => {
    if (video.readyState >= 2 && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    panel.getWorldPosition(panelWorld);
    const cam = scene.userData._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    const d = camWorld.distanceTo(panelWorld);
    video.volume = clamp(d < 8 ? .50 + ((8 - d) / 6.7) * .42 : .12, .10, .92);
    beam.material.opacity = .052 + (.5 + .5 * Math.sin(t * .0025)) * .055;
    ring.rotation.z = t * .0008;
  };
  return group;
}

export function applyReikiPhase122Showcase(scene, { log = console.log, gotoScene = null } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE122_REIKI_SHOWCASE_LOCK")) return null;
  const removed = purgeOldReiki(scene);
  const root = new THREE.Group();
  root.name = "SVR_PHASE122_REIKI_SHOWCASE_LOCK";
  root.position.copy(STORE_CENTER);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  scene.add(root);
  buildShell(root);
  const left = addLeftHologramGallery(root);
  const right = addRightSymbolWall(root);
  const center = addVideoAndPortal(root, scene, gotoScene);
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    left.userData.tick?.(t);
    right.userData.tick?.(t);
    center.userData.tick?.(t);
  };
  const oldPanel = document.getElementById("svr-position-panel");
  if (oldPanel) oldPanel.remove();
  const panel = document.createElement("div");
  panel.id = "svr-position-panel";
  panel.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:325px;background:rgba(0,0,0,.74);border:1px solid rgba(140,255,242,.68);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(panel);
  const panelTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    panelTick?.apply(this, args);
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nLeft: 4 info holograms behind glass\nCenter: video hologram\nRight: glowing healing wall\nBack: About/private room portal\nRemoved old Reiki clutter: ${removed}`;
  };
  window.SVR_PHASE122_REIKI_SHOWCASE = { build: BUILD, removed };
  scene.userData.SVR_PHASE122_REIKI_SHOWCASE = window.SVR_PHASE122_REIKI_SHOWCASE;
  log?.("Phase 122 Reiki showcase storefront loaded", window.SVR_PHASE122_REIKI_SHOWCASE);
  return root;
}
