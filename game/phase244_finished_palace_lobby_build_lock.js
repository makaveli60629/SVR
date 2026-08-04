import * as THREE from "three";

const BUILD = "PHASE-244-FINISHED-PALACE-LOBBY-BUILD-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const PINK = 0xff5b8c;
const GREEN = 0x8dffb4;
const STONE = 0xd7ccb1;
const WALL = 0x070914;
const FLOOR = 0x111727;

function waitForRuntime(){
  return new Promise((resolve)=>{
    let tries = 0;
    const tick = ()=>{
      if (window.__SVR_SCENE__ && window.__SVR_RENDERER__) return resolve({ scene:window.__SVR_SCENE__, renderer:window.__SVR_RENDERER__, camera:window.__SVR_CAMERA__ });
      if (++tries > 360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function standard(color, emissive = 0x000000, emissiveIntensity = 0.04, roughness = 0.64, metalness = 0.05){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness, metalness });
}
function basic(color, opacity = 1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity < 1, opacity, side:THREE.DoubleSide, depthWrite:opacity >= 0.35 });
}
function glow(color, opacity = .46){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function box(root,name,sx,sy,sz,x,y,z,mat,rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  m.name=name; m.position.set(x,y,z); m.rotation.y=rotY; root.add(m); return m;
}
function cyl(root,name,r,h,x,y,z,mat,segments=40){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat);
  m.name=name; m.position.set(x,y,z); root.add(m); return m;
}
function plane(root,name,w,h,x,y,z,mat,rotY=0,rotX=0){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  m.name=name; m.position.set(x,y,z); m.rotation.y=rotY; m.rotation.x=rotX; m.renderOrder=260; root.add(m); return m;
}
function texture(title, sub="", note="", color="#ffd98a", badge=""){
  const c = document.createElement("canvas"); c.width=1200; c.height=620;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#020613"); bg.addColorStop(.48,"#081327"); bg.addColorStop(1,"#120517");
  g.fillStyle=bg; g.fillRect(0,0,c.width,c.height);
  g.fillStyle="rgba(255,255,255,.045)"; g.fillRect(78,74,c.width-156,115);
  g.strokeStyle=color; g.lineWidth=16; g.strokeRect(28,28,c.width-56,c.height-56);
  g.strokeStyle="rgba(255,255,255,.20)"; g.lineWidth=4; g.strokeRect(64,64,c.width-128,c.height-128);
  g.textAlign="center"; g.textBaseline="middle";
  if(badge){ g.fillStyle="#9fb4da"; g.font="900 34px system-ui,Arial"; g.fillText(badge.toUpperCase(),600,96); }
  g.fillStyle="#ffffff"; g.font="900 78px system-ui,Arial"; g.fillText(title.toUpperCase(),600,178);
  g.fillStyle=color; g.font="850 44px system-ui,Arial"; g.fillText(sub,600,324);
  g.fillStyle="#dcefff"; g.font="750 32px system-ui,Arial"; g.fillText(note,600,438);
  const t = new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function panel(root,name,title,sub,note,x,y,z,rotY,color="#ffd98a",w=3.7,h=1.45,badge=""){
  box(root,`${name}_SOLID_FRAME`,w+.34,h+.34,.18,x,y,z,standard(0x111522,0x060814,.18,.55,.08),rotY);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({ map:texture(title,sub,note,color,badge), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name=name; p.position.set(x,y+.055,z); p.rotation.y=rotY; p.renderOrder=270; root.add(p); return p;
}
function addFinishedFloor(root){
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42,36), standard(FLOOR,0x02040b,.09,.82,.08));
  floor.name="PHASE244_SOLID_POLISHED_MARBLE_FLOOR"; floor.rotation.x=-Math.PI/2; floor.position.y=.021; floor.renderOrder=-10; root.add(floor);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(5.2,22), basic(0x4b0718,.50));
  runner.name="PHASE244_CENTER_RED_CARPET_FINISHED"; runner.rotation.x=-Math.PI/2; runner.position.set(0,.032,2.9); root.add(runner);
  for(let i=0;i<9;i++){
    const z=-13+i*3.2;
    box(root,`PHASE244_FLOOR_GOLD_CROSSLINE_${i}`,38,.035,.035,0,.055,z,glow(GOLD,.20));
  }
  for(let i=0;i<11;i++){
    const x=-18+i*3.6;
    box(root,`PHASE244_FLOOR_CYAN_LONG_LINE_${i}`,.035,.034,32,x,.056,1.6,glow(CYAN,.14));
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.9,6.16,164),glow(GOLD,.32));
  ring.name="PHASE244_MAIN_LOBBY_FINISHED_FLOOR_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.065,.55); root.add(ring);
}
function addFinishedWalls(root){
  const wallMat = standard(WALL,0x03050c,.12,.77,.03);
  box(root,"PHASE244_FINISHED_NORTH_BACK_WALL",42,7.4,.5,0,3.7,-17.25,wallMat);
  box(root,"PHASE244_FINISHED_WEST_WALL",.5,6.6,34,-20.8,3.3,-.3,wallMat);
  box(root,"PHASE244_FINISHED_EAST_WALL",.5,6.6,34,20.8,3.3,-.3,wallMat);
  box(root,"PHASE244_FINISHED_SOUTH_LOW_FRONT_WALL",42,1.55,.42,0,.75,16.8,wallMat);
  box(root,"PHASE244_NORTH_TOP_GOLD_TRIM",42,.08,.10,0,7.25,-16.95,glow(GOLD,.62));
  box(root,"PHASE244_LEFT_TOP_GOLD_TRIM",.08,.08,34,-20.4,6.55,-.3,glow(GOLD,.50));
  box(root,"PHASE244_RIGHT_TOP_GOLD_TRIM",.08,.08,34,20.4,6.55,-.3,glow(GOLD,.50));
  box(root,"PHASE244_NORTH_LOWER_CYAN_TRIM",42,.06,.10,0,.85,-16.85,glow(CYAN,.44));
  box(root,"PHASE244_LEFT_LOWER_CYAN_TRIM",.08,.06,34,-20.25,.82,-.3,glow(CYAN,.34));
  box(root,"PHASE244_RIGHT_LOWER_CYAN_TRIM",.08,.06,34,20.25,.82,-.3,glow(CYAN,.34));
}
function addColumnsAndBalcony(root){
  const stone=standard(STONE,0x130b04,.16,.52,.12);
  const rearXs=[-17,-13,-9,-5,-1,3,7,11,15,19];
  rearXs.forEach((x,i)=>{
    cyl(root,`PHASE244_REAR_FINISHED_COLUMN_${i}`,0.34,5.95,x,3.45,-15.3,stone,42);
    cyl(root,`PHASE244_REAR_COLUMN_BASE_${i}`,0.52,.28,x,.14,-15.3,stone,42);
    box(root,`PHASE244_REAR_COLUMN_CAP_${i}`,1.05,.26,.78,x,6.52,-15.3,stone);
  });
  [-17.8,17.8].forEach((x,side)=>{
    [-11,-6,-1,4,9,14].forEach((z,i)=>{
      cyl(root,`PHASE244_${side?"RIGHT":"LEFT"}_SIDE_COLUMN_${i}`,0.32,5.25,x,3.05,z,stone,38);
      box(root,`PHASE244_${side?"RIGHT":"LEFT"}_SIDE_COLUMN_CAP_${i}`,.95,.22,.72,x,5.78,z,stone);
    });
  });
  box(root,"PHASE244_REAR_UPPER_BALCONY_DECK",40,.24,3.2,0,4.35,-13.75,standard(0x151b28,0x030713,.13,.70,.05));
  box(root,"PHASE244_LEFT_UPPER_BALCONY_DECK",3.2,.22,26,-18.7,4.28,1.2,standard(0x151b28,0x030713,.13,.70,.05));
  box(root,"PHASE244_RIGHT_UPPER_BALCONY_DECK",3.2,.22,26,18.7,4.28,1.2,standard(0x151b28,0x030713,.13,.70,.05));
  box(root,"PHASE244_REAR_GOLD_BALCONY_RAIL",39,.08,.08,0,4.88,-12.05,glow(GOLD,.70));
  box(root,"PHASE244_LEFT_GOLD_BALCONY_RAIL",.08,.08,25,-17.05,4.83,1.2,glow(GOLD,.62));
  box(root,"PHASE244_RIGHT_GOLD_BALCONY_RAIL",.08,.08,25,17.05,4.83,1.2,glow(GOLD,.62));
  box(root,"PHASE244_REAR_GLASS_BALCONY",38,.86,.045,0,4.52,-11.92,basic(CYAN,.13));
  box(root,"PHASE244_LEFT_GLASS_BALCONY",.045,.82,24,-16.9,4.49,1.2,basic(CYAN,.12));
  box(root,"PHASE244_RIGHT_GLASS_BALCONY",.045,.82,24,16.9,4.49,1.2,basic(CYAN,.12));
}
function addCanopyAndSelector(root){
  const stone=standard(0xe2d7bc,0x161006,.14,.48,.10);
  [[-4.15,-1.8],[4.15,-1.8],[-4.15,2.65],[4.15,2.65]].forEach(([x,z],i)=>{
    cyl(root,`PHASE244_MAIN_CANOPY_COLUMN_${i}`,0.30,4.7,x,2.35,z,stone,44);
    cyl(root,`PHASE244_MAIN_CANOPY_COLUMN_BASE_${i}`,0.48,.28,x,.16,z,stone,44);
  });
  box(root,"PHASE244_MAIN_CANOPY_FRONT_BEAM",9.2,.18,.22,0,4.95,2.65,stone);
  box(root,"PHASE244_MAIN_CANOPY_BACK_BEAM",9.2,.18,.22,0,4.95,-1.8,stone);
  box(root,"PHASE244_MAIN_CANOPY_LEFT_BEAM",.22,.18,4.6,-4.15,4.95,.42,stone);
  box(root,"PHASE244_MAIN_CANOPY_RIGHT_BEAM",.22,.18,4.6,4.15,4.95,.42,stone);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(8.9,4.5),basic(CYAN,.10));
  top.name="PHASE244_SOFT_GLASS_CANOPY_ROOF"; top.rotation.x=-Math.PI/2; top.position.set(0,5.06,.42); root.add(top);
  panel(root,"PHASE244_CENTRAL_PLAY_GAME_SIGN","PLAY GAME","Choose Your Table","Hold'em • Omaha • Private Rooms",0,3.32,-4.85,0,"#ffd98a",5.6,1.48);
  [["HOLD'EM","NO LIMIT","$0.25 / $0.50",-2.18],["HOLD'EM","NO LIMIT","$1 / $2",0],["OMAHA","POT LIMIT","$2 / $4",2.18]].forEach(([a,b,c,x])=>panel(root,`PHASE244_TABLE_SELECTOR_${x}`,a,b,c,x,2.0,-4.55,0,"#7ffcff",1.75,1.34));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.65,.035,10,160),glow(GOLD,.48));
  ring.name="PHASE244_CENTRAL_SELECTOR_FLOATING_RING"; ring.rotation.x=Math.PI/2; ring.position.set(0,2.62,-4.55); root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.08,.025,10,160),glow(CYAN,.28));
  ring2.name="PHASE244_CENTRAL_SELECTOR_OUTER_RING"; ring2.rotation.x=Math.PI/2; ring2.position.set(0,2.72,-4.55); root.add(ring2);
  root.userData.phase244Rings=[ring,ring2];
}
function addStorefronts(root){
  panel(root,"PHASE244_WELLNESS_STORE_FRONT","WELLNESS HUB","Reiki / Relaxation","private scene portal",-10.4,1.86,-8.95,-.03,"#a77cff",3.3,1.36);
  panel(root,"PHASE244_VIDEO_SALON_FRONT","VIDEO SALON","Preview Theater","coming soon",-14.9,1.86,-8.1,.18,"#a77cff",2.9,1.22);
  panel(root,"PHASE244_PGA_STORE_FRONT","PGA HUB","Practice • Grip • Achieve","private range portal",-4.85,1.86,-8.95,0,"#7ffcff",3.2,1.36);
  panel(root,"PHASE244_SVR_STORE_FRONT","SVR STORE","Gear • chips • avatars","web store portal",4.85,1.86,-8.95,0,"#8dffb4",3.2,1.36);
  panel(root,"PHASE244_SCORPION_FRONT","SCORPION ROOM","Private Poker Suite","city overlook room",10.5,1.86,-8.95,.03,"#ff5b8c",3.25,1.36);
  panel(root,"PHASE244_VIP_SOCIAL_FRONT","VIP LOUNGE","Social Room","private hangout",15.0,1.86,-8.05,-.18,"#ff5b8c",2.9,1.22);
  panel(root,"PHASE244_LEFT_JUMBOTRON_FINISHED","JUMBOTRON","Your Brand Here","premium ad slot",-20.42,3.05,-1.75,Math.PI/2,"#7ffcff",4.75,2.15,"Tier 1");
  panel(root,"PHASE244_RIGHT_JUMBOTRON_FINISHED","JUMBOTRON","Your Brand Here","premium ad slot",20.42,3.05,-1.75,-Math.PI/2,"#7ffcff",4.75,2.15,"Tier 1");
  panel(root,"PHASE244_LEFT_BANNER_SLIDER","BANNER SLIDER","Rotating Sponsors","premium strip",-20.45,5.18,-1.75,Math.PI/2,"#ffd98a",4.55,.68,"Tier 2");
  panel(root,"PHASE244_RIGHT_BANNER_SLIDER","BANNER SLIDER","Rotating Sponsors","premium strip",20.45,5.18,-1.75,-Math.PI/2,"#ffd98a",4.55,.68,"Tier 2");
  panel(root,"PHASE244_DAILY_BONUS_FINISHED","DAILY BONUS","Collect Reward","claim chips",-11.2,1.30,6.2,.24,"#ffd98a",2.55,1.20);
  panel(root,"PHASE244_SPONSOR_BOARD_FINISHED","SPONSOR AREA","Our Partners","modular grid",11.25,1.30,6.2,-.24,"#7ffcff",2.75,1.20);
  panel(root,"PHASE244_LEGENDS_FINISHED","LEGENDS","Hall of Fame","trophy pedestal",7.1,1.15,4.35,-.18,"#ffd98a",2.55,1.05);
}
function addPortalPads(root){
  [[-10.4,-7.25,PURPLE,"WELLNESS"],[-4.85,-7.25,CYAN,"PGA"],[4.85,-7.25,GREEN,"STORE"],[10.5,-7.25,PINK,"SCORPION"],[0,-3.72,GOLD,"PLAY"]].forEach(([x,z,color,name])=>{
    const pad = new THREE.Mesh(new THREE.RingGeometry(.82,1.04,88),glow(color,.58));
    pad.name=`PHASE244_${name}_FINISHED_PORTAL_PAD`; pad.rotation.x=-Math.PI/2; pad.position.set(x,.082,z); root.add(pad);
    const core = new THREE.Mesh(new THREE.CircleGeometry(.70,72),glow(color,.14));
    core.name=`PHASE244_${name}_FINISHED_PORTAL_CORE`; core.rotation.x=-Math.PI/2; core.position.set(x,.075,z); root.add(core);
  });
}
function addSkyAndLight(scene,root){
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.72,64,36),standard(0xe7e2d7,0x2a3046,.22,.78,.02));
  moon.name="PHASE244_SINGLE_FINISHED_MOON_HIGH"; moon.position.set(-3.8,13.9,-24.5); root.add(moon);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(3.25,96),glow(0xf5f8ff,.10)); halo.name="PHASE244_MOON_HALO"; halo.position.copy(moon.position); halo.lookAt(0,2.2,6); root.add(halo);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(.55,40,24),standard(0xb94f35,0x2b0905,.24,.82,.02));
  mars.name="PHASE244_SINGLE_FINISHED_MARS_HIGH"; mars.position.set(5.7,12.1,-27.5); root.add(mars);
  scene.add(new THREE.AmbientLight(0x6f85a9,.28));
  const center = new THREE.PointLight(CYAN,1.05,32,1.7); center.name="PHASE244_CENTER_CYAN_LIGHT"; center.position.set(0,4.6,1.0); scene.add(center);
  const rear = new THREE.PointLight(GOLD,1.05,32,1.8); rear.name="PHASE244_REAR_WARM_LIGHT"; rear.position.set(0,5.4,-10.2); scene.add(rear);
  root.userData.phase244Planets={moon,mars,halo};
}
function hideOldSparseParts(scene){
  const names = ["PHASE200_SUBTLE_ORDERED_FLOOR_GRID","PHASE200_CENTER_RED_CARPET_AXIS","PHASE200_LEFT_JUMBOTRON_SLOT","PHASE200_RIGHT_JUMBOTRON_SLOT"];
  scene.traverse((obj)=>{ if(names.includes(obj.name)) obj.visible=false; });
}
async function install(){
  const runtime = await waitForRuntime();
  if(!runtime?.scene) return;
  const { scene } = runtime;
  if(scene.getObjectByName("PHASE244_FINISHED_PALACE_LOBBY_ROOT")) return;
  hideOldSparseParts(scene);
  const root = new THREE.Group(); root.name="PHASE244_FINISHED_PALACE_LOBBY_ROOT"; scene.add(root);
  addFinishedFloor(root);
  addFinishedWalls(root);
  addColumnsAndBalcony(root);
  addCanopyAndSelector(root);
  addStorefronts(root);
  addPortalPads(root);
  addSkyAndLight(scene,root);
  const clock = new THREE.Clock();
  function animate(){
    const dt = Math.min(clock.getDelta(),.033);
    const rings=root.userData.phase244Rings||[];
    if(rings[0]) rings[0].rotation.z += dt*.15;
    if(rings[1]) rings[1].rotation.z -= dt*.10;
    const p=root.userData.phase244Planets;
    if(p?.moon) p.moon.rotation.y += dt*.032;
    if(p?.mars) p.mars.rotation.y += dt*.055;
    requestAnimationFrame(animate);
  }
  animate();
  window.SVR_PHASE244_FINISHED_LOBBY_BUILD = { build:BUILD, active:true, siteTouched:false, finishedLobby:true, layers:["solid floor", "finished walls", "balcony", "canopy", "storefronts", "sponsor boards", "portal pads", "moon mars"], checkedAt:new Date().toISOString() };
}
install();
