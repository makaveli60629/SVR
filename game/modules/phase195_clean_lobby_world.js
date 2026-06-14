import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-195-CLEAN-GEOMETRY-LOBBY-LOCK";
const HALF_W = 15.5;
const HALF_D = 12.8;
const FLOOR_LIMIT_X = 14.9;
const FLOOR_LIMIT_Z = 12.2;

function mat(color, emissive = 0x000000, emissiveIntensity = 0.05, roughness = 0.75, metalness = 0.04){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}
function glow(color, opacity = 0.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false });
}
function canvasLabel(title, sub, color = "#7ffcff"){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 360;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#030713"); g.addColorStop(1,"#10051b");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = color; x.lineWidth = 12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#ffffff"; x.font = "900 72px system-ui,Arial"; x.fillText(title,c.width/2,132);
  x.fillStyle = color; x.font = "800 34px system-ui,Arial"; x.fillText(sub,c.width/2,232);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function addWall(root, name, sx, sy, sz, x, y, z){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat(0x080b14,0x040613,0.11,0.82,0.03));
  mesh.name = name; mesh.position.set(x,y,z); mesh.receiveShadow = false; root.add(mesh); return mesh;
}
function addTrim(root, name, sx, sy, sz, x, y, z, color = 0x7ffcff){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), glow(color,0.45));
  mesh.name = name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
}
function addPanel(root, name, title, sub, x, z, rotY, color){
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.7,1.9,0.12), mat(0x11131f,0x040511,0.16,0.72,0.05));
  frame.name = `${name}_FRAME`; frame.position.set(x,2.05,z); frame.rotation.y = rotY; root.add(frame);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(4.35,1.52), new THREE.MeshBasicMaterial({ map:canvasLabel(title,sub,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name = name; p.position.set(x,2.08,z); p.rotation.y = rotY; p.renderOrder = 80; root.add(p); return p;
}
function addTable(root){
  const table = new THREE.Group(); table.name = "PHASE195_INTENDED_LOBBY_POKER_TABLE";
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,0.18,64), mat(0x131722,0x05070f,0.12,0.70,0.08));
  top.scale.z = 0.64; top.position.y = 0.82; table.add(top);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.04,2.04,0.035,64), mat(0x06150e,0x062819,0.18,0.86,0.02));
  felt.scale.z = 0.58; felt.position.y = 0.93; table.add(felt);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.02,0.025,8,96), glow(0xffdf8a,0.55));
  ring.scale.z = 0.58; ring.rotation.x = Math.PI/2; ring.position.y = 0.955; table.add(ring);
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + Math.PI/6;
    const x = Math.sin(a)*2.95; const z = Math.cos(a)*1.95;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.78,0.48), mat(0x1a1422,0x06030a,0.10,0.72,0.03));
    chair.name = `PHASE195_CLEAN_CHAIR_${i+1}`; chair.position.set(x,0.39,z); chair.lookAt(0,0.39,0); table.add(chair);
  }
  root.add(table); return table;
}
function addStars(root){
  const geo = new THREE.BufferGeometry(); const pts = [];
  for(let i=0;i<900;i++){
    const r = 42 + Math.random()*46; const a = Math.random()*Math.PI*2; const y = 7 + Math.random()*28;
    pts.push(Math.cos(a)*r, y, Math.sin(a)*r);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts,3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:0.038, sizeAttenuation:true, transparent:true, opacity:0.84 }));
  points.name = "PHASE195_STAR_FIELD_ONLY"; root.add(points); return points;
}
function addMoonMars(root){
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.28,48,32), mat(0xd8d6ce,0x1b2231,0.18,0.78,0.02));
  moon.name = "PHASE195_SINGLE_VISIBLE_MOON"; moon.position.set(-5.4,9.8,-18.0); root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.38,32,20), mat(0xbf4b2e,0x2a0803,0.22,0.82,0.02));
  mars.name = "PHASE195_SINGLE_VISIBLE_MARS"; mars.position.set(4.9,8.8,-20.5); root.add(mars);
  root.userData.moon = moon; root.userData.mars = mars;
}
function addPortalPad(root, name, x, z, color){
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.72,0.84,64), glow(color,0.55));
  pad.name = name; pad.rotation.x = -Math.PI/2; pad.position.set(x,0.028,z); root.add(pad); return pad;
}
export async function buildPhase195CleanLobbyWorld(scene, { log = console.log } = {}){
  scene.background = new THREE.Color(0x000006);
  scene.fog = null;
  const root = new THREE.Group(); root.name = "PHASE195_CLEAN_GEOMETRY_LOBBY_ROOT"; scene.add(root);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W*2,HALF_D*2), mat(0x11131d,0x03040a,0.045,0.88,0.02));
  floor.name = "PHASE195_ONE_VISUAL_FLOOR"; floor.rotation.x = -Math.PI/2; floor.position.y = 0; floor.renderOrder = -20; root.add(floor);
  const grid = new THREE.GridHelper(HALF_W*2, 30, 0x2f405b, 0x1b2334); grid.name = "PHASE195_SUBTLE_FLOOR_GRID"; grid.position.y = 0.012; root.add(grid);

  addWall(root,"PHASE195_NORTH_WALL",HALF_W*2,3.65,0.28,0,1.82,-HALF_D);
  addWall(root,"PHASE195_SOUTH_WALL",HALF_W*2,3.65,0.28,0,1.82, HALF_D);
  addWall(root,"PHASE195_EAST_WALL",0.28,3.65,HALF_D*2, HALF_W,1.82,0);
  addWall(root,"PHASE195_WEST_WALL",0.28,3.65,HALF_D*2,-HALF_W,1.82,0);
  addTrim(root,"PHASE195_NORTH_TOP_TRIM",HALF_W*2,0.05,0.05,0,3.72,-HALF_D+0.16,0x7ffcff);
  addTrim(root,"PHASE195_SOUTH_TOP_TRIM",HALF_W*2,0.05,0.05,0,3.72, HALF_D-0.16,0x7ffcff);
  addTrim(root,"PHASE195_EAST_TOP_TRIM",0.05,0.05,HALF_D*2, HALF_W-0.16,3.72,0,0xffdf8a);
  addTrim(root,"PHASE195_WEST_TOP_TRIM",0.05,0.05,HALF_D*2,-HALF_W+0.16,3.72,0,0xffdf8a);
  addTrim(root,"PHASE195_NORTH_BASE_TRIM",HALF_W*2,0.045,0.045,0,0.12,-HALF_D+0.18,0xa77cff);
  addTrim(root,"PHASE195_SOUTH_BASE_TRIM",HALF_W*2,0.045,0.045,0,0.12, HALF_D-0.18,0xa77cff);

  addPanel(root,"PHASE195_PLAY_PANEL","PLAY GAME","Poker table ready",0,-HALF_D+0.18,0,"#ffdf8a");
  addPanel(root,"PHASE195_WELLNESS_PANEL","WELLNESS","Reiki room portal",-8.4,-HALF_D+0.18,0,"#a77cff");
  addPanel(root,"PHASE195_PGA_PANEL","PGA TRAINING","Golf hub portal",8.4,-HALF_D+0.18,0,"#7ffcff");
  addPanel(root,"PHASE195_STORE_PANEL","SVR STORE","Store portal",-HALF_W+0.18,4.2,Math.PI/2,"#8dffb4");
  addPanel(root,"PHASE195_SCORPION_PANEL","SCORPION","Private room",HALF_W-0.18,4.2,-Math.PI/2,"#ff5b8c");

  addPortalPad(root,"PHASE195_PLAY_PAD",0,-8.7,0xffdf8a);
  addPortalPad(root,"PHASE195_WELLNESS_PAD",-8.2,-8.7,0xa77cff);
  addPortalPad(root,"PHASE195_PGA_PAD",8.2,-8.7,0x7ffcff);
  addPortalPad(root,"PHASE195_STORE_PAD",-10.9,4.0,0x8dffb4);
  addPortalPad(root,"PHASE195_SCORPION_PAD",10.9,4.0,0xff5b8c);

  addTable(root);
  addStars(root);
  addMoonMars(root);

  const hemi = new THREE.HemisphereLight(0xa8c7ff,0x060710,0.42); hemi.name = "PHASE195_SOFT_HEMISPHERE_LIGHT"; scene.add(hemi);
  const key = new THREE.DirectionalLight(0xc9ddff,0.65); key.name = "PHASE195_KEY_LIGHT"; key.position.set(-5,8,5); scene.add(key);
  const accent = new THREE.PointLight(0x7ffcff,0.75,16,2.0); accent.name = "PHASE195_CENTER_ACCENT_LIGHT"; accent.position.set(0,3.1,0); scene.add(accent);

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
  scene.userData._tickWorld = (dt)=>{
    const t = performance.now()*0.001;
    root.userData.moon.rotation.y = t*0.035;
    root.userData.mars.rotation.y = t*0.055;
  };
  window.SVR_PHASE195_CLEAN_WORLD = { label:LABEL, locked:true, legacyWorldSkylineBypassed:true, oneMoon:true, oneMars:true, noBackgroundBuildings:true, checkedAt:new Date().toISOString() };
  log(`[Phase195] clean lobby world active: no legacy skyline, no duplicate moon, clean geometry`);
  return { roomClamp, seats, tableCenter:new THREE.Vector3(0,0,0), joinRadius:3.6, previewOrbitRadius:10.8, sceneTargets };
}
