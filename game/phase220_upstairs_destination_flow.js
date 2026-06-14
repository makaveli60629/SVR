import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-220-UPSTAIRS-DESTINATION-FLOW-DEMO-CAPTURE-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const GREEN = 0x8dffb4;
const PURPLE = 0xa77cff;
const RED = 0xff5b8c;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_DISABLE_LEGACY_SKYLINE = true;
  window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
  window.SVR_PHASE220 = {
    build: LABEL,
    active: true,
    upstairsDestinationFlow: true,
    returnMarker: true,
    demoCaptureSpots: true,
    cityRevealShimmer: true,
    preservesPhase219City: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function glow(color, opacity=.42){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function solid(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, depthWrite:opacity>=1 });
}
function addBox(root,name,sx,sy,sz,x,y,z,material,rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name = name;
  m.position.set(x,y,z);
  m.rotation.y = rotY;
  root.add(m);
  return m;
}
function makeLabel(title, sub, color="#7ffcff"){
  const c=document.createElement("canvas"); c.width=900; c.height=260;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.84)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=color; ctx.lineWidth=12; ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.fillStyle="#ffffff"; ctx.font="900 58px system-ui,Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(title,c.width/2,96);
  ctx.fillStyle=color; ctx.font="800 30px system-ui,Arial"; ctx.fillText(sub,c.width/2,168);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addFloorLabel(root,name,title,sub,x,z,color){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5,.72), new THREE.MeshBasicMaterial({ map:makeLabel(title,sub,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  mesh.name = name;
  mesh.rotation.x = -Math.PI/2;
  mesh.position.set(x,3.545,z);
  mesh.renderOrder = 44;
  root.add(mesh);
  return mesh;
}
function addStandPad(root,name,x,z,color,title,sub){
  const ring = new THREE.Mesh(new THREE.RingGeometry(.62,.82,96), glow(color,.62));
  ring.name = `${name}_RING`;
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x,3.542,z);
  root.add(ring);
  const core = new THREE.Mesh(new THREE.CircleGeometry(.55,72), glow(color,.16));
  core.name = `${name}_CORE`;
  core.rotation.x = -Math.PI/2;
  core.position.set(x,3.539,z);
  root.add(core);
  addFloorLabel(root,`${name}_LABEL`,title,sub,x,z+.95,color===GOLD?"#ffd98a":"#7ffcff");
}
function addArrow(root,i,x,z,rot=0,color=GREEN){
  const g = new THREE.Group();
  g.name = `PHASE220_CITY_ROUTE_ARROW_${i}`;
  g.position.set(x,3.548,z);
  g.rotation.y = rot;
  root.add(g);
  const stem = new THREE.Mesh(new THREE.PlaneGeometry(.22,.74), glow(color,.38));
  stem.name = "ARROW_STEM"; stem.rotation.x = -Math.PI/2; stem.position.z = .12; g.add(stem);
  const head = new THREE.Mesh(new THREE.CircleGeometry(.34,3), glow(color,.52));
  head.name = "ARROW_HEAD"; head.rotation.x = -Math.PI/2; head.rotation.z = Math.PI/2; head.position.z = -.38; g.add(head);
}
function addVerticalSign(root,name,title,sub,x,y,z,rotY,color){
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2,.92), new THREE.MeshBasicMaterial({ map:makeLabel(title,sub,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.name = name; sign.position.set(x,y,z); sign.rotation.y = rotY; sign.renderOrder = 55; root.add(sign); return sign;
}
function addPath(root){
  const pts = [
    [-13.2,4.8],[-11.9,3.2],[-10.3,1.5],[-8.7,-.3],[-7.0,-2.2],[-5.3,-4.0],[-3.7,-5.8],[-2.0,-7.7],[0,-9.6]
  ];
  pts.forEach((p,i)=>{
    addArrow(root,i+1,p[0],p[1],-.72 + i*.09, i%2?CYAN:GREEN);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.14,32), glow(i%2?CYAN:GOLD,.44));
    dot.name = `PHASE220_ROUTE_LIGHT_DOT_${i+1}`;
    dot.rotation.x = -Math.PI/2;
    dot.position.set(p[0],3.552,p[1]);
    root.add(dot);
  });
  addFloorLabel(root,"PHASE220_ROUTE_START_LABEL","CITY VIEW","follow lights",-13.4,5.9,"#8dffb4");
}
function addReturnMarker(root){
  addStandPad(root,"PHASE220_RETURN_TO_LOBBY_PAD",13.0,5.95,RED,"RETURN","lobby floor");
  addVerticalSign(root,"PHASE220_RETURN_TO_LOBBY_SIGN","RETURN PAD","safe route down",13.0,4.82,5.25,-.36,"#ff5b8c");
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.05,.28,2.4,32), glow(RED,.20));
  beam.name = "PHASE220_RETURN_PAD_SOFT_BEAM";
  beam.position.set(13.0,4.72,5.95);
  root.add(beam);
}
function addDemoSpots(root){
  addStandPad(root,"PHASE220_DEMO_CAMERA_CITY_HERO",0,-10.85,GOLD,"DEMO CAM","city hero");
  addStandPad(root,"PHASE220_DEMO_CAMERA_LOBBY_REVEAL",-5.25,-9.85,CYAN,"DEMO CAM","lobby + skyline");
  addStandPad(root,"PHASE220_DEMO_CAMERA_SPECTATOR",5.25,-9.85,PURPLE,"PHOTO SPOT","spectator view");
  addVerticalSign(root,"PHASE220_WEBEX_CAPTURE_SIGN","WEBEX VIEW","stand here for demo",0,5.72,-14.88,0,"#ffd98a");
  window.SVR_PHASE220_DEMO_SPOTS = [
    { name:"cityHero", position:{x:0,y:3.6,z:-10.85}, lookAt:{x:0,y:7.5,z:-31} },
    { name:"lobbyReveal", position:{x:-5.25,y:3.6,z:-9.85}, lookAt:{x:0,y:2.6,z:0.5} },
    { name:"spectator", position:{x:5.25,y:3.6,z:-9.85}, lookAt:{x:0,y:4.8,z:-15.5} }
  ];
}
function addCityShimmer(root){
  const strips=[];
  for(let i=0;i<9;i++){
    const s = new THREE.Mesh(new THREE.PlaneGeometry(.09,8.5), glow(i%2?CYAN:PURPLE,.09));
    s.name = `PHASE220_CITY_REVEAL_SHIMMER_${i+1}`;
    s.position.set(-18+i*4.5,8.9,-24.85-i*.08);
    s.rotation.z = .22;
    root.add(s);
    strips.push(s);
  }
  const scene = window.__SVR_SCENE__;
  if(scene && !scene.userData._phase220Tick){
    scene.userData._phase220Tick = true;
    const old = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      if(typeof old === "function") old(dt);
      const t = performance.now()*.001;
      strips.forEach((s,i)=>{ s.material.opacity = .055 + Math.sin(t*.7+i*.8)*.025; s.position.y = 8.9 + Math.sin(t*.35+i)*.10; });
    };
  }
}
function clearBlockedPath(scene){
  const safe = [];
  scene.traverse(o=>{
    const n = String(o.name||"");
    if(/PHASE218_OVERLOOK_SIDE_BENCH/i.test(n)) safe.push(o);
  });
  safe.forEach(o=>{ if(o.position && Math.abs(o.position.x)<2.8 && o.position.z>-11.8) o.position.x += o.position.x<0 ? -3 : 3; });
}
function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if(!scene || window.SVR_PHASE220_DESTINATION_FLOW_INSTALLED) return !!scene;
  const old = scene.getObjectByName("PHASE220_UPSTAIRS_DESTINATION_FLOW_ROOT");
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE220_UPSTAIRS_DESTINATION_FLOW_ROOT";
  scene.add(root);
  clearBlockedPath(scene);
  addPath(root);
  addReturnMarker(root);
  addDemoSpots(root);
  addCityShimmer(root);
  addBox(root,"PHASE220_LOW_SAFE_OVERLOOK_STOP_RAIL",7.8,.045,.05,0,3.92,-11.62,glow(GOLD,.30));
  window.SVR_PHASE220_DESTINATION_FLOW_INSTALLED = true;
  return true;
}

stamp();
let tries = 0;
const id = setInterval(()=>{ tries++; if(install() || tries>120) clearInterval(id); },180);
[400,900,1800,3600,7200,12000].forEach(ms=>setTimeout(install,ms));
setInterval(stamp,700);
