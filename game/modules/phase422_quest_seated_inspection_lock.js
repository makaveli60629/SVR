/* PHASE-422-QUEST-SEATED-INSPECTION-LOCK */
import * as THREE from 'three';
export const BUILD='PHASE-422-QUEST-SEATED-INSPECTION-LOCK';
export const SEATED_RAIL_GAP=.045,SEATED_EYE_HEIGHT=1.18;
const p=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const ACTIVE=p.get('platform')==='quest'||p.get('direct')==='1'||p.get('questfix')==='1'||/Quest|Oculus|Meta Quest/i.test(ua);
const flags=['SVR_MOVEMENT_ENABLED','SVR_LOCOMOTION_ENABLED','SVR_TABLE_TRAVEL_ENABLED','SVR_TELEPORT_ENABLED','SVR_HAND_TELEPORT_ENABLED','SVR_WATCH_TELEPORT_ENABLED','SVR_GRIP_TELEPORT_ENABLED','SVR_POINTER_ENABLED','SVR_HAND_RAY_ENABLED'];
const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],q=new THREE.Quaternion();
const state={build:BUILD,active:ACTIVE,installed:false,seatLocked:false,teleportLocked:false,eyeHeight:null,railGap:SEATED_RAIL_GAP,lastError:null,checkedAt:null};
let renderer=null,camera=null,table=null,pose=null,raf=0;
function bounds(o){o?.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(o,true);return{box,size:box.getSize(new THREE.Vector3()),center:box.getCenter(new THREE.Vector3())}}
function findTable(){return window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||window.__SVR_SCENE__?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')||table||null}
function rig(){return window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG||window.SVR_PLAYER_RIG||window.__SVR_PLAYER_RIG||null}
function view(){const c=renderer?.xr?.isPresenting?renderer.xr.getCamera(camera):camera;return c?.cameras?.[0]||c||camera}
function forward(o){o.getWorldQuaternion(q);const f=v[0].set(0,0,1).applyQuaternion(q).setY(0);return(f.lengthSq()>.001?f:new THREE.Vector3(0,0,1)).normalize()}
function lockMovement(){for(const k of flags)window[k]=false;window.SVR_TELEPORT_DISABLED=true;window.SVR_TELEPORT_ENABLED=false;window.SVR_PHASE422_SEATED_LOCK=true;state.teleportLocked=true}
function setHead(target,look){const r=rig(),c=view();if(!r?.position||!c)return false;c.getWorldPosition(v[1]);r.getWorldPosition(v[2]);const desired=v[2].clone().add(target).sub(v[1]),local=r.parent?r.parent.worldToLocal(desired.clone()):desired;r.position.copy(local);c.getWorldQuaternion(q);const a=v[0].set(0,0,-1).applyQuaternion(q).setY(0);c.getWorldPosition(v[1]);const b=v[3].set(look.x-v[1].x,0,look.z-v[1].z);if(a.lengthSq()>.001&&b.lengthSq()>.001){a.normalize();b.normalize();const d=Math.atan2(b.x,b.z)-Math.atan2(a.x,a.z);r.rotation.y+=Math.atan2(Math.sin(d),Math.cos(d))}pose={position:r.position.clone(),yaw:r.rotation.y};r.updateWorldMatrix?.(true,true);return true}
export function seat(){table=findTable()||table;renderer=window.__SVR_RENDERER__||renderer;camera=window.__SVR_CAMERA__||camera;if(!table)return false;const info=bounds(table),f=forward(table),half=Math.min(info.size.x,info.size.z)/2,target=info.center.clone().addScaledVector(f,half+SEATED_RAIL_GAP);target.y=SEATED_EYE_HEIGHT;const look=info.center.clone();look.y=info.box.max.y-.0254+.05;const ok=setHead(target,look);lockMovement();state.seatLocked=ok;state.installed=ok;state.eyeHeight=SEATED_EYE_HEIGHT;state.checkedAt=new Date().toISOString();return ok}
function frame(){if(!ACTIVE)return;try{lockMovement();const r=rig();if(pose&&r?.position){r.position.copy(pose.position);r.rotation.y=pose.yaw}}catch(e){state.lastError=String(e?.message||e)}raf=requestAnimationFrame(frame)}
export function qa(){return{...state,locomotionDisabled:true,handTeleportDisabled:true,pass:Boolean(state.installed&&state.seatLocked&&state.teleportLocked&&!state.lastError),checkedAt:new Date().toISOString()}}
window.SVR_PHASE422_SEAT=seat;window.SVR_PHASE422_SEAT_QA=qa;
if(ACTIVE){window.addEventListener('svr:phase396-core-ready',()=>setTimeout(seat,220),{once:true});setTimeout(seat,2800);raf=requestAnimationFrame(frame)}
