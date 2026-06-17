import * as THREE from "three";

const LABEL="PHASE-315-LEFT-TO-RIGHT-SEQUENCE-MONITOR-LOCK";
const ROOT_NAME="PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_ROOT";
let installed=false;
let sequence=[];
let valid=false;
function status(text){const el=document.getElementById("status");if(el)el.textContent=text;}
function validate(seq){
  if(!seq.length)return false;
  const rounds=new Map();
  seq.forEach(s=>{const k=`${s.handNumber||0}:${s.round||0}`;if(!rounds.has(k))rounds.set(k,[]);rounds.get(k).push(s);});
  for(const rows of rounds.values()){
    const sorted=[...rows].sort((a,b)=>Number(a.seatIndex||0)-Number(b.seatIndex||0));
    for(let i=1;i<sorted.length;i++){
      if(Number(sorted[i].x||0)+0.05<Number(sorted[i-1].x||0))return false;
      if(Number(sorted[i].dealIndex||0)<Number(sorted[i-1].dealIndex||0))return false;
    }
  }
  return true;
}
function tex(){
  const c=document.createElement("canvas");c.width=1060;c.height=460;const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,1060,460);ctx.strokeStyle=valid?"#8dffb4":"#ffd98a";ctx.lineWidth=10;ctx.strokeRect(24,24,1012,412);
  ctx.fillStyle="rgba(127,252,255,.10)";ctx.fillRect(54,54,952,76);ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle="#fff";ctx.font="900 42px system-ui,Arial";ctx.fillText("LIVE LEFT → RIGHT DEAL SEQUENCE",530,92);
  ctx.fillStyle=valid?"#8dffb4":"#ffd98a";ctx.font="900 30px system-ui,Arial";ctx.fillText(valid?"VERIFIED LIVE":"WAITING FOR CARD EVENTS",530,154);
  ctx.textAlign="left";ctx.font="800 23px system-ui,Arial";sequence.slice(-10).forEach((s,i)=>{ctx.fillStyle="#e8f4ff";ctx.fillText(`R${s.round} S${s.seatIndex}: ${String(s.name||"P").replace(/^BOT\s+/i,"")} ${s.card||""}`,90,214+i*30);});
  ctx.textAlign="center";ctx.fillStyle="#7ffcff";ctx.font="700 21px system-ui,Arial";ctx.fillText(`Recorded cards: ${sequence.length}`,530,414);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function draw(){
  const scene=window.__SVR_SCENE__;if(!scene)return false;const old=scene.getObjectByName(ROOT_NAME);if(old)old.parent?.remove(old);
  const root=new THREE.Group();root.name=ROOT_NAME;root.position.set(0,0,5.78);scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.15,1.8),new THREE.MeshBasicMaterial({map:tex(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE315_LEFT_TO_RIGHT_SEQUENCE_PANEL";panel.position.set(0,2.55,0);panel.rotation.y=Math.PI;panel.renderOrder=420;root.add(panel);return true;
}
function ingest(detail){
  if(!detail)return null;
  if(detail.seatIndex===1&&detail.round===1)sequence=[];
  sequence.push(detail);valid=validate(sequence);
  const state={build:LABEL,active:true,direction:"left-to-right",valid,cardCount:sequence.length,lastCard:detail,sequence:[...sequence],source:"svr-left-to-right-card-dealt",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_STATE=state;
  window.SVR_LIVE_LEFT_TO_RIGHT_CARD_SEQUENCE=state;
  try{window.dispatchEvent(new CustomEvent("svr-left-to-right-sequence-monitor",{detail:state}));}catch{}
  draw();if(valid)status("Live left-to-right card sequence verified");return state;
}
function seed(){const ex=Array.isArray(window.SVR_PHASE314_LEFT_TO_RIGHT_DEAL_SEQUENCE)?window.SVR_PHASE314_LEFT_TO_RIGHT_DEAL_SEQUENCE:[];if(ex.length&&!sequence.length){sequence=[...ex];valid=validate(sequence);draw();}}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-left-to-right-card-dealt",e=>ingest(e.detail));
  window.SVR_PHASE315_AUDIT_LEFT_TO_RIGHT_SEQUENCE=()=>{seed();return window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_STATE||{build:LABEL,active:true,valid,sequence};};
  window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_LOCK={build:LABEL,active:true,listensFor:"svr-left-to-right-card-dealt",emits:"svr-left-to-right-sequence-monitor",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;seed();draw();return true;
}
install();setInterval(()=>{install();seed();draw();},5000);
