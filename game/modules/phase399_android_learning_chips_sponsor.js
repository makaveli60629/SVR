/* PHASE-399-ANDROID-LEARNING-CHIPS-SPONSOR-LOCK */
import {evaluate,compareScore,cardKey,describePreflop} from './phase393_android_evaluator.js?v=phase399';

const BUILD='PHASE-399-ANDROID-LEARNING-WINNER-CHIPS-SPONSOR-LOCK';
const TICKET_CHANCE=.08;
const HAND_GUIDE=[
  ['Royal Flush','A-K-Q-J-10, all the same suit.'],
  ['Straight Flush','Five consecutive cards, all the same suit.'],
  ['Four of a Kind','Four cards of the same rank.'],
  ['Full House','Three of a kind plus a pair.'],
  ['Flush','Five cards of the same suit.'],
  ['Straight','Five consecutive ranks; suits do not matter.'],
  ['Three of a Kind','Three cards of the same rank.'],
  ['Two Pair','Two different pairs.'],
  ['Pair','Two cards of the same rank.'],
  ['High Card','No made hand; highest five cards play.']
];
const DENOMS=[5000,1000,500,100,50];
const state={build:BUILD,installed:false,coachOn:localStorage.getItem('svr399coach')!=='off',lastHand:0,lastResultHand:0,ticketHand:0,ticketAcknowledged:false,ticketResolved:false,tickets:Number(localStorage.getItem('svr399TournamentTickets')||0),entries:Number(localStorage.getItem('svr399TournamentEntries')||0),lastTicketWinners:[],lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const symbol=s=>({S:'♠',H:'♥',D:'♦',C:'♣'}[s]||s||'');
const red=card=>card?.s==='H'||card?.s==='D';
const money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`;

function cardText(card){return `${card?.r||'?'}${symbol(card?.s)}`}
function handKeys(hand){return new Set((hand?.bestFive||[]).map(cardKey))}
function resultCard(card,used=false,origin=''){
  return `<span class="phase399-result-card${red(card)?' red':''}${used?' used':''}" title="${origin==='H'?'Hole card':'Community card'}">${cardText(card)}</span>`;
}
function stackLayers(count){return Math.max(1,Math.min(5,Math.ceil(Math.log2(Math.max(1,count)+1))))}
function decomposeStack(amount){
  let left=Math.max(0,Math.floor(Number(amount||0)/50)*50),out=[];
  for(const denom of DENOMS){const count=Math.floor(left/denom);if(count){out.push({denom,count});left-=count*denom}}
  return out;
}
function renderChipRack(){
  const rack=$('#phase399ChipRack'),g=game(),player=g?.players?.[0];if(!rack||!player)return;
  const stacks=decomposeStack(player.stack);
  rack.innerHTML=stacks.map(({denom,count})=>`<span class="phase399-chip-stack" data-denom="${denom}" title="${count} × ${money(denom)}">${Array.from({length:stackLayers(count)},()=>'<i></i>').join('')}<b class="phase399-chip-count">${count}</b></span>`).join('')+`<button id="phase399TicketBank" class="phase399-ticket-count" type="button"><span class="phase399-mini-ticket">T</span>TKT ${state.tickets}</button>`;
  $('#phase399TicketBank')?.addEventListener('click',openTicketBank,{once:true});
}
function clearHighlights(){document.querySelectorAll('.card.phase399-used,.card.phase399-winner-used').forEach(el=>el.classList.remove('phase399-used','phase399-winner-used'))}
function highlightUser(hand,klass='phase399-used'){
  clearHighlights();const g=game(),user=g?.players?.[0];if(!user||!hand)return;const keys=handKeys(hand);
  [...document.querySelectorAll('#hole .card')].forEach((el,i)=>{if(keys.has(cardKey(user.cards[i])))el.classList.add(klass)});
  [...document.querySelectorAll('#community .card')].forEach((el,i)=>{if(keys.has(cardKey(g.community[i])))el.classList.add(klass)});
}
function updateCoach(){
  const coach=$('#phase399Coach'),g=game(),user=g?.players?.[0];if(!coach||!g||!user)return;
  const label=coach.querySelector('span'),toggle=coach.querySelector('button');
  toggle.textContent=state.coachOn?'ON':'OFF';toggle.classList.toggle('active',state.coachOn);
  if(!state.coachOn){label.textContent='Hand Coach is off';clearHighlights();return}
  const available=[...(user.cards||[]),...(g.community||[])].filter(Boolean);
  if(available.length<5){label.textContent=`Pre-flop: ${describePreflop(user.cards)}`;clearHighlights();return}
  const hand=evaluate(available);const holeKeys=new Set((user.cards||[]).map(cardKey)),usedHole=(hand.bestFive||[]).filter(c=>holeKeys.has(cardKey(c))).length;
  label.textContent=`${hand.name} • best five uses ${usedHole} hole + ${5-usedHole} board`;
  highlightUser(hand);
}
function guideMarkup(){return HAND_GUIDE.map(([name,desc],i)=>`<article class="phase399-hand-guide"><strong>${i+1}. ${name}</strong><span>${desc}</span></article>`).join('')}
function openGuide(){
  const g=game();if(g?.activePlayer===0&&!g?.handOver){toast('Finish your action first — the hand guide opens between your turns.');return}
  $('#phase399HandsSheet')?.classList.remove('hide');
}
function closeGuide(){$('#phase399HandsSheet')?.classList.add('hide')}
function closeResult(){$('#phase399ResultSheet')?.classList.add('hide')}
function toast(text){const el=$('#tableMessage');if(el){const old=el.textContent;el.textContent=text;setTimeout(()=>{if(el.textContent===text)el.textContent=old},2200)}}
function renderPlayerResult(entry,winner,userIndex=0){
  const g=game(),player=entry.player,hand=entry.hand,used=handKeys(hand),holeKeys=new Set((player.cards||[]).map(cardKey));
  const all=[...(player.cards||[]),...(g.community||[])];
  const cards=all.map(card=>resultCard(card,used.has(cardKey(card)),holeKeys.has(cardKey(card))?'H':'B')).join('');
  const best=(hand.bestFive||[]).map(cardText).join(' ');
  return `<article class="phase399-result-player${winner?' winner':''}${player.index===userIndex?' user':''}"><h3>${winner?'🏆 ':''}${player.name} — ${hand.name}</h3><p>${player.index===userIndex?'YOUR HAND':'SHOWDOWN HAND'} • highlighted cards make the best five</p><div class="phase399-card-line">${cards}</div><div class="phase399-best-five">BEST FIVE: ${best}</div></article>`;
}
function showdownResults(g){
  const contenders=(g.players||[]).filter(p=>!p.folded&&p.cards?.length===2).map(player=>({player,hand:evaluate([...(player.cards||[]),...(g.community||[])])}));
  contenders.sort((a,b)=>compareScore(b.hand.score,a.hand.score));
  if(!contenders.length)return null;
  const best=contenders[0],winners=contenders.filter(x=>compareScore(x.hand.score,best.hand.score)===0);
  return{contenders,winners,best};
}
function awardTicketIfNeeded(g,results){
  if(state.ticketHand!==g.hand||state.ticketResolved||!results)return'';
  state.ticketResolved=true;state.lastTicketWinners=results.winners.map(x=>x.player.name);
  const userWon=results.winners.some(x=>x.player.index===0);
  if(userWon){state.tickets+=1;localStorage.setItem('svr399TournamentTickets',String(state.tickets));renderChipRack()}
  window.SVR_PHASE399_TOURNAMENT_TICKET_STATE={hand:g.hand,winners:state.lastTicketWinners,userWon,tickets:state.tickets,nonCash:true,checkedAt:new Date().toISOString()};
  return results.winners.length>1?' • TICKET POT TIED: EACH WINNER EARNS A TICKET':` • TOURNAMENT TICKET → ${results.winners[0]?.player?.name||'WINNER'}`;
}
function showResult(g){
  const results=showdownResults(g);if(!results)return;
  const sheet=$('#phase399ResultSheet');if(!sheet)return;
  const tie=results.winners.length>1,ticketNote=awardTicketIfNeeded(g,results),userEntry=results.contenders.find(x=>x.player.index===0),winnerSet=new Set(results.winners.map(x=>x.player.index));
  const display=[...results.winners];if(userEntry&&!winnerSet.has(0))display.push(userEntry);
  sheet.querySelector('.phase399-result-title').textContent=tie?`TIE / SPLIT POT — ${results.best.hand.name}`:`${results.winners[0].player.name} WINS — ${results.best.hand.name}`;
  sheet.querySelector('.phase399-result-sub').textContent=`Exact best-five cards are highlighted${ticketNote}`;
  sheet.querySelector('.phase399-result-grid').innerHTML=display.map(entry=>renderPlayerResult(entry,winnerSet.has(entry.player.index))).join('');
  sheet.classList.remove('hide');
  if(userEntry)highlightUser(userEntry.hand,winnerSet.has(0)?'phase399-winner-used':'phase399-used');
}
function maybeTicketHand(g){
  state.ticketHand=0;state.ticketAcknowledged=false;state.ticketResolved=false;state.lastTicketWinners=[];
  const match=window.SVR_PHASE399_MATCH_STATE;
  const serverTicket=Number(match?.ticketHand||0)===g.hand;
  const localEligible=!match||match.mode==='bots'||match.mode==='fallback-bots'||match.mode==='searching';
  if(!(serverTicket||(localEligible&&Math.random()<TICKET_CHANCE)))return;
  state.ticketHand=g.hand;
  const notice=$('#phase399TicketNotice');if(!notice)return;
  notice.querySelector('strong').textContent='TOURNAMENT TICKET POT INCOMING';
  notice.querySelector('p').textContent='A promotional tournament-entry chip is entering this pot. Press OK to acknowledge it. Whoever wins this pot earns the ticket; tied winners each receive one.';
  const button=notice.querySelector('button');button.textContent='OK';button.onclick=()=>ackTicket();notice.classList.remove('hide');
  window.SVR_PHASE399_TOURNAMENT_TICKET_STATE={hand:g.hand,pending:true,acknowledged:false,nonCash:true};
}
function ackTicket(){
  state.ticketAcknowledged=true;const notice=$('#phase399TicketNotice');notice?.classList.add('hide');animateTicketToPot();
  window.SVR_PHASE399_TOURNAMENT_TICKET_STATE={...(window.SVR_PHASE399_TOURNAMENT_TICKET_STATE||{}),acknowledged:true,pending:false,checkedAt:new Date().toISOString()};
}
function animateTicketToPot(){
  const from=$('#phase399TicketBank')||$('.stack-pill'),to=$('#potTarget');if(!from||!to)return;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),chip=document.createElement('i');chip.className='phase399-ticket-flight';chip.style.left=`${a.left+a.width/2-15}px`;chip.style.top=`${a.top+a.height/2-15}px`;document.body.appendChild(chip);
  requestAnimationFrame(()=>{chip.style.transform=`translate(${b.left+b.width/2-(a.left+a.width/2)}px,${b.top+b.height/2-(a.top+a.height/2)}px) scale(.72) rotate(720deg)`;chip.style.opacity='.18'});setTimeout(()=>chip.remove(),850);
}
function openTicketBank(){
  const sheet=$('#phase399TicketSheet');if(!sheet)return;
  sheet.querySelector('[data-ticket-count]').textContent=String(state.tickets);sheet.querySelector('[data-entry-count]').textContent=String(state.entries);sheet.classList.remove('hide');
}
function closeTicketBank(){$('#phase399TicketSheet')?.classList.add('hide')}
function redeemTicket(){
  if(state.tickets<=0){toast('No tournament tickets available yet.');return}
  state.tickets-=1;state.entries+=1;localStorage.setItem('svr399TournamentTickets',String(state.tickets));localStorage.setItem('svr399TournamentEntries',String(state.entries));renderChipRack();openTicketBank();toast('Demo tournament entry reserved. Live tournament sync will use the multiplayer backend.');
  window.SVR_PHASE399_TOURNAMENT_REDEMPTION={tickets:state.tickets,entries:state.entries,localDemoReservation:true,checkedAt:new Date().toISOString()};
}
function sponsorRoom(roomId='reiki-demo-room'){
  const rooms=window.SVR_ANDROID_SPONSOR_ROOMS||[
    {id:'reiki-zen-a',skin:'reiki',name:'REIKI • ZEN TABLE'},
    {id:'reiki-zen-b',skin:'reiki',name:'REIKI • SECONDARY ROOM'},
    {id:'svr-main',skin:'reiki',name:'REIKI • FEATURED PARTNER'}
  ];
  const seed=[...String(roomId)].reduce((a,c)=>a+c.charCodeAt(0),0),room=rooms[seed%rooms.length]||rooms[0];
  const table=$('.table-surface'),featured=$('#featuredSponsor');if(table)table.dataset.sponsorSkin=room.skin||'reiki';if(featured){featured.classList.add('phase399-felt-brand');const strong=featured.querySelector('strong');if(strong)strong.textContent=room.name||'REIKI'}
  state.sponsorRoom=room;window.SVR_PHASE399_SPONSOR_ROOM={roomId,room,checkedAt:new Date().toISOString()};return room;
}
function onNewHand(g){
  state.lastHand=g.hand;state.lastResultHand=0;closeResult();clearHighlights();maybeTicketHand(g);renderChipRack();updateCoach();
}
function onHandOver(g){if(state.lastResultHand===g.hand)return;state.lastResultHand=g.hand;showResult(g)}
function ensureUi(){
  if(state.installed)return true;const stack=$('.stack-pill'),raise=$('#raisePanel'),footer=$('.footer');if(!stack||!raise||!footer)return false;
  stack.insertAdjacentHTML('beforeend','<div id="phase399ChipRack" class="phase399-chip-rack" aria-label="Decorative player chip stacks"></div>');
  raise.querySelector('.raise-head')?.insertAdjacentHTML('afterend','<div id="phase399Coach" class="phase399-coach"><strong>SMART HAND COACH</strong><span>Waiting for cards</span><button type="button" aria-label="Toggle hand coach">ON</button></div>');
  $('#phase399Coach button')?.addEventListener('click',()=>{state.coachOn=!state.coachOn;localStorage.setItem('svr399coach',state.coachOn?'on':'off');updateCoach()});
  const hands=document.createElement('button');hands.id='phase399HandsButton';hands.type='button';hands.className='phase399-footer-button';hands.textContent='HANDS';hands.addEventListener('click',openGuide);footer.appendChild(hands);
  document.body.insertAdjacentHTML('beforeend',`
    <section id="phase399HandsSheet" class="phase399-sheet hide" aria-label="Texas Holdem hand guide"><div class="phase399-sheet-head"><h2>Texas Hold'em — Hand Guide</h2><button type="button" data-close-hands>✕</button></div><div class="phase399-hand-grid">${guideMarkup()}</div></section>
    <section id="phase399ResultSheet" class="phase399-sheet hide" aria-label="Showdown teaching result"><div class="phase399-sheet-head"><h2>Showdown Breakdown</h2><button type="button" data-close-result>✕</button></div><div class="phase399-result-title"></div><div class="phase399-result-sub"></div><div class="phase399-result-grid"></div></section>
    <section id="phase399TicketSheet" class="phase399-sheet hide" aria-label="Tournament ticket bank"><div class="phase399-sheet-head"><h2>Tournament Ticket Bank</h2><button type="button" data-close-ticket-bank>✕</button></div><p>You have <strong data-ticket-count>${state.tickets}</strong> promotional tournament ticket(s) and <strong data-entry-count>${state.entries}</strong> locally reserved demo entry/entries.</p><p style="font-size:10px;color:#bfd4e7">Tickets have no cash value in this test build. Live tournament entry synchronization will require the multiplayer/tournament backend.</p><button id="phase399RedeemTicket" class="btn primary" type="button">RESERVE DEMO ENTRY WITH 1 TICKET</button></section>
    <aside id="phase399TicketNotice" class="phase399-ticket-notice hide" role="dialog" aria-live="assertive"><div class="phase399-ticket-chip">TKT</div><strong>TOURNAMENT TICKET POT</strong><p></p><button type="button">OK</button></aside>`);
  $('[data-close-hands]')?.addEventListener('click',closeGuide);$('[data-close-result]')?.addEventListener('click',closeResult);$('[data-close-ticket-bank]')?.addEventListener('click',closeTicketBank);$('#phase399RedeemTicket')?.addEventListener('click',redeemTicket);
  sponsorRoom(sessionStorage.getItem('svr399SponsorRoom')||'reiki-demo-room');renderChipRack();state.installed=true;return true;
}
function sync(){
  try{
    if(!ensureUi())return;const g=game();if(!g){state.checkedAt=new Date().toISOString();return}
    if(g.joined&&g.hand>0&&g.hand!==state.lastHand)onNewHand(g);
    if(g.joined&&g.handOver&&g.hand>0)onHandOver(g);
    renderChipRack();updateCoach();
    const room=window.SVR_PHASE399_MATCH_STATE?.roomId;if(room&&room!==state.lastRoom){state.lastRoom=room;sessionStorage.setItem('svr399SponsorRoom',room);sponsorRoom(room)}
    state.checkedAt=new Date().toISOString();window.SVR_PHASE399_ANDROID_EXPERIENCE_STATE={...state,pass:Boolean(state.installed&&!state.lastError),coachOn:state.coachOn,tickets:state.tickets,entries:state.entries};
  }catch(error){state.lastError=String(error?.message||error);window.SVR_PHASE399_ANDROID_EXPERIENCE_STATE={...state,pass:false}}
}
function qa(){sync();return{...state,exactBestFiveEvaluator:true,winnerBreakdown:Boolean($('#phase399ResultSheet')),handGuide:Boolean($('#phase399HandsSheet')),handCoach:Boolean($('#phase399Coach')),chipRack:Boolean($('#phase399ChipRack')),ticketNotice:Boolean($('#phase399TicketNotice')),reikiFeltBrand:$('.table-surface')?.dataset?.sponsorSkin==='reiki',nonCashTournamentTicket:true,pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()}}
window.SVR_PHASE399_SET_SPONSOR_ROOM=sponsorRoom;window.SVR_PHASE399_ANDROID_LEARNING_QA=qa;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureUi();sync()},{once:true});else{ensureUi();sync()}
setInterval(sync,180);
