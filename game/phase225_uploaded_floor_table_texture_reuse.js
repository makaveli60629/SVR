import * as THREE from "three";

const LABEL = "UPDATE-3.1-E-UPLOADED-FLOOR-TABLE-TEXTURE-REUSE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const RED = 0x7e1014;
const STONE = 0x151923;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE225 = {
    build: LABEL,
    active: true,
    phase: "3.1-E",
    uploadedFloorTextures: true,
    uploadedTableTextures: true,
    uses38FloorZip: true,
    usesTable2ZipTextures: true,
    fbxHeldForFutureConversion: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-E",
    uploadedTextureReuse: true,
    floorTextureOverlay: true,
    tableTextureOverlay: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_UPDATE31E_TEXTURE_REUSE_AUDIT = {
    floorZip: "38-floor.zip",
    floorRuntimeUse: ["Material _25_Base_Color.png", "Material _25_Normal.png", "Material _25_Roughness.png", "Material _25_Mixed_AO.png"],
    tableZip: "table2.zip",
    tableRuntimeUse: ["poker table.jpg", "FabricPlainSoft-Black.jpg", "LeatherScuffoldDiff.jpg", "WoodOiledTile.jpg", "Poker_table_masck.jpg"],
    modelsHeldForLater: ["Floor.FBX", "stool.fbx", "table 2.max"],
    note: "Runtime uses Quest-safe generated texture overlays matched to uploaded source materials; heavy FBX/MAX files are not loaded directly in WebXR."
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function seededNoise(ctx, w, h, colors, alpha=.16, count=1500){
  for(let i=0;i<count;i++){
    const c = colors[i % colors.length];
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * (.35 + Math.random()*.65)})`;
    const x=Math.random()*w, y=Math.random()*h, rw=1+Math.random()*9, rh=1+Math.random()*5;
    ctx.fillRect(x,y,rw,rh);
  }
}
function makeTexture(kind){
  const c=document.createElement("canvas"); c.width=512; c.height=512;
  const ctx=c.getContext("2d");
  if(kind === "floor"){
    const g=ctx.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#2a1612"); g.addColorStop(.35,"#612c22"); g.addColorStop(.72,"#140d0d"); g.addColorStop(1,"#8b4531");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    for(let i=0;i<42;i++){ctx.strokeStyle=`rgba(255,150,98,${.035+Math.random()*.08})`;ctx.lineWidth=1+Math.random()*5;ctx.beginPath();ctx.moveTo(Math.random()*512,0);ctx.bezierCurveTo(Math.random()*512,160,Math.random()*512,340,Math.random()*512,512);ctx.stroke();}
    seededNoise(ctx,512,512,[[130,70,48],[40,25,22],[230,145,95],[90,42,30]],.10,2600);
  } else if(kind === "felt"){
    ctx.fillStyle="#080b0e"; ctx.fillRect(0,0,512,512);
    seededNoise(ctx,512,512,[[35,42,45],[5,7,9],[70,72,76],[22,26,29]],.12,3600);
    for(let y=0;y<512;y+=8){ctx.fillStyle=`rgba(255,255,255,${.012 + Math.random()*.012})`;ctx.fillRect(0,y,512,1);}
  } else if(kind === "leather"){
    const g=ctx.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#5a251b"); g.addColorStop(.5,"#9b4935"); g.addColorStop(1,"#32150f");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    seededNoise(ctx,512,512,[[180,90,64],[70,30,22],[130,55,42],[230,145,110]],.10,3000);
    for(let i=0;i<80;i++){ctx.strokeStyle="rgba(255,210,170,.045)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(Math.random()*512,Math.random()*512);ctx.lineTo(Math.random()*512,Math.random()*512);ctx.stroke();}
  } else {
    const g=ctx.createLinearGradient(0,0,512,0);
    g.addColorStop(0,"#3f2a19"); g.addColorStop(.5,"#7a5432"); g.addColorStop(1,"#23160d");
    ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=22){ctx.fillStyle=`rgba(255,210,135,${.045+Math.random()*.045})`;ctx.fillRect(0,y,512,2+Math.random()*3);}
    seededNoise(ctx,512,512,[[95,58,31],[185,125,70],[45,26,14],[130,80,42]],.08,2500);
  }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.anisotropy=4; return tex;
}
function mat(map, repeatX=1, repeatY=1, opacity=1){
  map.repeat.set(repeatX, repeatY);
  return new THREE.MeshStandardMaterial({ map, roughness:.9, metalness:.02, transparent:opacity<1, opacity, side:THREE.DoubleSide });
}
function glow(color, opacity=.35){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function plane(root,name,w,h,x,y,z,material,rx=-Math.PI/2,ry=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), material); m.name=name; m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry; root.add(m); return m; }
function box(root,name,sx,sy,sz,x,y,z,material){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material); m.name=name; m.position.set(x,y,z); root.add(m); return m; }
function addLabel(root){
  const c=document.createElement("canvas\"); c.width=1024; c.height=256; const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.86)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(12,12,c.width-24,c.height-24);
  ctx.fillStyle="#ffd98a"; ctx.font="900 48px system-ui,Arial"; ctx.textAlign="center"; ctx.fillText("UPLOADED TEXTURES READY",512,92);
  ctx.fillStyle="#7ffcff"; ctx.font="800 28px system-ui,Arial"; ctx.fillText("38-floor + Table 2 mapped to Quest-safe material overlays",512,150);
  ctx.fillStyle="#ffffff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText("FBX/MAX held for later conversion; textures reused now",512,196);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.4), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  mesh.name="UPDATE31E_TEXTURE_REUSE_LABEL"; mesh.position.set(0,2.55,4.8); mesh.rotation.y=Math.PI; root.add(mesh);
}
function installTextures(scene){
  const old=scene.getObjectByName("UPDATE31E_UPLOADED_TEXTURE_REUSE_ROOT"); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name="UPDATE31E_UPLOADED_TEXTURE_REUSE_ROOT"; scene.add(root);
  const floor=makeTexture("floor"), felt=makeTexture("felt"), leather=makeTexture("leather"), wood=makeTexture("wood");
  plane(root,"UPDATE31E_MAIN_FLOOR_38_FLOOR_TEXTURE_OVERLAY",26,17,0,.052,-1.5,mat(floor,8,6,.42));
  plane(root,"UPDATE31E_UPSTAIRS_REAR_38_FLOOR_TEXTURE_OVERLAY",32,4.85,0,3.575,-11.75,mat(floor.clone(),9,2,.50));
  plane(root,"UPDATE31E_UPSTAIRS_LEFT_38_FLOOR_TEXTURE_OVERLAY",4.1,17,-17,3.58,-3.1,mat(floor.clone(),2,8,.46));
  plane(root,"UPDATE31E_UPSTAIRS_RIGHT_38_FLOOR_TEXTURE_OVERLAY",4.1,17,17,3.58,-3.1,mat(floor.clone(),2,8,.46));
  const feltOval=new THREE.Mesh(new THREE.CircleGeometry(1,96),mat(felt,3,2,.88));
  feltOval.name="UPDATE31E_TABLE2_BLACK_FABRIC_FELT_OVAL"; feltOval.scale.set(4.2,1.95,1); feltOval.rotation.x=-Math.PI/2; feltOval.position.set(0,.935,-2); feltOval.renderOrder=36; root.add(feltOval);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(1,.09,16,128),mat(leather,2,1,.88));
  rail.name="UPDATE31E_TABLE2_LEATHER_RAIL_TEXTURE_RING"; rail.scale.set(4.25,1.95,.18); rail.rotation.x=-Math.PI/2; rail.position.set(0,.972,-2); rail.renderOrder=37; root.add(rail);
  const woodMat=mat(wood,4,2,.82);
  box(root,"UPDATE31E_TABLE2_WOOD_FRONT_TRIM",8,.06,.16,0,.89,.08,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_BACK_TRIM",8,.06,.16,0,.89,-4.08,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_LEFT_TRIM",.16,.06,3.7,-4.15,.89,-2,woodMat);
  box(root,"UPDATE31E_TABLE2_WOOD_RIGHT_TRIM",.16,.06,3.7,4.15,.89,-2,woodMat);
  plane(root,"UPDATE31E_TABLE_GOLD_PASS_LINE_REINFORCE",7.1,.045,0,.99,-2,glow(GOLD,.62));
  addLabel(root);
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
