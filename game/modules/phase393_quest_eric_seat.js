/* PHASE-393-QUEST-ERIC-SEAT-DEALING-LOCK */
import * as THREE from 'three';
import {getTable,bounds,state as tableState} from './phase393_quest_table_surface.js?v=phase393';
export const BUILD='PHASE-393-QUEST-ERIC-SEAT-DEALING-LOCK';
export const TARGET_ERIC_HEIGHT=1.78,DEALER_GAP=.42,SEATED_RAIL_GAP=.14,SEATED_EYE_HEIGHT=1.18;
export const state={build:BUILD,installed:false,ericAnchored:false,ericHeight:null,ericFloorDrift:null,rootMotionLocked:false,dealingAnimation:false,dealtCards:0,playersNormalized:0,userSeated:false,userRailGap:null,userEyeHeight:null,seatApplications:0,lastError:null,checkedAt:null};
let scene=null,renderer=null,camera=null,eric=null,dealCard=null,lastDealCycle=-1,seatUntil=0;
const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],q=new THREE.Quaternion();
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
const bones={pelvis:null,pelvisP:null,pelvisQ:null,rightUpper:null,rightUpperQ:null,rightFore:null,rightForeQ:null,leftUpper:null,leftUpperQ:null,leftFore:null,leftForeQ:null,rightHand:null};
function walk(root,fn,limit=18000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const object=stack.pop();if(!object||seen.has(object))continue;seen.add(object);try{fn(object)}catch{}for(const child of object.children||[])if(child&&!seen.has(child))stack.push(child)}return seen.size}
function inside(object,root){for(let current=object;current;current=current.parent)if(current===root)return true;return false}
const valid=info=>Boolean(info&&!info.box.isEmpty()&&info.size.x>.01&&info.size.y>.01&&info.size.z>.01);
function setWorldPosition(object,position){if(!object?.parent){object?.position.copy(position);return}object.parent.updateWorldMatrix?.(true,false);object.position.copy(object.parent.worldToLocal(position.clone()))}
function moveWorld(object,delta){object.getWorldPosition(v[0]);setWorldPosition(object,v[0].add(delta))}
function findEric(){return window.SVR_PHASE391_ERIC_AUTHORITY||window.SVR_PHASE388_ERIC_AUTHORITY||scene?.getObjectByName?.('PHASE391_AUTHORITATIVE_ERIC_DEALER')||eric||null}
function activeCamera(){const value=renderer?.xr?.isPresenting?renderer.xr.getCamera(camera):camera;return value?.cameras?.[0]||value||camera}
function playerRig(){return window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG||window.SVR_PLAYER_RIG||window.__SVR_PLAYER_RIG||null}
function tableForward(table){table?.getWorldQuaternion(q);const forward=v[0].set(0,0,1).applyQuaternion(q).setY(0);if(forward.lengthSq()<.001)forward.set(0,0,1);return forward.normalize().clone()}
const clean=value=>String(value||'').replace(/^[^:]+:/,'').replace(/[^a-z0-9]/ig,'').toLowerCase();
function findBone(root,patterns){let found=null;walk(root,object=>{if(found||!object?.isBone)return;const name=clean(object.name);if(patterns.some(pattern=>pattern.test(name)))found=object},12000);return found}
function captureBones(){
  if(!eric||bones.pelvis)return;
  bones.pelvis=findBone(eric,[/^hips?$/,/^pelvis$/,/^root$/, /mixamorighips/,/hip/]);bones.rightUpper=findBone(eric,[/rightarm/,/upperarmr/,/armr/]);bones.rightFore=findBone(eric,[/rightforearm/,/forearmr/,/lowerarmr/]);bones.leftUpper=findBone(eric,[/leftarm/,/upperarml/,/arml/]);bones.leftFore=findBone(eric,[/leftforearm/,/forearml/,/lowerarml/]);bones.rightHand=findBone(eric,[/^righthand$/, /handr/,/rhand/]);
  if(bones.pelvis){bones.pelvisP=bones.pelvis.position.clone();bones.pelvisQ=bones.pelvis.quaternion.clone()}
  if(bones.rightUpper)bones.rightUpperQ=bones.rightUpper.quaternion.clone();if(bones.rightFore)bones.rightForeQ=bones.rightFore.quaternion.clone();if(bones.leftUpper)bones.leftUpperQ=bones.leftUpper.quaternion.clone();if(bones.leftFore)bones.leftForeQ=bones.leftFore.quaternion.clone();
}
function normalizeScale(){
  eric=findEric()||eric;if(!eric)return false;let info=bounds(eric);if(!valid(info))return false;
  if(!eric.userData?.svrPhase393Scaled){const factor=clamp(TARGET_ERIC_HEIGHT/info.size.y,.55,1.7);eric.scale.multiplyScalar(factor);eric.userData={...(eric.userData||{}),svrPhase393Scaled:true};eric.updateWorldMatrix?.(true,true)}
  info=bounds(eric);state.ericHeight=+info.size.y.toFixed(3);return true;
}
function anchorEric(){
  const table=getTable();eric=findEric()||eric;if(!table||!eric)return false;normalizeScale();captureBones();const tableInfo=bounds(table);if(!valid(tableInfo))return false;
  if(!Number.isFinite(eric.userData?.svrPhase393StableFloorOffset)){eric.getWorldPosition(v[3]);const initial=bounds(eric);eric.userData={...(eric.userData||{}),svrPhase393StableFloorOffset:initial.box.min.y-v[3].y}}
  const forward=tableForward(table),halfDepth=Math.min(tableInfo.size.x,tableInfo.size.z)/2,position=tableInfo.center.clone().addScaledVector(forward,-(halfDepth+DEALER_GAP));position.y=-(Number(eric.userData.svrPhase393StableFloorOffset)||0);
  setWorldPosition(eric,position);eric.lookAt(tableInfo.center.x,tableState.tableTop-.12,tableInfo.center.z);eric.visible=true;
  if(bones.pelvis&&bones.pelvisP){bones.pelvis.position.copy(bones.pelvisP);if(bones.pelvisQ)bones.pelvis.quaternion.copy(bones.pelvisQ);state.rootMotionLocked=true}
  eric.updateWorldMatrix?.(true,true);const info=bounds(eric);state.ericFloorDrift=valid(info)?+Math.abs(info.box.min.y).toFixed(4):null;state.ericAnchored=valid(info)&&state.ericFloorDrift<=.045;return state.ericAnchored;
}
function normalizePlayers(){
  if(!scene)return 0;let count=0;const names=/^(claudia|maya|darius|nova)(?:[_ -]|$)/i;
  walk(scene,object=>{if(!object?.isObject3D||object===eric||inside(object,eric)||object.userData?.svrPhase393PlayerNormalized)return;const text=String(object.name||'');if(!names.test(text)&&!/(CLAUDIA|MAYA|DARIUS|NOVA).*(AVATAR|NPC|PLAYER)/i.test(text))return;let info;try{info=bounds(object)}catch{return}if(!valid(info)||info.size.y<.5||info.size.y>3.5)return;object.scale.multiplyScalar(clamp(TARGET_ERIC_HEIGHT/info.size.y,.5,1.8));object.userData={...(object.userData||{}),svrPhase393PlayerNormalized:true};object.updateWorldMatrix?.(true,true);info=bounds(object);moveWorld(object,new THREE.Vector3(0,-info.box.min.y,0));count++},16000);state.playersNormalized=Math.max(state.playersNormalized,count);return count;
}
function cardTexture(){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=360;const ctx=canvas.getContext('2d');ctx.fillStyle='#15104a';ctx.fillRect(0,0,256,360);ctx.strokeStyle='#7ffcff';ctx.lineWidth=12;ctx.strokeRect(8,8,240,344);const texture=new THREE.CanvasTexture(canvas),image=new Image();image.onload=()=>{ctx.drawImage(image,38,90,180,180);texture.needsUpdate=true};image.src='/logo.png?v=phase393';texture.colorSpace=THREE.SRGBColorSpace;return texture}
function ensureDealCard(){if(dealCard?.parent||!scene)return dealCard;dealCard=new THREE.Mesh(new THREE.PlaneGeometry(.075,.105),new THREE.MeshBasicMaterial({map:cardTexture(),side:THREE.DoubleSide}));dealCard.name='PHASE393_ERIC_DEALING_CARD';dealCard.visible=false;scene.add(dealCard);return dealCard}
export function animate(time){
  const table=getTable();if(!eric||!table)return;captureBones();anchorEric();
  if(bones.pelvis&&bones.pelvisP){bones.pelvis.position.copy(bones.pelvisP);if(bones.pelvisQ)bones.pelvis.quaternion.copy(bones.pelvisQ)}
  const cycle=(time/1000)%3.2,reach=Math.sin(Math.min(1,cycle/.8)*Math.PI)*.32,sway=Math.sin(time*.0017)*.035;
  const apply=(bone,base,x,y,z)=>{if(bone&&base)bone.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ')))};
  apply(bones.rightUpper,bones.rightUpperQ,-.12-reach,sway,-.08);apply(bones.rightFore,bones.rightForeQ,-.18-reach*.8,0,-.10);apply(bones.leftUpper,bones.leftUpperQ,-.07-reach*.35,-sway,.08);apply(bones.leftFore,bones.leftForeQ,-.10-reach*.3,0,.08);
  const card=ensureDealCard();if(!card)return;const cycleIndex=Math.floor(time/3200);if(cycleIndex!==lastDealCycle){lastDealCycle=cycleIndex;state.dealtCards++}
  const progress=clamp(cycle/.78,0,1);if(cycle<.9){
    const tableInfo=bounds(table),forward=tableForward(table);table.getWorldQuaternion(q);const right=v[1].set(1,0,0).applyQuaternion(q).setY(0).normalize();let start;
    if(bones.rightHand){bones.rightHand.getWorldPosition(v[2]);start=v[2].clone()}else{const info=bounds(eric);start=info.center.clone().setY(info.box.min.y+info.size.y*.72)}
    const seat=cycleIndex%6,angle=seat/6*Math.PI*2,end=tableInfo.center.clone().addScaledVector(right,Math.cos(angle)*tableInfo.size.x*.24).addScaledVector(forward,Math.sin(angle)*tableInfo.size.z*.22);end.y=(tableState.feltTop||.87)+.025;
    card.position.lerpVectors(start,end,progress);card.position.y+=Math.sin(progress*Math.PI)*.18;card.rotation.set(-Math.PI/2,0,-angle);card.visible=true;state.dealingAnimation=true;
  }else card.visible=false;
}
export function seatUser(reason='bounded'){
  const table=getTable(),rig=playerRig(),view=activeCamera();if(!table||!rig||!view)return false;const info=bounds(table);if(!valid(info))return false;
  const forward=tableForward(table),halfDepth=Math.min(info.size.x,info.size.z)/2,desired=info.center.clone().addScaledVector(forward,halfDepth+SEATED_RAIL_GAP);desired.y=SEATED_EYE_HEIGHT;
  view.getWorldPosition(v[2]);moveWorld(rig,desired.clone().sub(v[2]));
  const dx=info.center.x-desired.x,dz=info.center.z-desired.z;if(rig.rotation)rig.rotation.y=Math.atan2(-dx,-dz);
  rig.updateWorldMatrix?.(true,true);view.getWorldPosition(v[3]);state.userEyeHeight=+v[3].y.toFixed(3);state.userRailGap=SEATED_RAIL_GAP;state.userSeated=Math.abs(v[3].y-SEATED_EYE_HEIGHT)<.10;state.seatApplications++;state.lastSeatReason=reason;return state.userSeated;
}
export function requestSeat(ms=15000){seatUntil=performance.now()+ms}
export function shouldSeat(){return performance.now()<seatUntil}
export function sweep(sourceScene,sourceRenderer,sourceCamera){
  try{scene=sourceScene||window.__SVR_SCENE__||scene;renderer=sourceRenderer||window.__SVR_RENDERER__||renderer;camera=sourceCamera||window.__SVR_CAMERA__||camera;eric=findEric()||eric;if(!scene||!getTable()||!eric)return false;anchorEric();normalizePlayers();if(shouldSeat())seatUser('bounded-sweep');state.installed=Boolean(state.ericAnchored);state.checkedAt=new Date().toISOString();window.SVR_PHASE393_ERIC_SEAT_STATE={...state};return state.installed}catch(error){state.lastError=String(error?.stack||error?.message||error);return false}
}
export function qa(){const info=eric?bounds(eric):null;return{...state,liveEricHeight:valid(info)?+info.size.y.toFixed(3):null,liveEricFloor:valid(info)?+info.box.min.y.toFixed(4):null,pass:Boolean(state.installed&&state.ericAnchored&&state.rootMotionLocked&&state.dealingAnimation&&state.userSeated&&!state.lastError),checkedAt:new Date().toISOString()}}
