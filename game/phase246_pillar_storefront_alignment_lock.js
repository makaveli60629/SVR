import * as THREE from "three";

const BUILD = "PHASE-246-PILLAR-STOREFRONT-ALIGNMENT-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const PINK = 0xff5b8c;
const GREEN = 0x8dffb4;
const STONE = 0xd8ccb4;
const WALL = 0x090d18;

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
function std(color, emissive=0x000000, emissiveIntensity=.05, rough=.62, metal=.06){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness:rough, metalness:metal });
}
function basic(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, side:THREE.DoubleSide, depthWrite:opacity>.35 });
}
function glow(color, opacity=.45){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function box(root,name,sx,sy,sz,x,y,z,mat,rotY=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  m.name=name; m.position.set(x,y,z); m.rotation.y=rotY; root.add(m); return m;
}
function cyl(root,name,r,h,x,y,z,mat,seg=36){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat);
  m.name=name; m.position.set(x,y,z); root.add(m); return m;
}
function tex(title,sub,note,color){
  const c=document.createElement("canvas"); c.width=1024; c.height=512;
  const g=c.getContext("2d");
  const bg=g.createLinearGradient(0,0,1024,512);
  bg.addColorStop(0,"#050713"); bg.addColorStop(.55,"#0b1526"); bg.addColorStop(1,"#090b16");
  g.fillStyle=bg; g.fillRect(0,0,1024,512);
  g.fillStyle="rgba(255,255,255,.04)"; g.fillRect(62,54,900,88);
  g.strokeStyle=color; g.lineWidth=12; g.strokeRect(24,24,976,464);
  g.strokeStyle="rgba(255,255,255,.18)"; g.lineWidth=3; g.strokeRect(58,58,908,396);
  g.textAlign="center"; g.textBaseline="middle";
  g.fillStyle="#fff"; g.font="900 66px system-ui,Arial"; g.fillText(title.toUpperCase(),512,142);
  g.fillStyle=color; g.font="850 36px system-ui,Arial"; g.fillText(sub,512,270);
  g.fillStyle="#dcefff"; g.font="750 28px system-ui,Arial"; g.fillText(note,512,354);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function panel(root,name,title,sub,note,x,y,z,rotY,color,w=3.25,h=1.16){
  box(root,`${name}_BACKING`,w+.28,h+.28,.12,x,y,z,std(0x101521,0x02050b,.13,.58,.06),rotY);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({ map:tex(title,sub,note,color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name=name; p.position.set(x,y+.045,z); p.rotation.y=rotY; p.renderOrder=340; root.add(p); return p;
}
function hideJumbledColumns(scene){
  const patterns = [
    /^PHASE244_MAIN_CANOPY_COLUMN_/,
    /^PHASE244_MAIN_CANOPY_COLUMN_BASE_/,
    /^PHASE244_REAR_FINISHED_COLUMN_/,
    /^PHASE244_REAR_COLUMN_BASE_/,
    /^PHASE244_REAR_COLUMN_CAP_/,
    /^PHASE244_LEFT_SIDE_COLUMN_/,
    /^PHASE244_RIGHT_SIDE_COLUMN_/,
    /^PHASE244_LEFT_SIDE_COLUMN_CAP_/,
    /^PHASE244_RIGHT_SIDE_COLUMN_CAP_/
  ];
  let hidden=0;
  scene.traverse((obj)=>{
    if(patterns.some(r=>r.test(obj.name))){ obj.visible=false; hidden++; }
  });
  return hidden;
}
function hideBlackPlaceholderPanels(scene){
  let hidden=0;
  scene.traverse((obj)=>{
    if(/^PHASE244_.*_SOLID_FRAME$/.test(obj.name) || /^PHASE244_.*_BACKING$/.test(obj.name)){
      obj.visible=false; hidden++;
    }
  });
  return hidden;
}
function addCleanColumnSystem(root){
  const stone=std(STONE,0x130b04,.14,.50,.10);
  const rear=[-15,-10,-5,0,5,10,15];
  rear.forEach((x,i)=>{
    cyl(root,`PHASE246_REAR_CLEAN_COLUMN_${i}`,0.30,5.65,x,3.08,-15.35,stone,44);
    cyl(root,`PHASE246_REAR_CLEAN_BASE_${i}`,0.50,.28,x,.14,-15.35,stone,44);
    box(root,`PHASE246_REAR_CLEAN_CAP_${i}`,1.05,.22,.70,x,5.96,-15.35,stone);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.015,8,44),glow(GOLD,.38)); ring.name=`PHASE246_REAR_COLUMN_GOLD_RING_${i}`; ring.rotation.x=Math.PI/2; ring.position.set(x,5.45,-15.35); root.add(ring);
  });
  [-17.7,17.7].forEach((x,side)=>{
    [-10,-5,0,5,10].forEach((z,i)=>{
      cyl(root,`PHASE246_${side?"RIGHT":"LEFT"}_SIDE_CLEAN_COLUMN_${i}`,0.28,5.15,x,2.84,z,stone,40);
      cyl(root,`PHASE246_${side?"RIGHT":"LEFT"}_SIDE_CLEAN_BASE_${i}`,0.46,.24,x,.12,z,stone,40);
      box(root,`PHASE246_${side?"RIGHT":"LEFT"}_SIDE_CLEAN_CAP_${i}`,.96,.20,.64,x,5.48,z,stone);
    });
  });
  [[-3.65,-1.35],[3.65,-1.35],[-3.65,2.20],[3.65,2.20]].forEach(([x,z],i)=>{
    cyl(root,`PHASE246_CENTER_CANOPY_CLEAN_COLUMN_${i}`,0.25,4.35,x,2.24,z,stone,44);
    cyl(root,`PHASE246_CENTER_CANOPY_CLEAN_BASE_${i}`,0.42,.24,x,.12,z,stone,44);
  });
  box(root,"PHASE246_CENTER_CANOPY_FRONT_CLEAN_BEAM",8.1,.16,.20,0,4.55,2.20,stone);
  box(root,"PHASE246_CENTER_CANOPY_BACK_CLEAN_BEAM",8.1,.16,.20,0,4.55,-1.35,stone);
  box(root,"PHASE246_CENTER_CANOPY_LEFT_CLEAN_BEAM",.20,.16,3.75,-3.65,4.55,.42,stone);
  box(root,"PHASE246_CENTER_CANOPY_RIGHT_CLEAN_BEAM",.20,.16,3.75,3.65,4.55,.42,stone);
}
function addAlignedStorefrontRow(root){
  const z=-9.55;
  const y=1.78;
  const data=[
    [-12.8,"WELLNESS","Awaiting Approval","private Reiki scene",PURPLE],
    [-6.4,"PGA HUB","Practice Range","private golf scene",CYAN],
    [0,"PLAY GAME","Choose Table","main poker table",GOLD],
    [6.4,"SVR STORE","Storefront","web store portal",GREEN],
    [12.8,"SCORPION","Private Poker","city overlook room",PINK]
  ];
  data.forEach(([x,title,sub,note,color])=>{
    box(root,`PHASE246_${title.replaceAll(" ","_")}_ALIGNED_STORE_BAY`,4.35,2.75,.18,x,1.72,z-.06,std(WALL,0x03050b,.12,.72,.03));
    panel(root,`PHASE246_${title.replaceAll(" ","_")}_ALIGNED_PANEL`,title,sub,note,x,y,z,0,"#"+color.toString(16).padStart(6,"0"),3.45,1.18);
    const pad=new THREE.Mesh(new THREE.RingGeometry(.78,1.0,80),glow(color,.55));
    pad.name=`PHASE246_${title.replaceAll(" ","_")}_ALIGNED_PORTAL_PAD`; pad.rotation.x=-Math.PI/2; pad.position.set(x,.09,z+1.65); root.add(pad);
    box(root,`PHASE246_${title.replaceAll(" ","_")}_LOW_GOLD_STEP`,3.6,.08,.30,x,.10,z+1.08,glow(GOLD,.30));
  });
  box(root,"PHASE246_STOREFRONT_ROW_TOP_GOLD_LOCK",31.5,.07,.09,0,3.24,z,glow(GOLD,.55));
  box(root,"PHASE246_STOREFRONT_ROW_BOTTOM_CYAN_LOCK",31.5,.06,.09,0,.47,z,glow(CYAN,.35));
}
function addReadableUpperArches(root){
  const archMat=glow(GOLD,.58);
  for(let i=0;i<9;i++){
    const x=-14.4+i*3.6;
    const arch=new THREE.Mesh(new THREE.TorusGeometry(1.18,.035,10,88,Math.PI),archMat);
    arch.name=`PHASE246_TOP_UPRIGHT_COLOSSEUM_ARCH_${i}`;
    arch.position.set(x,5.98,-14.95);
    arch.rotation.z=Math.PI;
    root.add(arch);
    box(root,`PHASE246_TOP_ARCH_DARK_WINDOW_${i}`,1.75,.88,.035,x,5.67,-14.90,basic(0x03060e,.76));
  }
}
function installMetadata(cleanup){
  const label=document.getElementById("svr-phase-label");
  if(label) label.textContent="PHASE 246 ACTIVE • PILLAR/STOREFRONT ALIGNMENT";
  const status=document.getElementById("status");
  if(status) status.textContent="Phase 246 alignment cleanup active";
  window.SVR_PHASE246_ALIGNMENT_LOCK={ build:BUILD, active:true, siteTouched:false, cleanup, fixes:["hid jumbled older pillar sets", "replaced center canopy columns with cleaner spacing", "aligned storefront row", "added clear portal pads", "added upright top arches", "reduced black placeholder backing visibility"], checkedAt:new Date().toISOString() };
  window.SVR_LOCKED_FINAL_BUILD=BUILD;
}
async function install(){
  const scene=await waitForScene();
  if(!scene) return;
  if(scene.getObjectByName("PHASE246_PILLAR_STOREFRONT_ALIGNMENT_ROOT")) return;
  const cleanup={ hiddenColumns:hideJumbledColumns(scene), hiddenPlaceholders:hideBlackPlaceholderPanels(scene) };
  const root=new THREE.Group(); root.name="PHASE246_PILLAR_STOREFRONT_ALIGNMENT_ROOT"; scene.add(root);
  addCleanColumnSystem(root);
  addAlignedStorefrontRow(root);
  addReadableUpperArches(root);
  installMetadata(cleanup);
}
install();
