import * as THREE from "three";

const BUILD = "PHASE-107-REIKI-STORE-VISIBLE-GLASS-FACADE-LOCK";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function textTexture(title, sub = "") {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 430;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(3,10,12,.94)");
  g.addColorStop(.55, "rgba(22,4,36,.88)");
  g.addColorStop(1, "rgba(3,30,24,.90)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(145,255,240,.95)";
  x.lineWidth = 10;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(145,255,240,.75)";
  x.shadowBlur = 22;
  x.fillStyle = "#fff";
  x.font = "900 62px system-ui,Arial";
  x.fillText(title, c.width / 2, 145, c.width - 90);
  x.fillStyle = "#cafff8";
  x.font = "800 33px system-ui,Arial";
  String(sub).split("\n").forEach((line, i) => x.fillText(line, c.width / 2, 245 + i * 48, c.width - 90));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  root.add(m);
  return m;
}

function addPlane(root, name, size, pos, material, rotationY = 0, rotationX = 0, renderOrder = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  m.name = name;
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.y = rotationY;
  m.rotation.x = rotationX;
  m.renderOrder = renderOrder;
  root.add(m);
  return m;
}

function addPole(root, x, z, label) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: .92, roughness: .18, emissive: 0x151515, emissiveIntensity: .08 });
  const group = new THREE.Group();
  group.name = `SVR_PHASE107_POLE_${label}`;
  group.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 1.12, 22), silver);
  stem.position.y = .58;
  group.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.19, .24, .07, 32), silver);
  base.position.y = .035;
  group.add(base);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.11, 22, 12), silver);
  cap.position.y = 1.18;
  group.add(cap);
  root.add(group);
  return group.position;
}

function addRope(root, a, b, label) {
  const red = new THREE.MeshStandardMaterial({ color: 0xb4001f, roughness: .34, metalness: .04, emissive: 0x5a0010, emissiveIntensity: .40 });
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const geo = new THREE.CylinderGeometry(.048, .048, len, 18);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, red);
  mesh.name = `SVR_PHASE107_ROPE_${label}`;
  mesh.position.set((a.x + b.x) / 2, 1.08, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(dz, dx);
  root.add(mesh);
  return mesh;
}

function addPlant(root, x, z, scale = 1, label = "") {
  const group = new THREE.Group();
  group.name = `SVR_PHASE107_PLANT_${label}`;
  group.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18 * scale, .26 * scale, .36 * scale, 24), new THREE.MeshStandardMaterial({ color: 0x4a1518, roughness: .82 }));
  pot.position.y = .18 * scale;
  group.add(pot);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x1d743b, roughness: .65, emissive: 0x062714, emissiveIntensity: .18, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.10 * scale, 12, 8), leafMaterial);
    leaf.scale.set(.55, 2.0, .13);
    const angle = i / 8 * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * .13 * scale, .62 * scale + (i % 3) * .06 * scale, Math.sin(angle) * .13 * scale);
    leaf.rotation.set(.6, angle, i % 2 ? .35 : -.35);
    group.add(leaf);
  }
  root.add(group);
  return group;
}

function makeVideoPanel(scene) {
  const material = new THREE.MeshBasicMaterial({ map: textTexture("REIKI HOLOGRAM", "tap once to unlock audio\nsingle video player"), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 2.45), material);
  mesh.name = "SVR_PHASE107_SINGLE_HOLOGRAM_VIDEO";
  mesh.renderOrder = 240;
  const video = document.createElement("video");
  video.src = "/site/assets/video/reiki_hologram.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.display = "none";
  video.volume = .5;
  document.body.appendChild(video);
  const unlock = () => { video.muted = false; video.play().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  video.addEventListener("loadeddata", () => video.play().catch(() => {}));
  video.load();
  const vt = new THREE.VideoTexture(video);
  vt.colorSpace = THREE.SRGBColorSpace;
  const cameraWorld = new THREE.Vector3();
  const meshWorld = new THREE.Vector3();
  mesh.userData.tick = () => {
    if (video.readyState >= 2 && material.map !== vt) { material.map = vt; material.needsUpdate = true; }
    const cam = scene.userData._camera;
    if (cam?.getWorldPosition) cam.getWorldPosition(cameraWorld);
    mesh.getWorldPosition(meshWorld);
    const dist = cameraWorld.distanceTo(meshWorld);
    video.volume = clamp(dist < 8 ? .50 + ((8 - dist) / 6.7) * .45 : .16, .12, .95);
  };
  return mesh;
}

function addChakraSymbols(root, z) {
  const group = new THREE.Group();
  group.name = "SVR_PHASE107_VISIBLE_CHAKRA_SYMBOLS";
  group.position.set(0, 4.25, z);
  root.add(group);
  const colors = [0xff3148, 0xff8a2d, 0xffd447, 0x36e875, 0x38c9ff, 0x7270ff, 0xd696ff];
  colors.forEach((color, i) => {
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.50, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .82, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    disk.position.set(-5.4 + i * 1.8, 0, .08);
    disk.renderOrder = 230;
    group.add(disk);
  });
  return group;
}

function addPositionPanel(scene) {
  const old = document.getElementById("svr-position-panel");
  if (old) old.remove();
  const panel = document.createElement("div");
  panel.id = "svr-position-panel";
  panel.style.cssText = "position:fixed;right:12px;top:64px;z-index:20;min-width:280px;background:rgba(0,0,0,.74);border:1px solid rgba(140,255,242,.68);border-radius:12px;padding:10px 12px;color:#cffff8;font:12px/1.35 ui-monospace,monospace;white-space:pre;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none";
  document.body.appendChild(panel);
  return { tick() {
    const cam = scene.userData._camera;
    const p = cam?.position || { x: 0, y: 0, z: 0 };
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nX ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\nStore visible: no black wall\nHologram at front center`;
  }};
}

export function enhanceReikiStorefront3(scene, { roomRadius = 24, log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE107_REIKI_STORE_VISIBLE_LOCK")) return null;
  const root = new THREE.Group();
  root.name = "SVR_PHASE107_REIKI_STORE_VISIBLE_LOCK";
  root.position.set(roomRadius - 4.05, .012, 0);
  root.lookAt(root.position.clone().add(new THREE.Vector3(-1, 0, 0)));
  scene.add(root);

  const glass = new THREE.MeshStandardMaterial({ color: 0xa7fff7, transparent: true, opacity: .24, emissive: 0x1b7d78, emissiveIntensity: .45, side: THREE.DoubleSide, depthWrite: false });
  const trim = new THREE.MeshStandardMaterial({ color: 0xd2d8dd, metalness: .88, roughness: .18, emissive: 0x1b2d30, emissiveIntensity: .28 });
  const carpet = new THREE.MeshStandardMaterial({ color: 0xa5001f, roughness: .84, metalness: .02, emissive: 0x340008, emissiveIntensity: .30, side: THREE.DoubleSide });

  const W = 18.0, H = 6.80, F = -4.55, B = 2.10, S = W / 2, GAP = 4.80;
  const GW = (W - GAP) / 2;
  const LX = -(GAP / 2 + GW / 2), RX = (GAP / 2 + GW / 2), MID = (F + B) / 2;

  // Glass-only facade. No opaque back wall, so the existing store remains visible.
  addBox(root, "SVR_PHASE107_TOP_HEADER", [W, .28, .38], [0, H, F], trim);
  addBox(root, "SVR_PHASE107_BOTTOM_TRACK", [W, .10, .30], [0, .36, F], trim);
  addBox(root, "SVR_PHASE107_LEFT_FRAME", [.25, H, .38], [-S, H / 2, F], trim);
  addBox(root, "SVR_PHASE107_RIGHT_FRAME", [.25, H, .38], [S, H / 2, F], trim);
  addBox(root, "SVR_PHASE107_LEFT_ENTRY_POST", [.20, H - .60, .38], [-GAP / 2, H / 2, F], trim);
  addBox(root, "SVR_PHASE107_RIGHT_ENTRY_POST", [.20, H - .60, .38], [GAP / 2, H / 2, F], trim);

  addPlane(root, "SVR_PHASE107_FRONT_GLASS_LEFT", [GW, H - 1.0], [LX, H / 2 + .08, F + .03], glass, 0, 0, 90);
  addPlane(root, "SVR_PHASE107_FRONT_GLASS_RIGHT", [GW, H - 1.0], [RX, H / 2 + .08, F + .03], glass.clone(), 0, 0, 90);
  addPlane(root, "SVR_PHASE107_LEFT_SIDE_GLASS", [B - F, H - 1.0], [-S + .04, H / 2 + .08, MID], glass.clone(), Math.PI / 2, 0, 89);
  addPlane(root, "SVR_PHASE107_RIGHT_SIDE_GLASS", [B - F, H - 1.0], [S - .04, H / 2 + .08, MID], glass.clone(), -Math.PI / 2, 0, 89);

  addPlane(root, "SVR_PHASE107_RED_CARPET", [6.1, 12.8], [0, .02, -1.0], carpet, 0, -Math.PI / 2, 12);
  const zs = [-4.35, -3.1, -1.85, -.6, .65, 1.9];
  const left = zs.map((z, i) => addPole(root, -2.9, z, `L${i + 1}`));
  const right = zs.map((z, i) => addPole(root, 2.9, z, `R${i + 1}`));
  for (let i = 0; i < zs.length - 1; i++) { addRope(root, left[i], left[i + 1], `L${i}`); addRope(root, right[i], right[i + 1], `R${i}`); }

  [[-7.4, 1.5], [7.4, 1.5], [-6.4, -1.4], [6.4, -1.4], [-3.7, -4.1], [3.7, -4.1], [-3.5, -6.4], [3.5, -6.4]].forEach(([x, z], i) => addPlant(root, x, z, 1, `P${i}`));

  addPlane(root, "SVR_PHASE107_SIGN", [5.8, 1.20], [0, 6.45, F + .12], new THREE.MeshBasicMaterial({ map: textTexture("REIKI / RIKI STOREFRONT", "STORE VISIBLE • GLASS ONLY\nAWAITING APPROVAL"), transparent: true, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 200);

  const holo = new THREE.Group();
  holo.name = "SVR_PHASE107_HOLOGRAM_FRONT_CENTER";
  holo.position.set(0, 0, F - .25);
  holo.rotation.y = Math.PI;
  root.add(holo);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.82, 1.25, .2, 64), new THREE.MeshStandardMaterial({ color: 0x061315, emissive: 0x0b8178, emissiveIntensity: .55, metalness: .84, roughness: .22 }));
  base.position.y = .62;
  holo.add(base);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.24, .95, 3.1, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 1.85;
  holo.add(beam);
  const video = makeVideoPanel(scene);
  video.position.set(0, 2.1, .16);
  holo.add(video);

  const chakra = addChakraSymbols(root, B - .20);
  const posPanel = addPositionPanel(scene);
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    video.userData.tick?.(t);
    posPanel.tick?.(t);
    if (chakra) chakra.rotation.z = Math.sin(t * .001) * .01;
  };

  window.SVR_PHASE107_REIKI_LOCK = BUILD;
  log?.("Phase 107 Reiki visible storefront loaded: no opaque wall, glass-only facade, hologram front center.");
  return root;
}
