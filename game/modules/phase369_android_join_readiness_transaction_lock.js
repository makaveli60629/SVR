export const BUILD = 'PHASE-369-ANDROID-JOIN-READINESS-TRANSACTION-LOCK';

const ACTIVE = (window.SVR_PLATFORM || document.body?.dataset?.platform || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname);

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  attempts: 0,
  successes: 0,
  tableWaits: 0,
  apiWaits: 0,
  buttonRebinds: 0,
  fallbackJoins: 0,
  lastDurationMs: 0,
  lastFailure: null,
  lastJoinAt: null,
  checkedAt: null
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const joined = () => Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE ?? window.SVR_PHASE363_STATE?.joined);
let originalJoin = null;
let observer = null;
let activePromise = null;

function status(message, error = false) {
  const node = document.getElementById('svr369Status');
  if (!node) return;
  node.textContent = message;
  node.style.color = error ? '#ff9fbd' : '#ffd98a';
}

function tableCandidate() {
  const direct = [
    window.SVR_TABLE_AUTHORITY,
    window.SVR_PHASE363_TABLE_STATE?.object,
    window.SVR_PHASE358_TABLE_STATE?.object
  ];
  for (const candidate of direct) if (candidate?.isObject3D) return candidate;
  const scene = window.__SVR_SCENE__;
  for (const name of [
    'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
    'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
    'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
    'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
    'PHASE326_ANDROID_TABLE_FALLBACK'
  ]) {
    const candidate = scene?.getObjectByName?.(name);
    if (candidate?.isObject3D) return candidate;
  }
  return null;
}

async function waitForTable(timeoutMs = 18000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const table = tableCandidate();
    if (table) {
      table.visible = true;
      window.SVR_TABLE_AUTHORITY = table;
      window.SVR_PHASE364_ALIGN_TABLE?.();
      return table;
    }
    state.tableWaits += 1;
    await wait(120);
  }
  return null;
}

async function waitForJoinApi(timeoutMs = 12000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (typeof window.SVR_PHASE363_JOIN_TABLE === 'function') return window.SVR_PHASE363_JOIN_TABLE;
    state.apiWaits += 1;
    await wait(100);
  }
  return null;
}

async function waitForJoined(timeoutMs = 6500) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (joined()) return true;
    await wait(80);
  }
  return false;
}

function joinButton() {
  return document.getElementById('svr369Join');
}

function setButtonBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  button.textContent = busy ? 'JOINING TABLE…' : 'JOIN TABLE';
}

async function runJoin() {
  if (!ACTIVE) return false;
  if (joined()) return true;
  if (activePromise) return activePromise;

  activePromise = (async () => {
    const started = performance.now();
    const button = joinButton();
    state.attempts += 1;
    state.lastFailure = null;
    setButtonBusy(button, true);
    status('Waiting for the real table and preparing your seat…');

    try {
      const [table, joinApi] = await Promise.all([waitForTable(), waitForJoinApi()]);
      if (!table) throw new Error('CANONICAL_TABLE_NOT_READY');
      if (!joinApi) throw new Error('JOIN_API_NOT_READY');

      window.SVR_PHASE340_GOVERN?.();
      let result = null;
      if (typeof originalJoin === 'function') result = await originalJoin();
      let joinedOk = await waitForJoined(1800);

      if (!joinedOk) {
        state.fallbackJoins += 1;
        result = await joinApi('phase369-readiness-transaction');
        if (result === false) throw new Error('JOIN_REJECTED');
        joinedOk = await waitForJoined();
      }
      if (!joinedOk) throw new Error('JOIN_STATE_TIMEOUT');

      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      window.SVR_PHASE365_SYNC?.();
      window.SVR_PHASE367_DEVICE_CALIBRATE?.();

      const poker = window.SVR_PHASE336_POKER_STATE || {};
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
      const hasCards = Number(audit?.players?.[0]?.hand?.length || 0) === 2;
      if (!hasCards || Number(poker.handNo || 0) < 1 || poker.phase === 'idle') {
        window.SVR_RESET_POKER_TABLE?.(15000);
      }

      window.setTimeout(() => {
        window.SVR_PHASE368_LOAD_CARD_DEALER?.();
        window.SVR_PHASE368_ALIGN_CARD_DEALER?.();
        window.SVR_PHASE368_PLAY_CARD_DEALER?.('android-readiness-join');
      }, 700);

      state.successes += 1;
      state.lastJoinAt = new Date().toISOString();
      status('Joined. Your hand is ready.');
      return true;
    } catch (error) {
      state.lastFailure = String(error?.message || error);
      status(`Join recovery: ${state.lastFailure}. Press JOIN TABLE to retry.`, true);
      return false;
    } finally {
      state.lastDurationMs = Math.round(performance.now() - started);
      state.checkedAt = new Date().toISOString();
      setButtonBusy(joinButton(), false);
      window.SVR_PHASE369_JOIN_READINESS_STATE = { ...state };
      activePromise = null;
    }
  })();

  return activePromise;
}

function bindButton() {
  const current = joinButton();
  if (!current || current.dataset.svr369ReadinessBound === BUILD) return current;
  const replacement = current.cloneNode(true);
  replacement.dataset.svr369ReadinessBound = BUILD;
  replacement.disabled = false;
  replacement.removeAttribute('aria-busy');
  replacement.textContent = 'JOIN TABLE';
  current.replaceWith(replacement);
  replacement.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    runJoin();
  }, true);
  state.buttonRebinds += 1;
  return replacement;
}

function qa() {
  const table = tableCandidate();
  const result = {
    ...state,
    joined: joined(),
    tableReady: Boolean(table),
    joinApiReady: typeof window.SVR_PHASE363_JOIN_TABLE === 'function',
    visibleEntryButtons: [...document.querySelectorAll('#svr369Join')]
      .filter((button) => Boolean(button.offsetParent)).length,
    boundEntryButtons: document.querySelectorAll(`#svr369Join[data-svr369-readiness-bound="${BUILD}"]`).length,
    pass: Boolean(
      ACTIVE
      && table
      && typeof window.SVR_PHASE363_JOIN_TABLE === 'function'
      && document.querySelectorAll(`#svr369Join[data-svr369-readiness-bound="${BUILD}"]`).length === 1
      && !state.lastFailure
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE369_JOIN_READINESS_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  originalJoin = typeof window.SVR_PHASE369_JOIN_TABLE === 'function'
    ? window.SVR_PHASE369_JOIN_TABLE.bind(window)
    : null;
  window.SVR_PHASE369_JOIN_TABLE = runJoin;
  window.SVR_PHASE369_JOIN_READINESS_QA = qa;
  bindButton();
  observer = new MutationObserver(bindButton);
  observer.observe(document.body, { childList: true, subtree: true });
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE369_JOIN_READINESS_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase369-join-readiness-ready', { detail: qa() }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

window.addEventListener('beforeunload', () => observer?.disconnect?.(), { once: true });
