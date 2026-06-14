import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-185-OFFICIAL-LOBBY-LOOK-LOCK";
const GOLD = 0xffdf8a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const STONE = 0x56516b;

function canvasTexture(w,h,draw){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d"); draw(ctx,w,h);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function signTexture(title,line1="",line2="",color="#ffdf8a"){
  return canvasTexture(1200,560,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#060713"); g.addColorStop(1,"#15051d");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=color; ctx.lineWidth=16; ctx.strokeRect(32,32,w-64,h-64);
    ctx.fillStyle="rgba(255,255,255,.08)"; ctx.fillRect(62,64,w-124,86);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=color; ctx.font="900 68px system-ui,Arial"; ctx.fillText(title,w/2,118);
    ctx.fillStyle="#fff"; ctx.font="800 42px system-ui,Arial"; ctx.fillText(line1,w/2,270);
    ctx.fillStyle="#dffcff"; ctx.font="700 32px system-ui,Arial"; ctx.fillText(line2,w/2,375);
  });
}
function material(color, metal=.04, rough=.68, emissive=0x050506, ei=.08){
  return new THREE.MeshStandardMaterial({ color, metalness:metal, roughness:rough, emissive, emissiveIntensity:ei });
}
function faceCenter(obj,a,r,y){ obj.position.set(Math.cos(a)*r,y,Math.sin(a)*r); obj.lookAt(0,y-.2,0); }
function panel(root,name,title,line1,line2,a,r,y,w,h,color="#ffdf8a"){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTexture(title,line1,line2,color),transparent:true,side:THREE.DoubleSide}));
  m.name=name; faceCenter(m,a,r,y); root.add(m); return m;
}
function hideOldVisuals(scene){
  const patterns=[/PHASE176_LOBBY_ARENA/i,/PHASE176_JUMBOTRON/i,/PHASE179_CENTERPIECE/i,/PHASE183_ROMAN_MEZZANINE/i,/PHASE184_LOBBY_EXPERIENCE/i,/old.*moon/i,/fake.*moon/i,/old.*mars/i,/fake.*mars/i,/picture.*sky/i,/billboard.*moon/i,/billboard.*mars/i];
  scene.traverse(o=>{ const n=String(o.name||""); if(patterns.some(rx=>rx.test(n))) o.visible=false; });
}
function addFloor(root){
  const floor=new THREE.Mesh(new THREE.CircleGeometry(13.4,96),new THREE.MeshStandardMaterial({color:0x181925,roughness:.38,metalness:.12,emissive:0x020207,emissiveIntensity:.25}));
  floor.name="PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR"; floor.rotation.x=-Math.PI/2; floor.position.y=.018; root.add(floor);
  for(const [r,y,c,o] of [[3.8,.05,GOLD,.52],[6.4,.055,CYAN,.22],[10.8,.06,GOLD,.28],[12.8,.065,PURPLE,.28]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,10,160),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o}));
    ring.name=`PHASE185_FLOOR_INLAY_RING_${r}`; ring.rotation.x=Math.PI/2; ring.position.y=y; root.add(ring);
  }
}
function addRomanWall(root){
  const wallMat=material(STONE,.05,.72,0x080714,.13);
  const archMat=material(0xd6c8a9,.08,.58,0x0b0804,.12);
  const bannerMat=new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.38});
  const r=13.15, side=2*r*Math.tan(Math.PI/16)+.08;
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    const wall=new THREE.Mesh(new THREE.BoxGeometry(side,5.2,.42),wallMat);
    wall.name=`PHASE185_TALL_CURVED_ROMAN_WALL_${i+1}`; faceCenter(wall,a,r,3.0); wall.rotation.y+=Math.PI/2; root.add(wall);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,5.6,24),archMat);
    col.name=`PHASE185_ROMAN_VERTICAL_COLUMN_${i+1}`; faceCenter(col,a+Math.PI/32,12.92,2.82); root.add(col);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.78,.045,10,64,Math.PI),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.45}));
    arch.name=`PHASE185_GOLD_ARCH_TRACE_${i+1}`; faceCenter(arch,a,12.78,4.25); arch.scale.y=.52; root.add(arch);
    if(i%2===0){
      const b=new THREE.Mesh(new THREE.PlaneGeometry(.72,1.6),bannerMat); b.name=`PHASE185_BLUE_GOLD_VERTICAL_BANNER_${i+1}`; faceCenter(b,a,12.68,4.12); root.add(b);
    }
  }
  const upper=new THREE.Mesh(new THREE.TorusGeometry(12.62,.07,10,180),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.42}));
  upper.name="PHASE185_UPPER_GOLD_CORNICE_RING"; upper.rotation.x=Math.PI/2; upper.position.y=5.82; root.add(upper);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(11.92,.06,10,180),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.52}));
  rail.name="PHASE185_ROMAN_BALCONY_BANISTER_RING"; rail.rotation.x=Math.PI/2; rail.position.y=3.18; root.add(rail);
  const walk=new THREE.Mesh(new THREE.TorusGeometry(12.15,.16,12,180),material(0x302d3c,.06,.6,0x020207,.12));
  walk.name="PHASE185_UPPER_STOREFRONT_WALKWAY_RING"; walk.rotation.x=Math.PI/2; walk.position.y=2.92; root.add(walk);
}
function addAds(root){
  const tiers=[
    {t:1,title:"TIER 1",body:"JUMBOTRON",sub:"PREMIUM BRAND HERE",slots:[0,Math.PI],w:4.65,h:1.9,y:2.45,c:"#ffdf8a"},
    {t:2,title:"TIER 2",body:"BANNER SLIDER",sub:"STANDARD SPONSOR",slots:[Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4],w:3.1,h:.95,y:3.55,c:"#7ffcff"},
    {t:3,title:"TIER 3",body:"BANNER PANEL",sub:"BASIC ROTATION",slots:[Math.PI/8,3*Math.PI/8,5*Math.PI/8,7*Math.PI/8,9*Math.PI/8,11*Math.PI/8,13*Math.PI/8,15*Math.PI/8],w:1.55,h:.48,y:1.58,c:"#a77cff"}
  ];
  const units=[];
  tiers.forEach(unit=>unit.slots.forEach((a,i)=>{ const m=panel(root,`PHASE185_TIER_${unit.t}_AD_${i+1}`,unit.title,unit.body,unit.sub,a,12.42,unit.y,unit.w,unit.h,unit.c); m.userData.unit=unit; m.userData.index=i; units.push(m); }));
  root.userData.adUnits=units;
}
function addCenter(root){
  const stage=new THREE.Mesh(new THREE.CircleGeometry(3.95,96),material(0x10111a,.12,.42,0x04040a,.22));
  stage.name="PHASE185_RECESSED_PLAY_GAME_STAGE"; stage.rotation.x=-Math.PI/2; stage.position.y=-.035; root.add(stage);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(4.18,.045,10,150),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.65}));
  rail.name="PHASE185_CENTER_GOLD_SPECTATOR_RAIL"; rail.rotation.x=Math.PI/2; rail.position.y=.72; root.add(rail);
  panel(root,"PHASE185_PLAY_GAME_HEADER","PLAY GAME","Choose Your Table","Hands / Controller / Desktop",-Math.PI/2,3.05,2.48,3.7,1.25,"#ffdf8a");
  const tables=["HOLD'EM","OMAHA","FREEROLL"];
  tables.forEach((t,i)=>panel(root,`PHASE185_TABLE_CARD_${i+1}`,t,i===2?"EVENT QUEUE":"NO LIMIT",i===2?"JOIN LIST":"SELECT TABLE",-Math.PI/2+(i-1)*.24,2.35,1.42,1.14,.78,"#7ffcff"));
  const welcome=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.95),new THREE.MeshBasicMaterial({map:signTexture("WELCOME TO SVR","PLAY. COMPETE. BELONG.","Official Lobby Look","#ffdf8a"),transparent:true,side:THREE.DoubleSide}));
  welcome.name="PHASE185_CENTER_WELCOME_PANEL"; welcome.position.set(0,1.12,-.85); welcome.lookAt(0,1.12,4); root.add(welcome);
}
function addHubs(root){
  const hubs=[
    {n:"WELLNESS HUB",s:"Relax & Restoration",a:-2.55,c:"#a77cff"},
    {n:"PGA HUB",s:"Practice. Grow. Achieve.",a:-.78,c:"#7ffcff"},
    {n:"SCORPION ROOM",s:"VIP / Private Events",a:.55,c:"#ff3355"},
    {n:"LEGENDS",s:"Hall of Fame",a:1.28,c:"#ffdf8a"},
    {n:"SPONSOR AREA",s:"Our Partners",a:2.15,c:"#7ffcff"},
    {n:"DAILY BONUS",s:"Collect Reward",a:-3.02,c:"#ffdf8a"}
  ];
  hubs.forEach((h,i)=>panel(root,`PHASE185_HUB_${h.n.replace(/\s+/g,"_")}`,h.n,h.s,i===5?"CLAIM BONUS":"ENTER",h.a,7.05,1.62,2.05,1.05,h.c));
  const mat=material(0xb5a37b,.09,.58,0x100b04,.18);
  for(let i=0;i<6;i++){
    const x=3.8+i*.38, z=3.9;
    const p=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,.22,24),mat); p.name=`PHASE185_LEGEND_PEDESTAL_${i+1}`; p.position.set(x,.12,z); root.add(p);
    const s=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.52,8,14),material(0xb5b0a8,.07,.6,0x070606,.12)); s.name=`PHASE185_LEGEND_STATUE_${i+1}`; s.position.set(x,.55,z); root.add(s);
  }
}
function addSky(root){
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.32,48,32),new THREE.MeshStandardMaterial({color:0xdedbd0,roughness:.62,metalness:.02,emissive:0x1a2033,emissiveIntensity:.28}));
  moon.name="PHASE185_OFFICIAL_BIG_MOON"; moon.position.set(-2.8,11.8,-8.6); root.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.48,36,20),new THREE.MeshStandardMaterial({color:0xc85a38,roughness:.74,emissive:0x2a0905,emissiveIntensity:.26}));
  mars.name="PHASE185_OFFICIAL_MARS"; mars.position.set(4.2,10.4,-9.6); root.add(mars);
  const light=new THREE.DirectionalLight(0xcad8ff,.55); light.name="PHASE185_OFFICIAL_MOONLIGHT"; light.position.copy(moon.position); root.add(light);
  root.userData.moon=moon; root.userData.mars=mars; root.userData.light=light;
}
function addLighting(root){
  const amb=new THREE.HemisphereLight(0xb8c8ff,0x08040b,.55); amb.name="PHASE185_SOFT_LOBBY_HEMISPHERE"; root.add(amb);
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; const l=new THREE.PointLight(0xffdf8a,.38,7,2); l.name=`PHASE185_WARM_ARCH_LIGHT_${i+1}`; l.position.set(Math.cos(a)*9.8,3.4,Math.sin(a)*9.8); root.add(l); }
}
export function installPhase185OfficialLobbyLook(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  hideOldVisuals(scene);
  const old=scene.getObjectByName("PHASE185_OFFICIAL_LOBBY_LOOK_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE185_OFFICIAL_LOBBY_LOOK_ROOT";
  addFloor(root); addRomanWall(root); addAds(root); addCenter(root); addHubs(root); addSky(root); addLighting(root);
  scene.add(root);
  let run=true; let last=0;
  function animate(now){
    if(!run || !root.parent) return; const t=now*.001;
    if(t-last>.08){ last=t;
      if(root.userData.moon){ const a=t*.018; root.userData.moon.position.set(Math.cos(a)*5.5-1.8,11.8,Math.sin(a)*2.2-8.9); root.userData.moon.rotation.y=t*.1; root.userData.light.position.copy(root.userData.moon.position); }
      if(root.userData.mars) root.userData.mars.rotation.y=t*.06;
      root.userData.adUnits?.forEach((m,idx)=>{ const u=m.userData.unit; const n=Math.floor(t/5+idx)%3; if(m.userData.slide!==n){ m.userData.slide=n; m.material.map?.dispose?.(); m.material.map=signTexture(u.title,n===0?u.body:n===1?"AUTO SLIDER":"SPONSOR ROTATION",u.sub,u.c); m.material.needsUpdate=true; } });
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.SVR_PHASE185_OFFICIAL_LOOK={label:LABEL,locked:true,officialRule:"All lobby modules should follow this Roman luxury VR casino look",features:["curved Roman wall","upper banister walkway","tier ads","center play game","store hubs","legends","moon and Mars"],checkedAt:new Date().toISOString()};
  console.log("[Phase185] official lobby look active");
  return root;
}
export function autoInstallPhase185OfficialLobbyLook(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase185OfficialLobbyLook(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
