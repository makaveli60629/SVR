// PHASE-118-SCORPION-PRIVATE-POKER-TABLE-PASS-LOCK
// Game-side only. Dedicated Scorpion private poker room shell with table,
// player seat, bot seats, cards, chips, and demo dealing controls.

const PHASE = 'PHASE-118-SCORPION-PRIVATE-POKER-TABLE-PASS-LOCK';
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
let deck = [];
let dealt = false;

function makeDeck(){
  const out = [];
  for (const s of SUITS) for (const r of RANKS) out.push(r + s);
  for (let i = out.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}
function cardHtml(card, hidden){
  if (hidden) return '<span class="card back">SVR</span>';
  const red = card && (card.includes('♥') || card.includes('♦'));
  return '<span class="card ' + (red ? 'red' : '') + '">' + (card || '--') + '</span>';
}
function injectStyle(){
  const s = document.createElement('style');
  s.textContent = `
    html,body{height:100%;margin:0;background:radial-gradient(circle at 50% 12%,rgba(118,28,42,.32),transparent 32%),linear-gradient(#030305,#090712 48%,#010102);color:#f7f0ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;overflow:hidden}*{box-sizing:border-box}.stars{position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.48) 0 1px,transparent 1px),radial-gradient(circle,rgba(255,107,127,.22) 0 1px,transparent 1px);background-size:86px 86px,134px 134px;opacity:.34;animation:drift 34s linear infinite}.moon,.mars{position:fixed;border-radius:50%;box-shadow:0 0 42px currentColor}.moon{right:10%;top:8%;width:70px;height:70px;background:#d8d5cb;color:#d8d5cb}.mars{left:11%;top:15%;width:54px;height:54px;background:#c86d43;color:#c86d43}.wrap{position:fixed;inset:0;display:grid;place-items:center;padding:18px}.room{position:relative;width:min(1120px,calc(100vw - 28px));height:min(760px,calc(100vh - 28px));border:1px solid rgba(255,107,127,.42);border-radius:30px;background:linear-gradient(135deg,rgba(5,8,16,.9),rgba(34,8,22,.92));box-shadow:0 32px 90px rgba(0,0,0,.62),inset 0 0 80px rgba(255,107,127,.06);overflow:hidden}.head{position:absolute;left:26px;right:26px;top:24px;display:flex;justify-content:space-between;gap:18px;z-index:3}.k{font-size:12px;font-weight:900;letter-spacing:.18em;color:#ff6b7f}.title{font-size:clamp(30px,4vw,56px);font-weight:950;line-height:.95;letter-spacing:-.04em}.sub{max-width:700px;margin-top:8px;color:rgba(247,240,255,.74);font-size:16px}.badge{border:1px solid rgba(246,226,127,.5);border-radius:999px;padding:8px 12px;color:#f6e27f;font-size:12px;font-weight:900;white-space:nowrap;height:max-content}.stage{position:absolute;left:28px;right:28px;top:142px;bottom:92px;border:1px solid rgba(180,140,255,.20);border-radius:24px;background:radial-gradient(ellipse at center,rgba(255,107,127,.08),transparent 58%),rgba(0,0,0,.22);overflow:hidden}.floor{position:absolute;left:-10%;right:-10%;bottom:-25%;height:76%;background:linear-gradient(rgba(255,107,127,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,127,.10) 1px,transparent 1px);background-size:42px 42px;transform:perspective(700px) rotateX(63deg);transform-origin:bottom}.wall{position:absolute;left:24px;right:24px;top:22px;height:45%;border:1px solid rgba(255,107,127,.20);border-bottom:0;border-radius:22px 22px 0 0;background:radial-gradient(circle at 50% 28%,rgba(246,226,127,.10),transparent 38%)}.table{position:absolute;left:50%;top:55%;width:min(560px,62vw);height:270px;transform:translate(-50%,-50%);border-radius:50%;border:7px solid rgba(48,18,28,.95);background:radial-gradient(ellipse at center,#18382d,#071712 70%);box-shadow:0 24px 70px rgba(0,0,0,.62),inset 0 0 50px rgba(127,245,199,.10)}.rail{position:absolute;inset:22px;border-radius:50%;border:2px solid rgba(246,226,127,.28)}.felt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#7ff5c7;font-size:12px;font-weight:900;letter-spacing:.18em;text-align:center}.board{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);display:flex;gap:7px}.hole{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);display:flex;gap:7px}.botcards{display:flex;gap:3px;justify-content:center;margin-top:5px}.card{display:inline-grid;place-items:center;width:42px;height:58px;border-radius:7px;background:#f7f4ff;color:#111827;border:2px solid rgba(0,0,0,.25);font-weight:950;font-size:17px;box-shadow:0 5px 12px rgba(0,0,0,.3)}.card.red{color:#b01832}.card.back{background:linear-gradient(135deg,#13091f,#30205f);color:#7ff5c7;border-color:rgba(127,245,199,.42);font-size:11px}.seat{position:absolute;width:128px;text-align:center;color:#f7f0ff}.seat .name{font-weight:950;font-size:12px}.seat .stack{font-size:11px;color:rgba(247,240,255,.68)}.seat:before{content:"";display:block;margin:0 auto 6px;width:54px;height:54px;border-radius:50%;border:2px solid rgba(255,107,127,.38);background:linear-gradient(135deg,rgba(255,107,127,.24),rgba(180,140,255,.16));box-shadow:0 0 20px rgba(255,107,127,.12)}.seat.you:before{border-color:rgba(127,245,199,.72);box-shadow:0 0 25px rgba(127,245,199,.25)}.s0{left:50%;top:9%;transform:translateX(-50%)}.s1{right:10%;top:28%}.s2{right:15%;bottom:16%}.s3{left:50%;bottom:0;transform:translateX(-50%)}.s4{left:15%;bottom:16%}.s5{left:10%;top:28%}.chips{position:absolute;left:50%;top:61%;transform:translate(-50%,-50%);display:flex;gap:5px}.chip{width:22px;height:22px;border-radius:50%;border:3px dashed rgba(255,255,255,.75);background:#ff6b7f;box-shadow:0 4px 9px rgba(0,0,0,.35)}.chip:nth-child(2){background:#7ff5c7}.chip:nth-child(3){background:#b48cff}.chip:nth-child(4){background:#f6e27f}.actions{position:absolute;left:26px;right:26px;bottom:24px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.btn,a{border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:10px 14px;font-weight:900;text-decoration:none;cursor:pointer}.btn.warn{border-color:rgba(255,107,127,.5);background:rgba(255,107,127,.08)}.status{margin-left:auto;color:rgba(247,240,255,.68);font-size:12px}.scorpion{position:absolute;right:36px;top:38px;color:rgba(255,107,127,.42);font-size:80px;transform:rotate(-16deg)}@keyframes drift{from{background-position:0 0,0 0}to{background-position:220px 140px,-180px 220px}}@media(max-width:760px){body{overflow:auto}.wrap{position:relative;min-height:100%;display:block}.room{height:auto;min-height:850px}.head{position:relative;display:block}.stage{position:relative;left:auto;right:auto;top:auto;bottom:auto;height:590px;margin:30px 16px 100px}.actions{position:relative;margin:18px}.status{width:100%;margin-left:0}}
  `;
  document.head.appendChild(s);
}
function drawCards(){
  const board = document.getElementById('board');
  const hole = document.getElementById('hole');
  const botSlots = document.querySelectorAll('[data-botcards]');
  if (!dealt){
    board.innerHTML = [1,2,3,4,5].map(()=>cardHtml(null,true)).join('');
    hole.innerHTML = cardHtml(null,true) + cardHtml(null,true);
    botSlots.forEach(el => { el.innerHTML = cardHtml(null,true) + cardHtml(null,true); });
    return;
  }
  if (!deck.length) deck = makeDeck();
  const cards = deck.slice(0, 17);
  board.innerHTML = cards.slice(0,5).map(c=>cardHtml(c,false)).join('');
  hole.innerHTML = cards.slice(5,7).map(c=>cardHtml(c,false)).join('');
  botSlots.forEach((el,i)=>{ el.innerHTML = cardHtml(cards[7+i*2],true) + cardHtml(cards[8+i*2],true); });
}
function build(){
  injectStyle();
  document.title = 'SVR Scorpion Room • Private Poker';
  document.body.innerHTML = `
    <div class="stars"></div><div class="moon"></div><div class="mars"></div>
    <main class="wrap"><section class="room">
      <div class="scorpion">♏</div>
      <header class="head"><div><div class="k">PRIVATE POKER WORLD</div><div class="title">SVR Scorpion Room</div><div class="sub">Separate enclosed poker room with a private table shell, player seat, five bot seats, cards, chip stack, and demo dealing flow.</div></div><div class="badge">PHASE 118 PRIVATE TABLE</div></header>
      <section class="stage"><div class="wall"></div><div class="floor"></div>
        <div class="seat s0"><div class="name">NOVA BOT</div><div class="stack">$1,000</div><div class="botcards" data-botcards></div></div>
        <div class="seat s1"><div class="name">CARLA BOT</div><div class="stack">$1,000</div><div class="botcards" data-botcards></div></div>
        <div class="seat s2"><div class="name">MILO BOT</div><div class="stack">$1,000</div><div class="botcards" data-botcards></div></div>
        <div class="seat s3 you"><div class="name">YOU</div><div class="stack">$1,000</div></div>
        <div class="seat s4"><div class="name">RIVER BOT</div><div class="stack">$1,000</div><div class="botcards" data-botcards></div></div>
        <div class="seat s5"><div class="name">ONYX BOT</div><div class="stack">$1,000</div><div class="botcards" data-botcards></div></div>
        <div class="table"><div class="rail"></div><div class="felt">SCORPION PRIVATE TABLE</div><div class="board" id="board"></div><div class="chips"><span class="chip"></span><span class="chip"></span><span class="chip"></span><span class="chip"></span></div><div class="hole" id="hole"></div></div>
      </section>
      <div class="actions"><a href="./">Return Lobby</a><button class="btn" id="deal">Demo Deal</button><button class="btn warn" id="reset">Reset Table</button><span class="status" id="status">siteTouched: false • separate private route</span></div>
    </section></main>`;
  document.getElementById('deal').addEventListener('click',()=>{ deck = makeDeck(); dealt = true; drawCards(); document.getElementById('status').textContent = 'Demo hand dealt • private room ready for gameplay wiring'; });
  document.getElementById('reset').addEventListener('click',()=>{ dealt = false; drawCards(); document.getElementById('status').textContent = 'Table reset • siteTouched: false'; });
  drawCards();
  window.SVR_PHASE118_SCORPION_PRIVATE_POKER_ROOM = { phase: PHASE, siteTouched:false, deal:()=>{ deck=makeDeck(); dealt=true; drawCards(); } };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once:true }); else build();
