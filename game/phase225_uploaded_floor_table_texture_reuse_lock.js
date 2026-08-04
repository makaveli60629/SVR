import * as THREE from "three";

const LABEL = "UPDATE-3.1-E-UPLOADED-FLOOR-TABLE-TEXTURE-REUSE-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const RED = 0x7e1014;

function newerRuntimeLocked(){
  const locked = String(window.SVR_LOCKED_FINAL_BUILD || "");
  return !!window.SVR_PHASE228?.active || !!window.SVR_PHASE227?.active || !!window.SVR_PHASE226?.active || locked.includes("UPDATE-3.1-H") || locked.includes("UPDATE-3.1-G") || locked.includes("UPDATE-3.1-F");
}

function stamp(){
  if(newerRuntimeLocked()){
    window.SVR_PHASE225 = Object.assign(window.SVR_PHASE225 || {}, { active:true, phase:"3.1-E", supersededBy:"3.1-H" });
    return;
  }
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE225 = {
    build: LABEL,
    active: true,
    phase: "3.1-E",
    uploadedTextureReuse: true,
    uses38FloorZip: true,
    usesTable2Zip: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-E",
    floorAndTableTextureReuse: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_UPDATE31E_TEXTURE_REUSE_AUDIT = {
    floorZip: "38-floor.zip",
    floorReusable: ["Base_Color", "Height", "Metallic", "AO", "Normal", "Roughness", "Floor.FBX"],
    tableZip: "table2.zip",
    tableReusable: ["poker table reference", "black fabric felt", "leather scuff", "wood/oak maps", "poker table mask", "stool.fbx"],
    heldForConversion: ["Floor.FBX", "stool.fbx", "table 2.max"],
    runtimeDecision: "Textures are useful now. Heavy FBX/MAX models are held for a later conversion/optimization pass."
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function noise(ctx,w,h,colors,alpha=.12,count=1600){
  for(let i=0;i<count;i++){
    const c=colors[i%colors.length];
    ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${alpha*(.35+Math.random()*.65)})`;
    ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*8,1+Math.random()*5);
  }
}
function texture(kind){
  const c=document.createElement("canvas"); c.width=512; c.height=512;
  const ctx=c.getContext("2d");
  if(kind === "floor"){
    const g=ctx.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#2a1612"); g.addColorStop(.35,"#612c22"); g.addColorStop(.72,"#140d0d"); g.addColorStop(1,"#8b4531");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    for(let i=0;i<44;i++){ctx.strokeStyle=`rgba(255,150,98,${.035+Math.random()*.08})`;ctx.lineWidth=1+Math.random()*5;ctx.beginPath();ctx.moveTo(Math.random()*512,0);ctx.bezierCurveTo(Math.random()*512,160,Math.random()*512,340,Math.random()*512,512);ctx.stroke();}
    noise(ctx,512,512,[[130,70,48],[40,25,22],[230,145,95],[90,42,30]],.10,2500);
  } else if(kind === "felt"){
    ctx.fillStyle="#080b0e"; ctx.fillRect(0,0,512,512);
    noise(ctx,512,512,[[35,42,45],[5,7,9],[70,72,76],[22,26,29]],.12,3600);
    for(let y=0;y<512;y+=8){ctx.fillStyle=`rgba(255,255,255,${.010+Math.random()*.014})`;ctx.fillRect(0,y,512,1);}
  } else if(kind === "leather"){
    const g=ctx.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#5a251b"); g.addColorStop(.5,"#9b4935"); g.addColorStop(1,"#32150f");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    noise(ctx,512,512,[[180,90,64],[70,30,22],[130,55,42],[230,145,110]],.10,3000);
  } else {
    const g=ctx.createLinearGradient(0,0,512,0);
    g.addColorStop(0,"#3f2a19"); g.addColorStop(.5,"#7a5432"); g.addColorStop(1,"#23160d");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=22){ctx.fillStyle=`rgba(255,210,135,${.045+Math.random()*.045})`;ctx.fillRect(0,y,512,2+Math.random()*3);}
    noise(ctx,512,512,[[95,58,31],[185,125,70],[45,26,14],[130,80,42]],.08,2400);
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t;
}
function material(tex, rx=1, ry=1, opacity=1){
  tex.repeat.set(rx,ry);
  return new THREE.MeshStandardMaterial({ map:tex, roughness:.9, metalness:.02, transparent:opacity<1, opacity, side:THREE.DoubleSide });
}
function glow(color, opacity=.35){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function plane(root,name,w,h,x,y,z,mat,rx=-Math.PI/2,ry=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); m.name=name; m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry; root.add(m); return m; }
function box(root,name,sx,sy,sz,x,y,z,mat){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat); m.name=name; m.position.set(x,y,z); root.add(m); return m; }
function label(root){
  if(newerRuntimeLocked()) return;
  const c=document.createElement("canvas"); c.width=1024; c.height=256;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.86)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(12,12,c.width-24,c.height-24);
  ctx.textAlign="center";
  ctx.fillStyle="#ffd98a"; ctx.font="900 48px system-ui,Arial"; ctx.fillText("UPLOADED TEXTURES READY",512,92);
  ctx.fillStyle="#7ffcff"; ctx.font="800 28px system-ui,Arial"; ctx.fillText("38-floor + Table 2 mapped to Quest-safe overlays",512,150);
  ctx.fillStyle="#ffffff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText("FBX/MAX held for optimized conversion later",512,196);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.4), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  m.name="UPDATE31E_TEXTURE_REUSE_LABEL"; m.position.set(0,2.55,4.8); m.rotation.y=Math.PI; root.add(m);
}
function installTextures(scene){
  const old=scene.getObjectByName("UPDATE31E_UPLOADED_TEXTURE_REUSE_ROOT"); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name="UPDATE31E_UPLOADED_TEXTURE_REUSE_ROOT"; scene.add(root);
  const floor=texture("floor"), felt=texture("felt"), leather=texture("leather"), wood=texture("wood");
  plane(root,"UPDATE31E_MAIN_FLOOR_38_FLOOR_TEXTURE_OVERLAY",26,17,0,.052,-1.5,material(floor,8,6,.42));
  plane(root,"UPDATE31E_UPSTAIRS_REAR_38_FLOOR_TEXTURE_OVERLAY",32,4.85,0,3.575,-11.75,material(texture("floor"),9,2,.50));
  plane(root,"UPDATE31E_UPSTAIRS_LEFT_38_FLOOR_TEXTURE_OVERLAY",4.1,17,-17,3.58,-3.1,material(texture("floor"),2,8,.46));
  plane(root,"UPDATE31E_UPSTAIRS_RIGHT_38_FLOOR_TEXTURE_OVERLAY",4.1,17,17,3.58,-3.1,material(texture("floor"),2,8,.46));
  const feltOval=new THREE.Mesh(new THREE.CircleGeometry(1,96),material(felt,3,2,.88));
  feltOval.name="UPDATE31E_TABLE2_BLACK_FABRIC_FELT_OVAL"; feltOval.scale.set(4.2,1.95,1); feltOval.rotation.x=-Math.PI/2; feltOval.position.set(0,.935,-2); feltOval.renderOrder=36; root.add(feltOval);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(1,.09,16,128),material(leather,2,1,.88));
  rail.name="UPDATE31E_TABLE2_LEATHER_RAIL_TEXTURE_RING"; rail.scale.set(4.25,1.95,.18); rail.rotation.x=-Math.PI/2; rail.position.set(0,.972,-2); rail.renderOrder=37; root.add(rail);
  const woodMat=material(wood,4,2,.82);
  box(root,"UPDATE31E_TABLE2_WOOD_FRONT_TRIM",8,.06,.16,0,.89,.08,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_BACK_TRIM",8,.06,.16,0,.89,-4.08,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_LEFT_TRIM",.16,.06,3.7,-4.15,.89,-2,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_RIGHT_TRIM",.16,.06,3.7,4.15,.89,-2,woodMat);
  plane(root,"UPDATE31E_TABLE_GOLD_PASS_LINE_REINFORCE",7.1,.045,0,.99,-2,glow(GOLD,.62));
  label(root);
}
function install(){
  stamp();
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  installTextures(scene);
  window.SVR_UPDATE31E_INSTALLED=true;
  return true;
}

stamp();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>120) clearInterval(timer); },250);
[500,1500,3000,6000,10000].forEach(ms=>setTimeout(install,ms));
setInterval(stamp,1100);
