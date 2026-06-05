import * as THREE from "three";

const BUILD = "PHASE-112-COFFEE-STAND-RELOCATED-LOCK";
const TARGET = new THREE.Vector3(15.84, 0, -16.44);
const OLD_CENTER = new THREE.Vector3(15.16, 0, -11.17);

function makeSign(title, sub = "") {
  const c = document.createElement("canvas");
  c.width = 1000;
  c.height = 360;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#061016");
  g.addColorStop(.55, "#17111c");
  g.addColorStop(1, "#0b241f");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,255,242,.92)";
  x.lineWidth = 9;
  x.strokeRect(18, 18, c.width - 36, c.height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(140,255,242,.65)";
  x.shadowBlur = 18;
  x.fillStyle = "#ffffff";
  x.font = "900 58px system-ui,Arial";
  x.fillText(title, c.width / 2, 130, c.width - 80);
  x.fillStyle = "#cafff8";
  x.font = "800 32px system-ui,Arial";
  x.fillText(sub, c.width / 2, 220, c.width - 80);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function addBox(root, name, size, pos, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  root.add(mesh);
  return mesh;
}

function addPlane(root, name, size, pos, mat, rot = [0,0,0]) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  mesh.name = name;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = 190;
  root.add(mesh);
  return mesh;
}

function createCup(root, x, z, color = 0xffffff) {
  const cupMat = new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .03 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.11, .09, .28, 24), cupMat);
  cup.position.set(x, 1.04, z);
  root.add(cup);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.115, .105, .035, 24), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .35 }));
  lid.position.set(x, 1.20, z);
  root.add(lid);
  return cup;
}

function hideOldStandPieces(scene) {
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let hidden = 0;
  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.visible || !obj.geometry) return;
    const name = String(obj.name || "");
    if (/table|chair|card|chip|bot|dealer|poker|portal|planet|moon|mars|hologram|chakra|plant|rope|pole|carpet|glass|sign|wall|skyline|building|sprite|star/i.test(name)) return;
    box.setFromObject(obj);
    box.getSize(size);
    box.getCenter(center);
    const nearOld = Math.abs(center.x - OLD_CENTER.x) < 5.5 && Math.abs(center.z - OLD_CENTER.z) < 4.5 && center.y < 3.3;
    const fixtureLike = size.y < 2.8 && Math.max(size.x, size.z) < 5.2 && Math.max(size.x, size.z) > .35;
    const notFloor = size.y > .045 || center.y > .10;
    if (nearOld && fixtureLike && notFloor) {
      obj.visible = false;
      obj.userData.SVR_PHASE112_OLD_COFFEE_STAND_HIDDEN = true;
      hidden++;
    }
  });
  return hidden;
}

export function applyPhase112CoffeeStandMove(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE112_COFFEE_STAND_RELOCATED")) return null;

  const hidden = hideOldStandPieces(scene);

  const root = new THREE.Group();
  root.name = "SVR_PHASE112_COFFEE_STAND_RELOCATED";
  root.position.copy(TARGET);
  root.lookAt(new THREE.Vector3(0, 1.3, 0));
  scene.add(root);

  const dark = new THREE.MeshStandardMaterial({ color: 0x06080b, roughness: .62, metalness: .12, emissive: 0x030506, emissiveIntensity: .10 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9edf4, roughness: .34, metalness: .08, emissive: 0x111820, emissiveIntensity: .06 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x8ffff0, roughness: .20, metalness: .38, emissive: 0x1c8a80, emissiveIntensity: .35 });
  const shelf = new THREE.MeshStandardMaterial({ color: 0x131821, roughness: .46, metalness: .14 });

  // Clean L-shaped sponsor/coffee stand facing the room.
  addBox(root, "SVR_PHASE112_COFFEE_BACK_BODY", [2.50, 1.45, .62], [0, .78, -.38], dark);
  addBox(root, "SVR_PHASE112_COFFEE_FRONT_COUNTER", [2.95, .22, .84], [0, 1.42, .35], white);
  addBox(root, "SVR_PHASE112_COFFEE_RIGHT_COUNTER_RETURN", [.72, .22, 1.55], [1.45, 1.42, -.18], white);
  addBox(root, "SVR_PHASE112_COFFEE_FRONT_FACE", [2.86, .88, .18], [0, .72, .78], dark);
  addBox(root, "SVR_PHASE112_COFFEE_LEFT_FACE", [.18, 1.10, 1.22], [-1.50, .70, .10], dark);
  addBox(root, "SVR_PHASE112_COFFEE_RIGHT_FACE", [.18, 1.10, 1.60], [1.82, .70, -.15], dark);
  addBox(root, "SVR_PHASE112_COFFEE_BASE_TRIM", [3.15, .08, .10], [0, .10, .88], trim);

  // Shelves behind the counter.
  addBox(root, "SVR_PHASE112_COFFEE_SHELF_BACK", [2.20, .08, .16], [0, 1.18, -.76], shelf);
  addBox(root, "SVR_PHASE112_COFFEE_SHELF_MID", [2.05, .08, .16], [0, 1.62, -.76], shelf);
  addBox(root, "SVR_PHASE112_COFFEE_SHELF_TOP", [2.05, .08, .16], [0, 2.05, -.76], shelf);

  createCup(root, -.62, .34, 0xf1f1f1);
  createCup(root, -.30, .34, 0x8ffff0);
  createCup(root, .02, .34, 0xffd06a);

  const espressoSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.90, .86),
    new THREE.MeshBasicMaterial({ map: makeSign("ESPRESSO STAND", "Sponsor merch • coffee counter"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  espressoSign.name = "SVR_PHASE112_COFFEE_SIGN";
  espressoSign.position.set(0, 2.72, -.72);
  root.add(espressoSign);

  const floorMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 2.05, .035, 72),
    new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  floorMarker.name = "SVR_PHASE112_COFFEE_POSITION_MARKER";
  floorMarker.position.y = .03;
  root.add(floorMarker);

  const light = new THREE.PointLight(0x8ffff0, .62, 5.8, 2.1);
  light.position.set(0, 2.0, .7);
  root.add(light);

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const t = performance.now();
    floorMarker.material.opacity = .12 + Math.sin(t * .002) * .04;
    light.intensity = .50 + Math.sin(t * .0022) * .14;
  };

  const panel = document.getElementById("svr-position-panel");
  if (panel) {
    panel.textContent = `SVR POSITION PANEL\n${BUILD}\nCoffee stand moved to X ${TARGET.x.toFixed(2)}  Z ${TARGET.z.toFixed(2)}\nOld fixture pieces hidden: ${hidden}`;
  }

  scene.userData.SVR_PHASE112_COFFEE_STAND = { build: BUILD, target: { x: TARGET.x, z: TARGET.z }, hidden };
  window.SVR_PHASE112_COFFEE_STAND = scene.userData.SVR_PHASE112_COFFEE_STAND;
  log?.("Phase 112 coffee stand relocated", scene.userData.SVR_PHASE112_COFFEE_STAND);
  return root;
}
