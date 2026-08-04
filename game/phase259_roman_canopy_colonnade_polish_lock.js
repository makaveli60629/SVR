import * as THREE from "three";

const LABEL = "PHASE-259-ROMAN-CANOPY-COLONNADE-POLISH-LOCK";
const ROOT = "PHASE259_ROMAN_CANOPY_COLONNADE_POLISH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0xd8d0bc;
const RED = 0x8c1f2e;
const DARK = 0x050713;

function standard(color, opacity = 1, metal = 0.06, rough = 0.48){
  return new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness: metal, roughness: rough, side: THREE.DoubleSide });
}
function glow(color, opacity = 0.35){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function box(root, name, sx, sy, sz, x, y, z, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}
function cyl(root, name, r, h, x, y, z, mat, seg = 48){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}
function arch(root, name, rad, tube, x, y, z, mat, ry = 0, sx = 1, sy = 1){
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 12, 72, Math.PI), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.scale.set(sx, sy, 1);
  root.add(mesh);
  return mesh;
}
function smoothPillar(root, name, x, z, h = 3.2, r = 0.14){
  const stone = standard(STONE, 0.97, 0.02, 0.42);
  const gold = standard(GOLD, 0.95, 0.26, 0.34);
  cyl(root, `${name}_SHAFT`, r, h, x, h / 2, z, stone);
  cyl(root, `${name}_BASE_GOLD`, r * 2.0, 0.12, x, 0.10, z, gold);
  cyl(root, `${name}_BASE_STONE`, r * 1.45, 0.14, x, 0.24, z, stone);
  cyl(root, `${name}_CAP_STONE`, r * 1.42, 0.16, x, h + 0.02, z, stone);
  cyl(root, `${name}_CAP_GOLD`, r * 2.05, 0.12, x, h + 0.18, z, gold);
}
function stamp(){
  window.SVR_PHASE259 = { build: LABEL, active: true, romanCanopy: true, colonnadePolish: true, siteTouched: false, checkedAt: new Date().toISOString() };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = "PHASE 259 ACTIVE • ROMAN CANOPY POLISH";
  const status = document.getElementById("status");
  if(status) status.textContent = "Phase 259 Roman canopy, corner pillars, and smooth colonnade polish loaded";
}
function build(scene){
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);

  const gold = standard(GOLD, 0.95, 0.28, 0.32);
  const stone = standard(STONE, 0.96, 0.02, 0.40);
  const red = standard(RED, 0.72, 0.02, 0.56);
  const dark = standard(DARK, 0.72, 0.02, 0.62);
  const cyan = glow(CYAN, 0.42);
  const goldGlow = glow(GOLD, 0.32);

  // Central Roman canopy / chuppah-style feature
  const cx = 0, cz = -1.35, w = 7.25, d = 5.35, top = 3.92;
  box(root, "PHASE259_CANOPY_RED_CENTER_RUNNER", 5.9, 0.025, 4.25, cx, 0.125, cz, red);
  box(root, "PHASE259_CANOPY_STONE_BASE_LEFT", 0.70, 0.12, d + 0.50, -w / 2, 0.06, cz, stone);
  box(root, "PHASE259_CANOPY_STONE_BASE_RIGHT", 0.70, 0.12, d + 0.50, w / 2, 0.06, cz, stone);
  box(root, "PHASE259_CANOPY_STONE_BASE_FRONT", w + 0.6, 0.12, 0.68, cx, 0.06, cz + d / 2, stone);
  box(root, "PHASE259_CANOPY_STONE_BASE_BACK", w + 0.6, 0.12, 0.68, cx, 0.06, cz - d / 2, stone);

  [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([x,z], i) => smoothPillar(root, `PHASE259_CENTER_CANOPY_PILLAR_${i}`, x, cz + z, 3.52, 0.18));
  box(root, "PHASE259_CANOPY_FRONT_SMOOTH_BEAM", w + .65, .16, .20, cx, top, cz + d/2, gold);
  box(root, "PHASE259_CANOPY_BACK_SMOOTH_BEAM", w + .65, .16, .20, cx, top, cz - d/2, gold);
  box(root, "PHASE259_CANOPY_LEFT_SMOOTH_BEAM", .20, .16, d + .65, -w/2, top, cz, gold);
  box(root, "PHASE259_CANOPY_RIGHT_SMOOTH_BEAM", .20, .16, d + .65, w/2, top, cz, gold);
  box(root, "PHASE259_CANOPY_DARK_SILK_TOP", w - .52, .035, d - .52, cx, top + .22, cz, dark);
  box(root, "PHASE259_CANOPY_CYAN_SOFT_UNDERLIGHT", w - 1.0, .018, d - 1.0, cx, top - .28, cz, cyan);
  arch(root, "PHASE259_FRONT_MAIN_ROMAN_ARCH", 3.55, .035, cx, 3.48, cz + d/2 + .11, goldGlow, 0, 1, 1.03);
  arch(root, "PHASE259_BACK_MAIN_ROMAN_ARCH", 3.55, .035, cx, 3.48, cz - d/2 - .11, goldGlow, Math.PI, 1, 1.03);
  arch(root, "PHASE259_LEFT_MAIN_ROMAN_ARCH", 2.62, .033, -w/2 - .11, 3.43, cz, goldGlow, Math.PI/2, 1.34, 1.02);
  arch(root, "PHASE259_RIGHT_MAIN_ROMAN_ARCH", 2.62, .033, w/2 + .11, 3.43, cz, goldGlow, -Math.PI/2, 1.34, 1.02);

  // Corner pillars smoother and taller
  [[-13.2,-10.0],[13.2,-10.0],[-13.2,6.8],[13.2,6.8]].forEach(([x,z], i) => smoothPillar(root, `PHASE259_CORNER_ROMAN_PILLAR_${i}`, x, z, 3.72, 0.24));

  // Repeating arch language through lobby walls
  for(let i=0;i<7;i++){
    const x = -9 + i*3;
    smoothPillar(root, `PHASE259_REAR_COLONNADE_PILLAR_${i}`, x, -11.7, 2.95, 0.115);
    arch(root, `PHASE259_REAR_COLONNADE_ARCH_${i}`, 1.28, .022, x, 2.88, -11.58, goldGlow, 0, 1.04, 1.0);
  }
  [-1,1].forEach(side => {
    for(let i=0;i<4;i++){
      const z = -8.2 + i*3.7;
      smoothPillar(root, `PHASE259_SIDE_${side}_COLONNADE_PILLAR_${i}`, side*13.45, z, 2.78, 0.105);
      box(root, `PHASE259_SIDE_${side}_CYAN_CAP_LIGHT_${i}`, .05, .035, 2.15, side*13.20, 2.98, z, cyan);
    }
  });

  window.SVR_PHASE259_GEOMETRY = { build: LABEL, centerCanopy: true, cornerPillars: 4, rearColonnade: 7, sideColonnade: 8, checkedAt: new Date().toISOString() };
}
function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  build(scene);
  return true;
}

stamp();
let tries = 0;
const timer = setInterval(() => { tries++; if(install() || tries > 220) clearInterval(timer); }, 180);
[1200, 2600, 5200, 9000].forEach(t => setTimeout(install, t));
