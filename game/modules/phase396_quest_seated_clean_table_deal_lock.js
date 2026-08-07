/* PHASE-396-QUEST-SEATED-CLEAN-TABLE-DEAL-LOCK */
import * as THREE from 'three';

export const BUILD='PHASE-396-QUEST-SEATED-CLEAN-TABLE-DEAL-LOCK';
const params=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const ACTIVE=params.get('platform')==='quest'||params.get('direct')==='1'||params.get('questfix')==='1'||/Quest|Oculus|Meta Quest/i.test(ua);
const state={build:BUILD,active:ACTIVE,installed:false,teleportDisabled:false,teleportObjectsHidden:0,seatLocked:false,seatCorrections:0,tabletopObjectsHidden:0,cardRootReady:false,cardMeshes:0,visibleCards:0,handStartAttempts:0,lastError:null,checkedAt:null};
let scene=null,renderer=null,table=null,felt=null,seatRig=null,seatPosition=null,seatYaw=null,raf=0,lastSeatAt=0,lastCleanAt=0,lastCardAt=0;
const box=new THREE.Box3(),size=new THREE.Vector3(),center=new THREE.Vector3();
const noop=()=>false;
const TELEPORT_FN_NAMES=['SVR_TELEPORT_TO','SVR_TELEPORT_COMMIT','SVR_TELEPORT_EXECUTE','SVR_TELEPORT_APPLY','SVR_SET_TELEPORT','SVR_TOGGLE_TELEPORT','SVR_TELEPORT_TOGGLE'];
const TELEPORT_OBJECT=/teleport|teleporter|teleportation|teleport[_ -]?ray|teleport[_ -]?arc|teleport[_ -]?marker|teleport[_ -]?reticle/i;
const TABLETOP_ASSET=/(POT|CHIP|TABLE.*LOGO|CENTER.*LOGO|LABEL|PANEL|DISPLAY|HOLOGRAM|BANNER|OVERLAY|PASS[_ -]?LINE|TABLE[_ -]?STATUS|INTERACTION[_ -]?ROOT|SPONSOR|AD[_ -]?ZONE)/i;
const KEEP=/(PHASE341_(?:HOLE|COMMUNITY|BURN)|PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT|PHASE393_VISIBLE_RECESSED_INNER_FELT|PHASE395_PLAY_SURFACE|PHASE393_ERIC_DEALING_CARD)/i;
function walk(root,fn,limit=30000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const o=stack.pop();if(!o||seen.has(o))continue;seen.add(o);try{fn(o)}catch{}for(const c of o.children||[])if(c&&!seen.has(c))stack.push(c)}return seen.size}
function bounds(object){object?.updateWorldMatrix?.(true,true);box.setFromObject(object,true);if(box.isEmpty())return null;box.getSize(size);box.getCenter(center);return{box:box.clone(),size:size.clone(),center:center.clone()}}
function inside(object,root){for(let current=object;current;current=current.parent)if(current===root)return true;return false}
function findTable(){return window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')||table||null}
function findFelt(){return window.SVR_PHASE395_PLAY_SURFACE||window.SVR_PHASE393_VISIBLE_FELT||scene?.getObjectByName?.('PHASE393_VISIBLE_RECESSED_INNER_FELT')||felt||null}
function playerRig(){return window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG||window.SVR_PLAYER_RIG||window.__SVR_PLAYER_RIG||null}
function disableTeleport(){
  window.SVR_TELEPORT_DISABLED=true;window.SVR_TELEPORT_ENABLED=false;window.SVR_PHASE396_SEATED_MODE=true;
  for(const name of TELEPORT_FN_NAMES){if(typeof window[name]==='function'&&!window[name].__svr396Disabled){const fn=noop;fn.__svr396Disabled=true;window[name]=fn}}
  let hidden=0;if(scene)walk(scene,o=>{if(!o?.isObject3D)return;const name=String(o.name||'');if(TELEPORT_OBJECT.test(name)){o.visible=false;o.userData={...(o.userData||{}),svrPhase396TeleportDisabled:true};hidden++}},24000);
  document.querySelectorAll('[id*="teleport" i],[class*="teleport" i],[data-action*="teleport" i],[data-mode*="teleport" i]').forEach(el=>{el.hidden=true;el.style.display='none'});
  state.teleportObjectsHidden=Math.max(state.teleportObjectsHidden,hidden);state.teleportDisabled=true;return true
}
function captureSeat(){
  const rig=playerRig();if(!rig?.position)return false;
  try{window.SVR_PHASE395_SEAT_USER?.()}catch{}
  seatRig=rig;seatPosition=rig.position.clone();seatYaw=rig.rotation?.y??0;state.seatLocked=true;return true
}
function enforceSeat(){
  const rig=seatRig||playerRig();if(!rig?.position)return false;if(!seatPosition){captureSeat();return Boolean(seatPosition)}
  rig.position.copy(seatPosition);if(rig.rotation)rig.rotation.y=seatYaw;rig.updateWorldMatrix?.(true,true);state.seatCorrections++;state.seatLocked=true;return true
}
function cleanTabletop(){
  table=findTable()||table;felt=findFelt()||felt;if(!scene||!table)return false;const t=bounds(table);if(!t)return false;const feltInfo=felt?bounds(felt):null,top=feltInfo?.box.max.y??(t.box.max.y-.12);let hidden=0;
  const known=['PHASE331_QUEST_TABLE_INTERACTION_ROOT','PHASE337_PHYSICAL_POT_ROOT','PHASE338_CHIP_INVENTORY_ROOT','PHASE390_RECESSED_BRANDED_PLAYING_SURFACE'];
  for(const name of known){const o=scene.getObjectByName?.(name);if(o&&o!==felt){o.visible=false;o.userData={...(o.userData||{}),svrPhase396TabletopHidden:true};hidden++}}
  walk(scene,o=>{
    if(!o?.isObject3D||o===scene||o===table||o===felt||inside(o,table)||inside(o,felt))return;const name=String(o.name||'');if(KEEP.test(name)||!TABLETOP_ASSET.test(name))return;let b;try{b=bounds(o)}catch{return}if(!b)return;
    const withinX=b.center.x>=t.box.min.x-.15&&b.center.x<=t.box.max.x+.15,withinZ=b.center.z>=t.box.min.z-.15&&b.center.z<=t.box.max.z+.15,nearTop=b.box.max.y>=top-.08&&b.box.min.y<=t.box.max.y+.65;
    if(withinX&&withinZ&&nearTop){o.visible=false;o.userData={...(o.userData||{}),svrPhase396TabletopHidden:true};hidden++}
  },26000);
  state.tabletopObjectsHidden=Math.max(state.tabletopObjectsHidden,hidden);return true
}
function cardObjects(){const root=scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');const cards=[];if(root)walk(root,o=>{if(o?.isMesh&&/^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(o.name||'')))cards.push(o)},5000);return{root,cards}}
async function ensureCards(){
  let current=cardObjects();if(!current.root||current.cards.length<17){try{await window.SVR_PHASE341_REBUILD?.()}catch{}current=cardObjects()}
  if(current.root){current.root.visible=true;current.root.traverse?.(o=>{if(!o?.isMesh)return;o.frustumCulled=false;if(/^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(o.name||''))){o.renderOrder=Math.max(o.renderOrder||0,9396);const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;m.depthTest=true;m.depthWrite=false;m.transparent=true;if('toneMapped'in m)m.toneMapped=false;m.needsUpdate=true}}})}
  state.cardRootReady=Boolean(current.root);state.cardMeshes=current.cards.length;state.visibleCards=current.cards.filter(o=>o.visible).length;
  const audit=window.SVR_RUN_PHASE336_POKER_AUDIT?.(),phase=String(audit?.phase||'').toLowerCase();if(state.cardRootReady&&state.cardMeshes>=17&&state.visibleCards===0&&state.handStartAttempts<3&&['','idle','showdown'].includes(phase)){state.handStartAttempts++;try{window.SVR_POKER_NEXT_HAND?.()}catch{}}
  return state.cardRootReady&&state.cardMeshes>=17
}
async function sweep(reason='interval'){
  if(!ACTIVE)return false;try{scene=window.__SVR_SCENE__||scene;renderer=window.__SVR_RENDERER__||renderer;table=findTable()||table;felt=findFelt()||felt;if(!scene||!table)return false;disableTeleport();cleanTabletop();if(!seatPosition)captureSeat();enforceSeat();await ensureCards();state.installed=Boolean(state.teleportDisabled&&state.seatLocked&&state.cardRootReady);state.lastReason=reason;state.checkedAt=new Date().toISOString();window.SVR_PHASE396_QUEST_STATE={...state};return state.installed}catch(error){state.lastError=String(error?.stack||error?.message||error);return false}}
function frame(now){if(!ACTIVE)return;try{if(now-lastSeatAt>50){lastSeatAt=now;disableTeleport();enforceSeat()}if(now-lastCleanAt>300){lastCleanAt=now;cleanTabletop()}if(now-lastCardAt>900){lastCardAt=now;void ensureCards()}}catch(error){state.lastError=String(error?.message||error)}raf=requestAnimationFrame(frame)}
function qa(){const cards=cardObjects();return{...state,liveCardMeshes:cards.cards.length,liveVisibleCards:cards.cards.filter(o=>o.visible).length,pass:Boolean(state.installed&&state.teleportDisabled&&state.seatLocked&&cards.cards.length>=17&&!state.lastError),checkedAt:new Date().toISOString()}}
async function install(){if(!ACTIVE)return;const started=performance.now();while(performance.now()-started<30000){scene=window.__SVR_SCENE__||scene;renderer=window.__SVR_RENDERER__||renderer;table=findTable()||table;if(scene&&table)break;await new Promise(resolve=>setTimeout(resolve,100))}await sweep('install');for(const delay of [100,250,600,1200,2200,4000,7000])setTimeout(()=>void sweep(`startup-${delay}`),delay);renderer?.xr?.addEventListener?.('sessionstart',()=>{seatPosition=null;setTimeout(()=>{captureSeat();void sweep('xr-session-start')},220)});if(!raf)raf=requestAnimationFrame(frame);window.dispatchEvent(new CustomEvent('svr:phase396-quest-ready'))}
window.SVR_PHASE396_QUEST_SWEEP=sweep;window.SVR_PHASE396_QUEST_QA=qa;window.SVR_PHASE396_TELEPORT_DISABLED=true;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void install(),{once:true});else void install();
