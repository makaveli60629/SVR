import * as THREE from "three";
import { applyReikiLuxuryCleanup12 } from "./reiki_luxury_cleanup_1_2.js";
import { applyPortalPlazaDirectory12 } from "./portal_plaza_directory_1_2.js";

const BUILD = "PHASE-113-COFFEE-STAND-ASSEMBLED-TABLE-FACING-LOCK";
const TARGET = new THREE.Vector3(15.84, 0, -16.44);
const OLD_CENTER = new THREE.Vector3(15.16, 0, -11.17);
const TABLE_CENTER = new THREE.Vector3(0, 1.2, 0);

function makeSign(title, sub = "") {
  const c = document.createElement("canvas");
  c.width = 1100;
  c.height = 380;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#061016");
  g.addColorStop(.55, "#15101d");
  g.addColorStop(1, "#0b241f");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,255,242,.94)";
  x.lineWidth = 10;
  x.strokeRect(20, 20, c.width - 40, c.height - 40);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(140,255,242,.68)";
  x.shadowBlur = 18;
  x.fillStyle = "#ffffff";
  x.font = "900 64px system-ui,Arial";
  x.fillText(title, c.width / 2, 130, c.width - 90);
  x.fillStyle = "#cafff8";
  x.font = "800 34px system-ui,Arial";
  x.fillText(sub, c.width / 2, 225, c.width - 90);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function addBox(root, name, size, pos, mat) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat); mesh.name = name; mesh.position.set(pos[0], pos[1], pos[2]); root.add(mesh); return mesh; }
function addPlane(root, name, size, pos, mat, rot = [0,0,0]) { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat); mesh.name = name; mesh.position.set(pos[0], pos[1], pos[2]); mesh.rotation.set(rot[0], rot[1], rot[2]); mesh.renderOrder = 210; root.add(mesh); return mesh; }
function createCup(root, x, z, color = 0xffffff) { const cupMat = new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .03 }); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.11, .09, .28, 24), cupMat); cup.name = "SVR_PHASE113_COFFEE_CUP"; cup.position.set(x, 1.17, z); root.add(cup); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.115, .105, .035, 24), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .35 })); lid.name = "SVR_PHASE113_COFFEE_CUP_LID"; lid.position.set(x, 1.33, z); root.add(lid); return cup; }
function createEspressoMachine(root, x, z) { const metal = new THREE.MeshStandardMaterial({ color: 0xcbd2dc, roughness: .24, metalness: .55, emissive: 0x101824, emissiveIntensity: .06 }); const dark = new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: .52, metalness: .18 }); addBox(root, "SVR_PHASE113_ESPRESSO_MACHINE_BODY", [.54, .42, .36], [x, 1.30, z], metal); addBox(root, "SVR_PHASE113_ESPRESSO_MACHINE_FACE", [.42, .24, .045], [x, 1.32, z + .205], dark); addBox(root, "SVR_PHASE113_ESPRESSO_MACHINE_TOP", [.62, .08, .42], [x, 1.55, z], metal); }
function hideOldStandPieces(scene) { const box = new THREE.Box3(); const size = new THREE.Vector3(); const center = new THREE.Vector3(); let hidden = 0; scene.updateMatrixWorld(true); scene.traverse((obj) => { if (!obj.isMesh || !obj.visible || !obj.geometry) return; const name = String(obj.name || ""); if (/table|chair|card|chip|bot|dealer|poker|portal|planet|moon|mars|hologram|chakra|plant|rope|pole|carpet|glass|sign|wall|skyline|building|sprite|star|SVR_PHASE113|SVR_PHASE112/i.test(name)) return; box.setFromObject(obj); box.getSize(size); box.getCenter(center); const nearOld = Math.abs(center.x - OLD_CENTER.x) < 5.8 && Math.abs(center.z - OLD_CENTER.z) < 4.8 && center.y < 3.4; const fixtureLike = size.y < 3.0 && Math.max(size.x, size.z) < 5.5 && Math.max(size.x, size.z) > .30; const notFloor = size.y > .045 || center.y > .10; if (nearOld && fixtureLike && notFloor) { obj.visible = false; obj.userData.SVR_PHASE113_OLD_COFFEE_STAND_HIDDEN = true; hidden++; } }); return hidden; }
function removePriorCoffeeStands(scene) { ["SVR_PHASE112_COFFEE_STAND_RELOCATED", "SVR_PHASE113_COFFEE_STAND_ASSEMBLED"].forEach((name) => { const o = scene.getObjectByName(name); if (o?.parent) o.parent.remove(o); }); }
function yawLocalPositiveZToward(from, to) { const dx = to.x - from.x; const dz = to.z - from.z; return Math.atan2(dx, dz); }

export function applyPhase112CoffeeStandMove(scene, { log = console.log } = {}) {
  if (!scene) return null;
  applyReikiLuxuryCleanup12?.(scene, { log });
  applyPortalPlazaDirectory12?.(scene, { log });
  removePriorCoffeeStands(scene);
  const hidden = hideOldStandPieces(scene);
  const root = new THREE.Group();
  root.name = "SVR_PHASE113_COFFEE_STAND_ASSEMBLED";
  root.position.copy(TARGET);
  root.rotation.y = yawLocalPositiveZToward(TARGET, TABLE_CENTER);
  scene.add(root);
  const dark = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: .66, metalness: .10, emissive: 0x020506, emissiveIntensity: .10 });
  const face = new THREE.MeshStandardMaterial({ color: 0x090d12, roughness: .60, metalness: .12, emissive: 0x03070a, emissiveIntensity: .12 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9edf4, roughness: .34, metalness: .08, emissive: 0x111820, emissiveIntensity: .06 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x8ffff0, roughness: .20, metalness: .38, emissive: 0x1c8a80, emissiveIntensity: .42 });
  const shelf = new THREE.MeshStandardMaterial({ color: 0x151b24, roughness: .46, metalness: .16 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xa7fff7, transparent: true, opacity: .20, roughness: .05, metalness: .12, emissive: 0x1b7d78, emissiveIntensity: .22, side: THREE.DoubleSide, depthWrite: false });
  addBox(root, "SVR_PHASE113_KIOSK_BASE", [3.25, .18, 1.48], [0, .09, .03], dark); addBox(root, "SVR_PHASE113_FRONT_BODY_SOLID", [3.08, .92, .24], [0, .62, .68], face); addBox(root, "SVR_PHASE113_BACK_BODY_SOLID", [3.08, .92, .22], [0, .62, -.66], dark); addBox(root, "SVR_PHASE113_LEFT_SIDE_SOLID", [.24, .92, 1.34], [-1.54, .62, .02], face); addBox(root, "SVR_PHASE113_RIGHT_SIDE_SOLID", [.24, .92, 1.34], [1.54, .62, .02], face); addBox(root, "SVR_PHASE113_FRONT_COUNTER_TOP", [3.32, .18, .92], [0, 1.14, .46], white); addBox(root, "SVR_PHASE113_SIDE_RETURN_COUNTER", [.86, .18, 1.58], [1.23, 1.14, -.08], white); addBox(root, "SVR_PHASE113_BACK_SERVICE_PANEL", [3.05, 1.68, .18], [0, 1.10, -.82], dark); addBox(root, "SVR_PHASE113_CANOPY_CONNECTED", [3.42, .18, 1.28], [0, 2.18, -.10], white); addBox(root, "SVR_PHASE113_LEFT_CANOPY_POST", [.16, 1.15, .16], [-1.62, 1.58, .55], white); addBox(root, "SVR_PHASE113_RIGHT_CANOPY_POST", [.16, 1.15, .16], [1.62, 1.58, .55], white); addBox(root, "SVR_PHASE113_NEON_FRONT_BASE_TRIM", [3.42, .06, .08], [0, .22, .84], trim); addBox(root, "SVR_PHASE113_NEON_COUNTER_TRIM", [3.34, .05, .08], [0, 1.26, .92], trim);
  addBox(root, "SVR_PHASE113_SHELF_LOWER", [2.34, .08, .20], [0, 1.18, -.68], shelf); addBox(root, "SVR_PHASE113_SHELF_MIDDLE", [2.34, .08, .20], [0, 1.50, -.68], shelf); addBox(root, "SVR_PHASE113_SHELF_UPPER", [2.34, .08, .20], [0, 1.82, -.68], shelf);
  createCup(root, -.76, .42, 0xf1f1f1); createCup(root, -.45, .42, 0x8ffff0); createCup(root, -.14, .42, 0xffd06a); createEspressoMachine(root, .62, .30);
  addPlane(root, "SVR_PHASE113_MENU_GLASS_PANEL", [1.18, .74], [-.98, 1.64, .96], glass, [0, 0, 0]);
  const espressoSign = new THREE.Mesh(new THREE.PlaneGeometry(2.92, .84), new THREE.MeshBasicMaterial({ map: makeSign("ESPRESSO STAND", "Facing poker table • sponsor merch"), transparent: true, side: THREE.DoubleSide, depthWrite: false })); espressoSign.name = "SVR_PHASE113_COFFEE_SIGN_TABLE_FACING"; espressoSign.position.set(0, 2.55, .86); root.add(espressoSign);
  const floorMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.12, .035, 72), new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: .14, depthWrite: false, blending: THREE.AdditiveBlending })); floorMarker.name = "SVR_PHASE113_COFFEE_POSITION_MARKER"; floorMarker.position.y = .03; root.add(floorMarker);
  const light = new THREE.PointLight(0x8ffff0, .66, 6.2, 2.1); light.position.set(0, 2.0, .80); root.add(light);
  const oldTick = scene.onBeforeRender; scene.onBeforeRender = function(...args) { oldTick?.apply(this, args); const t = performance.now(); floorMarker.material.opacity = .10 + Math.sin(t * .002) * .035; light.intensity = .50 + Math.sin(t * .0022) * .14; };
  const panel = document.getElementById("svr-position-panel"); if (panel) panel.textContent = `SVR POSITION PANEL\n${BUILD}\nCoffee stand X ${TARGET.x.toFixed(2)} Z ${TARGET.z.toFixed(2)}\nPortal plaza loaded: ${!!window.SVR_PORTAL_PLAZA_DIRECTORY_12}\nForest deferred for faster lobby boot\nOld fixture pieces hidden: ${hidden}`;
  scene.userData.SVR_PHASE113_COFFEE_STAND = { build: BUILD, target: { x: TARGET.x, z: TARGET.z }, facing: "lobby-center", hidden, reikiCleanupLoaded: !!window.SVR_REIKI_LUXURY_CLEANUP_12, portalPlazaLoaded: !!window.SVR_PORTAL_PLAZA_DIRECTORY_12, forestDeferred: true };
  window.SVR_PHASE113_COFFEE_STAND = scene.userData.SVR_PHASE113_COFFEE_STAND;
  log?.("Phase 113 coffee stand assembled; forest deferred", scene.userData.SVR_PHASE113_COFFEE_STAND);
  return root;
}
