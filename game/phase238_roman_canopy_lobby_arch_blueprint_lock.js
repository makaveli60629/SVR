import * as THREE from "three";

const LABEL = "PHASE-238-ROMAN-CANOPY-LOBBY-ARCH-BLUEPRINT-LOCK";
const ROOT_NAME = "PHASE238_ROMAN_CANOPY_LOBBY_ARCH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0xc9c1a7;
const DARK_STONE = 0x1b1b24;
const MARBLE = 0xe6dfc8;

function stamp(){
  window.SVR_PHASE238 = {
    build: LABEL,
    active: true,
    romanCanopy: true,
    lobbyArchitectureBlueprint: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, { build: LABEL, phase238: true, active: true });
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
}

function setDomLabel(){
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = "PHASE 238 ACTIVE • ROMAN CANOPY LOBBY";
  const status = document.getElementById("status");
  if(status) status.textContent = "Phase 238 Roman canopy lobby architecture loaded";
}

function standard(color, roughness = .58, metalness = .08, opacity = 1){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
}

function glow(color, opacity = .42){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}

function cylinder(parent, name, radius, height, x, y, z, material, radial = 48){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radial), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function box(parent, name, sx, sy, sz, x, y, z, material){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function plane(parent, name, sx, sy, x, y, z, material, rx = -Math.PI / 2, ry = 0){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, 0);
  parent.add(mesh);
  return mesh;
}

function archTube(parent, name, x1, z1, x2, z2, yBase, rise, material, radius = .035){
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, yBase, z1),
    new THREE.Vector3((x1 + midX) / 2, yBase + rise * .72, (z1 + midZ) / 2),
    new THREE.Vector3(midX, yBase + rise, midZ),
    new THREE.Vector3((x2 + midX) / 2, yBase + rise * .72, (z2 + midZ) / 2),
    new THREE.Vector3(x2, yBase, z2)
  ]);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 12, false), material);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addCapital(parent, name, x, y, z, material){
  box(parent, `${name}_LOWER_ABACUS`, .54, .08, .54, x, y, z, material);
  box(parent, `${name}_UPPER_ABACUS`, .68, .09, .68, x, y + .09, z, material);
  cylinder(parent, `${name}_ROUND_DETAIL`, .31, .08, x, y + .20, z, material, 40);
}

function addRomanPillar(parent, name, x, z, height = 3.1, radius = .15){
  const stone = standard(MARBLE, .5, .05, .98);
  const gold = standard(GOLD, .34, .34, .96);
  cylinder(parent, `${name}_BASE`, radius * 1.75, .18, x, .09, z, gold, 48);
  cylinder(parent, `${name}_SHAFT`, radius, height, x, .22 + height / 2, z, stone, 64);
  for(let i = 0; i < 6; i++){
    const a = (i / 6) * Math.PI * 2;
    const flute = new THREE.Mesh(new THREE.BoxGeometry(.012, height * .92, .018), glow(CYAN, .18));
    flute.name = `${name}_CYAN_FLUTE_${i}`;
    flute.position.set(x + Math.sin(a) * (radius + .011), .25 + height / 2, z + Math.cos(a) * (radius + .011));
    flute.rotation.y = a;
    parent.add(flute);
  }
  addCapital(parent, `${name}_CAPITAL`, x, .25 + height, z, gold);
}

function addCentralCanopy(root){
  const gold = standard(GOLD, .32, .36, .98);
  const softGold = glow(GOLD, .35);
  const cyanGlow = glow(CYAN, .24);
  const canopyMat = standard(0x14131b, .62, .08, .92);
  const tableX = 0;
  const tableZ = -2.0;
  const w = 6.9;
  const d = 5.5;
  const lx = tableX - w / 2;
  const rx = tableX + w / 2;
  const fz = tableZ + d / 2;
  const bz = tableZ - d / 2;
  const pillarH = 3.05;

  addRomanPillar(root, "PHASE238_CENTER_CANOPY_FRONT_LEFT_PILLAR", lx, fz, pillarH, .14);
  addRomanPillar(root, "PHASE238_CENTER_CANOPY_FRONT_RIGHT_PILLAR", rx, fz, pillarH, .14);
  addRomanPillar(root, "PHASE238_CENTER_CANOPY_BACK_LEFT_PILLAR", lx, bz, pillarH, .14);
  addRomanPillar(root, "PHASE238_CENTER_CANOPY_BACK_RIGHT_PILLAR", rx, bz, pillarH, .14);

  box(root, "PHASE238_CENTER_CANOPY_FRONT_GOLD_BEAM", w + .5, .12, .18, tableX, 3.42, fz, gold);
  box(root, "PHASE238_CENTER_CANOPY_BACK_GOLD_BEAM", w + .5, .12, .18, tableX, 3.42, bz, gold);
  box(root, "PHASE238_CENTER_CANOPY_LEFT_GOLD_BEAM", .18, .12, d + .5, lx, 3.42, tableZ, gold);
  box(root, "PHASE238_CENTER_CANOPY_RIGHT_GOLD_BEAM", .18, .12, d + .5, rx, 3.42, tableZ, gold);

  archTube(root, "PHASE238_CENTER_CANOPY_FRONT_ROMAN_ARCH", lx, fz, rx, fz, 2.48, 1.05, gold, .045);
  archTube(root, "PHASE238_CENTER_CANOPY_BACK_ROMAN_ARCH", lx, bz, rx, bz, 2.48, 1.05, gold, .045);
  archTube(root, "PHASE238_CENTER_CANOPY_LEFT_ROMAN_ARCH", lx, fz, lx, bz, 2.48, 1.05, gold, .045);
  archTube(root, "PHASE238_CENTER_CANOPY_RIGHT_ROMAN_ARCH", rx, fz, rx, bz, 2.48, 1.05, gold, .045);

  plane(root, "PHASE238_CENTER_CANOPY_DARK_CANVAS_TOP", w + .25, d + .25, tableX, 3.55, tableZ, canopyMat, -Math.PI / 2, 0);
  plane(root, "PHASE238_CENTER_CANOPY_SOFT_UNDER_GLOW", w - .55, d - .55, tableX, 3.36, tableZ, softGold, -Math.PI / 2, 0);
  box(root, "PHASE238_CENTER_CANOPY_CYAN_FRONT_TRIM", w + .35, .04, .04, tableX, 3.30, fz + .03, cyanGlow);
  box(root, "PHASE238_CENTER_CANOPY_CYAN_BACK_TRIM", w + .35, .04, .04, tableX, 3.30, bz - .03, cyanGlow);
  box(root, "PHASE238_CENTER_CANOPY_CYAN_LEFT_TRIM", .04, .04, d + .35, lx - .03, 3.30, tableZ, cyanGlow);
  box(root, "PHASE238_CENTER_CANOPY_CYAN_RIGHT_TRIM", .04, .04, d + .35, rx + .03, 3.30, tableZ, cyanGlow);
}

function addPerimeterArcades(root){
  const gold = standard(GOLD, .34, .34, .92);
  const stone = standard(STONE, .54, .06, .90);
  const cyan = glow(CYAN, .33);
  const bays = [-10, -6, -2, 2, 6, 10];
  bays.forEach((x, i) => {
    addRomanPillar(root, `PHASE238_BACK_ARCADE_${i}_LEFT`, x - 1.4, -12.35, 2.55, .11);
    addRomanPillar(root, `PHASE238_BACK_ARCADE_${i}_RIGHT`, x + 1.4, -12.35, 2.55, .11);
    archTube(root, `PHASE238_BACK_ARCADE_${i}_ARCH`, x - 1.4, -12.35, x + 1.4, -12.35, 2.18, .76, gold, .033);
    box(root, `PHASE238_BACK_ARCADE_${i}_LOW_WALL`, 2.6, .05, .04, x, 1.05, -12.42, cyan);
  });
  [-13.65, 13.65].forEach((x, side) => {
    [-8.8, -5.4, -2.0, 1.4, 4.8].forEach((z, i) => {
      addRomanPillar(root, `PHASE238_${side ? "RIGHT" : "LEFT"}_SIDE_ARCADE_${i}_A`, x, z - 1.05, 2.45, .105);
      addRomanPillar(root, `PHASE238_${side ? "RIGHT" : "LEFT"}_SIDE_ARCADE_${i}_B`, x, z + 1.05, 2.45, .105);
      archTube(root, `PHASE238_${side ? "RIGHT" : "LEFT"}_SIDE_ARCADE_${i}_ARCH`, x, z - 1.05, x, z + 1.05, 2.12, .68, gold, .03);
    });
  });
  [[-13.5,6.7],[13.5,6.7],[-13.5,-12.2],[13.5,-12.2]].forEach(([x,z], idx)=>{
    addRomanPillar(root, `PHASE238_CORNER_SMOOTH_LOBBY_PILLAR_${idx}`, x, z, 3.25, .18);
    cylinder(root, `PHASE238_CORNER_GOLD_LIGHT_RING_${idx}`, .34, .035, x, 2.25, z, gold, 64);
  });
  box(root, "PHASE238_BACK_WALL_CONTINUOUS_GOLD_CORNICE", 27.5, .09, .08, 0, 3.42, -12.45, gold);
  box(root, "PHASE238_BACK_WALL_CONTINUOUS_CYAN_GLOW", 27.5, .035, .04, 0, 3.62, -12.38, cyan);
  box(root, "PHASE238_LEFT_WALL_CONTINUOUS_GOLD_CORNICE", .08, .09, 18.0, -13.78, 3.42, -2.6, gold);
  box(root, "PHASE238_RIGHT_WALL_CONTINUOUS_GOLD_CORNICE", .08, .09, 18.0, 13.78, 3.42, -2.6, gold);
}

function addBlueprintFloor(root){
  const floorGold = glow(GOLD, .24);
  const floorCyan = glow(CYAN, .18);
  plane(root, "PHASE238_BLUEPRINT_CANOPY_FLOOR_OVAL", 9.2, 7.0, 0, .085, -2.0, floorGold, -Math.PI / 2, 0);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.15, 3.22, 128), glow(GOLD, .72));
  ring.name = "PHASE238_CANOPY_TABLE_CENTER_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, .115, -2.0);
  root.add(ring);
  [-3.45, 3.45].forEach((x, i)=> box(root, `PHASE238_FLOOR_CYAN_AXIS_X_${i}`, .035, .03, 7.3, x, .12, -2.0, floorCyan));
  [-4.75, .75].forEach((z, i)=> box(root, `PHASE238_FLOOR_CYAN_AXIS_Z_${i}`, 8.2, .03, .035, 0, .12, z, floorCyan));
}

function build(scene){
  const old = scene.getObjectByName(ROOT_NAME);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT_NAME;
  scene.add(root);
  addBlueprintFloor(root);
  addCentralCanopy(root);
  addPerimeterArcades(root);
  window.SVR_PHASE238_GEOMETRY = {
    build: LABEL,
    centralCanopy: true,
    cornerPillars: true,
    perimeterArcades: true,
    checkedAt: new Date().toISOString()
  };
}

function install(){
  stamp();
  setDomLabel();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  build(scene);
  return true;
}

stamp();
setDomLabel();
let tries = 0;
const timer = setInterval(() => {
  tries++;
  if(install() || tries > 200) clearInterval(timer);
}, 160);
setTimeout(install, 1800);
setTimeout(install, 4200);
