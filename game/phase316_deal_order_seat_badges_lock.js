import * as THREE from "three";

const LABEL="PHASE-316-DEAL-ORDER-SEAT-BADGES-LOCK";
const ROOT_NAME="PHASE316_DEAL_ORDER_SEAT_BADGES_ROOT";
let installed=false;
let activeSeatIndex=0;
function status(text){const el=document.getElementById("status");if(el)el.textContent=text;}
function getOrder(){const o=Array.isArray(window.SVR_PHASE169_DEAL_ORDER)?window.SVR_PHASE169_DEAL_ORDER:[];return o.map((p,i)=>({dealIndex:Number(p.dealIndex??i),name:String(p.name||`P${i+1}`),x:Number(p.x||0),z:Number(p.z||0)})).sort((a,b)=>a.dealIndex-b.dealIndex);}
function cleanName(name){return String(name||"P").replace("BOT ","").slice(0,16);}
function makeTex(n,name,active){
  const c=document.createElement("canvas");c.width=420;c.height=300;const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(3,4,10,.90)";ctx.fillRect(0,0,420,300);ctx.strokeStyle=active?"#8dffb4":"#ffd98a";ctx.lineWidth=10;ctx.strokeRect(18,18,384,264);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=active?"#8dffb4":"#ffd98a";ctx.font="900 108px system-ui,Arial";ctx.fillText(String(n),210,112);
  ctx.fillStyle="#fff";ctx.font="900 34px system-ui,Arial";ctx.fillText("DEAL",210,190);ctx.fillStyle="#7ffcff";ctx.font="800 25px system-ui,Arial";ctx.fillText(cleanName(name),210,242);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function draw(){
  const scene=window.__SVR_SCENE__;if(!scene)return false;const old=scene.getObjectByName(ROOT_NAME);if(old)old.parent?.remove(old);
  const root=new THREE.Group();root.name=ROOT_NAME;scene.add(root);
  getOrder().forEach((p,i)=>{
    const active=Number(activeSeatIndex||0)===i+1;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(.72,.52),new THREE.MeshBasicMaterial({map:makeTex(i+1,p.name,active),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    panel.name=`PHASE316_DEAL_BADGE_${i+1}`;panel.position.set(p.x,2.62,p.z);panel.renderOrder=430;root.add(panel);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.24,.35,64),new THREE.MeshBasicMaterial({color:active?0x8dffb4:0xffd98a,transparent:true,opacity:active?0.75:0.48,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    ring.name=`PHASE316_DEAL_BADGE_RING_${i+1}`;ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.1,p.z);root.add(ring);
  });
  const cam=window.__SVR_CAMERA__;if(cam)root.traverse(o=>{if(o.isMesh&&String(o.name).startsWith("PHASE316_DEAL_BADGE_"))o.lookAt(cam.position);});
  return true;
}
function onCard(detail){if(detail?.seatIndex)activeSeatIndex=Number(detail.seatIndex);draw();const state={build:LABEL,active:true,activeSeatIndex,activePlayer:detail?.name||null,order:getOrder(),phase317Chained:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};window.SVR_PHASE316_DEAL_ORDER_SEAT_BADGES_STATE=state;try{window.dispatchEvent(new CustomEvent("svr-deal-order-seat-badges-updated",{detail:state}));}catch{}return state;}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-left-to-right-card-dealt",e=>onCard(e.detail));
  window.addEventListener("svr-left-to-right-deal-guard-check",()=>draw());
  window.SVR_PHASE316_REFRESH_DEAL_BADGES=draw;
  window.SVR_PHASE316_DEAL_ORDER_SEAT_BADGES_LOCK={build:LABEL,active:true,source:"SVR_PHASE169_DEAL_ORDER",listensFor:"svr-left-to-right-card-dealt",phase317Chained:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;draw();status("Deal order seat badges armed");return true;
}
install();setInterval(()=>{install();draw();},6000);
import("./phase317_deal_direction_table_arrows_lock.js?v=phase317-deal-arrows").catch(e=>{window.SVR_PHASE317_IMPORT_ERROR=String(e?.message||e);});
