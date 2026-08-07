/* PHASE-395-QUEST-ERIC-HARD-FLOOR-GUARD-LOCK */
import * as THREE from 'three';
export const BUILD='PHASE-395-QUEST-ERIC-HARD-FLOOR-GUARD-LOCK';
const params=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const ACTIVE=params.get('platform')==='quest'||params.get('direct')==='1'||params.get('questfix')==='1'||/Quest|Oculus|Meta Quest/i.test(ua);
const DEALER_GAP=.22;
const state={build:BUILD,active:ACTIVE,installed:false,applications:0,floorDrift:null,dealerGap:DEALER_GAP,lastError:null,checkedAt:null};
let table=null,eric=null,target=null,targetYaw=0,floorOffset=0,lastRefresh=0,raf=0;
const q=new THREE.Quaternion(),v=new THREE.Vector3();
function bounds(object){object?.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(object,true);return{box,size:box.getSize(new THREE.Vector3()),center:box.getCenter(new THREE.Vector3())}}
function setWorldPosition(object,position){if(!object?.parent){object?.position.copy(position);return}object.parent.updateWorldMatrix?.(true,false);object.position.copy(object.parent.worldToLocal(position.clone()))}
function find(){table=window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||table;eric=window.SVR_PHASE391_ERIC_AUTHORITY||window.SVR_PHASE388_ERIC_AUTHORITY||eric;return Boolean(table&&eric)}
function refreshTarget(){if(!find())return false;const info=bounds(table);if(info.box.isEmpty())return false;table.getWorldQuaternion(q);const forward=new THREE.Vector3(0,0,1).applyQuaternion(q).setY(0);if(forward.lengthSq()<.001)forward.set(0,0,1);forward.normalize();const half=Math.min(info.size.x,info.size.z)/2;target=info.center.clone().addScaledVector(forward,-(half+DEALER_GAP));eric.getWorldPosition(v);const e=bounds(eric);floorOffset=e.box.min.y-v.y;target.y=-floorOffset;targetYaw=Math.atan2(info.center.x-target.x,info.center.z-target.z);return true}
function enforce(){if(!target||!eric)return false;setWorldPosition(eric,target);eric.rotation.set(0,targetYaw,0);eric.visible=true;eric.updateWorldMatrix?.(true,true);state.applications++;if(state.applications%30===0){const e=bounds(eric);state.floorDrift=+Math.abs(e.box.min.y).toFixed(4)}state.installed=true;state.checkedAt=new Date().toISOString();return true}
function frame(now){if(!ACTIVE)return;try{if(now-lastRefresh>220){lastRefresh=now;refreshTarget()}enforce()}catch(error){state.lastError=String(error?.message||error)}raf=requestAnimationFrame(frame)}
function qa(){const e=eric?bounds(eric):null;return{...state,liveFloor:e&&!e.box.isEmpty()?+e.box.min.y.toFixed(4):null,pass:Boolean(state.installed&&state.applications>10&&!state.lastError),checkedAt:new Date().toISOString()}}
window.SVR_PHASE395_ERIC_HARD_GUARD_QA=qa;
if(ACTIVE)raf=requestAnimationFrame(frame);
