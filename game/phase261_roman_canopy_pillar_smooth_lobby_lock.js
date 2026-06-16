import * as THREE from "three";

const LABEL = "PHASE-261-ROMAN-CANOPY-PILLAR-SMOOTH-LOBBY-LOCK";
const ROOT = "PHASE261_ROMAN_CANOPY_PILLAR_SMOOTH_ROOT";
const OLD_ROOTS = ["PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT", ROOT];
const GOLD = 0xffd98a;
const STONE = 0xd8d0bc;
const CYAN = 0x7ffcff;
const RED = 0x8c1f2e;
const SILK = 0x101523;
const DEEP = 0x060813;

function standard(color, opacity = 1, metal = 0.08, rough = 0.42){
  return new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness: metal, roughness: rough, side: THREE.DoubleSide });
}
function glow(color, opacity = 0.34){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function box(root, name, sx, sy, sz, x, y, z, mat){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.name = name; m.position.set(x, y, z); root.add(m); return m;
}
function cyl(root, name, r, h, x, y, z, mat, seg = 64){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.name = name; m.position.set(x, y, z); root.add(m); return m;
}
function ring(root, name, inner, outer, x, y, z, mat){
  const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96), mat);
  m.name = name; m.position.set(x, y, z); m.rotation.x = -Math.PI / 2; root.add(m); return m;
}
function arch(root, name, radius, tube, x, y, z, ry, sx, mat){
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 96, Math.PI), mat);
  m.name = name; m.position.set(x, y, z); m.rotation.y = ry; m.scale.x = sx; root.add(m); return m;
}
function drape(root, name, w, h, x, y, z, ry, mat){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 12, 2), mat);
  m.name = name; m.position.set(x, y, z); m.rotation.y = ry; root.add(m); return m;
}
function pillar(root, name, x, z, h = 3.72, r = 0.18){
  const stone = standard(STONE, .98, .02, .38);
  const gold = standard(GOLD, .95, .30, .28);
  cyl(root, name + "_BASE_WIDE_GOLD", r * 2.45, .16, x, .08, z, gold);
  cyl(root, name + "_BASE_STONE_STACK", r * 1.75, .20, x, .28, z, stone);
  cyl(root, name + "_SHAFT_SMOOTH_STONE", r, h, x, h / 2 + .35, z, stone);
  cyl(root, name + "_CAP_STONE_RING", r * 1.72, .18, x, h + .68, z, stone);
  cyl(root, name + "_CAP_WIDE_GOLD", r * 2.35, .18, x, h + .88, z, gold);
}
function clearOld(scene){
  OLD_ROOTS.forEach(n => { const old = scene.getObjectByName(n); if(old) old.parent?.remove(old); });
}
function stamp(){
  window.SVR_PHASE261 = {
    build: LABEL,
    active: true,
    romanCanopyCenter: true,
    chuppahStyleCanopy: true,
    smoothCornerPillars: true,
    lobbyArchLanguage: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  const status = document.getElementById("status");
  if(status) status.textContent = "Phase 261 Roman canopy and pillar polish loaded";
}
function build(scene){
  clearOld(scene);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  const stone = standard(STONE, .96, .02, .38);
  const gold = standard(GOLD, .94, .32, .28);
  const red = standard(RED, .70, .02, .56);
  const silk = standard(SILK, .70, .02, .62);
  const deep = standard(DEEP, .78, .02, .60);
  const cyanGlow = glow(CYAN, .28);
  const goldGlow = glow(GOLD, .24);

  const cx = 0, cz = -1.30, w = 8.05, d = 6.05, top = 4.18;
  box(root, "PHASE261_CENTER_CANOPY_SOFT_STONE_DAIS", w + 1.20, .09, d + 1.15, cx, .055, cz, stone);
  box(root, "PHASE261_CENTER_CANOPY_RED_RUNNER", 5.85, .024, d + .30, cx, .13, cz, red);
  ring(root, "PHASE261_CENTER_GOLD_TABLE_HALO", 2.65, 2.75, cx, .15, cz, goldGlow);

  [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([x,z], i) => pillar(root, `PHASE261_CENTER_ROMAN_CANOPY_PILLAR_${i}`, cx + x, cz + z, 3.64, .21));
  box(root, "PHASE261_FRONT_GOLD_ARCH_BEAM", w + .88, .15, .18, cx, top, cz + d/2, gold);
  box(root, "PHASE261_BACK_GOLD_ARCH_BEAM", w + .88, .15, .18, cx, top, cz - d/2, gold);
  box(root, "PHASE261_LEFT_GOLD_ARCH_BEAM", .18, .15, d + .88, cx - w/2, top, cz, gold);
  box(root, "PHASE261_RIGHT_GOLD_ARCH_BEAM", .18, .15, d + .88, cx + w/2, top, cz, gold);

  box(root, "PHASE261_SMOOTH_DARK_ROMAN_CANOPY_ROOF", w - .42, .035, d - .42, cx, top + .28, cz, silk);
  box(root, "PHASE261_CANOPY_SOFT_CYAN_UNDERLIGHT", w - 1.05, .016, d - 1.05, cx, top - .34, cz, cyanGlow);
  drape(root, "PHASE261_FRONT_SOFT_SILK_VALANCE", w - .55, .54, cx, top - .15, cz + d/2 + .09, 0, deep);
  drape(root, "PHASE261_BACK_SOFT_SILK_VALANCE", w - .55, .54, cx, top - .15, cz - d/2 - .09, Math.PI, deep);
  drape(root, "PHASE261_LEFT_SOFT_SILK_VALANCE", d - .55, .50, cx - w/2 - .09, top - .15, cz, Math.PI / 2, deep);
  drape(root, "PHASE261_RIGHT_SOFT_SILK_VALANCE", d - .55, .50, cx + w/2 + .09, top - .15, cz, -Math.PI / 2, deep);

  arch(root, "PHASE261_FRONT_FULL_ROMAN_CANOPY_ARCH", 3.92, .038, cx, 3.62, cz + d/2 + .13, 0, 1.02, goldGlow);
  arch(root, "PHASE261_BACK_FULL_ROMAN_CANOPY_ARCH", 3.92, .038, cx, 3.62, cz - d/2 - .13, Math.PI, 1.02, goldGlow);
  arch(root, "PHASE261_LEFT_FULL_ROMAN_CANOPY_ARCH", 2.98, .036, cx - w/2 - .13, 3.60, cz, Math.PI / 2, 1.36, goldGlow);
  arch(root, "PHASE261_RIGHT_FULL_ROMAN_CANOPY_ARCH", 2.98, .036, cx + w/2 + .13, 3.60, cz, -Math.PI / 2, 1.36, goldGlow);
  ring(root, "PHASE261_CANOPY_CEILING_OCULUS_GOLD_RING", 1.12, 1.20, cx, top + .34, cz, gold);

  [[-13.4,-10.2],[13.4,-10.2],[-13.4,6.9],[13.4,6.9]].forEach(([x,z], i) => {
    pillar(root, `PHASE261_SMOOTH_CORNER_ROMAN_PILLAR_${i}`, x, z, 3.92, .25);
    box(root, `PHASE261_CORNER_PILLAR_SOFT_GOLD_CAP_${i}`, .92, .08, .92, x, 4.42, z, goldGlow);
  });

  for(let i=0;i<9;i++){
    const x = -12 + i * 3.0;
    pillar(root, `PHASE261_REAR_COLONNADE_PILLAR_${i}`, x, -11.90, 2.92, .105);
    arch(root, `PHASE261_REAR_COLONNADE_SMOOTH_ARCH_${i}`, 1.15, .022, x, 2.88, -11.72, 0, 1.05, goldGlow);
  }
  [-1,1].forEach(side => {
    for(let i=0;i<6;i++){
      const z = -9.2 + i * 3.10;
      pillar(root, `PHASE261_SIDE_${side}_COLONNADE_PILLAR_${i}`, side * 13.55, z, 2.76, .095);
      box(root, `PHASE261_SIDE_${side}_CYAN_ARCH_LIGHT_${i}`, .04, .032, 2.05, side * 13.24, 2.94, z, cyanGlow);
    }
  });

  window.SVR_PHASE261_GEOMETRY = { build: LABEL, centerCanopy: true, centerPillars: 4, cornerPillars: 4, rearColonnade: 9, sideColonnade: 12, checkedAt: new Date().toISOString() };
}
function install(){ stamp(); const scene = window.__SVR_SCENE__; if(!scene) return false; build(scene); return true; }
stamp();
let tries = 0;
const timer = setInterval(() => { tries++; if(install() || tries > 220) clearInterval(timer); }, 160);
[1200, 2600, 5200, 8800, 13000].forEach(t => setTimeout(install, t));
