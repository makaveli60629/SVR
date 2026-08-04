import * as THREE from 'three';
import { state, players, resetTable, audit } from './phase336_authoritative_engine.js';

export const BUILD='PHASE-375-ANDROID-PLAYABLE-SINGLE-JOIN-AUTHORITY-LOCK';
const ACTIVE=(window.SVR_PLATFORM||document.body?.dataset?.platform||'').toLowerCase()==='android'||/\/game\/android\.html$/i.test(location.pathname);
const SAVE='SVR_PHASE336_POKER_SNAPSHOT_V1';
const TABLES=['PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED','PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER','PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED','PHASE326_ANDROID_TABLE_FALLBACK','PHASE375_ANDROID_EMERGENCY_TABLE'];
const DEAL=['SVR_RESET_POKER_TABLE','SVR_POKER_NEXT_HAND','SVR_PHASE336_START_HAND','SVR_PHASE355_PLAY_FULL_HAND'];
const originals=new Map();
const runtime={build:BUILD,active:ACTIVE,installed:false,joined:false,joinAttempts:0,joinSuccesses:0,blockedDeals:0,tableReady:false,tableName:null,emergencyTableCreated:false,lowPower:false,lastError:null,checkedAt:null};
let entry,status,join,leave,emergency,observer,timer,joining,frameAt=performance.now();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const joined=()=>window.SVR_PHASE375_JOINED===true;

function table(){
  const scene=window.__SVR_SCENE__;
  let found=window.SVR_TABLE_AUTHORITY;
  if(found?.isObject3D&&found!==emergency)return found;
  for(const name of TABLES){found=scene?.getObjectByName?.(name);if(found?.isObject3D&&found!==emergency)break;}
  if(found?.isObject3D){found.visible=true;window.SVR_TABLE_AUTHORITY=found;if(emergency?.parent){emergency.removeFromParent();emergency=null;}return found;}
  if(emergency?.isObject3D){emergency.visible=true;window.SVR_TABLE_AUTHORITY=emergency;return emergency;}
  return null;
}
function publish(reason='state'){
  const t=table();Object.assign(runtime,{joined:joined(),tableReady:Boolean(t?.visible),tableName:t?.name||null,checkedAt:new Date().toISOString()});
  return window.SVR_PHASE375_ANDROID_STATE={...runtime,reason};
}
function message(text,error=false){if(status){status.textContent=text;status.dataset.error=error?'1':'0';}runtime.lastError=error?String(text):null;publish(error?'error':'status');}
function styles(){
  if(document.getElementById('svr375-style'))return;
  const s=document.createElement('style');s.id='svr375-style';s.textContent=`
#svr375Entry{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:end center;padding:18px 18px max(22px,env(safe-area-inset-bottom));background:linear-gradient(180deg,transparent,rgba(2,4,10,.9));font-family:system-ui;color:#fff}#svr375Entry[hidden],#svr375Leave[hidden]{display:none!important}.svr375-card{width:min(540px,96vw);padding:16px;border:1px solid #7ffcff;border-radius:22px;background:rgba(3,7,17,.95);box-shadow:0 24px 80px #000}.svr375-head{display:flex;align-items:center;gap:12px}.svr375-head img{width:56px;height:56px;object-fit:contain}.svr375-head strong{font-size:20px;letter-spacing:.08em}.svr375-head span{display:block;color:#d8fbff;font-size:12px}.svr375-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.svr375-actions button{min-height:50px;border:1px solid #ffd98a;border-radius:14px;background:#111827;color:#fff;font-weight:950}.svr375-actions .primary{grid-column:1/-1;border:0;background:linear-gradient(135deg,#7ffcff,#a45cff);color:#02040a;font-size:18px}#svr375Status{text-align:center;color:#ffd98a;font-weight:850;margin-top:9px}#svr375Status[data-error="1"]{color:#ff9fbd}#svr375Leave{position:fixed;left:10px;top:10px;z-index:2147483600;min-height:42px;padding:0 14px;border:1px solid #ffd98a;border-radius:999px;background:rgba(2,7,15,.88);color:#fff;font-weight:950}
body.svr375-lobby #svr326Root,body.svr375-lobby #svr343Hud,body.svr375-lobby #svr347Root,body.svr375-lobby #svr369Entry,body.svr375-lobby #svr372Entry,body.svr375-play #svr326Root,body.svr375-play #svr343Hud,body.svr375-play #svr369Entry,body.svr375-play #svr372Entry{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}body.svr375-play #svr347Root{display:block!important;visibility:visible!important;opacity:1!important}body.svr375-play #svr347Actions [data-ui="seat"]{display:none!important}body.svr375-lobby [aria-label="Your cards"],body.svr375-lobby [class*="hole-card"]{display:none!important}@media(orientation:landscape){#svr375Entry{place-items:center}.svr375-card{width:min(470px,72vw)}}`;
  document.head.appendChild(s);
}
function ui(){
  if(entry)return;
  entry=document.createElement('section');entry.id='svr375Entry';entry.innerHTML=`<div class="svr375-card"><div class="svr375-head"><img src="/logo.png" alt="SVR Poker"><div><strong>SVR POKER</strong><span>Phase 375 playable Android table</span></div></div><div class="svr375-actions"><button id="svr375Join" class="primary">JOIN NOW</button><button id="svr375Low">LOW POWER</button><button id="svr375Reload">RELOAD GAME</button></div><div id="svr375Status">Loading the verified poker table…</div></div>`;
  leave=document.createElement('button');leave.id='svr375Leave';leave.textContent='LEAVE TABLE';leave.hidden=true;document.body.append(entry,leave);status=entry.querySelector('#svr375Status');join=entry.querySelector('#svr375Join');
  join.onclick=joinTable;leave.onclick=leaveTable;entry.querySelector('#svr375Low').onclick=()=>lowPower('manual');entry.querySelector('#svr375Reload').onclick=()=>location.replace(`/game/android.html?channel=stable&v=phase375&reload=${Date.now()}`);
}
function emergencyTable(){
  if(table()||emergency)return table();const scene=window.__SVR_SCENE__;if(!scene?.isScene)return null;
  const center=window.SVR_PHASE341_TABLE_LAYOUT?.center||{x:0,z:.75};emergency=new THREE.Group();emergency.name='PHASE375_ANDROID_EMERGENCY_TABLE';emergency.position.set(Number(center.x||0),0,Number(center.z||.75));
  const mat=(c,r=.55,m=.08)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,side:THREE.DoubleSide});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.18,2.18,.22,48),mat(0x140918,.42,.28));base.scale.z=.68;base.position.y=.56;emergency.add(base);
  const felt=new THREE.Mesh(new THREE.CylinderGeometry(1.87,1.87,.08,48),mat(0x08242a,.9,.01));felt.scale.z=.67;felt.position.y=.72;emergency.add(felt);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(2,.15,12,72),mat(0x28102f,.35,.2));rail.rotation.x=Math.PI/2;rail.scale.z=.68;rail.position.y=.78;emergency.add(rail);
  emergency.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});scene.add(emergency);window.SVR_TABLE_AUTHORITY=emergency;runtime.emergencyTableCreated=true;return emergency;
}
function lowPower(reason='automatic'){
  try{const r=window.__SVR_RENDERER__;window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.('android');r?.setPixelRatio?.(Math.min(.82,window.devicePixelRatio||1));if(r?.shadowMap)r.shadowMap.enabled=false;runtime.lowPower=true;message(`Low-power rendering active (${reason}).`);return true;}catch(e){runtime.lastError=String(e);return false;}
}
function park(reason='lobby'){
  if(joined())return false;try{localStorage.removeItem(SAVE);}catch{}
  Object.assign(state,{handNo:0,dealer:-1,phase:'idle',deck:[],burn:[],community:[],pot:0,pots:[],currentBet:0,minRaise:Number(state.bigBlind||20),lastAggressor:null,current:0,waitingHuman:false,winner:null,winners:[],actionLog:[],settledPot:0,lastAction:'Press JOIN NOW'});
  for(const p of players)Object.assign(p,{stack:15000,folded:false,allIn:false,bet:0,contributed:0,acted:false,raiseClosed:false,hand:[],lastAction:'Waiting to join'});
  window.dispatchEvent(new CustomEvent('svr:poker-state',{detail:audit()}));publish(`park:${reason}`);return true;
}
function guard(){
  for(const name of DEAL){const current=window[name];if(typeof current!=='function'||current.__svr375===BUILD)continue;if(!originals.has(name))originals.set(name,current.bind(window));const original=originals.get(name);const wrapped=(...args)=>{if(!joined()){runtime.blockedDeals++;park(`blocked:${name}`);return false;}return original(...args);};wrapped.__svr375=BUILD;window[name]=wrapped;}
}
function clean(){
  document.querySelectorAll('button').forEach(b=>{if(b===join||b===leave||b.closest('#svr375Entry')||b.closest('#runtimeRecovery')||b.id==='startRuntimeBtn')return;if(joined()&&b.closest('#svr347Actions')&&b.dataset.ui!=='seat')return;const t=(b.textContent||'').trim().toUpperCase();if(['SIT','SEAT','SIT DOWN','SIT AT TABLE','PLAY GAME','JOIN TABLE','JOIN NOW','LOBBY','CENTER'].includes(t)){b.hidden=true;b.setAttribute('aria-hidden','true');try{b.inert=true;}catch{}}});
}
function setJoined(value,reason){
  window.SVR_PHASE375_JOINED=Boolean(value);window.SVR_PHASE363_JOINED_IMMEDIATE=Boolean(value);window.SVR_PHASE363_STATE={...(window.SVR_PHASE363_STATE||{}),joined:Boolean(value),gameState:value?'SEATED':'LOBBY'};document.body.classList.toggle('svr375-lobby',!value);document.body.classList.toggle('svr375-play',value);entry.hidden=Boolean(value);leave.hidden=!value;window.dispatchEvent(new CustomEvent('svr:phase363-immediate-join-state',{detail:{build:BUILD,joined:Boolean(value),reason,at:Date.now()}}));clean();publish(reason);
}
async function ready(timeout=20000){
  const start=performance.now();while(performance.now()-start<timeout){guard();const t=table()||(performance.now()-start>4500?emergencyTable():null);if(t?.isObject3D&&typeof window.SVR_PHASE347_SIT==='function'&&typeof window.SVR_POKER_ACTION==='function')return t;await wait(140);}return null;
}
async function joinTable(){
  if(joining)return joining;joining=(async()=>{runtime.joinAttempts++;join.disabled=true;join.textContent='JOINING…';message('Preparing the table, seat, and first hand…');try{if(!await ready())throw new Error('TABLE_OR_CONTROLLER_NOT_READY');setJoined(true,'join-now');if(window.SVR_PHASE347_SIT?.()===false)throw new Error('SEAT_POSITION_NOT_READY');await wait(160);resetTable(15000);window.SVR_PHASE357_DIRECT_CAMERA_CORRECT?.();window.SVR_PHASE365_SYNC?.();window.SVR_PHASE367_DEVICE_CALIBRATE?.();runtime.joinSuccesses++;message('Joined. Your first hand is active.');return true;}catch(e){runtime.lastError=String(e?.message||e);setJoined(false,'join-failed');park('join-failed');message(`Join recovery: ${runtime.lastError}. Press JOIN NOW again.`,true);return false;}finally{join.disabled=false;join.textContent='JOIN NOW';joining=null;publish('join-finished');}})();return joining;
}
function leaveTable(){window.SVR_PHASE347_LEAVE?.();setJoined(false,'leave');park('leave');message('Table ready. Press JOIN NOW to start a fresh hand.');return true;}
function qa(){const t=table();const visible=[...document.querySelectorAll('button')].filter(b=>!b.hidden&&b.offsetParent&&['JOIN NOW','JOIN TABLE','SIT','SEAT','PLAY GAME'].includes((b.textContent||'').trim().toUpperCase()));return window.SVR_PHASE375_ANDROID_QA_STATE={...publish('qa'),entryCount:document.querySelectorAll('#svr375Entry').length,visibleJoinLikeControls:visible.length,cardsBeforeJoin:joined()?null:(players[0]?.hand?.length||0),pass:Boolean(ACTIVE&&t?.isObject3D&&document.querySelectorAll('#svr375Entry').length===1&&(joined()||visible.length===1)&&(joined()||(players[0]?.hand?.length||0)===0)&&!runtime.lastError)};}
function frame(now){const gap=now-frameAt;frameAt=now;if(gap>1500&&!runtime.lowPower)lowPower('frame recovery');requestAnimationFrame(frame);}
function install(){
  if(!ACTIVE||runtime.installed)return;runtime.installed=true;document.body.dataset.build=BUILD;document.body.dataset.release=BUILD;styles();ui();setJoined(false,'clean-boot');park('clean-boot');guard();lowPower('startup');clean();observer=new MutationObserver(()=>{clean();guard();});observer.observe(document.body,{childList:true,subtree:true});timer=setInterval(()=>{guard();clean();if(!table())emergencyTable();if(!joined())park('watchdog');if(!joined())message(table()?'Table ready. Press JOIN NOW.':'Loading the verified poker table…');publish('watchdog');},700);window.SVR_PHASE375_JOIN=joinTable;window.SVR_PHASE375_LEAVE=leaveTable;window.SVR_PHASE375_LOW_POWER=()=>lowPower('manual');window.SVR_PHASE375_ANDROID_QA=qa;requestAnimationFrame(frame);window.dispatchEvent(new CustomEvent('svr:phase375-android-ready',{detail:qa()}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('beforeunload',()=>{observer?.disconnect?.();clearInterval(timer);},{once:true});
