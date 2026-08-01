import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-355-ANDROID-FULL-HAND-DRIVER-COMPATIBILITY-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let running = false;
let lastResult = null;
const history = [];

function makeRecord(attempt) {
  return {
    build: BUILD,
    attempt,
    handNo: Number(state.handNo || 0),
    startedAt: new Date().toISOString(),
    phases: [],
    communityMax: 0,
    holeCards: 0,
    actions: [],
    lastSequence: -1,
    completed: false,
    pass: false
  };
}

function snapshot(record) {
  if (!record) return;
  record.handNo = Number(state.handNo || record.handNo || 0);
  const phase = String(state.phase || 'idle').toLowerCase();
  if (phase && !record.phases.includes(phase)) record.phases.push(phase);
  record.communityMax = Math.max(record.communityMax, state.community?.length || 0);
  record.holeCards = Math.max(
    record.holeCards,
    players.find((player) => player.human)?.hand?.length || 0
  );
  const sequence = Number(state.actionSeq || 0);
  if (sequence !== record.lastSequence) {
    record.lastSequence = sequence;
    record.actions.push({
      sequence,
      phase,
      message: state.lastAction || '',
      at: new Date().toISOString()
    });
    record.actions = record.actions.slice(-48);
  }
}

function settlementPass() {
  const totalStacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const fundedPlayers = players.filter((player) => Number(player.stack || 0) > 0).length;
  return {
    winners: (state.winners || []).map((winner) => ({
      name: winner.name,
      amount: winner.amount,
      label: winner.label
    })),
    settledPot: Number(state.settledPot || 0),
    totalStacks,
    fundedPlayers,
    pass: (state.winners || []).length > 0
      && Number(state.settledPot || 0) > 0
      && totalStacks === 6000
      && fundedPlayers >= 2
  };
}

function chooseAction() {
  const legal = window.SVR_POKER_LEGAL_ACTIONS?.() || [];
  if (legal.includes('check')) return 'check';
  if (legal.includes('call')) return 'call';
  if (legal.includes('fold')) return 'fold';
  return null;
}

function finalizeRecord(record) {
  snapshot(record);
  const settlement = settlementPass();
  record.completed = true;
  record.finishedAt = new Date().toISOString();
  record.winners = settlement.winners;
  record.settledPot = settlement.settledPot;
  record.totalStacks = settlement.totalStacks;
  record.fundedPlayers = settlement.fundedPlayers;
  record.pass = ['preflop', 'flop', 'turn', 'river', 'showdown']
    .every((phase) => record.phases.includes(phase))
    && record.communityMax === 5
    && record.holeCards === 2
    && settlement.pass;
  history.unshift({
    ...record,
    phases: record.phases.slice(),
    actions: record.actions.slice(),
    winners: record.winners.slice()
  });
  history.splice(8);
  return record.pass;
}

async function driveHand(options = {}) {
  if (!ACTIVE) return { build: BUILD, pass: false, error: 'ANDROID_ONLY' };
  if (running) return lastResult || { build: BUILD, pass: false, running: true };

  running = true;
  const timeoutMs = Math.max(15000, Math.min(90000, Number(options.timeoutMs || 60000)));
  const maxHands = Math.max(1, Math.min(5, Number(options.maxHands || 3)));
  const started = performance.now();
  const previousPassiveMode = window.SVR_POKER_QA_PASSIVE_BOTS;
  let activeRecord = null;
  let handledSequence = -1;
  const stateListener = () => snapshot(activeRecord);

  const result = {
    build: BUILD,
    pass: false,
    attempts: 0,
    timeoutMs,
    maxHands,
    deterministicBots: true,
    record: null,
    audit: null,
    error: null,
    startedAt: new Date().toISOString()
  };

  try {
    if (typeof window.SVR_POKER_ACTION !== 'function'
      || typeof window.SVR_RESET_POKER_TABLE !== 'function') {
      throw new Error('POKER_ENGINE_NOT_READY');
    }

    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    window.addEventListener('svr:poker-state', stateListener);

    activeRecord = makeRecord(1);
    window.SVR_RESET_POKER_TABLE(1000);
    activeRecord.handNo = Number(state.handNo || 0);
    snapshot(activeRecord);

    while (performance.now() - started < timeoutMs && result.attempts < maxHands) {
      snapshot(activeRecord);

      if (state.waitingHuman && Number(state.actionSeq || 0) !== handledSequence) {
        const selected = chooseAction();
        if (selected) {
          handledSequence = Number(state.actionSeq || 0);
          window.SVR_POKER_ACTION(selected);
        }
      }

      if (String(state.phase || '').toLowerCase() === 'showdown') {
        await wait(90);
        result.attempts += 1;
        const passed = finalizeRecord(activeRecord);
        if (passed) {
          result.pass = true;
          result.record = activeRecord;
          break;
        }

        if (result.attempts < maxHands) {
          handledSequence = -1;
          activeRecord = makeRecord(result.attempts + 1);
          window.SVR_RESET_POKER_TABLE(1000);
          activeRecord.handNo = Number(state.handNo || 0);
          snapshot(activeRecord);
        }
      }

      await wait(45);
    }

    if (!result.record && history[0]) result.record = history[0];
    result.timeout = !result.pass && performance.now() - started >= timeoutMs;
    result.audit = {
      phase: state.phase,
      handNo: state.handNo,
      community: state.community?.length || 0,
      holeCards: players.find((player) => player.human)?.hand?.length || 0,
      waitingHuman: Boolean(state.waitingHuman),
      legalActions: window.SVR_POKER_LEGAL_ACTIONS?.() || [],
      settlement: settlementPass(),
      controller: window.SVR_PHASE347_QA?.() || null,
      phase355: window.SVR_PHASE355_QA?.() || null,
      qaPassiveBots: window.SVR_POKER_QA_PASSIVE_BOTS === true
    };
  } catch (error) {
    result.error = String(error?.stack || error?.message || error);
  } finally {
    window.removeEventListener('svr:poker-state', stateListener);
    if (previousPassiveMode === undefined) delete window.SVR_POKER_QA_PASSIVE_BOTS;
    else window.SVR_POKER_QA_PASSIVE_BOTS = previousPassiveMode;
    result.elapsedMs = +(performance.now() - started).toFixed(1);
    result.finishedAt = new Date().toISOString();
    running = false;
    lastResult = result;
    window.SVR_PHASE355_FULL_HAND_RESULT = result;
  }

  return result;
}

function qa() {
  const result = {
    build: BUILD,
    active: ACTIVE,
    installed: typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function',
    phase344Alias: typeof window.SVR_PHASE344_RUN_FULL_HAND_QA === 'function',
    pokerAction: typeof window.SVR_POKER_ACTION,
    resetPoker: typeof window.SVR_RESET_POKER_TABLE,
    passiveModeLeaked: window.SVR_POKER_QA_PASSIVE_BOTS === true,
    lastResult,
    history: history.slice(0, 3),
    checkedAt: new Date().toISOString()
  };
  result.pass = result.active
    && result.installed
    && result.phase344Alias
    && result.pokerAction === 'function'
    && result.resetPoker === 'function'
    && !result.passiveModeLeaked;
  window.SVR_PHASE355_HAND_DRIVER_QA_STATE = result;
  return result;
}

if (ACTIVE) {
  window.SVR_PHASE355_RUN_FULL_HAND_QA = driveHand;
  window.SVR_PHASE344_RUN_FULL_HAND_QA = driveHand;
  window.SVR_PHASE355_HAND_DRIVER_QA = qa;
  window.SVR_PHASE355_HAND_HISTORY = history;
}
