/* PHASE-403-ANDROID-TABLE-CLARITY-LOCK */
const BUILD='PHASE-403-ANDROID-TABLE-CLARITY-LOCK';
const GUIDE_EXAMPLES=[
  ['A♠','K♠','Q♠','J♠','10♠'],
  ['9♥','8♥','7♥','6♥','5♥'],
  ['Q♣','Q♦','Q♥','Q♠','7♣'],
  ['J♣','J♦','J♥','4♠','4♥'],
  ['A♦','J♦','8♦','5♦','2♦'],
  ['10♣','9♦','8♠','7♥','6♣'],
  ['8♣','8♦','8♥','K♠','3♦'],
  ['A♣','A♥','5♠','5♦','9♣'],
  ['K♣','K♦','A♠','9♥','4♣'],
  ['A♣','J♦','9♠','6♥','3♣']
];
const state={build:BUILD,installed:false,lastHand:0,lastComplexResultHand:0,lastActive:null,lastLogSize:0,guideEnhanced:false,tournamentExtraReady:false,lastError:null,checkedAt:null};
const $=selector=>document.querySelector(selector);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const money=value=>`$${Math.max(0,Math.round(Number(value||0))).toLocaleString()}`;
const symbol=s=>({S:'♠',H:'♥',D:'♦',C:'♣'}[s]||s||'');
const redText=text=>/[♥♦]/.test(String(text||''));
function cardText(card){return `${card?.r||'?'}${symbol(card?.s)}`}
function miniCard(text,used=false){return `<span class="phase403-mini-card${redText(text)?' red':''}${used?' used':''}">${text}</span>`}
function ensureUi(){
  if(state.installed)return true;
  const wrap=$('.table-wrap'),footer=$('.footer');if(!wrap||!footer)return false;
  wrap.insertAdjacentHTML('afterbegin','<div id="phase403FlowRail" class="phase403-flow-rail"><span class="phase403-flow-label">LEFT → RIGHT</span><span class="phase403-flow-current">TABLE READY</span></div>');
  const logButton=document.createElement('button');logButton.id='phase403HistoryButton';logButton.type='button';logButton.className='phase403-footer-button';logButton.textContent='HISTORY';logButton.addEventListener('click',openHistory);footer.appendChild(logButton);
  document.body.insertAdjacentHTML('beforeend',`
    <section id="phase403HistorySheet" class="phase403-sheet hide" aria-label="Hand action history"><div class="phase403-sheet-head"><h2>Hand Action History</h2><button type="button" data-close-phase403-history>✕</button></div><div class="phase403-log"></div></section>
    <section id="phase403PotSheet" class="phase403-sheet hide" aria-label="Side pot showdown breakdown"><div class="phase403-sheet-head"><h2>Pot-by-Pot Showdown</h2><button type="button" data-close-phase403-pot>✕</button></div><p class="phase403-pot-summary"></p><div class="phase403-pot-list"></div><div class="phase403-pot-hands"></div></section>`);
  $('[data-close-phase403-history]')?.addEventListener('click',()=>$('#phase403HistorySheet')?.classList.add('hide'));
  $('[data-close-phase403-pot]')?.addEventListener('click',()=>$('#phase403PotSheet')?.classList.add('hide'));
  state.installed=true;return true;
}
function updateActiveOwner(g){
  if(state.lastActive===g.activePlayer&&document.querySelector('.phase403-active-owner'))return;
  document.querySelectorAll('.phase403-active-owner').forEach(el=>el.classList.remove('phase403-active-owner'));
  document.querySelectorAll('.phase403-turn-arrow').forEach(el=>el.remove());
  state.lastActive=g.activePlayer;
  if(g.activePlayer==null||g.handOver)return;
  const owner=g.activePlayer===0?$('.profile-pill'):$(`[data-player="${g.activePlayer}"]`);if(!owner)return;
  owner.classList.add('phase403-active-owner');
  const arrow=document.createElement('span');arrow.className='phase403-turn-arrow';arrow.textContent='▼';owner.appendChild(arrow);
}
function installBotLabels(g){
  const profiles=window.SVR_PHASE403_BOT_PROFILES||{};
  for(const player of g.players||[]){
    if(player.index===0)continue;
    const seat=$(`[data-player="${player.index}"]`);if(!seat)continue;
    let badge=seat.querySelector('.phase403-bot-style');if(!badge){badge=document.createElement('span');badge.className='phase403-bot-style';seat.appendChild(badge)}
    badge.textContent=profiles[player.index]?.style||player.botStyle||'BOT';
    badge.title=`${player.name} poker style: ${badge.textContent}`;
  }
}
function currentPrompt(g){
  if(g.handOver)return'SHOWDOWN COMPLETE';
  const player=g.players?.[g.activePlayer];if(!player)return'WAITING FOR ACTION';
  const need=Math.max(0,Number(g.currentBet||0)-Number(player.streetBet||0));
  if(player.index===0)return need?`YOUR TURN • CALL ${money(Math.min(need,player.stack))} / FOLD / RAISE`:'YOUR TURN • CHECK / BET';
  return `${player.name.toUpperCase()} • ${need?`FACING ${money(need)}`:'CAN CHECK'} • ${g.turnSeconds}s`;
}
function recentActions(g){
  const trail=(g.actionTrail||[]).filter(row=>row.hand===g.hand).slice(-4);
  return trail.map(row=>`${row.name}: ${row.label}`).join('  ›  ');
}
function updateFlowRail(g){
  const rail=$('#phase403FlowRail');if(!rail)return;
  const current=rail.querySelector('.phase403-flow-current'),prompt=currentPrompt(g),recent=recentActions(g);
  current.textContent=recent?`${prompt}  •  ${recent}`:prompt;
  current.classList.toggle('user',g.activePlayer===0&&!g.handOver);
}
function historyRows(g){
  const streetNames=['PRE','FLOP','TURN','RIVER','SHOW'];
  const rows=(g.actionTrail||[]).filter(row=>row.hand===g.hand);
  if(!rows.length)return'<div class="phase403-log-row"><strong>HAND</strong><span>NO ACTION</span><span>Waiting for the first decision.</span></div>';
  return rows.map((row,i)=>`<div class="phase403-log-row"><strong>${i+1}. ${streetNames[row.street]||'HAND'}</strong><span>${row.name}</span><span>${row.label}</span></div>`).join('');
}
function openHistory(){
  const g=game(),sheet=$('#phase403HistorySheet');if(!g||!sheet)return;
  sheet.querySelector('.phase403-log').innerHTML=historyRows(g);sheet.classList.remove('hide');
}
function enhanceGuide(){
  if(state.guideEnhanced)return;
  const guides=[...document.querySelectorAll('#phase399HandsSheet .phase399-hand-guide')];if(guides.length<10)return;
  guides.slice(0,10).forEach((guide,index)=>{
    if(guide.querySelector('.phase403-guide-example'))return;
    const example=document.createElement('div');example.className='phase403-guide-example';example.innerHTML=GUIDE_EXAMPLES[index].map(card=>miniCard(card,true)).join('');guide.appendChild(example);
  });
  state.guideEnhanced=true;
}
function handMarkup(g,index){
  const player=g.players?.[index],hand=g.lastShowdownHands?.[index];if(!player||!hand)return'';
  return `<div class="phase403-hand-line"><strong>${player.name} • ${hand.name}</strong>${(hand.bestFive||[]).map(card=>miniCard(cardText(card),true)).join('')}</div>`;
}
function showComplexPotResult(g){
  const breakdown=g.lastPotBreakdown||[],complex=breakdown.length>1||breakdown.some(pot=>pot.type==='refund');
  if(!g.handOver||!complex||state.lastComplexResultHand===g.hand)return;
  state.lastComplexResultHand=g.hand;
  const sheet=$('#phase403PotSheet');if(!sheet)return;
  $('#phase399ResultSheet')?.classList.add('hide');
  const pots=breakdown.map(pot=>{
    const refund=pot.type==='refund';
    return `<article class="phase403-pot-card${refund?' refund':''}"><strong>${pot.label} • ${money(pot.amount)}</strong><div class="winner">${refund?'RETURN':(pot.winnerNames||[]).join(' & ')}</div><div>${pot.handName||''}${pot.remainder?` • odd chip ${pot.remainder}`:''}</div></article>`;
  }).join('');
  const winnerIndexes=[...new Set(breakdown.flatMap(pot=>pot.winnerIndexes||[]))],showIndexes=[...winnerIndexes];if(!showIndexes.includes(0)&&g.players?.[0]&&!g.players[0].folded)showIndexes.push(0);
  sheet.querySelector('.phase403-pot-summary').textContent=`${breakdown.filter(p=>p.type==='pot').length} contested pot(s) • exact contribution accounting • odd chips move left-to-right from the dealer.`;
  sheet.querySelector('.phase403-pot-list').innerHTML=pots;
  sheet.querySelector('.phase403-pot-hands').innerHTML=showIndexes.map(index=>handMarkup(g,index)).join('');
  sheet.classList.remove('hide');
}
function updatePotBadge(g){
  let badge=$('#phase403PotBadge');
  const breakdown=g.lastPotBreakdown||[];
  if(!g.handOver||breakdown.length<=1){badge?.remove();return}
  if(!badge){badge=document.createElement('div');badge.id='phase403PotBadge';badge.className='phase403-pot-badge';$('.table-surface')?.appendChild(badge)}
  badge.textContent=`MAIN + ${Math.max(0,breakdown.filter(p=>p.type==='pot').length-1)} SIDE POT${breakdown.filter(p=>p.type==='pot').length-1===1?'':'S'}`;
}
function ensureTournamentExtra(){
  const hud=$('#phase401TournamentHud');if(!hud)return null;
  let extra=hud.querySelector('.phase403-tourney-extra');if(!extra){extra=document.createElement('span');extra.className='phase403-tourney-extra';extra.innerHTML='<span data-pos>POS -</span><span data-avg>AVG -</span><span data-next>NEXT -</span>';hud.appendChild(extra)}
  state.tournamentExtraReady=true;return extra;
}
function updateTournamentExtra(){
  const director=window.SVR_PHASE401_TOURNAMENT_DIRECTOR;if(!director?.active?.())return;
  const t=director.getState?.();if(!t)return;const extra=ensureTournamentExtra();if(!extra)return;
  const active=(t.entrants||[]).filter(e=>e.status==='active'&&e.stack>0),sorted=[...active].sort((a,b)=>b.stack-a.stack),user=active.find(e=>e.isUser),pos=user?sorted.findIndex(e=>e.id===user.id)+1:null,avg=active.length?Math.round(active.reduce((sum,e)=>sum+e.stack,0)/active.length):0;
  const cfg=director.config||t.config,levels=cfg?.levels||[],roundsPer=Math.max(1,Number(cfg?.roundsPerLevel||2)),currentIndex=Math.min(levels.length-1,Math.floor(Math.max(0,t.round||0)/roundsPer)),next=levels[Math.min(levels.length-1,currentIndex+1)],until=roundsPer-(Math.max(0,t.round||0)%roundsPer);
  extra.querySelector('[data-pos]').innerHTML=`POS <b>${pos||'-'}/${active.length||0}</b>`;extra.querySelector('[data-avg]').innerHTML=`AVG <b>${Math.max(0,avg).toLocaleString()}</b>`;extra.querySelector('[data-next]').innerHTML=next?`NEXT <b>${next.smallBlind}/${next.bigBlind}</b> IN ${until}`:'FINAL LEVEL';
}
function qa(){
  const g=game();return{build:BUILD,installed:state.installed,flowRail:Boolean($('#phase403FlowRail')),historyButton:Boolean($('#phase403HistoryButton')),activeArrow:document.querySelectorAll('.phase403-turn-arrow').length,guideExamples:document.querySelectorAll('.phase403-guide-example').length,botStyleBadges:document.querySelectorAll('.phase403-bot-style').length,sidePotSheet:Boolean($('#phase403PotSheet')),tournamentExtraReady:state.tournamentExtraReady,engineBuild:g?.engineBuild||null,visualOrder:window.SVR_PHASE403_VISUAL_LEFT_SEAT_ORDER||null,lastError:state.lastError,pass:Boolean(state.installed&&$('#phase403FlowRail')&&$('#phase403HistoryButton')&&$('#phase403PotSheet')&&!state.lastError),checkedAt:new Date().toISOString()}}
function poll(){
  try{
    if(!ensureUi())return;const g=game();if(!g?.players?.length)return;
    updateActiveOwner(g);installBotLabels(g);updateFlowRail(g);enhanceGuide();updateTournamentExtra();showComplexPotResult(g);updatePotBadge(g);
    state.lastHand=g.hand;state.lastLogSize=(g.actionTrail||[]).length;state.checkedAt=new Date().toISOString();
  }catch(error){state.lastError=String(error?.message||error)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureUi();setInterval(poll,90)},{once:true});else{ensureUi();setInterval(poll,90)}
window.SVR_PHASE403_TABLE_CLARITY_QA=qa;
