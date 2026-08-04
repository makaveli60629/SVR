import * as THREE from 'three';
import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  closeSeatCorrections: 0,
  antePrompts: 0,
  nextHandsStarted: 0,
  lastCameraDistance: null,
  lastTurnPlayer: null,
  lastWinnerText: null,
  installedAt: null,
  checkedAt: null
};

let originalSit = null;
let originalLeave = null;
let originalRecenter = null;
let dismissedShowdownHand = -1;
let lastShowdownSignature = '';
let syncTimer = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const camera = () => window.__SVR_RENDERER__?.xr?.isPresenting
  ? window.__SVR_RENDERER__.xr.getCamera(window.__SVR_CAMERA__)
  : window.__SVR_CAMERA__;
const rig = () => window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
const scene = () => window.__SVR_SCENE__ || null;
const worldRoot = () => scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene();

function tableObject() {
  return window.SVR_TABLE_AUTHORITY
    || worldRoot()?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || worldRoot()?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT')
    || worldRoot()?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED')
    || worldRoot()?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
    || null;
}

function tableMetrics() {
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  if (layout?.center && layout?.size) {
    return {
      center: new THREE.Vector3(Number(layout.center.x || 0), Number(layout.center.y || 0), Number(layout.center.z || 0)),
      top: Number(layout.top || 0.95),
      width: Number(layout.size.x || 3.2),
      depth: Number(layout.size.z || 1.8)
    };
  }
  const table = tableObject();
  if (!table) return null;
  table.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(table);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return {
    center,
    top: box.max.y,
    width: Math.max(2.2, Math.min(size.x * 0.94, 4.1)),
    depth: Math.max(1.18, Math.min(size.z * 0.92, 2.25))
  };
}

function isSeated() {
  return Boolean(window.SVR_PHASE347_STATE?.seated || document.body.classList.contains('svr347-seated'));
}

function cardText(card) {
  if (!card) return '—';
  const suit = { S: '♠', H: '♥', D: '♦', C: '♣' }[card.s || card.suit] || '';
  return `${card.r || card.rank || '?'}${suit}`;
}

function money(value) {
  return `$${Math.max(0, Number(value || 0)).toLocaleString()}`;
}

function currentPlayer() {
  return players[Number(state.current || 0)] || null;
}

function cameraWorldPosition() {
  const active = camera();
  const position = new THREE.Vector3();
  active?.updateWorldMatrix?.(true, false);
  active?.getWorldPosition?.(position);
  return position;
}

function rigWorldPosition() {
  const playerRig = rig();
  const position = new THREE.Vector3();
  if (playerRig?.getWorldPosition) {
    playerRig.updateWorldMatrix?.(true, false);
    playerRig.getWorldPosition(position);
  } else if (playerRig?.position) position.copy(playerRig.position);
  else position.copy(cameraWorldPosition());
  return position;
}

function moveRigByWorldDelta(delta) {
  const playerRig = rig();
  const activeCamera = camera();
  if (!delta || !Number.isFinite(delta.x) || !Number.isFinite(delta.z)) return false;
  try {
    if (playerRig?.setPlayerPose) {
      const current = rigWorldPosition();
      playerRig.setPlayerPose(current.x + delta.x, current.y, current.z + delta.z);
      return true;
    }
    if (playerRig?.position) {
      const desiredWorld = rigWorldPosition().add(delta);
      if (playerRig.parent?.worldToLocal) playerRig.position.copy(playerRig.parent.worldToLocal(desiredWorld.clone()));
      else playerRig.position.add(delta);
      playerRig.updateWorldMatrix?.(true, false);
      return true;
    }
    if (activeCamera?.position) {
      activeCamera.position.add(delta);
      activeCamera.updateWorldMatrix?.(true, false);
      return true;
    }
  } catch (error) {
    window.SVR_PHASE357_SEAT_ERROR = String(error?.stack || error?.message || error);
  }
  return false;
}

function desiredSeatCamera(metrics) {
  const current = cameraWorldPosition();
  const edgeOffset = THREE.MathUtils.clamp(metrics.depth * 0.17, 0.24, 0.34);
  return new THREE.Vector3(
    metrics.center.x,
    current.y,
    metrics.center.z + metrics.depth * 0.5 + edgeOffset
  );
}

function applyCloseSeat(reason = 'seat') {
  if (!ACTIVE || !isSeated()) return false;
  const metrics = tableMetrics();
  const activeCamera = camera();
  if (!metrics || !activeCamera) return false;
  const before = cameraWorldPosition();
  const desired = desiredSeatCamera(metrics);
  const delta = desired.clone().sub(before);
  delta.y = 0;
  const moved = moveRigByWorldDelta(delta);
  const after = cameraWorldPosition();
  runtime.lastCameraDistance = +Math.hypot(after.x - metrics.center.x, after.z - metrics.center.z).toFixed(3);
  if (moved) runtime.closeSeatCorrections += 1;
  try { activeCamera.lookAt(metrics.center.x, metrics.top + 0.11, metrics.center.z); } catch {}
  window.SVR_PHASE357_SEAT_STATE = {
    reason,
    desiredCamera: { x: +desired.x.toFixed(3), z: +desired.z.toFixed(3) },
    actualCamera: { x: +after.x.toFixed(3), z: +after.z.toFixed(3) },
    distance: runtime.lastCameraDistance,
    edgeOffset: +(desired.z - (metrics.center.z + metrics.depth * 0.5)).toFixed(3),
    correctedAt: new Date().toISOString()
  };
  return moved;
}

function scheduleCloseSeat(reason = 'seat') {
  [0, 70, 180, 360, 650, 1050].forEach((delay) => setTimeout(() => applyCloseSeat(reason), delay));
}

function installCss() {
  if ($('#svr357-style')) return;
  const style = document.createElement('style');
  style.id = 'svr357-style';
  style.textContent = `
#svr357TurnPanel{position:absolute;left:50%;top:max(113px,calc(env(safe-area-inset-top) + 105px));transform:translateX(-50%);width:min(94vw,620px);padding:8px 10px;border:1px solid rgba(127,252,255,.58);border-radius:14px;background:rgba(1,6,14,.76);backdrop-filter:blur(11px);box-shadow:0 12px 32px rgba(0,0,0,.38);pointer-events:none}
#svr357TurnLine{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}
#svr357TurnLine strong{color:#7ffcff;font:950 12px/1 system-ui;letter-spacing:.07em;white-space:nowrap}
#svr357TurnDetail{min-width:0;text-align:right;color:#fff;font:850 10px/1.15 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#svr357Bets{display:flex;gap:5px;margin-top:6px;overflow:hidden}
.svr357Bet{flex:1 1 0;min-width:0;padding:4px 5px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.05);text-align:center;font:800 8px/1.1 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svr357Bet.turn{border-color:#7ffcff;color:#7ffcff;box-shadow:0 0 12px rgba(127,252,255,.16)}
.svr357Bet.folded{opacity:.38;text-decoration:line-through}
#svr357Showdown{position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);width:min(91vw,520px);max-height:min(72vh,620px);overflow:auto;padding:17px;border:1px solid rgba(255,217,138,.88);border-radius:22px;background:linear-gradient(180deg,rgba(5,8,18,.98),rgba(1,2,8,.98));box-shadow:0 28px 90px rgba(0,0,0,.84),0 0 32px rgba(255,217,138,.15);pointer-events:auto;text-align:center}
#svr357Showdown[hidden]{display:none!important}
#svr357ResultTitle{margin:0;color:#ffd98a;font:1000 22px/1.08 system-ui;letter-spacing:.04em}
#svr357ResultPot{margin:7px 0 12px;color:#fff;font:900 14px/1 system-ui}
#svr357WinnerDetails{display:grid;gap:8px;text-align:left}
.svr357Winner{padding:10px;border:1px solid rgba(127,252,255,.35);border-radius:13px;background:rgba(127,252,255,.05)}
.svr357Winner strong{display:block;color:#7ffcff;font:950 13px/1.1 system-ui}.svr357Winner span{display:block;margin-top:5px;color:#fff;font:800 11px/1.35 system-ui}
#svr357Board{margin:11px 0 0;color:#dceeff;font:800 11px/1.35 system-ui}
#svr357AnteNote{margin:11px 0 9px;color:#c8d5e5;font:750 10px/1.35 system-ui}
#svr357ResultActions{display:grid;grid-template-columns:1fr auto;gap:8px}
#svr357ResultActions button{min-height:46px;border-radius:13px;color:#fff;font:950 12px/1.1 system-ui;touch-action:manipulation}
#svr357Ante{border:1px solid #ffd98a;background:linear-gradient(180deg,#6b4600,#291700)}
#svr357Wait{border:1px solid rgba(127,252,255,.6);background:rgba(0,48,61,.8);padding-inline:15px}
@media(max-height:720px){#svr357TurnPanel{top:max(108px,calc(env(safe-area-inset-top) + 100px));padding:6px 8px}.svr357Bet{font-size:7px}#svr357Showdown{max-height:67vh;padding:13px}}
@media(orientation:landscape){#svr357TurnPanel{left:16px;top:52px;transform:none;width:min(46vw,520px)}#svr357Showdown{width:min(58vw,620px);max-height:88vh}}
`;
  document.head.appendChild(style);
}

function ensureUi() {
  const root = $('#svr347Root');
  if (!root) return false;
  if (!$('#svr357TurnPanel', root)) {
    const panel = document.createElement('section');
    panel.id = 'svr357TurnPanel';
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<div id="svr357TurnLine"><strong id="svr357TurnName">TABLE READY</strong><span id="svr357TurnDetail">Waiting for a hand</span></div><div id="svr357Bets"></div>';
    root.appendChild(panel);
  }
  if (!$('#svr357Showdown', root)) {
    const panel = document.createElement('section');
    panel.id = 'svr357Showdown';
    panel.hidden = true;
    panel.innerHTML = `
      <h2 id="svr357ResultTitle">HAND COMPLETE</h2>
      <div id="svr357ResultPot"></div>
      <div id="svr357WinnerDetails"></div>
      <div id="svr357Board"></div>
      <div id="svr357AnteNote">Ante up to begin the next $10 / $20 blind hand.</div>
      <div id="svr357ResultActions"><button id="svr357Ante" type="button">ANTE UP • NEXT HAND</button><button id="svr357Wait" type="button">WAIT</button></div>`;
    root.appendChild(panel);
  }
  return true;
}

function syncTurnPanel() {
  if (!ensureUi()) return;
  const phase = String(state.phase || 'idle').toLowerCase();
  const actor = currentPlayer();
  const waitingHuman = Boolean(state.waitingHuman);
  const turnName = $('#svr357TurnName');
  const detail = $('#svr357TurnDetail');
  const bets = $('#svr357Bets');

  if (phase === 'showdown') {
    turnName.textContent = 'HAND COMPLETE';
    detail.textContent = state.lastAction || 'Pot settled';
  } else if (phase === 'idle') {
    turnName.textContent = 'TABLE READY';
    detail.textContent = 'Tap SIT, then DEAL';
  } else {
    const name = waitingHuman ? 'YOUR TURN' : `${actor?.name || 'PLAYER'}’S TURN`;
    const actorBet = Number(actor?.bet || 0);
    const needed = Math.max(0, Number(state.currentBet || 0) - actorBet);
    turnName.textContent = name;
    detail.textContent = `${phase.toUpperCase()} • BET ${money(actorBet)} • ${needed ? `TO CALL ${money(needed)}` : 'CHECK AVAILABLE'} • ${actor?.lastAction || state.lastAction || 'Thinking'}`;
    runtime.lastTurnPlayer = actor?.name || null;
  }

  bets.innerHTML = players.map((player, index) => {
    const classes = ['svr357Bet'];
    if (index === Number(state.current) && phase !== 'showdown') classes.push('turn');
    if (player.folded) classes.push('folded');
    const action = String(player.lastAction || 'Ready').replace(/\s+/g, ' ');
    return `<span class="${classes.join(' ')}" title="${player.name}: ${action}">${player.name} ${money(player.bet)}<br>${action}</span>`;
  }).join('');
}

function winnerDetails() {
  return (state.winners || []).map((winner) => {
    const player = players[winner.id] || players.find((entry) => entry.name === winner.name);
    return {
      id: winner.id,
      name: winner.name || player?.name || 'WINNER',
      amount: Number(winner.amount || 0),
      label: winner.label || 'Winning hand',
      hole: (player?.hand || []).map(cardText).join(' ') || 'Cards unavailable'
    };
  });
}

function showdownSignature() {
  return JSON.stringify({
    handNo: state.handNo,
    settledPot: state.settledPot,
    winners: (state.winners || []).map((winner) => [winner.id, winner.amount, winner.label]),
    board: (state.community || []).map(cardText)
  });
}

function syncShowdown() {
  if (!ensureUi()) return;
  const panel = $('#svr357Showdown');
  const phase = String(state.phase || '').toLowerCase();
  const winners = winnerDetails();
  const handNo = Number(state.handNo || 0);
  const shouldShow = isSeated() && phase === 'showdown' && winners.length > 0 && dismissedShowdownHand !== handNo;
  panel.hidden = !shouldShow;
  if (!shouldShow) return;

  const signature = showdownSignature();
  if (signature !== lastShowdownSignature) {
    lastShowdownSignature = signature;
    runtime.antePrompts += 1;
  }

  const humanWon = winners.some((winner) => winner.id === 0 || winner.name === 'YOU');
  const totalWon = winners.reduce((sum, winner) => sum + winner.amount, 0);
  const winnerNames = winners.map((winner) => winner.name).join(' & ');
  $('#svr357ResultTitle').textContent = humanWon ? `YOU WIN ${money(winners.find((winner) => winner.id === 0 || winner.name === 'YOU')?.amount || 0)}` : `${winnerNames} WINS`;
  $('#svr357ResultPot').textContent = `POT SETTLED: ${money(state.settledPot || totalWon)}`;
  $('#svr357WinnerDetails').innerHTML = winners.map((winner) => `
    <div class="svr357Winner">
      <strong>${winner.name} • ${money(winner.amount)} • ${winner.label}</strong>
      <span>WINNING CARDS: ${winner.hole}</span>
    </div>`).join('');
  $('#svr357Board').textContent = `BOARD: ${(state.community || []).map(cardText).join(' ') || 'No community cards'}`;
  runtime.lastWinnerText = `${winnerNames} ${money(totalWon)} ${winners.map((winner) => winner.label).join(', ')}`;
}

function startNextHand() {
  const previous = Number(state.handNo || 0);
  dismissedShowdownHand = -1;
  $('#svr357Showdown')?.setAttribute('hidden', '');
  let accepted = false;
  try {
    accepted = window.SVR_POKER_NEXT_HAND?.() !== false;
    if (!accepted) accepted = window.SVR_PRESS_DEAL?.() !== false;
  } catch (error) {
    window.SVR_PHASE357_NEXT_HAND_ERROR = String(error?.stack || error?.message || error);
  }
  if (accepted) {
    runtime.nextHandsStarted += 1;
    setTimeout(() => {
      if (Number(state.handNo || 0) > previous && isSeated()) scheduleCloseSeat('next-hand');
    }, 80);
  }
  return accepted;
}

function interceptUi(event) {
  const button = event.target?.closest?.('button');
  if (!button) return;
  if (button.id === 'svr357Ante') {
    event.preventDefault();
    event.stopImmediatePropagation();
    startNextHand();
    return;
  }
  if (button.id === 'svr357Wait') {
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissedShowdownHand = Number(state.handNo || 0);
    $('#svr357Showdown')?.setAttribute('hidden', '');
    return;
  }
  if (button.dataset?.ui === 'seat') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isSeated()) originalLeave?.();
    else {
      originalSit?.();
      scheduleCloseSeat('sit-button');
    }
    return;
  }
  if (button.id === 'svr347Recenter') {
    event.preventDefault();
    event.stopImmediatePropagation();
    originalRecenter?.();
    scheduleCloseSeat('recenter-button');
  }
}

function sync() {
  if (!ACTIVE) return;
  installCss();
  ensureUi();
  syncTurnPanel();
  syncShowdown();
  runtime.checkedAt = new Date().toISOString();
  window.SVR_PHASE357_STATE = { ...runtime, seated: isSeated(), handNo: state.handNo, phase: state.phase };
}

function qa() {
  const metrics = tableMetrics();
  const position = cameraWorldPosition();
  const distance = metrics ? Math.hypot(position.x - metrics.center.x, position.z - metrics.center.z) : null;
  const targetMaximum = metrics ? metrics.depth * 0.5 + 0.48 : null;
  const result = {
    build: BUILD,
    active: ACTIVE,
    installed: runtime.installed,
    seated: isSeated(),
    cameraDistance: distance == null ? null : +distance.toFixed(3),
    maximumCloseSeatDistance: targetMaximum == null ? null : +targetMaximum.toFixed(3),
    turnPanel: Boolean($('#svr357TurnPanel')),
    playerBetIndicators: document.querySelectorAll('.svr357Bet').length,
    showdownPanel: Boolean($('#svr357Showdown')),
    anteButton: Boolean($('#svr357Ante')),
    winnerCount: (state.winners || []).length,
    winnerDetails: winnerDetails(),
    closeSeatCorrections: runtime.closeSeatCorrections,
    nextHandsStarted: runtime.nextHandsStarted,
    apkPolicy: window.SVR_ANDROID_UPDATE_POLICY || null,
    checkedAt: new Date().toISOString()
  };
  result.pass = result.active
    && result.installed
    && result.turnPanel
    && result.playerBetIndicators === 6
    && result.showdownPanel
    && result.anteButton
    && (!result.seated || result.cameraDistance == null || result.cameraDistance <= result.maximumCloseSeatDistance + 0.08)
    && result.apkPolicy?.apkVersionName === '0.1.0-rc1'
    && Number(result.apkPolicy?.apkVersionCode) === 1
    && result.apkPolicy?.forceUpdate === false
    && result.apkPolicy?.showUpdatePrompt === false;
  window.SVR_PHASE357_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  if (!window.SVR_PHASE347_SIT || !window.SVR_PHASE347_LEAVE || !$('#svr347Root')) {
    setTimeout(install, 180);
    return;
  }
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  originalSit = window.SVR_PHASE347_SIT;
  originalLeave = window.SVR_PHASE347_LEAVE;
  originalRecenter = window.SVR_PHASE347_RECENTER || window.SVR_ANDROID_CENTER_PLAYER;
  installCss();
  ensureUi();
  document.addEventListener('pointerdown', interceptUi, true);
  window.addEventListener('svr:poker-state', () => setTimeout(sync, 0));
  window.addEventListener('resize', () => setTimeout(sync, 80));
  syncTimer = window.setInterval(sync, 220);
  window.SVR_PHASE357_RECENTER = () => {
    originalRecenter?.();
    scheduleCloseSeat('api-recenter');
    return true;
  };
  window.SVR_PHASE357_ANTE_UP = startNextHand;
  window.SVR_PHASE357_QA = qa;
  window.SVR_ANDROID_CENTER_PLAYER = window.SVR_PHASE357_RECENTER;
  [0, 120, 360, 900].forEach((delay) => setTimeout(sync, delay));
  if (isSeated()) scheduleCloseSeat('install');
}

if (ACTIVE) {
  [0, 180, 420, 900, 1800].forEach((delay) => setTimeout(install, delay));
}
