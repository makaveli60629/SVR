/* PHASE-395-QUEST-BROWSER-TABLE-GAMEPLAY-FIX-LOCK */
import * as THREE from 'three';

export const BUILD='PHASE-395-QUEST-BROWSER-TABLE-GAMEPLAY-FIX-LOCK';
export const TARGET_TABLE_WIDTH=3.58;
export const TARGET_TABLE_TOP=1.03;
export const TARGET_TABLE_BOTTOM=-0.015;
export const TARGET_FELT_RECESS=0.12;
export const DEALER_GAP=0.22;
export const SEATED_RAIL_GAP=0.10;
export const SEATED_EYE_HEIGHT=1.22;

const params=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const ACTIVE=params.get('platform')==='quest'||params.get('direct')==='1'||params.get('questfix')==='1'||/Quest|Oculus|Meta Quest/i.test(ua);
const state={build:BUILD,active:ACTIVE,installed:false,tableWidth:null,tableTop:null,tableBottom:null,baseLineY:null,baseAnchorMethod:null,feltTop:null,ericGrounded:false,ericFloorDrift:null,ericDealerGap:DEALER_GAP,userSeated:false,userRailGap:null,userEyeHeight:null,seatApplications:0,cardRootReady:false,cardMeshesReady:0,visibleCards:0,handStartAttempts:0,cardsRebuilt:false,lightingReady:false,rendererExposure:null,lastReason:null,lastError:null,checkedAt:null};
let scene=null,renderer=null,camera=null,table=null,eric=null,felt=null,lighting=null,seatUntil=0,raf=0,timer=0,lastCardSweep=0,lastTableSweep=0,lastSeatSweep=0;
const q=new THREE.Quaternion(),v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function walk(root,fn,limit=28000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const o=stack.pop();if(!o||seen.has(o))continue;seen.add(o);try{fn(o)}catch{}for(const c of o.children||[])if(c&&!seen.has(c))stack.push(c)}return seen.size}
function bounds(object){object?.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(object,true);return{box,size:box.getSize(new THREE.Vector3()),center:box.getCenter(new THREE.Vector3())}}
const valid=info=>Boolean(info&&!info.box.isEmpty()&&info.size.x>.01&&info.size.y>=0&&info.size.z>.01);
function setWorldPosition(object,position){if(!object?.parent){object?.position.copy(position);return}object.parent.updateWorldMatrix?.(true,false);object.position.copy(object.parent.worldToLocal(position.clone()))}
function moveWorld(object,delta){object.getWorldPosition(v[0]);setWorldPosition(object,v[0].add(delta))}
function findTable(){return window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')||table||null}
function findEric(){return window.SVR_PHASE391_ERIC_AUTHORITY||window.SVR_PHASE388_ERIC_AUTHORITY||scene?.getObjectByName?.('PHASE391_AUTHORITATIVE_ERIC_DEALER')||eric||null}
function activeCamera(){const value=renderer?.xr?.isPresenting?renderer.xr.getCamera(camera):camera;return value?.cameras?.[0]||value||camera}
function playerRig(){return window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG||window.SVR_PLAYER_RIG||window.__SVR_PLAYER_RIG||null}
function tableForward(object){object?.getWorldQuaternion(q);const f=v[0].set(0,0,1).applyQuaternion(q).setY(0);if(f.lengthSq()<.001)f.set(0,0,1);return f.normalize().clone()}
function label(object){const mats=Array.isArray(object?.material)?object.material:[object?.material];return `${object?.name||''} ${mats.map(m=>m?.name||'').join(' ')}`.toLowerCase()}

function detectBaseLine(info){let best=null;walk(table,object=>{if(!object?.isMesh)return;let b;try{b=bounds(object)}catch{return}if(!valid(b))return;const low=b.center.y<info.box.min.y+info.size.y*.30,thin=b.size.y<Math.max(.09,info.size.y*.13),wide=b.size.x>info.size.x*.28||b.size.z>info.size.z*.28;if(!low||!thin||!wide)return;const text=label(object),named=/base|bottom|lower|trim|line|ring|frame|foot|feet|leg/.test(text);const score=(b.size.x+b.size.z)*2+(named?20:0)-Math.abs(b.center.y)*2;if(!best||score>best.score)best={object,info:b,score,named}});return best}
function calibrateTable(){
  table=findTable()||table;if(!table)return false;let info=bounds(table);if(!valid(info))return false;
  if(!table.userData?.svrPhase395Scaled){const width=Math.max(info.size.x,info.size.z),xz=clamp(TARGET_TABLE_WIDTH/Math.max(width,.001),.92,1.18);table.scale.x*=xz;table.scale.z*=xz;table.updateWorldMatrix?.(true,true);info=bounds(table);const desiredHeight=TARGET_TABLE_TOP-TARGET_TABLE_BOTTOM,y=clamp(desiredHeight/Math.max(info.size.y,.001),.86,1.14);table.scale.y*=y;table.userData={...(table.userData||{}),svrPhase395Scaled:true,svrPhase395Build:BUILD};table.updateWorldMatrix?.(true,true)}
  info=bounds(table);const base=detectBaseLine(info);let delta=TARGET_TABLE_BOTTOM-info.box.min.y,method='table-bottom';if(base?.named){delta=0.008-base.info.center.y;method=`detected-base-line:${base.object.name||'unnamed'}`}
  moveWorld(table,new THREE.Vector3(0,delta,0));table.updateWorldMatrix?.(true,true);info=bounds(table);const liveBase=detectBaseLine(info);
  state.tableWidth=+Math.max(info.size.x,info.size.z).toFixed(3);state.tableTop=+info.box.max.y.toFixed(3);state.tableBottom=+info.box.min.y.toFixed(3);state.baseLineY=liveBase?+liveBase.info.center.y.toFixed(3):null;state.baseAnchorMethod=method;return Math.abs(state.tableWidth-TARGET_TABLE_WIDTH)<.09&&state.tableBottom<.04&&state.tableBottom>-.12
}

function alignFelt(){
  felt=window.SVR_PHASE393_VISIBLE_FELT||scene?.getObjectByName?.('PHASE393_VISIBLE_RECESSED_INNER_FELT')||felt;
  const old=window.SVR_PHASE390_PLAY_SURFACE;if(old&&old!==felt){old.visible=false;old.userData={...(old.userData||{}),svrPhase395RetiredCover:true}}
  if(!felt||!table)return false;const info=bounds(table);if(!valid(info))return false;
  table.getWorldQuaternion(q);felt.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2));const width=Math.max(info.size.x,info.size.z),depth=Math.min(info.size.x,info.size.z);felt.scale.set(width*.405,depth*.84,1);const position=info.center.clone();position.y=info.box.max.y-TARGET_FELT_RECESS;setWorldPosition(felt,position);felt.visible=true;felt.renderOrder=Math.max(felt.renderOrder||0,1395);felt.frustumCulled=false;
  const mats=Array.isArray(felt.material)?felt.material:[felt.material];for(const m of mats){if(!m)continue;m.visible=true;m.transparent=false;m.opacity=1;m.depthTest=true;m.depthWrite=true;if(m.color)m.color.setHex(0xffffff);if('roughness'in m)m.roughness=.82;if('metalness'in m)m.metalness=.01;if(m.emissive){m.emissive.setHex(0x12051b);m.emissiveIntensity=.30}m.needsUpdate=true}
  felt.updateWorldMatrix?.(true,true);const f=bounds(felt);state.feltTop=+f.box.max.y.toFixed(3);window.SVR_PHASE395_PLAY_SURFACE=felt;return true
}

function polishTableMaterials(){if(!table)return 0;let count=0;walk(table,object=>{if(!object?.isMesh||!object.material)return;const text=label(object);const mats=Array.isArray(object.material)?object.material:[object.material];for(const m of mats){if(!m||m.userData?.svrPhase395Polished)continue;if('roughness'in m&&/rail|handrest|armrest|leather|pad/.test(text))m.roughness=Math.min(m.roughness??.6,.48);if('metalness'in m&&/metal|chrome|silver|trim/.test(text))m.metalness=Math.max(m.metalness??0,.55);if('roughness'in m&&/metal|chrome|silver|trim/.test(text))m.roughness=Math.min(m.roughness??.5,.32);m.userData={...(m.userData||{}),svrPhase395Polished:true};m.needsUpdate=true;count++}object.visible=true});return count}

function ensureLighting(){
  if(!scene||!table)return false;if(!lighting?.parent){lighting=new THREE.Group();lighting.name='PHASE395_QUEST_TABLE_LIGHTING';const hemi=new THREE.HemisphereLight(0xc8e5ff,0x25152f,.72);hemi.name='PHASE395_HEMISPHERE';const key=new THREE.PointLight(0xffe6c7,2.15,7.5,2);key.name='PHASE395_TABLE_KEY';key.castShadow=false;const fill=new THREE.PointLight(0xb99cff,1.15,5.5,2);fill.name='PHASE395_TABLE_FILL';fill.castShadow=false;lighting.add(hemi,key,fill);scene.add(lighting)}
  const info=bounds(table);const key=lighting.getObjectByName('PHASE395_TABLE_KEY'),fill=lighting.getObjectByName('PHASE395_TABLE_FILL');if(key)key.position.copy(info.center).add(new THREE.Vector3(0,1.65,.15));if(fill)fill.position.copy(info.center).add(new THREE.Vector3(-1.25,.95,-.5));if(renderer&&Number.isFinite(renderer.toneMappingExposure)){renderer.toneMappingExposure=Math.max(renderer.toneMappingExposure,1.08);state.rendererExposure=+renderer.toneMappingExposure.toFixed(2)}state.lightingReady=true;return true
}

function restorePelvis(){if(!eric)return;let pelvis=null;walk(eric,o=>{if(pelvis||!o?.isBone)return;const n=String(o.name||'').replace(/[^a-z0-9]/ig,'').toLowerCase();if(/^(hips?|pelvis|root)$/.test(n)||/mixamorighips/.test(n))pelvis=o},12000);if(!pelvis)return;if(!pelvis.userData?.svrPhase395BasePosition)pelvis.userData={...(pelvis.userData||{}),svrPhase395BasePosition:pelvis.position.clone()};const base=pelvis.userData.svrPhase395BasePosition;if(base?.isVector3)pelvis.position.copy(base)}
function anchorEric(){
  eric=findEric()||eric;if(!eric||!table)return false;restorePelvis();const info=bounds(table);if(!valid(info))return false;const forward=tableForward(table),half=Math.min(info.size.x,info.size.z)/2,pos=info.center.clone().addScaledVector(forward,-(half+DEALER_GAP));pos.y=0;setWorldPosition(eric,pos);const dx=info.center.x-pos.x,dz=info.center.z-pos.z;eric.rotation.set(0,Math.atan2(dx,dz),0);eric.visible=true;eric.updateWorldMatrix?.(true,true);let e=bounds(eric);if(valid(e)&&Math.abs(e.box.min.y)>.002){moveWorld(eric,new THREE.Vector3(0,-e.box.min.y,0));eric.updateWorldMatrix?.(true,true);e=bounds(eric)}state.ericFloorDrift=valid(e)?+Math.abs(e.box.min.y).toFixed(4):null;state.ericGrounded=valid(e)&&state.ericFloorDrift<=.025;return state.ericGrounded
}

function setRigWorldHead(targetHead,lookTarget){const rig=playerRig(),view=activeCamera();if(!rig?.position||!view)return false;view.getWorldPosition(v[1]);rig.getWorldPosition(v[2]);const desiredRig=v[2].clone().add(targetHead).sub(v[1]);const local=rig.parent?rig.parent.worldToLocal(desiredRig.clone()):desiredRig;rig.position.copy(local);view.getWorldQuaternion(q);const cameraForward=v[0].set(0,0,-1).applyQuaternion(q).setY(0);view.getWorldPosition(v[1]);const desiredForward=v[3].set(lookTarget.x-v[1].x,0,lookTarget.z-v[1].z);if(cameraForward.lengthSq()>.001&&desiredForward.lengthSq()>.001){cameraForward.normalize();desiredForward.normalize();const delta=Math.atan2(desiredForward.x,desiredForward.z)-Math.atan2(cameraForward.x,cameraForward.z);rig.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))}return true}
function seatUser(reason='phase395'){const info=table?bounds(table):null;if(!valid(info))return false;const forward=tableForward(table),half=Math.min(info.size.x,info.size.z)/2,head=info.center.clone().addScaledVector(forward,half+SEATED_RAIL_GAP);head.y=SEATED_EYE_HEIGHT;const look=info.center.clone();look.y=(state.feltTop||info.box.max.y-TARGET_FELT_RECESS)+.08;const moved=setRigWorldHead(head,look);if(!moved)return false;const view=activeCamera();view?.getWorldPosition(v[2]);state.userEyeHeight=view?+v[2].y.toFixed(3):null;state.userRailGap=SEATED_RAIL_GAP;state.userSeated=Boolean(view&&Math.abs(v[2].y-SEATED_EYE_HEIGHT)<.12);state.seatApplications++;state.lastSeatReason=reason;window.SVR_PHASE395_FRONT_SEAT={head:head.clone(),look:look.clone(),reason};return state.userSeated}
function requestSeat(ms=22000){seatUntil=Math.max(seatUntil,performance.now()+ms)}

function cardObjects(){const root=scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');const cards=[];if(root)walk(root,o=>{if(o?.isMesh&&/^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(o.name||'')))cards.push(o)},4000);return{root,cards}}
async function ensureCards(reason='sweep'){
  if(!scene||!table)return false;let current=cardObjects();if(!state.cardsRebuilt||!current.root||current.cards.length<17){try{await window.SVR_PHASE341_REBUILD?.();state.cardsRebuilt=true}catch(error){state.lastError=`CARDS_REBUILD:${error?.message||error}`};current=cardObjects()}
  if(current.root){current.root.visible=true;current.root.traverse?.(o=>{if(!o?.isMesh)return;o.frustumCulled=false;if(/^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(o.name||''))){o.renderOrder=Math.max(o.renderOrder||0,9395);const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;m.depthTest=true;m.depthWrite=false;m.transparent=true;if('toneMapped'in m)m.toneMapped=false;m.needsUpdate=true}}})}
  state.cardRootReady=Boolean(current.root);state.cardMeshesReady=current.cards.length;state.visibleCards=current.cards.filter(o=>o.visible).length;const audit=window.SVR_RUN_PHASE336_POKER_AUDIT?.();const phase=String(audit?.phase||'').toLowerCase();if(state.cardRootReady&&state.cardMeshesReady>=17&&state.visibleCards===0&&['idle','showdown',''].includes(phase)&&state.handStartAttempts<2){state.handStartAttempts++;try{window.SVR_POKER_NEXT_HAND?.()}catch{}}
  state.lastCardReason=reason;return state.cardRootReady&&state.cardMeshesReady>=17
}

async function sweep(reason='interval'){
  if(!ACTIVE)return false;try{scene=window.__SVR_SCENE__||scene;renderer=window.__SVR_RENDERER__||renderer;camera=window.__SVR_CAMERA__||camera;table=findTable()||table;eric=findEric()||eric;if(!scene||!table)return false;calibrateTable();alignFelt();polishTableMaterials();ensureLighting();anchorEric();await ensureCards(reason);if(performance.now()<seatUntil)seatUser(`bounded:${reason}`);state.installed=Boolean(state.tableWidth&&state.lightingReady&&state.ericGrounded&&state.cardRootReady);state.lastReason=reason;state.checkedAt=new Date().toISOString();window.SVR_PHASE395_QUEST_STATE={...state};return state.installed}catch(error){state.lastError=String(error?.stack||error?.message||error);return false}}
function frame(now){if(!ACTIVE)return;try{if(now-lastTableSweep>180){lastTableSweep=now;calibrateTable();alignFelt();anchorEric()}if(now-lastCardSweep>950){lastCardSweep=now;void ensureCards('frame')}if(performance.now()<seatUntil&&now-lastSeatSweep>120){lastSeatSweep=now;seatUser('frame')}}catch(error){state.lastError=String(error?.message||error)}raf=requestAnimationFrame(frame)}
function qa(){const info=table?bounds(table):null,e=eric?bounds(eric):null,cards=cardObjects();const result={...state,liveTableWidth:valid(info)?+Math.max(info.size.x,info.size.z).toFixed(3):null,liveTableBottom:valid(info)?+info.box.min.y.toFixed(3):null,liveEricFloor:valid(e)?+e.box.min.y.toFixed(4):null,liveVisibleCards:cards.cards.filter(o=>o.visible).length,pass:Boolean(state.installed&&state.ericGrounded&&state.cardMeshesReady>=17&&state.lightingReady&&state.userSeated&&!state.lastError),checkedAt:new Date().toISOString()};window.SVR_PHASE395_QUEST_STATE=result;return result}

async function install(){if(!ACTIVE)return;window.SVR_PHASE395_QUEST_AUTHORITY_ACTIVE=true;const started=performance.now();while(performance.now()-started<30000){scene=window.__SVR_SCENE__||scene;renderer=window.__SVR_RENDERER__||renderer;camera=window.__SVR_CAMERA__||camera;table=findTable()||table;eric=findEric()||eric;if(scene&&camera&&table&&eric)break;await wait(100)}requestSeat(26000);await sweep('install');for(const delay of [120,300,650,1200,2200,4000,7000,11000,16000,22000])setTimeout(()=>void sweep(`startup-${delay}`),delay);window.SVR_PHASE390_DIRECT_FRONT_SEAT=(reason='phase395-api')=>{requestSeat(6000);return seatUser(reason)};window.SVR_PHASE388_DIRECT_SEAT=window.SVR_PHASE390_DIRECT_FRONT_SEAT;renderer?.xr?.addEventListener?.('sessionstart',()=>{requestSeat(30000);setTimeout(()=>seatUser('xr-session-start'),180)});if(!timer)timer=setInterval(()=>void sweep('interval'),900);if(!raf)raf=requestAnimationFrame(frame);window.dispatchEvent(new CustomEvent('svr:phase395-quest-ready'))}

window.SVR_PHASE395_QUEST_SWEEP=sweep;
window.SVR_PHASE395_QUEST_QA=qa;
window.SVR_PHASE395_SEAT_USER=()=>{requestSeat(7000);return seatUser('manual')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void install(),{once:true});else void install();
