/* PHASE-409-MOBILE-PLAYER-TURN-GUARD-LOCK */
const BUILD='PHASE-409-MOBILE-PLAYER-TURN-GUARD-LOCK';
const DARIUS=4,USER=0,TURN_SECONDS=15;
const state={build:BUILD,installed:false,rescues:0,lastRescueKey:'',lastRescue:null,userTurnVisible:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const streetName=street=>['PRE-FLOP','FLOP','TURN','RIVER','SHOWDOWN'][Number(street)||0]||'POKER';
function userActionThisStreet(g){return (g?.actionTrail||[]).some(row=>Number(row.hand)===Number(g.hand)&&Number(row.street)===Number(g.street)&&Number(row.index)===USER)}
function userNeedsAction(g){
  const user=g?.players?.[USER];
  if(!user||g.handOver||user.folded||user.allIn||Number(user.stack||0)<=0)return false;
  const owes=Math.max(0,Number(g.currentBet||0)-Number(user.streetBet||0));
  return !userActionThisStreet(g)||owes>0||user.acted===false;
}
function lastAction(g){const trail=g?.actionTrail||[];return trail.length?trail[trail.length-1]:null}
function forceUserTurn(g,reason){
  const key=`${g.hand}|${g.street}|${lastAction(g)?.at||0}|${reason}`;
  if(state.lastRescueKey===key)return false;
  const user=g.players?.[USER];if(!user||!userNeedsAction(g))return false;
  g.activePlayer=USER;g.expectedActor=USER;g.turnSeconds=Math.max(1,Number(g.turnSeconds||TURN_SECONDS));
  g.players.forEach(player=>{player.active=player.index===USER});
  const status=$('#status'),clock=$('#turnClock'),strip=$('.turn-strip'),message=$('#tableMessage');
  if(status)status.textContent=`${streetName(g.street)} • YOUR TURN`;
  if(clock)clock.textContent=String(g.turnSeconds||TURN_SECONDS);
  strip?.classList.add('phase407-user-turn','phase409-user-turn-rescue');strip?.classList.remove('phase407-bot-turn');
  if(message)message.textContent='YOUR TURN • Choose CHECK / CALL / RAISE / FOLD';
  state.rescues+=1;state.lastRescueKey=key;state.lastRescue={hand:g.hand,street:g.street,reason,from:lastAction(g)?.index??null,to:USER,at:new Date().toISOString()};
  g.phase409TurnRescues=state.rescues;g.phase409LastTurnRescue=state.lastRescue;
  window.dispatchEvent(new CustomEvent('svr:user-turn-restored',{detail:state.lastRescue}));
  return true;
}
function guard(){
  const g=game();if(!g||!Array.isArray(g.players)||g.players.length<6)return false;
  const last=lastAction(g),sameStreet=Boolean(last&&Number(last.hand)===Number(g.hand)&&Number(last.street)===Number(g.street));
  const userPending=userNeedsAction(g),active=Number(g.activePlayer);
  if(sameStreet&&Number(last.index)===DARIUS&&userPending&&Number.isInteger(active)&&active>0&&active!==DARIUS)forceUserTurn(g,'DARIUS_TO_USER_ORDER');
  else if(Number(g.expectedActor)===USER&&userPending&&Number.isInteger(active)&&active>0&&active!==DARIUS)forceUserTurn(g,'EXPECTED_USER_ACTOR');
  state.userTurnVisible=Boolean(g.activePlayer===USER&&!g.handOver&&$('#status')?.textContent?.includes('YOUR TURN'));
  state.installed=true;state.lastError=null;state.checkedAt=new Date().toISOString();return true
}
function poll(){try{guard()}catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,45)},{once:true});else{poll();setInterval(poll,45)}
window.SVR_PHASE409_PLAYER_TURN_QA=()=>{const g=game(),last=lastAction(g);return{...state,currentHand:g?.hand??null,currentStreet:g?.street??null,activePlayer:g?.activePlayer??null,expectedActor:g?.expectedActor??null,lastActor:last?.index??null,userNeedsAction:userNeedsAction(g),userActionThisStreet:userActionThisStreet(g),dariusToUserRule:true,visualOrder:Array.isArray(window.SVR_PHASE403_VISUAL_LEFT_SEAT_ORDER)?[...window.SVR_PHASE403_VISUAL_LEFT_SEAT_ORDER]:[0,5,1,2,3,4],pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()}};
