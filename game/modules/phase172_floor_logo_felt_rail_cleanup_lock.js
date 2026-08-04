import * as THREE from "three";

const LABEL = "PHASE-174-TABLE-FELT-LEATHER-FLOOR-LOGO-ALIGNMENT-LOCK";
const FELT_ROOT = "PHASE174_TABLE_FELT_LEATHER_ALIGNMENT_LOCK";
const FLOOR_LOGO_ROOT = "PHASE174_LOBBY_FLOOR_LOGO_LOCK";
const SAFE_FBX_NAMES = ["PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT","PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"];
const OLD_SURFACES = ["PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK","PHASE168_TABLE_SURFACE_FELT_LEATHER_HANDREST_LOCK","PHASE172_TABLE_FELT_FIT_LOCK"];
const KEEP_RE = /PHASE17[0-9]|PHASE168|CARD|CHIP|POT|DEALER|BUTTON|FBX|FELT|LOGO|PASS|LEATHER|HAND|WATCH|TELEPORT|CAMERA|LIGHT|MOON|MARS|STAR/i;
const REMOVE_RE = /rope|rail|stanchion|barrier|queue|post|velvet|guard/i;
let scene=null, logoPromise=null, state=null;
function sceneRoot(s){return s?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT")||s;}
function findFbx(root){for(const n of SAFE_FBX_NAMES){const o=root?.getObjectByName?.(n); if(o)return o;} return null;}
function rec(root){
 const f=findFbx(root); if(!f)return null; f.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(f); if(!Number.isFinite(box.max.y))return null;
 const size=new THREE.Vector3(), center=new THREE.Vector3(); box.getSize(size); box.getCenter(center);
 const q=new THREE.Quaternion(); f.getWorldQuaternion(q); const e=new THREE.Euler().setFromQuaternion(q,"YXZ");
 return {fbx:f,box,size,center,y:box.max.y+.045,yaw:e.y};
}
function removeNamed(root,n){const o=root?.getObjectByName?.(n); if(o)o.parent?.remove(o);}
function purgeOld(root){let c=0; for(const n of OLD_SURFACES){const o=root?.getObjectByName?.(n); if(o){o.parent?.remove(o); c++;}} removeNamed(root,FELT_ROOT); removeNamed(root,FLOOR_LOGO_ROOT); return c;}
function loadImage(url){return new Promise(r=>{const i=new Image(); i.crossOrigin="anonymous"; i.onload=()=>r(i); i.onerror=()=>r(null); i.src=url;});}
async function loadLogo(){if(logoPromise)return logoPromise; logoPromise=(async()=>{for(const u of ["/logo.png","/logo.webp","./assets/ui/logo.png","./ui/logo.png"]){const img=await loadImage(u); if(img)return {img,url:u};} return null;})(); return logoPromise;}
function feltTexture(logo){
 const c=document.createElement("canvas"); c.width=2048; c.height=1024; const x=c.getContext("2d"),cx=1024,cy=512,rx=995,ry=466;
 x.clearRect(0,0,c.width,c.height); x.save(); x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.clip();
 const g=x.createRadialGradient(cx,cy,25,cx,cy,rx); g.addColorStop(0,"#0e5d36"); g.addColorStop(.58,"#06371f"); g.addColorStop(1,"#01120a"); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
 x.globalAlpha=.10; for(let i=0;i<9000;i++){x.fillStyle=Math.random()>.55?"#d0ffe0":"#001209"; x.fillRect(Math.random()*2048,Math.random()*1024,1+Math.random()*2,1);} x.globalAlpha=1;
 x.strokeStyle="rgba(255,255,255,.70)"; x.lineWidth=5; x.beginPath(); x.ellipse(cx,cy,rx*.70,ry*.62,0,0,Math.PI*2); x.stroke();
 x.setLineDash([38,20]); x.strokeStyle="rgba(255,255,255,.38)"; x.lineWidth=7; x.beginPath(); x.ellipse(cx,cy,rx*.80,ry*.71,0,0,Math.PI*2); x.stroke(); x.setLineDash([]);
 x.strokeStyle="rgba(238,191,92,.92)"; x.lineWidth=11; x.beginPath(); x.ellipse(cx,cy,rx*.90,ry*.82,0,0,Math.PI*2); x.stroke();
 x.fillStyle="rgba(238,191,92,.96)"; x.font="900 42px system-ui,Arial"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("PASS LINE",cx,cy-ry*.69); x.fillText("PASS LINE",cx,cy+ry*.69);
 if(logo?.img){const s=280; x.globalAlpha=.93; x.drawImage(logo.img,cx-s/2,cy-s/2,s,s); x.globalAlpha=1;} else {x.fillStyle="#7ffcff"; x.font="900 96px system-ui"; x.fillText("SVR",cx,cy-18); x.fillStyle="#eebf5c"; x.font="900 40px system-ui"; x.fillText("POKER",cx,cy+64);}
 x.restore(); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function logoTexture(logo){
 const c=document.createElement("canvas"); c.width=c.height=1024; const x=c.getContext("2d"),cx=512,cy=512;
 x.clearRect(0,0,1024,1024); const g=x.createRadialGradient(cx,cy,50,cx,cy,505); g.addColorStop(0,"rgba(127,252,255,.25)"); g.addColorStop(.6,"rgba(95,40,180,.18)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,1024,1024);
 x.strokeStyle="rgba(127,252,255,.78)"; x.lineWidth=14; x.beginPath(); x.arc(cx,cy,438,0,Math.PI*2); x.stroke();
 if(logo?.img){const s=540; x.globalAlpha=.94; x.drawImage(logo.img,cx-s/2,cy-s/2,s,s); x.globalAlpha=1;} else {x.fillStyle="#7ffcff"; x.font="900 170px system-ui"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("SVR",cx,cy-35); x.fillStyle="#eebf5c"; x.font="900 70px system-ui"; x.fillText("POKER",cx,cy+92);}
 const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function ringGeometry(outerX,outerZ,innerX,innerZ){const s=new THREE.Shape(); s.absellipse(0,0,outerX/2,outerZ/2,0,Math.PI*2,false,0); const h=new THREE.Path(); h.absellipse(0,0,innerX/2,innerZ/2,0,Math.PI*2,true,0); s.holes.push(h); return new THREE.ShapeGeometry(s,160);}
function installFelt(root,r,logo){
 const g=new THREE.Group(); g.name=FELT_ROOT; g.position.set(r.center.x,r.y,r.center.z); g.rotation.y=r.yaw;
 const long=Math.max(r.size.x,r.size.z), short=Math.min(r.size.x,r.size.z);
 const outerW=THREE.MathUtils.clamp(long*.94,2.2,5.45), outerD=THREE.MathUtils.clamp(short*.86,1.25,3.05);
 const feltW=outerW*.66, feltD=outerD*.54;
 const leatherMat=new THREE.MeshStandardMaterial({color:0x24110c,roughness:.55,metalness:.03,emissive:0x050100,emissiveIntensity:.05,side:THREE.DoubleSide});
 const leather=new THREE.Mesh(ringGeometry(outerW,outerD,feltW*1.025,feltD*1.025),leatherMat); leather.name="PHASE174_ALIGNED_DARK_LEATHER_HAND_REST"; leather.rotation.x=-Math.PI/2; leather.position.y=.018; leather.renderOrder=1740; g.add(leather);
 const lip=new THREE.Mesh(new THREE.TorusGeometry(outerW/2-.055,.04,12,192),leatherMat); lip.name="PHASE174_ALIGNED_TABLE_LEATHER_LIP"; lip.rotation.x=Math.PI/2; lip.scale.z=outerD/outerW; lip.position.y=.055; lip.renderOrder=1741; g.add(lip);
 const felt=new THREE.Mesh(new THREE.PlaneGeometry(feltW,feltD),new THREE.MeshBasicMaterial({map:feltTexture(logo),transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:.03})); felt.name="PHASE174_ALIGNED_FELT_PASSLINE_SITE_LOGO"; felt.rotation.x=-Math.PI/2; felt.position.y=.074; felt.renderOrder=1742; g.add(felt);
 root.add(g); return {center:{x:+r.center.x.toFixed(3),z:+r.center.z.toFixed(3)},yaw:+r.yaw.toFixed(3),outerW:+outerW.toFixed(3),outerD:+outerD.toFixed(3),feltW:+feltW.toFixed(3),feltD:+feltD.toFixed(3),y:+(r.y+.074).toFixed(3)};
}
function installFloorLogo(root,r,logo){const g=new THREE.Group(); g.name=FLOOR_LOGO_ROOT; const z=r.center.z+Math.max(3.5,r.size.z*1.7); g.position.set(r.center.x,.019,z); const s=THREE.MathUtils.clamp(Math.max(r.size.x,r.size.z)*.90,2.8,4.8); const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:logoTexture(logo),transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:.02})); m.name="PHASE174_FITTED_SVR_LOGO_ON_LOBBY_FLOOR"; m.rotation.x=-Math.PI/2; m.renderOrder=1600; g.add(m); root.add(g); return {x:+g.position.x.toFixed(3),y:+g.position.y.toFixed(3),z:+g.position.z.toFixed(3),size:+s.toFixed(3)};}
function matYellow(o){const ms=Array.isArray(o.material)?o.material:[o.material]; return ms.some(m=>{const c=m?.color; return c&&c.r>.58&&c.g>.42&&c.b<.28;});}
function dist(o,c){const p=new THREE.Vector3(); o.getWorldPosition(p); return Math.hypot(p.x-c.x,p.z-c.z);}
function removeRails(root,r){let removed=0; const kill=[],rad=Math.max(3.0,Math.min(6.2,Math.max(r.size.x,r.size.z)*1.35)); root.traverse?.(o=>{if(!o||!o.parent||o===root)return; const n=String(o.name||""); if(KEEP_RE.test(n))return; if(dist(o,r.center)>rad)return; if(REMOVE_RE.test(n)||matYellow(o))kill.push(o);}); [...new Set(kill)].forEach(o=>{o.parent?.remove(o); removed++;}); return removed;}
async function install(){scene=window.__SVR_SCENE__; if(!scene)return false; const root=sceneRoot(scene),r=rec(root); if(!root||!r)return false; const logo=await loadLogo(); const old=purgeOld(root); const removed=removeRails(root,r); const felt=installFelt(root,r,logo); const floorLogo=installFloorLogo(root,r,logo); state={build:LABEL,active:true,tableAligned:true,felt,leatherAligned:true,floorLogoAligned:true,floorLogo,railsRemoved:removed,oldSurfacesRemoved:old,logoUrl:logo?.url||"fallback-text",siteTouched:false,checkedAt:new Date().toISOString()}; window.SVR_PHASE172_FLOOR_LOGO_FELT_RAIL_CLEANUP_LOCK=state; window.SVR_RUN_PHASE172_TABLE_FLOOR_AUDIT=()=>state; window.SVR_LOCKED_FINAL_BUILD=LABEL; window.SVR_LIVE_BUILD_POINTER=LABEL; return true;}
[300,900,1600,2800,5000,8200,12000].forEach(ms=>setTimeout(install,ms)); setInterval(()=>install(),3500); install();
