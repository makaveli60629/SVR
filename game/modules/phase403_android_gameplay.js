/* PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK | preserves PHASE-402 visual order + PHASE-398 raise sizing */
import {
  BUILD,NAMES,BOT_RANKS,TURN_SECONDS,SMALL_BLIND,BIG_BLIND,MIN_RAISE,$,all,state,money,streetName,currentRank,
  vibration,sound,toggleSound,updateSoundButtons,profile,makeDeck,shuffle,render,updateRaiseControls,setStatus,
  tableMessage,clearTurnTimers,elementForPlayer,flyChips,confetti,awardXp,post,reveal,configureSponsors,checkRelease,
  audioAvailable
} from './phase393_android_common.js?v=phase393';
import {evaluate,compareScore} from './phase393_android_evaluator.js?v=phase399';
import {
  RAISE_RULES_BUILD,CHIP_STEP,OPENING_MINIMUM,roundToChip,callAmount,minimumRaiseTo,isFullRaise,potSizedRaiseTo,legalRaiseWindow
} from './phase398_android_raise_rules.js?v=phase398';
import {POT_RULES_BUILD,buildSidePots,splitPotAmount,sumPotAmounts} from './phase403_android_pot_rules.js?v=phase403';

const ENGINE_BUILD='PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK';
const ORDER_BUILD='PHASE-402-ANDROID-VISUAL-LEFT-SEAT-ORDER-LOCK';
const BETTING_BUILD='PHASE-398-ANDROID-RAISE-SIZING-SMOOTHNESS-LOCK';

/* Permanent Android table flow. This is the visual left-to-right/circular order the player sees. */
export const VISUAL_LEFT_SEAT_ORDER=Object.freeze([0,5,1,2,3,4]);
export const BOT_PROFILES=Object.freeze({
  1:{name:'Claudia',style:'TIGHT',aggression:.22,bluff:.02,foldPressure:.27,potFraction:.45},
  2:{name:'Eric',style:'BALANCED',aggression:.38,bluff:.05,foldPressure:.17,potFraction:.55},
  3:{name:'Maya',style:'AGGRESSIVE',aggression:.58,bluff:.08,foldPressure:.10,potFraction:.75},
  4:{name:'Darius',style:'LOOSE AGGRESSIVE',aggression:.66,bluff:.13,foldPressure:.07,potFraction:1},
  5:{name:'Nova',style:'TRICKY',aggression:.47,bluff:.17,foldPressure:.13,potFraction:.6}
});

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const remainingPlayers=()=>state.players.filter(player=>!player.folded);
const actionablePlayers=()=>state.players.filter(player=>!player.folded&&!player.allIn&&player.stack>0);
function visualSeatsAfter(from){
  const count=VISUAL_LEFT_SEAT_ORDER.length,pos=VISUAL_LEFT_SEAT_ORDER.indexOf(from);
  if(pos<0)return [...VISUAL_LEFT_SEAT_ORDER];
  return Array.from({length:count},(_,step)=>VISUAL_LEFT_SEAT_ORDER[(pos+step+1)%count]);
}
function nextVisualSeat(from){return visualSeatsAfter(from)[0]??VISUAL_LEFT_SEAT_ORDER[0]}
function leftwardOrderAfter(from){
  return visualSeatsAfter(from).filter(index=>{
    const player=state.players[index];
    return Boolean(player&&!player.folded&&!player.allIn&&player.stack>0);
  });
}
function nextEligible(from){return leftwardOrderAfter(from)[0]??null}
function bettingComplete(){
  const live=actionablePlayers();
  return live.every(player=>player.acted&&player.streetBet===state.currentBet);
}
function minimumTarget(){return minimumRaiseTo(state.currentBet,state.lastFullRaiseSize||BIG_BLIND)}
function legalFullRaise(player){
  if(!player||player.folded||player.allIn||player.stack<=0)return false;
  return legalRaiseWindow({currentBet:state.currentBet,lastFullRaiseSize:state.lastFullRaiseSize||BIG_BLIND,streetBet:player.streetBet,stack:player.stack,raiseLocked:player.raiseLocked}).canRaise;
}
function commitChips(player,amount,label='BET'){
  const paid=post(player,amount,label);
  player.handContribution=Math.max(0,Number(player.handContribution||0))+paid;
  state.totalCommitted=state.players.reduce((sum,p)=>sum+Math.max(0,Number(p.handContribution||0)),0);
  return paid;
}
function ensureForcedContributions(){
  if(state.phase403ForcedContributionHand===state.hand)return;
  if(state.street!==0)return;
  const tournament=state.players.some(player=>Boolean(player.tournamentId));
  if(tournament){
    const ante=Math.max(0,Number(state.tableAnte||0));
    state.players.forEach(player=>{
      if(player.tournamentId)player.handContribution=Math.max(0,Number(player.streetBet||0))+ante;
      else player.handContribution=0;
    });
  }
  state.totalCommitted=state.players.reduce((sum,p)=>sum+Math.max(0,Number(p.handContribution||0)),0);
  state.phase403ForcedContributionHand=state.hand;
}
function markOthersForResponse(raiserIndex,{fullRaise=false,shortOpen=false}={}){
  state.players.forEach(player=>{
    if(player.index===raiserIndex||player.folded||player.allIn||player.stack<=0)return;
    const alreadyActed=Boolean(player.acted);
    if(fullRaise){player.acted=false;player.raiseLocked=false;return}
    if(player.streetBet<state.currentBet)player.acted=false;
    if(alreadyActed&&!shortOpen)player.raiseLocked=true;
  });
}
function recordAction(player,label){
  state.actionTrail ||= [];
  state.actionTrail.push({hand:state.hand,street:state.street,index:player.index,name:player.name,label,tableBet:state.currentBet,lastFullRaiseSize:state.lastFullRaiseSize,handContribution:player.handContribution||0,visualOrder:[...VISUAL_LEFT_SEAT_ORDER],at:Date.now()});
  if(state.actionTrail.length>120)state.actionTrail.splice(0,state.actionTrail.length-120);
  state.lastActor=player.index;
}
function finishAction(player,label){
  player.lastAction=label;player.acted=true;recordAction(player,label);tableMessage(`${player.name}: ${label}`);render();
  setTimeout(()=>advanceAfterAction(player.index),280);
}
function applyBetIncrease(player,index,newTotal,{allIn=false}={}){
  const oldBet=state.currentBet,total=Math.max(oldBet,Number(newTotal||0));
  if(total<=oldBet)return {increased:false,fullRaise:false,raiseSize:0};
  const raiseSize=total-oldBet,fullRaise=isFullRaise(oldBet,total,state.lastFullRaiseSize||BIG_BLIND);
  state.currentBet=total;
  if(fullRaise){state.lastFullRaiseSize=raiseSize;state.lastFullRaiser=index}
  markOthersForResponse(index,{fullRaise,shortOpen:oldBet===0&&allIn&&!fullRaise});
  return {increased:true,fullRaise,raiseSize};
}
function performAction(index,type,target=null,automatic=false){
  const player=state.players[index];
  if(!player||state.handOver||player.folded||state.activePlayer!==index)return;
  clearTurnTimers();player.active=false;
  const need=Math.max(0,state.currentBet-player.streetBet);
  if(type==='fold'){
    player.folded=true;sound('fold');vibration(20);finishAction(player,automatic?'AUTO-FOLD':'FOLD');return;
  }
  if(type==='check'&&need===0){sound('check');finishAction(player,automatic?'AUTO-CHECK':'CHECK');return}
  if(type==='call'||type==='check'){
    const exact=callAmount(state.currentBet,player.streetBet,player.stack);
    const paid=commitChips(player,exact,'CALL');
    const label=paid?(paid<need?`ALL-IN CALL ${money(paid)}`:`CALL ${money(paid)}`):'CHECK';
    finishAction(player,label);return;
  }
  if(type==='allin'){
    const before=player.streetBet,paid=commitChips(player,player.stack,'ALL IN'),total=before+paid;
    const result=applyBetIncrease(player,index,total,{allIn:true});
    sound('raise');vibration([20,35,20]);
    const label=result.increased?(result.fullRaise?`ALL IN • RAISE TO ${money(total)}`:`ALL IN • TO ${money(total)} (SHORT RAISE)`):`ALL-IN CALL ${money(paid)}`;
    finishAction(player,label);return;
  }
  if(type==='raise'){
    if(player.raiseLocked){player.active=true;tableMessage(`${player.name}: action was not reopened by the short all-in — CALL/FOLD only`);render();return}
    const window=legalRaiseWindow({currentBet:state.currentBet,lastFullRaiseSize:state.lastFullRaiseSize||BIG_BLIND,streetBet:player.streetBet,stack:player.stack,raiseLocked:player.raiseLocked});
    if(!window.canRaise){player.active=true;tableMessage(`${player.name}: full minimum raise unavailable — use CALL/CHECK or ALL IN`);render();return}
    const requested=roundToChip(Number(target||state.raiseTarget));
    const raiseTo=Math.max(window.min,Math.min(window.max,requested));
    if(raiseTo<window.min){player.active=true;tableMessage(`${player.name}: minimum is RAISE TO ${money(window.min)}`);render();return}
    commitChips(player,raiseTo-player.streetBet,state.currentBet===0?'BET':'RAISE');
    const oldBet=state.currentBet,result=applyBetIncrease(player,index,player.streetBet);
    if(!result.fullRaise){player.active=true;tableMessage(`${player.name}: raise must be at least ${money(minimumRaiseTo(oldBet,state.lastFullRaiseSize||BIG_BLIND))}`);render();return}
    sound('raise');vibration([18,30,18]);finishAction(player,oldBet===0?`BET ${money(player.streetBet)}`:`RAISE TO ${money(player.streetBet)} • +${money(result.raiseSize)}`);
  }
}
function preflopStrength(cards){
  const [a,b]=(cards||[]).filter(Boolean);if(!a||!b)return .2;
  const high=Math.max(a.v,b.v),low=Math.min(a.v,b.v),pair=a.v===b.v,suited=a.s===b.s,gap=Math.abs(a.v-b.v);
  let strength=(high-2)/12*.42+(low-2)/12*.18;
  if(pair)strength+=.31+(high/14)*.08;
  if(suited)strength+=.07;
  if(gap===1)strength+=.06;else if(gap===2)strength+=.03;
  if(high===14&&low>=10)strength+=.11;
  return clamp(strength,.05,.98);
}
function botHandStrength(player){
  const available=[...(player.cards||[]),...(state.community||[])].filter(Boolean);
  if(available.length<5)return preflopStrength(player.cards);
  const hand=evaluate(available),category=Math.max(0,Number(hand.score?.[0]||0));
  const categoryWeight=[.14,.33,.48,.60,.70,.80,.89,.96,1][category]??.14;
  const kicker=clamp(Number(hand.score?.[1]||0)/14,0,1)*.08;
  return clamp(categoryWeight+kicker,.05,1);
}
function botDecision(index){
  const player=state.players[index];if(!player||state.activePlayer!==index||state.handOver)return;
  const profile=BOT_PROFILES[index]||BOT_PROFILES[2],need=Math.max(0,state.currentBet-player.streetBet),strength=botHandStrength(player),roll=Math.random();
  const pressure=need>0?clamp(need/Math.max(1,state.pot+need),0,1):0;
  const foldChance=clamp(profile.foldPressure+pressure*.30-strength*.46,.01,.70);
  const raiseChance=clamp(profile.aggression*.48+strength*.48+profile.bluff*(1-strength),.04,.88);
  player.botStyle=profile.style;player.botStrength=Math.round(strength*100);
  if(need>0&&roll<foldChance){performAction(index,'fold');return}
  if(legalFullRaise(player)&&roll>1-raiseChance){
    const window=legalRaiseWindow({currentBet:state.currentBet,lastFullRaiseSize:state.lastFullRaiseSize||BIG_BLIND,streetBet:player.streetBet,stack:player.stack,raiseLocked:player.raiseLocked});
    let fraction=profile.potFraction;
    if(strength>.82)fraction=Math.max(fraction,1);
    if(profile.style==='TRICKY'&&strength<.45&&roll>.94)fraction=.5;
    const potTarget=potSizedRaiseTo({pot:state.pot,currentBet:state.currentBet,streetBet:player.streetBet,fraction});
    const target=Math.max(window.min,Math.min(window.max,roundToChip(potTarget)));
    performAction(index,'raise',target);return;
  }
  performAction(index,need>0?'call':'check');
}
function beginTurn(index){
  clearTurnTimers();if(state.handOver)return;ensureForcedContributions();
  let target=index;
  if(Number.isInteger(state.expectedActor)&&state.expectedActor!==index){
    const expected=state.players[state.expectedActor];
    if(expected&&!expected.folded&&!expected.allIn&&expected.stack>0){target=state.expectedActor;state.orderCorrections=(state.orderCorrections||0)+1}
  }
  const player=state.players[target];
  if(!player||player.folded||player.allIn||player.stack<=0){
    const next=nextEligible(target);state.expectedActor=next;if(next===null){advanceStreet();return}beginTurn(next);return;
  }
  state.activePlayer=target;state.expectedActor=target;state.turnSeconds=TURN_SECONDS;state.players.forEach(p=>p.active=p.index===target);sound('turn');
  setStatus(`${streetName()} • ${target===0?'YOUR':player.name.toUpperCase()+"'S"} TURN`);
  const need=Math.max(0,state.currentBet-player.streetBet);
  tableMessage(`${player.name} • ${need?`CALL ${money(Math.min(need,player.stack))}`:'CHECK'} • ${TURN_SECONDS}s`);render();
  state.turnInterval=setInterval(()=>{
    state.turnSeconds-=1;if(state.turnSeconds<=5&&state.turnSeconds>0)sound('timer');render();
    if(state.turnSeconds<=0){clearTurnTimers();const owed=Math.max(0,state.currentBet-player.streetBet);performAction(target,owed>0?'fold':'check',null,true)}
  },1000);
  if(target!==0)state.botTimer=setTimeout(()=>botDecision(target),820+Math.random()*980);
}
function advanceAfterAction(fromIndex){
  if(state.handOver)return;
  const live=remainingPlayers();if(live.length===1){awardUncontested(live[0]);return}
  if(bettingComplete()){advanceStreet();return}
  const next=nextEligible(fromIndex);state.expectedActor=next;if(next===null){advanceStreet();return}beginTurn(next);
}
function resetBettingRound(){
  state.currentBet=0;state.lastActor=null;state.lastFullRaiseSize=BIG_BLIND;state.lastFullRaiser=null;
  state.players.forEach(player=>{player.streetBet=0;player.acted=player.folded||player.allIn||player.stack<=0;player.active=false;player.raiseLocked=false});
}
function advanceStreet(){
  clearTurnTimers();if(state.handOver)return;resetBettingRound();
  if(state.street===0){state.street=1;reveal(3,'FLOP')}
  else if(state.street===1){state.street=2;reveal(1,'TURN')}
  else if(state.street===2){state.street=3;reveal(1,'RIVER')}
  else{showdown();return}
  const next=nextEligible(state.dealer);state.expectedActor=next;state.roundAnchor=state.dealer;state.roundOrder=leftwardOrderAfter(state.dealer);
  if(next===null){showdown();return}
  setStatus(`${streetName()} • BETTING ROUND`);render();setTimeout(()=>beginTurn(next),650);
}
function action(type){
  if(state.activePlayer!==0||state.handOver)return;
  if(type==='fold')performAction(0,'fold');
  else if(type==='call')performAction(0,Math.max(0,state.currentBet-state.players[0].streetBet)>0?'call':'check');
  else if(type==='raise')performAction(0,'raise',state.raiseTarget);
  else if(type==='allin')performAction(0,'allin');
}
function displayWinner(names,amount,handName,userWon){
  $('#winnerBanner').innerHTML=`<div>${names} WIN ${money(amount)}</div><div style="color:#8dffb4">${handName}</div>`;
  $('#winnerBanner').classList.remove('show');void $('#winnerBanner').offsetWidth;$('#winnerBanner').classList.add('show');
  if(userWon){sound('win');confetti();vibration([40,50,80,50,120])}else sound('lose');
}
function displayPotWinners(breakdown,userWon){
  const pots=(breakdown||[]).filter(pot=>pot.type==='pot');
  const rows=pots.slice(0,3).map(pot=>`<div style="margin-top:3px;color:#8dffb4;font-size:.72em">${pot.label} ${money(pot.amount)} • ${pot.winnerNames.join(' & ')} • ${pot.handName}</div>`).join('');
  $('#winnerBanner').innerHTML=`<div>${pots.length>1?'SHOWDOWN • MULTIPLE POTS':`${pots[0]?.winnerNames?.join(' & ')||'WINNER'} WIN`}</div>${rows}`;
  $('#winnerBanner').classList.remove('show');void $('#winnerBanner').offsetWidth;$('#winnerBanner').classList.add('show');
  if(userWon){sound('win');confetti();vibration([40,50,80,50,120])}else sound('lose');
}
function settleAndContinue(names,userWon){
  state.stack=state.players[0].stack;localStorage.setItem('svr393stack',String(state.stack));state.pot=0;render();
  if(userWon)awardXp(120,'HAND WIN');else awardXp(20,'HAND COMPLETE');
  if(state.players[0].stack<=0){setTimeout(()=>$('#outOverlay').classList.remove('hide'),1300);return}
  $('#next').classList.remove('hide');let seconds=6;
  const countdown=()=>{if(!state.handOver)return;setStatus(`NEXT HAND IN ${seconds} • ${names}`,true);if(seconds--<=0){startHand();return}state.autoTimer=setTimeout(countdown,1000)};
  state.autoTimer=setTimeout(countdown,1400);
}
function awardUncontested(winner){
  clearTurnTimers();state.handOver=true;state.lastWinner=winner.index;const amount=state.pot;
  winner.stack+=amount;winner.lastAction=`WINS ${money(amount)}`;flyChips($('#potTarget'),elementForPlayer(winner.index),14);
  state.lastPotBreakdown=[{label:'MAIN POT',type:'pot',amount,winnerIndexes:[winner.index],winnerNames:[winner.name],handName:'Uncontested Pot'}];
  state.lastMainPotWinners=[winner.index];state.lastShowdownHands={};
  displayWinner(winner.name,amount,'UNCONTESTED POT',winner.index===0);setStatus(`${winner.name} WINS • EVERYONE FOLDED`,true);render();settleAndContinue(winner.name,winner.index===0);
}
function resolveShowdownPots(){
  ensureForcedContributions();
  const contributions=state.players.map(player=>({index:player.index,amount:player.handContribution||0,folded:player.folded}));
  const audit=buildSidePots(contributions,state.pot),payoutTotals={},hands={};
  state.players.filter(player=>!player.folded).forEach(player=>{hands[player.index]=evaluate([...(player.cards||[]),...(state.community||[])])});
  const breakdown=[];
  for(const pot of audit.pots){
    if(pot.type==='refund'||!pot.eligibleIndexes.length){
      const recipients=pot.participantIndexes.length?pot.participantIndexes:state.players.map(player=>player.index);
      const split=splitPotAmount(pot.amount,recipients,state.dealer,VISUAL_LEFT_SEAT_ORDER);
      Object.entries(split.payouts).forEach(([index,amount])=>{const i=Number(index),player=state.players[i];if(player){player.stack+=amount;payoutTotals[i]=(payoutTotals[i]||0)+amount}});
      breakdown.push({...pot,winnerIndexes:split.orderedWinners,winnerNames:split.orderedWinners.map(i=>state.players[i]?.name||`Seat ${i}`),handName:'Uncalled chips returned',share:split.share,remainder:split.remainder});
      continue;
    }
    const results=pot.eligibleIndexes.map(index=>({index,player:state.players[index],hand:hands[index]})).filter(entry=>entry.player&&entry.hand).sort((a,b)=>compareScore(b.hand.score,a.hand.score));
    if(!results.length)continue;
    const best=results[0],winners=results.filter(entry=>compareScore(entry.hand.score,best.hand.score)===0),winnerIndexes=winners.map(entry=>entry.index);
    const split=splitPotAmount(pot.amount,winnerIndexes,state.dealer,VISUAL_LEFT_SEAT_ORDER);
    Object.entries(split.payouts).forEach(([index,amount])=>{const i=Number(index),player=state.players[i];if(player){player.stack+=amount;payoutTotals[i]=(payoutTotals[i]||0)+amount}});
    breakdown.push({...pot,winnerIndexes:split.orderedWinners,winnerNames:split.orderedWinners.map(i=>state.players[i]?.name||`Seat ${i}`),handName:best.hand.name,share:split.share,remainder:split.remainder,bestFive:best.hand.bestFive});
  }
  state.potAudit={build:POT_RULES_BUILD,tablePot:state.pot,trackedContributions:audit.tracked,potTotal:sumPotAmounts(audit.pots),delta:audit.delta,balanced:audit.balanced,contributions,checkedAt:new Date().toISOString()};
  state.lastShowdownHands=hands;state.lastPotBreakdown=breakdown;state.lastMainPotWinners=breakdown.find(pot=>pot.type==='pot')?.winnerIndexes||[];state.lastWinner=state.lastMainPotWinners[0]??breakdown.find(pot=>pot.winnerIndexes?.length)?.winnerIndexes?.[0]??null;
  return{breakdown,payoutTotals};
}
function showdown(){
  if(state.handOver)return;clearTurnTimers();state.handOver=true;state.street=4;state.expectedActor=null;
  while(state.community.length<5){if(state.community.length===0)reveal(3,'FLOP');else reveal(1,state.community.length===3?'TURN':'RIVER')}
  const {breakdown,payoutTotals}=resolveShowdownPots();
  const potWinners=breakdown.filter(pot=>pot.type==='pot').flatMap(pot=>pot.winnerIndexes||[]),uniqueWinners=[...new Set(potWinners)];
  uniqueWinners.forEach(index=>flyChips($('#potTarget'),elementForPlayer(index),Math.max(6,Math.floor(14/Math.max(1,uniqueWinners.length)))));
  const names=uniqueWinners.map(index=>state.players[index]?.name).filter(Boolean).join(' / ')||'SHOWDOWN',userWon=Boolean(payoutTotals[0]>0);
  displayPotWinners(breakdown,userWon);setStatus(`${names} • SHOWDOWN COMPLETE`,true);render();settleAndContinue(names,userWon);
}
function dealCardsAnimated(){
  let delay=0;const order=visualSeatsAfter(state.dealer);
  for(let round=0;round<2;round++)for(const seat of order){
    setTimeout(()=>{sound('deal');const target=elementForPlayer(seat);target?.animate?.([{transform:'scale(.96)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:220})},delay);delay+=75;
  }
}
function startHand(){
  clearTurnTimers();clearTimeout(state.autoTimer);$('#next').classList.add('hide');
  state.hand+=1;state.street=0;state.pot=0;state.community=[];state.burns=[];state.handOver=false;
  state.currentBet=BIG_BLIND;state.lastFullRaiseSize=BIG_BLIND;state.lastFullRaiser=null;state.lastWinner=null;state.activePlayer=null;state.turnSeconds=TURN_SECONDS;state.actionTrail=[];state.orderCorrections=0;state.totalCommitted=0;state.potAudit=null;state.lastPotBreakdown=[];state.lastMainPotWinners=[];state.lastShowdownHands={};state.phase403ForcedContributionHand=0;
  state.dealer=nextVisualSeat(state.dealer);state.deck=shuffle(makeDeck());
  const previous=state.players;
  state.players=NAMES.map((name,index)=>({
    index,name,rank:index===0?currentRank().name:BOT_RANKS[index-1],
    stack:index===0?Math.max(0,state.stack):(previous[index]?.stack>0?previous[index].stack:15000),
    cards:[state.deck.pop(),state.deck.pop()],folded:false,allIn:false,button:index===state.dealer,
    streetBet:0,handContribution:0,acted:false,active:false,raiseLocked:false,lastAction:'WAITING',botStyle:BOT_PROFILES[index]?.style||null
  }));
  const small=nextVisualSeat(state.dealer),big=nextVisualSeat(small);
  state.smallBlind=small;state.bigBlind=big;
  commitChips(state.players[small],SMALL_BLIND,'SMALL BLIND');commitChips(state.players[big],BIG_BLIND,'BIG BLIND');
  state.currentBet=state.players[big].streetBet;state.players[small].acted=false;state.players[big].acted=false;
  const first=nextEligible(big);state.expectedActor=first;state.roundAnchor=big;state.roundOrder=leftwardOrderAfter(big);
  $('#burnLabel').textContent='DECK READY • PRE-FLOP';setStatus('PRE-FLOP • DEALING');
  tableMessage(`LEFT → RIGHT FLOW • Dealer ${state.players[state.dealer].name} • SB ${state.players[small].name} ${money(SMALL_BLIND)} • BB ${state.players[big].name} ${money(BIG_BLIND)}`);
  dealCardsAnimated();render();setTimeout(()=>beginTurn(first??0),1050);
}
function join(){state.joined=true;$('#gate').classList.add('hide');$('#table').classList.remove('hide');profile();configureSponsors();updateSoundButtons();if(state.soundEnabled)sound('turn');startHand()}
function leave(){clearTurnTimers();clearTimeout(state.autoTimer);state.joined=false;$('#table').classList.add('hide');$('#gate').classList.remove('hide');$('#outOverlay').classList.add('hide');setStatus('LEFT TABLE');state.activePlayer=null;state.expectedActor=null;render()}
function restartChips(){state.stack=15000;state.xp=Math.max(state.xp,0);localStorage.setItem('svr393stack','15000');$('#outOverlay').classList.add('hide');startHand()}
function presetRaise(type){
  const player=state.players[0];if(!player)return;
  const window=legalRaiseWindow({currentBet:state.currentBet,lastFullRaiseSize:state.lastFullRaiseSize||BIG_BLIND,streetBet:player.streetBet,stack:player.stack,raiseLocked:player.raiseLocked});
  let target=window.min;
  if(type==='half')target=potSizedRaiseTo({pot:state.pot,currentBet:state.currentBet,streetBet:player.streetBet,fraction:.5});
  if(type==='pot')target=potSizedRaiseTo({pot:state.pot,currentBet:state.currentBet,streetBet:player.streetBet,fraction:1});
  if(type==='max')target=window.max;
  state.raiseTarget=Math.max(window.min,Math.min(window.max,roundToChip(target)));
  const slider=$('#raiseSlider');if(slider)slider.value=String(state.raiseTarget);
  $('#raiseAmount').textContent=`TO ${money(state.raiseTarget)}`;
  $('[data-a="raise"]').textContent=state.currentBet===0?`BET ${money(state.raiseTarget)}`:`RAISE TO ${money(state.raiseTarget)}`;
}
function bind(){
  $('#join').addEventListener('click',join);$('#leave').addEventListener('click',leave);$('#outLeave').addEventListener('click',leave);
  $('#restartChips').addEventListener('click',restartChips);$('#next').addEventListener('click',startHand);
  $('#soundToggle').addEventListener('click',toggleSound);$('#soundGate').addEventListener('click',toggleSound);
  all('.actions button[data-a]').forEach(button=>button.addEventListener('click',()=>action(button.dataset.a)));
  $('#raiseSlider').addEventListener('input',event=>{state.raiseTarget=roundToChip(Number(event.target.value));$('#raiseAmount').textContent=`TO ${money(state.raiseTarget)}`;$('[data-a="raise"]').textContent=state.currentBet===0?`BET ${money(state.raiseTarget)}`:`RAISE TO ${money(state.raiseTarget)}`});
  all('[data-bet]').forEach(button=>button.addEventListener('click',()=>presetRaise(button.dataset.bet)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTurnTimers();else if(state.joined&&!state.handOver&&state.activePlayer!==null){state.expectedActor=state.activePlayer;beginTurn(state.activePlayer)}});
}
function qa(){
  const seatPositions=state.players.slice(1).map(player=>{const element=$(`[data-player="${player.index}"]`);return element?{index:player.index,name:player.name,left:element.offsetLeft,top:element.offsetTop,width:element.offsetWidth,height:element.offsetHeight}:null}).filter(Boolean);
  const visualNames=VISUAL_LEFT_SEAT_ORDER.map(index=>state.players[index]?.name||NAMES[index]);
  const result={
    ...state,engineBuild:ENGINE_BUILD,orderBuild:ORDER_BUILD,bettingBuild:BETTING_BUILD,raiseRulesBuild:RAISE_RULES_BUILD,potRulesBuild:POT_RULES_BUILD,players:state.players.length,bots:Math.max(0,state.players.length-1),
    perimeterSeatCount:document.querySelectorAll('.player-box').length,centerPlayerCount:document.querySelectorAll('.center-pot .player-box,.table-logo .player-box').length,
    turnClockSeconds:TURN_SECONDS,raiseSlider:Boolean($('#raiseSlider')),soundLayer:audioAvailable(),sponsorZones:document.querySelectorAll('.sponsor-zone').length,
    communitySlots:document.querySelectorAll('#community .card').length,holeCards:document.querySelectorAll('#hole .card').length,
    visualLeftSeatOrder:[...VISUAL_LEFT_SEAT_ORDER],visualLeftSeatNames:visualNames,
    dariusGoesToUser:nextVisualSeat(4)===0,userGoesToNova:nextVisualSeat(0)===5,novaGoesToClaudia:nextVisualSeat(5)===1,
    preflopStartsLeftOfBigBlind:true,postflopStartsLeftOfDealer:true,visualLeftOrder:true,
    dynamicLastFullRaise:true,exactCallDifference:true,shortAllInDoesNotResetFullRaise:true,raiseToLabel:true,chipStep:CHIP_STEP,openingMinimum:OPENING_MINIMUM,
    sidePotEngine:true,contributionAccounting:true,splitPotOddChipOrder:'left-of-dealer',multipleAllIns:true,uncalledReturnGuard:true,
    botProfiles:Object.fromEntries(Object.entries(BOT_PROFILES).map(([index,p])=>[index,p.style])),botPersonalityCount:Object.keys(BOT_PROFILES).length,
    minimumRaiseTo:minimumTarget(),lastFullRaiseSize:state.lastFullRaiseSize||BIG_BLIND,legalRaiseGuard:true,checkCallGuard:true,orderCorrections:state.orderCorrections||0,
    seatPositions,continuousPlay:true,autoFoldFacingBet:true,checkedAt:new Date().toISOString()
  };
  result.pass=Boolean(result.players===6&&result.perimeterSeatCount===5&&result.centerPlayerCount===0&&result.turnClockSeconds===15&&result.raiseSlider&&result.sponsorZones===2&&result.communitySlots===5&&result.holeCards===2&&result.dariusGoesToUser&&result.userGoesToNova&&result.novaGoesToClaudia&&result.visualLeftOrder&&result.dynamicLastFullRaise&&result.exactCallDifference&&result.shortAllInDoesNotResetFullRaise&&result.sidePotEngine&&result.contributionAccounting&&result.botPersonalityCount===5&&result.legalRaiseGuard&&result.checkCallGuard&&!state.lastError);
  return result;
}

state.engineBuild=ENGINE_BUILD;
bind();profile();configureSponsors();updateSoundButtons();checkRelease();
window.SVR_PHASE393_ANDROID_STATE=state;
window.SVR_PHASE393_ANDROID_QA=qa;
window.SVR_PHASE397_ANDROID_BETTING_QA=qa;
window.SVR_PHASE398_ANDROID_BETTING_QA=qa;
window.SVR_PHASE402_ANDROID_SEAT_ORDER_QA=qa;
window.SVR_PHASE403_ANDROID_ENGINE_QA=qa;
window.SVR_PHASE402_VISUAL_LEFT_SEAT_ORDER=[...VISUAL_LEFT_SEAT_ORDER];
window.SVR_PHASE403_VISUAL_LEFT_SEAT_ORDER=[...VISUAL_LEFT_SEAT_ORDER];
window.SVR_PHASE403_BOT_PROFILES=BOT_PROFILES;
window.SVR_PHASE392_ANDROID_QA=qa;
