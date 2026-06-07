import * as THREE from "three";

const BUILD = "PHASE-101-REIKI-PRESENTATION-SHOWCASE-LOCK";

function tex(title, sub = "", w = 1024, h = 420, opts = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, opts.bg0 || "#02070a");
  g.addColorStop(0.55, opts.bg1 || "#19042b");
  g.addColorStop(1, opts.bg2 || "#031c19");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = opts.border || "rgba(140,255,242,.92)";
  x.lineWidth = opts.line || 9;
  x.strokeRect(18, 18, w - 36, h - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = opts.shadow || "rgba(140,255,242,.64)";
  x.shadowBlur = 20;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 62px system-ui,Segoe UI,Arial";
  x.fillText(title, w / 2, h * 0.32, w - 80);
  x.shadowBlur = 8;
  x.fillStyle = opts.subColor || "#bafff2";
  x.font = opts.subFont || "700 30px system-ui,Segoe UI,Arial";
  String(sub).split("\n").forEach((line, i) => x.fillText(line, w / 2, h * 0.58 + i * 42, w - 90));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function panel(title, sub, W = 2.8, H = 1.0, opts = {}) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: tex(title, sub, opts.w || 1024, opts.h || 420, opts), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
}

function glass(color = 0x82fff0, opacity = 0.15) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.06, metalness: 0.2, emissive: color, emissiveIntensity: 0.25, side: THREE.DoubleSide, depthWrite: false });
}

function addPortal(root, title, sub, key, pos, ry, gotoScene) {
  const g = new THREE.Group();
  g.name = "SVR_UPDATE3_PORTAL_" + key;
  g.position.copy(pos);
  g.rotation.y = ry;
  root.add(g);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.05), glass(0x8ffff2, 0.17));
  back.position.set(0, 1.75, 0);
  g.add(back);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.025, 12, 96), new THREE.MeshBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.position.set(0, 1.55, 0.035);
  g.add(ring);
  const sign = panel(title, sub, 2.7, 0.78);
  sign.position.set(0, 3.46, 0.06);
  g.add(sign);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x061010, metalness: 0.75, roughness: 0.28, emissive: 0x0b746c, emissiveIntensity: 0.35 }));
  base.position.set(0, 0.04, 0.04);
  g.add(base);
  const light = new THREE.PointLight(0x8ffff2, 0.7, 5, 2);
  light.position.set(0, 1.8, 0.45);
  g.add(light);
  g.userData.tick = (t) => { ring.rotation.z = t * 0.00075; light.intensity = 0.55 + Math.sin(t * 0.002) * 0.22; };
  g.userData.activate = () => gotoScene?.(key);
  return g;
}

function addButtons(gotoScene) {
  const nav = document.getElementById("sceneNav");
  if (!nav) return;
  [["reikiTalk", "Reiki Talk"], ["pgaDrive", "PGA Drive"], ["chipPutt", "Chip/Putt"], ["vrStore", "VR Store"], ["smokerLounge", "Smoker"], ["scorpionRoom", "Scorpion Room"]].forEach(([key, label]) => {
    if (nav.querySelector(`[data-scene="${key}"]`)) return;
    const b = document.createElement("button");
    b.className = "scene-btn";
    b.dataset.scene = key;
    b.textContent = label;
    b.addEventListener("click", () => gotoScene?.(key));
    nav.appendChild(b);
  });
}

function addClick(scene, camera, renderer) {
  const rc = new THREE.Raycaster();
  const p = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    p.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    p.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    rc.setFromCamera(p, camera);
    for (const h of rc.intersectObjects(scene.children, true)) {
      let o = h.object;
      while (o) {
        if (o.userData?.activate) { o.userData.activate(); return; }
        o = o.parent;
      }
    }
  }, { passive: true });
}

function addPositionPanel(camera, sceneTargets = {}) {
  if (document.getElementById("svr-position-panel")) return null;
  const el = document.createElement("div");
  el.id = "svr-position-panel";
  el.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:230px;background:rgba(0,0,0,.68);border:1px solid rgba(140,255,242,.62);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(el);
  const targetKeys = Object.keys(sceneTargets).sort().join(", ");
  return { tick() { const p = camera.position; el.textContent = `SVR POSITION PANEL\nBUILD ${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nTargets: ${targetKeys || "loading"}`; } };
}

function loadTexture(urls) {
  const loader = new THREE.TextureLoader();
  let idx = 0;
  const tex = new THREE.Texture();
  const tryNext = () => {
    if (idx >= urls.length) return;
    loader.load(urls[idx++], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      tex.copy(loaded);
      tex.needsUpdate = true;
    }, undefined, tryNext);
  };
  tryNext();
  return tex;
}

function addChakraMedallions(root) {
  const labels = ["ROOT", "SACRAL", "SOLAR", "HEART", "THROAT", "THIRD EYE", "CROWN"];
  const colors = [0xff3348, 0xff8a2d, 0xffd447, 0x39e874, 0x38c9ff, 0x7270ff, 0xd696ff];
  const group = new THREE.Group();
  group.name = "SVR_PHASE101_CHAKRA_WALL_MEDALLIONS";
  group.position.set(0, 2.05, -2.36);
  root.add(group);
  labels.forEach((label, i) => {
    const x = -5.4 + i * 1.8;
    const mat = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const disk = new THREE.Mesh(new THREE.CircleGeometry(0.46, 48), mat);
    disk.position.set(x, 0, 0.04);
    disk.renderOrder = 70;
    group.add(disk);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.018, 8, 64), mat.clone());
    ring.position.set(x, 0, 0.055);
    group.add(ring);
    const tag = panel(label, "energy focus", 1.05, 0.34, { w: 640, h: 220, titleFont: "900 44px system-ui,Arial", subFont: "700 24px system-ui,Arial", border: "rgba(255,255,255,.45)", bg0: "rgba(0,0,0,.78)", bg1: "rgba(0,0,0,.52)", bg2: "rgba(0,0,0,.78)" });
    tag.position.set(x, -0.72, 0.06);
    group.add(tag);
  });
  group.userData.tick = (t) => {
    group.children.forEach((o, i) => {
      if (o.material?.opacity && o.name !== "") o.material.opacity = 0.54 + Math.sin(t * 0.002 + i) * 0.10;
    });
  };
  return group;
}

function addPresentationShowcase(scene) {
  if (scene.getObjectByName("SVR_PHASE101_REIKI_PRESENTATION_SHOWCASE")) return null;
  const R = 24;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.02, Math.sin(angle) * (R - 4.05));
  const root = new THREE.Group();
  root.name = "SVR_PHASE101_REIKI_PRESENTATION_SHOWCASE";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const logoTex = loadTexture(["./assets/ui/trueitive-logo.png", "../game/assets/ui/trueitive-logo.png"]);
  const founderTex = loadTexture(["./assets/ui/trueitive-founder.png", "../game/assets/ui/trueitive-founder.png"]);

  const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.52, 1.20), logoMat);
  logo.name = "SVR_PHASE101_TRUEITIVE_LOGO_HOLOGRAM";
  logo.position.set(0, 4.18, 0.94);
  logo.renderOrder = 95;
  root.add(logo);

  const logoGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.55), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  logoGlow.position.set(0, 4.18, 0.91);
  root.add(logoGlow);

  const founderMat = new THREE.MeshBasicMaterial({ map: founderTex, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide });
  const founder = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.26), founderMat);
  founder.name = "SVR_PHASE101_FOUNDER_PRESENTATION_PORTRAIT";
  founder.position.set(-6.78, 3.05, -2.28);
  founder.renderOrder = 82;
  root.add(founder);
  const founderLabel = panel("FOUNDER PREVIEW", "presentation only\nawaiting approval", 1.7, 0.72, { titleFont: "900 38px system-ui,Arial", subFont: "700 22px system-ui,Arial", border: "rgba(255,80,80,.75)", bg0: "rgba(38,4,8,.92)", bg1: "rgba(10,2,8,.80)", bg2: "rgba(0,12,14,.86)" });
  founderLabel.position.set(-6.78, 1.92, -2.24);
  root.add(founderLabel);

  const info = [
    ["TRUEITIVE", "Holistic Healing & Wellness\nrelease • relax • rejuvenate", -4.65, 3.35],
    ["MASSAGE", "intuitive massage therapy\nwellness presentation preview", -1.55, 3.35],
    ["REIKI", "energy healing preview\nrelaxation • balance • peace", 1.55, 3.35],
    ["MEDITATION", "mindful support\nholistic nutrition preview", 4.65, 3.35],
    ["GROUP EXPERIENCES", "private wellness room concept\ncorporate / community preview", -3.10, 1.18],
    ["BOOKING PREVIEW", "approval pending\nno live pricing or claims", 3.10, 1.18]
  ];
  info.forEach(([title, sub, x, y]) => {
    const p = panel(title, sub, 2.55, 1.03, { titleFont: "900 46px system-ui,Arial", subFont: "700 24px system-ui,Arial", border: "rgba(140,255,242,.82)" });
    p.position.set(x, y, -2.34);
    p.renderOrder = 80;
    root.add(p);
  });

  const chakra = addChakraMedallions(root);

  const slides = [
    tex("TRUEITIVE", "Holistic Healing & Wellness\nPresentation preview • Awaiting approval", 1024, 520),
    tex("REIKI ENERGY", "gentle relaxation-focused showcase\nno medical outcome claims", 1024, 520),
    tex("BOOKING FLOW", "future inquiry and scheduling path\napproval pending", 1024, 520),
    tex("SVR WELLNESS HUB", "private room • hologram • store preview\nmodular sponsor-ready design", 1024, 520)
  ];
  const slideMat = new THREE.MeshBasicMaterial({ map: slides[0], transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const slide = new THREE.Mesh(new THREE.PlaneGeometry(3.42, 1.55), slideMat);
  slide.name = "SVR_PHASE101_TRUEITIVE_BANNER_SLIDESHOW";
  slide.position.set(0, 2.28, 0.92);
  slide.renderOrder = 88;
  root.add(slide);

  const approval = panel("AWAITING APPROVAL", "presentation mockup only\ncontent removable / modular", 3.3, 0.78, { titleFont: "900 48px system-ui,Arial", subFont: "700 24px system-ui,Arial", border: "rgba(255,80,80,.82)", bg0: "rgba(50,0,0,.88)", bg1: "rgba(18,0,10,.82)", bg2: "rgba(0,10,12,.82)", titleColor: "#ffffff", subColor: "#ffc9c9" });
  approval.position.set(0, 0.92, 0.94);
  root.add(approval);

  const light = new THREE.PointLight(0x8ffff0, 0.86, 9, 2.2);
  light.position.set(0, 3.2, 1.15);
  root.add(light);

  root.userData.tick = (t) => {
    const idx = Math.floor(t / 5200) % slides.length;
    if (slideMat.map !== slides[idx]) { slideMat.map = slides[idx]; slideMat.needsUpdate = true; }
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0022);
    logoGlow.material.opacity = 0.09 + pulse * 0.10;
    logo.position.y = 4.18 + Math.sin(t * 0.0016) * 0.035;
    light.intensity = 0.70 + pulse * 0.34;
    chakra?.userData?.tick?.(t);
  };
  return root;
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

function addSkyFallback(scene) {
  if (scene.getObjectByName("SVR_PHASE101_HIGH_MOON_MARS_SHOWCASE_LOCK")) return null;
  const g = new THREE.Group();
  g.name = "SVR_PHASE101_HIGH_MOON_MARS_SHOWCASE_LOCK";
  scene.add(g);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.1, 56, 28), new THREE.MeshBasicMaterial({ map: planetTexture("moon") }));
  moon.position.set(-24, 46, -74);
  moon.name = "SVR_PHASE101_HIGH_TEXTURED_MOON";
  g.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 24), new THREE.MeshBasicMaterial({ map: planetTexture("mars") }));
  mars.position.set(27, 39, -82);
  mars.name = "SVR_PHASE101_HIGH_TEXTURED_MARS";
  g.add(mars);
  const glow = new THREE.PointLight(0xded4bd, 0.52, 135, 2.1);
  glow.position.copy(moon.position);
  g.add(glow);
  g.userData.tick = (dt = 0.016) => { moon.rotation.y += 0.10 * dt; mars.rotation.y += 0.17 * dt; };
  return g;
}

export function applyUpdate30PresentMoment({ scene, camera, renderer, sceneTargets = {}, setStatus, log, gotoScene }) {
  if (!scene || scene.userData.SVR_UPDATE30_LOCK) return scene?.userData?.SVR_UPDATE30_LOCK;
  sceneTargets.reikiRoom = sceneTargets.reikiRoom || { href: "./reiki.html?v=update3" };
  sceneTargets.reikiTalk = sceneTargets.reikiTalk || { href: "./reiki.html?mode=hologram&v=update3" };
  sceneTargets.pgaDrive = sceneTargets.pgaDrive || { href: "./pga-drive.html?v=update3" };
  sceneTargets.chipPutt = sceneTargets.chipPutt || { href: "./chip-putt.html?v=update3" };
  sceneTargets.vrStore = sceneTargets.vrStore || { href: "./store-room.html?v=update3" };
  sceneTargets.smokerLounge = sceneTargets.smokerLounge || { href: "./smoker-lounge.html?v=update3" };
  sceneTargets.scorpionRoom = sceneTargets.scorpionRoom || { href: "./scorpion.html?v=update3" };

  const root = new THREE.Group(); root.name = "SVR_UPDATE3_PRESENT_MOMENT_ROOT"; scene.add(root);
  const posPanel = addPositionPanel(camera, sceneTargets);
  const showcase = addPresentationShowcase(scene);
  const sky = addSkyFallback(scene);
  const layers = [showcase, sky, posPanel];

  const portals = new THREE.Group(); portals.name = "SVR_UPDATE3_STOREFRONT_PORTALS"; scene.add(portals);
  addPortal(portals, "REIKI ROOM", "private meditation", "reikiRoom", new THREE.Vector3(5.55, 0, -3.35), -1.05, gotoScene);
  addPortal(portals, "REIKI TALK", "hologram stage", "reikiTalk", new THREE.Vector3(5.55, 0, -0.80), -1.15, gotoScene);
  addPortal(portals, "PGA DRIVE", "private range", "pgaDrive", new THREE.Vector3(-5.55, 0, -3.10), 1.05, gotoScene);
  addPortal(portals, "CHIP + PUTT", "short game", "chipPutt", new THREE.Vector3(-5.55, 0, -0.52), 1.15, gotoScene);
  addPortal(portals, "VR STORE", "web portal", "vrStore", new THREE.Vector3(0, 0, -6.35), 0, gotoScene);
  addPortal(portals, "SMOKER", "social lounge", "smokerLounge", new THREE.Vector3(3.55, 0, 5.25), Math.PI, gotoScene);
  addPortal(portals, "SCORPION", "private poker", "scorpionRoom", new THREE.Vector3(-3.55, 0, 5.25), Math.PI, gotoScene);
  const header = panel("SVR UPDATE 3.0", "Phase 101 Reiki presentation showcase", 4.2, 0.85);
  header.position.set(0, 4.3, -6.4);
  scene.add(header);
  layers.push(portals);

  addButtons(gotoScene);
  addClick(scene, camera, renderer);
  const old = scene.onBeforeRender;
  scene.onBeforeRender = function (...args) {
    old?.apply(this, args);
    const t = performance.now();
    layers.forEach(l => l?.userData?.tick?.(t) || l?.tick?.(t));
    portals.children.forEach(p => p.userData?.tick?.(t));
    sky?.userData?.tick?.(1 / 60);
  };

  const lock = { build: BUILD, sceneTargets };
  scene.userData.SVR_UPDATE30_LOCK = lock;
  window.SVR_UPDATE30_LOCK = lock;
  setStatus?.("Phase 101 ready: Reiki presentation showcase, logo hologram, service panels, chakra wall, approval-safe gallery.", { force: true });
  log?.("Phase 101 Reiki presentation showcase loaded", BUILD);
  return lock;
}
