/* PHASE-393-ANDROID-TURN-ENGINE-LOCK */
import {
  BUILD,NAMES,BOT_RANKS,TURN_SECONDS,SMALL_BLIND,BIG_BLIND,MIN_RAISE,$,all,state,money,streetName,currentRank,
  vibration,sound,toggleSound,updateSoundButtons,profile,makeDeck,shuffle,render,updateRaiseControls,setStatus,
  tableMessage,clearTurnTimers,elementForPlayer,flyChips,confetti,awardXp,post,reveal,configureSponsors,checkRelease,
  audioAvailable
} from './phase393_android_common.js?v=phase393';
import {evaluate,compareScore} from './phase393_android_evaluator.js?v=phase393';

const remainingPlayers=()=>state.players.filter(player=>!player.folded);
function nextEligible(from){
  for(let step=1;step<=state.players.length;step++){
    const index=(from+step)%state.players.length,player=state.players[index];
    if(player&&!player.folded&&!player.allIn&&player.stack>0)return index;
  }
  return null;
}
function bettingComplete(){
  const live=state.players.filter(player=>!player.folded&&!player.allIn&&player.stack>0);
  return live.every(player=>player.acted&&player.streetBet===state.currentBet);
}
function markOthersForResponse(raiserIndex){
  state.players.forEach(player=>{
    if(player.index!==raiserIndex&&!player.folded&&!player.allIn&&player.stack>0)player.acted=false;
  });
}
function finishAction(player,label){
  player.lastAction=label;player.acted=true;tableMessage(`${player.name}: ${label}`);render();
  setTimeout(()=>advanceAfterAction(player.index),280);
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
    const paid=post(player,need,'CALL');finishAction(player,paid?`CALL ${money(paid)}`:'CHECK');return;
  }
  if(type==='allin'){
    const before=player.streetBet,paid=post(player,player.stack,'ALL IN');
    if(player.streetBet>state.currentBet){state.currentBet=player.streetBet;markOthersForResponse(index)}
    sound('raise');vibration([20,35,20]);finishAction(player,`ALL IN ${money(before+paid)}`);return;
  }
  if(type==='raise'){
    const max=player.streetBet+player.stack;
    const min=Math.min(max,Math.max(state.currentBet+MIN_RAISE,player.streetBet+MIN_RAISE));
    const raiseTo=Math.max(min,Math.min(max,Math.round(Number(target||state.raiseTarget)/100)*100));
    post(player,raiseTo-player.streetBet,'RAISE');
    if(player.streetBet>state.currentBet){state.currentBet=player.streetBet;markOthersForResponse(index)}
    sound('raise');vibration([18,30,18]);finishAction(player,`RAISE TO ${money(player.streetBet)}`);
  }
}
function botDecision(index){
  const player=state.players[index];if(!player||state.activePlayer!==index||state.handOver)return;
  const need=Math.max(0,state.currentBet-player.streetBet),roll=Math.random();
  if(need>0&&roll<(.12+state.street*.05)){performAction(index,'fold');return}
  if(player.stack>need+MIN_RAISE&&roll>.77){
    const extra=Math.max(MIN_RAISE,Math.min(player.stack-need,Math.round(Math.max(200,state.pot*(.35+Math.random()*.4))/100)*100));
    performAction(index,'raise',state.currentBet+extra);return;
  }
  performAction(index,need>0?'call':'check');
}
function beginTurn(index){
  clearTurnTimers();if(state.handOver)return;
  const player=state.players[index];
  if(!player||player.folded||player.allIn||player.stack<=0){advanceAfterAction(index);return}
  state.activePlayer=index;state.turnSeconds=TURN_SECONDS;state.players.forEach(p=>p.active=p.index===index);sound('turn');
  setStatus(`${streetName()} • ${index===0?'YOUR':player.name.toUpperCase()+"'S"} TURN`);
  tableMessage(`${player.name} has ${TURN_SECONDS} seconds`);render();
  state.turnInterval=setInterval(()=>{
    state.turnSeconds-=1;if(state.turnSeconds<=5&&state.turnSeconds>0)sound('timer');render();
    if(state.turnSeconds<=0){
      clearTurnTimers();const need=Math.max(0,state.currentBet-player.streetBet);
      performAction(index,need>0?'fold':'check',null,true);
    }
  },1000);
  if(index!==0)state.botTimer=setTimeout(()=>botDecision(index),900+Math.random()*1300);
}
function advanceAfterAction(fromIndex){
  if(state.handOver)return;
  const live=remainingPlayers();if(live.length===1){awardUncontested(live[0]);return}
  if(bettingComplete()){advanceStreet();return}
  const next=nextEligible(fromIndex);if(next===null){advanceStreet();return}beginTurn(next);
}
function resetBettingRound(){
  state.currentBet=0;
  state.players.forEach(player=>{
    player.streetBet=0;player.acted=player.folded||player.allIn||player.stack<=0;player.active=false;
  });
}
function advanceStreet(){
  clearTurnTimers();if(state.handOver)return;resetBettingRound();
  if(state.street===0){state.street=1;reveal(3,'FLOP')}
  else if(state.street===1){state.street=2;reveal(1,'TURN')}
  else if(state.street===2){state.street=3;reveal(1,'RIVER')}
  else{showdown();return}
  const next=nextEligible(state.dealer);if(next===null){showdown();return}
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
function settleAndContinue(names,userWon){
  state.stack=state.players[0].stack;localStorage.setItem('svr393stack',String(state.stack));state.pot=0;render();
  if(userWon)awardXp(120,'HAND WIN');else awardXp(20,'HAND COMPLETE');
  if(state.players[0].stack<=0){setTimeout(()=>$('#outOverlay').classList.remove('hide'),1300);return}
  $('#next').classList.remove('hide');let seconds=5;
  const countdown=()=>{
    if(!state.handOver)return;setStatus(`NEXT HAND IN ${seconds} • ${names} WON`,true);
    if(seconds--<=0){startHand();return}state.autoTimer=setTimeout(countdown,1000);
  };
  state.autoTimer=setTimeout(countdown,1200);
}
function awardUncontested(winner){
  clearTurnTimers();state.handOver=true;state.lastWinner=winner.index;const amount=state.pot;
  winner.stack+=amount;winner.lastAction=`WINS ${money(amount)}`;flyChips($('#potTarget'),elementForPlayer(winner.index),14);
  displayWinner(winner.name,amount,'UNCONTESTED POT',winner.index===0);setStatus(`${winner.name} WINS • EVERYONE FOLDED`,true);
  render();settleAndContinue(winner.name,winner.index===0);
}
function showdown(){
  if(state.handOver)return;clearTurnTimers();state.handOver=true;state.street=4;
  while(state.community.length<5){if(state.community.length===0)reveal(3,'FLOP');else reveal(1,state.community.length===3?'TURN':'RIVER')}
  const contenders=state.players.filter(player=>!player.folded);
  const results=contenders.map(player=>({player,hand:evaluate([...player.cards,...state.community])})).sort((a,b)=>compareScore(b.hand.score,a.hand.score));
  const best=results[0],winners=results.filter(result=>compareScore(result.hand.score,best.hand.score)===0),share=Math.floor(state.pot/winners.length);
  winners.forEach(result=>result.player.stack+=share);state.lastWinner=winners[0].player.index;
  const names=winners.map(result=>result.player.name).join(' & '),userWon=winners.some(result=>result.player.index===0);
  flyChips($('#potTarget'),elementForPlayer(state.lastWinner),14);displayWinner(names,share,best.hand.name,userWon);
  setStatus(`${names} WIN • ${best.hand.name}`,true);render();settleAndContinue(names,userWon);
}
function dealCardsAnimated(){
  let delay=0;
  for(let round=0;round<2;round++)for(let seat=0;seat<state.players.length;seat++){
    setTimeout(()=>{
      sound('deal');const target=elementForPlayer(seat);
      target?.animate?.([{transform:'scale(.96)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:220});
    },delay);delay+=75;
  }
}
function startHand(){
  clearTurnTimers();clearTimeout(state.autoTimer);$('#next').classList.add('hide');
  state.hand+=1;state.street=0;state.pot=0;state.community=[];state.burns=[];state.handOver=false;
  state.currentBet=BIG_BLIND;state.lastWinner=null;state.activePlayer=null;state.turnSeconds=TURN_SECONDS;
  state.dealer=(state.dealer+1)%6;state.deck=shuffle(makeDeck());
  const previous=state.players;
  state.players=NAMES.map((name,index)=>({
    index,name,rank:index===0?currentRank().name:BOT_RANKS[index-1],
    stack:index===0?Math.max(0,state.stack):(previous[index]?.stack>0?previous[index].stack:15000),
    cards:[state.deck.pop(),state.deck.pop()],folded:false,allIn:false,button:index===state.dealer,
    streetBet:0,acted:false,active:false,lastAction:'WAITING'
  }));
  const small=(state.dealer+1)%6,big=(state.dealer+2)%6;
  post(state.players[small],SMALL_BLIND,'SMALL BLIND');post(state.players[big],BIG_BLIND,'BIG BLIND');
  state.currentBet=state.players[big].streetBet;state.players[small].acted=false;state.players[big].acted=false;
  $('#burnLabel').textContent='DECK READY • PRE-FLOP';setStatus('PRE-FLOP • DEALING');
  tableMessage(`Dealer: ${state.players[state.dealer].name} • Blinds ${money(SMALL_BLIND)}/${money(BIG_BLIND)}`);
  dealCardsAnimated();render();const first=nextEligible(big);setTimeout(()=>beginTurn(first??0),1050);
}
function join(){
  state.joined=true;$('#gate').classList.add('hide');$('#table').classList.remove('hide');
  profile();configureSponsors();updateSoundButtons();if(state.soundEnabled)sound('turn');startHand();
}
function leave(){
  clearTurnTimers();clearTimeout(state.autoTimer);state.joined=false;$('#table').classList.add('hide');$('#gate').classList.remove('hide');
  $('#outOverlay').classList.add('hide');setStatus('LEFT TABLE');state.activePlayer=null;render();
}
function restartChips(){
  state.stack=15000;state.xp=Math.max(state.xp,0);localStorage.setItem('svr393stack','15000');
  $('#outOverlay').classList.add('hide');startHand();
}
function presetRaise(type){
  const player=state.players[0];if(!player)return;
  const max=player.streetBet+player.stack,min=Math.min(max,Math.max(state.currentBet+MIN_RAISE,player.streetBet+MIN_RAISE));
  let target=min;
  if(type==='half')target=state.currentBet+Math.max(MIN_RAISE,Math.round(state.pot*.5/100)*100);
  if(type==='pot')target=state.currentBet+Math.max(MIN_RAISE,Math.round(state.pot/100)*100);
  if(type==='max')target=max;
  state.raiseTarget=Math.max(min,Math.min(max,target));updateRaiseControls();$('[data-a="raise"]').textContent=`RAISE ${money(state.raiseTarget)}`;
}
function bind(){
  $('#join').addEventListener('click',join);$('#leave').addEventListener('click',leave);$('#outLeave').addEventListener('click',leave);
  $('#restartChips').addEventListener('click',restartChips);$('#next').addEventListener('click',startHand);
  $('#soundToggle').addEventListener('click',toggleSound);$('#soundGate').addEventListener('click',toggleSound);
  all('.actions button[data-a]').forEach(button=>button.addEventListener('click',()=>action(button.dataset.a)));
  $('#raiseSlider').addEventListener('input',event=>{
    state.raiseTarget=Number(event.target.value);$('#raiseAmount').textContent=money(state.raiseTarget);
    $('[data-a="raise"]').textContent=`RAISE ${money(state.raiseTarget)}`;
  });
  all('[data-bet]').forEach(button=>button.addEventListener('click',()=>presetRaise(button.dataset.bet)));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)clearTurnTimers();else if(state.joined&&!state.handOver&&state.activePlayer!==null)beginTurn(state.activePlayer);
  });
}
function qa(){
  const seatPositions=state.players.slice(1).map(player=>{
    const element=$(`[data-player="${player.index}"]`);
    return element?{index:player.index,left:element.offsetLeft,top:element.offsetTop,width:element.offsetWidth,height:element.offsetHeight}:null;
  }).filter(Boolean);
  const result={
    ...state,players:state.players.length,bots:Math.max(0,state.players.length-1),
    perimeterSeatCount:document.querySelectorAll('.player-box').length,
    centerPlayerCount:document.querySelectorAll('.center-pot .player-box,.table-logo .player-box').length,
    turnClockSeconds:TURN_SECONDS,raiseSlider:Boolean($('#raiseSlider')),soundLayer:audioAvailable(),
    sponsorZones:document.querySelectorAll('.sponsor-zone').length,
    communitySlots:document.querySelectorAll('#community .card').length,holeCards:document.querySelectorAll('#hole .card').length,
    seatPositions,continuousPlay:true,autoFoldFacingBet:true,checkedAt:new Date().toISOString()
  };
  result.pass=Boolean(result.players===6&&result.perimeterSeatCount===5&&result.centerPlayerCount===0&&result.turnClockSeconds===15&&result.raiseSlider&&result.sponsorZones===2&&result.communitySlots===5&&result.holeCards===2&&!state.lastError);
  return result;
}

bind();profile();configureSponsors();updateSoundButtons();checkRelease();
window.SVR_PHASE393_ANDROID_STATE=state;window.SVR_PHASE393_ANDROID_QA=qa;window.SVR_PHASE392_ANDROID_QA=qa;
