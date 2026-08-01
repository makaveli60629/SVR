import { state, players } from './phase336_authoritative_engine.js';

const BUILD = 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

let running = false;
let lastResult = null;
let repairs = 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const visible = (element) => {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
};
const cardText = (card) => card ? `${card.r}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[card.s] || ''}` : '•';

function syncCards() {
  const human = players.find((player) => player.human) || players[0];
  const holes = [...document.querySelectorAll('#svr347Hole [data-hole]')];
  const community = [...document.querySelectorAll('#svr347Community [data-community]')];
  holes.forEach((slot, index) => {
    const card = human?.hand?.[index];
    const text = cardText(card);
    if (slot.textContent !== text) repairs += 1;
    slot.textContent = text;
    slot.classList.toggle('empty', !card);
    slot.classList.toggle('red', /[♥♦]/.test(text));
  });
  community.forEach((slot, index) => {
    const card = state.community?.[index];
    const text = cardText(card);
    if (slot.textContent !== text) repairs += 1;
    slot.textContent = text;
    slot.classList.toggle('empty', !card);
    slot.classList.toggle('red', /[♥♦]/.test(text));
  });
}

function controllerAudit() {
  window.SVR_PHASE350_ANDROID_CONTROLLER_SWEEP?.();
  const authority = document.querySelector('#svr347Root');
  const buttons = authority ? [...authority.querySelectorAll('#svr347Actions button')] : [];
  const result = {
    roots: document.querySelectorAll('#svr347Root').length,
    move: authority?.querySelectorAll('#svr347Move').length || 0,
    look: authority?.querySelectorAll('#svr347Look').length || 0,
    actions: authority?.querySelectorAll('#svr347Actions').length || 0,
    buttons: buttons.length,
    buttonLabels: buttons.map((button) => button.textContent.trim()),
    visible: Boolean(authority && visible(authority)),
    legacy: window.SVR_PHASE350_ANDROID_CONTROLLER_QA?.() || null
  };
  result.pass = result.roots === 1 && result.move === 1 && result.look === 1
    && result.actions === 1 && result.buttons === 6 && result.visible
    && result.legacy?.pass === true;
  return result;
}

function cardAudit() {
  syncCards();
  const holes = [...document.querySelectorAll('#svr347Hole [data-hole]')];
  const community = [...document.querySelectorAll('#svr347Community [data-community]')];
  const human = players.find((player) => player.human) || players[0];
  const shownCommunity = community.filter((slot) => !slot.classList.contains('empty')).length;
  const result = {
    holeSlots: holes.length,
    communitySlots: community.length,
    visibleHolePanel: visible(document.querySelector('#svr347Hole')),
    visibleCommunityPanel: visible(document.querySelector('#svr347Community')),
    engineHoleCards: human?.hand?.length || 0,
    engineCommunityCards: state.community?.length || 0,
    shownCommunity,
    repairs
  };
  result.pass = result.holeSlots === 2 && result.communitySlots === 5
    && result.visibleHolePanel && result.visibleCommunityPanel
    && (result.engineHoleCards === 0 || result.engineHoleCards === 2)
    && result.shownCommunity === result.engineCommunityCards;
  return result;
}

function tableAudit() {
  const scene = window.__SVR_SCENE__;
  const logo = scene?.getObjectByName?.('PHASE347_ANDROID_TABLE_LOGO_ROOT')
    || scene?.getObjectByName?.('PHASE341_CANONICAL_CENTER_LOGO_ROOT');
  const pot = scene?.getObjectByName?.('PHASE347_ANDROID_POT_DISPLAY')
    || scene?.getObjectByName?.('PHASE347_ANDROID_OVERLAY_ROOT');
  return { logo: Boolean(logo), potDisplay: Boolean(pot), table: Boolean(window.SVR_TABLE_AUTHORITY || window.SVR_PHASE341_TABLE_LAYOUT) };
}

function chooseHumanAction() {
  const legal = new Set(window.SVR_POKER_LEGAL_ACTIONS?.() || []);
  if (legal.has('check')) return 'check';
  if (legal.has('call')) return 'call';
  if (legal.has('allin')) return 'allin';
  if (legal.has('fold')) return 'fold';
  return null;
}

async function completeOneHand(timeoutMs = 90000) {
  const startedAt = performance.now();
  const phases = new Set();
  const actions = [];
  const startingHand = Number(state.handNo || 0);
  while (performance.now() - startedAt < timeoutMs) {
    phases.add(String(state.phase || 'idle').toLowerCase());
    syncCards();
    if (state.phase === 'showdown') {
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      return {
        completed: true,
        handNo: state.handNo,
        phases: [...phases],
        community: state.community.length,
        burn: state.burn.length,
        winners: state.winners?.map((winner) => ({ name: winner.name, amount: winner.amount, label: winner.label })) || [],
        settledPot: state.settledPot,
        totalStacks: players.reduce((sum, player) => sum + Number(player.stack || 0), 0),
        actions,
        audit
      };
    }
    if (state.waitingHuman) {
      const action = chooseHumanAction();
      if (action) {
        const accepted = window.SVR_POKER_ACTION?.(action);
        actions.push({ phase: state.phase, action, accepted: accepted !== false });
      }
    }
    if (Number(state.handNo || 0) < startingHand) throw new Error('HAND_NUMBER_REWOUND');
    await wait(90);
  }
  return { completed: false, handNo: state.handNo, phases: [...phases], community: state.community.length, actions, timeout: true };
}

async function runAcceptance(options = {}) {
  if (!ACTIVE) return { build: BUILD, pass: false, error: 'ANDROID_ONLY' };
  if (running) return lastResult || { build: BUILD, pass: false, running: true };
  running = true;
  const maxHands = Math.max(1, Math.min(6, Number(options.maxHands || 4)));
  const timeoutMs = Math.max(30000, Number(options.timeoutMs || 90000));
  const report = {
    build: BUILD,
    startedAt: new Date().toISOString(),
    maxHands,
    attempts: [],
    controllerBefore: null,
    controllerAfter: null,
    cards: null,
    table: null,
    seat: null,
    nextHand: null,
    updatePolicy: { ...(window.SVR_ANDROID_UPDATE_POLICY || {}) },
    pass: false,
    error: null
  };
  try {
    for (let i = 0; i < 80 && (!window.SVR_POKER_ACTION || !document.querySelector('#svr347Root')); i += 1) await wait(125);
    report.controllerBefore = controllerAudit();
    const seated = window.SVR_PHASE347_SIT?.() ?? window.SVR_PHASE343_SIT?.();
    await wait(950);
    report.seat = {
      commandAccepted: seated !== false,
      state: window.SVR_PHASE347_STATE || window.SVR_PHASE343_STATE || null,
      button: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null
    };
    window.SVR_RESET_POKER_TABLE?.(1000);
    for (let attempt = 0; attempt < maxHands; attempt += 1) {
      if (attempt > 0 && state.phase === 'showdown') window.SVR_POKER_NEXT_HAND?.();
      const hand = await completeOneHand(timeoutMs);
      report.attempts.push(hand);
      if (hand.completed && hand.community === 5 && hand.winners.length > 0 && hand.totalStacks === 6000) break;
    }
    const acceptedHand = report.attempts.find((hand) => hand.completed && hand.community === 5 && hand.winners?.length > 0 && hand.totalStacks === 6000) || null;
    report.cards = cardAudit();
    report.table = tableAudit();
    report.controllerAfter = controllerAudit();
    if (acceptedHand) {
      const previous = Number(state.handNo || 0);
      const nextAccepted = window.SVR_POKER_NEXT_HAND?.();
      for (let i = 0; i < 40 && Number(state.handNo || 0) <= previous; i += 1) await wait(100);
      report.nextHand = { commandAccepted: nextAccepted !== false, previous, current: Number(state.handNo || 0), advanced: Number(state.handNo || 0) > previous };
    }
    report.pass = Boolean(acceptedHand)
      && report.controllerBefore.pass && report.controllerAfter.pass
      && report.cards.pass && report.table.table && report.table.logo && report.table.potDisplay
      && report.seat.commandAccepted && report.nextHand?.advanced
      && report.updatePolicy.forceUpdate === false
      && report.updatePolicy.showUpdatePrompt === false
      && report.updatePolicy.manualUpdateOnly === true;
  } catch (error) {
    report.error = String(error?.stack || error?.message || error);
  } finally {
    report.finishedAt = new Date().toISOString();
    running = false;
    lastResult = report;
    window.SVR_PHASE354_ACCEPTANCE_RESULT = report;
    window.dispatchEvent(new CustomEvent('svr:phase354-acceptance', { detail: report }));
  }
  return report;
}

function qa() {
  const result = {
    build: BUILD,
    active: ACTIVE,
    controller: controllerAudit(),
    cards: cardAudit(),
    table: tableAudit(),
    poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
    fullGameAcceptance: lastResult,
    updatePolicy: { ...(window.SVR_ANDROID_UPDATE_POLICY || {}) },
    checkedAt: new Date().toISOString()
  };
  result.pass = result.controller.pass && result.cards.pass && result.table.table
    && result.updatePolicy.forceUpdate === false && result.updatePolicy.showUpdatePrompt === false;
  window.SVR_PHASE354_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE) return;
  [300, 900, 1800, 3500].forEach((delay) => setTimeout(() => { window.SVR_PHASE350_ANDROID_CONTROLLER_SWEEP?.(); syncCards(); }, delay));
  setInterval(syncCards, 650);
  window.addEventListener('svr:poker-state', syncCards);
  window.SVR_PHASE354_QA = qa;
  window.SVR_PHASE354_RUN_ANDROID_FULL_GAME_ACCEPTANCE = runAcceptance;
  window.SVR_PHASE354_STATE = { build: BUILD, active: true, installedAt: new Date().toISOString() };
  if (new URLSearchParams(location.search).get('acceptance') === '1') setTimeout(() => runAcceptance(), 4200);
}

install();
