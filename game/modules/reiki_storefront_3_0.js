import * as THREE from "three";

const BUILD = "PHASE-104-REIKI-HOLOGRAM-FACING-RED-CARPET-LOCK";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function makeCanvasTexture(lines, opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 1200;
  c.height = opts.h || 520;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(2,8,10,.96)");
  g.addColorStop(0.55, opts.bg1 || "rgba(22,4,34,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,28,24,.92)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(145,255,240,.96)";
  x.lineWidth = opts.line || 9;
  x.strokeRect(20, 20, c.width - 40, c.height - 40);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(130,255,240,.75)";
  x.shadowBlur = 22;
  lines.forEach((line, i) => {
    x.fillStyle = line.color || (i === 0 ? "#ffffff" : "#bffff6");
    x.font = line.font || (i === 0 ? "900 62px system-ui,Arial" : "700 34px system-ui,Arial");
    x.fillText(line.text, c.width / 2, line.y || (104 + i * 78), c.width - 90);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, mat, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  mesh.renderOrder = opts.renderOrder || 0;
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, mat, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  mesh.renderOrder = opts.renderOrder || 0;
  root.add(mesh);
  return mesh;
}

function glowMat(color = 0x8ffff0, opacity = .72) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
}

function addGlowLine(root, name, size, pos, color = 0x8ffff0, opacity = .72) {
  return addBox(root, name, size, pos, glowMat(color, opacity));
}

function glassMat(opacity = .22) {
  return new THREE.MeshStandardMaterial({ color: 0xa7fff7, transparent: true, opacity, roughness: .02, metalness: .20, emissive: 0x1b7d78, emissiveIntensity: .40, side: THREE.DoubleSide, depthWrite: false });
}

function addSilverPole(root, x, z, label = "") {
  const silver = new THREE.MeshStandardMaterial({ color: 0xdadada, roughness: .18, metalness: .92, emissive: 0x101014, emissiveIntensity: .12 });
  const group = new THREE.Group();
  group.name = `SVR_PHASE104_SILVER_POLE_${label}`;
  group.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.046, .056, 1.12, 24), silver);
  stem.position.y = .58;
  group.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.19, .24, .07, 32), silver);
  base.position.y = .035;
  group.add(base);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.108, 24, 12), silver);
  cap.position.y = 1.17;
  group.add(cap);
  root.add(group);
  return group;
}

function addRope(root, a, b, label = "") {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb4001f, roughness: .34, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .38 });
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const geo = new THREE.CylinderGeometry(.047, .047, len, 20);
  geo.rotateZ(Math.PI * .5);
  const rope = new THREE.Mesh(geo, mat);
  rope.name = `SVR_PHASE104_RED_ROPE_${label}`;
  rope.position.set((a.x + b.x) / 2, 1.08, (a.z + b.z) / 2);
  rope.rotation.y = Math.atan2(dz, dx);
  root.add(rope);
  return rope;
}

function addPlant(root, x, z, s = 1, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE104_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18 * s, .26 * s, .36 * s, 30), new THREE.MeshStandardMaterial({ color: 0x4a1518, roughness: .82, emissive: 0x120303, emissiveIntensity: .08 }));
  pot.position.y = .18 * s;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d743b, roughness: .65, emissive: 0x062714, emissiveIntensity: .18, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.10 * s, 14, 8), leafMat);
    leaf.scale.set(.55, 1.95, .13);
    const a = i / 9 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * .13 * s, .60 * s + (i % 3) * .065 * s, Math.sin(a) * .13 * s);
    leaf.rotation.set(.56 + (i % 2) * .22, a, i % 2 ? .35 : -.35);
    group.add(leaf);
  }
  root.add(group);
  return group;
}

function addPositionPanel(scene) {
  const old = document.getElementById("svr-position-panel");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id = "svr-position-panel";
  el.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:280px;background:rgba(0,0,0,.74);border:1px solid rgba(140,255,242,.68);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(el);
  return { tick() {
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    el.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nHologram facing red carpet\nExpanded flush glass storefront`;
  }};
}

function makeVideoPanel(scene) {
  const mat = new THREE.MeshBasicMaterial({ map: makeCanvasTexture([
    { text: "REIKI HOLOGRAM", font: "900 56px system-ui,Arial" },
    { text: "tap once to unlock audio", font: "700 34px system-ui,Arial" },
    { text: "site MP4 linked", font: "700 28px system-ui,Arial", color: "#bffff6" }
  ], { w: 840, h: 1120 }), transparent: true, opacity: .94, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 2.22), mat);
  mesh.name = "SVR_PHASE104_REIKI_VIDEO_HOLOGRAM_PANEL_RED_CARPET_FACE";
  mesh.renderOrder = 180;

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
    const near = 1.3, entrance = 8.0;
    const vol = dist <= entrance ? .50 + ((entrance - dist) / (entrance - near)) * .45 : .16;
    video.volume = clamp(vol, .12, .95);
    if (unlocked && video.muted) video.muted = false;
  };
  return mesh;
}

function addHologramFacingCarpet(root, scene, frontZ) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE104_HOLOGRAM_POSITIONED_HERE_FACING_RED_CARPET";
  // Centered just inside the glass entrance. Default plane normal faces +Z, directly toward the red carpet.
  group.position.set(0, 0, frontZ - 0.58);
  root.add(group);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.78, 1.22, .18, 72), new THREE.MeshStandardMaterial({ color: 0x061315, metalness: .84, roughness: .22, emissive: 0x0b8178, emissiveIntensity: .50 }));
  base.position.set(0, .62, .02);
  group.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.22, .88, 3.0, 72, 1, true), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .11, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(0, 1.82, .04);
  group.add(beam);
  const vid = makeVideoPanel(scene);
  vid.position.set(0, 2.02, .12);
  group.add(vid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.94, .020, 10, 112), glowMat(0x8ffff0, .76));
  ring.position.set(0, 2.04, .17);
  group.add(ring);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 2.72), glowMat(0x8ffff0, .13));
  halo.position.set(0, 2.02, .10);
  group.add(halo);
  const arrow = addPlane(group, "SVR_PHASE104_HOLOGRAM_FACES_RED_CARPET_LABEL", [1.90, .44], [0, .28, .38], new THREE.MeshBasicMaterial({ map: makeCanvasTexture([{ text: "FACING RED CARPET", font: "900 44px system-ui,Arial" }], { w: 900, h: 220, border: "rgba(145,255,240,.70)" }), transparent: true, depthWrite: false, side: THREE.DoubleSide }), { renderOrder: 190 });
  const light = new THREE.PointLight(0x8ffff0, 1.25, 8.8, 2.1);
  light.position.set(0, 1.25, .66);
  group.add(light);
  group.userData.tick = (t) => { vid.userData.tick?.(t); ring.rotation.z += .0042; const p = .5 + .5 * Math.sin(t * .003); beam.material.opacity = .07 + p * .085; halo.material.opacity = .08 + p * .10; light.intensity = .82 + p * .62; };
  return group;
}

function addHighMoonMars(scene) {
  const old = scene.getObjectByName("SVR_PHASE104_HIGH_TEXTURED_MOON_MARS");
  if (old) return old;
  const group = new THREE.Group();
  group.name = "SVR_PHASE104_HIGH_TEXTURED_MOON_MARS";
  scene.add(group);
  const makePlanetTex = (kind) => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const x = c.getContext("2d"); const moon = kind === "moon";
    x.fillStyle = moon ? "#d8d0bf" : "#a94b2d"; x.fillRect(0,0,c.width,c.height);
    for (let i = 0; i < (moon ? 90 : 70); i++) { x.beginPath(); const px=Math.random()*c.width, py=Math.random()*c.height, r=(moon?8:10)+Math.random()*(moon?36:55); x.fillStyle = moon ? "rgba(80,76,70,.24)" : "rgba(70,24,16,.26)"; x.ellipse(px,py,r,r*.7,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  };
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.25, 64, 32), new THREE.MeshBasicMaterial({ map: makePlanetTex("moon") }));
  moon.position.set(-26, 50, -82); group.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.82, 56, 28), new THREE.MeshBasicMaterial({ map: makePlanetTex("mars") }));
  mars.position.set(31, 44, -94); group.add(mars);
  const glow = new THREE.PointLight(0xded4bd, .60, 160, 2.1); glow.position.copy(moon.position); group.add(glow);
  group.userData.tick = (dt=.016) => { moon.rotation.y += .10 * dt; mars.rotation.y += .17 * dt; };
  return group;
}

export function enhanceReikiStorefront3(scene, { roomRadius = 24, log = console.log } = {}) {
  [
    "SVR_PHASE103_REIKI_EXPANDED_GLASS_STOREFRONT_LOCK",
    "SVR_PHASE102_REIKI_FLUSH_GLASS_STOREFRONT_LOCK",
    "SVR_UPDATE3_REIKI_ALIGNED_GLASS_PLANTS_PLANETS_LOCK",
    "SVR_UPDATE3_REIKI_PREMIUM_INWARD_RAIL_GLASS_AUDIO_LOCK",
    "SVR_UPDATE3_REIKI_EXPANDED_GLASS_WALL_RED_CARPET_ROPE_LOCK"
  ].forEach((name) => { const o = scene.getObjectByName(name); if (o?.parent) o.parent.remove(o); });
  scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK = true;

  const R = roomRadius;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), .012, Math.sin(angle) * (R - 4.05));
  const root = new THREE.Group();
  root.name = "SVR_PHASE104_REIKI_EXPANDED_HOLOGRAM_RED_CARPET_LOCK";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const WALL_W = 23.6;
  const WALL_H = 7.55;
  const SIDE_X = WALL_W / 2;
  const FRONT_Z = 1.24;
  const BACK_Z = -4.20;
  const DEPTH = FRONT_Z - BACK_Z;
  const GAP = 4.30;
  const GLASS_W = (WALL_W - GAP) / 2;
  const LEFT_X = -(GAP / 2 + GLASS_W / 2);
  const RIGHT_X = (GAP / 2 + GLASS_W / 2);
  const MID_Z = (FRONT_Z + BACK_Z) / 2;

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05090d, roughness: .72, metalness: .16, emissive: 0x061318, emissiveIntensity: .23 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x151c22, roughness: .30, metalness: .42, emissive: 0x10242b, emissiveIntensity: .25 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, roughness: .18, metalness: .88, emissive: 0x1b2d30, emissiveIntensity: .32 });
  const glass = glassMat(.22);
  const carpet = new THREE.MeshStandardMaterial({ color: 0xa5001f, roughness: .84, metalness: .02, emissive: 0x340008, emissiveIntensity: .30, side: THREE.DoubleSide });

  addBox(root, "SVR_PHASE104_ONE_SOLID_BACK_WALL_EXPANDED", [WALL_W, WALL_H, .24], [0, WALL_H / 2, BACK_Z], wallMat);
  addBox(root, "SVR_PHASE104_LEFT_SOLID_RETURN_WALL", [.28, WALL_H, DEPTH], [-SIDE_X, WALL_H / 2, MID_Z], frameMat);
  addBox(root, "SVR_PHASE104_RIGHT_SOLID_RETURN_WALL", [.28, WALL_H, DEPTH], [SIDE_X, WALL_H / 2, MID_Z], frameMat);
  addBox(root, "SVR_PHASE104_FRONT_TOP_HEADER_EXPANDED", [WALL_W, .24, .40], [0, WALL_H - .18, FRONT_Z], trimMat);
  addBox(root, "SVR_PHASE104_FRONT_BOTTOM_GLASS_TRACK", [WALL_W, .09, .26], [0, .36, FRONT_Z], trimMat);
  addBox(root, "SVR_PHASE104_FRONT_LEFT_COLUMN", [.24, WALL_H - .34, .40], [-SIDE_X, WALL_H / 2, FRONT_Z], trimMat);
  addBox(root, "SVR_PHASE104_FRONT_RIGHT_COLUMN", [.24, WALL_H - .34, .40], [SIDE_X, WALL_H / 2, FRONT_Z], trimMat);
  addBox(root, "SVR_PHASE104_ENTRANCE_LEFT_POST", [.18, WALL_H - .70, .36], [-GAP / 2, WALL_H / 2, FRONT_Z + .02], trimMat);
  addBox(root, "SVR_PHASE104_ENTRANCE_RIGHT_POST", [.18, WALL_H - .70, .36], [GAP / 2, WALL_H / 2, FRONT_Z + .02], trimMat);

  addPlane(root, "SVR_PHASE104_FRONT_GLASS_LEFT_EXPANDED_FLUSH", [GLASS_W, WALL_H - 1.10], [LEFT_X, (WALL_H / 2) + .08, FRONT_Z + .018], glass, { renderOrder: 52 });
  addPlane(root, "SVR_PHASE104_FRONT_GLASS_RIGHT_EXPANDED_FLUSH", [GLASS_W, WALL_H - 1.10], [RIGHT_X, (WALL_H / 2) + .08, FRONT_Z + .018], glass.clone(), { renderOrder: 52 });
  addPlane(root, "SVR_PHASE104_LEFT_SIDE_GLASS_CONNECTED_TO_WALL", [DEPTH, WALL_H - 1.10], [-SIDE_X + .03, (WALL_H / 2) + .08, MID_Z], glass.clone(), { rot: [0, Math.PI * .5, 0], renderOrder: 51 });
  addPlane(root, "SVR_PHASE104_RIGHT_SIDE_GLASS_CONNECTED_TO_WALL", [DEPTH, WALL_H - 1.10], [SIDE_X - .03, (WALL_H / 2) + .08, MID_Z], glass.clone(), { rot: [0, -Math.PI * .5, 0], renderOrder: 51 });
  addPlane(root, "SVR_PHASE104_BACK_WALL_SOFT_GLASS_LAYER", [WALL_W - 3.2, WALL_H - 1.6], [0, (WALL_H / 2) + .04, BACK_Z + .13], glass.clone(), { renderOrder: 49 });
  addGlowLine(root, "SVR_PHASE104_FRONT_GLASS_TOP_GLOW", [WALL_W - .35, .045, .055], [0, WALL_H - .58, FRONT_Z + .08]);
  addGlowLine(root, "SVR_PHASE104_FRONT_GLASS_BOTTOM_GLOW", [WALL_W - .35, .035, .055], [0, .70, FRONT_Z + .08]);

  addPlane(root, "SVR_PHASE104_REIKI_RED_CARPET_MAIN_EXPANDED", [6.50, 11.30], [0, .018, 2.40], carpet, { rot: [-Math.PI * .5, 0, 0], renderOrder: 12 });
  addPlane(root, "SVR_PHASE104_REIKI_RED_CARPET_ENTRY_EXPANDED", [4.85, 6.25], [0, .022, 6.75], carpet.clone(), { rot: [-Math.PI * .5, 0, 0], renderOrder: 13 });
  addGlowLine(root, "SVR_PHASE104_CARPET_LEFT_EDGE", [.04, .04, 12.15], [-3.18, .075, 3.62]);
  addGlowLine(root, "SVR_PHASE104_CARPET_RIGHT_EDGE", [.04, .04, 12.15], [3.18, .075, 3.62]);

  const poleZ = [1.30, 2.50, 3.70, 4.90, 6.10, 7.30];
  const poleX = 3.02;
  const leftPoles = poleZ.map((z, i) => addSilverPole(root, -poleX, z, `L${i + 1}`).position);
  const rightPoles = poleZ.map((z, i) => addSilverPole(root, poleX, z, `R${i + 1}`).position);
  for (let i = 0; i < poleZ.length - 1; i++) { addRope(root, leftPoles[i], leftPoles[i + 1], `LEFT_${i + 1}`); addRope(root, rightPoles[i], rightPoles[i + 1], `RIGHT_${i + 1}`); }

  [[-9.8,-3.30,.86,"insideBackL"],[9.8,-3.30,.86,"insideBackR"],[-8.9,-.55,.80,"insideMidL"],[8.9,-.55,.80,"insideMidR"],[-5.5,-2.55,.74,"interiorL"],[5.5,-2.55,.74,"interiorR"],[-3.85,1.05,.72,"entryInsideL"],[3.85,1.05,.72,"entryInsideR"],[-4.15,6.25,.78,"outerL"],[4.15,6.25,.78,"outerR"]].forEach(([x,z,s,l]) => addPlant(root, x, z, s, l));

  const signMat = new THREE.MeshBasicMaterial({ map: makeCanvasTexture([
    { text: "REIKI / RIKI STOREFRONT", font: "900 54px system-ui,Arial" },
    { text: "HOLOGRAM FACING RED CARPET", font: "700 32px system-ui,Arial" },
    { text: "PRESENTATION ONLY • AWAITING APPROVAL", font: "900 30px system-ui,Arial", color: "#ffb7b7" }
  ], { w: 1300, h: 360, border: "rgba(255,80,80,.78)" }), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  addPlane(root, "SVR_PHASE104_REIKI_HIGH_SIGN_EXPANDED", [5.95, 1.35], [0, 6.48, FRONT_Z + .10], signMat, { renderOrder: 95 });

  const holo = addHologramFacingCarpet(root, scene, FRONT_Z);
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

  log?.("Phase 104 Reiki loaded: expanded glass storefront and hologram positioned facing red carpet.");
  return root;
}
