import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-363-ANDROID-SETTLEMENT-LOBBY-CONSISTENCY-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const EXPECTED = 15000 * players.length;

const runtime = {
  build: BUILD,
  active: ACTIVE,
  lobbyCardRepairs: 0,
  qaWraps: 0,
  auditWraps: 0,
  synchronousJoinReads: 0,
  installedAt: null
};

function joined() {
  if (typeof window.SVR_PHASE363_JOINED_IMMEDIATE === 'boolean') {
    runtime.synchronousJoinReads += 1;
    return window.SVR_PHASE363_JOINED_IMMEDIATE;
  }
  return Boolean(window.SVR_PHASE363_STATE?.joined);
}

function settled() {
  return String(state.phase || '').toLowerCase() === 'showdown'
    && Boolean((state.winners || []).length || state.winner || Number(state.settledPot || 0) > 0);
}

function accounting() {
  const stackChips = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committedChips = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  const settledHand = settled();
  return {
    stackChips,
    committedChips,
    rawLedgerTotal: stackChips + committedChips,
    effectiveTableChips: stackChips + (settledHand ? 0 : committedChips),
    settledHand,
    expectedTableChips: EXPECTED
  };
}

function enforceLobbyCardClear() {
  if (joined()) return false;
  let changed = false;
  for (const player of players) {
    if (Array.isArray(player.hand) && player.hand.length) {
      player.hand = [];
      changed = true;
    }
    if (!player.folded) {
      player.folded = true;
      changed = true;
    }
    if (Number(player.bet || 0) !== 0) {
      player.bet = 0;
      changed = true;
    }
    if (Number(player.contributed || 0) !== 0) {
      player.contributed = 0;
      changed = true;
    }
  }
  if (Array.isArray(state.community) && state.community.length) {
    state.community = [];
    changed = true;
  }
  if (Array.isArray(state.burn) && state.burn.length) {
    state.burn = [];
    changed = true;
  }
  if (Array.isArray(state.deck) && state.deck.length) {
    state.deck = [];
    changed = true;
  }
  if (Number(state.pot || 0) !== 0) {
    state.pot = 0;
    changed = true;
  }
  if (String(state.phase || '').toLowerCase() !== 'idle') {
    state.phase = 'idle';
    changed = true;
  }
  if (state.waitingHuman) {
    state.waitingHuman = false;
    changed = true;
  }
  if (changed) {
    runtime.lobbyCardRepairs += 1;
    window.dispatchEvent(new CustomEvent('svr:phase363-lobby-card-clear', {
      detail: { build: BUILD, repairs: runtime.lobbyCardRepairs }
    }));
  }
  return changed;
}

function engineCardState() {
  return {
    playerHandCounts: players.map((player) => ({ id: player.id, name: player.name, count: player.hand?.length || 0 })),
    communityCount: state.community?.length || 0,
    burnCount: state.burn?.length || 0,
    deckCount: state.deck?.length || 0,
    allHandsCleared: players.every((player) => (player.hand?.length || 0) === 0),
    lobbyCardsCleared: players.every((player) => (player.hand?.length || 0) === 0)
      && (state.community?.length || 0) === 0
      && (state.burn?.length || 0) === 0
  };
}

function installAuditWrapper() {
  const prior = window.SVR_RUN_PHASE336_POKER_AUDIT;
  if (typeof prior !== 'function' || prior.__phase363Consistency) return false;
  const wrapped = (...args) => {
    if (!joined()) enforceLobbyCardClear();
    const audit = prior(...args) || {};
    if (joined()) return audit;
    return {
      ...audit,
      phase: 'idle',
      pot: 0,
      community: [],
      burnCount: 0,
      legalActions: [],
      waitingHuman: false,
      players: (audit.players || []).map((player) => ({
        ...player,
        hand: [],
        bet: 0,
        contributed: 0,
        folded: true
      }))
    };
  };
  wrapped.__phase363Consistency = true;
  wrapped.phase363Prior = prior;
  window.SVR_RUN_PHASE336_POKER_AUDIT = wrapped;
  runtime.auditWraps += 1;
  return true;
}

function installQaWrapper() {
  const prior = window.SVR_PHASE363_QA;
  if (typeof prior !== 'function' || prior.__phase363Consistency) return false;
  const wrapped = () => {
    if (!joined()) enforceLobbyCardClear();
    const base = prior() || {};
    const chips = accounting();
    const cards = engineCardState();
    const pass = Boolean(
      base.active
      && base.joinControls === 1
      && base.cardsHiddenInLobby
      && base.fovValid
      && base.bankrollValid
      && chips.effectiveTableChips === EXPECTED
      && (joined() || cards.lobbyCardsCleared)
      && (!base.table || base.table.pass)
    );
    return {
      ...base,
      ...chips,
      totalChips: chips.effectiveTableChips,
      conservationValid: chips.effectiveTableChips === EXPECTED,
      engineCards: cards,
      engineHandsCleared: cards.allHandsCleared,
      pass,
      consistencyBuild: BUILD,
      checkedAt: new Date().toISOString()
    };
  };
  wrapped.__phase363Consistency = true;
  wrapped.phase363Prior = prior;
  window.SVR_PHASE363_QA = wrapped;
  runtime.qaWraps += 1;
  return true;
}

function qa() {
  const chips = accounting();
  const cards = engineCardState();
  return {
    ...runtime,
    joined: joined(),
    joinedImmediate: window.SVR_PHASE363_JOINED_IMMEDIATE,
    ...chips,
    ...cards,
    pass: chips.effectiveTableChips === EXPECTED && (joined() || cards.lobbyCardsCleared),
    checkedAt: new Date().toISOString()
  };
}

function install() {
  if (!ACTIVE || runtime.installedAt) return;
  if (typeof window.SVR_PHASE363_QA !== 'function') {
    setTimeout(install, 80);
    return;
  }
  runtime.installedAt = new Date().toISOString();
  installAuditWrapper();
  installQaWrapper();
  setInterval(() => {
    if (!joined()) enforceLobbyCardClear();
    installAuditWrapper();
    installQaWrapper();
  }, 100);
  window.SVR_PHASE363_CONSISTENCY_QA = qa;
  window.SVR_PHASE363_CONSISTENCY_STATE = runtime;
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));
