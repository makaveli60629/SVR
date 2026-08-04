import { state, players, legal } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-363-ANDROID-STREET-RAISE-ACTION-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  raisePanelOpens: 0,
  raiseAttempts: 0,
  raiseAccepted: 0,
  raiseRejected: 0,
  duplicateRaiseEventsBlocked: 0,
  lastRaise: null,
  streetTimeline: [],
  phaseActions: {},
  installedAt: null,
  checkedAt: null
};

let originalAction = null;
let originalRaiseTo = null;
let lastUiActivationAt = 0;
let lastTimelineSignature = '';

const $ = (selector) => document.querySelector(selector);
const human = () => players.find((player) => player?.human) || players[0] || null;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function joined() {
  return Boolean(window.SVR_PHASE363_STATE?.joined);
}

function legalSet() {
  try { return new Set(window.SVR_POKER_LEGAL_ACTIONS?.() || legal() || []); }
  catch { return new Set(); }
}

function currentRaiseBounds() {
  const player = human() || {};
  const currentBet = Number(state.currentBet || 0);
  const minRaise = Math.max(Number(state.bigBlind || 20), Number(state.minRaise || state.bigBlind || 20));
  const maximum = Math.max(0, Number(player.bet || 0) + Number(player.stack || 0));
  const minimum = currentBet > 0
    ? Math.min(maximum, currentBet + minRaise)
    : Math.min(maximum, Math.max(Number(state.bigBlind || 20), minRaise));
  const step = maximum >= 5000 ? 100 : maximum >= 1000 ? 50 : maximum >= 200 ? 25 : 5;
  return {
    currentBet,
    minRaise,
    minimum: Math.max(0, minimum),
    maximum,
    step,
    playerBet: Number(player.bet || 0),
    playerStack: Number(player.stack || 0)
  };
}

function configureRaisePanel(requested = null) {
  const slider = $('#svr347RaiseSlider');
  const amount = $('#svr347RaiseAmount');
  const panel = $('#svr347Raise');
  if (!slider || !amount || !panel) return null;
  const bounds = currentRaiseBounds();
  const fallback = Math.min(bounds.maximum, Math.max(bounds.minimum, bounds.currentBet ? bounds.currentBet + bounds.minRaise : bounds.minimum));
  const desired = Number.isFinite(Number(requested)) ? Number(requested) : Number(slider.value || fallback);
  const target = clamp(Math.floor(desired || fallback), bounds.minimum, bounds.maximum);
  slider.min = String(bounds.minimum);
  slider.max = String(Math.max(bounds.minimum, bounds.maximum));
  slider.step = String(bounds.step);
  slider.value = String(target);
  amount.textContent = `$${target.toLocaleString()}`;
  window.SVR_ANDROID_RAISE_AMOUNT = target;
  panel.classList.add('open');
  document.body.classList.add('svr347-raise-open');
  runtime.raisePanelOpens += 1;
  return { ...bounds, target };
}

function closeRaisePanel() {
  $('#svr347Raise')?.classList.remove('open');
  document.body.classList.remove('svr347-raise-open');
}

function raiseTo(requested) {
  runtime.raiseAttempts += 1;
  const before = currentRaiseBounds();
  const actions = legalSet();
  const phase = String(state.phase || 'idle').toLowerCase();
  const currentPlayer = players[state.current];
  const permitted = joined()
    && Boolean(state.waitingHuman)
    && Boolean(currentPlayer?.human)
    && (actions.has('raise') || actions.has('bet'))
    && before.maximum > before.currentBet;

  if (!permitted) {
    runtime.raiseRejected += 1;
    runtime.lastRaise = {
      accepted: false,
      reason: !joined() ? 'not-joined' : !state.waitingHuman ? 'not-your-turn' : !currentPlayer?.human ? 'not-human-actor' : 'raise-not-legal',
      requested: Number(requested || 0),
      phase,
      legalActions: [...actions],
      before,
      at: new Date().toISOString()
    };
    return false;
  }

  const target = clamp(
    Math.floor(Number(requested) || before.minimum),
    before.minimum,
    before.maximum
  );
  const type = before.currentBet > 0 ? 'raise' : 'bet';
  let accepted = false;
  try {
    accepted = originalAction?.({ type, raiseTo: target }) !== false;
    if (!accepted && typeof originalRaiseTo === 'function') accepted = originalRaiseTo(target) !== false;
  } catch (error) {
    runtime.lastRaise = {
      accepted: false,
      reason: String(error?.message || error),
      requested: Number(requested || 0),
      target,
      phase,
      legalActions: [...actions],
      before,
      at: new Date().toISOString()
    };
    runtime.raiseRejected += 1;
    return false;
  }

  const afterPlayer = human() || {};
  const after = {
    currentBet: Number(state.currentBet || 0),
    playerBet: Number(afterPlayer.bet || 0),
    playerStack: Number(afterPlayer.stack || 0),
    actionSeq: Number(state.actionSeq || 0),
    phase: String(state.phase || phase)
  };
  runtime.lastRaise = {
    accepted,
    requested: Number(requested || 0),
    target,
    type,
    phase,
    legalActions: [...actions],
    before,
    after,
    increasedBet: after.playerBet > before.playerBet || after.currentBet > before.currentBet,
    at: new Date().toISOString()
  };
  if (accepted) {
    runtime.raiseAccepted += 1;
    runtime.phaseActions[phase] = [...(runtime.phaseActions[phase] || []), 'raise'];
    window.SVR_PHASE363_AUDIO?.play?.('chip_bet');
    try { navigator.vibrate?.([20, 18, 28]); } catch {}
  } else {
    runtime.raiseRejected += 1;
  }
  runtime.checkedAt = new Date().toISOString();
  return accepted;
}

function activateRaiseUi(event, source) {
  const openButton = event.target?.closest?.('#svr347Actions [data-ui="raise"]');
  const confirmButton = event.target?.closest?.('#svr347RaiseConfirm');
  const closeButton = event.target?.closest?.('#svr347RaiseClose');
  if (!openButton && !confirmButton && !closeButton) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  const now = performance.now();
  if (now - lastUiActivationAt < 450) {
    runtime.duplicateRaiseEventsBlocked += 1;
    return true;
  }
  lastUiActivationAt = now;

  if (closeButton) {
    closeRaisePanel();
    return true;
  }
  if (openButton) {
    configureRaisePanel();
    return true;
  }
  const slider = $('#svr347RaiseSlider');
  const configured = configureRaisePanel(Number(slider?.value || window.SVR_ANDROID_RAISE_AMOUNT || 0));
  const accepted = raiseTo(configured?.target || 0);
  if (accepted) closeRaisePanel();
  return true;
}

function recordStreet(reason = 'state') {
  if (!joined()) return;
  const phase = String(state.phase || 'idle').toLowerCase();
  const snapshot = {
    phase,
    communityCount: Number(state.community?.length || 0),
    burnCount: Number(state.burn?.length || 0),
    pot: Number(state.pot || 0),
    currentBet: Number(state.currentBet || 0),
    waitingHuman: Boolean(state.waitingHuman),
    current: players[state.current]?.name || null,
    actionSeq: Number(state.actionSeq || 0),
    reason,
    at: Date.now()
  };
  const signature = [snapshot.phase, snapshot.communityCount, snapshot.burnCount, snapshot.actionSeq, snapshot.waitingHuman, snapshot.current].join(':');
  if (signature === lastTimelineSignature) return;
  lastTimelineSignature = signature;
  runtime.streetTimeline.push(snapshot);
  runtime.streetTimeline = runtime.streetTimeline.slice(-240);
  runtime.checkedAt = new Date().toISOString();
}

function firstPhaseSnapshot(phase) {
  return runtime.streetTimeline.find((entry) => entry.phase === phase) || null;
}

function streetValidation() {
  const expected = {
    preflop: { community: 0, burn: 0 },
    flop: { community: 3, burn: 1 },
    turn: { community: 4, burn: 2 },
    river: { community: 5, burn: 3 },
    showdown: { community: 5, burn: 3 }
  };
  const snapshots = Object.fromEntries(Object.keys(expected).map((phase) => [phase, firstPhaseSnapshot(phase)]));
  const order = runtime.streetTimeline
    .map((entry) => entry.phase)
    .filter((phase, index, all) => index === 0 || phase !== all[index - 1])
    .filter((phase) => ['preflop', 'flop', 'turn', 'river', 'showdown'].includes(phase));
  const uniqueOrder = order.filter((phase, index) => order.indexOf(phase) === index);
  const expectedOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const orderPass = expectedOrder.every((phase, index) => uniqueOrder[index] === phase);
  const burnPass = Object.entries(expected).every(([phase, rule]) => {
    const snapshot = snapshots[phase];
    if (!snapshot) return false;
    return snapshot.communityCount === rule.community && snapshot.burnCount >= rule.burn;
  });
  return { expected, snapshots, order: uniqueOrder, orderPass, burnPass };
}

function syncRaiseButton() {
  const button = $('#svr347Actions [data-ui="raise"]');
  if (!button) return;
  const actions = legalSet();
  const enabled = joined() && state.waitingHuman && (actions.has('raise') || actions.has('bet'));
  button.textContent = state.currentBet > 0 ? 'RAISE' : 'BET';
  button.disabled = !enabled;
  button.setAttribute('aria-label', enabled ? `${button.textContent} chips` : `${button.textContent} unavailable`);
}

function qa() {
  const streets = streetValidation();
  const button = $('#svr347Actions [data-ui="raise"]');
  const panel = $('#svr347Raise');
  return {
    ...runtime,
    joined: joined(),
    waitingHuman: Boolean(state.waitingHuman),
    legalActions: [...legalSet()],
    raiseButtonPresent: Boolean(button),
    raiseButtonEnabled: Boolean(button && !button.disabled),
    raisePanelPresent: Boolean(panel),
    raisePanelOpen: Boolean(panel?.classList.contains('open')),
    lastRaiseWorked: runtime.lastRaise ? Boolean(runtime.lastRaise.accepted && runtime.lastRaise.increasedBet) : null,
    streetOrder: streets.order,
    streetOrderPass: streets.orderPass,
    burnSequencePass: streets.burnPass,
    streetSnapshots: streets.snapshots,
    pass: Boolean(
      ACTIVE
      && button
      && panel
      && (!runtime.lastRaise || (runtime.lastRaise.accepted && runtime.lastRaise.increasedBet))
      && (streets.order.length < 5 || (streets.orderPass && streets.burnPass))
    ),
    checkedAt: new Date().toISOString()
  };
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  if (typeof window.SVR_POKER_ACTION !== 'function' || typeof window.SVR_PHASE363_JOIN_TABLE !== 'function') {
    setTimeout(install, 80);
    return;
  }
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  originalAction = window.SVR_POKER_ACTION;
  originalRaiseTo = window.SVR_POKER_RAISE_TO;
  window.SVR_POKER_RAISE_TO = raiseTo;
  window.SVR_PHASE363_RAISE_TO = raiseTo;
  window.SVR_PHASE363_CONFIGURE_RAISE = configureRaisePanel;
  window.SVR_PHASE363_STREET_RAISE_QA = qa;
  window.SVR_PHASE363_STREET_RAISE_STATE = runtime;

  window.addEventListener('pointerdown', (event) => activateRaiseUi(event, 'pointerdown'), true);
  window.addEventListener('click', (event) => activateRaiseUi(event, 'click'), true);
  window.addEventListener('svr:poker-state', () => {
    recordStreet('poker-state');
    syncRaiseButton();
  });
  window.addEventListener('svr:phase363-table-joined', () => {
    runtime.streetTimeline = [];
    runtime.phaseActions = {};
    lastTimelineSignature = '';
    setTimeout(() => recordStreet('joined'), 0);
  });
  window.addEventListener('svr:phase363-table-left', () => {
    closeRaisePanel();
    syncRaiseButton();
  });
  $('#svr347RaiseSlider')?.addEventListener('input', (event) => configureRaisePanel(Number(event.target.value || 0)));
  setInterval(() => {
    syncRaiseButton();
    if (joined()) recordStreet('watchdog');
  }, 100);
  syncRaiseButton();
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));
