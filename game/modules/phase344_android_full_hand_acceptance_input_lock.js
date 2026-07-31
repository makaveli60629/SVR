import * as THREE from 'three';
import { state, players } from './phase336_authoritative_engine.js';

const BUILD = 'PHASE-344-ANDROID-FULL-HAND-ACCEPTANCE-INPUT-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')
  || /\/game\/android\.html$/i.test(location.pathname);

let installed = false;
let originalAction = null;
let originalRaise = null;
let originalNext = null;
let actionLock = { signature: '', at: 0, sequence: -1 };
let blockedDuplicates = 0;
let acceptedActions = 0;
let seatDriftStrikes = 0;
let seatRecoveries = 0;
let lastObservedSeq = -1;
let lastHandNo = -1;
let lastPhase = '';
let lastCommunity = -1;
let activeRecord = null;
const handHistory = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const scene = () => window.__SVR_SCENE__ || null;
const camera = () => window.__SVR_RENDERER__?.xr?.isPresenting
  ? window.__SVR_RENDERER__.xr.getCamera(window.__SVR_CAMERA__)
  : window.__SVR_CAMERA__ || null;

function normalizeAction(input) {
  if (typeof input === 'string') return { type: input.toLowerCase() };
  const value = { ...(input || {}) };
  value.type = String(value.type || '').toLowerCase();
  return value;
}

function signatureFor(input) {
  const action = normalizeAction(input);
  const amount = Number(action.raiseTo ?? action.target ?? action.amount ?? 0);
  return `${action.type}:${Number.isFinite(amount) ? amount : 0}`;
}

function installCss() {
  if ($('#svr344-style')) return;
  const style = document.createElement('style');
  style.id = 'svr344-style';
  style.textContent = `
#svr344ActionToast{position:fixed;left:50%;bottom:257px;transform:translateX(-50%) translateY(8px);z-index:2147483090;min-width:150px;max-width:78vw;padding:8px 13px;border:1px solid rgba(127,252,255,.74);border-radius:999px;background:rgba(0,10,18,.88);color:#eaffff;text-align:center;font:950 11px/1 system-ui,Arial;letter-spacing:.08em;box-shadow:0 0 22px rgba(127,252,255,.22);opacity:0;visibility:hidden;pointer-events:none;transition:.16s ease}
#svr344ActionToast.show{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
body.svr344-action-pending .svr326Actions button:not([data-ui="seat"]){pointer-events:none!important;filter:saturate(.55)!important;opacity:.50!important}
body.svr344-action-pending .svr326Actions button.svr344-sent{opacity:1!important;border-color:#7ffcff!important;background:linear-gradient(180deg,rgba(0,87,98,.94),rgba(0,31,45,.94))!important;box-shadow:0 0 22px rgba(127,252,255,.28)!important}
body.svr344-android #svr343Community{min-width:218px;justify-content:center}
body.svr344-android #svr343Meta{max-width:55vw}
@media(max-height:650px){#svr344ActionToast{bottom:236px}}
@media(orientation:landscape){#svr344ActionToast{left:auto;right:252px;bottom:118px;transform:none}#svr344ActionToast.show{transform:none}}
`;
  document.head.appendChild(style);
}

function ensureToast() {
  let toast = $('#svr344ActionToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'svr344ActionToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  return toast;
}

function labelFor(input) {
  const action = normalizeAction(input);
  const amount = Number(action.raiseTo ?? action.target ?? action.amount ?? 0);
  if (action.type === 'raise' || action.type === 'bet') return amount > 0 ? `RAISE $${amount.toLocaleString()} SENT` : 'RAISE SENT';
  if (action.type === 'allin') return 'ALL IN SENT';
  if (action.type === 'next') return 'NEXT HAND';
  return `${action.type || 'ACTION'} SENT`.toUpperCase();
}

function flashAction(input) {
  const action = normalizeAction(input);
  const toast = ensureToast();
  toast.textContent = labelFor(action);
  toast.classList.add('show');
  document.body.classList.add('svr344-action-pending');
  const button = $(`.svr326Actions [data-act="${action.type}"]`)
    || (action.type === 'raise' || action.type === 'bet' ? $('.svr326Actions [data-ui="raise"]') : null)
    || (action.type === 'next' ? $('.svr326Actions [data-phase341-primary="1"]') : null);
  button?.classList.add('svr344-sent');
  window.setTimeout(() => {
    toast.classList.remove('show');
    button?.classList.remove('svr344-sent');
  }, 620);
}

function releasePending() {
  document.body.classList.remove('svr344-action-pending');
  $$('.svr326Actions .svr344-sent').forEach((button) => button.classList.remove('svr344-sent'));
}

function actionAllowed(input) {
  const action = normalizeAction(input);
  if (action.type === 'next') return ['idle', 'showdown'].includes(String(state.phase || '').toLowerCase());
  if (!state.waitingHuman) return false;
  const legal = new Set(window.SVR_POKER_LEGAL_ACTIONS?.() || []);
  if (!legal.size) return true;
  if (action.type === 'raise' || action.type === 'bet') return legal.has('raise') || legal.has('bet');
  return legal.has(action.type);
}

function brokerAction(input) {
  const action = normalizeAction(input);
  const signature = signatureFor(action);
  const now = performance.now();
  const sequence = Number(state.actionSeq || 0);
  const duplicateWindow = action.type === 'next' ? 1100 : 650;
  if (signature === actionLock.signature && now - actionLock.at < duplicateWindow) {
    blockedDuplicates += 1;
    return false;
  }
  if (!actionAllowed(action)) return false;
  actionLock = { signature, at: now, sequence };
  const result = originalAction?.(action);
  if (result !== false) {
    acceptedActions += 1;
    flashAction(action);
  }
  return result;
}

function installActionBroker() {
  if (window.SVR_PHASE344_ACTION_BROKER_INSTALLED) return true;
  if (typeof window.SVR_POKER_ACTION !== 'function') return false;
  originalAction = window.SVR_POKER_ACTION;
  originalRaise = window.SVR_POKER_RAISE_TO;
  originalNext = window.SVR_POKER_NEXT_HAND;
  window.SVR_POKER_ACTION = brokerAction;
  window.SVR_POKER_RAISE_TO = (amount) => brokerAction({ type: 'raise', raiseTo: amount });
  window.SVR_POKER_NEXT_HAND = () => brokerAction('next');
  window.SVR_PHASE344_ACTION_BROKER_INSTALLED = true;
  window.SVR_PHASE344_ORIGINAL_ACTIONS = { action: originalAction, raise: originalRaise, next: originalNext };
  return true;
}

function tableMetrics() {
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  if (layout?.center && layout?.size) {
    return {
      center: new THREE.Vector3(layout.center.x, layout.center.y || 0, layout.center.z),
      top: Number(layout.top || 1),
      depth: Number(layout.size.z || 1.8)
    };
  }
  const table = window.SVR_TABLE_AUTHORITY;
  if (!table) return null;
  table.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(table);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return { center, top: box.max.y, depth: size.z };
}

function projectedTableCenter() {
  const metrics = tableMetrics();
  const cam = camera();
  if (!metrics || !cam) return null;
  cam.updateMatrixWorld?.(true);
  cam.updateProjectionMatrix?.();
  const projected = new THREE.Vector3(metrics.center.x, metrics.top + 0.04, metrics.center.z).project(cam);
  return { metrics, projected };
}

function seatedNow() {
  return Boolean(window.SVR_PHASE343_STATE?.seated || document.body.classList.contains('svr343-seated'));
}

function seatWatchdog() {
  if (!seatedNow()) {
    seatDriftStrikes = 0;
    return;
  }
  const check = projectedTableCenter();
  const cam = camera();
  if (!check || !cam) return;
  const position = new THREE.Vector3();
  cam.getWorldPosition(position);
  const distance = Math.hypot(position.x - check.metrics.center.x, position.z - check.metrics.center.z);
  const offscreen = Math.abs(check.projected.x) > 0.90 || Math.abs(check.projected.y) > 0.88 || check.projected.z < -1 || check.projected.z > 1;
  const drifted = distance > Math.max(2.15, check.metrics.depth * 1.25) || distance < 0.62;
  if (offscreen || drifted) seatDriftStrikes += 1;
  else seatDriftStrikes = 0;
  if (seatDriftStrikes >= 3) {
    seatDriftStrikes = 0;
    seatRecoveries += 1;
    try { window.SVR_ANDROID_CENTER_PLAYER?.(); } catch {}
  }
}

function syncCommunityStrip() {
  const strip = $('#svr343Community');
  if (!strip) return false;
  let slots = $$('.svr343CommunityCard', strip);
  if (slots.length !== 5) {
    strip.innerHTML = Array.from({ length: 5 }, (_, index) => `<div class="svr343CommunityCard empty" data-community="${index}">•</div>`).join('');
    slots = $$('.svr343CommunityCard', strip);
  }
  slots.forEach((slot, index) => {
    const card = state.community?.[index];
    const suit = { S: '♠', H: '♥', D: '♦', C: '♣' }[card?.s] || '';
    const text = card ? `${card.r}${suit}` : '•';
    slot.textContent = text;
    slot.classList.toggle('empty', !card);
    slot.classList.toggle('red', /[♥♦]/.test(text));
  });
  return true;
}

function beginRecord() {
  activeRecord = {
    build: BUILD,
    handNo: Number(state.handNo || 0),
    startedAt: new Date().toISOString(),
    phases: [],
    communityMax: 0,
    holeCards: players?.[0]?.hand?.length || 0,
    actions: [],
    actionSeqStart: Number(state.actionSeq || 0),
    actionSeqEnd: Number(state.actionSeq || 0),
    completed: false,
    pass: false
  };
}

function finishRecord() {
  if (!activeRecord || activeRecord.completed) return;
  activeRecord.completed = true;
  activeRecord.finishedAt = new Date().toISOString();
  activeRecord.actionSeqEnd = Number(state.actionSeq || 0);
  activeRecord.winners = (state.winners || []).map((winner) => ({ name: winner.name, amount: winner.amount, label: winner.label }));
  activeRecord.pass = ['preflop', 'flop', 'turn', 'river', 'showdown'].every((phase) => activeRecord.phases.includes(phase))
    && activeRecord.communityMax === 5
    && activeRecord.holeCards === 2;
  handHistory.unshift({ ...activeRecord, phases: activeRecord.phases.slice(), actions: activeRecord.actions.slice() });
  handHistory.splice(8);
}

function observeHand() {
  const handNo = Number(state.handNo || 0);
  const phase = String(state.phase || 'idle').toLowerCase();
  const sequence = Number(state.actionSeq || 0);
  if (handNo !== lastHandNo) {
    if (activeRecord && !activeRecord.completed) finishRecord();
    lastHandNo = handNo;
    beginRecord();
  }
  if (!activeRecord) beginRecord();
  if (phase && !activeRecord.phases.includes(phase)) activeRecord.phases.push(phase);
  activeRecord.communityMax = Math.max(activeRecord.communityMax, state.community?.length || 0);
  activeRecord.holeCards = Math.max(activeRecord.holeCards, players?.[0]?.hand?.length || 0);
  if (sequence !== lastObservedSeq) {
    activeRecord.actions.push({ sequence, phase, message: state.lastAction || '', at: new Date().toISOString() });
    activeRecord.actions = activeRecord.actions.slice(-24);
    lastObservedSeq = sequence;
  }
  if (phase === 'showdown') finishRecord();
  if (lastPhase !== phase || lastCommunity !== (state.community?.length || 0)) {
    lastPhase = phase;
    lastCommunity = state.community?.length || 0;
    syncCommunityStrip();
  }
}

function rectsOverlap(a, b) {
  return a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function qa() {
  const base = window.SVR_PHASE343_QA?.() || null;
  const actions = $('.svr326Actions')?.getBoundingClientRect?.();
  const community = $('#svr343Community')?.getBoundingClientRect?.();
  const status = $('#svr343Top')?.getBoundingClientRect?.();
  const drawer = $('#svr343RaiseDrawer')?.getBoundingClientRect?.();
  const check = projectedTableCenter();
  const result = {
    build: BUILD,
    active: ACTIVE,
    base,
    broker: {
      installed: Boolean(window.SVR_PHASE344_ACTION_BROKER_INSTALLED),
      acceptedActions,
      blockedDuplicates,
      lock: { ...actionLock }
    },
    hand: {
      current: activeRecord ? { ...activeRecord, phases: activeRecord.phases.slice(), actions: activeRecord.actions.slice() } : null,
      history: handHistory.map((record) => ({ ...record, phases: record.phases.slice(), actions: record.actions.slice() }))
    },
    community: {
      slots: $$('.svr343CommunityCard').length,
      shown: $$('.svr343CommunityCard:not(.empty)').length,
      engine: state.community?.length || 0,
      synced: $$('.svr343CommunityCard:not(.empty)').length === (state.community?.length || 0)
    },
    seat: {
      seated: seatedNow(),
      driftStrikes: seatDriftStrikes,
      recoveries: seatRecoveries,
      tableCentered: check ? Math.abs(check.projected.x) <= 0.90 && Math.abs(check.projected.y) <= 0.88 : false
    },
    overlap: {
      statusCommunity: rectsOverlap(status, community),
      actionsCommunity: rectsOverlap(actions, community),
      drawerActions: drawer && $('#svr343RaiseDrawer')?.classList.contains('open') ? rectsOverlap(drawer, actions) : false
    },
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(result.base?.pass)
    && result.broker.installed
    && result.community.slots === 5
    && result.community.synced
    && !result.overlap.statusCommunity
    && !result.overlap.actionsCommunity
    && !result.overlap.drawerActions;
  window.SVR_PHASE344_QA_STATE = result;
  return result;
}

async function runFullHandQa(options = {}) {
  const maxHands = Math.max(1, Math.min(5, Number(options.maxHands || 3)));
  const timeoutMs = Math.max(15000, Math.min(90000, Number(options.timeoutMs || 60000)));
  const started = performance.now();
  const startHistory = handHistory.length;
  try { window.SVR_RESET_POKER_TABLE?.(1000); } catch {}
  let attempts = 0;
  let lastHandledSeq = -1;
  while (performance.now() - started < timeoutMs && attempts < maxHands) {
    if (state.waitingHuman && Number(state.actionSeq || 0) !== lastHandledSeq) {
      const legal = window.SVR_POKER_LEGAL_ACTIONS?.() || [];
      const action = legal.includes('check') ? 'check' : legal.includes('call') ? 'call' : legal.includes('allin') ? 'allin' : legal[0];
      if (action) {
        lastHandledSeq = Number(state.actionSeq || 0);
        window.SVR_POKER_ACTION?.(action);
      }
    }
    if (state.phase === 'showdown') {
      observeHand();
      const latest = handHistory[0];
      if (latest?.pass) return { build: BUILD, pass: true, attempts: attempts + 1, record: latest, audit: qa() };
      attempts += 1;
      if (attempts < maxHands) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.SVR_POKER_NEXT_HAND?.();
        lastHandledSeq = -1;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  return {
    build: BUILD,
    pass: false,
    attempts,
    timeout: performance.now() - started >= timeoutMs,
    newRecords: handHistory.length - startHistory,
    history: handHistory.slice(0, maxHands),
    audit: qa()
  };
}

function tick() {
  installActionBroker();
  observeHand();
  syncCommunityStrip();
  if (Number(state.actionSeq || 0) !== actionLock.sequence && !state.waitingHuman) releasePending();
}

function install() {
  if (!ACTIVE || installed) return;
  if (!$('#svr343Hud') || typeof window.SVR_POKER_ACTION !== 'function') {
    setTimeout(install, 180);
    return;
  }
  installed = true;
  installCss();
  ensureToast();
  document.body.classList.add('svr344-android');
  installActionBroker();
  beginRecord();
  window.addEventListener('svr:poker-state', () => setTimeout(tick, 0));
  window.addEventListener('resize', () => setTimeout(syncCommunityStrip, 80));
  setInterval(tick, 420);
  setInterval(seatWatchdog, 800);
  window.SVR_PHASE344_QA = qa;
  window.SVR_PHASE344_RUN_FULL_HAND_QA = runFullHandQa;
  window.SVR_PHASE344_RECENTER = () => window.SVR_ANDROID_CENTER_PLAYER?.();
  window.SVR_PHASE344_HISTORY = handHistory;
  window.SVR_PHASE344_STATE = {
    build: BUILD,
    active: true,
    installedAt: new Date().toISOString()
  };
  tick();
}

[150, 520, 1200, 2400].forEach((delay) => setTimeout(install, delay));
