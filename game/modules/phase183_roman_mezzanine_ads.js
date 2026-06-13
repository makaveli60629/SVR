import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-183-ROMAN-MEZZANINE-ADS-LOCK";
const TIERS = [
  { tier:1, name:"TIER 1 PREMIUM", color:"#ffdf8a", w:4.8, h:1.35, y:4.72, r:12.05, slots:[0,2,4,6], slides:["SVR MAIN EVENT","PREMIUM SPONSOR","FINAL TABLE LIVE"] },
  { tier:2, name:"TIER 2 STANDARD", color:"#7ffcff", w:3.2, h:0.92, y:3.68, r:12.12, slots:[1,3,5,7], slides:["EVENTS","STORE HUB","COMMUNITY GOALS"] },
  { tier:3, name:"TIER 3 BASIC", color:"#a77cff", w:1.65, h:0.52, y:2.82, r:12.18, slots:[.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5], slides:["DAILY BONUS","FREEROLL","MEMBERSHIP"] }
];
function makeSlideTexture(unit, slideIndex=0){
  const c=document.createElement("canvas"); c.width=1200; c.height=520;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#050914"); g.addColorStop(1,"#1a071f");
  ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=unit.color; ctx.lineWidth=16; ctx.strokeRect(30,30,c.width-60,c.height-60);
  ctx.fillStyle="rgba(255,255,255,.08)"; ctx.fillRect(52,54,c.width-104,86);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle=unit.color; ctx.font="900 54px system-ui,Arial"; ctx.fillText(unit.name,c.width/2,96);
  ctx.fillStyle="#ffffff"; ctx.font="900 78px system-ui,Arial"; ctx.fillText(unit.slides[slideIndex%unit.slides.length],c.width/2,245);
  ctx.fillStyle="#ffdf8a"; ctx.font="800 34px system-ui,Arial"; ctx.fillText(`AUTO SLIDE ${slideIndex+1} / ${unit.slides.length}`,c.width/2,345);
  ctx.fillStyle="#dffcff"; ctx.font="700 28px system-ui,Arial"; ctx.fillText("PASSIVE AD DISPLAY • NO TOUCH",c.width/2,420);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function faceCenter(obj, angle, radius, y){
  obj.position.set(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
  obj.lookAt(0,y-.15,0);
}
function addWallBand(root){
  const wallMat=new THREE.MeshStandardMaterial({color:0x17130f,roughness:.78,metalness:.04,emissive:0x060303,emissiveIntensity:.18});
  const trimMat=new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.32});
  const r=13.25, side=2*r*Math.tan(Math.PI/8)+.28;
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4+Math.PI/8;
    const upper=new THREE.Mesh(new THREE.BoxGeometry(side,2.15,.42),wallMat);
    upper.name=`PHASE183_RAISED_ROMAN_WALL_${i+1}`; faceCenter(upper,a,r,5.25); upper.rotation.y+=Math.PI/2; root.add(upper);
    const cornice=new THREE.Mesh(new THREE.BoxGeometry(side+.14,.12,.18),trimMat);
    cornice.name=`PHASE183_GOLD_CORNICE_${i+1}`; faceCenter(cornice,a,r-.04,6.36); cornice.rotation.y+=Math.PI/2; root.add(cornice);
    const lower=new THREE.Mesh(new THREE.BoxGeometry(side+.1,.09,.16),trimMat);
    lower.name=`PHASE183_MEDIA_BAND_TRIM_${i+1}`; faceCenter(lower,a,r-.04,3.12); lower.rotation.y+=Math.PI/2; root.add(lower);
  }
}
function addMezzanine(root){
  const stone=new THREE.MeshStandardMaterial({color:0xd8d0c2,roughness:.72,metalness:.05,emissive:0x14100a,emissiveIntensity:.06});
  const glow=new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.18,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(11.95,.12,12,160),stone);
  ring.name="PHASE183_UPPER_WALKWAY_RING"; ring.rotation.x=Math.PI/2; ring.position.y=3.18; root.add(ring);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(10.45,.055,12,160),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.36}));
  inner.name="PHASE183_ROMAN_BANISTER_INNER_RAIL"; inner.rotation.x=Math.PI/2; inner.position.y=3.72; root.add(inner);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(12.75,.06,12,160),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.30}));
  outer.name="PHASE183_ROMAN_BANISTER_OUTER_RAIL"; outer.rotation.x=Math.PI/2; outer.position.y=3.72; root.add(outer);
  for(let i=0;i<32;i++){
    const a=i*Math.PI*2/32;
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.58,12),stone);
    post.name=`PHASE183_BANISTER_POST_${i+1}`; post.position.set(Math.cos(a)*10.8,3.48,Math.sin(a)*10.8); root.add(post);
  }
  const under=new THREE.Mesh(new THREE.TorusGeometry(11.15,.035,12,160),glow);
  under.name="PHASE183_MEZZANINE_UNDERGLOW"; under.rotation.x=Math.PI/2; under.position.y=3.02; root.add(under);
}
function addAdUnit(root, unit, slot, index){
  const angle=slot*Math.PI/4;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(unit.w,unit.h),new THREE.MeshBasicMaterial({map:makeSlideTexture(unit,0),side:THREE.DoubleSide,transparent:true}));
  mesh.name=`PHASE183_TIER_${unit.tier}_AD_UNIT_${index+1}`;
  mesh.userData.unit=unit; mesh.userData.slide=0; mesh.userData.lastSlide=0;
  faceCenter(mesh,angle,unit.r,unit.y);
  root.add(mesh); return mesh;
}
function addStorefronts(root){
  const labels=["MEMBERSHIP","EVENTS","VIP LOUNGE","PARTNER SHOP","CHARITY","TRAINING","SUPPORT","NEWS"];
  labels.forEach((txt,i)=>{
    const c=document.createElement("canvas"); c.width=700; c.height=260; const ctx=c.getContext("2d");
    ctx.fillStyle="#070b14"; ctx.fillRect(0,0,c.width,c.height); ctx.strokeStyle="#ffdf8a"; ctx.lineWidth=8; ctx.strokeRect(18,18,c.width-36,c.height-36);
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#fff"; ctx.font="900 45px system-ui,Arial"; ctx.fillText(txt,c.width/2,115); ctx.fillStyle="#7ffcff"; ctx.font="800 24px system-ui,Arial"; ctx.fillText("UPPER STOREFRONT",c.width/2,178);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.78),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,transparent:true}));
    m.name=`PHASE183_UPPER_STOREFRONT_${txt.replace(/\s+/g,"_")}`;
    faceCenter(m,i*Math.PI/4+Math.PI/8,11.35,4.0); root.add(m);
  });
}
export function installPhase183RomanMezzanineAds(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE183_ROMAN_MEZZANINE_ADS_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE183_ROMAN_MEZZANINE_ADS_ROOT";
  addWallBand(root); addMezzanine(root); addStorefronts(root);
  const adMeshes=[];
  TIERS.forEach(unit=>unit.slots.forEach((slot,i)=>adMeshes.push(addAdUnit(root,unit,slot,i))));
  root.userData.tick=(t)=>{
    adMeshes.forEach(mesh=>{
      const unit=mesh.userData.unit;
      const next=Math.floor(t/5)%unit.slides.length;
      if(next!==mesh.userData.slide){
        mesh.userData.slide=next; mesh.material.map?.dispose?.(); mesh.material.map=makeSlideTexture(unit,next); mesh.material.needsUpdate=true;
      }
    });
  };
  scene.add(root);
  window.SVR_PHASE183_MEZZANINE_ADS={label:LABEL,locked:true,raisedWall:true,mezzanine:true,adUnits:adMeshes.length,tiers:[1,2,3],slideSeconds:5,theme:"Roman luxury media ring",checkedAt:new Date().toISOString()};
  console.log("[Phase183] Roman mezzanine ads active");
  return root;
}
export function autoInstallPhase183RomanMezzanineAds(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase183RomanMezzanineAds(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
