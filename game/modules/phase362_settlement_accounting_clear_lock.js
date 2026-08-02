import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-362-SETTLEMENT-ACCOUNTING-CLEAR-LOCK';

const params = new URLSearchParams(location.search);
const PHASE362_QA = params.has('phase362qa');
const runtimePlatform = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit === 'android' || explicit === 'quest' || explicit === 'desktop') return explicit;
  if (/\/android\.html$/i.test(location.pathname)) return 'android';
  if (/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')) return 'quest';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
})();
const ANDROID_QA_FORCE_LEFT = PHASE362_QA && runtimePlatform === 'android';
let lastClearedHand = -1;
let clearedHands = 0;
let lastCommitted = 0;
let installedAt = null;
let interval = 0;
let qaSeatInterval = 0;
let qaJoinStarted = false;

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

function installQaSeatGate() {
  if (!ANDROID_QA_FORCE_LEFT) return;
  const originalJoin = window.SVR_PHASE362_JOIN_TABLE;
  if (typeof originalJoin === 'function') {
    window.SVR_PHASE362_JOIN_TABLE = (...args) => {
      qaJoinStarted = true;
      if (qaSeatInterval) {
        clearInterval(qaSeatInterval);
        qaSeatInterval = 0;
      }
      return originalJoin(...args);
    };
  }
  const pinLeft = () => {
    if (qaJoinStarted) return;
    if (window.SVR_PHASE347_STATE) window.SVR_PHASE347_STATE.seated = false;
    window.SVR_PHASE362_LEAVE_TABLE?.();
    window.SVR_PHASE362_QA_LEFT_READY = true;
  };
  pinLeft();
  qaSeatInterval = window.setInterval(pinLeft, 25);
}

function qa() {
  const stacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committed = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  const settled = settledShowdown();
  const expected = Number(window.SVR_PHASE362_CONSTANTS?.TABLE_BANKROLL || stacks + committed);
  const result = {
    build: BUILD,
    installedAt,
    runtimePlatform,
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
    phase362Qa: PHASE362_QA,
    androidQaForceLeft: ANDROID_QA_FORCE_LEFT,
    qaLeftReady: Boolean(window.SVR_PHASE362_QA_LEFT_READY),
    qaJoinStarted,
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
    if (qaSeatInterval) clearInterval(qaSeatInterval);
  }, { once: true });
  window.SVR_PHASE362_CLEAR_SETTLED_COMMITMENTS = clearSettledCommitments;
  window.SVR_PHASE362_SETTLEMENT_QA = qa;
  window.SVR_PHASE362_SETTLEMENT_STATE = {
    build: BUILD,
    runtimePlatform,
    androidQaForceLeft: ANDROID_QA_FORCE_LEFT,
    get installedAt() { return installedAt; },
    get lastClearedHand() { return lastClearedHand; },
    get clearedHands() { return clearedHands; },
    get lastCommitted() { return lastCommitted; },
    get qaJoinStarted() { return qaJoinStarted; }
  };
  clearSettledCommitments('install');
  installQaSeatGate();
}

install();
