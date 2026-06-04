import * as THREE from "three";

const BUILD = "PHASE-105-REIKI-OUTWARD-HOLOGRAM-ANDROID-LOCK";

function ctex(text, sub = "") {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#02080a"); g.addColorStop(.55,"#19042b"); g.addColorStop(1,"#031c19");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(145,255,240,.95)"; x.lineWidth = 10; x.strokeRect(22,22,c.width-44,c.height-44);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = "rgba(145,255,240,.7)"; x.shadowBlur = 22;
  x.fillStyle = "#fff"; x.font = "900 58px system-ui,Arial"; x.fillText(text,c.width/2,175,c.width-90);
  x.fillStyle = "#cafff8"; x.font = "800 32px system-ui,Arial"; String(sub).split("\n").forEach((s,i)=>x.fillText(s,c.width/2,270+i*48,c.width-90));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function mat(color, op=.8){ return new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}); }
function box(g,n,s,p,m){ const o=new THREE.Mesh(new THREE.BoxGeometry(...s),m); o.name=n; o.position.set(...p); g.add(o); return o; }
function plane(g,n,s,p,m,ry=0){ const o=new THREE.Mesh(new THREE.PlaneGeometry(...s),m); o.name=n; o.position.set(...p); o.rotation.y=ry; g.add(o); return o; }
function pole(g,x,z){ const silver=new THREE.MeshStandardMaterial({color:0xdcdcdc,metalness:.9,roughness:.18}); const p=new THREE.Group(); p.position.set(x,0,z); p.add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,1.12,20),silver)); p.children[0].position.y=.58; const cap=new THREE.Mesh(new THREE.SphereGeometry(.11,20,10),silver); cap.position.y=1.18; p.add(cap); g.add(p); return p.position; }
function rope(g,a,b){ const red=new THREE.MeshStandardMaterial({color:0xb4001f,emissive:0x5a0010,emissiveIntensity:.4}); const len=Math.hypot(b.x-a.x,b.z-a.z); const geo=new THREE.CylinderGeometry(.048,.048,len,18); geo.rotateZ(Math.PI/2); const r=new THREE.Mesh(geo,red); r.position.set((a.x+b.x)/2,1.08,(a.z+b.z)/2); r.rotation.y=Math.atan2(b.z-a.z,b.x-a.x); g.add(r); }
function plant(g,x,z){ const pg=new THREE.Group(); pg.position.set(x,0,z); const pot=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,.36,24),new THREE.MeshStandardMaterial({color:0x4a1518})); pot.position.y=.18; pg.add(pot); const lm=new THREE.MeshStandardMaterial({color:0x1d743b,emissive:0x062714,emissiveIntensity:.18,side:THREE.DoubleSide}); for(let i=0;i<8;i++){ const l=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),lm); l.scale.set(.55,2,.13); const a=i/8*Math.PI*2; l.position.set(Math.cos(a)*.13,.62+(i%3)*.06,Math.sin(a)*.13); l.rotation.set(.6,a,i%2?.35:-.35); pg.add(l);} g.add(pg); }
function videoMesh(scene){
  document.querySelectorAll("video").forEach(v=>{ if(String(v.src).includes("hologram")){try{v.pause();v.remove()}catch{}} });
  const m=new THREE.MeshBasicMaterial({map:ctex("REIKI HOLOGRAM","tap once to unlock audio\nsingle video player"),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.35,2.45),m); mesh.name="SVR_PHASE105_SINGLE_HOLOGRAM_VIDEO";
  const v=document.createElement("video"); v.src="/site/assets/video/reiki_hologram.mp4"; v.loop=true; v.muted=true; v.playsInline=true; v.preload="auto"; v.style.display="none"; v.volume=.5; document.body.appendChild(v);
  const unlock=()=>{v.muted=false;v.play().catch(()=>{})}; window.addEventListener("pointerdown",unlock,{passive:true}); window.addEventListener("touchstart",unlock,{passive:true});
  v.addEventListener("loadeddata",()=>v.play().catch(()=>{})); v.load(); const vt=new THREE.VideoTexture(v); vt.colorSpace=THREE.SRGBColorSpace;
  const cp=new THREE.Vector3(), mp=new THREE.Vector3(); mesh.userData.tick=()=>{ if(v.readyState>=2&&m.map!==vt){m.map=vt;m.needsUpdate=true} const cam=scene.userData._camera; if(cam?.getWorldPosition)cam.getWorldPosition(cp); mesh.getWorldPosition(mp); const d=cp.distanceTo(mp); v.volume=Math.max(.12,Math.min(.95,d<8?.5+((8-d)/6.7)*.45:.16)); };
  return mesh;
}
export function applyReikiPhase105Override(scene,{roomRadius=24,log=console.log}={}){
  if(!scene||scene.getObjectByName("SVR_PHASE105_OUTWARD_FINAL_LOCK"))return null;
  ["SVR_PHASE104_REIKI_EXPANDED_HOLOGRAM_RED_CARPET_LOCK","SVR_PHASE103_REIKI_EXPANDED_GLASS_STOREFRONT_LOCK","SVR_PHASE102_REIKI_FLUSH_GLASS_STOREFRONT_LOCK","SVR_UPDATE3_REIKI_ALIGNED_GLASS_PLANTS_PLANETS_LOCK"].forEach(n=>{const o=scene.getObjectByName(n); if(o?.parent)o.parent.remove(o)});
  const root=new THREE.Group(); root.name="SVR_PHASE105_OUTWARD_FINAL_LOCK"; root.position.set(roomRadius-4.05,.012,0); root.lookAt(root.position.clone().add(new THREE.Vector3(-1,0,0))); scene.add(root);
  const glass=new THREE.MeshStandardMaterial({color:0xa7fff7,transparent:true,opacity:.25,emissive:0x1b7d78,emissiveIntensity:.42,side:THREE.DoubleSide,depthWrite:false}); const wall=new THREE.MeshStandardMaterial({color:0x05090d,emissive:0x061318,emissiveIntensity:.24}); const trim=new THREE.MeshStandardMaterial({color:0xd2d8dd,metalness:.88,roughness:.18}); const carpet=new THREE.MeshStandardMaterial({color:0xa5001f,emissive:0x340008,emissiveIntensity:.3,side:THREE.DoubleSide});
  const W=18.2,H=7.25,front=-4.75,back=2.20,side=W/2,gap=4.6,gw=(W-gap)/2,lx=-(gap/2+gw/2),rx=(gap/2+gw/2),mid=(front+back)/2;
  box(root,"SVR_PHASE105_BACK_WALL",[W,H,.25],[0,H/2,back],wall); box(root,"SVR_PHASE105_LEFT_WALL",[.32,H,back-front],[-side,H/2,mid],trim); box(root,"SVR_PHASE105_RIGHT_WALL",[.32,H,back-front],[side,H/2,mid],trim); box(root,"SVR_PHASE105_TOP_HEADER",[W,.28,.44],[0,H-.18,front],trim); box(root,"SVR_PHASE105_BOTTOM_TRACK",[W,.10,.30],[0,.36,front],trim); box(root,"SVR_PHASE105_LEFT_POST",[.22,H-.6,.40],[-gap/2,H/2,front],trim); box(root,"SVR_PHASE105_RIGHT_POST",[.22,H-.6,.40],[gap/2,H/2,front],trim);
  plane(root,"SVR_PHASE105_FRONT_GLASS_LEFT",[gw,H-1.1],[lx,H/2+.08,front+.03],glass); plane(root,"SVR_PHASE105_FRONT_GLASS_RIGHT",[gw,H-1.1],[rx,H/2+.08,front+.03],glass.clone()); plane(root,"SVR_PHASE105_SIDE_GLASS_LEFT",[back-front,H-1.1],[-side+.04,H/2+.08,mid],glass.clone(),Math.PI/2); plane(root,"SVR_PHASE105_SIDE_GLASS_RIGHT",[back-front,H-1.1],[side-.04,H/2+.08,mid],glass.clone(),-Math.PI/2);
  plane(root,"SVR_PHASE105_CARPET",[6.1,13.2],[0,.02,-1.0],carpet,-Math.PI/2); const zs=[-4.35,-3.1,-1.85,-.6,.65,1.9]; const L=zs.map(z=>pole(root,-2.9,z)),R=zs.map(z=>pole(root,2.9,z)); for(let i=0;i<zs.length-1;i++){rope(root,L[i],L[i+1]);rope(root,R[i],R[i+1]);}
  [[-7.5,1.5],[7.5,1.5],[-6.5,-1.5],[6.5,-1.5],[-3.7,-4.25],[3.7,-4.25],[-3.5,-6.6],[3.5,-6.6]].forEach(([x,z])=>plant(root,x,z));
  plane(root,"SVR_PHASE105_SIGN",[5.7,1.22],[0,6.25,front+.12],new THREE.MeshBasicMaterial({map:ctex("REIKI / RIKI STOREFRONT","FINAL POLISH • HOLOGRAM HERE\nAWAITING APPROVAL"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  const holo=new THREE.Group(); holo.name="SVR_PHASE105_HOLOGRAM_HERE_FACING_CARPET"; holo.position.set(0,0,-4.95); holo.rotation.y=Math.PI; root.add(holo); const base=new THREE.Mesh(new THREE.CylinderGeometry(.85,1.32,.2,64),new THREE.MeshStandardMaterial({color:0x061315,emissive:0x0b8178,emissiveIntensity:.55,metalness:.84})); base.position.y=.62; holo.add(base); const beam=new THREE.Mesh(new THREE.CylinderGeometry(.24,.98,3.1,64,1,true),mat(0x8ffff0,.12)); beam.position.y=1.85; holo.add(beam); const vid=videoMesh(scene); vid.position.set(0,2.1,.16); holo.add(vid);
  const chak=new THREE.Group(); chak.name="SVR_PHASE105_VISIBLE_CHAKRA_SYMBOLS"; chak.position.set(0,4.4,2.05); root.add(chak); [0xff3148,0xff8a2d,0xffd447,0x36e875,0x38c9ff,0x7270ff,0xd696ff].forEach((col,i)=>{const d=new THREE.Mesh(new THREE.CircleGeometry(.52,48),mat(col,.8)); d.position.set(-5.4+i*1.8,0,.08); chak.add(d);});
  const old=scene.onBeforeRender; scene.onBeforeRender=function(...args){old?.apply(this,args); const t=performance.now(); vid.userData.tick?.(t);};
  window.SVR_PHASE105_REIKI_LOCK=BUILD; log?.("Phase 105 Reiki override loaded: outward expansion, hologram at requested red-carpet location, visible symbols."); return root;
}
