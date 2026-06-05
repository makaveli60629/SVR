import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-PORTAL-PLAZA-DIRECTORY";

const ITEMS = [
  ["table", "POKER TABLE", "Main table", "OPEN", 0xffd15c],
  ["reiki", "REIKI HUB", "Storefront preview", "APPROVAL", 0x00ffcc],
  ["reikiRoom", "PRIVATE REIKI", "Session room preview", "PREVIEW", 0x8ffff0],
  ["reikiRoom", "TRAINING FOREST", "Meditation room next", "NEXT", 0x42ff8d],
  ["pgaDrive", "PGA DRIVE", "Golf range", "PREVIEW", 0x70b7ff],
  ["chipPutt", "CHIP + PUTT", "Short game", "PREVIEW", 0x9bd2ff],
  ["vrStore", "VR STORE", "Store module", "PREVIEW", 0xb48cff],
  ["scorpion", "SCORPION ROOM", "Underground room", "AUDIT", 0xff5a7a],
  ["sponsor", "SPONSOR LOUNGE", "Partner zone", "OPEN", 0xffd06a],
  ["legends", "HALL OF FAME", "Trophy area", "OPEN", 0xffffff]
];

function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function hex(c) { return `#${c.toString(16).padStart(6, "0")}`; }

function panelMaterial(tex, opacity = 0.98) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}

function glowMaterial(color, opacity = 0.14) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
}

function directoryTexture() {
  return makeCanvas(1200, 1000, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#040811"); g.addColorStop(.55, "#111025"); g.addColorStop(1, "#041e22");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(0,255,204,.82)"; x.lineWidth = 12; x.strokeRect(26, 26, w - 52, h - 52);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = "rgba(0,255,204,.7)"; x.shadowBlur = 18;
    x.fillStyle = "#fff"; x.font = "900 70px system-ui,Arial";
    x.fillText("SVR LOBBY DIRECTORY", w / 2, 95, w - 100);
    x.shadowBlur = 4;
    x.fillStyle = "#dffff8"; x.font = "800 28px system-ui,Arial";
    x.fillText("Aim at a portal card and select", w / 2, 155, w - 120);
    ITEMS.forEach((it, i) => {
      const [key, title, sub, status, color] = it;
      const y = 235 + i * 66;
      x.fillStyle = i % 2 ? "rgba(255,255,255,.055)" : "rgba(255,255,255,.025)";
      x.fillRect(75, y - 28, w - 150, 54);
      x.textAlign = "left";
      x.fillStyle = hex(color); x.font = "900 30px system-ui,Arial"; x.fillText(String(i + 1).padStart(2, "0"), 95, y);
      x.fillStyle = "#fff"; x.font = "900 28px system-ui,Arial"; x.fillText(title, 165, y, 330);
      x.fillStyle = "#dffff8"; x.font = "700 22px system-ui,Arial"; x.fillText(sub, 520, y, 300);
      x.textAlign = "right";
      x.fillStyle = hex(color); x.font = "900 22px system-ui,Arial"; x.fillText(status, w - 95, y, 250);
    });
  });
}

function cardTexture(item, index) {
  const [key, title, sub, status, color] = item;
  return makeCanvas(720, 440, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#050810"); g.addColorStop(.55, "#121024"); g.addColorStop(1, "#051e22");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = hex(color); x.lineWidth = 10; x.strokeRect(16, 16, w - 32, h - 32);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = hex(color); x.shadowBlur = 16;
    x.fillStyle = "#fff"; x.font = "900 42px system-ui,Arial"; x.fillText(title, w / 2, 100, w - 55);
    x.shadowBlur = 5;
    x.fillStyle = "#dffff8"; x.font = "800 27px system-ui,Arial"; x.fillText(sub, w / 2, 170, w - 60);
    x.fillStyle = hex(color); x.font = "900 26px system-ui,Arial"; x.fillText(status, w / 2, 235, w - 60);
    x.fillStyle = "rgba(255,255,255,.92)"; x.font = "900 70px system-ui,Arial"; x.fillText(String(index + 1).padStart(2, "0"), w / 2, 325);
    x.fillStyle = "rgba(255,255,255,.68)"; x.font = "800 20px system-ui,Arial"; x.fillText("SELECT", w / 2, 395);
  });
}

function go(key) {
  const btn = document.querySelector(`#sceneNav .scene-btn[data-scene='${key}']`);
  if (btn) { btn.click(); return true; }
  window.SVR_PORTAL_PLAZA_PENDING_SCENE = key;
  return false;
}

function addCard(root, item, i, x, y, z) {
  const [key, title, sub, status, color] = item;
  const g = new THREE.Group();
  g.name = `SVR_PORTAL_CARD_GROUP_${i + 1}_${key}`;
  g.position.set(x, y, z); g.rotation.y = Math.PI / 2; root.add(g);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.48), glowMaterial(color, 0.12));
  back.name = `SVR_PORTAL_CARD_GLOW_${i + 1}`; back.position.z = -0.02; back.renderOrder = 510 + i; g.add(back);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.25), panelMaterial(cardTexture(item, i), 0.98));
  card.name = `SVR_PORTAL_BUTTON_${i + 1}_${key}`; card.renderOrder = 520 + i;
  card.userData.activate = () => { window.SVR_PORTAL_PLAZA_LAST_ACTIVATED = { key, title, index: i + 1 }; go(key); };
  g.add(card);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.55, 48), glowMaterial(color, 0.28));
  ring.name = `SVR_PORTAL_RING_${i + 1}`; ring.rotation.x = -Math.PI / 2; ring.position.set(x + 0.05, 0.045, z); root.add(ring);
}

export function applyPortalPlazaDirectory12(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PORTAL_PLAZA_DIRECTORY_12_LOCK")) return null;
  const root = new THREE.Group(); root.name = "SVR_PORTAL_PLAZA_DIRECTORY_12_LOCK"; scene.add(root);

  const board = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 4.75), panelMaterial(directoryTexture(), 0.98));
  board.name = "SVR_LOBBY_DIRECTORY_BOARD_12"; board.position.set(-18.55, 3.05, 5.10); board.rotation.y = Math.PI / 2; board.renderOrder = 500; root.add(board);
  const boardGlow = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 5.1), glowMaterial(0x00ffcc, 0.08));
  boardGlow.name = "SVR_LOBBY_DIRECTORY_BOARD_GLOW_12"; boardGlow.position.copy(board.position); boardGlow.rotation.copy(board.rotation); boardGlow.renderOrder = 499; root.add(boardGlow);

  ITEMS.forEach((item, i) => {
    const row = i < 5 ? 0 : 1;
    const col = i % 5;
    addCard(root, item, i, -18.15, row === 0 ? 1.28 : 2.85, 2.6 - col * 2.15);
  });

  for (let i = 0; i < 9; i++) {
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.014, 20), glowMaterial(0x00ffcc, 0.20));
    dot.name = `SVR_PORTAL_PATH_LIGHT_${i + 1}`; dot.position.set(-2.1 - i * 1.75, 0.035, 5.15); root.add(dot);
  }

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    root.traverse((o) => {
      if (/SVR_PORTAL_RING_/i.test(o.name || "") && o.material) { o.rotation.z += 0.0012; o.material.opacity = 0.23 + Math.sin(t * 0.0014 + o.position.z) * 0.045; }
      if (/SVR_PORTAL_PATH_LIGHT_/i.test(o.name || "") && o.material) { o.material.opacity = 0.15 + Math.sin(t * 0.002 + o.position.x) * 0.04; }
    });
  };

  window.SVR_PORTAL_PLAZA_DIRECTORY_12 = { build: BUILD, cardCount: ITEMS.length, position: "west wall", controllerPointerReady: true };
  scene.userData.SVR_PORTAL_PLAZA_DIRECTORY_12 = window.SVR_PORTAL_PLAZA_DIRECTORY_12;
  log?.("Portal plaza directory 1.2 loaded", window.SVR_PORTAL_PLAZA_DIRECTORY_12);
  return root;
}
