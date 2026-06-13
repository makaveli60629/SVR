import * as THREE from "three";
import { applyPhase142QuickLobbyRemodel } from "./phase142_quick_lobby_remodel.js";

function makeTexture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function adTexture(title, subtitle, accent="#7dfff0"){
  return makeTexture(1200, 620, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#02070b"); g.addColorStop(.55,"#0d1024"); g.addColorStop(1,"#020306");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent; ctx.lineWidth = 18; ctx.strokeRect(30,30,w-60,h-60);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; ctx.font = "900 84px system-ui,Arial"; ctx.fillText(title,w/2,185,w-100);
    ctx.fillStyle = "#dffff8"; ctx.font = "800 42px system-ui,Arial"; ctx.fillText(subtitle,w/2,315,w-120);
    ctx.fillStyle = "rgba(255,255,255,.10)"; ctx.fillRect(90,410,w-180,76);
    ctx.fillStyle = accent; ctx.font = "900 34px system-ui,Arial"; ctx.fillText("WALL ALIGNED AD SLOT",w/2,448,w-120);
  });
}

function planetTexture(kind){
  return makeTexture(1536,768,(ctx,w,h)=>{
    if(kind === "earth"){
      const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#1684df"); g.addColorStop(.55,"#0d4c9d"); g.addColorStop(1,"#061648");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      [[210,240,185,82,-.25],[430,385,160,92,.45],[765,280,260,112,-.38],[1020,500,185,86,.22],[1290,250,165,72,.08]].forEach((p,i)=>{ctx.fillStyle=i%2?"#39a95d":"#71c77a";ctx.beginPath();ctx.ellipse(...p,0,Math.PI*2);ctx.fill();});
      ctx.fillStyle="rgba(255,255,255,.27)"; for(let i=0;i<34;i++){ctx.beginPath();ctx.ellipse((i*123+75)%w,70+(i*67)%610,120+(i%5)*28,14+(i%4)*8,i*.31,0,Math.PI*2);ctx.fill();}
    } else if(kind === "moon"){
      ctx.fillStyle = "#d9d9df"; ctx.fillRect(0,0,w,h);
      for(let i=0;i<120;i++){ctx.fillStyle=`rgba(58,60,72,${.08+(i%8)*.026})`;ctx.beginPath();ctx.arc((i*97)%w,(i*61)%h,8+(i%10)*6,0,Math.PI*2);ctx.fill();}
    } else {
      const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#7d2b1a"); g.addColorStop(.5,"#c96d3d"); g.addColorStop(1,"#f19b61"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
      ctx.fillStyle="rgba(74,18,8,.40)"; for(let i=0;i<70;i++){ctx.beginPath();ctx.ellipse((i*89)%w,(i*53)%h,42+(i%7)*18,11+(i%5)*7,i*.34,0,Math.PI*2);ctx.fill();}
    }
  });
}

function hideOldSky(scene, keeper){
  const p = new THREE.Vector3();
  scene.traverse((o)=>{
    if(!o || o===keeper || keeper.children.includes(o)) return;
    o.getWorldPosition?.(p);
    if(p.y < 26) return;
    if(o.isLine || o.type === "Line" || o.type === "LineLoop") o.visible = false;
    const r = o.isMesh ? (o.geometry?.parameters?.radius || 0) : 0;
    if(o.isMesh && r >= 3) o.visible = false;
    if(o.isSprite && Math.max(o.scale.x||0,o.scale.y||0)>20) o.visible = false;
  });
}

function addHigherPlanets(scene, log=()=>{}){
  if(scene.userData._phase143HigherPlanets) return scene.userData._phase143HigherPlanets;
  ["phase142Planets","_phase141ShowcasePlanets","_phase140Planets","_phase137StablePlanets","_phase136Solar"].forEach(k=>{ if(scene.userData[k]?.group) scene.userData[k].group.visible=false; });
  const group = new THREE.Group(); group.name = "PHASE143 HIGH TEXTURED PLANETS NORTH SKY"; scene.add(group);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(42,96,56), new THREE.MeshStandardMaterial({map:planetTexture("earth"), roughness:.62, emissive:0x071a32, emissiveIntensity:.15}));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(13,64,36), new THREE.MeshStandardMaterial({map:planetTexture("moon"), roughness:.92, emissive:0x101018, emissiveIntensity:.05}));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(16,64,36), new THREE.MeshStandardMaterial({map:planetTexture("mars"), roughness:.78, emissive:0x2c0804, emissiveIntensity:.07}));
  const light = new THREE.PointLight(0xc9e6ff,2.1,620,1.4);
  group.add(earth,moon,mars,light);
  const state = {group,earth,moon,mars, update(dt=0){
    hideOldSky(scene, group);
    const t = performance.now()*.001;
    const eo = t*.0018;
    earth.position.set(Math.cos(eo)*62, 92 + Math.sin(t*.018)*2, -122 + Math.sin(eo)*20);
    earth.rotation.y += dt*.014;
    const mo=t*.012;
    moon.position.set(earth.position.x+Math.cos(mo)*72, earth.position.y+18+Math.sin(mo*.7)*5, earth.position.z+Math.sin(mo)*52);
    moon.rotation.y += dt*.020;
    const ma=t*.007; const md=116+Math.sin(t*.010)*48;
    mars.position.set(earth.position.x+Math.cos(ma)*md, earth.position.y+32+Math.sin(ma*.7)*8, earth.position.z+Math.sin(ma)*md*.62);
    mars.rotation.y += dt*.018;
    light.position.copy(earth.position);
  }};
  scene.userData._phase143HigherPlanets = state;
  log("Phase 143 higher textured planets active");
  return state;
}

function addBuilding(scene, angle, radius, width, height, depth, texture, name){
  const group = new THREE.Group(); group.name = name;
  group.position.set(Math.cos(angle)*radius, 0, Math.sin(angle)*radius);
  group.lookAt(0,0,0);
  scene.add(group);
  const mat = new THREE.MeshStandardMaterial({color:0x111722, roughness:.68, metalness:.12, emissive:0x070b16, emissiveIntensity:.22});
  const tower = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth), mat);
  tower.position.y = height/2;
  group.add(tower);
  const ad = new THREE.Mesh(new THREE.PlaneGeometry(width*.78, Math.min(5.8,height*.36)), new THREE.MeshBasicMaterial({map:texture, side:THREE.DoubleSide, transparent:true, depthWrite:false}));
  ad.name = name + " TABLE FACING AD";
  ad.position.set(0, Math.min(height-3.2, height*.62), depth/2+.025);
  group.add(ad);
  return group;
}

function addPermanentBackdrop(scene){
  if(scene.userData._phase143BackdropBuildings) return;
  const ads = [
    adTexture("SVR POKER","sponsor tower"),
    adTexture("TRUEITIVE","reiki wellness preview","#b58cff"),
    adTexture("ESPRESSO","with cream ad slot","#ffd37b"),
    adTexture("VIBES","VR theater","#65b7ff"),
    adTexture("PGA HUB","golf training","#7dffb2")
  ];
  const radius = 58;
  for(let i=0;i<24;i++){
    const angle = i/24*Math.PI*2;
    const h = 18 + (i%6)*4;
    const w = 5.0 + (i%4)*1.1;
    addBuilding(scene, angle, radius, w, h, 2.1, ads[i%ads.length], "PHASE143 PERMANENT BACKDROP BUILDING " + i);
  }
  scene.userData._phase143BackdropBuildings = true;
}

function alignSignsToWall(scene){
  if(scene.userData._phase143SignsAligned) return;
  const p = new THREE.Vector3();
  scene.traverse((o)=>{
    if(!o?.isMesh) return;
    const name = String(o.name||"").toLowerCase();
    if(!(name.includes("sign") || name.includes("marquee") || name.includes("ad") || name.includes("panel"))) return;
    o.getWorldPosition(p);
    if(p.length() < 6) return;
    o.lookAt(0,p.y,0);
  });
  scene.userData._phase143SignsAligned = true;
}

export async function applyPhase143WallAlignedSkylineAds(args={}){
  const result = await applyPhase142QuickLobbyRemodel(args);
  const scene = args.scene;
  if(!scene) return result;
  addPermanentBackdrop(scene);
  alignSignsToWall(scene);
  const planets = addHigherPlanets(scene,args.log||(()=>{}));
  if(!scene.userData._phase143Tick){
    const old = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{ old?.(dt); planets.update(dt); };
    scene.userData._phase143Tick = true;
  }
  args.setStatus?.("Phase 143 wall alignment, skyline, ads, and higher planets active", {force:true});
  return {...result, phase143Planets:planets};
}
