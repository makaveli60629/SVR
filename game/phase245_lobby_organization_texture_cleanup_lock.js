import * as THREE from "three";

const BUILD = "PHASE-245-LOBBY-ORGANIZATION-TEXTURE-CLEANUP-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const PINK = 0xff5b8c;
const GREEN = 0x8dffb4;
const STONE = 0xd8ccb4;
const WALL = 0x0b0e18;

function waitForScene(){
  return new Promise((resolve)=>{
    let tries = 0;
    const tick = ()=>{
      if (window.__SVR_SCENE__) return resolve(window.__SVR_SCENE__);
      if (++tries > 360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function disposeObject(obj){
  obj.traverse?.((node)=>{
    node.geometry?.dispose?.();
    const m = node.material;
    if(Array.isArray(m)) m.forEach(x=>x?.dispose?.()); else m?.dispose?.();
  });
}
function removeNamed(scene, names){
  const set = new Set(names);
  const found = [];
  scene.traverse((obj)=>{ if(set.has(obj.name)) found.push(obj); });
  found.forEach((obj)=>{ obj.parent?.remove(obj); disposeObject(obj); });
  return found.length;
}
function material(color, emissive=0x000000, emissiveIntensity=.05, roughness=.7, metalness=.05){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness, metalness });
}
function glow(color, opacity=.44){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function basic(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, side:THREE.DoubleSide, depthWrite:opacity>.35 });
}
function box(root,name,sx,sy,sz,x,y,z,mat,rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  m.name=name; m.position.set(x,y,z); m.rotation.y=rotY; root.add(m); return m;
}
function cyl(root,name,r,h,x,y,z,mat,seg=36){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat);
  m.name=name; m.position.set(x,y,z); root.add(m); return m;
}
function makePanelTexture(title,sub,note,color="#ffd98a"){
  const c=document.createElement("canvas"); c.width=1024; c.height=512;
  const x=c.getContext("2d");
  const bg=x.createLinearGradient(0,0,1024,512);
  bg.addColorStop(0,"#050814"); bg.addColorStop(1,"#11172b");
  x.fillStyle=bg; x.fillRect(0,0,1024,512);
  for(let i=0;i<28;i++){
    x.fillStyle=`rgba(127,252,255,${0.025+(i%4)*0.01})`;
    x.fillRect(40+i*36,60,10,390);
  }
  x.strokeStyle=color; x.lineWidth=12; x.strokeRect(24,24,976,464);
  x.strokeStyle="rgba(255,255,255,.18)"; x.lineWidth=3; x.strokeRect(54,54,916,404);
  x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle="#fff"; x.font="900 70px system-ui,Arial"; x.fillText(title.toUpperCase(),512,144);
  x.fillStyle=color; x.font="850 38px system-ui,Arial"; x.fillText(sub,512,272);
  x.fillStyle="#dfefff"; x.font="750 28px system-ui,Arial"; x.fillText(note,512,360);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function panel(root,name,title,sub,note,x,y,z,rotY,color,w=3.25,h=1.22){
  box(root,`${name}_FRAME`,w+.24,h+.24,.12,x,y,z,material(0x111622,0x02040a,.14,.62,.06),rotY);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({ map:makePanelTexture(title,sub,note,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name=name; p.position.set(x,y+.045,z); p.rotation.y=rotY; p.renderOrder=310; root.add(p); return p;
}
function addUpperColosseumArcade(root){
  const stone=material(STONE,0x100904,.12,.52,.10);
  const glass=basic(CYAN,.12);
  const archMat=glow(GOLD,.62);
  const rearZ=-14.15;
  for(let i=0;i<10;i++){
    const x=-16.2+i*3.6;
    box(root,`PHASE245_UPPER_ARCADE_BACK_WALL_${i}`,3.1,1.7,.16,x,5.65,rearZ,material(WALL,0x02040a,.10,.72,.03));
    const arch=new THREE.Mesh(new THREE.TorusGeometry(1.34,.040,10,96,Math.PI),archMat);
    arch.name=`PHASE245_UPPER_COLOSSEUM_ARCH_UPRIGHT_${i}`;
    arch.position.set(x,5.33,rearZ+.10);
    arch.rotation.z=Math.PI;
    root.add(arch);
    cyl(root,`PHASE245_UPPER_ARCH_LEFT_PILLAR_${i}`,.08,1.72,x-1.34,4.65,rearZ+.10,stone,20);
    cyl(root,`PHASE245_UPPER_ARCH_RIGHT_PILLAR_${i}`,.08,1.72,x+1.34,4.65,rearZ+.10,stone,20);
    box(root,`PHASE245_UPPER_ARCH_CITY_WINDOW_${i}`,2.12,.98,.04,x,5.05,rearZ+.13,glass);
  }
  [-18.6,18.6].forEach((x,side)=>{
    for(let i=0;i<5;i++){
      const z=-8.5+i*4.4;
      box(root,`PHASE245_${side?"RIGHT":"LEFT"}_UPPER_ARCADE_WALL_${i}`,.16,1.6,3.0,x,5.58,z,material(WALL,0x02040a,.10,.72,.03));
      const arch=new THREE.Mesh(new THREE.TorusGeometry(1.12,.035,10,82,Math.PI),archMat);
      arch.name=`PHASE245_${side?"RIGHT":"LEFT"}_UPPER_ARCH_UPRIGHT_${i}`;
      arch.position.set(x+(side?-0.08:0.08),5.27,z);
      arch.rotation.z=Math.PI;
      arch.rotation.y=side ? -Math.PI/2 : Math.PI/2;
      root.add(arch);
    }
  });
}
function addSkylineThroughWindows(root){
  const matDark=basic(0x05070d,.88);
  const lit=glow(CYAN,.22);
  for(let i=0;i<34;i++){
    const x=-20+i*1.25;
    const h=.7+((i*37)%9)*.22;
    box(root,`PHASE245_BACK_WINDOW_SKYLINE_TOWER_${i}`, .62,h,.06,x,4.85+h/2,-14.0,matDark);
    if(i%3===0) box(root,`PHASE245_BACK_WINDOW_SKYLINE_LIGHTS_${i}`,.34,.035,.065,x,5.05+h,-13.96,lit);
  }
}
function addWallTextureBands(root){
  const bandMat=basic(0x10192d,.82);
  box(root,"PHASE245_SOLID_BACK_WALL_TEXTURE_BAND",40,2.05,.08,0,2.05,-16.7,bandMat);
  box(root,"PHASE245_SOLID_LEFT_WALL_TEXTURE_BAND",.08,2.0,28,-20.15,2.0,1.3,bandMat);
  box(root,"PHASE245_SOLID_RIGHT_WALL_TEXTURE_BAND",.08,2.0,28,20.15,2.0,1.3,bandMat);
  for(let i=0;i<8;i++){
    box(root,`PHASE245_BACK_WALL_VERTICAL_GOLD_INLAY_${i}`,.045,2.2,.09,-17.5+i*5,2.25,-16.62,glow(GOLD,.28));
  }
}
function addOrganizedPortalLabels(root){
  panel(root,"PHASE245_REIKI_APPROVAL_PANEL","WELLNESS","Awaiting Approval","private Reiki room",-10.4,2.72,-8.82,0,"#a77cff",2.85,1.00);
  panel(root,"PHASE245_PGA_APPROVAL_PANEL","PGA HUB","Training Range","private golf scene",-4.85,2.72,-8.82,0,"#7ffcff",2.85,1.00);
  panel(root,"PHASE245_STORE_PANEL","SVR STORE","Storefront","web portal",4.85,2.72,-8.82,0,"#8dffb4",2.85,1.00);
  panel(root,"PHASE245_SCORPION_PANEL","SCORPION","Private Poker","city overlook",10.5,2.72,-8.82,0,"#ff5b8c",2.85,1.00);
}
function cleanDuplicates(scene){
  const removedRoots = removeNamed(scene,[
    "PHASE240_GRAND_PALACE_REFERENCE_ROOT",
    "PHASE238_ROMAN_CANOPY_LOBBY_ARCH_ROOT",
    "PHASE239_ROMAN_CANOPY_PILLAR_SMOOTHING_ROOT"
  ]);
  const celestialNames = [
    "PHASE200_SINGLE_VISIBLE_MOON_LOCKED",
    "PHASE200_SINGLE_VISIBLE_MARS_LOCKED",
    "PHASE240_REFERENCE_MOON_HIGH_VISIBLE",
    "PHASE240_REFERENCE_MOON_SOFT_HALO",
    "PHASE240_REFERENCE_MARS_HIGH_VISIBLE"
  ];
  const removedCelestial = removeNamed(scene, celestialNames);
  scene.traverse((obj)=>{
    if(/^PHASE200_.*JUMBOTRON_SLOT/.test(obj.name)) obj.visible=false;
    if(/^PHASE200_.*ARCH_BAY/.test(obj.name)) obj.visible=false;
    if(/^PHASE200_.*SIGN/.test(obj.name)) obj.visible=false;
    if(/^PHASE244_.*BLACK/.test(obj.name)) obj.visible=false;
  });
  return { removedRoots, removedCelestial };
}
function addSingleSkyObjects(root){
  const moon= new THREE.Mesh(new THREE.SphereGeometry(1.68,64,36),material(0xe8e3d7,0x2b3146,.22,.78,.02));
  moon.name="PHASE245_ONE_MOON_FINAL_HIGH_TEXTURED"; moon.position.set(-4.0,14.0,-24.8); root.add(moon);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(3.35,96),glow(0xf7fbff,.10));
  halo.name="PHASE245_ONE_MOON_HALO_FINAL"; halo.position.copy(moon.position); halo.lookAt(0,2.2,5.0); root.add(halo);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.54,40,24),material(0xb94f35,0x2a0905,.25,.84,.02));
  mars.name="PHASE245_ONE_MARS_FINAL_HIGH_TEXTURED"; mars.position.set(5.9,12.25,-27.8); root.add(mars);
  root.userData.phase245Planets={moon,mars,halo};
}
async function install(){
  const scene=await waitForScene();
  if(!scene) return;
  if(scene.getObjectByName("PHASE245_LOBBY_ORGANIZATION_TEXTURE_CLEANUP_ROOT")) return;
  const cleanup=cleanDuplicates(scene);
  const root=new THREE.Group(); root.name="PHASE245_LOBBY_ORGANIZATION_TEXTURE_CLEANUP_ROOT"; scene.add(root);
  addWallTextureBands(root);
  addUpperColosseumArcade(root);
  addSkylineThroughWindows(root);
  addOrganizedPortalLabels(root);
  addSingleSkyObjects(root);
  const clock=new THREE.Clock();
  function animate(){
    const dt=Math.min(clock.getDelta(),.033);
    const p=root.userData.phase245Planets;
    if(p?.moon) p.moon.rotation.y+=dt*.032;
    if(p?.mars) p.mars.rotation.y+=dt*.055;
    requestAnimationFrame(animate);
  }
  animate();
  window.SVR_PHASE245_ORGANIZATION_TEXTURE_CLEANUP={ build:BUILD, active:true, siteTouched:false, cleanup, fixes:["removed duplicate moon/mars", "removed phase240 duplicate root", "added upright upper colosseum arches", "added wall texture bands", "added skyline window silhouettes", "organized portal labels"], checkedAt:new Date().toISOString() };
}
install();
