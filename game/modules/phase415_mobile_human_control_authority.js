/* PHASE-415-MOBILE-HUMAN-CONTROL-AUTHORITY-LOCK */
import {legalRaiseWindow} from './phase398_android_raise_rules.js?v=phase398';

const BUILD='PHASE-415-MOBILE-HUMAN-CONTROL-AUTHORITY-LOCK';
const USER=0,TURN_SECONDS=15;
const VISUAL_ORDER=Object.freeze([0,5,1,2,3,4]);
const runtime={build:BUILD,installed:false,turnRescues:0,nullHandoffRescues:0,staleActorRescues:0,pressNormalizations:0,buttonSyncs:0,lastCandidate:null,lastReason:null,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const buttons=()=>[...document.querySelectorAll('.actions button[data-a]')];
const actor=v=>Number.isInteger(v)?v:null;
const streetName=s=>['PRE-FLOP','FLOP','TURN','RIVER','SHOWDOWN'][Number(s)||0]||'POKER';
function eligible(p){return Boolean(p&&!p.folded&&!p.allIn&&Number(p.stack||0)>0)}
function pending(g,p){return Boolean(eligible(p)&&(!p.acted||Number(p.streetBet||0)<Number(g.currentBet||0)))}
function streetTrail(g){return (g?.actionTrail||[]).filter(x=>Number(x.hand)===Number(g.hand)&&Number(x.street)===Number(g.street))}
function lastActor(g){
  if(Number.isInteger(g?.lastActor))return g.lastActor;
  const rows=streetTrail(g);return rows.length?actor(rows[rows.length-1]?.index):null;
}
function nextPendingAfter(g,from){
  const pos=VISUAL_ORDER.indexOf(Number(from));if(pos<0)return null;
  for(let step=1;step<=VISUAL_ORDER.length;step++){
    const index=VISUAL_ORDER[(pos+step)%VISUAL_ORDER.length],p=g?.players?.[index];
    if(pending(g,p))return index;
  }
  return null;
}
function roundAnchor(g){
  if(Number.isInteger(g?.roundAnchor))return g.roundAnchor;
  if(Number(g?.street)===0&&Number.isInteger(g?.bigBlind))return g.bigBlind;
  if(Number.isInteger(g?.dealer))return g.dealer;
  return null;
}
function deterministicCandidate(g){
  if(!g||g.handOver||!Array.isArray(g.players)||g.players.length<6)return null;
  const last=lastActor(g);
  if(last!==null){const after=nextPendingAfter(g,last);if(after!==null)return after}
  const anchor=roundAnchor(g);
  if(anchor!==null){const after=nextPendingAfter(g,anchor);if(after!==null)return after}
  const expected=actor(g.expectedActor);if(expected!==null&&pending(g,g.players[expected]))return expected;
  const active=actor(g.activePlayer);if(active!==null&&pending(g,g.players[active]))return active;
  return null;
}
function raiseAllowed(g,user){
  try{return Boolean(legalRaiseWindow({currentBet:Number(g.currentBet||0),lastFullRaiseSize:Number(g.lastFullRaiseSize||100),streetBet:Number(user.streetBet||0),stack:Number(user.stack||0),raiseLocked:Boolean(user.raiseLocked)}).canRaise)}catch{return false}
}
function humanDecisionOpen(g){const user=g?.players?.[USER];return Boolean(g&&user&&!g.handOver&&actor(g.activePlayer)===USER&&user.active===true&&user.acted===false&&eligible(user))}
function syncButtons(){
  const g=game(),user=g?.players?.[USER],open=humanDecisionOpen(g),host=$('.actions');
  if(host){host.style.pointerEvents='auto';host.style.touchAction='manipulation';host.style.position='relative';host.style.zIndex='700'}
  for(const button of buttons()){
    const type=button.dataset.a,enabled=Boolean(open&&(type!=='raise'||raiseAllowed(g,user)));
    button.style.pointerEvents='auto';button.style.touchAction='manipulation';button.style.userSelect='none';button.style.webkitUserSelect='none';
    button.disabled=!enabled;button.setAttribute('aria-disabled',enabled?'false':'true');button.classList.toggle('phase415-action-ready',enabled);
  }
  document.body.classList.toggle('phase415-human-decision-open',open);runtime.buttonSyncs+=1;return open;
}
function clearTimers(g){try{clearInterval(g.turnInterval)}catch{}try{clearTimeout(g.botTimer)}catch{}g.turnInterval=null;g.botTimer=null}
function forceHuman(g,reason){
  const user=g?.players?.[USER];if(!user||!eligible(user))return false;
  const candidate=deterministicCandidate(g);if(candidate!==USER&&actor(g.expectedActor)!==USER&&actor(g.activePlayer)!==USER)return false;
  const previous=actor(g.activePlayer);clearTimers(g);user.acted=false;user.active=true;g.activePlayer=USER;g.expectedActor=USER;g.turnSeconds=TURN_SECONDS;
  g.players.forEach(p=>{if(p.index!==USER)p.active=false});
  const owed=Math.max(0,Number(g.currentBet||0)-Number(user.streetBet||0)),status=$('#status'),clock=$('#turnClock'),message=$('#tableMessage'),strip=$('.turn-strip');
  if(status)status.textContent=`${streetName(g.street)} • YOUR TURN`;
  if(clock)clock.textContent=String(TURN_SECONDS);
  if(message)message.textContent=`YOUR TURN • ${owed?`CALL $${Math.min(owed,Number(user.stack||0)).toLocaleString()} / RAISE / FOLD`:'CHECK / RAISE / FOLD'}`;
  strip?.classList.add('phase407-user-turn','phase409-user-turn-rescue','phase414-human-turn','phase415-human-turn');strip?.classList.remove('phase407-bot-turn');
  runtime.turnRescues+=1;if(previous===null)runtime.nullHandoffRescues+=1;else if(previous!==USER)runtime.staleActorRescues+=1;runtime.lastReason=reason;runtime.lastCandidate=candidate;
  g.phase415HumanControlRescues=runtime.turnRescues;g.phase415LastReason=reason;
  syncButtons();window.dispatchEvent(new CustomEvent('svr:user-turn-restored',{detail:{build:BUILD,reason,from:previous,to:USER,hand:g.hand,street:g.street}}));return true;
}
function reconcile(reason='POLL'){
  const g=game();if(!g||!Array.isArray(g.players)||g.players.length<6||g.handOver)return false;
  const user=g.players[USER],candidate=deterministicCandidate(g),active=actor(g.activePlayer),expected=actor(g.expectedActor);runtime.lastCandidate=candidate;
  if(candidate===USER&&pending(g,user)){
    if(active!==USER)return forceHuman(g,active===null?'NULL_HANDOFF_TO_HUMAN':'DETERMINISTIC_ORDER_TO_HUMAN');
    if(user.active!==true||user.acted!==false)return forceHuman(g,'NORMALIZE_HUMAN_DECISION');
  }else if(expected===USER&&pending(g,user)&&(active!==USER||user.active!==true||user.acted!==false))return forceHuman(g,'EXPECTED_HUMAN_DECISION');
  syncButtons();return false;
}
function eventButton(event){const path=typeof event.composedPath==='function'?event.composedPath():[];return path.find(n=>n?.matches?.('.actions button[data-a]'))||event.target?.closest?.('.actions button[data-a]')||null}
function normalizeBeforePress(event){
  const button=eventButton(event);if(!button)return;const g=game();if(!g)return;
  const before=humanDecisionOpen(g);reconcile('PRESS_PRECHECK');if(!before&&humanDecisionOpen(g))runtime.pressNormalizations+=1;syncButtons();
}
function install(){
  if(document.documentElement.dataset.phase415HumanControl==='1')return;
  document.documentElement.dataset.phase415HumanControl='1';
  document.addEventListener('pointerdown',normalizeBeforePress,true);
  document.addEventListener('touchstart',normalizeBeforePress,{capture:true,passive:true});
  window.addEventListener('svr:user-turn-restored',()=>setTimeout(()=>{reconcile('RESTORED_EVENT');syncButtons()},0));
  runtime.installed=true;
  const gate=$('#gateStatus');if(gate&&!/Phase 415/i.test(gate.textContent||''))gate.textContent+=' • Phase 415 mobile human-control authority active.';
}
function poll(){try{install();reconcile();runtime.lastError=null;runtime.checkedAt=new Date().toISOString()}catch(e){runtime.lastError=String(e?.message||e);runtime.checkedAt=new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,24)},{once:true});else{poll();setInterval(poll,24)}
window.SVR_PHASE415_HUMAN_CONTROL_QA=()=>{const g=game(),user=g?.players?.[USER],candidate=deterministicCandidate(g);syncButtons();return{...runtime,activePlayer:actor(g?.activePlayer),expectedActor:actor(g?.expectedActor),lastActor:lastActor(g),candidate,userPending:pending(g,user),userActive:user?.active??null,userActed:user?.acted??null,decisionOpen:humanDecisionOpen(g),actionButtons:buttons().length,visualOrder:[...VISUAL_ORDER],nullHandoffRecovery:true,touchDownNormalization:true,legacyPhase413Present:Boolean(window.SVR_PHASE413_HUMAN_ACTION_QA),legacyPhase414Present:Boolean(window.SVR_PHASE414_HUMAN_TURN_QA),pass:Boolean(runtime.installed&&buttons().length===4&&!runtime.lastError),checkedAt:new Date().toISOString()}};
