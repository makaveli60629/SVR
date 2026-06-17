import * as THREE from "three";

const LABEL="PHASE-318-DEAL-PATH-PULSE-LOCK";
const ROOT_NAME="PHASE318_DEAL_PATH_PULSE_ROOT";
let installed=false;
let lastPulse=null;
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function scene(){return window.__SVR_SCENE__||null;}
function getRoot(){const s=scene();if(!s)return null;let r=s.getObjectByName(ROOT_NAME);if(!r){r=new THREE.Group();r.name=ROOT_NAME;s.add(r);}return r;}
function clearOld(){const r=getRoot();if(!r)return;while(r.children.length)r.remove(r.children[0]);}
function target(detail){
  const x=Number(detail?.x||0),z=Number(detail?.z||0);
  const inward=new THREE.Vector3(-x,0,-z).normalize();
  return new THREE.Vector3(x,.98,z).addScaledVector(inward,.72);
}
function pulse(detail){
  const r=getRoot();if(!r||!detail)return null;clearOld();
  const from=new THREE.Vector3(0,1.28,-1.02);
  const to=target(detail);
  const mid=from.clone().lerp(to,.5);mid.y+=.42;
  const curve=new THREE.CatmullRomCurve3([from,mid,to]);
  const tube=new THREE.TubeGeometry(curve,32,.025,10,false);
  const activeColor=0x8dffb4;
  const mesh=new THREE.Mesh(tube,new THREE.MeshBasicMaterial({color:activeColor,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending}));
  mesh.name="PHASE318_ACTIVE_DEAL_PATH";mesh.renderOrder=450;r.add(mesh);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.11,24,16),new THREE.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:.90,depthWrite:false,blending:THREE.AdditiveBlending}));
  dot.name="PHASE318_DEAL_TARGET_DOT";dot.position.copy(to);dot.renderOrder=451;r.add(dot);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.33,64),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name="PHASE318_DEAL_TARGET_RING";ring.rotation.x=-Math.PI/2;ring.position.set(to.x,.09,to.z);r.add(ring);
  lastPulse={build:LABEL,active:true,from:{x:from.x,y:from.y,z:from.z},to:{x:to.x,y:to.y,z:to.z},seatIndex:detail.seatIndex,player:detail.name||null,card:detail.card||null,direction:"left-to-right",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE318_DEAL_PATH_PULSE_STATE=lastPulse;
  try{window.dispatchEvent(new CustomEvent("svr-deal-path-pulse-updated",{detail:lastPulse}));}catch{}
  status(`Deal path pulse: seat ${detail.seatIndex||"?"}`);
  return lastPulse;
}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-left-to-right-card-dealt",e=>pulse(e.detail));
  window.SVR_PHASE318_REFRESH_DEAL_PATH=()=>pulse(window.SVR_PHASE314_LAST_DEALT_CARD||{});
  window.SVR_PHASE318_DEAL_PATH_PULSE_LOCK={build:LABEL,active:true,listensFor:"svr-left-to-right-card-dealt",emits:"svr-deal-path-pulse-updated",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();setInterval(()=>{install();},5000);
