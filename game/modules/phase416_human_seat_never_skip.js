/* PHASE-416-HUMAN-SEAT-NEVER-SKIP-LOCK */
import './phase410_mobile_human_input_lock.js?v=phase410';

const BUILD='PHASE-416-HUMAN-SEAT-NEVER-SKIP-LOCK';
const USER=0,STARTING_STACK=15000,TURN_SECONDS=15;
const ORDER=Object.freeze([0,5,1,2,3,4]);
const runtime={build:BUILD,installed:false,joinStackResets:0,activeHandResets:0,holdsArmed:0,holdRescues:0,botTimerCancels:0,lastHold:null,lastReset:null,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const actor=v=>Number.isInteger(v)?v:null;
const mode=()=>String(new URLSearchParams(location.search).get('mode')||'regular').toLowerCase();
function eligible(p){return Boolean(p&&!p.folded&&!p.allIn&&Number(p.stack||0)>0)}
function pending(g,p){return Boolean(eligible(p)&&(!p.acted||Number(p.streetBet||0)<Number(g.currentBet||0)))}
function streetTrail(g){return (g?.actionTrail||[]).filter(row=>Number(row.hand)===Number(g.hand)&&Number(row.street)===Number(g.street))}
function nextPendingAfter(g,from){
  const pos=ORDER.indexOf(Number(from));if(pos<0)return null;
  for(let step=1;step<=ORDER.length;step++){
    const index=ORDER[(pos+step)%ORDER.length];if(pending(g,g?.players?.[index]))return index;
  }
  return null;
}
function lastActor(g){
  if(Number.isInteger(g?.lastActor))return g.lastActor;
  const rows=streetTrail(g);return rows.length?actor(rows[rows.length-1]?.index):null;
}
function anchor(g){
  if(Number.isInteger(g?.roundAnchor))return g.roundAnchor;
  if(Number(g?.street)===0&&Number.isInteger(g?.bigBlind))return g.bigBlind;
  return Number.isInteger(g?.dealer)?g.dealer:null;
}
function candidate(g){
  if(!g||g.handOver||!Array.isArray(g.players)||g.players.length<6)return null;
  const last=lastActor(g);if(last!==null){const next=nextPendingAfter(g,last);if(next!==null)return next}
  const start=anchor(g);if(start!==null){const next=nextPendingAfter(g,start);if(next!==null)return next}
  const expected=actor(g.expectedActor);if(expected!==null&&pending(g,g.players[expected]))return expected;
  const active=actor(g.activePlayer);if(active!==null&&pending(g,g.players[active]))return active;
  return null;
}
function resetSavedStack(reason){
  const g=game();if(!g)return false;
  g.stack=STARTING_STACK;
  try{localStorage.setItem('svr393stack',String(STARTING_STACK));localStorage.setItem('svr392stack',String(STARTING_STACK))}catch{}
  runtime.joinStackResets+=1;runtime.lastReset={reason,stack:STARTING_STACK,at:new Date().toISOString()};return true;
}
function normalizeBeforeJoin(){
  const g=game();if(!g||g.joined||mode()==='tournament')return false;
  const saved=Number(g.stack||0);if(Number.isFinite(saved)&&saved>0)return false;
  return resetSavedStack('ZERO_STACK_BEFORE_JOIN');
}
function earlyZeroStackHand(g){
  if(mode()==='tournament'||!g?.joined||g.handOver||Number(g.street)!==0)return false;
  const user=g.players?.[USER];if(!user||Number(user.stack||0)>0||Number(user.handContribution||0)>0)return false;
  const userActed=streetTrail(g).some(row=>Number(row.index)===USER);
  return !userActed&&Array.isArray(user.cards)&&user.cards.length===2;
}
function restartBadAdmission(g){
  if(!earlyZeroStackHand(g))return false;
  const key=`${g.hand}|${g.street}`;if(runtime.lastReset?.key===key)return false;
  g.stack=STARTING_STACK;try{localStorage.setItem('svr393stack',String(STARTING_STACK));localStorage.setItem('svr392stack',String(STARTING_STACK))}catch{}
  const restart=$('#restartChips');runtime.activeHandResets+=1;runtime.lastReset={key,reason:'CARDS_DEALT_TO_ZERO_STACK_HUMAN',stack:STARTING_STACK,at:new Date().toISOString()};
  restart?.click();return true;
}
function holdResolved(g){
  const h=runtime.lastHold;if(!h)return true;
  if(Number(g?.hand)!==h.hand||Number(g?.street)!==h.street)return true;
  const rows=streetTrail(g);return rows.slice(h.trailLength).some(row=>Number(row.index)===USER);
}
function cancelBotTimer(g){
  if(!g)return;try{if(g.botTimer){clearTimeout(g.botTimer);runtime.botTimerCancels+=1}}catch{}g.botTimer=null;
}
function forceHuman(g,reason){
  const user=g?.players?.[USER];if(!pending(g,user))return false;
  cancelBotTimer(g);try{clearInterval(g.turnInterval)}catch{}g.turnInterval=null;
  const wasOpen=actor(g.activePlayer)===USER&&user.active===true&&user.acted===false;
  user.acted=false;user.active=true;g.activePlayer=USER;g.expectedActor=USER;g.turnSeconds=Math.max(1,Number(g.turnSeconds||TURN_SECONDS));
  g.players.forEach(player=>{if(Number(player.index)!==USER)player.active=false});
  const status=$('#status'),clock=$('#turnClock'),message=$('#tableMessage'),strip=$('.turn-strip');
  if(status)status.textContent='YOUR TURN • ACTION REQUIRED';
  if(clock)clock.textContent=String(g.turnSeconds);
  const owed=Math.max(0,Number(g.currentBet||0)-Number(user.streetBet||0));
  if(message)message.textContent=owed?`YOUR TURN • CALL $${Math.min(owed,Number(user.stack||0)).toLocaleString()} / RAISE / FOLD`:'YOUR TURN • CHECK / RAISE / FOLD';
  strip?.classList.add('phase407-user-turn','phase409-user-turn-rescue','phase414-human-turn','phase415-human-turn','phase416-human-turn');strip?.classList.remove('phase407-bot-turn');
  if(!wasOpen){runtime.holdRescues+=1;window.dispatchEvent(new CustomEvent('svr:user-turn-restored',{detail:{build:BUILD,reason,hand:g.hand,street:g.street,to:USER}}))}
  return true;
}
function armHold(g,reason){
  if(candidate(g)!==USER||!pending(g,g.players?.[USER]))return false;
  if(runtime.lastHold&&!holdResolved(g))return true;
  runtime.lastHold={hand:Number(g.hand),street:Number(g.street),trailLength:streetTrail(g).length,reason,armedAt:new Date().toISOString()};runtime.holdsArmed+=1;
  forceHuman(g,reason);return true;
}
function enforceHold(g){
  if(!runtime.lastHold)return false;
  if(holdResolved(g)){runtime.lastHold=null;return false}
  const user=g.players?.[USER];if(!pending(g,user)){runtime.lastHold=null;return false}
  cancelBotTimer(g);
  if(actor(g.activePlayer)!==USER||user.active!==true||user.acted!==false)forceHuman(g,'HOLD_PREVENTED_HUMAN_SKIP');
  return true;
}
function reconcile(){
  const g=game();if(!g)return false;
  normalizeBeforeJoin();if(restartBadAdmission(g))return true;
  if(!g.joined||g.handOver||!Array.isArray(g.players)||g.players.length<6)return false;
  if(enforceHold(g))return true;
  if(candidate(g)===USER&&pending(g,g.players[USER]))return armHold(g,'DETERMINISTIC_HUMAN_ACTOR');
  return false;
}
function install(){
  if(document.documentElement.dataset.phase416HumanSeat==='1')return;
  document.documentElement.dataset.phase416HumanSeat='1';
  const prejoin=()=>normalizeBeforeJoin();document.addEventListener('pointerdown',event=>{if(event.target?.closest?.('#join'))prejoin()},true);document.addEventListener('touchstart',event=>{if(event.target?.closest?.('#join'))prejoin()},{capture:true,passive:true});document.addEventListener('click',event=>{if(event.target?.closest?.('#join'))prejoin()},true);
  window.addEventListener('svr:user-turn-restored',()=>setTimeout(reconcile,0));runtime.installed=true;
  const gate=$('#gateStatus');if(gate&&!/Phase 416/i.test(gate.textContent||''))gate.textContent+=' • Phase 416 human-seat never-skip active.';
}
function poll(){try{install();reconcile();runtime.lastError=null;runtime.checkedAt=new Date().toISOString()}catch(error){runtime.lastError=String(error?.message||error);runtime.checkedAt=new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,16)},{once:true});else{poll();setInterval(poll,16)}
window.SVR_PHASE416_HUMAN_SEAT_QA=()=>{const g=game(),user=g?.players?.[USER];return{...runtime,mode:mode(),activePlayer:actor(g?.activePlayer),expectedActor:actor(g?.expectedActor),candidate:candidate(g),userStack:Number(user?.stack??g?.stack??0),userPending:pending(g,user),holdActive:Boolean(runtime.lastHold&&!holdResolved(g)),phase410Input:Boolean(window.SVR_PHASE410_MOBILE_INPUT_QA),phase415Authority:Boolean(window.SVR_PHASE415_HUMAN_CONTROL_QA),zeroStackAdmissionProtected:true,humanHoldUntilAction:true,visualOrder:[...ORDER],pass:Boolean(runtime.installed&&window.SVR_PHASE410_MOBILE_INPUT_QA?.()?.pass&&window.SVR_PHASE415_HUMAN_CONTROL_QA?.()?.pass&&!runtime.lastError),checkedAt:new Date().toISOString()}};
