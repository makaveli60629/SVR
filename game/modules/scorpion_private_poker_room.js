// PHASE-124-SCORPION-GAMEPLAY-WIRING-LOCK
// Game-side only. Dedicated Scorpion private poker room with local play-money
// gameplay wiring: player actions, bot actions, pot/chip updates, board cards,
// next hand, and private-room status. No website or /site files are touched.

const PHASE = 'PHASE-124-SCORPION-GAMEPLAY-WIRING-LOCK';
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const VALUE = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,T:10,J:11,Q:12,K:13,A:14 };
const USER = 3;
const START = 1000;
const SB = 10;
const BB = 20;
let deck = [];
let board = [];
let street = 'idle';
let pot = 0;
let currentBet = 0;
let handNo = 0;
let dealer = 5;
let active = USER;
let statusText = 'Press Next Hand to start private Scorpion play-money poker.';
let players = [];

function makeDeck(){
  const out = [];
  for (const s of SUITS) for (const r of RANKS) out.push({ rank:r, suit:s, value:VALUE[r], id:r+s });
  for (let i = out.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function cardHtml(card, hidden){
  if (hidden) return '<span class="card back">SVR</span>';
  const id = typeof card === 'string' ? card : card?.id;
  const red = id && (id.includes('♥') || id.includes('♦'));
  return '<span class="card ' + (red ? 'red' : '') + '">' + (id || '--') + '</span>';
}
function initPlayers(){
  const names = ['NOVA BOT','CARLA BOT','MILO BOT','YOU','RIVER BOT','ONYX BOT'];
  players = names.map((name, i)=>({ name, stack: START, cards: [], folded:false, allIn:false, bet:0, action:'Waiting', isUser:i===USER }));
}
function livePlayers(){ return players.filter(p=>!p.folded && p.cards.length); }
function userTurn(){ return street !== 'idle' && street !== 'showdown' && active === USER && !players[USER].folded && !players[USER].allIn; }
function toCall(i=USER){ return Math.max(0, currentBet - players[i].bet); }
function collect(i, amount){
  const p = players[i];
  const pay = Math.max(0, Math.min(Math.floor(amount), p.stack));
  p.stack -= pay;
  p.bet += pay;
  pot += pay;
  if (p.stack <= 0) p.allIn = true;
  return pay;
}
function postBlind(i, amount, label){ const paid = collect(i, amount); players[i].action = label + ' $' + paid; currentBet = Math.max(currentBet, players[i].bet); }
function nextIndex(i){ return (i + 1) % players.length; }
function dealHole(){ for (let r=0;r<2;r++) for (let i=0;i<players.length;i++) players[i].cards.push(deck.pop()); }
function beginHand(){
  handNo += 1;
  dealer = nextIndex(dealer);
  deck = makeDeck(); board = []; pot = 0; currentBet = 0; street = 'preflop'; active = USER;
  players.forEach(p=>{ if (p.stack <= 0) p.stack = START; p.cards=[]; p.folded=false; p.allIn=false; p.bet=0; p.action='In hand'; });
  dealHole();
  postBlind(nextIndex(dealer), SB, 'SB');
  postBlind(nextIndex(nextIndex(dealer)), BB, 'BB');
  statusText = 'Hand ' + handNo + ': your turn in the private Scorpion room.';
  render();
}
function resetBets(){ players.forEach(p=>{ p.bet = 0; }); currentBet = 0; }
function drawBoardForStreet(){
  if (street === 'flop' && board.length < 3) board.push(deck.pop(), deck.pop(), deck.pop());
  if (street === 'turn' && board.length < 4) board.push(deck.pop());
  if (street === 'river' && board.length < 5) board.push(deck.pop());
}
function advanceStreet(){
  if (livePlayers().length <= 1) return showdown();
  if (street === 'preflop') street = 'flop';
  else if (street === 'flop') street = 'turn';
  else if (street === 'turn') street = 'river';
  else if (street === 'river') return showdown();
  resetBets();
  drawBoardForStreet();
  active = USER;
  statusText = street.toUpperCase() + ' dealt. Your turn.';
  render();
}
function scorePlayer(p){
  const all = [...p.cards, ...board];
  const counts = {};
  all.forEach(c=>{ counts[c.value] = (counts[c.value]||0) + 1; });
  const vals = all.map(c=>c.value).sort((a,b)=>b-a);
  const groups = Object.entries(counts).map(([v,c])=>({ v:Number(v), c })).sort((a,b)=>b.c-a.c || b.v-a.v);
  let category = 0;
  if (groups[0]?.c === 4) category = 7;
  else if (groups[0]?.c === 3 && groups[1]?.c >= 2) category = 6;
  else if (groups[0]?.c === 3) category = 3;
  else if (groups[0]?.c === 2 && groups[1]?.c === 2) category = 2;
  else if (groups[0]?.c === 2) category = 1;
  return category * 1000000 + vals.slice(0,5).reduce((a,v,i)=>a + v * Math.pow(15, 4-i), 0);
}
function labelScore(score){
  const cat = Math.floor(score / 1000000);
  return ['High Card','Pair','Two Pair','Trips','Straight','Flush','Full House','Quads'][cat] || 'Hand';
}
function showdown(){
  const live = livePlayers();
  if (board.length < 5) while (board.length < 5) board.push(deck.pop());
  let winner = live[0];
  let best = -1;
  live.forEach(p=>{ const s = scorePlayer(p); if (s > best){ best = s; winner = p; } });
  if (winner){ winner.stack += pot; winner.action = 'Wins $' + pot; }
  statusText = winner ? winner.name + ' wins $' + pot + ' with ' + labelScore(best) + '.' : 'Hand complete.';
  pot = 0; street = 'showdown'; active = -1;
  render();
}
function botsAct(){
  for (let i=0;i<players.length;i++){
    if (i === USER) continue;
    const p = players[i];
    if (p.folded || p.allIn || !p.cards.length) continue;
    const call = toCall(i);
    const strength = (p.cards[0].value + p.cards[1].value) / 28 + Math.random() * 0.25;
    if (call > 0 && strength < 0.44 && call > p.stack * 0.08){ p.folded = true; p.action = 'Fold'; continue; }
    if (strength > 0.86 && p.stack > call + BB){ const target = currentBet + BB; const paid = collect(i, target - p.bet); currentBet = Math.max(currentBet, p.bet); p.action = 'Raise $' + paid; continue; }
    const paid = collect(i, call);
    p.action = call > 0 ? 'Call $' + paid : 'Check';
  }
  if (livePlayers().length <= 1) showdown();
  else advanceStreet();
}
function userAction(type){
  if (!userTurn() && type !== 'next'){ statusText = 'Action locked. Wait for your turn or start the next hand.'; render(); return; }
  const p = players[USER];
  const call = toCall(USER);
  if (type === 'next') return beginHand();
  if (type === 'fold'){ p.folded = true; p.action = 'Fold'; statusText = 'You folded. Bots complete the hand.'; return botsAct(); }
  if (type === 'allin'){ const paid = collect(USER, p.stack); currentBet = Math.max(currentBet, p.bet); p.action = 'All-In $' + paid; statusText = 'You are all-in.'; return botsAct(); }
  if (type === 'raise'){
    const target = Math.min(p.bet + p.stack, Math.max(currentBet + BB, currentBet + Math.ceil((pot + call) / 2)));
    const paid = collect(USER, target - p.bet); currentBet = Math.max(currentBet, p.bet); p.action = 'Raise $' + paid; statusText = 'You raised. Bots acting.'; return botsAct();
  }
  const paid = collect(USER, call);
  p.action = call > 0 ? 'Call $' + paid : 'Check';
  statusText = call > 0 ? 'You called. Bots acting.' : 'You checked. Bots acting.';
  botsAct();
}
function injectStyle(){
  const s = document.createElement('style');
  s.textContent = `
    html,body{height:100%;margin:0;background:radial-gradient(circle at 50% 12%,rgba(118,28,42,.32),transparent 32%),linear-gradient(#030305,#090712 48%,#010102);color:#f7f0ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;overflow:hidden}*{box-sizing:border-box}.stars{position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.48) 0 1px,transparent 1px),radial-gradient(circle,rgba(255,107,127,.22) 0 1px,transparent 1px);background-size:86px 86px,134px 134px;opacity:.34;animation:drift 34s linear infinite}.moon,.mars{position:fixed;border-radius:50%;box-shadow:0 0 42px currentColor}.moon{right:10%;top:8%;width:70px;height:70px;background:#d8d5cb;color:#d8d5cb}.mars{left:11%;top:15%;width:54px;height:54px;background:#c86d43;color:#c86d43}.wrap{position:fixed;inset:0;display:grid;place-items:center;padding:18px}.room{position:relative;width:min(1120px,calc(100vw - 28px));height:min(760px,calc(100vh - 28px));border:1px solid rgba(255,107,127,.42);border-radius:30px;background:linear-gradient(135deg,rgba(5,8,16,.9),rgba(34,8,22,.92));box-shadow:0 32px 90px rgba(0,0,0,.62),inset 0 0 80px rgba(255,107,127,.06);overflow:hidden}.head{position:absolute;left:26px;right:26px;top:24px;display:flex;justify-content:space-between;gap:18px;z-index:3}.k{font-size:12px;font-weight:900;letter-spacing:.18em;color:#ff6b7f}.title{font-size:clamp(30px,4vw,56px);font-weight:950;line-height:.95;letter-spacing:-.04em}.sub{max-width:700px;margin-top:8px;color:rgba(247,240,255,.74);font-size:16px}.badge{border:1px solid rgba(246,226,127,.5);border-radius:999px;padding:8px 12px;color:#f6e27f;font-size:12px;font-weight:900;white-space:nowrap;height:max-content}.stage{position:absolute;left:28px;right:28px;top:142px;bottom:128px;border:1px solid rgba(180,140,255,.20);border-radius:24px;background:radial-gradient(ellipse at center,rgba(255,107,127,.08),transparent 58%),rgba(0,0,0,.22);overflow:hidden}.floor{position:absolute;left:-10%;right:-10%;bottom:-25%;height:76%;background:linear-gradient(rgba(255,107,127,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,127,.10) 1px,transparent 1px);background-size:42px 42px;transform:perspective(700px) rotateX(63deg);transform-origin:bottom}.wall{position:absolute;left:24px;right:24px;top:22px;height:45%;border:1px solid rgba(255,107,127,.20);border-bottom:0;border-radius:22px 22px 0 0;background:radial-gradient(circle at 50% 28%,rgba(246,226,127,.10),transparent 38%)}.table{position:absolute;left:50%;top:55%;width:min(560px,62vw);height:270px;transform:translate(-50%,-50%);border-radius:50%;border:7px solid rgba(48,18,28,.95);background:radial-gradient(ellipse at center,#18382d,#071712 70%);box-shadow:0 24px 70px rgba(0,0,0,.62),inset 0 0 50px rgba(127,245,199,.10)}.rail{position:absolute;inset:22px;border-radius:50%;border:2px solid rgba(246,226,127,.28)}.felt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#7ff5c7;font-size:12px;font-weight:900;letter-spacing:.14em;text-align:center}.board{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);display:flex;gap:7px}.hole{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);display:flex;gap:7px}.botcards{display:flex;gap:3px;justify-content:center;margin-top:5px}.card{display:inline-grid;place-items:center;width:42px;height:58px;border-radius:7px;background:#f7f4ff;color:#111827;border:2px solid rgba(0,0,0,.25);font-weight:950;font-size:17px;box-shadow:0 5px 12px rgba(0,0,0,.3)}.card.red{color:#b01832}.card.back{background:linear-gradient(135deg,#13091f,#30205f);color:#7ff5c7;border-color:rgba(127,245,199,.42);font-size:11px}.seat{position:absolute;width:128px;text-align:center;color:#f7f0ff}.seat .name{font-weight:950;font-size:12px}.seat .stack{font-size:11px;color:rgba(247,240,255,.68)}.seat .act{font-size:11px;color:#f6e27f;min-height:14px}.seat.active .name{color:#7ff5c7}.seat.folded{opacity:.48}.seat:before{content:"";display:block;margin:0 auto 6px;width:54px;height:54px;border-radius:50%;border:2px solid rgba(255,107,127,.38);background:linear-gradient(135deg,rgba(255,107,127,.24),rgba(180,140,255,.16));box-shadow:0 0 20px rgba(255,107,127,.12)}.seat.you:before{border-color:rgba(127,245,199,.72);box-shadow:0 0 25px rgba(127,245,199,.25)}.s0{left:50%;top:9%;transform:translateX(-50%)}.s1{right:10%;top:28%}.s2{right:15%;bottom:16%}.s3{left:50%;bottom:0;transform:translateX(-50%)}.s4{left:15%;bottom:16%}.s5{left:10%;top:28%}.chips{position:absolute;left:50%;top:61%;transform:translate(-50%,-50%);display:flex;gap:5px}.chip{width:22px;height:22px;border-radius:50%;border:3px dashed rgba(255,255,255,.75);background:#ff6b7f;box-shadow:0 4px 9px rgba(0,0,0,.35)}.chip:nth-child(2){background:#7ff5c7}.chip:nth-child(3){background:#b48cff}.chip:nth-child(4){background:#f6e27f}.actions{position:absolute;left:26px;right:26px;bottom:24px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.btn,a{border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:10px 14px;font-weight:900;text-decoration:none;cursor:pointer}.btn:disabled{opacity:.42;cursor:not-allowed}.btn.warn{border-color:rgba(255,107,127,.5);background:rgba(255,107,127,.08)}.status{margin-left:auto;color:rgba(247,240,255,.72);font-size:12px;max-width:420px}.scorpion{position:absolute;right:36px;top:38px;color:rgba(255,107,127,.42);font-size:80px;transform:rotate(-16deg)}@keyframes drift{from{background-position:0 0,0 0}to{background-position:220px 140px,-180px 220px}}@media(max-width:760px){body{overflow:auto}.wrap{position:relative;min-height:100%;display:block}.room{height:auto;min-height:930px}.head{position:relative;display:block}.stage{position:relative;left:auto;right:auto;top:auto;bottom:auto;height:590px;margin:30px 16px 130px}.actions{position:relative;margin:18px}.status{width:100%;margin-left:0}}
  `;
  document.head.appendChild(s);
}
function seatHtml(i, cls){
  const p = players[i];
  const cards = p?.cards?.length ? cardHtml(p.cards[0], !p.isUser) + cardHtml(p.cards[1], !p.isUser) : cardHtml(null,true) + cardHtml(null,true);
  return `<div class="seat ${cls} ${p?.isUser?'you':''} ${p?.folded?'folded':''} ${active===i?'active':''}" data-seat="${i}"><div class="name">${p.name}${i===dealer?' D':''}</div><div class="stack">$${p.stack} • Bet $${p.bet}</div><div class="act">${p.action || ''}</div><div class="botcards">${p.isUser?'':cards}</div></div>`;
}
function render(){
  const boardCards = [0,1,2,3,4].map(i=>board[i] ? cardHtml(board[i],false) : cardHtml(null,true)).join('');
  const userCards = players[USER]?.cards?.length ? players[USER].cards.map(c=>cardHtml(c,false)).join('') : cardHtml(null,true) + cardHtml(null,true);
  const call = toCall(USER);
  const turn = userTurn();
  const stage = document.getElementById('stage');
  if (stage){
    stage.innerHTML = `<div class="wall"></div><div class="floor"></div>${seatHtml(0,'s0')}${seatHtml(1,'s1')}${seatHtml(2,'s2')}${seatHtml(3,'s3')}${seatHtml(4,'s4')}${seatHtml(5,'s5')}<div class="table"><div class="rail"></div><div class="felt">POT $${pot}<br>${street.toUpperCase()}</div><div class="board" id="board">${boardCards}</div><div class="chips"><span class="chip"></span><span class="chip"></span><span class="chip"></span><span class="chip"></span></div><div class="hole" id="hole">${userCards}</div></div>`;
  }
  const st = document.getElementById('status'); if (st) st.textContent = statusText + ' • siteTouched: false';
  const callBtn = document.getElementById('checkCall'); if (callBtn) callBtn.textContent = call > 0 ? 'Call $' + call : 'Check';
  ['fold','checkCall','raise','allin'].forEach(id=>{ const el = document.getElementById(id); if (el) el.disabled = !turn; });
  const badge = document.getElementById('badge'); if (badge) badge.textContent = 'PHASE 124 • ' + street.toUpperCase();
}
function build(){
  injectStyle(); initPlayers();
  document.title = 'SVR Scorpion Room • Play-Money Private Poker';
  document.body.innerHTML = `
    <div class="stars"></div><div class="moon"></div><div class="mars"></div>
    <main class="wrap"><section class="room">
      <div class="scorpion">♏</div>
      <header class="head"><div><div class="k">PRIVATE PLAY-MONEY POKER WORLD</div><div class="title">SVR Scorpion Room</div><div class="sub">Separate enclosed Scorpion poker room with local play-money hand flow, user actions, bot actions, pot/chip updates, board cards, and next-hand loop.</div></div><div class="badge" id="badge">PHASE 124 GAMEPLAY</div></header>
      <section class="stage" id="stage"></section>
      <div class="actions"><a href="./">Return Lobby</a><button class="btn" id="nextHand">Next Hand</button><button class="btn warn" id="fold">Fold</button><button class="btn" id="checkCall">Check</button><button class="btn" id="raise">Raise</button><button class="btn warn" id="allin">All-In</button><span class="status" id="status">${statusText}</span></div>
    </section></main>`;
  document.getElementById('nextHand').addEventListener('click',()=>userAction('next'));
  document.getElementById('fold').addEventListener('click',()=>userAction('fold'));
  document.getElementById('checkCall').addEventListener('click',()=>userAction('call'));
  document.getElementById('raise').addEventListener('click',()=>userAction('raise'));
  document.getElementById('allin').addEventListener('click',()=>userAction('allin'));
  render();
  window.SVR_PHASE124_SCORPION_GAMEPLAY = { phase: PHASE, siteTouched:false, nextHand:beginHand, action:userAction, getState:()=>({ street, pot, currentBet, handNo, statusText, players:players.map(p=>({ name:p.name, stack:p.stack, bet:p.bet, folded:p.folded, action:p.action })) }) };
  window.SVR_PHASE118_SCORPION_PRIVATE_POKER_ROOM = window.SVR_PHASE124_SCORPION_GAMEPLAY;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once:true }); else build();
