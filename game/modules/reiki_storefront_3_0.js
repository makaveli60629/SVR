import * as THREE from "three";

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
    const y = 95 + idx * 86;
    x.fillStyle = line.color || (idx === 0 ? title : (line.accent ? accent : "#c9fff5"));
    x.font = line.font || (idx === 0 ? "bold 58px system-ui, Arial" : "bold 40px system-ui, Arial");
    x.fillText(line.text, width / 2, y);
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

function addSilverPole(root, x, z, label = "") {
  const silver = new THREE.MeshStandardMaterial({
    color: 0xd7d7d7,
    roughness: 0.24,
    metalness: 0.82,
    emissive: 0x101014,
    emissiveIntensity: 0.08
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xf1f1f1,
    roughness: 0.18,
    metalness: 0.92,
    emissive: 0x1c1c22,
    emissiveIntensity: 0.10
  });

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
  const redRopeMat = new THREE.MeshStandardMaterial({
    color: 0xb5001f,
    roughness: 0.42,
    metalness: 0.03,
    emissive: 0x40000c,
    emissiveIntensity: 0.32
  });

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

export function enhanceReikiStorefront3(scene, {
  roomRadius = 24,
  wallHeight = 16,
  log = console.log
} = {}) {
  if (!scene || scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK) return null;
  scene.userData.SVR_UPDATE3_REIKI_STOREFRONT_LOCK = true;

  const R = roomRadius;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.012, Math.sin(angle) * (R - 4.05));

  const root = new THREE.Group();
  root.name = "SVR_UPDATE3_REIKI_EXPANDED_GLASS_WALL_RED_CARPET_ROPE_LOCK";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x11161b,
    roughness: 0.30,
    metalness: 0.38,
    emissive: 0x10242b,
    emissiveIntensity: 0.22
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xcfd6dc,
    roughness: 0.20,
    metalness: 0.78,
    emissive: 0x1b2d30,
    emissiveIntensity: 0.26
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9dfff6,
    transparent: true,
    opacity: 0.16,
    roughness: 0.02,
    metalness: 0.15,
    emissive: 0x1b7d78,
    emissiveIntensity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const redCarpetMat = new THREE.MeshStandardMaterial({
    color: 0xa5001f,
    roughness: 0.86,
    metalness: 0.02,
    emissive: 0x340008,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x07090c,
    roughness: 0.72,
    metalness: 0.12,
    emissive: 0x061318,
    emissiveIntensity: 0.18
  });

  addBox(root, "SVR_UPDATE3_REIKI_EXPANDED_BACK_WALL", [16.8, 6.65, 0.20], [0, 3.28, -2.54], wallMat);
  addBox(root, "SVR_UPDATE3_REIKI_LEFT_GLASS_SIDE_FRAME", [0.22, 5.65, 5.92], [-8.28, 2.82, -0.56], frameMat);
  addBox(root, "SVR_UPDATE3_REIKI_RIGHT_GLASS_SIDE_FRAME", [0.22, 5.65, 5.92], [8.28, 2.82, -0.56], frameMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_SILVER_HEADER", [16.9, 0.18, 0.28], [0, 5.85, 0.96], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_TOP_BACK_HEADER", [16.9, 0.18, 0.28], [0, 5.85, -2.60], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_LEFT_SILVER_COLUMN", [0.18, 5.7, 0.32], [-8.34, 2.86, 0.96], trimMat);
  addBox(root, "SVR_UPDATE3_REIKI_RIGHT_SILVER_COLUMN", [0.18, 5.7, 0.32], [8.34, 2.86, 0.96], trimMat);

  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_LEFT_EXPANDED", [4.95, 4.36], [-5.65, 2.62, 0.88], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_FRONT_GLASS_RIGHT_EXPANDED", [4.95, 4.36], [5.65, 2.62, 0.88], glassMat, { renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_LEFT_SIDE_GLASS_EXPANDED", [5.80, 4.48], [-8.22, 2.58, -0.56], glassMat, { rot: [0, Math.PI * 0.5, 0], renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_RIGHT_SIDE_GLASS_EXPANDED", [5.80, 4.48], [8.22, 2.58, -0.56], glassMat, { rot: [0, -Math.PI * 0.5, 0], renderOrder: 35 });
  addPlane(root, "SVR_UPDATE3_REIKI_REAR_GLASS_SOFT_GLOW", [12.8, 4.8], [0, 2.72, -2.42], glassMat.clone(), { renderOrder: 34 });

  addPlane(root, "SVR_UPDATE3_REIKI_WIDE_RED_CARPET_MAIN", [6.35, 8.90], [0, 0.018, 1.76], redCarpetMat, { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 12 });
  addPlane(root, "SVR_UPDATE3_REIKI_RED_CARPET_ENTRY_TONGUE", [4.35, 5.75], [0, 0.022, 5.72], redCarpetMat.clone(), { rot: [-Math.PI * 0.5, 0, 0], renderOrder: 13 });

  const carpetEdgeMat = trimMat.clone();
  carpetEdgeMat.emissiveIntensity = 0.14;
  addBox(root, "SVR_UPDATE3_REIKI_CARPET_LEFT_SILVER_TRIM", [0.055, 0.025, 10.8], [-3.24, 0.045, 3.38], carpetEdgeMat);
  addBox(root, "SVR_UPDATE3_REIKI_CARPET_RIGHT_SILVER_TRIM", [0.055, 0.025, 10.8], [3.24, 0.045, 3.38], carpetEdgeMat);

  const poleZ = [0.72, 1.98, 3.24, 4.50, 5.76, 7.02];
  const leftPoles = poleZ.map((z, idx) => addSilverPole(root, -3.82, z, `L${idx + 1}`).position);
  const rightPoles = poleZ.map((z, idx) => addSilverPole(root, 3.82, z, `R${idx + 1}`).position);

  for (let i = 0; i < poleZ.length - 1; i++) {
    addRopeBetween(root, leftPoles[i], leftPoles[i + 1], `LEFT_${i + 1}`);
    addRopeBetween(root, rightPoles[i], rightPoles[i + 1], `RIGHT_${i + 1}`);
  }

  const entranceTex = makeTextTexture([
    { text: "REIKI / RIKI STOREFRONT", font: "bold 56px system-ui, Arial" },
    { text: "GLASS EXPANSION • RED CARPET ENTRY", font: "bold 34px system-ui, Arial" },
    { text: "SILVER POLES • RED ROPE WALKWAY", font: "bold 32px system-ui, Arial", color: "#ffced5" },
    { text: "AWAITING APPROVAL", font: "bold 40px system-ui, Arial", accent: true }
  ], { width: 1180, height: 460 });

  addPlane(root, "SVR_UPDATE3_REIKI_ALIGNMENT_SIGN", [5.7, 2.22], [0, 4.15, 1.03],
    new THREE.MeshBasicMaterial({ map: entranceTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    { renderOrder: 48 }
  );

  const lampMat = new THREE.MeshBasicMaterial({ color: 0x88fff2, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false });
  [-8.36, 8.36].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), lampMat);
    lamp.position.set(x, 5.72, 0.96);
    root.add(lamp);
    const light = new THREE.PointLight(0x88fff2, 0.55, 5.2, 2.0);
    light.position.copy(lamp.position);
    root.add(light);
  });

  log?.("Update 3.0 Reiki storefront glass/wall/red-carpet/silver-pole/red-rope alignment applied.");
  return root;
}
