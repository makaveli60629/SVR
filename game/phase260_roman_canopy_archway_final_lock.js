import * as THREE from "three";
import "./phase101g_hud_overlay_cleanup.js?v=phase101g-hud-overlay-cleanup";
import "./phase101h_scene_geometry_cleanup.js?v=phase101h-scene-geometry-cleanup";
import "./phase101i_camera_spawn_path_polish.js?v=phase101i-camera-spawn-path-polish";
import "./phase101k_quest_performance_cleanup.js?v=phase101k-quest-performance-cleanup";

const LABEL = "PHASE-260-ROMAN-CANOPY-ARCHWAY-FINAL-LOCK";
const DISPLAY_LABEL = "PHASE-101M-CURRENT-STACK-VISIBLE-LOCK";
const ROOT = "PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT";
const GOLD = 0xffd98a;
const STONE = 0xd8d0bc;
const CYAN = 0x7ffcff;
const RED = 0x8c1f2e;
const SILK = 0x111526;

function std(color, opacity = 1, metal = 0.06, rough = 0.42){
  return new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness: metal, roughness: rough, side: THREE.DoubleSide });
}
function basic(color, opacity = 0.4){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function box(root, name, sx, sy, sz, x, y, z, mat){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.name = name; m.position.set(x,y,z); root.add(m); return m;
}
function cyl(root, name, r, h, x, y, z, mat, seg = 56){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.name = name; m.position.set(x,y,z); root.add(m); return m;
}
function torusArch(root, name, radius, tube, x, y, z, ry, sx, mat){
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 96, Math.PI), mat);
  m.name = name; m.position.set(x,y,z); m.rotation.y = ry; m.scale.x = sx; root.add(m); return m;
}
function pillar(root, name, x, z, h = 3.55, r = 0.17){
  const stone = std(STONE, .98, .02, .38), gold = std(GOLD, .95, .28, .30);
  cyl(root, name + "_SHAFT", r, h, x, h/2, z, stone);
  cyl(root, name + "_LOWER_PLINTH", r*2.25, .16, x, .08, z, gold);
  cyl(root, name + "_LOWER_STONE_RING", r*1.6, .16, x, .26, z, stone);
  cyl(root, name + "_UPPER_STONE_RING", r*1.55, .16, x, h+.02, z, stone);
  cyl(root, name + "_UPPER_GOLD_CAP", r*2.25, .16, x, h+.22, z, gold);
}
function stamp(){
  window.SVR_PHASE260 = { build: LABEL, active: true, romanCanopyFinal: true, archwayLobbyStyle: true, hudCleanup: true, sceneCleanup: true, cameraPathPolish: true, questPerformanceCleanup: true, siteTouched: false, checkedAt: new Date().toISOString() };
  window.SVR_PHASE101M_CURRENT_STACK = {
    build: DISPLAY_LABEL,
    active: true,
    visibleBuild: true,
    phase260GeometryPreserved: true,
    loadedStack: ["101G HUD cleanup", "101H geometry cleanup", "101I camera/path polish", "101J locomotion forward lock", "101K Quest performance", "101L live QA"],
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = DISPLAY_LABEL;
  try { document.title = `SVR Poker • ${DISPLAY_LABEL}`; } catch {}
  const phase = document.getElementById("svr-phase-label"); if(phase) phase.textContent = "PHASE 101M ACTIVE • CURRENT STACK • PHASE 260 GEOMETRY";
  const status = document.getElementById("status"); if(status) status.textContent = "Phase 101M current stack loaded • Phase 260 geometry preserved";
}
function build(scene){
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  const gold = std(GOLD, .94, .32, .28), stone = std(STONE, .96, .02, .38), red = std(RED, .70, .02, .55), silk = std(SILK, .72, .02, .62), cyan = basic(CYAN, .34), goldGlow = basic(GOLD, .30);

  const cx = 0, cz = -1.30, w = 7.75, d = 5.85, top = 4.08;
  box(root, "PHASE260_CANOPY_RAISED_STONE_STEP", w + 1.05, .10, d + 1.05, cx, .055, cz, stone);
  box(root, "PHASE260_CANOPY_RED_CENTRAL_RUNNER", 5.8, .025, d + .20, cx, .135, cz, red);
  [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([x,z], i) => pillar(root, `PHASE260_CENTER_CHUPPAH_ROMAN_PILLAR_${i}`, cx+x, cz+z, 3.62, .19));
  box(root, "PHASE260_CANOPY_FRONT_GOLD_BEAM", w+.75, .15, .18, cx, top, cz+d/2, gold);
  box(root, "PHASE260_CANOPY_BACK_GOLD_BEAM", w+.75, .15, .18, cx, top, cz-d/2, gold);
  box(root, "PHASE260_CANOPY_LEFT_GOLD_BEAM", .18, .15, d+.75, cx-w/2, top, cz, gold);
  box(root, "PHASE260_CANOPY_RIGHT_GOLD_BEAM", .18, .15, d+.75, cx+w/2, top, cz, gold);
  box(root, "PHASE260_CANOPY_SMOOTH_DARK_SILK_ROOF", w-.55, .032, d-.55, cx, top+.24, cz, silk);
  box(root, "PHASE260_CANOPY_CYAN_UNDERGLOW", w-1.0, .018, d-1.0, cx, top-.34, cz, cyan);
  torusArch(root, "PHASE260_FRONT_FULL_ROMAN_ARCH", 3.78, .036, cx, 3.56, cz+d/2+.12, 0, 1.02, goldGlow);
  torusArch(root, "PHASE260_BACK_FULL_ROMAN_ARCH", 3.78, .036, cx, 3.56, cz-d/2-.12, Math.PI, 1.02, goldGlow);
  torusArch(root, "PHASE260_LEFT_SIDE_ROMAN_ARCH", 2.88, .034, cx-w/2-.12, 3.54, cz, Math.PI/2, 1.33, goldGlow);
  torusArch(root, "PHASE260_RIGHT_SIDE_ROMAN_ARCH", 2.88, .034, cx+w/2+.12, 3.54, cz, -Math.PI/2, 1.33, goldGlow);

  [[-13.4,-10.2],[13.4,-10.2],[-13.4,6.9],[13.4,6.9]].forEach(([x,z], i) => pillar(root, `PHASE260_SMOOTH_CORNER_LOBBY_PILLAR_${i}`, x, z, 3.86, .25));
  for(let i=0;i<8;i++){ const x=-10.5+i*3; pillar(root, `PHASE260_REAR_ARCHWAY_PILLAR_${i}`, x, -11.85, 2.86, .105); torusArch(root, `PHASE260_REAR_ARCHWAY_GLOW_${i}`, 1.16, .02, x, 2.82, -11.72, 0, 1.05, goldGlow); }
  [-1,1].forEach(side => { for(let i=0;i<5;i++){ const z=-8.8+i*3.55; pillar(root, `PHASE260_SIDE_${side}_SMOOTH_PILLAR_${i}`, side*13.55, z, 2.72, .095); box(root, `PHASE260_SIDE_${side}_CYAN_ARCH_LIGHT_${i}`, .04, .035, 2.0, side*13.22, 2.92, z, cyan); } });
  window.SVR_PHASE260_GEOMETRY = { build: LABEL, visibleBuild: DISPLAY_LABEL, centerRomanCanopy: true, smoothCornerPillars: 4, rearArchways: 8, sidePillars: 10, checkedAt:new Date().toISOString() };
}
function install(){ stamp(); const scene = window.__SVR_SCENE__; if(!scene) return false; build(scene); return true; }
stamp();
let tries = 0;
const timer = setInterval(() => { tries++; if(install() || tries > 220) clearInterval(timer); }, 180);
[1200, 2800, 5600, 10000].forEach(t => setTimeout(install, t));
