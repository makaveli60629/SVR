import * as THREE from "three";

const LABEL="PHASE-317-DEAL-DIRECTION-TABLE-ARROWS-LOCK";
const ROOT_NAME="PHASE317_DEAL_DIRECTION_ARROWS_ROOT";
let installed=false;
let activeSeatIndex=0;
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function order(){const o=Array.isArray(window.SVR_PHASE169_DEAL_ORDER)?window.SVR_PHASE169_DEAL_ORDER:[];return o.map((p,i)=>({dealIndex:Number(p.dealIndex??i),name:String(p.name||`P${i+1}`),x:Number(p.x||0),z:Number(p.z||0)})).sort((a,b)=>a.dealIndex-b.dealIndex);}
function makeArrowTex(n,active){
  const c=document.createElement("canvas");c.width=512;c.height=256;const g=c.getContext("2d");
  g.clearRect(0,0,512,256);g.fillStyle=active?"rgba(141,255,180,.95)":"rgba(255,217,138,.72)";
  g.beginPath();g.moveTo(40,128);g.lineTo(350,128);g.lineTo(350,72);g.lineTo(474,128);g.lineTo(350,184);g.lineTo(350,128);g.closePath();g.fill();
  g.strokeStyle="#03040a";g.lineWidth=10;g.stroke();g.fillStyle="#03040a";g.font="900 58px system-ui,Arial";g.textAlign="center";g.textBaseline="middle";g.fillText(String(n),255,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function draw(){
  const scene=window.__SVR_SCENE__;if(!scene)return false;const old=scene.getObjectByName(ROOT_NAME);if(old)old.parent?.remove(old);
  const root=new THREE.Group();root.name=ROOT_NAME;scene.add(root);
  const arr=order();
  arr.forEach((p,i)=>{
    const active=Number(activeSeatIndex||0)===i+1;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.86,.42),new THREE.MeshBasicMaterial({map:makeArrowTex(i+1,active),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    mesh.name=`PHASE317_DEAL_ARROW_${i+1}`;
    mesh.position.set(p.x*.72,.97,p.z*.72);
    mesh.rotation.x=-Math.PI/2;
    mesh.rotation.z=0;
    mesh.renderOrder=440;
    root.add(mesh);
  });
  return true;
}
function onCard(d){if(d?.seatIndex)activeSeatIndex=Number(d.seatIndex);draw();const state={build:LABEL,active:true,activeSeatIndex,activePlayer:d?.name||null,arrowCount:order().length,direction:"left-to-right",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};window.SVR_PHASE317_DEAL_DIRECTION_TABLE_ARROWS_STATE=state;try{window.dispatchEvent(new CustomEvent("svr-deal-direction-arrows-updated",{detail:state}));}catch{}status("Deal direction arrows updated");return state;}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-left-to-right-card-dealt",e=>onCard(e.detail));
  window.addEventListener("svr-deal-order-seat-badges-updated",e=>{activeSeatIndex=Number(e.detail?.activeSeatIndex||activeSeatIndex||0);draw();});
  window.SVR_PHASE317_REFRESH_DEAL_ARROWS=draw;
  window.SVR_PHASE317_DEAL_DIRECTION_TABLE_ARROWS_LOCK={build:LABEL,active:true,source:"SVR_PHASE169_DEAL_ORDER",listensFor:"svr-left-to-right-card-dealt",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;draw();return true;
}
install();setInterval(()=>{install();draw();},6000);
