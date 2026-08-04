import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-183-ARCH-TOP-BLOCK-CONNECTION-LOCK";

function tex(w,h,draw){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d"); draw(ctx,w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function panelTex(title, line1, line2, color="#7ffcff"){
  return tex(1000,480,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#040814"); g.addColorStop(1,"#16051e");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.strokeStyle=color; ctx.lineWidth=12; ctx.strokeRect(24,24,w-48,h-48);
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle=color; ctx.font="900 62px system-ui,Arial"; ctx.fillText(title,w/2,150);
    ctx.fillStyle="#fff"; ctx.font="800 36px system-ui,Arial"; ctx.fillText(line1,w/2,255);
    ctx.fillStyle="#ffdf8a"; ctx.font="800 30px system-ui,Arial"; ctx.fillText(line2,w/2,335);
  });
}
function faceCenter(o,x,z,y){ o.position.set(x,y,z); o.lookAt(0,y,0); }
function addBillboard(root,name,title,line1,line2,x,z,y=2.55,color="#7ffcff"){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.68),new THREE.MeshBasicMaterial({map:panelTex(title,line1,line2,color),side:THREE.DoubleSide,transparent:true}));
  m.name=name; faceCenter(m,x,z,y); root.add(m); return m;
}
function addColumn(root,x,z){
  const group=new THREE.Group(); group.name="PHASE179_ROMAN_COLUMN";
  const stone=new THREE.MeshStandardMaterial({color:0xd8d0c2,roughness:.72,metalness:.03,emissive:0x16120d,emissiveIntensity:.08});
  const glow=new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.32});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.18,32),stone); base.position.y=.09; group.add(base);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.22,.25,2.75,32),stone); shaft.position.y=1.55; group.add(shaft);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.48,.36,.24,32),stone); top.position.y=3.0; group.add(top);
  const capital=new THREE.Mesh(new THREE.BoxGeometry(.74,.16,.48),stone); capital.name="PHASE183_COLUMN_CAPITAL_CONNECTOR_PLATE"; capital.position.y=3.16; capital.rotation.y=-Math.atan2(z,x); group.add(capital);
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(.29,.018,8,48),glow); ring1.rotation.x=Math.PI/2; ring1.position.y=.42; group.add(ring1);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(.29,.018,8,48),glow); ring2.rotation.x=Math.PI/2; ring2.position.y=2.72; group.add(ring2);
  group.position.set(x,0,z); root.add(group); return group;
}
function addConnectedBeam(root,x1,z1,x2,z2){
  const dx=x2-x1;
  const dz=z2-z1;
  const len=Math.hypot(dx,dz);
  const mx=(x1+x2)/2;
  const mz=(z1+z2)/2;
  const stone=new THREE.MeshStandardMaterial({color:0xd8d0c2,roughness:.74,metalness:.04,emissive:0x17120d,emissiveIntensity:.08});
  const beam=new THREE.Mesh(new THREE.BoxGeometry(len+.52,.24,.38),stone);
  beam.name="PHASE183_CONNECTED_ARCH_TOP_BEAM";
  beam.position.set(mx,3.22,mz);
  // Box length runs on local X. This rotation aligns the beam exactly between both column capitals.
  beam.rotation.y=-Math.atan2(dz,dx);
  root.add(beam);

  const trimMat=new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.36,blending:THREE.AdditiveBlending,depthWrite:false});
  const underGlow=new THREE.Mesh(new THREE.BoxGeometry(len+.42,.035,.44),trimMat);
  underGlow.name="PHASE183_CONNECTED_ARCH_UNDERGLOW";
  underGlow.position.set(mx,3.045,mz);
  underGlow.rotation.y=beam.rotation.y;
  root.add(underGlow);
  return beam;
}
function addArch(root,a,r){
  const x1=Math.cos(a-.20)*r, z1=Math.sin(a-.20)*r;
  const x2=Math.cos(a+.20)*r, z2=Math.sin(a+.20)*r;
  addColumn(root,x1,z1);
  addColumn(root,x2,z2);
  addConnectedBeam(root,x1,z1,x2,z2);
  const mx=(x1+x2)/2, mz=(z1+z2)/2;
  const glow=new THREE.Mesh(new THREE.TorusGeometry(1.06,.025,12,80),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.20,depthWrite:false}));
  glow.name="PHASE183_SOFT_CONNECTED_ARCH_GLOW"; glow.scale.y=.48; glow.position.set(mx,3.05,mz); glow.lookAt(0,3.05,0); root.add(glow);
}
function addMiniTable(root,idx,a,r){
  const g=new THREE.Group(); g.name=`PHASE179_TABLE_SELECTOR_${idx}`;
  const mat=new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.18});
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.045,32),mat); top.position.y=.65; g.add(top);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.018,8,48),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.72})); ring.rotation.x=Math.PI/2; ring.position.y=.67; g.add(ring);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.9,.3),new THREE.MeshBasicMaterial({map:panelTex(`T${idx}`,"OPEN","PINCH SELECT","#7ffcff"),transparent:true,side:THREE.DoubleSide})); label.position.y=1.08; g.add(label);
  g.position.set(Math.cos(a)*r,0,Math.sin(a)*r); g.lookAt(0,.7,0); root.add(g); return g;
}
export function installPhase179CenterpieceGuidance(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE179_CENTERPIECE_GUIDANCE_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE179_CENTERPIECE_GUIDANCE_ROOT";
  const pit=new THREE.Mesh(new THREE.CircleGeometry(4.45,72),new THREE.MeshBasicMaterial({color:0x05030a,transparent:true,opacity:.64,side:THREE.DoubleSide}));
  pit.name="PHASE179_RECESSED_CENTER_FLOOR"; pit.rotation.x=-Math.PI/2; pit.position.y=-.055; root.add(pit);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(4.55,.055,12,128),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.52}));
  rim.name="PHASE179_CENTER_RAIL_GLOW"; rim.rotation.x=Math.PI/2; rim.position.y=.18; root.add(rim);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(4.68,.035,12,128),new THREE.MeshStandardMaterial({color:0xd8d0c2,roughness:.55,metalness:.08}));
  rail.name="PHASE179_SOLID_SPECTATOR_RAIL"; rail.rotation.x=Math.PI/2; rail.position.y=.78; root.add(rail);
  for(let i=0;i<8;i++) addArch(root,i*Math.PI/4,4.98);
  addBillboard(root,"PHASE179_PLAY_GAME_SIGN","PLAY GAME","$50,000 STARTING BANK","DAILY BONUS + TABLE SELECT",0,5.75,2.8,"#8dffb4");
  addBillboard(root,"PHASE179_SCORPION_ROOM_SIGN","SCORPION ROOM","BIGGEST PRIVATE ROOM","VIP / FINAL EVENTS",-5.75,0,2.8,"#ff8aa0");
  addBillboard(root,"PHASE179_HANDS_FIRST_SIGN","HANDS FIRST","PINCH TO SELECT TABLE","CONTROLLERS AND ANDROID ADAPT",5.75,0,2.8,"#a77cff");
  for(let i=0;i<6;i++) addMiniTable(root,i+1,-Math.PI/2 + (i-2.5)*.22,2.15);
  const arrowMat=new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.46,side:THREE.DoubleSide});
  for(let i=0;i<5;i++){
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.22,.58,3),arrowMat); arrow.name=`PHASE179_WALK_TO_PLAY_ARROW_${i+1}`; arrow.rotation.x=-Math.PI/2; arrow.rotation.z=Math.PI; arrow.position.set(0,.05,7.4-i*.72); root.add(arrow);
  }
  root.userData.tick=(t)=>{ rim.rotation.z=t*.12; rail.rotation.z=-t*.035; };
  scene.add(root);
  window.SVR_PHASE179_CENTERPIECE={label:LABEL,locked:true,features:["lowered center floor","rail","roman columns","connected arch top beams","play sign","table selector holograms","scorpion room sign"],checkedAt:new Date().toISOString()};
  console.log("[Phase183] centerpiece arch top blocks aligned and connected");
  return root;
}
export function autoInstallPhase179CenterpieceGuidance(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase179CenterpieceGuidance(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
