import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-ESPRESSO-DAILY-CASH-STOREFRONT";
const POS = new THREE.Vector3(13.6, 0, -18.1);
const LOOK_AT = new THREE.Vector3(0, 1.15, 0);

function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function signTexture(title, lines = [], color = "#ffd28a") {
  return makeCanvas(1200, 520, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#100807");
    g.addColorStop(.55, "#23130a");
    g.addColorStop(1, "#071b18");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = color;
    x.lineWidth = 14;
    x.strokeRect(24, 24, w - 48, h - 48);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = color;
    x.shadowBlur = 22;
    x.fillStyle = "#fff";
    x.font = "900 78px system-ui,Arial";
    x.fillText(title, w / 2, 128, w - 100);
    x.shadowBlur = 7;
    x.fillStyle = "#fff0d0";
    x.font = "800 38px system-ui,Arial";
    lines.forEach((line, i) => x.fillText(line, w / 2, 248 + i * 62, w - 120));
  });
}
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.42,
    metalness: opts.metalness ?? 0.20,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    side: opts.side || THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true
  });
}
function basic(texture, opacity = 0.98) {
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}
function addBox(root, name, size, pos, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  root.add(mesh);
  return mesh;
}
function addPanel(root, name, size, pos, texture) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), basic(texture));
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.renderOrder = 490;
  root.add(mesh);
  return mesh;
}
function cup(root, x, z, color) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.13, .105, .34, 24), mat(color, { roughness: .48, metalness: .04 }));
  body.name = "SVR_ESPRESSO_CUP";
  body.position.set(x, 1.34, z);
  root.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.135, .125, .035, 24), mat(0xf5f1e8, { roughness: .33 }));
  lid.name = "SVR_ESPRESSO_CUP_LID";
  lid.position.set(x, 1.53, z);
  root.add(lid);
}
function hideOldEspresso(scene) {
  let hidden = 0;
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/SVR_PHASE11[23]_COFFEE|ESPRESSO_MACHINE|COFFEE_STAND_ASSEMBLED|COFFEE_SIGN_TABLE_FACING/i.test(n)) {
      obj.visible = false;
      hidden++;
    }
  });
  return hidden;
}

export function applyEspressoDailyCashStore12(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_ESPRESSO_DAILY_CASH_STORE_12_LOCK")) return null;
  const hiddenOld = hideOldEspresso(scene);
  const root = new THREE.Group();
  root.name = "SVR_ESPRESSO_DAILY_CASH_STORE_12_LOCK";
  root.position.copy(POS);
  root.lookAt(LOOK_AT);
  scene.add(root);

  const dark = mat(0x100807, { roughness: .72, metalness: .12, emissive: 0x100603, emissiveIntensity: .15 });
  const cream = mat(0xffe8bd, { roughness: .32, metalness: .06, emissive: 0x2a1300, emissiveIntensity: .10 });
  const gold = mat(0xffd06a, { roughness: .22, metalness: .64, emissive: 0x442600, emissiveIntensity: .32 });
  const cyan = mat(0x8ffff0, { roughness: .18, metalness: .52, emissive: 0x008c80, emissiveIntensity: .45 });
  const glass = mat(0xa7fff7, { opacity: .19, roughness: .05, metalness: .12, emissive: 0x1b7d78, emissiveIntensity: .18, side: THREE.DoubleSide, depthWrite: false });

  addBox(root, "SVR_ESPRESSO_BACK_WALL_UNDER_STORE_SIGN", [5.3, 3.25, .24], [0, 2.10, -0.74], dark);
  addBox(root, "SVR_ESPRESSO_COUNTER_BASE", [4.7, .92, 1.10], [0, .58, .18], dark);
  addBox(root, "SVR_ESPRESSO_COUNTER_TOP", [4.95, .18, 1.32], [0, 1.13, .22], cream);
  addBox(root, "SVR_ESPRESSO_TOP_STORE_SIGN_BAR", [5.65, .16, .32], [0, 3.82, -0.52], gold);
  addBox(root, "SVR_ESPRESSO_LEFT_POST", [.16, 3.35, .28], [-2.75, 2.05, -0.52], gold);
  addBox(root, "SVR_ESPRESSO_RIGHT_POST", [.16, 3.35, .28], [2.75, 2.05, -0.52], gold);
  addBox(root, "SVR_ESPRESSO_GLASS_DISPLAY", [2.35, .78, .06], [-.92, 1.62, .86], glass);
  addBox(root, "SVR_ESPRESSO_NEON_BASE", [5.1, .06, .08], [0, .16, .90], cyan);

  addPanel(root, "SVR_ESPRESSO_STORE_SIGN", [4.55, 1.08], [0, 3.18, .98], signTexture("ESPRESSO WITH CREAM", ["daily cash kiosk", "coffee pop-up preview", "sponsor tier sample"], "#ffd28a"));
  addPanel(root, "SVR_ESPRESSO_DAILY_CASH_PANEL", [2.25, 1.25], [1.32, 1.88, .99], signTexture("DAILY CASH", ["5,000 chip bonus", "once per day", "profile reward hook"], "#8ffff0"));
  addPanel(root, "SVR_ESPRESSO_MENU_PANEL", [1.72, 1.06], [-1.48, 1.88, .99], signTexture("MENU", ["espresso", "cream", "future merch"], "#ffd28a"));

  const machine = new THREE.Group();
  machine.name = "SVR_ESPRESSO_MACHINE_REBUILT";
  machine.position.set(-.85, 1.32, .18);
  root.add(machine);
  addBox(machine, "SVR_ESPRESSO_MACHINE_BODY", [.68, .50, .42], [0, 0, 0], mat(0xbfc6cf, { roughness: .22, metalness: .62, emissive: 0x101824, emissiveIntensity: .06 }));
  addBox(machine, "SVR_ESPRESSO_MACHINE_FACE", [.52, .28, .05], [0, .02, .235], mat(0x07090d, { roughness: .48, metalness: .20 }));
  addBox(machine, "SVR_ESPRESSO_MACHINE_TOP", [.78, .08, .48], [0, .31, 0], mat(0xdde4ec, { roughness: .30, metalness: .50 }));

  cup(root, .20, .47, 0xf3f3f3);
  cup(root, .55, .47, 0xffd28a);
  cup(root, .90, .47, 0x8ffff0);

  const ring = new THREE.Mesh(new THREE.RingGeometry(.82, .98, 72), new THREE.MeshBasicMaterial({ color: 0xffd06a, transparent: true, opacity: .34, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  ring.name = "SVR_ESPRESSO_DAILY_CASH_INTERACTION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(1.45, .07, 1.22);
  ring.renderOrder = 500;
  root.add(ring);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now() * .001;
    ring.rotation.z += .0015;
    ring.material.opacity = .25 + Math.sin(t * 1.3) * .06;
  };

  window.SVR_ESPRESSO_DAILY_CASH_STORE_12 = { build: BUILD, hiddenOld, position: POS.toArray(), facing: "table/lobby-center", dailyCashHook: true, checkoutLive: false };
  scene.userData.SVR_ESPRESSO_DAILY_CASH_STORE_12 = window.SVR_ESPRESSO_DAILY_CASH_STORE_12;
  log?.("Espresso daily cash storefront 1.2 loaded", window.SVR_ESPRESSO_DAILY_CASH_STORE_12);
  return root;
}
