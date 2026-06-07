import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-REIKI-SYMBOLS-PLACEHOLDER-WALL";
const ITEMS = [
  ["SYMBOL 01", "Focus / power placeholder"],
  ["SYMBOL 02", "Harmony placeholder"],
  ["SYMBOL 03", "Distance placeholder"],
  ["SYMBOL 04", "Master symbol placeholder"]
];

function makeTexture(title, lines, color = "#00ffcc") {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 720;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#03080e");
  g.addColorStop(.6, "#111029");
  g.addColorStop(1, "#031d1b");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = color;
  x.lineWidth = 10;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = color;
  x.shadowBlur = 22;
  x.fillStyle = "#ffffff";
  x.font = "900 60px system-ui,Arial";
  x.fillText(title, c.width / 2, 110, c.width - 80);
  x.fillStyle = color;
  x.font = "900 126px system-ui,Arial";
  x.fillText("◈", c.width / 2, 260);
  x.shadowBlur = 5;
  x.fillStyle = "#eaffff";
  x.font = "800 34px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, 390 + i * 58, c.width - 90));
  x.fillStyle = "#ff6b6b";
  x.font = "900 28px system-ui,Arial";
  x.fillText("AWAITING APPROVAL", c.width / 2, 635, c.width - 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function panelMat(tex) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .98, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}
function glowMat(color) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
}

export function applyReikiSymbolsPlaceholder12(scene, { log = console.log } = {}) {
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_REIKI_SYMBOLS_PLACEHOLDER_12_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_REIKI_SYMBOLS_PLACEHOLDER_12_LOCK";
  root.add(lock);

  const colors = [0x00ffcc, 0xb48cff, 0xffd15c, 0x8ffff0];
  const header = new THREE.Mesh(new THREE.PlaneGeometry(5.8, .72), panelMat(makeTexture("SYMBOL TRAINING WALL", ["placeholder education layout", "final names/artwork/definitions pending"], "#00ffcc")));
  header.name = "SVR_REIKI_SYMBOL_WALL_HEADER";
  header.position.set(3.85, 3.95, -3.06);
  header.rotation.y = -0.10;
  header.renderOrder = 610;
  lock.add(header);

  ITEMS.forEach((item, i) => {
    const color = colors[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 2.35 + col * 2.9;
    const y = 2.6 - row * 1.55;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.34), glowMat(color));
    bg.name = `SVR_REIKI_SYMBOL_GLOW_${i + 1}`;
    bg.position.set(x, y, -3.085);
    bg.rotation.y = -0.10;
    bg.renderOrder = 615 + i;
    lock.add(bg);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(2.10, 1.18), panelMat(makeTexture(item[0], [item[1], "definition slot ready", "voiceover slot ready"], `#${color.toString(16).padStart(6, "0")}`)));
    card.name = `SVR_REIKI_SYMBOL_CARD_${i + 1}`;
    card.position.set(x, y, -3.06);
    card.rotation.y = -0.10;
    card.renderOrder = 620 + i;
    lock.add(card);
  });

  const api = window.SVR_RICI_UPDATE_101_CAROUSEL;
  if (api?.cards?.length) {
    const card = api.cards.find(c => c.type === "symbols");
    if (card) card.lines = ["glowing wall installed", "4 placeholder symbols", "definitions pending", "voiceover slot ready"];
  }

  window.SVR_REIKI_SYMBOLS_PLACEHOLDER_12 = { build: BUILD, cards: ITEMS.length, approvalRequired: true };
  log?.("Reiki symbol placeholder wall loaded", window.SVR_REIKI_SYMBOLS_PLACEHOLDER_12);
  return lock;
}
