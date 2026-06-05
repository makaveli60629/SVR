import * as THREE from "three";

const BUILD = "PHASE-123-REIKI-ROTUNDA-SANCTUARY-STOREFRONT-LOCK";
const ANCHOR = new THREE.Vector3(10.21, 0.0, -0.09);
const DEG = Math.PI / 180;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function canvasTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 900;
  c.height = opts.h || 480;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(3,9,14,.96)");
  g.addColorStop(.55, opts.bg1 || "rgba(6,18,24,.92)");
  g.addColorStop(1, opts.bg2 || "rgba(2,32,28,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(0,255,204,.82)";
  x.lineWidth = opts.line || 8;
  x.strokeRect(20, 20, c.width - 40, c.height - 40);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(0,255,204,.55)";
  x.shadowBlur = 16;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 48px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 86, c.width - 74);
  x.shadowBlur = 5;
  x.fillStyle = opts.lineColor || "#dffef9";
  x.font = opts.lineFont || "750 27px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 160) + i * (opts.gap || 42), c.width - 86));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function scanlineTexture() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 512;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y += 10) {
    x.fillStyle = y % 20 === 0 ? "rgba(0,255,204,.22)" : "rgba(255,255,255,.08)";
    x.fillRect(0, y, c.width, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function matrixTexture() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 768;
  const x = c.getContext("2d");
  x.fillStyle = "#001414"; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 850; i++) {
    const a = Math.random() * .55 + .08;
    x.fillStyle = `rgba(0,255,204,${a})`;
    x.fillRect(Math.random() * c.width, Math.random() * c.height, 1 + Math.random() * 3, 8 + Math.random() * 38);
  }
  for (let i = 0; i < 60; i++) {
    x.strokeStyle = `rgba(0,204,255,${.08 + Math.random() * .18})`;
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath();
    x.moveTo(Math.random() * c.width, Math.random() * c.height);
    x.lineTo(Math.random() * c.width, Math.random() * c.height);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function matPanel(tex, opacity = .96) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
}
function matGlow(color = 0x00ffcc, opacity = .45) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function matShell(color = 0x0a1118) {
  return new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .20, emissive: 0x020708, emissiveIntensity: .12 });
}
function matMetal(color = 0x112233) {
  return new THREE.MeshStandardMaterial({ color, roughness: .30, metalness: .62, emissive: 0x001c1a, emissiveIntensity: .12 });
}

function addBox(root, name, size, pos, mat) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  o.name = name; o.position.set(pos[0], pos[1], pos[2]); root.add(o); return o;
}
function addCyl(root, name, radius, height, pos, mat, radial = 48, openEnded = false) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radial, 1, openEnded), mat);
  o.name = name; o.position.set(pos[0], pos[1], pos[2]); root.add(o); return o;
}
function addPlane(root, name, size, pos, mat, rot = [0,0,0], order = 0) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  o.name = name; o.position.set(pos[0], pos[1], pos[2]); o.rotation.set(rot[0], rot[1], rot[2]); o.renderOrder = order; root.add(o); return o;
}

function loadImage(urls) {
  const tex = new THREE.Texture();
  const loader = new THREE.TextureLoader();
  let i = 0;
  const next = () => { if (i >= urls.length) return; loader.load(urls[i++], v => { v.colorSpace = THREE.SRGBColorSpace; v.anisotropy = 8; tex.copy(v); tex.needsUpdate = true; }, undefined, next); };
  next(); return tex;
}

function purgeOldReiki(scene) {
  const remove = [];
  scene.traverse(o => {
    const n = String(o.name || "");
    if (/SVR_PHASE10[1-9].*REIKI|SVR_PHASE11[0-9].*REIKI|SVR_PHASE12[0-2].*REIKI|TRUEITIVE|CHAKRA|FOUNDER_PRESENTATION|reiki-storefront/i.test(n)) remove.push(o);
  });
  let removed = 0;
  remove.forEach(o => { if (o.parent) { o.parent.remove(o); removed++; } });
  document.querySelectorAll("video").forEach(v => {
    const src = String(v.src || v.currentSrc || "").toLowerCase();
    if (src.includes("reiki") || src.includes("hologram")) { try { v.pause(); v.remove(); } catch {} }
  });
  return removed;
}

function buildFrame(root) {
  addBox(root, "SVR_PHASE123_LEFT_BACK_WALL", [2.5, 5.0, .30], [-3.0, 2.5, -1.5], matShell());
  addBox(root, "SVR_PHASE123_RIGHT_BACK_WALL", [2.5, 5.0, .30], [3.0, 2.5, -1.5], matShell());
  addCyl(root, "SVR_PHASE123_LEFT_COLUMN", .12, 5.0, [-4.2, 2.5, -1.4], matMetal(), 32);
  addCyl(root, "SVR_PHASE123_RIGHT_COLUMN", .12, 5.0, [4.2, 2.5, -1.4], matMetal(), 32);
  addBox(root, "SVR_PHASE123_TOP_EMISSIVE_TRIM", [8.4, .08, .14], [0, 4.66, -1.25], matGlow(0x00ffcc, .74));
  addBox(root, "SVR_PHASE123_BOTTOM_EMISSIVE_TRIM", [8.4, .06, .14], [0, .16, -1.25], matGlow(0x00ffcc, .50));
  addPlane(root, "SVR_PHASE123_MAIN_SIGN", [4.15, .62], [0, 4.42, -1.22], matPanel(canvasTexture("REIKI HUB", ["TRUEITIVE.COM", "private sanctuary preview"], { w: 1200, h: 320, titleFont: "900 54px system-ui,Arial", lineFont: "800 28px system-ui,Arial", titleY: 86, startY: 164, gap: 46 })), [0,0,0], 240);
}

function buildRotunda(root, scene, camera, renderer, gotoScene) {
  const rotunda = new THREE.Group();
  rotunda.name = "SVR_PHASE123_CIRCULAR_ROTUNDA";
  rotunda.position.set(0, 0, -1.5);
  root.add(rotunda);

  const floor = addCyl(rotunda, "SVR_PHASE123_ROTUNDA_FLOOR", 1.8, .10, [0, .05, 0], matShell(0x070f15), 96);
  const ceiling = addCyl(rotunda, "SVR_PHASE123_ROTUNDA_CEILING", 1.8, .10, [0, 4.9, 0], matShell(0x070f15), 96);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.79, 128), matGlow(0x00ffcc, .82));
  ring.name = "SVR_PHASE123_ROTUNDA_FLOOR_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .115;
  rotunda.add(ring);

  const pedestal = new THREE.Group();
  pedestal.name = "SVR_PHASE123_CENTER_PEDESTAL";
  rotunda.add(pedestal);
  addCyl(pedestal, "SVR_PHASE123_PEDESTAL_BASE", .70, .20, [0, .10, 0], new THREE.MeshStandardMaterial({ color: 0x050b11, roughness: .4, metalness: .7, emissive: 0x001815, emissiveIntensity: .12 }), 64);
  addCyl(pedestal, "SVR_PHASE123_PEDESTAL_LIGHT_RING", .72, .03, [0, .22, 0], matGlow(0x00ffcc, .92), 64);
  addCyl(pedestal, "SVR_PHASE123_VERTICAL_HOLO_BEAM", .55, 3.0, [0, 1.60, 0], matGlow(0x00ffcc, .055), 64, true);

  const videoMat = new THREE.MeshBasicMaterial({ map: canvasTexture("REIKI MEDIA", ["loading video", "single clean source"], { w: 820, h: 1160, titleY: 190, startY: 330 }), transparent: true, opacity: .90, side: THREE.DoubleSide, depthWrite: false });
  const main = addPlane(pedestal, "SVR_PHASE123_MAIN_REIKI_MEDIA_CANVAS", [1.1, 1.6], [0, 1.65, 0], videoMat, [0,0,0], 260);
  const scan = addPlane(pedestal, "SVR_PHASE123_SCIFI_SCANLINE_OVERLAY", [1.1, 1.6], [0, 1.65, .004], new THREE.MeshBasicMaterial({ map: scanlineTexture(), transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }), [0,0,0], 265);

  const video = document.createElement("video");
  video.src = "/site/assets/video/reiki_hologram.mp4";
  video.loop = true; video.muted = true; video.playsInline = true; video.preload = "metadata"; video.style.display = "none"; video.volume = .36;
  document.body.appendChild(video);
  const unlock = () => { video.muted = false; video.play().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  video.addEventListener("loadeddata", () => video.play().catch(() => {}));
  video.load();
  const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace;

  function panel(name, pos, ryDeg, title, lines, w = 1.2) {
    const g = new THREE.Group(); g.name = `SVR_PHASE123_PANEL_${name}`; g.position.set(pos[0], pos[1], pos[2]); g.rotation.y = ryDeg * DEG; rotunda.add(g);
    addPlane(g, `${g.name}_BACK`, [w, 1.8], [0, 0, -.012], matGlow(0x00ffcc, .16), [0,0,0], 210);
    addPlane(g, `${g.name}_TEXT`, [w - .06, 1.74], [0, 0, .01], matPanel(canvasTexture(title, lines, { w: 720, h: 980, titleFont: "900 45px system-ui,Arial", lineFont: "760 27px system-ui,Arial", titleY: 120, startY: 235, gap: 72 }), .93), [0,0,0], 230);
    return g;
  }

  panel("MASTER_PRACTITIONER", [-1.4, 1.8, .5], 65, "MASTER PRACTITIONER", ["Shyona Royston", "Aura alignment", "Energy flow", "Holistic wellness"], 1.2);
  panel("SERVICES", [-1.5, 1.8, -.6], 25, "SERVICES", ["Distance Reiki", "Chakra Alignment", "Aura Restoration", "Sound Healing"], 1.1);
  panel("BENEFITS", [1.5, 1.8, -.6], -25, "BENEFITS", ["Stress reduction", "Mental clarity", "Vital energy", "Physical recovery"], 1.1);

  const matrix = new THREE.Group(); matrix.name = "SVR_PHASE123_PANEL_ENERGY_MATRIX"; matrix.position.set(1.4, 1.8, .5); matrix.rotation.y = -65 * DEG; rotunda.add(matrix);
  addPlane(matrix, "SVR_PHASE123_MATRIX_BACK", [1.2, 1.8], [0,0,-.012], matShell(0x03090e), [0,0,0], 210);
  addPlane(matrix, "SVR_PHASE123_MATRIX_NOISE", [1.14, 1.74], [0,0,.01], new THREE.MeshBasicMaterial({ map: matrixTexture(), transparent: true, opacity: .86, side: THREE.DoubleSide, depthWrite: false }), [0,0,0], 230);
  addPlane(matrix, "SVR_PHASE123_MATRIX_LABEL", [1.05, .34], [0, .75, .035], matPanel(canvasTexture("VIBRATIONAL HARMONY", [], { w: 700, h: 170, titleFont: "900 30px system-ui,Arial", titleY: 82, line: 5 }), .96), [0,0,0], 240);

  const portal = new THREE.Group(); portal.name = "SVR_PHASE123_PRIVATE_SANCTUARY_PORTAL"; portal.position.set(0, 1.4, -1.65); rotunda.add(portal);
  const portalSurface = addPlane(portal, "SVR_PHASE123_PORTAL_CLICK_SURFACE", [1.30, 2.20], [0,0,.012], matGlow(0x00ccff, .26), [0,0,0], 250);
  portalSurface.userData.activate = () => { if (gotoScene?.("reikiRoom")) return; window.location.href = "./reiki.html?v=phase123-sanctuary"; };
  addPlane(portal, "SVR_PHASE123_PORTAL_BACK", [1.40, 2.30], [0,0,0], new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false }), [0,0,0], 240);
  addPlane(portal, "SVR_PHASE123_PORTAL_TEXT", [1.22, .72], [0, .05, .03], matPanel(canvasTexture("ENTER PRIVATE SANCTUARY", ["[ REIKI ROOM ]"], { w: 820, h: 300, titleFont: "900 36px system-ui,Arial", lineFont: "900 34px system-ui,Arial", titleY: 90, startY: 178, border: "rgba(0,204,255,.84)" }), .96), [0,0,0], 260);
  addBox(portal, "SVR_PHASE123_PORTAL_LEFT_BAR", [.04, 2.24, .04], [-.67, 0, .02], matGlow(0x00ccff, .84));
  addBox(portal, "SVR_PHASE123_PORTAL_RIGHT_BAR", [.04, 2.24, .04], [.67, 0, .02], matGlow(0x00ccff, .84));
  addBox(portal, "SVR_PHASE123_PORTAL_TOP_BAR", [1.38, .04, .04], [0, 1.12, .02], matGlow(0x00ccff, .84));

  const clickable = [portalSurface];
  if (renderer?.domElement && camera) {
    const ray = new THREE.Raycaster(); const p = new THREE.Vector2();
    renderer.domElement.addEventListener("pointerdown", e => {
      const rect = renderer.domElement.getBoundingClientRect();
      p.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      p.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      ray.setFromCamera(p, camera);
      const hit = ray.intersectObjects(clickable, true)[0];
      if (hit?.object?.userData?.activate) hit.object.userData.activate();
    }, { passive: true });
  }

  const camWorld = new THREE.Vector3(); const mediaWorld = new THREE.Vector3();
  rotunda.userData.tick = t => {
    if (video.readyState >= 2 && videoMat.map !== vt) { videoMat.map = vt; videoMat.needsUpdate = true; }
    main.getWorldPosition(mediaWorld);
    const cam = scene.userData._camera; if (cam?.getWorldPosition) cam.getWorldPosition(camWorld);
    const d = camWorld.distanceTo(mediaWorld);
    video.volume = clamp(d < 7.5 ? .42 + ((7.5 - d) / 6.0) * .45 : .10, .08, .87);
    scan.material.opacity = .11 + Math.sin(t * .004) * .045;
    ring.rotation.z = t * .00018;
    pedestal.rotation.y = Math.sin(t * .00025) * .035;
  };
  return rotunda;
}

function buildDecor(root) {
  const potMat = new THREE.MeshStandardMaterial({ color: 0x182533, roughness: .60, metalness: .08 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: .90, side: THREE.DoubleSide, emissive: 0x062714, emissiveIntensity: .10 });
  [[-3.2, -.6, "LEFT"], [3.2, -.6, "RIGHT"]].forEach(([x,z,label]) => {
    const g = new THREE.Group(); g.name = `SVR_PHASE123_SANCTUARY_PLANT_${label}`; g.position.set(x, 0, z); root.add(g);
    addCyl(g, `SVR_PHASE123_PLANT_POT_${label}`, .16, .35, [0, .175, 0], potMat, 24);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.22, .55, 24), leafMat);
    cone.name = `SVR_PHASE123_PLANT_CONE_${label}`; cone.position.y = .625; g.add(cone);
  });
}

export function applyReikiPhase123RotundaSanctuary(scene, { log = console.log, gotoScene = null, camera = null, renderer = null } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE123_REIKI_ROTUNDA_SANCTUARY_LOCK")) return null;
  const removed = purgeOldReiki(scene);
  const root = new THREE.Group();
  root.name = "SVR_PHASE123_REIKI_ROTUNDA_SANCTUARY_LOCK";
  root.position.copy(ANCHOR);
  root.rotation.set(0, 0, 0);
  scene.add(root);
  buildFrame(root);
  buildRotunda(root, scene, camera, renderer, gotoScene);
  buildDecor(root);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    root.getObjectByName("SVR_PHASE123_CIRCULAR_ROTUNDA")?.userData?.tick?.(t);
  };

  const oldPanel = document.getElementById("svr-position-panel"); if (oldPanel) oldPanel.remove();
  const panel = document.createElement("div");
  panel.id = "svr-position-panel";
  panel.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:335px;background:rgba(0,0,0,.74);border:1px solid rgba(0,255,204,.68);border-radius:12px;padding:10px 12px;color:#dffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(panel);
  const panelTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    panelTick?.apply(this, args);
    const cam = scene.userData._camera; const p = cam?.position || { x:0, y:0, z:0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nAnchor X ${ANCHOR.x.toFixed(2)} Y ${ANCHOR.y.toFixed(2)} Z ${ANCHOR.z.toFixed(2)}\nCamera X ${p.x.toFixed(2)} Y ${p.y.toFixed(2)} Z ${p.z.toFixed(2)}\nCircular rotunda sanctuary active\nDepth locked to -1.75m compact footprint\nNo gaming logic inside Reiki footprint\nOld Reiki objects removed: ${removed}`;
  };

  window.SVR_PHASE123_REIKI_ROTUNDA = { build: BUILD, anchor: ANCHOR.toArray(), removed, noGamingLogic: true };
  scene.userData.SVR_PHASE123_REIKI_ROTUNDA = window.SVR_PHASE123_REIKI_ROTUNDA;
  log?.("Phase 123 Reiki rotunda sanctuary loaded", window.SVR_PHASE123_REIKI_ROTUNDA);
  return root;
}
