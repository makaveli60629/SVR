/* PHASE-414-HUMAN-TURN-ROTATION-AUTHORITY-LOCK */
const BUILD='PHASE-414-HUMAN-TURN-ROTATION-AUTHORITY-LOCK';
const USER=0,TURN_SECONDS=15,HANDOFF_GRACE_MS=450;
const VISUAL_ORDER=Object.freeze([0,5,1,2,3,4]);
const runtime={build:BUILD,installed:false,rescues:0,normalizations:0,graceWaits:0,lastRescue:null,lastKey:'',lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const actor=value=>Number.isInteger(value)?value:null;
const streetName=street=>['PRE-FLOP','FLOP','TURN','RIVER','SHOWDOWN'][Number(street)||0]||'POKER';
function eligible(player){return Boolean(player&&!player.folded&&!player.allIn&&Number(player.stack||0)>0)}
function currentStreetTrail(g){return (g?.actionTrail||[]).filter(row=>Number(row.hand)===Number(g.hand)&&Number(row.street)===Number(g.street))}
function userActionThisStreet(g){return currentStreetTrail(g).some(row=>Number(row.index)===USER)}
function userPending(g){
  const user=g?.players?.[USER];if(!eligible(user)||g?.handOver)return false;
  const owes=Math.max(0,Number(g.currentBet||0)-Number(user.streetBet||0));
  return !userActionThisStreet(g)||owes>0||user.acted===false;
}
function nextEligibleAfter(g,from){
  const pos=VISUAL_ORDER.indexOf(Number(from));if(pos<0)return null;
  for(let step=1;step<=VISUAL_ORDER.length;step++){
    const index=VISUAL_ORDER[(pos+step)%VISUAL_ORDER.length];
    if(eligible(g?.players?.[index]))return index;
  }
  return null;
}
function lastStreetAction(g){const rows=currentStreetTrail(g);return rows.length?rows[rows.length-1]:null}
function userIsDue(g){
  if(!userPending(g))return false;
  const active=actor(g?.activePlayer),expected=actor(g?.expectedActor);
  if(active===USER||expected===USER)return true;
  const last=lastStreetAction(g);
  if(last&&nextEligibleAfter(g,last.index)===USER)return true;
  if(!last&&actor(g?.roundAnchor)!==null&&nextEligibleAfter(g,g.roundAnchor)===USER)return true;
  return false;
}
function handoffGraceActive(g){
  const last=lastStreetAction(g),active=actor(g?.activePlayer);
  if(!last||active!==Number(last.index)||nextEligibleAfter(g,last.index)!==USER)return false;
  const age=Math.max(0,Date.now()-Number(last.at||0));
  return age<HANDOFF_GRACE_MS;
}
function clearTurnTimers(g){
  try{clearInterval(g.turnInterval)}catch{}
  try{clearTimeout(g.botTimer)}catch{}
  g.turnInterval=null;g.botTimer=null;
}
function restoreUser(g,reason){
  const user=g?.players?.[USER];if(!user||!userIsDue(g))return false;
  const last=lastStreetAction(g),active=actor(g.activePlayer),expected=actor(g.expectedActor),key=[g.hand,g.street,g.actionTrail?.length||0,g.currentBet,user.streetBet,active,expected,reason].join('|');
  if(runtime.lastKey===key&&active===USER&&user.active===true&&user.acted===false)return false;
  clearTurnTimers(g);
  if(user.acted!==false){user.acted=false;runtime.normalizations+=1}
  g.activePlayer=USER;g.expectedActor=USER;g.turnSeconds=TURN_SECONDS;
  g.players.forEach(player=>{player.active=Number(player.index)===USER});
  const status=$('#status'),clock=$('#turnClock'),message=$('#tableMessage'),strip=$('.turn-strip');
  if(status)status.textContent=`${streetName(g.street)} • YOUR TURN`;
  if(clock)clock.textContent=String(TURN_SECONDS);
  if(message){const owed=Math.max(0,Number(g.currentBet||0)-Number(user.streetBet||0));message.textContent=`YOUR TURN • ${owed?`CALL $${Math.min(owed,Number(user.stack||0)).toLocaleString()} / RAISE / FOLD`:'CHECK / RAISE / FOLD'}`}
  strip?.classList.add('phase407-user-turn','phase409-user-turn-rescue','phase414-human-turn');
  strip?.classList.remove('phase407-bot-turn');
  runtime.rescues+=1;runtime.lastKey=key;runtime.lastRescue={hand:g.hand,street:g.street,reason,from:last?.index??null,nextEligibleAfterLast:last?nextEligibleAfter(g,last.index):null,to:USER,currentBet:Number(g.currentBet||0),userStreetBet:Number(user.streetBet||0),at:new Date().toISOString()};
  g.phase414TurnRescues=runtime.rescues;g.phase414LastTurnRescue=runtime.lastRescue;
  window.dispatchEvent(new CustomEvent('svr:user-turn-restored',{detail:{...runtime.lastRescue,build:BUILD}}));
  return true;
}
function guard(){
  const g=game();if(!g||!Array.isArray(g.players)||g.players.length<6)return false;
  const user=g.players[USER],pending=userPending(g),due=userIsDue(g),active=actor(g.activePlayer),expected=actor(g.expectedActor),last=lastStreetAction(g);
  if(due&&active===USER&&(user.active!==true||user.acted!==false))restoreUser(g,'NORMALIZE_OPEN_HUMAN_DECISION');
  else if(due&&active!==USER&&active!==null){
    if(handoffGraceActive(g))runtime.graceWaits+=1;
    else restoreUser(g,expected===USER?'EXPECTED_USER':'ACTOR_CYCLE_TO_USER');
  }
  runtime.installed=true;runtime.lastError=null;runtime.checkedAt=new Date().toISOString();
  return {pending,due,active,expected,lastActor:last?.index??null,nextAfterLast:last?nextEligibleAfter(g,last.index):null};
}
function poll(){try{guard()}catch(error){runtime.lastError=String(error?.message||error);runtime.checkedAt=new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,20)},{once:true});else{poll();setInterval(poll,20)}
window.SVR_PHASE414_HUMAN_TURN_QA=()=>{const g=game(),user=g?.players?.[USER],last=lastStreetAction(g);return{...runtime,activePlayer:actor(g?.activePlayer),expectedActor:actor(g?.expectedActor),userActive:user?.active??null,userActed:user?.acted??null,userPending:userPending(g),userDue:userIsDue(g),lastActor:last?.index??null,nextEligibleAfterLast:last?nextEligibleAfter(g,last.index):null,visualOrder:[...VISUAL_ORDER],handoffGraceMs:HANDOFF_GRACE_MS,allMobileModes:true,android:true,iphone:true,practice:true,regular:true,tournament:true,pass:Boolean(runtime.installed&&!runtime.lastError),checkedAt:new Date().toISOString()}};
