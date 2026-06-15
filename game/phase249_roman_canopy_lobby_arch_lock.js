import * as THREE from "three";

const LABEL = "PHASE-249-ROMAN-CANOPY-LOBBY-ARCH-LOCK";
const ROOT_NAME = "PHASE249_ROMAN_CANOPY_LOBBY_ARCH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9f5cff;
const STONE = 0xd8d0bc;
const DARK = 0x090b14;

function stamp(){
  window.SVR_PHASE249 = {
    build: LABEL,
    active: true,
    romanCanopy: true,
    centralArchCanopy: true,
    cornerPillars: true,
    lobbyRhythm: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = "PHASE 249 ACTIVE • ROMAN CANOPY LOBBY";
  const status = document.getElementById("status");
  if(status) status.textContent = "Phase 249 Roman canopy lobby polish loaded";
}

function material(color, opacity=1, metalness=.05, roughness=.55){
  return new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness, roughness, side: THREE.DoubleSide });
}
function glow(color, opacity=.45){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function addBox(root, name, sx, sy, sz, x, y, z, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.name = name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
}
function addCyl(root, name, r, h, x, y, z, mat){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), mat);
  mesh.name = name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
}
function addRingArch(root, name, radius, tube, x, y, z, mat, rotY=0){
  const curve = new THREE.TorusGeometry(radius, tube, 12, 48, Math.PI);
  const arch = new THREE.Mesh(curve, mat);
  arch.name = name;
  arch.position.set(x,y,z);
  arch.rotation.set(0, rotY, 0);
  root.add(arch);
  return arch;
}
function addPanelText(root, name, title, sub, x, y, z, w=3.4, h=1.0){
  const c = document.createElement("canvas"); c.width = 900; c.height = 280;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(4,6,16,.86)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = "#ffd98a"; ctx.lineWidth = 8; ctx.strokeRect(12,12,c.width-24,c.height-24);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffd98a"; ctx.font = "900 44px system-ui,Arial"; ctx.fillText(title, c.width/2, 106);
  ctx.fillStyle = "#7ffcff"; ctx.font = "800 24px system-ui,Arial"; ctx.fillText(sub, c.width/2, 178);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  mesh.name = name; mesh.position.set(x,y,z); mesh.rotation.y = Math.PI; root.add(mesh); return mesh;
}

function build(scene){
  const old = scene.getObjectByName(ROOT_NAME);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT_NAME; scene.add(root);

  const stoneMat = material(STONE, .94, .02, .48);
  const goldMat = material(GOLD, .92, .22, .38);
  const darkMat = material(DARK, .82, .02, .66);
  const purpleGlow = glow(PURPLE, .22);
  const cyanGlow = glow(CYAN, .32);

  const canopyY = 3.55;
  const pillarY = 1.75;
  const halfX = 3.15;
  const halfZ = 2.25;
  const baseZ = -1.35;

  // Central chuppah / Roman canopy: four pillars, gold bases, overhead rails, cross drape.
  [[-halfX,-halfZ],[halfX,-halfZ],[-halfX,halfZ],[halfX,halfZ]].forEach(([x,z],i)=>{
    addCyl(root, `PHASE249_CANOPY_SMOOTH_PILLAR_${i}`, .16, 3.35, x, pillarY, baseZ+z, stoneMat);
    addCyl(root, `PHASE249_CANOPY_GOLD_BASE_${i}`, .28, .12, x, .11, baseZ+z, goldMat);
    addCyl(root, `PHASE249_CANOPY_GOLD_CAP_${i}`, .24, .14, x, 3.48, baseZ+z, goldMat);
    const groove1 = addCyl(root, `PHASE249_CANOPY_GOLD_GROOVE_A_${i}`, .175, .035, x, 2.2, baseZ+z, goldMat); groove1.rotation.x = Math.PI/2;
    const groove2 = addCyl(root, `PHASE249_CANOPY_GOLD_GROOVE_B_${i}`, .175, .035, x, 1.15, baseZ+z, goldMat); groove2.rotation.x = Math.PI/2;
  });
  addBox(root,"PHASE249_CANOPY_FRONT_GOLD_BEAM",6.65,.13,.15,0,canopyY,baseZ+halfZ,goldMat);
  addBox(root,"PHASE249_CANOPY_BACK_GOLD_BEAM",6.65,.13,.15,0,canopyY,baseZ-halfZ,goldMat);
  addBox(root,"PHASE249_CANOPY_LEFT_GOLD_BEAM",.15,.13,4.85,-halfX,canopyY,baseZ,goldMat);
  addBox(root,"PHASE249_CANOPY_RIGHT_GOLD_BEAM",.15,.13,4.85,halfX,canopyY,baseZ,goldMat);
  addBox(root,"PHASE249_CANOPY_SOFT_TOP_PANEL",6.25,.035,4.3,0,3.72,baseZ,material(0x151327,.68,.02,.7));
  addBox(root,"PHASE249_CANOPY_CYAN_UNDERGLOW",5.9,.02,3.9,0,3.49,baseZ,cyanGlow);
  addBox(root,"PHASE249_CANOPY_PURPLE_CENTER_DRAPE",1.35,.028,4.15,0,3.75,baseZ,purpleGlow);
  addRingArch(root,"PHASE249_CANOPY_FRONT_ROMAN_ARCH",3.15,.035,0,3.18,baseZ+halfZ+.06,goldMat,0);
  addRingArch(root,"PHASE249_CANOPY_BACK_ROMAN_ARCH",3.15,.035,0,3.18,baseZ-halfZ-.06,goldMat,Math.PI);
  const leftArch = addRingArch(root,"PHASE249_CANOPY_LEFT_ROMAN_ARCH",2.25,.035,-halfX-.06,3.18,baseZ,goldMat,Math.PI/2);
  leftArch.scale.x = 1.38;
  const rightArch = addRingArch(root,"PHASE249_CANOPY_RIGHT_ROMAN_ARCH",2.25,.035,halfX+.06,3.18,baseZ,goldMat,-Math.PI/2);
  rightArch.scale.x = 1.38;

  // Outer corner pillar identity.
  [[-12.8,-9.8],[12.8,-9.8],[-12.8,6.4],[12.8,6.4]].forEach(([x,z],i)=>{
    addCyl(root, `PHASE249_LOBBY_CORNER_ROMAN_PILLAR_${i}`, .22, 3.55, x, 1.85, z, stoneMat);
    addCyl(root, `PHASE249_LOBBY_CORNER_GOLD_BASE_${i}`, .36, .12, x, .12, z, goldMat);
    addCyl(root, `PHASE249_LOBBY_CORNER_GOLD_CAP_${i}`, .34, .14, x, 3.62, z, goldMat);
    const halo = addCyl(root, `PHASE249_LOBBY_CORNER_CYAN_HALO_${i}`, .43, .018, x, 3.78, z, cyanGlow); halo.rotation.x = Math.PI/2;
  });

  // Smooth repeated arch rhythm throughout lobby edges.
  for(let i=0;i<7;i++){
    const x = -9 + i*3;
    addCyl(root, `PHASE249_BACK_WALL_PILLAR_${i}`, .10, 2.65, x, 1.45, -11.5, stoneMat);
    addBox(root, `PHASE249_BACK_WALL_GOLD_RAIL_${i}`, 2.35, .07, .07, x, 2.84, -11.45, goldMat);
    addRingArch(root, `PHASE249_BACK_WALL_ROMAN_ARCH_${i}`, 1.08, .025, x, 2.74, -11.38, goldMat, 0);
  }
  [-1,1].forEach((side)=>{
    for(let i=0;i<4;i++){
      const z = -7.5 + i*3.4;
      addCyl(root, `PHASE249_SIDE_${side}_PILLAR_${i}`, .10, 2.45, side*13.3, 1.35, z, stoneMat);
      addBox(root, `PHASE249_SIDE_${side}_CYAN_RAIL_${i}`, .06, .055, 2.25, side*13.18, 2.72, z, cyanGlow);
    }
  });

  // Main canopy sign.
  addPanelText(root, "PHASE249_CANOPY_LOBBY_SIGN", "SVR LOBBY CANOPY", "Roman arch structure • centered feature", 0, 4.25, baseZ+halfZ+.18, 4.4, 1.05);
  window.SVR_PHASE249_GEOMETRY = { build: LABEL, centerCanopy: true, pillars: 4, cornerPillars: 4, edgeArchRhythm: true, checkedAt: new Date().toISOString() };
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
const timer = setInterval(()=>{ tries++; if(install() || tries > 180) clearInterval(timer); }, 180);
setTimeout(install, 1600);
setTimeout(install, 4200);
