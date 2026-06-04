import * as THREE from "three";

const BUILD = "PHASE-102-REIKI-GLASS-WALL-HOLOGRAM-ALIGN-LOCK";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function canvasTexture(lines, opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1024;
  c.height = opts.h || 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(2,8,10,.94)");
  g.addColorStop(0.55, opts.bg1 || "rgba(20,4,34,.90)");
  g.addColorStop(1, opts.bg2 || "rgba(2,24,22,.90)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(145,255,240,.92)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(18, 18, c.width - 36, c.height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(130,255,240,.7)";
  x.shadowBlur = 18;
  lines.forEach((line, i) => {
    x.fillStyle = line.color || (i === 0 ? "#fff" : "#bffff6");
    x.font = line.font || (i === 0 ? "900 58px system-ui,Arial" : "700 32px system-ui,Arial");
    x.fillText(line.text, c.width / 2, (line.y || (100 + i * 74)), c.width - 80);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, mat, { renderOrder = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  m.renderOrder = renderOrder;
  root.add(m);
  return m;
}

function addPlane(root, name, size, pos, mat, { rot = null, renderOrder = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = renderOrder;
  root.add(m);
  return m;
}

function addGlowLine(root, name, size, pos, color = 0x8ffff0, opacity = .72) {
  return addBox(root, name, size, pos, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
}

function makeGlass(opacity = .19) {
  return new THREE.MeshStandardMaterial({ color: 0x9dfff6, transparent: true, opacity, roughness: .02, metalness: .18, emissive: 0x1b7d78, emissiveIntensity: .34, side: THREE.DoubleSide, depthWrite: false });
}

function addSilverPole(root, x, z, label = "") {
  const silver = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: .2, metalness: .9, emissive: 0x101014, emissiveIntensity: .1 });
  const pole = new THREE.Group();
  pole.name = `SVR_PHASE102_SILVER_POLE_${label}`;
  pole.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 1.10, 22), silver);
  stem.position.y = .58;
  pole.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.18, .23, .065, 32), silver);
  base.position.y = .035;
  pole.add(base);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.105, 22, 12), silver);
  cap.position.y = 1.16;
  pole.add(cap);
  root.add(pole);
  return pole;
}

function addRope(root, a, b, label = "") {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb5001f, roughness: .36, metalness: .05, emissive: 0x52000e, emissiveIntensity: .36 });
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const geo = new THREE.CylinderGeometry(.045, .045, len, 18);
  geo.rotateZ(Math.PI * .5);
  const rope = new THREE.Mesh(geo, mat);
  rope.name = `SVR_PHASE102_RED_ROPE_${label}`;
  rope.position.set((a.x + b.x) / 2, 1.07, (a.z + b.z) / 2);
  rope.rotation.y = Math.atan2(dz, dx);
  root.add(rope);
  return rope;
}

function addPlant(root, x, z, s = 1, label = "") {
  const g = new THREE.Group();
  g.name = `SVR_PHASE102_PLANT_${label}`;
  g.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18 * s, .25 * s, .34 * s, 28), new THREE.MeshStandardMaterial({ color: 0x4a1618, roughness: .82, emissive: 0x120303, emissiveIntensity: .08 }));
  pot.position.y = .17 * s;
  g.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d743b, roughness: .65, emissive: 0x062714, emissiveIntensity: .16, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.10 * s, 14, 8), leafMat);
    leaf.scale.set(.55, 1.9, .13);
    const a = i / 8 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .12 * s, .58 * s + (i % 3) * .06 * s, Math.sin(a) * .12 * s);
    leaf.rotation.set(.55 + (i % 2) * .2, a, i % 2 ? .34 : -.34);
    g.add(leaf);
  }
  root.add(g);
  return g;
}

function addPositionPanel(scene) {
  if (document.getElementById("svr-position-panel")) document.getElementById("svr-position-panel").remove();
  const el = document.createElement("div");
  el.id = "svr-position-panel";
  el.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:260px;background:rgba(0,0,0,.72);border:1px solid rgba(140,255,242,.65);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(el);
  return { tick() {
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    el.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nGlass flush to storefront wall\nHologram moved inside Reiki area`;
  }};
}

function makeVideoPanel(scene) {
  const mat = new THREE.MeshBasicMaterial({ map: canvasTexture([
    { text: "REIKI HOLOGRAM", font: "900 52px system-ui,Arial" },
    { text: "tap once to unlock audio", font: "700 32px system-ui,Arial" },
    { text: "site video linked", font: "700 28px system-ui,Arial", color: "#bffff6" }
  ], { w: 820, h: 1120 }), transparent: true, opacity: .94, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 2.04), mat);
  mesh.name = "SVR_PHASE102_REIKI_VIDEO_HOLOGRAM_INSIDE_STORE";
  mesh.renderOrder = 170;

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.style.display = "none";
  video.volume = .50;
  document.body.appendChild(video);
  const sources = ["../site/assets/video/reiki_hologram.mp4", "/site/assets/video/reiki_hologram.mp4", "https://svrpoker.com/site/assets/video/reiki_hologram.mp4", "./assets/video/reiki_hologram.mp4"];
  let i = 0, loaded = false, unlocked = false;
  const next = () => { if (i < sources.length) { video.src = sources[i++]; video.load(); } else mesh.userData.videoMissing = true; };
  const unlock = () => { unlocked = true; video.muted = false; video.play().catch(() => {}); };
  video.addEventListener("loadeddata", () => { loaded = true; video.play().catch(() => {}); });
  video.addEventListener("error", next);
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  next();
  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const camWorld = new THREE.Vector3();
  const meshWorld = new THREE.Vector3();
  mesh.userData.tick = () => {
    if (loaded && mat.map !== vt) { mat.map = vt; mat.needsUpdate = true; }
    const cam = scene.userData._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(camWorld); else if (cam?.position) camWorld.copy(cam.position);
    mesh.getWorldPosition(meshWorld);
    const dist = camWorld.distanceTo(meshWorld);
    const near = 1.3, entrance = 6.6;
    const vol = dist <= entrance ? .50 + ((entrance - dist) / (entrance - near)) * .45 : .16;
    video.volume = clamp(vol, .12, .95);
    if (unlocked && video.muted) video.muted = false;
  };
  return mesh;
}

function addHologramInside(root, scene) {
  const g = new THREE.Group();
  g.name = "SVR_PHASE102_HOLOGRAM_STAGE_INSIDE_REIKI_GLASS";
  // Inside the storefront, centered behind the glass, not in the walkway.
  g.position.set(0, 0, -0.72);
  root.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, 1.0, .16, 64), new THREE.MeshStandardMaterial({ color: 0x061315, metalness: .84, roughness: .22, emissive: 0x0b8178, emissiveIntensity: .48 }));
  base.position.set(0, .62, .02);
  g.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, .72, 2.65, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .10, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(0, 1.68, .04);
  g.add(beam);
  const vid = makeVideoPanel(scene);
  vid.position.set(0, 1.88, .10);
  g.add(vid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.82, .018, 10, 96), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .72, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.position.set(0, 1.90, .15);
  g.add(ring);
  const light = new THREE.PointLight(0x8ffff0, 1.12, 7.2, 2.1);
  light.position.set(0, 1.18, .54);
  g.add(light);
  g.userData.tick = (t) => { vid.userData.tick?.(t); ring.rotation.z += .004; const p = .5 + .5 * Math.sin(t * .003); beam.material.opacity = .065 + p * .08; light.intensity = .76 + p * .56; };
  return g;
}

function addHighMoonMars(scene) {
  const old = scene.getObjectByName("SVR_PHASE102_HIGH_TEXTURED_MOON_MARS");
  if (old) return old;
  const g = new THREE.Group();
  g.name = "SVR_PHASE102_HIGH_TEXTURED_MOON_MARS";
  scene.add(g);
  const makePlanet = (kind) => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const x = c.getContext("2d"); const moon = kind === "moon";
    x.fillStyle = moon ? "#d8d0bf" : "#a94b2d"; x.fillRect(0,0,c.width,c.height);
    for (let i = 0; i < (moon ? 90 : 70); i++) { x.beginPath(); const px=Math.random()*c.width, py=Math.random()*c.height, r=(moon?8:10)+Math.random()*(moon?36:55); x.fillStyle = moon ? "rgba(80,76,70,.24)" : "rgba(70,24,16,.26)"; x.ellipse(px,py,r,r*.7,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  };
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.15, 56, 28), new THREE.MeshBasicMaterial({ map: makePlanet("moon") }));
  moon.position.set(-25, 48, -78); g.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.72, 48, 24), new THREE.MeshBasicMaterial({ map: makePlanet("mars") }));
  mars.position.set(29, 42, -88); g.add(mars);
  const glow = new THREE.PointLight(0xded4bd, .55, 150, 2.1); glow.position.copy(moon.position); g.add(glow);
  g.userData.tick = (dt=.016) => { moon.rotation.y += .10 * dt; mars.rotation.y += .17 * dt; };
  return g;
}

export function enhanceReikiStorefront3(scene, { roomRadius = 24, log = console.log } = {}) {
  // Remove only the previous Update 3 overlay so the corrected storefront does not stack with old misaligned glass.
  const existing = scene.getObjectByName("SVR_UPDATE3_REIKI_ALIGNED_GLASS_PLANTS_PLANETS_LOCK") || scene.getObjectByName("SVR_UPDATE3_REIKI_PREMIUM_INWARD_RAIL_GLASS_AUDIO_LOCK") || scene.getObjectByName("SVR_UPDATE3_REIKI_EXPANDED_GLASS_WALL_RED_CARPET_ROPE_LOCK");
  if (existing?.parent) existing.parent.remove(existing);
  scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK = true;

  const R = roomRadius;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), .012, Math.sin(angle) * (R - 4.05));
  const root = new THREE.Group();
  root.name = "SVR_PHASE102_REIKI_FLUSH_GLASS_STOREFRONT_LOCK";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05090d, roughness: .72, metalness: .16, emissive: 0x061318, emissiveIntensity: .22 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x151c22, roughness: .30, metalness: .42, emissive: 0x10242b, emissiveIntensity: .24 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, roughness: .18, metalness: .86, emissive: 0x1b2d30, emissiveIntensity: .30 });
  const glassMat = makeGlass(.19);
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0xa5001f, roughness: .84, metalness: .02, emissive: 0x340008, emissiveIntensity: .28, side: THREE.DoubleSide });

  // One solid storefront: back wall + two side returns + flush front glass connected to the frame.
  addBox(root, "SVR_PHASE102_REIKI_ONE_SOLID_BACK_WALL", [17.35, 6.90, .22], [0, 3.38, -2.60], wallMat);
  addBox(root, "SVR_PHASE102_REIKI_LEFT_WALL_RETURN", [.22, 6.0, 3.72], [-8.58, 3.0, -.78], frameMat);
  addBox(root, "SVR_PHASE102_REIKI_RIGHT_WALL_RETURN", [.22, 6.0, 3.72], [8.58, 3.0, -.78], frameMat);
  addBox(root, "SVR_PHASE102_REIKI_FRONT_TOP_HEADER", [17.35, .20, .34], [0, 5.98, 1.08], trimMat);
  addBox(root, "SVR_PHASE102_REIKI_FRONT_BOTTOM_TRACK", [17.35, .08, .22], [0, .34, 1.08], trimMat);
  addBox(root, "SVR_PHASE102_REIKI_FRONT_LEFT_COLUMN", [.20, 5.85, .34], [-8.58, 2.96, 1.08], trimMat);
  addBox(root, "SVR_PHASE102_REIKI_FRONT_RIGHT_COLUMN", [.20, 5.85, .34], [8.58, 2.96, 1.08], trimMat);

  // Glass sits exactly on the storefront front plane at z=1.09. No diagonal hallway glass.
  addPlane(root, "SVR_PHASE102_REIKI_FLUSH_FRONT_GLASS_LEFT", [6.58, 4.70], [-5.10, 2.86, 1.095], glassMat, { renderOrder: 45 });
  addPlane(root, "SVR_PHASE102_REIKI_FLUSH_FRONT_GLASS_RIGHT", [6.58, 4.70], [5.10, 2.86, 1.095], glassMat, { renderOrder: 45 });
  addPlane(root, "SVR_PHASE102_REIKI_SIDE_GLASS_LEFT_CONNECTED", [3.72, 4.70], [-8.47, 2.86, -.78], glassMat.clone(), { rot: [0, Math.PI * .5, 0], renderOrder: 44 });
  addPlane(root, "SVR_PHASE102_REIKI_SIDE_GLASS_RIGHT_CONNECTED", [3.72, 4.70], [8.47, 2.86, -.78], glassMat.clone(), { rot: [0, -Math.PI * .5, 0], renderOrder: 44 });
  addPlane(root, "SVR_PHASE102_REIKI_BACK_WALL_SOFT_GLASS_LAYER", [13.5, 5.10], [0, 2.90, -2.47], glassMat.clone(), { renderOrder: 43 });
  addGlowLine(root, "SVR_PHASE102_GLASS_TOP_GLOW", [17.15, .045, .045], [0, 5.72, 1.13]);
  addGlowLine(root, "SVR_PHASE102_GLASS_BOTTOM_GLOW", [17.15, .035, .045], [0, .58, 1.13]);

  // Walkway + rails sit outside the glass line and remain aligned to the storefront center.
  addPlane(root, "SVR_PHASE102_REIKI_RED_CARPET_FLUSH_CENTERED", [5.25, 9.20], [0, .018, 1.92], carpetMat, { rot: [-Math.PI * .5, 0, 0], renderOrder: 12 });
  addPlane(root, "SVR_PHASE102_REIKI_RED_CARPET_ENTRY", [4.05, 5.90], [0, .022, 5.95], carpetMat.clone(), { rot: [-Math.PI * .5, 0, 0], renderOrder: 13 });
  addGlowLine(root, "SVR_PHASE102_CARPET_LEFT_EDGE", [.035, .035, 11.1], [-2.58, .07, 3.56]);
  addGlowLine(root, "SVR_PHASE102_CARPET_RIGHT_EDGE", [.035, .035, 11.1], [2.58, .07, 3.56]);

  const poleZ = [1.16, 2.26, 3.36, 4.46, 5.56, 6.66];
  const poleX = 2.45;
  const leftPoles = poleZ.map((z, i) => addSilverPole(root, -poleX, z, `L${i+1}`).position);
  const rightPoles = poleZ.map((z, i) => addSilverPole(root, poleX, z, `R${i+1}`).position);
  for (let i = 0; i < poleZ.length - 1; i++) { addRope(root, leftPoles[i], leftPoles[i+1], `LEFT_${i+1}`); addRope(root, rightPoles[i], rightPoles[i+1], `RIGHT_${i+1}`); }

  // Plants are inside the glass and outside the rails, not blocking the carpet.
  [[-7.45,.25,.88,"insideBackL"],[7.45,.25,.88,"insideBackR"],[-6.35,-1.85,.80,"insideL"],[6.35,-1.85,.80,"insideR"],[-3.15,1.10,.72,"entryL"],[3.15,1.10,.72,"entryR"],[-3.25,5.72,.74,"outerL"],[3.25,5.72,.74,"outerR"]].forEach(([x,z,s,l]) => addPlant(root, x, z, s, l));

  const sign = addPlane(root, "SVR_PHASE102_REIKI_HIGH_SIGN", [4.25, 1.20], [0, 5.24, 1.14], new THREE.MeshBasicMaterial({ map: canvasTexture([
    { text: "REIKI / RIKI STOREFRONT", font: "900 46px system-ui,Arial" },
    { text: "GLASS FRONT CONNECTED TO WALL", font: "700 28px system-ui,Arial" },
    { text: "AWAITING APPROVAL", font: "900 30px system-ui,Arial", color: "#ffb7b7" }
  ], { w: 1100, h: 340, border: "rgba(255,80,80,.72)" }), transparent: true, depthWrite: false, side: THREE.DoubleSide }), { renderOrder: 90 });

  const holo = addHologramInside(root, scene);
  const posPanel = addPositionPanel(scene);
  const sky = addHighMoonMars(scene);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    holo?.userData?.tick?.(t);
    posPanel?.tick?.(t);
    sky?.userData?.tick?.(1/60);
  };

  log?.("Phase 102 Reiki storefront loaded: glass flush to wall, hologram moved inside, rails/carpet aligned.");
  return root;
}
