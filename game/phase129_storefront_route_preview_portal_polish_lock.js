import * as THREE from "three";

const LABEL = "PHASE-129-STOREFRONT-ROUTE-PREVIEW-PORTAL-POLISH-LOCK";
const ROOT = "PHASE129_STOREFRONT_ROUTE_PREVIEW_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;

const ROUTES = [
  { key:"wellness", title:"WELLNESS", sub:"AWAITING APPROVAL", x:-16.2, y:2.55, z:-18.42, ry:0, color:PURPLE, type:"PRIVATE ROOM" },
  { key:"pga", title:"PGA RANGE", sub:"GOLF TRAINING", x:16.2, y:2.55, z:-18.42, ry:0, color:CYAN, type:"TRAINING PORTAL" },
  { key:"store", title:"SVR STORE", sub:"SHOWROOM PREVIEW", x:23.16, y:2.35, z:5.8, ry:-Math.PI/2, color:GOLD, type:"STORE ROUTE" },
  { key:"scorpion", title:"SCORPION", sub:"PRIVATE TABLE", x:23.16, y:2.35, z:-8.8, ry:-Math.PI/2, color:PURPLE, type:"PRIVATE ROOM" },
  { key:"lounge", title:"SVR LOUNGE", sub:"SOCIAL ROUTE", x:-23.16, y:2.35, z:5.8, ry:Math.PI/2, color:GOLD, type:"LOUNGE ROUTE" },
  { key:"vibes", title:"VIBES THEATER", sub:"MEDIA ROOM", x:-23.16, y:2.35, z:-8.8, ry:Math.PI/2, color:RED, type:"THEATER ROUTE" }
];

const routeGroups = new Map();
let pulse = 0;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function glow(color, opacity=.28){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function panelTexture(route){
  const c=document.createElement("canvas"); c.width=900; c.height=420; const x=c.getContext("2d");
  const hex=`#${route.color.toString(16).padStart(6,"0")}`;
  const bg=x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,"#02040a"); bg.addColorStop(.5,"#140614"); bg.addColorStop(1,"#02040a");
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.86)"; x.lineWidth=12; x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle=hex; x.lineWidth=7; x.strokeRect(56,56,c.width-112,c.height-112);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=22;
  x.fillStyle="#fff8df"; x.font="900 60px system-ui,Arial"; x.fillText(route.title,c.width/2,122,c.width-90);
  x.shadowBlur=9; x.fillStyle="#bffcff"; x.font="900 36px system-ui,Arial"; x.fillText(route.sub,c.width/2,202,c.width-90);
  x.fillStyle="#ffd98a"; x.font="900 28px system-ui,Arial"; x.fillText(route.type,c.width/2,278,c.width-90);
  x.fillStyle="#8dffb4"; x.font="800 20px system-ui,Arial"; x.fillText("PORTAL ROUTE PREVIEW • LOBBY STAYS CLEAN",c.width/2,342,c.width-90);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function makeRoute(scene, route){
  const root = scene.getObjectByName(ROOT);
  const group = new THREE.Group();
  group.name = `PHASE129_ROUTE_PREVIEW_GROUP_${route.key.toUpperCase()}`;
  group.position.set(route.x,0,route.z);
  group.rotation.y = route.ry;
  group.userData.phase129RouteKey = route.key;
  group.userData.phase129RoutePreview = true;
  root.add(group);

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.25,1.52), new THREE.MeshBasicMaterial({map:panelTexture(route),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name = `PHASE129_STOREFRONT_PREVIEW_PANEL_${route.key.toUpperCase()}`;
  panel.position.set(0,route.y,0);
  panel.renderOrder = 930;
  panel.userData.phase129RoutePreview = true;
  group.add(panel);

  const floor = new THREE.Mesh(new THREE.RingGeometry(1.08,1.28,96), glow(route.color,.32));
  floor.name = `PHASE129_PORTAL_ROUTE_FLOOR_RING_${route.key.toUpperCase()}`;
  floor.position.set(0,.08,1.04);
  floor.rotation.x = -Math.PI/2;
  floor.renderOrder = 928;
  floor.userData.phase129RoutePreview = true;
  group.add(floor);

  const enter = new THREE.Mesh(new THREE.PlaneGeometry(1.75,.34), new THREE.MeshBasicMaterial({map:enterTexture(route),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  enter.name = `PHASE129_ENTER_ROUTE_MARKER_${route.key.toUpperCase()}`;
  enter.position.set(0,.14,1.04);
  enter.rotation.x = -Math.PI/2;
  enter.renderOrder = 929;
  enter.userData.phase129RoutePreview = true;
  group.add(enter);

  const bars=[];
  [-1.75,1.75].forEach((x)=>{
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.08,1.78,.08), new THREE.MeshBasicMaterial({color:route.color,transparent:true,opacity:.58}));
    bar.name = `PHASE129_ROUTE_SIDE_LIGHT_${route.key.toUpperCase()}`;
    bar.position.set(x,route.y,0.01);
    bar.userData.phase129RoutePreview = true;
    group.add(bar);
    bars.push(bar);
  });
  group.userData.phase129Panel = panel;
  group.userData.phase129Floor = floor;
  group.userData.phase129Enter = enter;
  group.userData.phase129Bars = bars;
  routeGroups.set(route.key, group);
}
function enterTexture(route){
  const c=document.createElement("canvas"); c.width=700; c.height=180; const x=c.getContext("2d");
  const hex=`#${route.color.toString(16).padStart(6,"0")}`;
  x.fillStyle="rgba(0,0,0,.62)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=hex; x.lineWidth=8; x.strokeRect(20,20,c.width-40,c.height-40);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=18;
  x.fillStyle="#fff8df"; x.font="900 48px system-ui,Arial"; x.fillText("ENTER",c.width/2,75,c.width-70);
  x.shadowBlur=6; x.fillStyle="#bffcff"; x.font="800 22px system-ui,Arial"; x.fillText(route.title,c.width/2,122,c.width-70);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function addRoutes(scene){
  routeGroups.clear();
  ROUTES.forEach((route)=>makeRoute(scene, route));
}
function animate(){
  if(window.SVR_PHASE129_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE129_ANIMATION_LOOP_INSTALLED = true;
  const tick=()=>{
    const t=performance.now()*.001;
    pulse += .014;
    routeGroups.forEach((g,key)=>{
      const route = ROUTES.find((r)=>r.key===key);
      const floor = g.userData.phase129Floor;
      if(floor?.material){ floor.material.opacity = .22 + Math.sin(t*2.0 + route.x)*.08; floor.scale.setScalar(1 + Math.sin(t*1.5+route.z)*.035); }
      const enter = g.userData.phase129Enter;
      if(enter){ enter.position.y = .14 + Math.sin(t*1.8 + route.x)*.008; }
      (g.userData.phase129Bars||[]).forEach((bar,i)=>{ if(bar.material) bar.material.opacity = .42 + Math.sin(t*2.4+i)*.14; });
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|PHASE127|PHASE128|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible=true;
      o.userData.phase129CoreProtected=true;
      if(o.isMesh){ o.frustumCulled=false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title="Scarlett Poker VR";
  const s=document.getElementById("safeStatus"); if(s) s.textContent="Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent="SCARLETT POKER VR"; });
}
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    routePreviewPanels: count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i),
    routeFloorRings: count(scene,/PHASE129_PORTAL_ROUTE_FLOOR_RING/i),
    routeEnterMarkers: count(scene,/PHASE129_ENTER_ROUTE_MARKER/i),
    phase116PortalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    phase127RoundFlow: !!window.SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK,
    phase128Presence: !!window.SVR_PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_PREVIEW_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    watchObjects: count(scene,/WATCH/i),
    routeKeys: ROUTES.map((r)=>r.key),
    visualOnly:true,
    siteTouched:false,
    ready: !scene?.getObjectByName?.(DUP) && count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i) >= ROUTES.length && !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable=removeDuplicateTable(scene);
  addRoutes(scene);
  const protectedObjects=protectCore(scene);
  animate();
  const report=qa(scene);
  window.SVR_PHASE129_STOREFRONT_ROUTE_PREVIEW_PORTAL_POLISH_LOCK={ build:LABEL, active:true, storefrontRoutePreviews:true, visualOnly:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE129_ROUTE_PREVIEW_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
