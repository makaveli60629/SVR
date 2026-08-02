import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-362-SETTLEMENT-ACCOUNTING-CLEAR-LOCK';

let lastClearedHand = -1;
let clearedHands = 0;
let lastCommitted = 0;
let installedAt = null;
let interval = 0;

function settledShowdown() {
  return String(state.phase || '').toLowerCase() === 'showdown'
    && Number(state.settledPot || 0) > 0
    && Array.isArray(state.winners)
    && state.winners.length > 0;
}

function clearSettledCommitments(reason = 'state-event') {
  if (!settledShowdown()) return false;
  const handNo = Number(state.handNo || 0);
  if (handNo === lastClearedHand) return false;

  const committed = players.reduce(
    (sum, player) => sum + Number(player.contributed || 0),
    0
  );
  const stackTotal = players.reduce(
    (sum, player) => sum + Number(player.stack || 0),
    0
  );

  // Settlement has already credited state.winners and player stacks. Keeping
  // contributed/bet values after payout double-counts the completed pot in
  // conservation audits. Clear only those completed-hand accounting fields.
  players.forEach((player) => {
    player.bet = 0;
    player.contributed = 0;
  });

  lastClearedHand = handNo;
  clearedHands += 1;
  lastCommitted = committed;

  window.dispatchEvent(new CustomEvent('svr:phase362-settlement-accounting-cleared', {
    detail: {
      build: BUILD,
      reason,
      handNo,
      settledPot: Number(state.settledPot || 0),
      committedCleared: committed,
      stackTotal,
      tableBankroll: Number(window.SVR_PHASE362_CONSTANTS?.TABLE_BANKROLL || stackTotal),
      at: new Date().toISOString()
    }
  }));
  return true;
}

function qa() {
  const stacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committed = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  const settled = settledShowdown();
  const expected = Number(window.SVR_PHASE362_CONSTANTS?.TABLE_BANKROLL || stacks + committed);
  const result = {
    build: BUILD,
    installedAt,
    phase: String(state.phase || 'idle'),
    handNo: Number(state.handNo || 0),
    settledPot: Number(state.settledPot || 0),
    stacks,
    committed,
    expected,
    settled,
    lastClearedHand,
    clearedHands,
    lastCommitted,
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(installedAt)
    && (!settled || committed === 0)
    && (settled ? stacks === expected : stacks + committed === expected);
  window.SVR_PHASE362_SETTLEMENT_QA_STATE = result;
  return result;
}

function install() {
  if (installedAt) return;
  installedAt = new Date().toISOString();
  window.addEventListener('svr:poker-state', () => clearSettledCommitments('poker-state'));
  interval = window.setInterval(() => clearSettledCommitments('watchdog'), 120);
  window.addEventListener('beforeunload', () => {
    if (interval) clearInterval(interval);
  }, { once: true });
  window.SVR_PHASE362_CLEAR_SETTLED_COMMITMENTS = clearSettledCommitments;
  window.SVR_PHASE362_SETTLEMENT_QA = qa;
  window.SVR_PHASE362_SETTLEMENT_STATE = {
    build: BUILD,
    get installedAt() { return installedAt; },
    get lastClearedHand() { return lastClearedHand; },
    get clearedHands() { return clearedHands; },
    get lastCommitted() { return lastCommitted; }
  };
  clearSettledCommitments('install');
}

install();
