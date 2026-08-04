import { state, players, resetTable, startHand } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK';

const params = new URLSearchParams(location.search);
const platform = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit === 'android' || explicit === 'quest') return explicit;
  if (/\/android\.html$/i.test(location.pathname)) return 'android';
  if (/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')) return 'quest';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
})();
const ACTIVE = platform === 'android' || platform === 'quest';
const ENGINE_SNAPSHOT_KEY = 'SVR_PHASE336_POKER_SNAPSHOT_V1';
const SESSION_KEY = 'SVR_PHASE360_TABLE_SESSION_V1';
const FRESH_ON_JOIN_KEY = 'SVR_PHASE360_FRESH_ON_JOIN_V1';
const LAST_DECK_KEY = 'SVR_PHASE360_LAST_DECK_FINGERPRINT_V1';
const WRAPPED = Symbol.for('SVR_PHASE360_WRAPPED');

const nativeRandom = Math.random.bind(Math);
let originalNextHand = null;
let originalResetTable = null;
let sessionWasNew = false;
let installed = false;
let wrapperTimer = 0;
let lastSeatState = null;

const runtime = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installedAt: null,
  randomSource: globalThis.crypto?.getRandomValues ? 'crypto.getRandomValues' : 'Math.random-fallback',
  sessionId: null,
  sessionWasNew: false,
  freshStarts: 0,
  secureNextHands: 0,
  leaveResetsArmed: 0,
  joinResets: 0,
  practiceTableResets: 0,
  exactDeckRepeats: 0,
  previousDeckFingerprint: null,
  deckFingerprint: null,
  holeSignature: null,
  previousHoleSignature: null,
  repeatedHolePair: false,
  awayFromTable: false,
  androidLeaveWrapped: false,
  androidSitWrapped: false,
  physicalMetaCardGrabPending: true,
  checkedAt: null
};

function secureRandom() {
  try {
    if (globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }
  } catch {}
  return nativeRandom();
}

function withSecureRandom(callback) {
  const previous = Math.random;
  Math.random = secureRandom;
  try {
    return callback();
  } finally {
    Math.random = previous;
  }
}

function cardId(card) {
  return String(card?.id || `${card?.r || card?.rank || '?'}${card?.s || card?.suit || '?'}`);
}

function deckFingerprint() {
  const dealt = players.flatMap((player) => player.hand || []).map(cardId);
  const remaining = (state.deck || []).map(cardId);
  return [...dealt, '|', ...remaining].join(',');
}

function holeSignature() {
  const human = players.find((player) => player.human) || players[0];
  return (human?.hand || []).map(cardId).sort().join('|');
}

function recordFreshDeck() {
  const fingerprint = deckFingerprint();
  const previous = sessionStorage.getItem(LAST_DECK_KEY) || null;
  runtime.previousDeckFingerprint = previous;
  runtime.deckFingerprint = fingerprint || null;
  runtime.exactDeckRepeats = fingerprint && previous === fingerprint
    ? runtime.exactDeckRepeats + 1
    : runtime.exactDeckRepeats;
  if (fingerprint) sessionStorage.setItem(LAST_DECK_KEY, fingerprint);

  const currentHole = holeSignature();
  runtime.previousHoleSignature = runtime.holeSignature;
  runtime.holeSignature = currentHole || null;
  runtime.repeatedHolePair = Boolean(currentHole && runtime.previousHoleSignature === currentHole);
  return fingerprint;
}

function fundedPlayers() {
  return players.filter((player) => Number(player.stack || 0) > 0);
}

function requiresPracticeReset() {
  const human = players.find((player) => player.human) || players[0];
  return fundedPlayers().length < 2 || Number(human?.stack || 0) <= 0;
}

function secureReset(reason = 'manual-reset', stack = 1000) {
  const result = withSecureRandom(() => resetTable(stack));
  runtime.freshStarts += 1;
  if (reason === 'join-after-leave') runtime.joinResets += 1;
  if (reason === 'practice-table-reset') runtime.practiceTableResets += 1;
  runtime.awayFromTable = false;
  recordFreshDeck();
  window.dispatchEvent(new CustomEvent('svr:poker-fresh-hand', {
    detail: {
      build: BUILD,
      platform,
      reason,
      handNo: Number(state.handNo || 0),
      deckFingerprint: runtime.deckFingerprint,
      randomSource: runtime.randomSource
    }
  }));
  return result;
}

function secureNext(reason = 'next-hand') {
  if (requiresPracticeReset()) return secureReset('practice-table-reset', 1000);
  const runner = originalNextHand || startHand;
  const result = withSecureRandom(() => runner()) !== false;
  if (result) {
    runtime.secureNextHands += 1;
    recordFreshDeck();
  }
  window.SVR_PHASE360_LAST_NEXT = {
    build: BUILD,
    reason,
    accepted: result,
    handNo: Number(state.handNo || 0),
    deckFingerprint: runtime.deckFingerprint,
    at: new Date().toISOString()
  };
  return result;
}

function armFreshJoin(reason = 'leave') {
  try {
    sessionStorage.setItem(FRESH_ON_JOIN_KEY, reason);
    localStorage.removeItem(ENGINE_SNAPSHOT_KEY);
  } catch {}
  runtime.leaveResetsArmed += 1;
  runtime.awayFromTable = true;
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(false);
  window.dispatchEvent(new CustomEvent('svr:poker-table-left', {
    detail: { build: BUILD, platform, reason, handNo: Number(state.handNo || 0) }
  }));
  return true;
}

function joinFreshTable(reason = 'join') {
  let freshReason = null;
  try { freshReason = sessionStorage.getItem(FRESH_ON_JOIN_KEY); } catch {}
  const needsFresh = Boolean(freshReason) || runtime.awayFromTable;
  if (needsFresh) {
    try { sessionStorage.removeItem(FRESH_ON_JOIN_KEY); } catch {}
    secureReset('join-after-leave', 1000);
  }
  runtime.awayFromTable = false;
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(true);
  window.dispatchEvent(new CustomEvent('svr:poker-table-joined', {
    detail: { build: BUILD, platform, reason, fresh: needsFresh, handNo: Number(state.handNo || 0) }
  }));
  return true;
}

function wrapGlobal(name, mode) {
  const current = window[name];
  if (typeof current !== 'function' || current[WRAPPED]) return false;
  const wrapped = function phase360WrappedTableApi(...args) {
    if (mode === 'leave') {
      const result = current.apply(this, args);
      armFreshJoin(name);
      return result;
    }
    const result = current.apply(this, args);
    setTimeout(() => joinFreshTable(name), 80);
    return result;
  };
  wrapped[WRAPPED] = true;
  wrapped.phase360Original = current;
  window[name] = wrapped;
  if (mode === 'leave') runtime.androidLeaveWrapped = true;
  else runtime.androidSitWrapped = true;
  return true;
}

function installSeatWrappers() {
  if (platform !== 'android') return;
  wrapGlobal('SVR_PHASE347_LEAVE', 'leave');
  wrapGlobal('SVR_ANDROID_LOBBY_MODE', 'leave');
  wrapGlobal('SVR_PHASE347_SIT', 'join');
  wrapGlobal('SVR_ANDROID_SIT_TO_TABLE', 'join');
}

function monitorSeatState() {
  const seated = platform === 'android'
    ? Boolean(window.SVR_PHASE347_STATE?.seated)
    : Boolean(window.SVR_PHASE348_STATE?.seated);
  if (lastSeatState === null) {
    lastSeatState = seated;
    return;
  }
  if (lastSeatState && !seated) armFreshJoin('seat-state-transition');
  if (!lastSeatState && seated) joinFreshTable('seat-state-transition');
  lastSeatState = seated;
}

function installPokerWrappers() {
  if (!originalNextHand && typeof window.SVR_POKER_NEXT_HAND === 'function') {
    originalNextHand = window.SVR_POKER_NEXT_HAND;
    const wrapped = () => secureNext('global-next-hand');
    wrapped[WRAPPED] = true;
    wrapped.phase360Original = originalNextHand;
    window.SVR_POKER_NEXT_HAND = wrapped;
  }
  if (!originalResetTable && typeof window.SVR_RESET_POKER_TABLE === 'function') {
    originalResetTable = window.SVR_RESET_POKER_TABLE;
    const wrapped = (stack = 1000) => secureReset('global-reset-table', stack);
    wrapped[WRAPPED] = true;
    wrapped.phase360Original = originalResetTable;
    window.SVR_RESET_POKER_TABLE = wrapped;
  }
}

function metaCardGrabAudit() {
  const loaded = [
    ...(window.SVR_PHASE340_PLATFORM_STATE?.loaded || []),
    ...(window.SVR_PHASE340_PLATFORM_STATE?.deferredLoaded || [])
  ];
  const phase334Loaded = loaded.some((path) => String(path).endsWith('phase334_table_layout_gesture_poker_lock.js'))
    || typeof window.SVR_PHASE334_TABLE_QA === 'function';
  const renderer = window.__SVR_RENDERER__;
  return {
    phase334Loaded,
    handsPrimary: platform === 'quest' && typeof renderer?.xr?.getHand === 'function',
    controllerFallback: platform === 'quest' && typeof renderer?.xr?.getController === 'function',
    pinchPickupContract: phase334Loaded,
    triggerPickupContract: phase334Loaded,
    throwFoldContract: phase334Loaded,
    physicalHeadsetAcceptancePending: true
  };
}

function qa() {
  const grab = metaCardGrabAudit();
  const result = {
    build: BUILD,
    platform,
    active: ACTIVE,
    randomSource: runtime.randomSource,
    secureRandomAvailable: runtime.randomSource === 'crypto.getRandomValues',
    sessionId: runtime.sessionId,
    sessionWasNew: runtime.sessionWasNew,
    handNo: Number(state.handNo || 0),
    phase: String(state.phase || 'idle'),
    fundedPlayers: fundedPlayers().length,
    totalStacks: players.reduce((sum, player) => sum + Number(player.stack || 0), 0),
    deckFingerprint: runtime.deckFingerprint,
    exactDeckRepeats: runtime.exactDeckRepeats,
    repeatedHolePair: runtime.repeatedHolePair,
    continuous: window.SVR_PHASE359_STATE?.continuous ?? null,
    nextHandWrapped: Boolean(window.SVR_POKER_NEXT_HAND?.[WRAPPED]),
    resetWrapped: Boolean(window.SVR_RESET_POKER_TABLE?.[WRAPPED]),
    leaveResetArmed: runtime.awayFromTable,
    androidLeaveWrapped: runtime.androidLeaveWrapped,
    androidSitWrapped: runtime.androidSitWrapped,
    metaCardGrab: grab,
    counters: {
      freshStarts: runtime.freshStarts,
      secureNextHands: runtime.secureNextHands,
      leaveResetsArmed: runtime.leaveResetsArmed,
      joinResets: runtime.joinResets,
      practiceTableResets: runtime.practiceTableResets
    },
    checkedAt: new Date().toISOString()
  };
  result.pass = ACTIVE
    && result.nextHandWrapped
    && result.resetWrapped
    && result.fundedPlayers >= 2
    && result.totalStacks === 6000
    && result.exactDeckRepeats === 0
    && (platform !== 'android' || (result.androidLeaveWrapped && result.androidSitWrapped))
    && (platform !== 'quest' || grab.phase334Loaded);
  runtime.checkedAt = result.checkedAt;
  window.SVR_PHASE360_QA_STATE = result;
  return result;
}

function establishSession() {
  let existing = null;
  try { existing = sessionStorage.getItem(SESSION_KEY); } catch {}
  sessionWasNew = !existing;
  runtime.sessionWasNew = sessionWasNew;
  runtime.sessionId = existing || `${Date.now().toString(36)}-${Math.floor(secureRandom() * 0xffffffff).toString(36)}`;
  try { sessionStorage.setItem(SESSION_KEY, runtime.sessionId); } catch {}
}

function install() {
  if (!ACTIVE || installed) return;
  installed = true;
  runtime.installedAt = new Date().toISOString();
  establishSession();
  installPokerWrappers();
  installSeatWrappers();

  window.SVR_PHASE360_STATE = runtime;
  window.SVR_PHASE360_QA = qa;
  window.SVR_PHASE360_META_CARD_GRAB_QA = metaCardGrabAudit;
  window.SVR_PHASE360_FRESH_HAND = () => secureReset('manual-fresh-hand', 1000);
  window.SVR_PHASE360_LEAVE_TABLE = () => armFreshJoin('manual-leave');
  window.SVR_PHASE360_JOIN_TABLE = () => joinFreshTable('manual-join');
  window.SVR_PHASE360_SECURE_NEXT_HAND = () => secureNext('manual-secure-next');

  if (sessionWasNew) {
    try { localStorage.removeItem(ENGINE_SNAPSHOT_KEY); } catch {}
    setTimeout(() => secureReset('new-browser-session', 1000), 180);
  } else {
    recordFreshDeck();
  }

  wrapperTimer = window.setInterval(() => {
    installPokerWrappers();
    installSeatWrappers();
    monitorSeatState();
  }, 350);

  window.addEventListener('beforeunload', () => {
    if (wrapperTimer) clearInterval(wrapperTimer);
  }, { once: true });

  window.dispatchEvent(new CustomEvent('svr:phase360-ready', {
    detail: { build: BUILD, platform, randomSource: runtime.randomSource }
  }));
}

install();
