import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-363-ANDROID-SECURE-SHUFFLE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const LAST_DECK_KEY = 'SVR_PHASE363_LAST_DECK_FINGERPRINT_V1';
const nativeRandom = Math.random.bind(Math);

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  randomSource: globalThis.crypto?.getRandomValues ? 'crypto.getRandomValues' : 'Math.random-fallback',
  secureRandomAvailable: Boolean(globalThis.crypto?.getRandomValues),
  joinWrapped: false,
  resetWrapped: false,
  secureJoins: 0,
  secureResets: 0,
  deckFingerprint: null,
  previousDeckFingerprint: null,
  exactDeckRepeats: 0,
  installedAt: null,
  checkedAt: null
};

let originalJoin = null;
let originalReset = null;

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

function currentFingerprint() {
  const dealt = players.flatMap((player) => player.hand || []).map(cardId);
  const remaining = (state.deck || []).map(cardId);
  return [...dealt, '|', ...remaining].join(',');
}

function recordDeck(reason = 'shuffle') {
  const fingerprint = currentFingerprint();
  if (!fingerprint || fingerprint === '|') return null;
  let previous = runtime.deckFingerprint || null;
  try { previous = sessionStorage.getItem(LAST_DECK_KEY) || previous; } catch {}
  runtime.previousDeckFingerprint = previous;
  runtime.deckFingerprint = fingerprint;
  if (previous === fingerprint) runtime.exactDeckRepeats += 1;
  try { sessionStorage.setItem(LAST_DECK_KEY, fingerprint); } catch {}
  runtime.checkedAt = new Date().toISOString();
  window.dispatchEvent(new CustomEvent('svr:phase363-secure-shuffle', {
    detail: {
      build: BUILD,
      reason,
      fingerprint,
      previous,
      repeated: previous === fingerprint,
      exactDeckRepeats: runtime.exactDeckRepeats
    }
  }));
  return fingerprint;
}

function installWrappers() {
  if (!originalJoin && typeof window.SVR_PHASE363_JOIN_TABLE === 'function') {
    originalJoin = window.SVR_PHASE363_JOIN_TABLE;
    window.SVR_PHASE363_JOIN_TABLE = (...args) => {
      runtime.secureJoins += 1;
      const result = withSecureRandom(() => originalJoin(...args));
      if (result !== false) queueMicrotask(() => recordDeck('join'));
      return result;
    };
    runtime.joinWrapped = true;
  }

  if (!originalReset && typeof window.SVR_RESET_POKER_TABLE === 'function') {
    originalReset = window.SVR_RESET_POKER_TABLE;
    window.SVR_RESET_POKER_TABLE = (...args) => {
      runtime.secureResets += 1;
      const result = withSecureRandom(() => originalReset(...args));
      if (result !== false) queueMicrotask(() => recordDeck('reset'));
      return result;
    };
    runtime.resetWrapped = true;
  }

  return runtime.joinWrapped && runtime.resetWrapped;
}

function qa() {
  const totalStacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committed = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  const settled = String(state.phase || '').toLowerCase() === 'showdown'
    && Boolean((state.winners || []).length || state.winner || Number(state.settledPot || 0) > 0);
  const effectiveTableChips = totalStacks + (settled ? 0 : committed);
  return {
    ...runtime,
    handNo: Number(state.handNo || 0),
    phase: String(state.phase || 'idle'),
    totalStacks,
    committed,
    effectiveTableChips,
    fundedPlayers: players.filter((player) => Number(player.stack || 0) > 0).length,
    pass: Boolean(
      ACTIVE
      && runtime.secureRandomAvailable
      && runtime.randomSource === 'crypto.getRandomValues'
      && runtime.joinWrapped
      && runtime.resetWrapped
      && runtime.exactDeckRepeats === 0
    ),
    checkedAt: new Date().toISOString()
  };
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  if (!installWrappers()) {
    setTimeout(install, 80);
    return;
  }
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  setInterval(installWrappers, 180);
  window.SVR_PHASE363_SECURE_SHUFFLE_STATE = runtime;
  window.SVR_PHASE363_SECURE_SHUFFLE_QA = qa;
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));
