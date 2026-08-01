import { settlePots, handName, best7 } from './phase336_poker_evaluator.js';

export const BUILD = 'PHASE-336-AUTHORITATIVE-POKER-RULES-POT-SETTLEMENT-LOCK';

const SAVE = 'SVR_PHASE336_POKER_SNAPSHOT_V1';
const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const V = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));

export const players = ['YOU', 'NOVA', 'ROOK', 'ACE', 'VEGA', 'IVY'].map((name, id) => ({
  id,
  name,
  human: id === 0,
  stack: 1000,
  folded: false,
  allIn: false,
  bet: 0,
  contributed: 0,
  acted: false,
  raiseClosed: false,
  hand: [],
  lastAction: 'Ready'
}));

export const state = {
  build: BUILD,
  handNo: 0,
  dealer: -1,
  smallBlind: 10,
  bigBlind: 20,
  phase: 'idle',
  deck: [],
  burn: [],
  community: [],
  pot: 0,
  pots: [],
  currentBet: 0,
  minRaise: 20,
  lastAggressor: null,
  current: 0,
  waitingHuman: false,
  winner: null,
  winners: [],
  actionLog: [],
  actionSeq: 0,
  settledPot: 0,
  lastAction: 'Ready',
  restored: false
};

let timer = null;
let physical = { amount: 0, at: 0 };

const card = (rank, suit) => ({ rank, r: rank, suit, s: suit, v: V[rank], id: `${rank}${suit}` });

function shuffledDeck() {
  const cards = [];
  for (const suit of SUITS) for (const rank of RANKS) cards.push(card(rank, suit));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

const funded = () => players.filter((player) => player.stack > 0);
const live = () => players.filter((player) => !player.folded && player.hand.length === 2);
const actors = () => live().filter((player) => !player.allIn && player.stack > 0);

function next(from, predicate = () => true) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const index = (from + offset + players.length) % players.length;
    if (predicate(players[index])) return index;
  }
  return -1;
}

const nextFunded = (index) => next(index, (player) => player.stack > 0);
const nextActor = (index) => next(index, (player) => (
  !player.folded
  && !player.allIn
  && player.stack > 0
  && (!player.acted || player.bet < state.currentBet)
));
const total = () => players.reduce((sum, player) => sum + player.contributed, 0);

function log(message) {
  state.lastAction = message;
  state.actionLog.unshift(message);
  state.actionLog = state.actionLog.slice(0, 12);
  state.actionSeq += 1;
}

function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify({ build: BUILD, savedAt: Date.now(), state, players }));
  } catch {}
}

function emit() {
  state.pot = total();
  window.SVR_PHASE85_POKER_STATE = state;
  window.SVR_PHASE336_POKER_STATE = state;
  window.dispatchEvent(new CustomEvent('svr:poker-state', { detail: audit() }));
  window.dispatchEvent(new CustomEvent('svr:turn-changed', {
    detail: {
      build: BUILD,
      handNo: state.handNo,
      phase: state.phase,
      current: players[state.current]?.name || null,
      waitingHuman: state.waitingHuman,
      currentBet: state.currentBet,
      pot: state.pot
    }
  }));
  save();
}

function commit(player, amount) {
  const paid = Math.max(0, Math.min(player.stack, Math.floor(Number(amount) || 0)));
  player.stack -= paid;
  player.bet += paid;
  player.contributed += paid;
  if (player.stack === 0) player.allIn = true;
  state.pot = total();
  return paid;
}

function resetHand(player) {
  player.folded = player.stack <= 0;
  player.allIn = false;
  player.bet = 0;
  player.contributed = 0;
  player.acted = false;
  player.raiseClosed = false;
  player.hand = [];
  player.lastAction = player.stack > 0 ? 'Ready' : 'Out';
}

function take() {
  return state.deck.pop() || null;
}

function burn() {
  const burned = take();
  if (burned) state.burn.push(burned);
}

function street(name) {
  if (name === 'flop') {
    burn();
    state.community.push(take(), take(), take());
  } else {
    burn();
    state.community.push(take());
  }
  state.community = state.community.filter(Boolean);
}

function roundReset() {
  for (const player of players) {
    player.bet = 0;
    player.acted = player.folded || player.allIn || player.stack <= 0;
    player.raiseClosed = false;
  }
  state.currentBet = 0;
  state.minRaise = state.bigBlind;
  state.lastAggressor = null;
}

function post(player, amount, label) {
  const paid = commit(player, amount);
  player.lastAction = `${label} ${paid}`;
  log(`${player.name} posts ${label} ${paid}`);
  return paid;
}

export function startHand() {
  clearTimeout(timer);
  if (funded().length < 2) {
    state.phase = 'idle';
    state.waitingHuman = false;
    log('Table requires two funded players');
    emit();
    return false;
  }

  state.handNo += 1;
  state.dealer = nextFunded(state.dealer);
  Object.assign(state, {
    phase: 'preflop',
    deck: shuffledDeck(),
    burn: [],
    community: [],
    pots: [],
    currentBet: 0,
    minRaise: state.bigBlind,
    lastAggressor: null,
    waitingHuman: false,
    winner: null,
    winners: [],
    actionLog: [],
    settledPot: 0
  });
  players.forEach(resetHand);

  const active = funded();
  for (let round = 0; round < 2; round += 1) {
    for (let offset = 1; offset <= players.length; offset += 1) {
      const player = players[(state.dealer + offset) % players.length];
      if (active.includes(player)) player.hand.push(take());
    }
  }

  let smallBlind;
  let bigBlind;
  if (active.length === 2) {
    smallBlind = state.dealer;
    bigBlind = nextFunded(smallBlind);
  } else {
    smallBlind = nextFunded(state.dealer);
    bigBlind = nextFunded(smallBlind);
  }

  post(players[smallBlind], state.smallBlind, 'SB');
  post(players[bigBlind], state.bigBlind, 'BB');
  state.currentBet = Math.max(players[smallBlind].bet, players[bigBlind].bet);
  state.lastAggressor = bigBlind;
  active.forEach((player) => { player.acted = player.allIn; });
  state.current = active.length === 2 ? smallBlind : nextActor(bigBlind);
  log(`Hand ${state.handNo} — dealer ${players[state.dealer].name}`);
  emit();
  step();
  return true;
}

const roundDone = () => actors().every((player) => player.acted && player.bet === state.currentBet);

function runout() {
  while (state.community.length < 5) {
    if (!state.community.length) {
      state.phase = 'flop';
      street('flop');
    } else if (state.community.length === 3) {
      state.phase = 'turn';
      street('turn');
    } else if (state.community.length === 4) {
      state.phase = 'river';
      street('river');
    } else {
      break;
    }
  }
  showdown();
}

function advanceStreet() {
  if (live().length <= 1) return uncontested();
  if (!actors().length) return runout();

  if (state.phase === 'preflop') state.phase = 'flop';
  else if (state.phase === 'flop') state.phase = 'turn';
  else if (state.phase === 'turn') state.phase = 'river';
  else return showdown();

  roundReset();
  street(state.phase);
  log(`${state.phase.toUpperCase()} dealt`);
  state.current = nextActor(state.dealer);
  emit();
  if (state.current < 0) return runout();
  return step();
}

function after() {
  if (live().length <= 1) return uncontested();
  if (roundDone()) return advanceStreet();
  const actor = nextActor(state.current);
  if (actor < 0) return advanceStreet();
  state.current = actor;
  emit();
  return step();
}

export function legal(player = players[state.current]) {
  if (!player || player.folded || player.allIn || player.stack <= 0) return [];
  const needed = Math.max(0, state.currentBet - player.bet);
  const actions = ['fold', needed ? 'call' : 'check'];
  if (player.stack > needed && !player.raiseClosed) actions.push(state.currentBet ? 'raise' : 'bet');
  actions.push('allin');
  return actions;
}

function raise(player, target, source = 'raise') {
  const old = state.currentBet;
  const maximum = player.bet + player.stack;
  const minimum = old ? old + state.minRaise : Math.max(state.bigBlind, state.minRaise);
  const previouslyActed = actors().filter((candidate) => candidate.id !== player.id && candidate.acted);
  let desired = Math.min(maximum, Math.max(player.bet, Math.floor(Number(target) || 0)));

  if (desired <= old) {
    const paid = commit(player, old - player.bet);
    player.acted = true;
    player.lastAction = `Call ${paid}`;
    log(`${player.name} calls ${paid}`);
    return;
  }
  if (desired < minimum && desired !== maximum) desired = Math.min(minimum, maximum);

  const before = player.bet;
  commit(player, desired - player.bet);
  const size = player.bet - old;
  const full = player.bet > old && size >= state.minRaise;
  if (player.bet > old) {
    state.currentBet = player.bet;
    state.lastAggressor = player.id;
    if (full) {
      state.minRaise = size;
      actors().forEach((candidate) => {
        candidate.acted = candidate.id === player.id;
        candidate.raiseClosed = false;
      });
    } else if (player.allIn) {
      previouslyActed.forEach((candidate) => { candidate.raiseClosed = true; });
    }
  }

  player.acted = true;
  const word = player.allIn ? 'all in' : old ? 'raises to' : 'bets';
  player.lastAction = `${word} ${player.bet}`;
  log(`${player.name} ${word} ${player.bet}${source === 'physical' ? ' (physical chips)' : ''}`);
  if (!full && player.bet > old && player.allIn) log(`Short all-in raise ${size}; betting not reopened`);
  if (before === player.bet) log(`${player.name} moved no chips`);
}

function normalize(input, player) {
  let action = typeof input === 'string' ? { type: input } : { ...(input || {}) };
  action.type = String(action.type || '').toLowerCase();
  if (action.type === 'checkcall') action.type = player.bet < state.currentBet ? 'call' : 'check';
  if (performance.now() - physical.at < 1800
    && physical.amount > 0
    && ['call', 'raise', 'physical-bet'].includes(action.type)) {
    action = { type: 'physical-bet', amount: physical.amount };
    physical = { amount: 0, at: 0 };
  }
  return action;
}

function apply(player, input) {
  const action = normalize(input, player);
  const needed = Math.max(0, state.currentBet - player.bet);
  if (action.type === 'next') return ['showdown', 'idle'].includes(state.phase) ? startHand() : false;
  if (!legal(player).includes(action.type) && !['physical-bet', 'bet'].includes(action.type)) return false;

  if (action.type === 'fold') {
    player.folded = true;
    player.acted = true;
    player.lastAction = 'Fold';
    log(`${player.name} folds`);
  } else if (action.type === 'check') {
    if (needed) return apply(player, 'call');
    player.acted = true;
    player.lastAction = 'Check';
    log(`${player.name} checks`);
  } else if (action.type === 'call') {
    const paid = commit(player, needed);
    player.acted = true;
    player.lastAction = player.allIn && paid < needed ? `All-in ${player.bet}` : `Call ${paid}`;
    log(`${player.name} ${player.allIn && paid < needed ? 'is all in for' : 'calls'} ${paid}`);
  } else if (action.type === 'allin') {
    raise(player, player.bet + player.stack, 'allin');
  } else if (action.type === 'physical-bet') {
    let amount = Math.max(0, Math.floor(Number(action.amount) || 0));
    if (amount < needed && player.stack > amount) {
      log(`Physical bet auto-completed ${amount} to call ${needed}`);
      amount = needed;
    }
    const target = player.bet + Math.min(player.stack, amount);
    if (target <= state.currentBet) {
      const paid = commit(player, needed);
      player.acted = true;
      player.lastAction = `Call ${paid}`;
      log(`${player.name} calls ${paid} with physical chips`);
    } else {
      raise(player, target, 'physical');
    }
  } else {
    const explicit = Number(action.raiseTo ?? action.target ?? 0);
    const by = Number(action.amount ?? 0);
    const fallback = state.currentBet
      ? state.currentBet + Math.max(state.minRaise, state.bigBlind)
      : Math.max(state.bigBlind, state.minRaise);
    raise(player, explicit > 0 ? explicit : by > 0 ? player.bet + by : fallback);
  }

  state.waitingHuman = false;
  emit();
  after();
  return true;
}

export function action(input) {
  if (['showdown', 'idle'].includes(state.phase)) {
    if ((typeof input === 'string' ? input : input?.type) === 'next') return startHand();
    return false;
  }
  const player = players[state.current];
  if (!player?.human) return false;
  return apply(player, input);
}

function strength(player) {
  if (state.community.length < 3) {
    const [first, second] = player.hand;
    let score = (first.v + second.v) / 28;
    if (first.r === second.r) score += 0.3 + first.v / 45;
    if (first.s === second.s) score += 0.08;
    if (Math.abs(first.v - second.v) <= 2) score += 0.06;
    return Math.min(1, score);
  }
  const result = best7([...player.hand, ...state.community]);
  return Math.min(1, result[0] / 8 * 0.72 + (result[1] || 0) / 14 * 0.28);
}

function bot(player) {
  const needed = Math.max(0, state.currentBet - player.bet);

  // Acceptance-only deterministic mode. The flag is enabled and restored by
  // the Phase 355 QA driver. Normal player sessions never set it, so live bot
  // strategy and randomness remain unchanged.
  if (window.SVR_POKER_QA_PASSIVE_BOTS === true) return needed ? 'call' : 'check';

  const odds = needed / Math.max(1, state.pot + needed);
  const score = strength(player);
  const pressure = needed / Math.max(1, player.stack + needed);
  const position = ((player.id - state.dealer + players.length) % players.length) / players.length;
  const aggression = score + position * 0.08 + (Math.random() - 0.5) * 0.14;
  if (needed && score + 0.08 < odds && pressure > 0.12) return 'fold';
  if (player.stack <= needed) return 'call';
  if (aggression > 0.78) {
    return {
      type: 'raise',
      raiseTo: Math.min(
        player.bet + player.stack,
        state.currentBet + Math.max(state.minRaise, Math.round(state.pot * 0.55), state.bigBlind)
      )
    };
  }
  if (!needed && aggression > 0.62) {
    return {
      type: 'bet',
      raiseTo: Math.min(player.bet + player.stack, Math.max(state.bigBlind, Math.round(state.pot * 0.42)))
    };
  }
  return needed ? 'call' : 'check';
}

function step() {
  clearTimeout(timer);
  if (['showdown', 'idle'].includes(state.phase)) return;
  if (live().length <= 1) return uncontested();
  if (roundDone()) return advanceStreet();

  const player = players[state.current];
  if (!player
    || player.folded
    || player.allIn
    || player.stack <= 0
    || (player.acted && player.bet === state.currentBet)) {
    const actor = nextActor(state.current);
    if (actor < 0) return advanceStreet();
    state.current = actor;
    return step();
  }

  if (player.human) {
    state.waitingHuman = true;
    log('Your turn');
    emit();
    return;
  }

  state.waitingHuman = false;
  emit();
  const qa = window.SVR_POKER_QA_PASSIVE_BOTS === true;
  const delay = qa ? 35 : 700 + Math.random() * 750;
  timer = setTimeout(() => {
    if (players[state.current] === player && state.phase !== 'showdown') apply(player, bot(player));
  }, delay);
}

function showdown() {
  clearTimeout(timer);
  state.phase = 'showdown';
  state.waitingHuman = false;
  while (state.community.length < 5 && live().length > 1) {
    if (!state.community.length) street('flop');
    else if (state.community.length === 3) street('turn');
    else if (state.community.length === 4) street('river');
    else break;
  }

  const result = settlePots(players, state.community, state.dealer);
  const settledTotal = total();
  for (const [id, amount] of result.payouts) players[id].stack += amount;
  state.pots = result.pots;
  state.settledPot = settledTotal;
  state.winners = [...result.payouts]
    .map(([id, amount]) => ({
      id,
      name: players[id].name,
      amount,
      score: result.scores.get(id),
      label: handName(result.scores.get(id))
    }))
    .sort((first, second) => second.amount - first.amount);
  const winner = state.winners[0];
  state.winner = winner ? {
    name: winner.name,
    pot: winner.amount,
    label: winner.label,
    score: winner.score
  } : null;
  log(state.winners.map((entry) => `${entry.name} wins ${entry.amount} with ${entry.label}`).join(' • ') || 'No eligible winner');
  emit();
}

function uncontested() {
  clearTimeout(timer);
  const winner = live()[0];
  const settledTotal = players.reduce((sum, player) => sum + player.contributed, 0);
  if (winner) winner.stack += settledTotal;
  state.phase = 'showdown';
  state.waitingHuman = false;
  state.settledPot = settledTotal;
  state.pots = [{
    amount: settledTotal,
    eligible: winner ? [winner.id] : [],
    winners: winner ? [winner.id] : [],
    hand: 'Uncontested'
  }];
  state.winners = winner ? [{
    id: winner.id,
    name: winner.name,
    amount: settledTotal,
    score: [0],
    label: 'Uncontested'
  }] : [];
  state.winner = winner ? {
    name: winner.name,
    pot: settledTotal,
    label: 'Uncontested',
    score: [0]
  } : null;
  log(winner ? `${winner.name} wins ${settledTotal} uncontested` : 'No winner');
  emit();
}

export function audit() {
  return {
    build: BUILD,
    active: true,
    authoritative: true,
    handNo: state.handNo,
    phase: state.phase,
    pot: state.pot,
    pots: state.pots,
    current: players[state.current]?.name || null,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    community: state.community.map((entry) => entry.id),
    burnCount: state.burn.length,
    legalActions: legal(),
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      human: player.human,
      stack: player.stack,
      bet: player.bet,
      contributed: player.contributed,
      folded: player.folded,
      allIn: player.allIn,
      acted: player.acted,
      raiseClosed: player.raiseClosed,
      hand: player.human || state.phase === 'showdown' ? player.hand.map((entry) => entry.id) : ['??', '??'],
      lastAction: player.lastAction
    })),
    winner: state.winner,
    winners: state.winners,
    restored: state.restored,
    qaPassiveBots: window.SVR_POKER_QA_PASSIVE_BOTS === true,
    checkedAt: new Date().toISOString()
  };
}

function restore() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (!snapshot || snapshot.build !== BUILD || Date.now() - snapshot.savedAt > 1800000) return false;
    Object.assign(state, snapshot.state, { build: BUILD, restored: true });
    snapshot.players.forEach((saved) => Object.assign(players[saved.id], saved));
    log('Recovered interrupted hand');
    return true;
  } catch {
    return false;
  }
}

export function resetTable(stack = 1000) {
  clearTimeout(timer);
  players.forEach((player) => { player.stack = Math.max(0, Number(stack) || 1000); });
  state.dealer = -1;
  state.handNo = 0;
  try { localStorage.removeItem(SAVE); } catch {}
  return startHand();
}

export function boot() {
  window.SVR_POKER_ACTION = action;
  window.SVR_POKER_NEXT_HAND = startHand;
  window.SVR_POKER_RAISE_TO = (amount) => action({ type: 'raise', raiseTo: amount });
  window.SVR_POKER_COMMIT_PHYSICAL_BET = (amount) => action({ type: 'physical-bet', amount });
  window.SVR_POKER_LEGAL_ACTIONS = () => legal().slice();
  window.SVR_RUN_PHASE85_POKER_AUDIT = audit;
  window.SVR_RUN_PHASE336_POKER_AUDIT = audit;
  window.SVR_RESET_POKER_TABLE = resetTable;
  window.SVR_PHASE85_POKER_STATE = state;
  window.SVR_PHASE336_POKER_STATE = state;

  window.addEventListener('svr:physical-bet-committed', (event) => {
    const amount = Number(event.detail?.total ?? event.detail?.value ?? 0);
    if (amount > 0) physical = { amount, at: performance.now() };
  });
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'f') action('fold');
    if (key === 'c') action('call');
    if (key === 'k') action('check');
    if (key === 'r') action('raise');
    if (key === 'a') action('allin');
    if (key === 'h') startHand();
  });

  if (restore()) {
    emit();
    step();
  } else {
    startHand();
  }
  return state;
}
