import * as THREE from 'three';
import {
  state,
  players,
  resetTable,
  action,
  legal
} from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const STARTING_STACK = 15000;
const TABLE_BANKROLL = STARTING_STACK * players.length;
const SAVE_KEY = 'SVR_PHASE336_POKER_SNAPSHOT_V1';
const GameState = Object.freeze({ LOBBY: 'LOBBY', SEATED: 'SEATED' });

const runtime = {
  build: BUILD,
  active: ACTIVE,
  gameState: GameState.LOBBY,
  joined: false,
  startingStack: STARTING_STACK,
  tableBankroll: TABLE_BANKROLL,
  joinCount: 0,
  leaveCount: 0,
  bankroll: STARTING_STACK,
  gyroAvailable: 'DeviceOrientationEvent' in window,
  gyroPermission: 'not-requested',
  gyroEvents: 0,
  touchDragEvents: 0,
  hapticEvents: 0,
  audioEvents: {},
  audioReady: false,
  audioFallback: 'web-audio-synth',
  fov: null,
  aspect: null,
  portrait: null,
  seatParallax: 0,
  lastPokerEvent: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let installed = false;
let originalSit = null;
let originalLeave = null;
let originalCenter = null;
let originalAction = null;
let originalNextHand = null;
let observer = null;
let interval = 0;
let raf = 0;
let previousFrame = performance.now();
let isDragging = false;
let dragPointerId = null;
let previousTouch = { x: 0, y: 0 };
let touchYaw = 0;
let touchPitch = 0;
let gyroBaseline = null;
let gyroTarget = { yaw: 0, pitch: 0, slide: 0 };
let gyroSmooth = { yaw: 0, pitch: 0, slide: 0 };
let lastHandNo = 0;
let lastCommunityCount = 0;
let lastWaitingHuman = false;
let lastLogEntry = '';
let lastWinnerSignature = '';
let suppressPokerEventsUntil = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const camera = () => window.__SVR_CAMERA__ || null;
const renderer = () => window.__SVR_RENDERER__ || null;
const scene = () => window.__SVR_SCENE__ || null;
const playerRig = () => window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
const human = () => players.find((player) => player?.human) || players[0] || null;
const clamp = THREE.MathUtils.clamp;

function totalChips() {
  return players.reduce((sum, player) => sum + Number(player.stack || 0) + Number(player.contributed || 0), 0);
}

function publish(reason = 'sync') {
  runtime.bankroll = Number(human()?.stack || 0);
  runtime.checkedAt = new Date().toISOString();
  window.SVR_PHASE363_STATE = { ...runtime };
  window.dispatchEvent(new CustomEvent('svr:phase363-state', {
    detail: {
      ...runtime,
      reason,
      phase: state.phase,
      handNo: Number(state.handNo || 0),
      pot: Number(state.pot || 0),
      totalChips: totalChips()
    }
  }));
}

function dispatchPokerState(reason = 'phase363') {
  window.SVR_PHASE85_POKER_STATE = state;
  window.SVR_PHASE336_POKER_STATE = state;
  window.dispatchEvent(new CustomEvent('svr:poker-state', {
    detail: {
      build: BUILD,
      reason,
      handNo: Number(state.handNo || 0),
      phase: String(state.phase || 'idle'),
      current: players[state.current]?.name || null,
      waitingHuman: Boolean(state.waitingHuman),
      currentBet: Number(state.currentBet || 0),
      pot: Number(state.pot || 0),
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        human: player.human,
        stack: Number(player.stack || 0),
        bet: Number(player.bet || 0),
        contributed: Number(player.contributed || 0),
        hand: player.human && runtime.joined ? player.hand.map((card) => card.id) : [],
        lastAction: player.lastAction
      }))
    }
  }));
}

function clearSavedHand() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

function prepareLobby(reason = 'lobby') {
  clearSavedHand();
  suppressPokerEventsUntil = performance.now() + 450;
  for (const player of players) {
    player.stack = STARTING_STACK;
    player.folded = true;
    player.allIn = false;
    player.bet = 0;
    player.contributed = 0;
    player.acted = false;
    player.raiseClosed = false;
    player.hand = [];
    player.lastAction = 'Waiting to join';
  }
  Object.assign(state, {
    handNo: 0,
    dealer: -1,
    phase: 'idle',
    deck: [],
    burn: [],
    community: [],
    pot: 0,
    pots: [],
    currentBet: 0,
    minRaise: Number(state.bigBlind || 20),
    lastAggressor: null,
    current: 0,
    waitingHuman: false,
    winner: null,
    winners: [],
    actionLog: [],
    settledPot: 0,
    lastAction: 'Join the table to receive cards',
    restored: false
  });
  lastHandNo = 0;
  lastCommunityCount = 0;
  lastWaitingHuman = false;
  lastLogEntry = '';
  lastWinnerSignature = '';
  dispatchPokerState(reason);
}

const PokerAudio = (() => {
  let context = null;
  let master = null;
  const count = (name) => {
    runtime.audioEvents[name] = Number(runtime.audioEvents[name] || 0) + 1;
  };

  function init() {
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        context = new AudioContext({ latencyHint: 'interactive' });
        master = context.createGain();
        master.gain.value = 0.42;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(() => undefined);
      runtime.audioReady = true;
      return true;
    } catch (error) {
      runtime.lastError = String(error?.message || error);
      return false;
    }
  }

  function envelope(gain, now, peak, duration, attack = 0.006) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  function noise(duration, center, q, peak) {
    if (!init()) return;
    const now = context.currentTime;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(center, now);
    filter.Q.setValueAtTime(q, now);
    envelope(gain, now, peak, duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  function tone(frequency, duration, peak, options = {}) {
    if (!init()) return;
    const now = context.currentTime + Number(options.delay || 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, now + duration);
    envelope(gain, now, peak, duration, Number(options.attack || 0.006));
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function play(name) {
    count(name);
    if (!init()) return false;
    switch (name) {
      case 'card_shuffle':
        noise(0.24, 1500, 1.8, 0.20);
        window.setTimeout(() => noise(0.18, 1850, 2.2, 0.16), 95);
        break;
      case 'card_deal':
        noise(0.075, 1250, 3.1, 0.28);
        break;
      case 'chip_bet':
        tone(1780, 0.07, 0.18, { type: 'sine' });
        tone(2380, 0.055, 0.15, { type: 'sine', delay: 0.018 });
        break;
      case 'chip_collect':
        [2100, 1780, 2450].forEach((frequency, index) => tone(frequency, 0.08, 0.13, { delay: index * 0.035 }));
        break;
      case 'fold_hand':
        noise(0.12, 430, 0.8, 0.12);
        tone(240, 0.14, 0.12, { endFrequency: 82 });
        break;
      case 'sit_down':
        tone(145, 0.22, 0.25, { endFrequency: 42 });
        break;
      case 'leave_table':
        tone(150, 0.12, 0.12, { endFrequency: 90 });
        break;
      case 'turn_cue':
        tone(740, 0.10, 0.15, { type: 'triangle' });
        tone(990, 0.12, 0.13, { type: 'triangle', delay: 0.09 });
        break;
      case 'win_pot':
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, 0.34, 0.18, { type: 'triangle', delay: index * 0.075 }));
        break;
      default:
        return false;
    }
    return true;
  }

  return { init, play, get context() { return context; } };
})();

function haptic(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
      runtime.hapticEvents += 1;
    } catch {}
  }
}

function installStyle() {
  if ($('#svr363AndroidCoreStyle')) return;
  const style = document.createElement('style');
  style.id = 'svr363AndroidCoreStyle';
  style.textContent = `
    body.svr363-android #svr347Status{background:rgba(15,18,26,.76)!important;border-color:rgba(190,217,226,.46)!important;box-shadow:0 8px 26px rgba(0,0,0,.28)!important}
    body.svr363-android #svr347Community,body.svr363-android #svr347Hole{background:rgba(20,18,24,.68)!important;border-color:rgba(226,202,153,.54)!important;backdrop-filter:blur(8px)!important}
    body.svr363-android #svr347Actions button{background:linear-gradient(180deg,rgba(36,38,47,.94),rgba(16,18,25,.94))!important;border-color:rgba(226,202,153,.54)!important;box-shadow:0 6px 18px rgba(0,0,0,.28)!important}
    body.svr363-android #svr347Actions button[data-ui="seat"]{background:linear-gradient(180deg,rgba(42,82,83,.94),rgba(24,48,53,.94))!important;border-color:rgba(159,222,221,.70)!important}
    body.svr363-android .svr347-stick{border-color:rgba(167,215,217,.62)!important;background:radial-gradient(circle,rgba(50,82,87,.28),rgba(13,17,24,.36))!important;box-shadow:0 0 16px rgba(127,210,212,.12),inset 0 0 20px rgba(127,210,212,.06)!important}
    body.svr363-android .svr347-stick b{background:rgba(173,220,221,.78)!important;box-shadow:0 0 13px rgba(173,220,221,.30)!important}
    #svr363Bankroll{position:fixed;z-index:2147483550;top:max(58px,calc(env(safe-area-inset-top) + 50px));right:12px;display:flex;flex-direction:column;align-items:flex-end;gap:2px;padding:8px 11px;border:1px solid rgba(226,202,153,.65);border-radius:13px;background:rgba(18,17,23,.78);box-shadow:0 8px 24px rgba(0,0,0,.28);color:#f7f1df;pointer-events:none;font-family:system-ui,Arial,sans-serif}
    #svr363Bankroll strong{font-size:13px;letter-spacing:.06em;color:#f0d49a}#svr363Bankroll span{font-size:10px;font-weight:800;color:#d7e4e4}
    body.svr363-lobby #svr347Community,body.svr363-lobby #svr347Hole,body.svr363-lobby #svr347Raise,body.svr363-lobby #svr347Toast,body.svr363-lobby #svr362TurnClock{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    body.svr363-lobby #svr347Actions{grid-template-columns:1fr!important;width:min(54vw,190px)!important;bottom:132px!important}
    body.svr363-lobby #svr347Actions button:not([data-ui="seat"]){display:none!important}
    body.svr363-seated #svr347Actions button{display:block}
    body.svr363-lobby [data-seat-control],body.svr363-lobby .legacy-seat-control{display:none!important}
    @media(max-width:430px){#svr363Bankroll{top:max(54px,calc(env(safe-area-inset-top) + 46px));right:8px;padding:7px 9px}#svr363Bankroll strong{font-size:12px}}
  `;
  document.head.appendChild(style);
}

function ensureBankrollHud() {
  let root = $('#svr363Bankroll');
  if (!root) {
    root = document.createElement('aside');
    root.id = 'svr363Bankroll';
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = '<strong id="svr363BankrollValue">BANKROLL 15,000</strong><span id="svr363BankrollMeta">JOIN TO PLAY</span>';
    document.body.appendChild(root);
  }
  return root;
}

function removeDuplicateJoinControls() {
  const keep = $('#svr347Actions [data-ui="seat"]');
  for (const button of $$('button')) {
    if (button === keep || button.closest('#runtimeRecovery') || button.id === 'startRuntimeBtn') continue;
    const text = String(button.textContent || '').trim().toUpperCase();
    if (['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME', 'JOIN TABLE', 'LEAVE TABLE'].includes(text)) {
      button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
      try { button.inert = true; } catch {}
    }
  }
}

function updateUi() {
  if (!ACTIVE) return;
  installStyle();
  ensureBankrollHud();
  removeDuplicateJoinControls();
  document.body.classList.add('svr363-android');
  document.body.classList.toggle('svr363-lobby', !runtime.joined);
  document.body.classList.toggle('svr363-seated', runtime.joined);

  const seat = $('#svr347Actions [data-ui="seat"]');
  if (seat) {
    seat.hidden = false;
    seat.inert = false;
    seat.textContent = runtime.joined ? 'LEAVE TABLE' : 'JOIN TABLE';
    seat.setAttribute('aria-label', runtime.joined ? 'Leave poker table' : 'Join poker table');
  }
  const stateLabel = $('#svr347State');
  if (stateLabel) stateLabel.textContent = runtime.joined ? (state.waitingHuman ? 'YOUR TURN' : 'AT TABLE') : 'LOBBY';
  const meta = $('#svr347Meta');
  if (meta) meta.textContent = runtime.joined
    ? `${String(state.phase || 'idle').toUpperCase()} • POT ${Number(state.pot || 0).toLocaleString()}`
    : 'JOIN TABLE TO RECEIVE CARDS';
  const moveMode = $('#svr347MoveMode');
  if (moveMode) moveMode.textContent = runtime.joined ? 'SLIDE LEFT / RIGHT' : 'WALK / STRAFE';

  const stack = Number(human()?.stack || STARTING_STACK);
  const contribution = Number(human()?.contributed || 0);
  const bankroll = $('#svr363BankrollValue');
  const bankrollMeta = $('#svr363BankrollMeta');
  if (bankroll) bankroll.textContent = `BANKROLL ${stack.toLocaleString()}`;
  if (bankrollMeta) bankrollMeta.textContent = runtime.joined
    ? `IN POT ${contribution.toLocaleString()} • TABLE ${TABLE_BANKROLL.toLocaleString()}`
    : `FRESH BUY-IN ${STARTING_STACK.toLocaleString()}`;

  const cardOverlay = scene()?.getObjectByName?.('PHASE347_ANDROID_CAMERA_CARD_OVERLAY');
  if (cardOverlay) cardOverlay.visible = runtime.joined;
  const potDisplay = scene()?.getObjectByName?.('PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY');
  if (potDisplay) potDisplay.visible = runtime.joined;
  runtime.bankroll = stack;
  publish('ui');
}

async function requestGyroPermission() {
  if (!runtime.gyroAvailable) {
    runtime.gyroPermission = 'unavailable';
    return false;
  }
  try {
    if (typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
      const result = await window.DeviceOrientationEvent.requestPermission();
      runtime.gyroPermission = result;
      return result === 'granted';
    }
    runtime.gyroPermission = 'granted';
    return true;
  } catch (error) {
    runtime.gyroPermission = 'denied';
    runtime.lastError = String(error?.message || error);
    return false;
  }
}

function orientationValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function shortestDegrees(value) {
  let result = value % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

function onOrientation(event) {
  const alpha = orientationValue(event.alpha);
  const beta = orientationValue(event.beta);
  const gamma = orientationValue(event.gamma);
  if (!gyroBaseline) gyroBaseline = { alpha, beta, gamma };
  runtime.gyroEvents += 1;
  gyroTarget.yaw = clamp(shortestDegrees(alpha - gyroBaseline.alpha) * Math.PI / 180 * 0.20, -0.50, 0.50);
  gyroTarget.pitch = clamp((beta - gyroBaseline.beta) * Math.PI / 180 * 0.18, -0.28, 0.24);
  gyroTarget.slide = clamp((gamma - gyroBaseline.gamma) / 30, -1, 1);
}

function ignoredPointerTarget(target) {
  return Boolean(target?.closest?.('#svr347Root button,#svr347Root input,.svr347-stick,#svr363Bankroll,#runtimeRecovery,a,button,input,select,textarea'));
}

function onPointerDown(event) {
  PokerAudio.init();
  requestGyroPermission();
  if (ignoredPointerTarget(event.target)) return;
  isDragging = true;
  dragPointerId = event.pointerId;
  previousTouch = { x: event.clientX, y: event.clientY };
}

function onPointerMove(event) {
  if (!isDragging || event.pointerId !== dragPointerId || !runtime.joined) return;
  const dx = event.clientX - previousTouch.x;
  const dy = event.clientY - previousTouch.y;
  touchYaw = clamp(touchYaw - dx * 0.0032, -0.78, 0.78);
  touchPitch = clamp(touchPitch - dy * 0.0028, -0.38, 0.30);
  previousTouch = { x: event.clientX, y: event.clientY };
  runtime.touchDragEvents += 1;
  event.preventDefault();
}

function endPointer(event) {
  if (dragPointerId != null && event.pointerId != null && event.pointerId !== dragPointerId) return;
  isDragging = false;
  dragPointerId = null;
}

function adjustFov() {
  const cam = camera();
  const view = renderer();
  if (!cam || !view || view.xr?.isPresenting) return false;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const aspect = width / height;
  const portrait = aspect < 1;
  const fov = portrait ? clamp(73 + (1 - aspect) * 18, 73, 86) : 61;
  cam.fov = fov;
  cam.aspect = aspect;
  cam.updateProjectionMatrix?.();
  view.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.25));
  view.setSize?.(width, height, false);
  runtime.fov = +fov.toFixed(2);
  runtime.aspect = +aspect.toFixed(4);
  runtime.portrait = portrait;
  publish('fov');
  return true;
}

function applyHybridView(dt) {
  if (!runtime.joined) return;
  const cam = camera();
  if (!cam) return;
  const smoothing = 1 - Math.exp(-dt * 9);
  gyroSmooth.yaw = THREE.MathUtils.lerp(gyroSmooth.yaw, gyroTarget.yaw, smoothing);
  gyroSmooth.pitch = THREE.MathUtils.lerp(gyroSmooth.pitch, gyroTarget.pitch, smoothing);
  gyroSmooth.slide = THREE.MathUtils.lerp(gyroSmooth.slide, gyroTarget.slide, smoothing);

  const yaw = clamp(touchYaw + gyroSmooth.yaw, -0.82, 0.82);
  const pitch = clamp(touchPitch + gyroSmooth.pitch, -0.42, 0.32);
  cam.rotateY?.(yaw);
  cam.rotateX?.(pitch);

  const phase347 = window.SVR_PHASE347_STATE;
  const rig = playerRig();
  if (rig?.position && phase347?.seated && Number.isFinite(Number(phase347.seatX))) {
    const parallax = gyroSmooth.slide * 0.20;
    rig.position.x = Number(phase347.seatX) + parallax;
    runtime.seatParallax = +parallax.toFixed(3);
  }
}

function resetHybridView() {
  touchYaw = 0;
  touchPitch = 0;
  gyroTarget = { yaw: 0, pitch: 0, slide: 0 };
  gyroSmooth = { yaw: 0, pitch: 0, slide: 0 };
  gyroBaseline = null;
  runtime.seatParallax = 0;
}

function playPokerEvents() {
  if (!runtime.joined || performance.now() < suppressPokerEventsUntil) return;
  const handNo = Number(state.handNo || 0);
  const communityCount = Number(state.community?.length || 0);
  const logEntry = String(state.actionLog?.[0] || '');
  const waitingHuman = Boolean(state.waitingHuman);
  const winnerSignature = JSON.stringify((state.winners || []).map((winner) => [winner.name, winner.amount, winner.hand]));

  if (handNo > 0 && handNo !== lastHandNo) {
    PokerAudio.play('card_shuffle');
    window.setTimeout(() => PokerAudio.play('card_deal'), 150);
    haptic([18, 22, 18]);
    runtime.lastPokerEvent = 'new-hand';
  } else if (communityCount > lastCommunityCount) {
    PokerAudio.play('card_deal');
    haptic(15);
    runtime.lastPokerEvent = 'community-card';
  }

  if (logEntry && logEntry !== lastLogEntry) {
    if (/fold/i.test(logEntry)) PokerAudio.play('fold_hand');
    else if (/calls|raises|bets|posts|all in|physical/i.test(logEntry)) PokerAudio.play('chip_bet');
  }

  if (waitingHuman && !lastWaitingHuman) {
    PokerAudio.play('turn_cue');
    haptic([18, 24, 18]);
    runtime.lastPokerEvent = 'your-turn';
  }

  if (winnerSignature !== '[]' && winnerSignature !== lastWinnerSignature) {
    PokerAudio.play('chip_collect');
    window.setTimeout(() => PokerAudio.play('win_pot'), 110);
    haptic([30, 30, 45]);
    runtime.lastPokerEvent = 'winner';
  }

  lastHandNo = handNo;
  lastCommunityCount = communityCount;
  lastWaitingHuman = waitingHuman;
  lastLogEntry = logEntry;
  lastWinnerSignature = winnerSignature;
}

function joinTable(reason = 'join-button') {
  if (runtime.joined) return true;
  runtime.joined = true;
  runtime.gameState = GameState.SEATED;
  runtime.joinCount += 1;
  clearSavedHand();
  resetHybridView();
  requestGyroPermission();
  try { originalSit?.(); } catch {}
  suppressPokerEventsUntil = performance.now() + 250;
  const accepted = resetTable(STARTING_STACK) !== false;
  PokerAudio.play('sit_down');
  haptic([30, 20, 30]);
  window.setTimeout(() => PokerAudio.play('card_shuffle'), 120);
  window.setTimeout(() => PokerAudio.play('card_deal'), 330);
  window.dispatchEvent(new CustomEvent('svr:phase363-table-joined', {
    detail: { build: BUILD, reason, startingStack: STARTING_STACK, tableBankroll: TABLE_BANKROLL }
  }));
  updateUi();
  return accepted;
}

function leaveTable(reason = 'leave-button') {
  if (!runtime.joined && runtime.gameState === GameState.LOBBY) {
    try { originalLeave?.(); } catch {}
    prepareLobby(reason);
    updateUi();
    return true;
  }
  runtime.joined = false;
  runtime.gameState = GameState.LOBBY;
  runtime.leaveCount += 1;
  PokerAudio.play('leave_table');
  haptic(20);
  resetHybridView();
  try { originalLeave?.(); } catch {}
  prepareLobby(reason);
  window.dispatchEvent(new CustomEvent('svr:phase363-table-left', {
    detail: { build: BUILD, reason, nextBuyIn: STARTING_STACK }
  }));
  updateUi();
  return true;
}

function toggleJoin() {
  return runtime.joined ? leaveTable('join-control') : joinTable('join-control');
}

function installAuthorityWrappers() {
  originalSit = window.SVR_PHASE347_SIT || window.SVR_ANDROID_SIT_TO_TABLE || null;
  originalLeave = window.SVR_PHASE347_LEAVE || window.SVR_ANDROID_LOBBY_MODE || null;
  originalCenter = window.SVR_PHASE347_RECENTER || window.SVR_ANDROID_CENTER_PLAYER || null;
  originalAction = window.SVR_POKER_ACTION || action;
  originalNextHand = window.SVR_POKER_NEXT_HAND || null;

  window.SVR_PHASE363_JOIN_TABLE = joinTable;
  window.SVR_PHASE363_LEAVE_TABLE = leaveTable;
  window.SVR_PHASE363_TOGGLE_JOIN = toggleJoin;
  window.SVR_PHASE363_AUDIO = PokerAudio;
  window.SVR_PHASE363_REQUEST_GYRO = requestGyroPermission;
  window.SVR_PHASE363_RESET_VIEW = () => {
    resetHybridView();
    originalCenter?.();
    return true;
  };

  window.SVR_PHASE347_SIT = () => joinTable('phase347-sit');
  window.SVR_ANDROID_SIT_TO_TABLE = () => joinTable('android-sit');
  window.SVR_PHASE347_LEAVE = () => leaveTable('phase347-leave');
  window.SVR_ANDROID_LOBBY_MODE = () => leaveTable('android-lobby');
  window.SVR_POKER_ACTION = (input) => {
    if (!runtime.joined) return false;
    const type = typeof input === 'string' ? input : input?.type;
    if (String(type || '').toLowerCase() === 'fold') PokerAudio.play('fold_hand');
    else if (['call', 'raise', 'bet', 'allin', 'physical-bet'].includes(String(type || '').toLowerCase())) PokerAudio.play('chip_bet');
    return originalAction?.(input);
  };
  window.SVR_POKER_NEXT_HAND = (...args) => runtime.joined ? originalNextHand?.(...args) : false;
  window.SVR_POKER_LEGAL_ACTIONS = () => runtime.joined ? legal().slice() : [];
}

function bindJoinControl() {
  const seat = $('#svr347Actions [data-ui="seat"]');
  if (!seat || seat.dataset.phase363Bound === '1') return;
  seat.dataset.phase363Bound = '1';
  seat.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleJoin();
  }, true);
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - previousFrame) / 1000));
  previousFrame = now;
  applyHybridView(dt);
  raf = requestAnimationFrame(frame);
}

function qa() {
  const stack = Number(human()?.stack || 0);
  const seatControls = $$('button').filter((button) => {
    const text = String(button.textContent || '').trim().toUpperCase();
    return ['JOIN TABLE', 'LEAVE TABLE', 'SIT', 'SEAT', 'PLAY GAME'].includes(text) && !button.hidden;
  });
  const cardOverlay = scene()?.getObjectByName?.('PHASE347_ANDROID_CAMERA_CARD_OVERLAY');
  const tableQa = window.SVR_PHASE363_TABLE_QA?.() || null;
  const result = {
    ...runtime,
    stack,
    totalChips: totalChips(),
    playerCount: players.length,
    joinControls: seatControls.length,
    seatControlLabels: seatControls.map((button) => String(button.textContent || '').trim()),
    cardOverlayVisible: Boolean(cardOverlay?.visible),
    cardsHiddenInLobby: runtime.joined || !cardOverlay?.visible,
    holeCards: runtime.joined ? Number(human()?.hand?.length || 0) : 0,
    communityCards: runtime.joined ? Number(state.community?.length || 0) : 0,
    table: tableQa,
    fovValid: Number.isFinite(runtime.fov) && runtime.fov >= 61 && runtime.fov <= 86,
    bankrollValid: runtime.joined ? stack >= 0 : stack === STARTING_STACK,
    conservationValid: totalChips() === TABLE_BANKROLL,
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(
    ACTIVE
    && result.joinControls === 1
    && result.cardsHiddenInLobby
    && result.fovValid
    && result.bankrollValid
    && result.conservationValid
    && (!tableQa || tableQa.pass)
  );
  window.SVR_PHASE363_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || installed) return;
  if (!camera() || !renderer() || typeof window.SVR_PHASE347_SIT !== 'function' || typeof window.SVR_POKER_ACTION !== 'function') {
    setTimeout(install, 100);
    return;
  }
  installed = true;
  runtime.installedAt = new Date().toISOString();
  installStyle();
  ensureBankrollHud();
  installAuthorityWrappers();
  prepareLobby('initial-lobby-lock');
  try { originalLeave?.(); } catch {}
  bindJoinControl();
  updateUi();
  adjustFov();

  window.addEventListener('deviceorientation', onOrientation, true);
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', endPointer, { passive: true });
  window.addEventListener('pointercancel', endPointer, { passive: true });
  window.addEventListener('resize', adjustFov, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(adjustFov, 120), { passive: true });
  window.addEventListener('svr:poker-state', () => {
    playPokerEvents();
    updateUi();
  });

  observer = new MutationObserver(() => {
    bindJoinControl();
    removeDuplicateJoinControls();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  interval = window.setInterval(() => {
    bindJoinControl();
    updateUi();
    playPokerEvents();
  }, 280);
  if (!raf) raf = requestAnimationFrame(frame);
  window.SVR_PHASE363_QA = qa;
  window.SVR_PHASE363_CONSTANTS = { STARTING_STACK, TABLE_BANKROLL, GameState };
  publish('installed');
}

[80, 220, 500, 1000].forEach((delay) => setTimeout(install, delay));
