const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['S','H','D','C'];
const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));
const HAND_NAMES = ['High Card','Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Straight Flush'];

export function createDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(r + s);
  return deck;
}

export function shuffle(deck, seed = Date.now()) {
  let x = Math.abs(Math.floor(seed)) || 1;
  const rnd = () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardRank(c) { return c[0] === '1' ? 'T' : c[0]; }
function cardSuit(c) { return c[c.length - 1]; }
function uniqueDesc(values) { return [...new Set(values)].sort((a, b) => b - a); }
function straightHigh(values) {
  const u = uniqueDesc(values);
  if (u.includes(14)) u.push(1);
  for (let i = 0; i <= u.length - 5; i++) {
    const run = u.slice(i, i + 5);
    if (run[0] - run[4] === 4) return run[0];
  }
  return 0;
}
function score(category, kickers) {
  let value = category;
  for (const k of kickers.slice(0, 5)) value = value * 15 + k;
  return { category, name: HAND_NAMES[category], value, kickers: kickers.slice(0, 5) };
}
export function evaluateFive(cards) {
  const vals = cards.map(c => RANK_VALUE[cardRank(c)]).sort((a, b) => b - a);
  const suits = cards.map(cardSuit);
  const counts = new Map();
  vals.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = suits.every(s => s === suits[0]);
  const straight = straightHigh(vals);
  if (flush && straight) return score(8, [straight]);
  if (groups[0][1] === 4) return score(7, [groups[0][0], ...vals.filter(v => v !== groups[0][0])]);
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) return score(6, [groups[0][0], groups[1][0]]);
  if (flush) return score(5, vals);
  if (straight) return score(4, [straight]);
  if (groups[0][1] === 3) return score(3, [groups[0][0], ...vals.filter(v => v !== groups[0][0])]);
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) return score(2, [groups[0][0], groups[1][0], ...vals.filter(v => v !== groups[0][0] && v !== groups[1][0])]);
  if (groups[0][1] === 2) return score(1, [groups[0][0], ...vals.filter(v => v !== groups[0][0])]);
  return score(0, vals);
}
export function evaluateSeven(cards) {
  let best = null;
  for (let a = 0; a < cards.length - 4; a++) for (let b = a + 1; b < cards.length - 3; b++) for (let c = b + 1; c < cards.length - 2; c++) for (let d = c + 1; d < cards.length - 1; d++) for (let e = d + 1; e < cards.length; e++) {
    const result = evaluateFive([cards[a], cards[b], cards[c], cards[d], cards[e]]);
    if (!best || result.value > best.value) best = result;
  }
  return best;
}
export function createPokerGame(options = {}) {
  const seats = options.seats || ['PLAYER','BOT NOVA','BOT ACE','BOT RIO','BOT VEX','BOT LUNA'];
  const state = { handNo: 0, street: 'IDLE', seats: seats.map((name, i) => ({ name, stack: 500, cards: [], folded: false, bet: 0, seat: i })), button: 0, active: 0, deck: [], board: [], pot: 0, currentBet: 0, minRaise: 25, history: [], winner: null, timer: 20 };
  function record(type, detail = {}) { state.history.unshift({ type, detail, at: new Date().toISOString(), handNo: state.handNo, street: state.street }); if (state.history.length > 40) state.history.pop(); }
  function liveSeats() { return state.seats.filter(s => !s.folded && s.stack >= 0); }
  function draw() { return state.deck.shift(); }
  function postBlind(index, amount) { const s = state.seats[index % state.seats.length]; const paid = Math.min(s.stack, amount); s.stack -= paid; s.bet += paid; state.pot += paid; state.currentBet = Math.max(state.currentBet, s.bet); record('blind', { seat: s.name, amount: paid }); }
  function nextActive(from = state.active) { for (let i = 1; i <= state.seats.length; i++) { const idx = (from + i) % state.seats.length; if (!state.seats[idx].folded && state.seats[idx].stack > 0) return idx; } return state.active; }
  function startHand() { state.handNo++; state.street = 'PREFLOP'; state.button = (state.button + 1) % state.seats.length; state.deck = shuffle(createDeck(), Date.now() + state.handNo); state.board = []; state.pot = 0; state.currentBet = 0; state.winner = null; state.timer = 20; state.seats.forEach(s => { s.cards = []; s.folded = false; s.bet = 0; }); for (let round = 0; round < 2; round++) { for (let i = 1; i <= state.seats.length; i++) state.seats[(state.button + i) % state.seats.length].cards.push(draw()); } postBlind(state.button + 1, 10); postBlind(state.button + 2, 20); state.active = nextActive(state.button + 2); record('deal-left-to-right', { button: state.button, active: state.seats[state.active].name }); return snapshot(); }
  function settleIfOneLeft() { const live = liveSeats(); if (live.length === 1) { live[0].stack += state.pot; state.winner = { seat: live[0].name, hand: 'Fold Win', pot: state.pot }; record('winner', state.winner); state.street = 'SHOWDOWN'; return true; } return false; }
  function resetBets() { state.seats.forEach(s => s.bet = 0); state.currentBet = 0; state.active = nextActive(state.button); state.timer = 20; }
  function advanceStreet() { if (settleIfOneLeft()) return snapshot(); if (state.street === 'PREFLOP') { state.board.push(draw(), draw(), draw()); state.street = 'FLOP'; resetBets(); record('flop', { board: [...state.board] }); return snapshot(); } if (state.street === 'FLOP') { state.board.push(draw()); state.street = 'TURN'; resetBets(); record('turn', { board: [...state.board] }); return snapshot(); } if (state.street === 'TURN') { state.board.push(draw()); state.street = 'RIVER'; resetBets(); record('river', { board: [...state.board] }); return snapshot(); } return showdown(); }
  function allCalled() { const live = liveSeats().filter(s => s.stack > 0); return live.every(s => s.bet === state.currentBet); }
  function action(kind, amount = 25) { if (state.street === 'IDLE' || state.street === 'SHOWDOWN') return startHand(); const s = state.seats[state.active]; const toCall = Math.max(0, state.currentBet - s.bet); if (kind === 'fold') { s.folded = true; record('fold', { seat: s.name }); if (settleIfOneLeft()) return snapshot(); } else if (kind === 'check') { if (toCall > 0) return action('fold'); record('check', { seat: s.name }); } else if (kind === 'call') { const paid = Math.min(s.stack, toCall); s.stack -= paid; s.bet += paid; state.pot += paid; record('call', { seat: s.name, amount: paid }); } else if (kind === 'raise') { const total = toCall + Math.max(amount, state.minRaise); const paid = Math.min(s.stack, total); s.stack -= paid; s.bet += paid; state.pot += paid; state.currentBet = Math.max(state.currentBet, s.bet); record('raise', { seat: s.name, amount: paid }); } else if (kind === 'allin') { const paid = s.stack; s.stack = 0; s.bet += paid; state.pot += paid; state.currentBet = Math.max(state.currentBet, s.bet); record('allin', { seat: s.name, amount: paid }); }
    if (allCalled()) return advanceStreet(); state.active = nextActive(state.active); state.timer = 20; return snapshot(); }
  function timeout() { const s = state.seats[state.active]; const toCall = Math.max(0, state.currentBet - s.bet); return action(toCall > 0 ? 'fold' : 'check'); }
  function botAction() { const s = state.seats[state.active]; if (!s.name.startsWith('BOT')) return snapshot(); const toCall = Math.max(0, state.currentBet - s.bet); if (toCall === 0) return action(Math.random() > 0.72 ? 'raise' : 'check', 25); if (toCall <= 30) return action('call'); return action(Math.random() > 0.55 ? 'fold' : 'call'); }
  function showdown() { state.street = 'SHOWDOWN'; const live = liveSeats(); const ranked = live.map(s => ({ seat: s, result: evaluateSeven([...s.cards, ...state.board]) })).sort((a, b) => b.result.value - a.result.value); const winner = ranked[0]; winner.seat.stack += state.pot; state.winner = { seat: winner.seat.name, hand: winner.result.name, pot: state.pot, cards: winner.seat.cards, board: [...state.board] }; record('winner', state.winner); return snapshot(); }
  function snapshot() { return JSON.parse(JSON.stringify(state)); }
  return { state, startHand, action, timeout, botAction, showdown, snapshot };
}

export const SVRPoker = { createDeck, shuffle, evaluateFive, evaluateSeven, createPokerGame };
if (typeof window !== 'undefined') window.SVRPoker = SVRPoker;
