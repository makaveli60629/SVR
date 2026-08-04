export const BUILD = 'PHASE-376-ANDROID-SAFE-PLAY-FALLBACK';

const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));
const NAMES = ['YOU', 'Claudia', 'Eric', 'Maya', 'Darius', 'Nova'];
const state = {
  build: BUILD,
  active: false,
  handNo: 0,
  street: 0,
  pot: 0,
  deck: [],
  community: [],
  players: [],
  finished: false,
  message: '',
  lastWinner: null
};

const cardText = (card) => card ? `${card.r}${{ S:'♠', H:'♥', D:'♦', C:'♣' }[card.s]}` : '•';
const red = (card) => card && (card.s === 'H' || card.s === 'D');
const freshDeck = () => SUITS.flatMap((s) => RANKS.map((r) => ({ r, s, v: VALUE[r] })));
function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
function combinations(items, count) {
  const out = [];
  const walk = (start, picked) => {
    if (picked.length === count) { out.push(picked.slice()); return; }
    for (let i = start; i <= items.length - (count - picked.length); i += 1) {
      picked.push(items[i]); walk(i + 1, picked); picked.pop();
    }
  };
  walk(0, []);
  return out;
}
function evaluate5(cards) {
  const values = cards.map((card) => card.v).sort((a, b) => b - a);
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => card.s === cards[0].s);
  const unique = [...new Set(values)];
  if (unique[0] === 14) unique.push(1);
  let straightHigh = 0;
  for (let i = 0; i <= unique.length - 5; i += 1) {
    if (unique[i] - unique[i + 4] === 4) { straightHigh = unique[i]; break; }
  }
  if (flush && straightHigh) return [8, straightHigh];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) return [6, groups[0][0], groups[1][0]];
  if (flush) return [5, ...values];
  if (straightHigh) return [4, straightHigh];
  if (groups[0][1] === 3) return [3, groups[0][0], ...groups.filter((entry) => entry[1] === 1).map((entry) => entry[0])];
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const pairs = groups.filter((entry) => entry[1] === 2).map((entry) => entry[0]).sort((a, b) => b - a);
    const kicker = groups.find((entry) => entry[1] === 1)?.[0] || 0;
    return [2, pairs[0], pairs[1], kicker];
  }
  if (groups[0][1] === 2) return [1, groups[0][0], ...groups.filter((entry) => entry[1] === 1).map((entry) => entry[0])];
  return [0, ...values];
}
function compareScore(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const delta = (a[i] || 0) - (b[i] || 0);
    if (delta) return delta;
  }
  return 0;
}
function best7(cards) {
  return combinations(cards, 5).map(evaluate5).sort((a, b) => compareScore(b, a))[0];
}
const handName = (score) => ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'][score?.[0] || 0];

function pay(player, amount) {
  const paid = Math.min(player.stack, Math.max(0, Math.floor(amount)));
  player.stack -= paid;
  state.pot += paid;
  return paid;
}
function botRound() {
  state.players.slice(1).filter((player) => !player.folded && player.stack > 0).forEach((player) => {
    const roll = Math.random();
    if (roll < 0.12 && state.street < 3) player.folded = true;
    else pay(player, roll > 0.82 ? 60 : 20);
  });
}
function revealStreet() {
  if (state.street === 1) state.community.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
  if (state.street === 2 || state.street === 3) state.community.push(state.deck.pop());
}
function settle() {
  while (state.community.length < 5) state.community.push(state.deck.pop());
  const live = state.players.filter((player) => !player.folded);
  const ranked = live.map((player) => ({ player, score: best7([...player.hand, ...state.community]) }))
    .sort((a, b) => compareScore(b.score, a.score));
  const winner = ranked[0];
  winner.player.stack += state.pot;
  state.lastWinner = winner.player.name;
  state.message = `${winner.player.name} wins $${state.pot.toLocaleString()} with ${handName(winner.score)}.`;
  state.pot = 0;
  state.finished = true;
  persist();
  render();
}
function persist() {
  try { localStorage.setItem('svr_phase376_safe_stack', String(state.players[0]?.stack || 15000)); } catch {}
}
function startHand() {
  const saved = Number(localStorage.getItem('svr_phase376_safe_stack') || 15000);
  state.handNo += 1;
  state.street = 0;
  state.pot = 0;
  state.community = [];
  state.deck = shuffle(freshDeck());
  state.finished = false;
  state.lastWinner = null;
  state.players = NAMES.map((name, index) => ({ name, stack: index === 0 ? Math.max(1000, saved) : 15000, folded: false, hand: [state.deck.pop(), state.deck.pop()] }));
  state.players.forEach((player) => pay(player, 20));
  state.message = 'YOUR TURN — PREFLOP';
  render();
}
function act(type) {
  if (state.finished) return;
  const user = state.players[0];
  if (type === 'fold') {
    user.folded = true;
    botRound();
    settle();
    return;
  }
  if (type === 'call') pay(user, 20);
  if (type === 'raise') pay(user, 100);
  if (type === 'allin') pay(user, user.stack);
  botRound();
  state.street += 1;
  revealStreet();
  state.message = state.street === 1 ? 'FLOP — YOUR TURN' : state.street === 2 ? 'TURN — YOUR TURN' : state.street === 3 ? 'RIVER — YOUR TURN' : 'SHOWDOWN';
  if (state.street >= 4 || user.stack === 0) settle();
  else render();
}
function cardMarkup(card, hidden = false) {
  const shown = hidden ? null : card;
  return `<span class="svr376-card${red(shown) ? ' red' : ''}${shown ? '' : ' back'}">${shown ? cardText(shown) : 'SVR'}</span>`;
}
function render() {
  const root = document.getElementById('svr376SafeTable');
  if (!root) return;
  const user = state.players[0];
  root.querySelector('#svr376SafeStatus').textContent = state.message;
  root.querySelector('#svr376SafePot').textContent = `POT $${state.pot.toLocaleString()}`;
  root.querySelector('#svr376SafeStack').textContent = `STACK $${user.stack.toLocaleString()}`;
  root.querySelector('#svr376SafeCommunity').innerHTML = Array.from({ length: 5 }, (_, index) => cardMarkup(state.community[index])).join('');
  root.querySelector('#svr376SafeHole').innerHTML = user.hand.map((card) => cardMarkup(card)).join('');
  root.querySelector('#svr376SafeBots').innerHTML = state.players.slice(1).map((player) => `<div class="svr376-bot"><strong>${player.name}</strong><span>${player.folded ? 'FOLDED' : `$${player.stack.toLocaleString()}`}</span><div>${cardMarkup(player.hand[0], !state.finished)}${cardMarkup(player.hand[1], !state.finished)}</div></div>`).join('');
  root.querySelectorAll('[data-safe-action]').forEach((button) => { button.disabled = state.finished; });
  root.querySelector('#svr376SafeNext').hidden = !state.finished;
}
function install() {
  if (document.getElementById('svr376SafeTable')) return;
  state.active = true;
  document.querySelectorAll('canvas,#svr347Root,#svr343Hud,#svr326Root,#svr375Entry,#svr376Gate').forEach((node) => { node.style.display = 'none'; });
  const style = document.createElement('style');
  style.id = 'svr376-safe-style';
  style.textContent = `
#svr376SafeTable{position:fixed;inset:0;z-index:2147483647;overflow:auto;background:radial-gradient(ellipse at center,#06272b 0,#07111d 46%,#02040a 100%);color:#fff;font-family:system-ui;padding:max(12px,env(safe-area-inset-top)) 12px max(18px,env(safe-area-inset-bottom));box-sizing:border-box}#svr376SafeTable *{box-sizing:border-box}.svr376-safe-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.svr376-safe-pill{padding:9px 13px;border:1px solid #7ffcff;border-radius:999px;background:#020812d9;font-weight:900}.svr376-safe-board{max-width:900px;margin:12px auto}.svr376-safe-title{text-align:center;margin:8px 0;color:#ffd98a;letter-spacing:.08em}.svr376-cards{display:flex;justify-content:center;gap:7px;min-height:76px}.svr376-card{display:inline-grid;place-items:center;width:50px;height:70px;margin:2px;border-radius:8px;background:#f8f3e7;color:#111;border:2px solid #111;font:950 22px serif;box-shadow:0 5px 14px #0009}.svr376-card.red{color:#ad001f}.svr376-card.back{background:linear-gradient(145deg,#2b1d68,#07162d);color:#d9fbff;border-color:#7ffcff;font:900 11px system-ui}.svr376-bots{display:grid;grid-template-columns:repeat(5,minmax(100px,1fr));gap:7px;margin:12px 0}.svr376-bot{padding:8px;border:1px solid #6c8aa5;border-radius:12px;background:#020812bd;text-align:center}.svr376-bot strong,.svr376-bot span{display:block}.svr376-bot span{font-size:12px;color:#d9fbff}.svr376-bot .svr376-card{width:30px;height:42px;font-size:13px}.svr376-safe-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:720px;margin:14px auto}.svr376-safe-actions button{min-height:52px;border:1px solid #ffd98a;border-radius:14px;background:#111827;color:#fff;font-weight:950}.svr376-safe-actions button:disabled{opacity:.35}.svr376-safe-actions .primary{border-color:#7ffcff;background:#064c58}.svr376-safe-footer{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.svr376-safe-footer button{min-height:44px;padding:8px 14px;border:1px solid #7ffcff;border-radius:12px;background:#080d19;color:#fff;font-weight:900}@media(max-width:720px){.svr376-bots{grid-template-columns:repeat(2,1fr)}.svr376-safe-actions{grid-template-columns:repeat(2,1fr)}.svr376-card{width:43px;height:61px;font-size:19px}}
`;
  document.head.appendChild(style);
  const root = document.createElement('main');
  root.id = 'svr376SafeTable';
  root.innerHTML = `<div class="svr376-safe-top"><span class="svr376-safe-pill" id="svr376SafeStack"></span><span class="svr376-safe-pill" id="svr376SafePot"></span></div><section class="svr376-safe-board"><h1 class="svr376-safe-title">SVR POKER — SAFE TABLE</h1><h2 id="svr376SafeStatus" class="svr376-safe-title"></h2><div id="svr376SafeBots" class="svr376-bots"></div><h3 class="svr376-safe-title">COMMUNITY</h3><div id="svr376SafeCommunity" class="svr376-cards"></div><h3 class="svr376-safe-title">YOUR CARDS</h3><div id="svr376SafeHole" class="svr376-cards"></div><div class="svr376-safe-actions"><button data-safe-action="fold">FOLD</button><button data-safe-action="call" class="primary">CHECK / CALL</button><button data-safe-action="raise">RAISE $100</button><button data-safe-action="allin">ALL IN</button></div><div class="svr376-safe-footer"><button id="svr376SafeNext" hidden>NEXT HAND</button><button id="svr376Retry3d">RETRY 3D TABLE</button><button id="svr376SafeLeave">LEAVE GAME</button></div></section>`;
  document.body.appendChild(root);
  root.addEventListener('click', (event) => {
    const action = event.target?.dataset?.safeAction;
    if (action) act(action);
  });
  root.querySelector('#svr376SafeNext').onclick = startHand;
  root.querySelector('#svr376Retry3d').onclick = () => location.replace(`/game/android.html?channel=stable&v=phase376&retry=${Date.now()}`);
  root.querySelector('#svr376SafeLeave').onclick = () => location.replace(`/game/android.html?channel=stable&v=phase376&leave=${Date.now()}`);
  startHand();
  window.SVR_PHASE376_SAFE_STATE = state;
}

window.SVR_PHASE376_START_SAFE_PLAY = install;
if (window.SVR_PHASE376_SAFE_AUTOSTART === true) install();
