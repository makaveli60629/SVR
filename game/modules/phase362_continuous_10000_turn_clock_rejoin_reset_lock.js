import * as THREE from 'three';
import {
  state,
  players,
  action,
  resetTable,
  startHand
} from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-362-CONTINUOUS-10000-TURN-CLOCK-REJOIN-RESET-LOCK';

const STARTING_STACK = 10000;
const TABLE_BANKROLL = STARTING_STACK * players.length;
const TURN_MS = 15000;
const ENGINE_SNAPSHOT_KEY = 'SVR_PHASE336_POKER_SNAPSHOT_V1';
const REJOIN_KEY = 'SVR_PHASE362_REJOIN_RESET_V1';
const WRAPPED = Symbol.for('SVR_PHASE360_WRAPPED');
const NEXT_GUARD = Symbol.for('SVR_PHASE360_NEXT_GUARD');
const PHASE362_WRAPPED = Symbol.for('SVR_PHASE362_WRAPPED');

const params = new URLSearchParams(location.search);
const platform = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit === 'android' || explicit === 'quest' || explicit === 'desktop') return explicit;
  if (/\/android\.html$/i.test(location.pathname)) return 'android';
  if (/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')) return 'quest';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
})();
const ACTIVE = platform !== 'camera3';

const runtime = {
  build: BUILD,
  platform,
  active: ACTIVE,
  startingStack: STARTING_STACK,
  tableBankroll: TABLE_BANKROLL,
  turnSeconds: TURN_MS / 1000,
  installedAt: null,
  tournamentNo: 0,
  tournamentResets: 0,
  championResets: 0,
  leaveResets: 0,
  rejoinResets: 0,
  timeoutFolds: 0,
  timeoutFoldsByPlayer: {},
  currentPlayerId: null,
  currentPlayerName: null,
  deadline: 0,
  remainingMs: 0,
  remainingSeconds: null,
  clockSignature: null,
  awayFromTable: false,
  champion: null,
  continuous: true,
  lastResetReason: null,
  lastTimeout: null,
  lastError: null,
  checkedAt: null
};

let installed = false;
let timer = 0;
let pollTimer = 0;
let htmlRoot = null;
let htmlName = null;
let htmlTime = null;
let questSprite = null;
let questCanvas = null;
let questTexture = null;
let lastShowdownHand = -1;
let seatLast = null;

const nativeRandom = Math.random.bind(Math);

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

function totals() {
  const stacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committed = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  return {
    stacks,
    committed,
    total: stacks + committed,
    funded: players.filter((player) => Number(player.stack || 0) > 0).length
  };
}

function fundedPlayers() {
  return players.filter((player) => Number(player.stack || 0) > 0);
}

function championPlayer() {
  const funded = fundedPlayers();
  return funded.length === 1 ? funded[0] : null;
}

function clearSnapshot() {
  try { localStorage.removeItem(ENGINE_SNAPSHOT_KEY); } catch {}
}

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, {
    detail: {
      build: BUILD,
      platform,
      ...detail
    }
  }));
}

function resetTournament(reason = 'manual-reset') {
  clearTurnClock();
  clearSnapshot();
  const champion = championPlayer();
  runtime.champion = champion ? {
    id: champion.id,
    name: champion.name,
    stack: Number(champion.stack || 0)
  } : runtime.champion;
  const accepted = withSecureRandom(() => resetTable(STARTING_STACK)) !== false;
  if (accepted) {
    runtime.tournamentNo += 1;
    runtime.tournamentResets += 1;
    if (reason === 'champion-reset') runtime.championResets += 1;
    if (reason === 'rejoin-reset') runtime.rejoinResets += 1;
    runtime.lastResetReason = reason;
    runtime.awayFromTable = false;
    runtime.continuous = true;
    window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(true);
    emit('svr:phase362-tournament-reset', {
      reason,
      tournamentNo: runtime.tournamentNo,
      handNo: Number(state.handNo || 0),
      startingStack: STARTING_STACK,
      tableBankroll: TABLE_BANKROLL,
      champion: runtime.champion
    });
  }
  return accepted;
}

function nextTournamentHand(reason = 'next-hand') {
  if (!['showdown', 'idle'].includes(String(state.phase || '').toLowerCase())) return false;
  if (championPlayer() || fundedPlayers().length < 2) return resetTournament('champion-reset');
  const accepted = withSecureRandom(() => startHand()) !== false;
  if (accepted) {
    runtime.continuous = true;
    emit('svr:phase362-next-hand', {
      reason,
      handNo: Number(state.handNo || 0),
      fundedPlayers: fundedPlayers().length
    });
  }
  return accepted;
}

function armLeave(reason = 'leave-table') {
  clearTurnClock();
  clearSnapshot();
  runtime.awayFromTable = true;
  runtime.continuous = false;
  runtime.leaveResets += 1;
  try { sessionStorage.setItem(REJOIN_KEY, reason); } catch {}
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(false);
  emit('svr:phase362-table-left', {
    reason,
    handNo: Number(state.handNo || 0)
  });
  updateClockPresentation();
  return true;
}

function joinTable(reason = 'join-table') {
  let marked = false;
  try { marked = Boolean(sessionStorage.getItem(REJOIN_KEY)); } catch {}
  if (marked || runtime.awayFromTable) {
    try { sessionStorage.removeItem(REJOIN_KEY); } catch {}
    resetTournament('rejoin-reset');
  } else if (totals().total !== TABLE_BANKROLL) {
    resetTournament('bankroll-correction');
  }
  runtime.awayFromTable = false;
  runtime.continuous = true;
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(true);
  emit('svr:phase362-table-joined', {
    reason,
    fresh: marked,
    handNo: Number(state.handNo || 0)
  });
  return true;
}

function markWrapper(wrapper, original = null) {
  wrapper[PHASE362_WRAPPED] = true;
  wrapper[WRAPPED] = true;
  wrapper[NEXT_GUARD] = true;
  if (original) wrapper.phase362Original = original;
  return wrapper;
}

function installGlobalRules() {
  if (!window.SVR_POKER_NEXT_HAND?.[PHASE362_WRAPPED]) {
    const prior = window.SVR_POKER_NEXT_HAND;
    window.SVR_POKER_NEXT_HAND = markWrapper(
      (...args) => nextTournamentHand(args[0]?.reason || 'global-next-hand'),
      prior
    );
  }
  if (!window.SVR_RESET_POKER_TABLE?.[PHASE362_WRAPPED]) {
    const prior = window.SVR_RESET_POKER_TABLE;
    window.SVR_RESET_POKER_TABLE = markWrapper(
      () => resetTournament('global-reset-table'),
      prior
    );
  }
  if (!window.SVR_PHASE360_SECURE_NEXT_HAND?.[PHASE362_WRAPPED]) {
    window.SVR_PHASE360_SECURE_NEXT_HAND = markWrapper(
      () => nextTournamentHand('phase360-secure-next'),
      window.SVR_PHASE360_SECURE_NEXT_HAND
    );
  }
  if (!window.SVR_PHASE360_FRESH_HAND?.[PHASE362_WRAPPED]) {
    window.SVR_PHASE360_FRESH_HAND = markWrapper(
      () => resetTournament('manual-fresh-table'),
      window.SVR_PHASE360_FRESH_HAND
    );
  }
  if (!window.SVR_PHASE360_LEAVE_TABLE?.[PHASE362_WRAPPED]) {
    window.SVR_PHASE360_LEAVE_TABLE = markWrapper(
      () => armLeave('phase360-leave'),
      window.SVR_PHASE360_LEAVE_TABLE
    );
  }
  if (!window.SVR_PHASE360_JOIN_TABLE?.[PHASE362_WRAPPED]) {
    window.SVR_PHASE360_JOIN_TABLE = markWrapper(
      () => joinTable('phase360-join'),
      window.SVR_PHASE360_JOIN_TABLE
    );
  }
}

function wrapSeatApi(name, mode) {
  const current = window[name];
  if (typeof current !== 'function' || current[PHASE362_WRAPPED]) return false;
  const wrapped = function phase362SeatWrapper(...args) {
    const result = current.apply(this, args);
    if (mode === 'leave') armLeave(name);
    else setTimeout(() => joinTable(name), 140);
    return result;
  };
  window[name] = markWrapper(wrapped, current);
  return true;
}

function installSeatRules() {
  wrapSeatApi('SVR_PHASE347_LEAVE', 'leave');
  wrapSeatApi('SVR_ANDROID_LOBBY_MODE', 'leave');
  wrapSeatApi('SVR_PHASE347_SIT', 'join');
  wrapSeatApi('SVR_ANDROID_SIT_TO_TABLE', 'join');
  wrapSeatApi('SVR_PHASE361_LEAVE_TABLE', 'leave');
  wrapSeatApi('SVR_PHASE361_PLAY_GAME', 'join');
}

function seatedState() {
  if (platform === 'quest') return Boolean(window.SVR_PHASE361_STATE?.seated);
  if (platform === 'android') return Boolean(window.SVR_PHASE347_STATE?.seated);
  return true;
}

function monitorSeatState() {
  const seated = seatedState();
  if (seatLast === null) {
    seatLast = seated;
    return;
  }
  if (seatLast && !seated) armLeave('seat-state-transition');
  if (!seatLast && seated) joinTable('seat-state-transition');
  seatLast = seated;
}

function activeTurnPlayer() {
  if (runtime.awayFromTable) return null;
  if (['showdown', 'idle'].includes(String(state.phase || '').toLowerCase())) return null;
  const player = players[Number(state.current)];
  if (!player || player.folded || player.allIn || Number(player.stack || 0) <= 0) return null;
  return player;
}

function turnSignature(player = activeTurnPlayer()) {
  if (!player) return null;
  return [
    Number(state.handNo || 0),
    String(state.phase || 'idle'),
    Number(player.id),
    Number(state.actionSeq || 0),
    Number(state.currentBet || 0),
    Number(player.bet || 0),
    Boolean(player.acted)
  ].join(':');
}

function clearTurnClock() {
  if (timer) clearTimeout(timer);
  timer = 0;
  runtime.deadline = 0;
  runtime.remainingMs = 0;
  runtime.remainingSeconds = null;
  runtime.currentPlayerId = null;
  runtime.currentPlayerName = null;
  runtime.clockSignature = null;
  updateClockPresentation();
}

function forceTimeoutFold(signature) {
  const player = activeTurnPlayer();
  if (!player || turnSignature(player) !== signature) return false;
  const wasHuman = player.human;
  let accepted = false;
  try {
    player.human = true;
    accepted = action('fold') !== false;
  } finally {
    player.human = wasHuman;
  }
  if (accepted) {
    player.lastAction = 'Timeout Fold';
    runtime.timeoutFolds += 1;
    runtime.timeoutFoldsByPlayer[player.name] = Number(runtime.timeoutFoldsByPlayer[player.name] || 0) + 1;
    runtime.lastTimeout = {
      playerId: player.id,
      playerName: player.name,
      handNo: Number(state.handNo || 0),
      phase: String(state.phase || 'idle'),
      at: new Date().toISOString()
    };
    emit('svr:phase362-timeout-fold', runtime.lastTimeout);
  }
  return accepted;
}

function armTurnClock(force = false) {
  const player = activeTurnPlayer();
  const signature = turnSignature(player);
  if (!player || !signature) {
    clearTurnClock();
    return false;
  }
  if (!force && runtime.clockSignature === signature && runtime.deadline > Date.now()) return true;
  if (timer) clearTimeout(timer);
  runtime.clockSignature = signature;
  runtime.currentPlayerId = player.id;
  runtime.currentPlayerName = player.name;
  runtime.deadline = Date.now() + TURN_MS;
  runtime.remainingMs = TURN_MS;
  runtime.remainingSeconds = TURN_MS / 1000;
  timer = window.setTimeout(() => {
    timer = 0;
    forceTimeoutFold(signature);
    armTurnClock(true);
  }, TURN_MS + 20);
  emit('svr:phase362-turn-clock', {
    playerId: player.id,
    playerName: player.name,
    handNo: Number(state.handNo || 0),
    phase: String(state.phase || 'idle'),
    deadline: runtime.deadline,
    seconds: TURN_MS / 1000
  });
  updateClockPresentation();
  return true;
}

function ensureHtmlClock() {
  if (htmlRoot?.isConnected) return htmlRoot;
  const style = document.createElement('style');
  style.id = 'svr362TurnClockStyle';
  style.textContent = `
    #svr362TurnClock{position:fixed;z-index:9362;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);min-width:190px;padding:9px 14px;border:1px solid rgba(127,252,255,.85);border-radius:15px;background:rgba(2,7,15,.9);box-shadow:0 10px 38px rgba(0,0,0,.6);color:#fff;text-align:center;font-family:system-ui,Arial,sans-serif;pointer-events:none}
    #svr362TurnClock[hidden]{display:none}
    #svr362TurnClock strong{display:block;color:#ffd98a;font-size:13px;letter-spacing:.08em}
    #svr362TurnClock span{font-weight:1000;font-size:24px;color:#7ffcff}
    #svr362TurnClock.svr362-urgent{border-color:#ff5b7f;box-shadow:0 0 28px rgba(255,91,127,.45)}
    #svr362TurnClock.svr362-urgent span{color:#ff7d9b}
  `;
  document.head.appendChild(style);
  htmlRoot = document.createElement('aside');
  htmlRoot.id = 'svr362TurnClock';
  htmlRoot.hidden = true;
  htmlRoot.innerHTML = '<strong id="svr362TurnName">TURN</strong><span id="svr362TurnTime">15</span>';
  document.body.appendChild(htmlRoot);
  htmlName = htmlRoot.querySelector('#svr362TurnName');
  htmlTime = htmlRoot.querySelector('#svr362TurnTime');
  return htmlRoot;
}

function tableObject() {
  return window.SVR_TABLE_AUTHORITY
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT')
    || null;
}

function ensureQuestClock() {
  if (platform !== 'quest' || !window.__SVR_SCENE__) return null;
  if (questSprite?.parent) return questSprite;
  questCanvas = document.createElement('canvas');
  questCanvas.width = 640;
  questCanvas.height = 220;
  questTexture = new THREE.CanvasTexture(questCanvas);
  questTexture.colorSpace = THREE.SRGBColorSpace;
  questSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: questTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  }));
  questSprite.name = 'PHASE362_QUEST_TURN_CLOCK';
  questSprite.scale.set(1.15, 0.4, 1);
  questSprite.renderOrder = 9362;
  window.__SVR_SCENE__.add(questSprite);
  return questSprite;
}

function paintQuestClock() {
  const sprite = ensureQuestClock();
  if (!sprite || !questCanvas || !questTexture) return;
  const context = questCanvas.getContext('2d');
  const seconds = runtime.remainingSeconds;
  const visible = Number.isFinite(seconds) && runtime.currentPlayerName && !runtime.awayFromTable;
  sprite.visible = Boolean(visible);
  if (!visible) return;
  context.clearRect(0, 0, questCanvas.width, questCanvas.height);
  context.fillStyle = seconds <= 5 ? 'rgba(38,3,12,.94)' : 'rgba(2,8,18,.94)';
  context.fillRect(10, 10, 620, 200);
  context.strokeStyle = seconds <= 5 ? '#ff5b7f' : '#7ffcff';
  context.lineWidth = 8;
  context.strokeRect(14, 14, 612, 192);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffd98a';
  context.font = '900 42px Arial, sans-serif';
  context.fillText(`${runtime.currentPlayerName} TURN`, 320, 70, 590);
  context.fillStyle = seconds <= 5 ? '#ff7d9b' : '#ffffff';
  context.font = '1000 82px Arial, sans-serif';
  context.fillText(`${seconds}`, 320, 145, 590);
  questTexture.needsUpdate = true;
  const table = tableObject();
  if (table) {
    try {
      table.updateWorldMatrix?.(true, true);
      const box = new THREE.Box3().setFromObject(table, true);
      const center = new THREE.Vector3();
      box.getCenter(center);
      sprite.position.set(center.x, box.max.y + 1.35, center.z - 0.02);
    } catch {}
  }
}

function updateClockPresentation() {
  const root = ensureHtmlClock();
  const seconds = runtime.remainingSeconds;
  const visible = Number.isFinite(seconds) && runtime.currentPlayerName && !runtime.awayFromTable;
  root.hidden = !visible;
  if (visible) {
    htmlName.textContent = `${runtime.currentPlayerName} TURN`;
    htmlTime.textContent = String(seconds);
    root.classList.toggle('svr362-urgent', seconds <= 5);
  }
  paintQuestClock();
}

function tickClock() {
  const player = activeTurnPlayer();
  const signature = turnSignature(player);
  if (!player || !signature) {
    clearTurnClock();
    return;
  }
  if (signature !== runtime.clockSignature || !runtime.deadline) {
    armTurnClock(true);
    return;
  }
  runtime.remainingMs = Math.max(0, runtime.deadline - Date.now());
  runtime.remainingSeconds = Math.max(0, Math.ceil(runtime.remainingMs / 1000));
  updateClockPresentation();
  if (runtime.remainingMs <= 0) {
    forceTimeoutFold(signature);
    armTurnClock(true);
  }
}

function monitorChampion() {
  const showdown = String(state.phase || '').toLowerCase() === 'showdown';
  if (!showdown) return;
  const handNo = Number(state.handNo || 0);
  if (lastShowdownHand === handNo) return;
  lastShowdownHand = handNo;
  const champion = championPlayer();
  if (champion) {
    runtime.champion = {
      id: champion.id,
      name: champion.name,
      stack: Number(champion.stack || 0)
    };
    emit('svr:phase362-champion', {
      ...runtime.champion,
      handNo,
      resetOnNextHand: true
    });
  }
}

function ensureInitialBankroll() {
  const snapshot = totals();
  const allTenThousand = players.every((player) => Number(player.stack || 0) === STARTING_STACK)
    && snapshot.committed === 0;
  if (snapshot.total !== TABLE_BANKROLL || (Number(state.handNo || 0) <= 1 && !allTenThousand)) {
    return resetTournament('phase362-initial-bankroll');
  }
  return true;
}

function qa() {
  const snapshot = totals();
  const player = activeTurnPlayer();
  const result = {
    build: BUILD,
    platform,
    active: ACTIVE,
    startingStack: STARTING_STACK,
    tableBankroll: TABLE_BANKROLL,
    turnSeconds: TURN_MS / 1000,
    handNo: Number(state.handNo || 0),
    phase: String(state.phase || 'idle'),
    currentPlayer: player?.name || null,
    deadline: runtime.deadline || null,
    remainingSeconds: runtime.remainingSeconds,
    stacks: snapshot.stacks,
    committed: snapshot.committed,
    totalTableChips: snapshot.total,
    fundedPlayers: snapshot.funded,
    timeoutFolds: runtime.timeoutFolds,
    champion: runtime.champion,
    awayFromTable: runtime.awayFromTable,
    continuous: runtime.continuous,
    nextHandAuthority: Boolean(window.SVR_POKER_NEXT_HAND?.[PHASE362_WRAPPED]),
    resetAuthority: Boolean(window.SVR_RESET_POKER_TABLE?.[PHASE362_WRAPPED]),
    leaveAuthority: Boolean(window.SVR_PHASE360_LEAVE_TABLE?.[PHASE362_WRAPPED]),
    joinAuthority: Boolean(window.SVR_PHASE360_JOIN_TABLE?.[PHASE362_WRAPPED]),
    questMovement: platform !== 'quest' || {
      lobbyMode: window.SVR_PHASE361_STATE?.mode || null,
      seated: Boolean(window.SVR_PHASE361_STATE?.seated),
      playGameApi: typeof window.SVR_PHASE361_PLAY_GAME === 'function',
      leaveTableApi: typeof window.SVR_PHASE361_LEAVE_TABLE === 'function',
      movementBeforeSeat: true,
      movementLockedWhileSeated: true
    },
    checkedAt: new Date().toISOString()
  };
  result.pass = ACTIVE
    && result.startingStack === 10000
    && result.tableBankroll === 60000
    && result.turnSeconds === 15
    && result.totalTableChips === TABLE_BANKROLL
    && result.nextHandAuthority
    && result.resetAuthority
    && result.leaveAuthority
    && result.joinAuthority
    && (platform !== 'quest'
      || (result.questMovement.playGameApi && result.questMovement.leaveTableApi));
  runtime.checkedAt = result.checkedAt;
  window.SVR_PHASE362_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || installed) return;
  if (typeof window.SVR_POKER_ACTION !== 'function' || !window.SVR_PHASE336_POKER_STATE) {
    setTimeout(install, 80);
    return;
  }
  installed = true;
  runtime.installedAt = new Date().toISOString();
  installGlobalRules();
  installSeatRules();
  ensureHtmlClock();
  ensureInitialBankroll();
  armTurnClock(true);

  window.SVR_PHASE362_STATE = runtime;
  window.SVR_PHASE362_QA = qa;
  window.SVR_PHASE362_RESET_TOURNAMENT = () => resetTournament('manual-reset');
  window.SVR_PHASE362_NEXT_HAND = () => nextTournamentHand('manual-next');
  window.SVR_PHASE362_LEAVE_TABLE = () => armLeave('manual-leave');
  window.SVR_PHASE362_JOIN_TABLE = () => joinTable('manual-join');
  window.SVR_PHASE362_TIMEOUT_CURRENT = () => forceTimeoutFold(turnSignature());
  window.SVR_PHASE362_CONSTANTS = Object.freeze({
    STARTING_STACK,
    TABLE_BANKROLL,
    TURN_MS
  });

  window.addEventListener('svr:turn-changed', () => armTurnClock(true));
  window.addEventListener('svr:poker-state', () => {
    armTurnClock();
    monitorChampion();
  });
  window.addEventListener('svr:phase361-table-left', () => armLeave('phase361-event'));
  window.addEventListener('svr:phase361-table-joined', () => joinTable('phase361-event'));

  pollTimer = window.setInterval(() => {
    installGlobalRules();
    installSeatRules();
    monitorSeatState();
    tickClock();
    monitorChampion();
    if (totals().total !== TABLE_BANKROLL && ['showdown', 'idle'].includes(String(state.phase || '').toLowerCase())) {
      resetTournament('bankroll-conservation-recovery');
    }
  }, 250);

  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
    clearTurnClock();
  }, { once: true });

  emit('svr:phase362-ready', {
    startingStack: STARTING_STACK,
    tableBankroll: TABLE_BANKROLL,
    turnSeconds: TURN_MS / 1000
  });
}

install();
