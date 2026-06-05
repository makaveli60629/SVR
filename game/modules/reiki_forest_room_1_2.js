import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-REIKI-MEDITATION-FOREST";
const CENTER = new THREE.Vector3(-34, 0, -20);

function tex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeGroundTexture() {
  const t = tex(512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#16321d");
    g.addColorStop(1, "#07170d");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const r = 30 + Math.random() * 60 | 0;
      x.fillStyle = `rgba(${r},${95 + Math.random() * 60 | 0},${40 + Math.random() * 35 | 0},${0.05 + Math.random() * 0.16})`;
      x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 1 + Math.random() * 5);
    }
  });
  t.repeat.set(7, 7);
  return t;
}

function makeWaterTexture() {
  const t = tex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#133a54");
    g.addColorStop(0.5, "#1a7187");
    g.addColorStop(1, "#08293b");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(210,255,255,.38)";
    for (let i = 0; i < 38; i++) {
      x.lineWidth = 1 + Math.random() * 3;
      x.beginPath();
      const y = Math.random() * h;
      x.moveTo(0, y);
      x.bezierCurveTo(w * 0.25, y - 24 + Math.random() * 48, w * 0.72, y - 24 + Math.random() * 48, w, y);
      x.stroke();
    }
  });
  t.repeat.set(4, 2);
  return t;
}

function makePanel(title, lines) {
  return tex(900, 420, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#041015");
    g.addColorStop(1, "#08281e");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(0,255,204,.82)";
    x.lineWidth = 8;
    x.strokeRect(18, 18, w - 36, h - 36);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = "rgba(0,255,204,.6)";
    x.shadowBlur = 16;
    x.fillStyle = "#fff";
    x.font = "900 52px system-ui,Arial";
    x.fillText(title, w / 2, 95, w - 70);
    x.shadowBlur = 4;
    x.fillStyle = "#dffff8";
    x.font = "800 30px system-ui,Arial";
    lines.forEach((line, i) => x.fillText(line, w / 2, 180 + i * 52, w - 80));
  });
}

function addTree(root, x, z, s = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * s, 0.18 * s, 1.6 * s, 10),
    new THREE.MeshStandardMaterial({ color: 0x49301f, roughness: 0.9, metalness: 0.02 })
  );
  trunk.position.set(x, 0.8 * s, z);
  trunk.name = "SVR_REIKI_FOREST_TREE_TRUNK";
  root.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e7a42, roughness: 0.82, emissive: 0x05210e, emissiveIntensity: 0.10 });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((0.75 - i * 0.12) * s, 1.15 * s, 12), leafMat);
    cone.name = "SVR_REIKI_FOREST_TREE_CANOPY";
    cone.position.set(x, (1.75 + i * 0.52) * s, z);
    root.add(cone);
  }
}

function addRock(root, x, z, s = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.34 * s, 0),
    new THREE.MeshStandardMaterial({ color: 0x69706c, roughness: 0.95, metalness: 0.03 })
  );
  rock.name = "SVR_REIKI_FOREST_ROCK";
  rock.position.set(x, 0.18 * s, z);
  rock.scale.set(1.45, 0.62, 1.0);
  rock.rotation.set(Math.random() * 0.4, Math.random() * 3.14, Math.random() * 0.3);
  root.add(rock);
}

export function applyReikiForestRoom12(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_REIKI_FOREST_ROOM_12_LOCK")) return null;
  const root = new THREE.Group();
  root.name = "SVR_REIKI_FOREST_ROOM_12_LOCK";
  root.position.copy(CENTER);
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(18, 96),
    new THREE.MeshStandardMaterial({ map: makeGroundTexture(), color: 0xffffff, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide })
  );
  ground.name = "SVR_REIKI_FOREST_GROUND";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  root.add(ground);

  const waterTex = makeWaterTexture();
  const creek = new THREE.Mesh(
    new THREE.PlaneGeometry(4.3, 24, 1, 1),
    new THREE.MeshBasicMaterial({ map: waterTex, color: 0xffffff, transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  creek.name = "SVR_REIKI_FOREST_RUNNING_WATER_LIGHTWEIGHT";
  creek.rotation.x = -Math.PI / 2;
  creek.rotation.z = 0.18;
  creek.position.set(-3.6, 0.035, 0);
  creek.renderOrder = 90;
  root.add(creek);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.42, 1.58, 96),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  );
  ring.name = "SVR_REIKI_FOREST_MEDITATION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(2.3, 0.06, 1.2);
  root.add(ring);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 2.2),
    new THREE.MeshBasicMaterial({ map: makePanel("REIKI TRAINING FOREST", ["Running water uses animated texture", "Low-poly trees for Quest performance", "Future guided tutorial room"]), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  sign.name = "SVR_REIKI_FOREST_INFO_PANEL";
  sign.position.set(3.5, 2.25, -5.6);
  sign.rotation.y = -0.32;
  root.add(sign);

  for (let i = 0; i < 34; i++) {
    const angle = i / 34 * Math.PI * 2;
    const radius = 8.5 + (i % 7) * 1.1;
    addTree(root, Math.cos(angle) * radius, Math.sin(angle) * radius, 0.8 + (i % 5) * 0.12);
  }
  for (let i = 0; i < 18; i++) addRock(root, -7 + Math.random() * 14, -7 + Math.random() * 14, 0.7 + Math.random() * 0.8);

  const fireflyMat = new THREE.SpriteMaterial({ color: 0x9dffcc, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const fireflies = [];
  for (let i = 0; i < 28; i++) {
    const f = new THREE.Sprite(fireflyMat.clone());
    f.name = "SVR_REIKI_FOREST_SOFT_FIREFLY";
    f.position.set(-7 + Math.random() * 14, 1.1 + Math.random() * 2.4, -7 + Math.random() * 14);
    f.scale.setScalar(0.09 + Math.random() * 0.06);
    f.userData.seed = Math.random() * 10;
    root.add(f);
    fireflies.push(f);
  }

  const moonView = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xf6ead2, toneMapped: false })
  );
  moonView.name = "SVR_REIKI_FOREST_PRIVATE_MOON_VIEW_MARKER";
  moonView.position.set(-7.5, 13.5, -13.5);
  root.add(moonView);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now() * 0.001;
    waterTex.offset.y -= 0.0018;
    ring.rotation.z += 0.0011;
    ring.material.opacity = 0.30 + Math.sin(t * 1.2) * 0.055;
    fireflies.forEach((f, i) => {
      f.position.y += Math.sin(t + f.userData.seed) * 0.0009;
      f.material.opacity = 0.22 + Math.sin(t * 0.9 + i) * 0.12;
    });
  };

  window.SVR_REIKI_FOREST_ROOM_12 = {
    build: BUILD,
    center: CENTER.toArray(),
    water: "animated texture only",
    questSafe: true,
    status: "preview scene built"
  };
  scene.userData.SVR_REIKI_FOREST_ROOM_12 = window.SVR_REIKI_FOREST_ROOM_12;
  log?.("Reiki meditation forest room 1.2 loaded", window.SVR_REIKI_FOREST_ROOM_12);
  return root;
}
