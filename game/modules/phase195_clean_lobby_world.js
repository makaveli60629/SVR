import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-199-GRAND-ATRIUM-STRUCTURE-LOCK";
const HALF_W = 20.0;
const HALF_D = 16.0;
const FLOOR_LIMIT_X = 18.8;
const FLOOR_LIMIT_Z = 15.0;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const MARBLE = 0x171923;
const WALL = 0x0a0d18;

function mat(color, emissive = 0x000000, emissiveIntensity = 0.05, roughness = 0.72, metalness = 0.06){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}
function basic(color, opacity = 1){
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity >= 0.35 });
}
function glow(color, opacity = 0.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function addBox(root, name, sx, sy, sz, x, y, z, material, rotY = 0){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.name = name; mesh.position.set(x,y,z); mesh.rotation.y = rotY; root.add(mesh); return mesh;
}
function makeLabel(title, sub, note, color = "#ffd98a"){
  const c = document.createElement("canvas"); c.width = 1200; c.height = 520;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#030713"); g.addColorStop(1,"#130719");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.fillStyle = "rgba(255,255,255,.045)"; x.fillRect(64,64,c.width-128,92);
  x.strokeStyle = color; x.lineWidth = 14; x.strokeRect(28,28,c.width-56,c.height-56);
  x.strokeStyle = "rgba(255,255,255,.16)"; x.lineWidth = 3; x.strokeRect(58,58,c.width-116,c.height-116);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#fff"; x.font = "900 78px system-ui,Arial"; x.fillText(title,c.width/2,116);
  x.fillStyle = color; x.font = "800 42px system-ui,Arial"; x.fillText(sub,c.width/2,268);
  x.fillStyle = "#dfefff"; x.font = "700 30px system-ui,Arial"; x.fillText(note,c.width/2,366);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function addPanel(root, name, title, sub, note, x, y, z, rotY, color = "#ffd98a", w = 4.5, h = 1.72){
  const frame = addBox(root, `${name}_FRAME`, w + 0.34, h + 0.34, 0.16, x, y, z, mat(0x11131f,0x050611,0.16,0.70,0.06), rotY);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:makeLabel(title,sub,note,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name = name; panel.position.set(x,y+0.04,z); panel.rotation.y = rotY; panel.renderOrder = 80; root.add(panel);
  return panel;
}
function addColumn(root, name, x, z, height = 5.55, rotY = 0){
  const group = new THREE.Group(); group.name = name; group.position.set(x,0,z); group.rotation.y = rotY;
  const stone = mat(0xd7c3a0,0x100a04,0.14,0.58,0.10);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.50,0.22,32), stone); base.position.y = 0.11; group.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.29,height,32), stone); shaft.position.y = 0.24 + height/2; group.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95,0.22,0.70), stone); cap.position.y = height + 0.48; group.add(cap);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.017,8,48), glow(CYAN,0.36)); ringA.rotation.x = Math.PI/2; ringA.position.y = 0.52; group.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.017,8,48), glow(GOLD,0.36)); ringB.rotation.x = Math.PI/2; ringB.position.y = height - 0.12; group.add(ringB);
  root.add(group); return group;
}
function addArchBay(root, idx, theta, title, colorHex){
  const r = 16.15;
  const x = Math.sin(theta)*r;
  const z = -Math.cos(theta)*r;
  const rotY = theta;
  const bay = new THREE.Group(); bay.name = `PHASE199_GRAND_ARCH_BAY_${idx}`; bay.position.set(x,0,z); bay.rotation.y = rotY; root.add(bay);
  addBox(bay, `PHASE199_BAY_${idx}_BACK_WALL`, 3.65, 5.45, 0.32, 0, 2.72, 0, mat(WALL,0x040713,0.12,0.80,0.04));
  addBox(bay, `PHASE199_BAY_${idx}_LOWER_RECESS`, 2.65, 1.95, 0.06, 0, 1.55, 0.185, basic(0x050711,0.96));
  addBox(bay, `PHASE199_BAY_${idx}_UPPER_RECESS`, 2.35, 1.42, 0.06, 0, 3.82, 0.19, basic(0x060814,0.94));
  addBox(bay, `PHASE199_BAY_${idx}_GOLD_TOP`, 3.85, 0.06, 0.08, 0, 5.42, 0.21, glow(GOLD,0.52));
  addBox(bay, `PHASE199_BAY_${idx}_CYAN_BASE`, 3.65, 0.045, 0.08, 0, 0.22, 0.22, glow(CYAN,0.38));
  addColumn(bay, `PHASE199_BAY_${idx}_LEFT_COLUMN`, -1.82, 0.24, 4.75);
  addColumn(bay, `PHASE199_BAY_${idx}_RIGHT_COLUMN`, 1.82, 0.24, 4.75);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.15,0.035,8,80,Math.PI), glow(GOLD,0.44));
  arch.name = `PHASE199_BAY_${idx}_ARCH_GLOW`; arch.position.set(0,2.72,0.26); arch.rotation.z = Math.PI; bay.add(arch);
  if (title) addPanel(bay, `PHASE199_BAY_${idx}_SIGN`, title, "module bay", "structure placeholder", 0, 3.95, 0.245, 0, colorHex, 1.95, 0.72);
  return bay;
}
function addGrandCurvedAtrium(root){
  const bays = [
    "WELLNESS","PLAY GAME","DEAL & LEARN","","SVR","","LEGENDS","SPONSORS","SCORPION"
  ];
  const colors = ["#a77cff","#ffd98a","#7ffcff","#ffd98a","#ffd98a","#ffd98a","#ffd98a","#7ffcff","#ff5b8c"];
  const start = -1.18;
  const step = 2.36/(bays.length-1);
  bays.forEach((label,i)=>addArchBay(root,i+1,start+i*step,label,colors[i]));

  const balconyMat = new THREE.MeshStandardMaterial({ color:0x151923, roughness:0.76, metalness:0.06, emissive:0x040713, emissiveIntensity:0.12, transparent:true, opacity:0.80 });
  const balcony = new THREE.Mesh(new THREE.RingGeometry(9.25,15.85,160,1,Math.PI*1.14,Math.PI*.72), balconyMat);
  balcony.name = "PHASE199_CONTINUOUS_UPSTAIRS_BALCONY_WALKWAY"; balcony.rotation.x = -Math.PI/2; balcony.position.y = 3.42; root.add(balcony);
  const innerRail = new THREE.Mesh(new THREE.TorusGeometry(9.28,0.035,8,160,Math.PI*.72), glow(GOLD,0.66));
  innerRail.name = "PHASE199_CURVED_INNER_BALCONY_RAIL"; innerRail.rotation.x = Math.PI/2; innerRail.rotation.z = Math.PI*1.14; innerRail.position.y = 3.84; root.add(innerRail);
  const outerRail = new THREE.Mesh(new THREE.TorusGeometry(15.78,0.026,8,160,Math.PI*.72), glow(CYAN,0.40));
  outerRail.name = "PHASE199_CURVED_OUTER_BALCONY_RAIL"; outerRail.rotation.x = Math.PI/2; outerRail.rotation.z = Math.PI*1.14; outerRail.position.y = 3.80; root.add(outerRail);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(9.32,9.32,0.74,160,1,true,Math.PI*1.14,Math.PI*.72), new THREE.MeshBasicMaterial({ color:CYAN, transparent:true, opacity:0.10, side:THREE.DoubleSide, depthWrite:false }));
  glass.name = "PHASE199_BALCONY_GUARD_GLASS"; glass.position.y = 4.02; root.add(glass);
}
function addModuleKiosks(root){
  addPanel(root,"PHASE199_MAIN_PLAY_TABLE_SELECT","PLAY GAME","Choose your table","Hold'em / Omaha bays next",0,2.85,-5.9,0,"#ffd98a",5.2,1.65);
  addPanel(root,"PHASE199_WELLNESS_PORTAL","WELLNESS HUB","Reiki / relaxation","approval-ready structure",-6.2,1.82,-4.8,0.18,"#a77cff",3.15,1.28);
  addPanel(root,"PHASE199_PGA_PORTAL","PGA HUB","Practice / grips / achieve",6.2,1.82,-4.8,-0.18,"#7ffcff",3.15,1.28);
  addPanel(root,"PHASE199_DAILY_BONUS_KIOSK","DAILY BONUS","collect reward","front kiosk placeholder",-10.8,1.55,4.2,0.42,"#ffd98a",2.35,1.45);
  addPanel(root,"PHASE199_SPONSOR_KIOSK","SPONSOR AREA","partner wall","ads return next",10.8,1.55,4.2,-0.42,"#7ffcff",2.35,1.45);
  addPanel(root,"PHASE199_LEFT_JUMBOTRON_PLACEHOLDER","JUMBOTRON","brand here","tier-1 ad slot",-14.9,2.22,-1.6,Math.PI/2,"#7ffcff",3.9,1.9);
  addPanel(root,"PHASE199_RIGHT_JUMBOTRON_PLACEHOLDER","JUMBOTRON","brand here","tier-1 ad slot",14.9,2.22,-1.6,-Math.PI/2,"#7ffcff",3.9,1.9);
}
function addTable(root){
  const table = new THREE.Group(); table.name = "PHASE199_INTENDED_LOBBY_POKER_TABLE_LOCKED"; table.position.set(0,0,0.35);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.42,2.42,0.22,80), mat(0x211821,0x05070f,0.14,0.72,0.08)); rail.scale.z = 0.66; rail.position.y = 0.82; table.add(rail);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.10,2.10,0.04,80), mat(0x06190f,0x06301f,0.22,0.86,0.02)); felt.scale.z = 0.58; felt.position.y = 0.96; table.add(felt);
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(2.05,0.028,8,128), glow(GOLD,0.64)); goldRing.scale.z = 0.58; goldRing.rotation.x = Math.PI/2; goldRing.position.y = 0.99; table.add(goldRing);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.48,64), glow(CYAN,0.24)); logo.name = "PHASE199_TABLE_CENTER_SVR_LOGO_PAD"; logo.rotation.x = -Math.PI/2; logo.position.y = 1.01; table.add(logo);
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + Math.PI/6;
    const x = Math.sin(a)*3.05; const z = Math.cos(a)*2.08;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.78,0.52), mat(0x1a1422,0x06030a,0.10,0.72,0.03));
    chair.name = `PHASE199_CLEAN_CHAIR_${i+1}`; chair.position.set(x,0.39,z); chair.lookAt(0,0.39,0); table.add(chair);
  }
  root.add(table); return table;
}
function addPortalPad(root, name, x, z, color){
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.72,0.90,72), glow(color,0.58));
  pad.name = name; pad.rotation.x = -Math.PI/2; pad.position.set(x,0.035,z); root.add(pad);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.60,48), glow(color,0.13));
  core.name = `${name}_SOFT_CORE`; core.rotation.x = -Math.PI/2; core.position.set(x,0.031,z); root.add(core);
}
function addFloorAndSky(root){
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W*2,HALF_D*2), mat(MARBLE,0x03040a,0.05,0.86,0.05));
  floor.name = "PHASE195_ONE_VISUAL_FLOOR"; floor.rotation.x = -Math.PI/2; floor.position.y = 0; floor.renderOrder = -20; root.add(floor);
  const grid = new THREE.GridHelper(HALF_W*2, 40, 0x2f405b, 0x1b2334); grid.name = "PHASE195_SUBTLE_FLOOR_GRID"; grid.position.y = 0.012; root.add(grid);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.35,13.8), new THREE.MeshBasicMaterial({ color:0x4b0616, transparent:true, opacity:0.50, side:THREE.DoubleSide, depthWrite:false }));
  carpet.name = "PHASE199_CENTER_CARPET_PATH"; carpet.rotation.x = -Math.PI/2; carpet.position.set(0,0.018,2.2); root.add(carpet);
  const crest = new THREE.Mesh(new THREE.RingGeometry(0.82,1.1,72), glow(GOLD,0.32)); crest.name = "PHASE199_FLOOR_CENTER_CREST_RING"; crest.rotation.x = -Math.PI/2; crest.position.set(0,0.026,5.4); root.add(crest);

  const geo = new THREE.BufferGeometry(); const pts = [];
  for(let i=0;i<1200;i++){ const r = 44 + Math.random()*50; const a = Math.random()*Math.PI*2; const y = 7 + Math.random()*29; pts.push(Math.cos(a)*r,y,Math.sin(a)*r); }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts,3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:0.038, sizeAttenuation:true, transparent:true, opacity:0.88 })); stars.name = "PHASE199_STAR_FIELD_ONLY"; root.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.28,56,36), mat(0xd8d6ce,0x1b2231,0.18,0.78,0.02)); moon.name = "PHASE199_SINGLE_VISIBLE_MOON_LOCKED"; moon.position.set(-3.4,10.2,-18.2); root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.40,36,24), mat(0xbf4b2e,0x2a0803,0.22,0.82,0.02)); mars.name = "PHASE199_SINGLE_VISIBLE_MARS_LOCKED"; mars.position.set(5.5,8.9,-20.5); root.add(mars);
  root.userData.moon = moon; root.userData.mars = mars;
}
function addLights(scene){
  const hemi = new THREE.HemisphereLight(0xb8cfff,0x060710,0.46); hemi.name = "PHASE199_SOFT_HEMISPHERE_LIGHT"; scene.add(hemi);
  const key = new THREE.DirectionalLight(0xc9ddff,0.68); key.name = "PHASE199_KEY_LIGHT"; key.position.set(-5,8,5); scene.add(key);
  const center = new THREE.PointLight(CYAN,0.82,22,2.0); center.name = "PHASE199_CENTER_ACCENT_LIGHT"; center.position.set(0,3.2,0); scene.add(center);
  const warm = new THREE.PointLight(GOLD,0.48,24,2.0); warm.name = "PHASE199_WARM_LOBBY_WASH"; warm.position.set(0,4.3,-5.8); scene.add(warm);
}
export async function buildPhase195CleanLobbyWorld(scene, { log = console.log } = {}){
  scene.background = new THREE.Color(0x000006);
  scene.fog = null;
  const root = new THREE.Group(); root.name = "PHASE199_GRAND_ATRIUM_STRUCTURE_ROOT"; scene.add(root);
  addFloorAndSky(root);
  addGrandCurvedAtrium(root);
  addModuleKiosks(root);
  addTable(root);
  addPortalPad(root,"PHASE199_PLAY_PAD",0,-4.0,GOLD);
  addPortalPad(root,"PHASE199_WELLNESS_PAD",-6.2,-3.7,PURPLE);
  addPortalPad(root,"PHASE199_PGA_PAD",6.2,-3.7,CYAN);
  addPortalPad(root,"PHASE199_STORE_PAD",-12.3,3.8,0x8dffb4);
  addPortalPad(root,"PHASE199_SCORPION_PAD",12.3,3.8,0xff5b8c);
  addLights(scene);

  const seats = [
    { x:0, z:-2.25, label:"North Seat" }, { x:-2.55, z:-0.85, label:"Left Front" }, { x:-2.55, z:1.35, label:"Left Back" },
    { x:0, z:2.85, label:"Open South Seat" }, { x:2.55, z:-0.85, label:"Right Front" }, { x:2.55, z:1.35, label:"Right Back" }
  ];
  const sceneTargets = {
    lobby:{ pos:new THREE.Vector3(0,0,7.0), look:new THREE.Vector3(0,1.6,-1.0) },
    table:{ pos:new THREE.Vector3(0,0,4.1), look:new THREE.Vector3(0,1.2,0) },
    seat:{ pos:new THREE.Vector3(0,0,3.05), look:new THREE.Vector3(0,1.1,0) },
    reiki:{ pos:new THREE.Vector3(-6.2,0,-3.7), look:new THREE.Vector3(-6.2,1.9,-7.0) },
    reikiRoom:{ pos:new THREE.Vector3(-6.2,0,-3.7), look:new THREE.Vector3(-6.2,1.9,-7.0) },
    pga:{ pos:new THREE.Vector3(6.2,0,-3.7), look:new THREE.Vector3(6.2,1.9,-7.0) },
    store:{ pos:new THREE.Vector3(-12.3,0,3.8), look:new THREE.Vector3(-16,1.8,2.6) },
    legends:{ pos:new THREE.Vector3(0,0,7.8), look:new THREE.Vector3(0,2.2,-2.0) },
    sponsor:{ pos:new THREE.Vector3(10.8,0,4.2), look:new THREE.Vector3(0,1.7,-1.5) },
    scorpion:{ pos:new THREE.Vector3(12.3,0,3.8), look:new THREE.Vector3(16,1.8,2.6) }
  };
  function roomClamp(x,z){ return { x:THREE.MathUtils.clamp(x,-FLOOR_LIMIT_X,FLOOR_LIMIT_X), z:THREE.MathUtils.clamp(z,-FLOOR_LIMIT_Z,FLOOR_LIMIT_Z) }; }
  scene.userData._tickWorld = ()=>{
    const t = performance.now()*0.001;
    if(root.userData.moon) root.userData.moon.rotation.y = t*0.028;
    if(root.userData.mars) root.userData.mars.rotation.y = t*0.052;
  };
  window.SVR_PHASE199_GRAND_ATRIUM = { label:LABEL, locked:true, grandAtriumStructure:true, twoFloorLobby:true, moduleBays:true, adPlaceholdersOnly:true, oneMoon:true, oneMars:true, noBackgroundBuildings:true, checkedAt:new Date().toISOString() };
  window.SVR_PHASE195_CLEAN_WORLD = { label:LABEL, locked:true, legacyWorldSkylineBypassed:true, twoFloorLobby:true, noBackgroundBuildings:true, checkedAt:new Date().toISOString() };
  log(`[Phase199] grand atrium structure active: two-floor module layout restored`);
  return { roomClamp, seats, tableCenter:new THREE.Vector3(0,0,0.35), joinRadius:3.8, previewOrbitRadius:12.8, sceneTargets };
}
