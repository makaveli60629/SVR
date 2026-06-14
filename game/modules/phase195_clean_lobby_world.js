import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-196-LOBBY-MODULE-BAY-POLISH-LOCK";
const HALF_W = 16.2;
const HALF_D = 13.4;
const FLOOR_LIMIT_X = 15.55;
const FLOOR_LIMIT_Z = 12.75;

function mat(color, emissive = 0x000000, emissiveIntensity = 0.05, roughness = 0.75, metalness = 0.04){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}
function glow(color, opacity = 0.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false });
}
function labelTexture(title, sub, note, color = "#7ffcff"){
  const c = document.createElement("canvas"); c.width = 1200; c.height = 520;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#030713"); g.addColorStop(1,"#12051d");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.fillStyle = "rgba(255,255,255,0.045)"; x.fillRect(64,64,c.width-128,92);
  x.strokeStyle = color; x.lineWidth = 14; x.strokeRect(28,28,c.width-56,c.height-56);
  x.strokeStyle = "rgba(255,255,255,0.16)"; x.lineWidth = 3; x.strokeRect(58,58,c.width-116,c.height-116);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#ffffff"; x.font = "900 78px system-ui,Arial"; x.fillText(title,c.width/2,116);
  x.fillStyle = color; x.font = "800 42px system-ui,Arial"; x.fillText(sub,c.width/2,268);
  x.fillStyle = "#dfefff"; x.font = "700 30px system-ui,Arial"; x.fillText(note,c.width/2,366);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function addBox(root, name, sx, sy, sz, x, y, z, material){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.name = name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
}
function addPanel(root, name, title, sub, note, x, z, rotY, color){
  const frameMat = mat(0x11131f,0x040511,0.16,0.72,0.05);
  const frame = addBox(root, `${name}_FRAME`, 4.85, 2.05, 0.16, x, 2.08, z, frameMat);
  frame.rotation.y = rotY;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.45,1.72), new THREE.MeshBasicMaterial({ map:labelTexture(title,sub,note,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name = name; panel.position.set(x,2.12,z); panel.rotation.y = rotY; panel.renderOrder = 80; root.add(panel);
  return panel;
}
function addColumn(root, name, x, z){
  const group = new THREE.Group(); group.name = name; group.position.set(x,0,z);
  const stone = mat(0xd8c9a8,0x100a04,0.12,0.60,0.08);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.42,0.18,28), stone); base.position.y = 0.09; group.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.25,3.18,28), stone); shaft.position.y = 1.67; group.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.82,0.18,0.58), stone); cap.position.y = 3.34; cap.lookAt(0,3.34,0); group.add(cap);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.28,0.016,8,44), glow(0x7ffcff,0.38)); ringA.rotation.x = Math.PI/2; ringA.position.y = 0.40; group.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.28,0.016,8,44), glow(0xffdf8a,0.34)); ringB.rotation.x = Math.PI/2; ringB.position.y = 2.98; group.add(ringB);
  root.add(group); return group;
}
function addTable(root){
  const table = new THREE.Group(); table.name = "PHASE196_INTENDED_LOBBY_POKER_TABLE_LOCKED";
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.34,2.34,0.20,72), mat(0x201721,0x05070f,0.12,0.72,0.08)); rail.scale.z = 0.66; rail.position.y = 0.82; table.add(rail);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.06,2.06,0.038,72), mat(0x06180f,0x06301f,0.20,0.86,0.02)); felt.scale.z = 0.58; felt.position.y = 0.95; table.add(felt);
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(2.02,0.026,8,112), glow(0xffdf8a,0.62)); goldRing.scale.z = 0.58; goldRing.rotation.x = Math.PI/2; goldRing.position.y = 0.98; table.add(goldRing);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.45,54), glow(0x7ffcff,0.22)); logo.name = "PHASE196_TABLE_CENTER_SVR_LOGO_PAD"; logo.rotation.x = -Math.PI/2; logo.position.y = 1.002; table.add(logo);
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + Math.PI/6;
    const x = Math.sin(a)*2.95; const z = Math.cos(a)*2.04;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.50,0.78,0.50), mat(0x1a1422,0x06030a,0.10,0.72,0.03));
    chair.name = `PHASE196_CLEAN_CHAIR_${i+1}`; chair.position.set(x,0.39,z); chair.lookAt(0,0.39,0); table.add(chair);
  }
  const pot = new THREE.Group(); pot.name = "PHASE196_CHIP_STACKS_VISUAL_LOCK"; pot.position.y = 1.03;
  [0xffdf8a,0x7ffcff,0xa77cff].forEach((c,i)=>{
    const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.055,28), mat(c,0x000000,0.02,0.50,0.08));
    chip.position.set(-0.22+i*0.22, i*0.018, -0.22); pot.add(chip);
  });
  table.add(pot); root.add(table); return table;
}
function addStars(root){
  const geo = new THREE.BufferGeometry(); const pts = [];
  for(let i=0;i<1050;i++){
    const r = 42 + Math.random()*48; const a = Math.random()*Math.PI*2; const y = 7 + Math.random()*29;
    pts.push(Math.cos(a)*r, y, Math.sin(a)*r);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts,3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:0.037, sizeAttenuation:true, transparent:true, opacity:0.86 }));
  points.name = "PHASE196_STAR_FIELD_ONLY"; root.add(points); return points;
}
function addMoonMars(root){
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.18,48,32), mat(0xd8d6ce,0x1b2231,0.18,0.78,0.02));
  moon.name = "PHASE196_SINGLE_VISIBLE_MOON_LOCKED"; moon.position.set(-5.4,9.8,-18.0); root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.36,32,20), mat(0xbf4b2e,0x2a0803,0.22,0.82,0.02));
  mars.name = "PHASE196_SINGLE_VISIBLE_MARS_LOCKED"; mars.position.set(4.9,8.8,-20.5); root.add(mars);
  root.userData.moon = moon; root.userData.mars = mars;
}
function addPortalPad(root, name, x, z, color){
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.70,0.86,72), glow(color,0.58));
  pad.name = name; pad.rotation.x = -Math.PI/2; pad.position.set(x,0.035,z); root.add(pad);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.58,48), glow(color,0.13));
  core.name = `${name}_SOFT_CORE`; core.rotation.x = -Math.PI/2; core.position.set(x,0.031,z); root.add(core);
  return pad;
}
export async function buildPhase195CleanLobbyWorld(scene, { log = console.log } = {}){
  scene.background = new THREE.Color(0x000006);
  scene.fog = null;
  const root = new THREE.Group(); root.name = "PHASE196_POLISHED_MODULE_LOBBY_ROOT"; scene.add(root);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W*2,HALF_D*2), mat(0x11131d,0x03040a,0.045,0.88,0.02));
  floor.name = "PHASE195_ONE_VISUAL_FLOOR"; floor.rotation.x = -Math.PI/2; floor.position.y = 0; floor.renderOrder = -20; root.add(floor);
  const grid = new THREE.GridHelper(HALF_W*2, 32, 0x2f405b, 0x1b2334); grid.name = "PHASE195_SUBTLE_FLOOR_GRID"; grid.position.y = 0.012; root.add(grid);

  const wallMat = mat(0x080b14,0x040613,0.11,0.82,0.03);
  addBox(root,"PHASE196_NORTH_CLEAN_WALL",HALF_W*2,3.85,0.30,0,1.92,-HALF_D,wallMat);
  addBox(root,"PHASE196_SOUTH_CLEAN_WALL",HALF_W*2,3.85,0.30,0,1.92, HALF_D,wallMat);
  addBox(root,"PHASE196_EAST_CLEAN_WALL",0.30,3.85,HALF_D*2, HALF_W,1.92,0,wallMat);
  addBox(root,"PHASE196_WEST_CLEAN_WALL",0.30,3.85,HALF_D*2,-HALF_W,1.92,0,wallMat);
  [[0,3.92,-HALF_D+0.16,HALF_W*2,0.05,0.05,0x7ffcff],[0,3.92,HALF_D-0.16,HALF_W*2,0.05,0.05,0x7ffcff],[HALF_W-0.16,3.92,0,0.05,0.05,HALF_D*2,0xffdf8a],[-HALF_W+0.16,3.92,0,0.05,0.05,HALF_D*2,0xffdf8a],[0,0.12,-HALF_D+0.18,HALF_W*2,0.045,0.045,0xa77cff],[0,0.12,HALF_D-0.18,HALF_W*2,0.045,0.045,0xa77cff]].forEach((a,i)=>addBox(root,`PHASE196_ROOM_TRIM_${i+1}`,a[3],a[4],a[5],a[0],a[1],a[2],glow(a[6],0.48)));

  [[-11.6,-13.05],[-5.6,-13.05],[5.6,-13.05],[11.6,-13.05],[-15.95,-6.2],[-15.95,6.2],[15.95,-6.2],[15.95,6.2]].forEach(([x,z],i)=>addColumn(root,`PHASE196_ARCHITECTURE_COLUMN_${i+1}`,x,z));

  addPanel(root,"PHASE196_PLAY_PANEL","PLAY GAME","Poker table ready","Sit, buy in, test hands",0,-HALF_D+0.18,0,"#ffdf8a");
  addPanel(root,"PHASE196_WELLNESS_PANEL","WELLNESS","Reiki room portal","Waiting for approval",-8.4,-HALF_D+0.18,0,"#a77cff");
  addPanel(root,"PHASE196_PGA_PANEL","PGA TRAINING","Golf hub portal","Range / chip / putt",8.4,-HALF_D+0.18,0,"#7ffcff");
  addPanel(root,"PHASE196_STORE_PANEL","SVR STORE","Store portal","Opens web store",-HALF_W+0.18,4.2,Math.PI/2,"#8dffb4");
  addPanel(root,"PHASE196_SCORPION_PANEL","SCORPION","Private room","VIP poker portal",HALF_W-0.18,4.2,-Math.PI/2,"#ff5b8c");

  const carpetMat = new THREE.MeshBasicMaterial({ color:0x510617, transparent:true, opacity:0.48, side:THREE.DoubleSide, depthWrite:false });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2,14.2), carpetMat); carpet.name = "PHASE196_CENTER_CARPET_PATH"; carpet.rotation.x = -Math.PI/2; carpet.position.set(0,0.018,-2.2); root.add(carpet);
  addPortalPad(root,"PHASE196_PLAY_PAD",0,-8.7,0xffdf8a);
  addPortalPad(root,"PHASE196_WELLNESS_PAD",-8.2,-8.7,0xa77cff);
  addPortalPad(root,"PHASE196_PGA_PAD",8.2,-8.7,0x7ffcff);
  addPortalPad(root,"PHASE196_STORE_PAD",-10.9,4.0,0x8dffb4);
  addPortalPad(root,"PHASE196_SCORPION_PAD",10.9,4.0,0xff5b8c);

  const ceilingRing = new THREE.Mesh(new THREE.TorusGeometry(8.8,0.026,8,160), glow(0x7ffcff,0.22));
  ceilingRing.name = "PHASE196_LIGHTWEIGHT_CEILING_GUIDE"; ceilingRing.rotation.x = Math.PI/2; ceilingRing.position.y = 4.18; root.add(ceilingRing);
  root.userData.ceilingRing = ceilingRing;

  addTable(root);
  addStars(root);
  addMoonMars(root);

  const hemi = new THREE.HemisphereLight(0xa8c7ff,0x060710,0.42); hemi.name = "PHASE196_SOFT_HEMISPHERE_LIGHT"; scene.add(hemi);
  const key = new THREE.DirectionalLight(0xc9ddff,0.66); key.name = "PHASE196_KEY_LIGHT"; key.position.set(-5,8,5); scene.add(key);
  const accent = new THREE.PointLight(0x7ffcff,0.74,17,2.0); accent.name = "PHASE196_CENTER_ACCENT_LIGHT"; accent.position.set(0,3.1,0); scene.add(accent);

  const seats = [
    { x:0, z:-2.55, label:"North Seat" }, { x:-2.45, z:-1.10, label:"Left Front" }, { x:-2.45, z:1.10, label:"Left Back" },
    { x:0, z:2.55, label:"Open South Seat" }, { x:2.45, z:-1.10, label:"Right Front" }, { x:2.45, z:1.10, label:"Right Back" }
  ];
  const sceneTargets = {
    lobby:{ pos:new THREE.Vector3(0,0,4.8), look:new THREE.Vector3(0,1.4,0) },
    table:{ pos:new THREE.Vector3(0,0,3.6), look:new THREE.Vector3(0,1.2,0) },
    seat:{ pos:new THREE.Vector3(0,0,2.65), look:new THREE.Vector3(0,1.1,0) },
    reiki:{ pos:new THREE.Vector3(-8.2,0,-7.9), look:new THREE.Vector3(-8.2,1.8,-12.3) },
    reikiRoom:{ pos:new THREE.Vector3(-8.2,0,-7.9), look:new THREE.Vector3(-8.2,1.8,-12.3) },
    pga:{ pos:new THREE.Vector3(8.2,0,-7.9), look:new THREE.Vector3(8.2,1.8,-12.3) },
    store:{ pos:new THREE.Vector3(-10.9,0,4.0), look:new THREE.Vector3(-15,1.8,4.0) },
    legends:{ pos:new THREE.Vector3(-5.2,0,8.6), look:new THREE.Vector3(0,1.5,0) },
    sponsor:{ pos:new THREE.Vector3(5.2,0,8.6), look:new THREE.Vector3(0,1.5,0) },
    scorpion:{ pos:new THREE.Vector3(10.9,0,4.0), look:new THREE.Vector3(15,1.8,4.0) }
  };
  function roomClamp(x,z){ return { x:THREE.MathUtils.clamp(x,-FLOOR_LIMIT_X,FLOOR_LIMIT_X), z:THREE.MathUtils.clamp(z,-FLOOR_LIMIT_Z,FLOOR_LIMIT_Z) }; }
  scene.userData._tickWorld = ()=>{
    const t = performance.now()*0.001;
    root.userData.moon.rotation.y = t*0.035;
    root.userData.mars.rotation.y = t*0.055;
    root.userData.ceilingRing.rotation.z = t*0.018;
  };
  window.SVR_PHASE196_MODULE_BAYS = { label:LABEL, locked:true, moduleBaysLocked:true, oneMoon:true, oneMars:true, noBackgroundBuildings:true, cleanGeometry:true, checkedAt:new Date().toISOString() };
  window.SVR_PHASE195_CLEAN_WORLD = { label:LABEL, locked:true, legacyWorldSkylineBypassed:true, oneMoon:true, oneMars:true, noBackgroundBuildings:true, checkedAt:new Date().toISOString() };
  log(`[Phase196] polished clean module lobby active`);
  return { roomClamp, seats, tableCenter:new THREE.Vector3(0,0,0), joinRadius:3.6, previewOrbitRadius:10.8, sceneTargets };
}
