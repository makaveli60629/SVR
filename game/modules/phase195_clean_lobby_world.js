import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-200-ORDERED-GRAND-LOBBY-STRUCTURE-LOCK";
const HALF_W = 19.5;
const HALF_D = 16.5;
const FLOOR_LIMIT_X = 18.5;
const FLOOR_LIMIT_Z = 15.4;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const RED = 0xff5b8c;
const GREEN = 0x8dffb4;
const WALL = 0x090c16;
const MARBLE = 0x151823;

function mat(color, emissive = 0x000000, emissiveIntensity = 0.05, roughness = 0.72, metalness = 0.06){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}
function glass(color = CYAN, opacity = 0.16){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function glow(color, opacity = 0.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function addBox(root, name, sx, sy, sz, x, y, z, material, rotY = 0){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.name = name;
  mesh.position.set(x,y,z);
  mesh.rotation.y = rotY;
  root.add(mesh);
  return mesh;
}
function addCylinder(root, name, radiusTop, radiusBottom, height, x, y, z, material, radialSegments = 32){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), material);
  mesh.name = name;
  mesh.position.set(x,y,z);
  root.add(mesh);
  return mesh;
}
function makeLabel(title, sub, note, color = "#ffd98a"){
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 520;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#030713");
  g.addColorStop(1,"#12051d");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = "rgba(255,255,255,.045)";
  ctx.fillRect(66,64,c.width-132,92);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.strokeRect(28,28,c.width-56,c.height-56);
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(58,58,c.width-116,c.height-116);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 74px system-ui,Arial";
  ctx.fillText(title,c.width/2,116);
  ctx.fillStyle = color;
  ctx.font = "800 40px system-ui,Arial";
  ctx.fillText(sub,c.width/2,268);
  ctx.fillStyle = "#dfefff";
  ctx.font = "700 30px system-ui,Arial";
  ctx.fillText(note,c.width/2,366);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function addPanel(root, name, title, sub, note, x, y, z, rotY, color = "#ffd98a", w = 4.1, h = 1.55){
  const frame = addBox(root, `${name}_FRAME`, w + 0.32, h + 0.32, 0.15, x, y, z, mat(0x11131f,0x050611,0.16,0.70,0.06), rotY);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:makeLabel(title,sub,note,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name = name;
  panel.position.set(x,y+0.04,z);
  panel.rotation.y = rotY;
  panel.renderOrder = 80;
  root.add(panel);
  return panel;
}
function addColumn(root, name, x, z, height = 5.35){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x,0,z);
  const stone = mat(0xd2bea0,0x120b04,0.13,0.56,0.10);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.54,0.24,32), stone);
  base.name = `${name}_BASE`;
  base.position.y = 0.12;
  group.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.30,height,32), stone);
  shaft.name = `${name}_SHAFT`;
  shaft.position.y = 0.24 + height/2;
  group.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.98,0.24,0.70), stone);
  cap.name = `${name}_CAP`;
  cap.position.y = height + 0.52;
  group.add(cap);
  const lowerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.017,8,48), glow(CYAN,0.34));
  lowerGlow.name = `${name}_LOWER_GLOW`;
  lowerGlow.rotation.x = Math.PI/2;
  lowerGlow.position.y = 0.54;
  group.add(lowerGlow);
  const upperGlow = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.017,8,48), glow(GOLD,0.36));
  upperGlow.name = `${name}_UPPER_GLOW`;
  upperGlow.rotation.x = Math.PI/2;
  upperGlow.position.y = height - 0.10;
  group.add(upperGlow);
  root.add(group);
  return group;
}
function addFloor(root){
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W*2,HALF_D*2), mat(MARBLE,0x03040a,0.06,0.84,0.05));
  floor.name = "PHASE195_ONE_VISUAL_FLOOR";
  floor.rotation.x = -Math.PI/2;
  floor.renderOrder = -20;
  root.add(floor);
  const grid = new THREE.GridHelper(HALF_W*2, 40, 0x34445f, 0x1d2534);
  grid.name = "PHASE200_SUBTLE_ORDERED_FLOOR_GRID";
  grid.position.y = 0.012;
  root.add(grid);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.4,15.0), new THREE.MeshBasicMaterial({ color:0x4f0617, transparent:true, opacity:0.54, side:THREE.DoubleSide, depthWrite:false }));
  carpet.name = "PHASE200_CENTER_RED_CARPET_AXIS";
  carpet.rotation.x = -Math.PI/2;
  carpet.position.set(0,0.018,2.0);
  root.add(carpet);
  const crest = new THREE.Mesh(new THREE.RingGeometry(0.90,1.22,88), glow(GOLD,0.34));
  crest.name = "PHASE200_CENTER_CRESTRing";
  crest.rotation.x = -Math.PI/2;
  crest.position.set(0,0.028,5.8);
  root.add(crest);
}
function addRoomShell(root){
  const wallMat = mat(WALL,0x040713,0.13,0.82,0.04);
  addBox(root,"PHASE200_NORTH_BACK_WALL",HALF_W*2,6.2,0.36,0,3.1,-HALF_D,wallMat);
  addBox(root,"PHASE200_SOUTH_FRONT_LOW_WALL",HALF_W*2,1.8,0.30,0,0.9,HALF_D,wallMat);
  addBox(root,"PHASE200_WEST_SIDE_WALL",0.34,5.6,HALF_D*2,-HALF_W,2.8,0,wallMat);
  addBox(root,"PHASE200_EAST_SIDE_WALL",0.34,5.6,HALF_D*2,HALF_W,2.8,0,wallMat);
  addBox(root,"PHASE200_NORTH_GOLD_CORNICE",HALF_W*2,0.08,0.10,0,6.12,-HALF_D+0.20,glow(GOLD,0.56));
  addBox(root,"PHASE200_WEST_GOLD_CORNICE",0.08,0.08,HALF_D*2,-HALF_W+0.20,5.75,0,glow(GOLD,0.48));
  addBox(root,"PHASE200_EAST_GOLD_CORNICE",0.08,0.08,HALF_D*2,HALF_W-0.20,5.75,0,glow(GOLD,0.48));
  addBox(root,"PHASE200_NORTH_CYAN_BASE",HALF_W*2,0.06,0.10,0,0.18,-HALF_D+0.22,glow(CYAN,0.40));
  addBox(root,"PHASE200_SIDE_BASE_LEFT",0.06,0.06,HALF_D*2,-HALF_W+0.22,0.18,0,glow(CYAN,0.34));
  addBox(root,"PHASE200_SIDE_BASE_RIGHT",0.06,0.06,HALF_D*2,HALF_W-0.22,0.18,0,glow(CYAN,0.34));
}
function addOrderedColumns(root){
  [-15,-10,-5,0,5,10,15].forEach((x,i)=>addColumn(root,`PHASE200_REAR_ORDERED_COLUMN_${i+1}`,x,-15.95,5.35));
  [-9,-3,3,9].forEach((z,i)=>addColumn(root,`PHASE200_WEST_ORDERED_COLUMN_${i+1}`,-18.85,z,4.75));
  [-9,-3,3,9].forEach((z,i)=>addColumn(root,`PHASE200_EAST_ORDERED_COLUMN_${i+1}`,18.85,z,4.75));
}
function addArchBay(root, name, x, title, sub, color){
  addBox(root,`${name}_RECESS`,3.25,2.35,0.07,x,1.72,-16.26,new THREE.MeshBasicMaterial({ color:0x050711, transparent:true, opacity:0.98, side:THREE.DoubleSide }));
  addBox(root,`${name}_UPPER_RECESS`,2.65,1.50,0.07,x,4.35,-16.25,new THREE.MeshBasicMaterial({ color:0x060814, transparent:true, opacity:0.96, side:THREE.DoubleSide }));
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.36,0.04,10,96,Math.PI), glow(GOLD,0.50));
  arch.name = `${name}_CLEAN_ARCH_GLOW`;
  arch.position.set(x,2.95,-16.18);
  arch.rotation.z = Math.PI;
  root.add(arch);
  addPanel(root,`${name}_SIGN`,title,sub,"walk up â€¢ select",x,3.95,-16.13,0,color,2.42,0.82);
}
function addModuleWalls(root){
  addArchBay(root,"PHASE200_WELLNESS_ARCH_BAY",-12,"WELLNESS","Reiki / Meditation","#a77cff");
  addArchBay(root,"PHASE200_PGA_ARCH_BAY",-6,"PGA","Training Hub","#7ffcff");
  addArchBay(root,"PHASE200_PLAY_ARCH_BAY",0,"PLAY GAME","Table Select","#ffd98a");
  addArchBay(root,"PHASE200_STORE_ARCH_BAY",6,"SVR STORE","Storefront","#8dffb4");
  addArchBay(root,"PHASE200_SCORPION_ARCH_BAY",12,"SCORPION","VIP Room","#ff5b8c");
  addPanel(root,"PHASE200_LEFT_JUMBOTRON_SLOT","JUMBOTRON","Tier-1 ad slot","ads return after structure",-19.18,2.65,-2.0,Math.PI/2,"#7ffcff",4.4,2.05);
  addPanel(root,"PHASE200_RIGHT_JUMBOTRON_SLOT","JUMBOTRON","Tier-1 ad slot","ads return after structure",19.18,2.65,-2.0,-Math.PI/2,"#7ffcff",4.4,2.05);
  addPanel(root,"PHASE200_DAILY_BONUS_KIOSK","DAILY BONUS","reward station","aligned front kiosk",-10.8,1.60,5.0,0.20,"#ffd98a",2.45,1.32);
  addPanel(root,"PHASE200_SPONSOR_KIOSK","SPONSOR AREA","partner station","aligned front kiosk",10.8,1.60,5.0,-0.20,"#7ffcff",2.45,1.32);
}
function addUpstairs(root){
  const deckMat = new THREE.MeshStandardMaterial({ color:0x151923, roughness:0.78, metalness:0.05, emissive:0x040713, emissiveIntensity:0.13, transparent:true, opacity:0.86 });
  addBox(root,"PHASE200_UPSTAIRS_REAR_WALKWAY",36.0,0.18,3.2,0,3.42,-13.2,deckMat);
  addBox(root,"PHASE200_UPSTAIRS_WEST_WALKWAY",3.2,0.18,18.0,-17.6,3.42,-3.0,deckMat);
  addBox(root,"PHASE200_UPSTAIRS_EAST_WALKWAY",3.2,0.18,18.0,17.6,3.42,-3.0,deckMat);
  addBox(root,"PHASE200_UPSTAIRS_REAR_INNER_RAIL",35.2,0.08,0.08,0,3.92,-11.35,glow(GOLD,0.66));
  addBox(root,"PHASE200_UPSTAIRS_WEST_INNER_RAIL",0.08,0.08,17.2,-15.78,3.92,-3.0,glow(GOLD,0.62));
  addBox(root,"PHASE200_UPSTAIRS_EAST_INNER_RAIL",0.08,0.08,17.2,15.78,3.92,-3.0,glow(GOLD,0.62));
  addBox(root,"PHASE200_UPSTAIRS_REAR_OUTER_RAIL",36.0,0.07,0.08,0,3.98,-14.92,glow(CYAN,0.42));
  addBox(root,"PHASE200_UPSTAIRS_WEST_OUTER_RAIL",0.08,0.07,18.0,-19.15,3.98,-3.0,glow(CYAN,0.38));
  addBox(root,"PHASE200_UPSTAIRS_EAST_OUTER_RAIL",0.08,0.07,18.0,19.15,3.98,-3.0,glow(CYAN,0.38));
  addBox(root,"PHASE200_UPSTAIRS_REAR_GUARD_GLASS",35.4,0.74,0.04,0,4.28,-11.15,glass(CYAN,0.13));
  addBox(root,"PHASE200_UPSTAIRS_WEST_GUARD_GLASS",0.04,0.74,17.0,-15.58,4.28,-3.0,glass(CYAN,0.12));
  addBox(root,"PHASE200_UPSTAIRS_EAST_GUARD_GLASS",0.04,0.74,17.0,15.58,4.28,-3.0,glass(CYAN,0.12));
  for(let i=0;i<9;i++){
    const x = -14 + i*3.5;
    addCylinder(root,`PHASE200_UPSTAIRS_REAR_POST_${i+1}`,0.055,0.065,0.92,x,4.24,-11.20,mat(0xd7c3a0,0x080604,0.10,0.62,0.08),14);
  }
  [-12.9,12.9].forEach((x,side)=>{
    for(let i=0;i<11;i++){
      const step = addBox(root,`PHASE200_${side?"RIGHT":"LEFT"}_STAIR_STEP_${i+1}`,1.65,0.13,0.48,x + (side?i*0.30:-i*0.30),0.18+i*0.29,7.8-i*0.62,mat(0x151923,0x050713,0.10,0.74,0.04),side?0.38:-0.38);
      step.userData.svrStairStep = true;
    }
  });
  addPanel(root,"PHASE200_UPSTAIRS_LEGENDS_PANEL","LEGENDS HALL","second floor","future trophy wall",0,4.82,-12.92,0,"#ffd98a",3.5,1.0);
  addPanel(root,"PHASE200_UPSTAIRS_EVENTS_PANEL","EVENTS","monthly / weekend","schedule module",-8.8,4.82,-12.92,0,"#a77cff",3.1,1.0);
  addPanel(root,"PHASE200_UPSTAIRS_SPONSOR_PANEL","SPONSORS","upper showcase","ad slots next",8.8,4.82,-12.92,0,"#7ffcff",3.1,1.0);
}
function addPortalPad(root, name, x, z, color){
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.72,0.90,72), glow(color,0.58));
  pad.name = name;
  pad.rotation.x = -Math.PI/2;
  pad.position.set(x,0.035,z);
  root.add(pad);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.60,48), glow(color,0.13));
  core.name = `${name}_SOFT_CORE`;
  core.rotation.x = -Math.PI/2;
  core.position.set(x,0.031,z);
  root.add(core);
}
function addTable(root){
  const table = new THREE.Group();
  table.name = "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED";
  table.position.set(0,0,0.75);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.42,2.42,0.22,80), mat(0x211821,0x05070f,0.14,0.72,0.08));
  rail.scale.z = 0.66;
  rail.position.y = 0.82;
  table.add(rail);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.10,2.10,0.04,80), mat(0x06190f,0x06301f,0.22,0.86,0.02));
  felt.scale.z = 0.58;
  felt.position.y = 0.96;
  table.add(felt);
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(2.05,0.028,8,128), glow(GOLD,0.64));
  goldRing.scale.z = 0.58;
  goldRing.rotation.x = Math.PI/2;
  goldRing.position.y = 0.99;
  table.add(goldRing);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.48,64), glow(CYAN,0.24));
  logo.name = "PHASE200_TABLE_CENTER_SVR_LOGO_PAD";
  logo.rotation.x = -Math.PI/2;
  logo.position.y = 1.01;
  table.add(logo);
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + Math.PI/6;
    const x = Math.sin(a)*3.05;
    const z = Math.cos(a)*2.08;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.78,0.52), mat(0x1a1422,0x06030a,0.10,0.72,0.03));
    chair.name = `PHASE200_CLEAN_CHAIR_${i+1}`;
    chair.position.set(x,0.39,z);
    chair.lookAt(0,0.39,0);
    table.add(chair);
  }
  root.add(table);
}
function addSky(root){
  const geo = new THREE.BufferGeometry();
  const pts = [];
  for(let i=0;i<1200;i++){
    const r = 44 + Math.random()*50;
    const a = Math.random()*Math.PI*2;
    const y = 7 + Math.random()*29;
    pts.push(Math.cos(a)*r,y,Math.sin(a)*r);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts,3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:0.038, sizeAttenuation:true, transparent:true, opacity:0.88 }));
  stars.name = "PHASE200_STAR_FIELD_ONLY";
  root.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.28,56,36), mat(0xd8d6ce,0x1b2231,0.18,0.78,0.02));
  moon.name = "PHASE200_SINGLE_VISIBLE_MOON_LOCKED";
  moon.position.set(-3.4,10.2,-18.2);
  root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.40,36,24), mat(0xbf4b2e,0x2a0803,0.22,0.82,0.02));
  mars.name = "PHASE200_SINGLE_VISIBLE_MARS_LOCKED";
  mars.position.set(5.5,8.9,-20.5);
  root.add(mars);
  root.userData.moon = moon;
  root.userData.mars = mars;
}
function addLighting(scene, root){
  const hemi = new THREE.HemisphereLight(0xc4d8ff,0x060710,0.72);
  hemi.name = "PHASE200_SOFT_HEMISPHERE_LIGHT";
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xdbe9ff,0.95);
  key.name = "PHASE200_KEY_LIGHT";
  key.position.set(-6,10,5);
  scene.add(key);
  const center = new THREE.PointLight(CYAN,1.15,26,1.8);
  center.name = "PHASE200_CENTER_ACCENT_LIGHT";
  center.position.set(0,3.5,1.0);
  scene.add(center);
  const warm = new THREE.PointLight(GOLD,0.95,30,1.8);
  warm.name = "PHASE200_WARM_REAR_LOBBY_WASH";
  warm.position.set(0,4.8,-8.0);
  scene.add(warm);
  [-12,-6,0,6,12].forEach((x,i)=>{
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.10,16,12), glow(GOLD,0.80));
    bulb.name = `PHASE200_VISIBLE_WARM_LIGHT_BULB_${i+1}`;
    bulb.position.set(x,5.45,-13.7);
    root.add(bulb);
    const light = new THREE.PointLight(GOLD,0.42,9,2.2);
    light.name = `PHASE200_WALL_BAY_LIGHT_${i+1}`;
    light.position.set(x,4.85,-13.5);
    scene.add(light);
  });
}
export async function buildPhase195CleanLobbyWorld(scene, { log = console.log } = {}){
  scene.background = new THREE.Color(0x000007);
  scene.fog = null;
  const root = new THREE.Group();
  root.name = "PHASE200_ORDERED_GRAND_LOBBY_ROOT";
  scene.add(root);
  addFloor(root);
  addRoomShell(root);
  addOrderedColumns(root);
  addModuleWalls(root);
  addUpstairs(root);
  // Phase 164: procedural geometry poker table disabled. Real FBX table is the only visible table authority.
  addPortalPad(root,"PHASE200_PLAY_PAD",0,-4.2,GOLD);
  addPortalPad(root,"PHASE200_WELLNESS_PAD",-12,-12.6,PURPLE);
  addPortalPad(root,"PHASE200_PGA_PAD",-6,-12.6,CYAN);
  addPortalPad(root,"PHASE200_STORE_PAD",6,-12.6,GREEN);
  addPortalPad(root,"PHASE200_SCORPION_PAD",12,-12.6,RED);
  addSky(root);
  addLighting(scene, root);
  const seats = [
    { x:0, z:-1.85, label:"North Seat" },
    { x:-2.55, z:-0.45, label:"Left Front" },
    { x:-2.55, z:1.75, label:"Left Back" },
    { x:0, z:3.25, label:"Open South Seat" },
    { x:2.55, z:-0.45, label:"Right Front" },
    { x:2.55, z:1.75, label:"Right Back" }
  ];
  const sceneTargets = {
    lobby:{ pos:new THREE.Vector3(0,0,7.2), look:new THREE.Vector3(0,1.7,-2.0) },
    table:{ pos:new THREE.Vector3(0,0,4.4), look:new THREE.Vector3(0,1.2,0.75) },
    seat:{ pos:new THREE.Vector3(0,0,3.35), look:new THREE.Vector3(0,1.1,0.75) },
    reiki:{ pos:new THREE.Vector3(-12,0,-11.8), look:new THREE.Vector3(-12,2.0,-16.0) },
    reikiRoom:{ pos:new THREE.Vector3(-12,0,-11.8), look:new THREE.Vector3(-12,2.0,-16.0) },
    pga:{ pos:new THREE.Vector3(-6,0,-11.8), look:new THREE.Vector3(-6,2.0,-16.0) },
    store:{ pos:new THREE.Vector3(6,0,-11.8), look:new THREE.Vector3(6,2.0,-16.0) },
    legends:{ pos:new THREE.Vector3(0,0,7.9), look:new THREE.Vector3(0,2.6,-12.0) },
    sponsor:{ pos:new THREE.Vector3(10.8,0,5.0), look:new THREE.Vector3(0,1.7,-1.5) },
    scorpion:{ pos:new THREE.Vector3(12,0,-11.8), look:new THREE.Vector3(12,2.0,-16.0) }
  };
  function roomClamp(x,z){
    return { x:THREE.MathUtils.clamp(x,-FLOOR_LIMIT_X,FLOOR_LIMIT_X), z:THREE.MathUtils.clamp(z,-FLOOR_LIMIT_Z,FLOOR_LIMIT_Z) };
  }
  scene.userData._tickWorld = ()=>{
    const t = performance.now()*0.001;
    if(root.userData.moon) root.userData.moon.rotation.y = t*0.028;
    if(root.userData.mars) root.userData.mars.rotation.y = t*0.052;
  };
  window.SVR_PHASE200_ORDERED_GRAND_LOBBY = { label:LABEL, locked:true, orderedStructure:true, pillarsAligned:true, lightingPass:true, twoFloorLobby:true, moduleBays:true, oneMoon:true, oneMars:true, noBackgroundBuildings:true, proceduralTableDisabled:true, fbxTableAuthority:true, checkedAt:new Date().toISOString() };
  window.SVR_PHASE195_CLEAN_WORLD = { label:LABEL, locked:true, legacyWorldSkylineBypassed:true, twoFloorLobby:true, noBackgroundBuildings:true, checkedAt:new Date().toISOString() };
  log(`[Phase200] ordered grand lobby structure active: aligned columns, two floors, lighting pass`);
  return { roomClamp, seats, tableCenter:new THREE.Vector3(0,0,0.75), joinRadius:3.9, previewOrbitRadius:13.2, sceneTargets };
}

