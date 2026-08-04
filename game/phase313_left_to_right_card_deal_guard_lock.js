import * as THREE from "three";

const LABEL = "PHASE-313-LEFT-TO-RIGHT-CARD-DEAL-GUARD-LOCK";
const ROOT_NAME = "PHASE313_LEFT_TO_RIGHT_DEAL_GUARD_ROOT";
let installed = false;
let lastOrder = [];
let lastValid = false;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function getOrder(){
  const order = Array.isArray(window.SVR_PHASE169_DEAL_ORDER) ? window.SVR_PHASE169_DEAL_ORDER : [];
  return order.map((p,i)=>({
    dealIndex:Number(p.dealIndex ?? i),
    originalIndex:Number(p.originalIndex ?? i),
    name:String(p.name || `P${i+1}`),
    x:Number(p.x || 0),
    z:Number(p.z || 0)
  })).sort((a,b)=>a.dealIndex-b.dealIndex);
}
function validate(order){
  if(!order.length) return false;
  for(let i=1;i<order.length;i++){
    if(order[i].x + 0.05 < order[i-1].x) return false;
  }
  return true;
}
function texture(){
  const c=document.createElement("canvas"); c.width=1080; c.height=460;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,1080,460);
  ctx.strokeStyle=lastValid?"#8dffb4":"#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,1032,412);
  ctx.fillStyle="rgba(141,255,180,.10)"; ctx.fillRect(54,54,972,74);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 44px system-ui,Arial"; ctx.fillText("LEFT → RIGHT CARD DEAL LOCK",540,90);
  ctx.fillStyle=lastValid?"#8dffb4":"#ffd98a"; ctx.font="900 30px system-ui,Arial"; ctx.fillText(lastValid?"DEAL ORDER VERIFIED":"WAITING FOR DEAL ORDER",540,154);
  ctx.fillStyle="#e8f4ff"; ctx.font="800 24px system-ui,Arial"; ctx.fillText("Cards must start at the left seat, then continue seat-by-seat to the right.",540,210);
  ctx.fillStyle="#7ffcff"; ctx.font="700 23px system-ui,Arial";
  const names = lastOrder.length ? lastOrder.map(p=>p.name.replace(/^BOT /,"" )).join("  →  ") : "No poker demo order detected yet";
  ctx.fillText(names.slice(0,96),540,270);
  ctx.fillStyle="#ffffff"; ctx.font="700 21px system-ui,Arial";
  ctx.fillText("Guard reads SVR_PHASE169_DEAL_ORDER and rejects right-to-left ordering.",540,334);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(0,0,4.65); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.15,1.76),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE313_LEFT_TO_RIGHT_DEAL_GUARD_PANEL"; panel.position.set(0,2.50,0); panel.rotation.y=Math.PI; panel.renderOrder=410; root.add(panel);
  const arrow=new THREE.Mesh(new THREE.PlaneGeometry(3.3,.08),new THREE.MeshBasicMaterial({color:lastValid?0x8dffb4:0xffd98a,transparent:true,opacity:.76,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  arrow.name="PHASE313_LEFT_TO_RIGHT_ARROW"; arrow.position.set(0,.08,-.18); root.add(arrow);
  return true;
}
function audit(){
  const order=getOrder();
  lastOrder=order;
  lastValid=validate(order);
  const lock={
    build:LABEL,
    active:true,
    direction:"left-to-right",
    valid:lastValid,
    order,
    source:"SVR_PHASE169_DEAL_ORDER",
    rule:"sort by table x ascending; never right-to-left",
    phase315Chained:true,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_PHASE313_LEFT_TO_RIGHT_CARD_DEAL_GUARD_LOCK=lock;
  window.SVR_LEFT_TO_RIGHT_DEAL_LOCK=lock;
  try{ window.dispatchEvent(new CustomEvent("svr-left-to-right-deal-guard-check",{detail:lock})); }catch{}
  showPanel();
  if(lastValid) status("Left-to-right card deal order verified");
  return lock;
}
function install(){
  if(installed) return true;
  installed=true;
  window.SVR_PHASE313_AUDIT_LEFT_TO_RIGHT_DEAL = audit;
  window.SVR_PHASE313_FORCE_LEFT_TO_RIGHT_DEAL_ORDER = ()=>{
    const order=getOrder().sort((a,b)=>Math.abs(a.x-b.x)>0.05 ? a.x-b.x : a.z-b.z).map((p,i)=>({...p, dealIndex:i}));
    window.SVR_PHASE169_DEAL_ORDER = order;
    return audit();
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  audit();
  return true;
}
install();
setInterval(audit,3500);
[600,1500,3000,6000].forEach(d=>setTimeout(audit,d));
import("./phase315_left_to_right_sequence_monitor_lock.js?v=phase315-sequence-monitor").catch(e=>{window.SVR_PHASE315_IMPORT_ERROR=String(e?.message||e);});
