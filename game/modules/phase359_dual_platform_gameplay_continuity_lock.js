import * as THREE from 'three';
import { state, players, startHand } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK';
const params = new URLSearchParams(location.search);
const detected = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit === 'quest' || explicit === 'android') return explicit;
  if (/\/android\.html$/i.test(location.pathname)) return 'android';
  if (/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')) return 'quest';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
})();
const ACTIVE = detected === 'android' || detected === 'quest';
const CONTINUOUS_DELAY_MS = 9000;

const runtime = {
  build: BUILD,
  platform: detected,
  active: ACTIVE,
  installedAt: null,
  continuous: true,
  lastShowdownHand: -1,
  lastWinner: null,
  lastAmount: 0,
  lastHandLabel: null,
  lastHoleCards: [],
  lastBoard: [],
  countdownSeconds: null,
  autoNextHands: 0,
  manualNextHands: 0,
  panelUpdates: 0,
  checkedAt: null
};

let questPanel = null;
let questTexture = null;
let questCanvas = null;
let questContext = null;
let countdownTimer = 0;
let interval = 0;
let scheduledHand = -1;
let deadline = 0;

const money = (value) => `$${Math.max(0, Number(value || 0)).toLocaleString()}`;
const cardText = (card) => {
  if (!card) return '—';
  const suit = { S: '♠', H: '♥', D: '♦', C: '♣' }[card.s || card.suit] || '';
  return `${card.r || card.rank || '?'}${suit}`;
};

function safeWalk(root, visitor, limit = 16000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    count += 1;
    try { visitor(object); } catch {}
    const children = Array.isArray(object.children) ? object.children : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
  return count;
}

function sceneNames() {
  const names = [];
  safeWalk(window.__SVR_SCENE__, (object) => names.push(String(object.name || '')));
  return names;
}

function tableAuthority() {
  return window.SVR_TABLE_AUTHORITY
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT')
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
    || null;
}

function tableAudit() {
  const names = sceneNames();
  const exactQuestTable = names.includes('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || window.SVR_TABLE_AUTHORITY?.name === 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';
  const canonicalPresentation = names.includes('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  const fallbackQuestTable = names.includes('PHASE358_QUEST_TABLE_FALLBACK');
  const holeMeshes = names.filter((name) => /^(?:PHASE341_HOLE_0_[01]|P85_HAND_0_[01])$/i.test(name)).length;
  const communityMeshes = names.filter((name) => /^(?:PHASE341_COMMUNITY_[0-4]|P85_COMM_\d+)$/i.test(name)).length;
  const logo = names.some((name) => /PHASE341_CANONICAL_CENTER_LOGO|PHASE334_CENTER_LOGO_ROOT|PHASE331_SVR_TABLE_CENTER_LOGO/i.test(name));
  const pass = detected === 'quest'
    ? exactQuestTable && !fallbackQuestTable && canonicalPresentation && holeMeshes >= 2 && communityMeshes >= 5 && logo
    : Boolean(tableAuthority() && canonicalPresentation && holeMeshes >= 2 && communityMeshes >= 5 && logo);
  return {
    platform: detected,
    authority: tableAuthority()?.name || null,
    exactQuestTable,
    canonicalPresentation,
    fallbackQuestTable,
    holeMeshes,
    communityMeshes,
    logo,
    pass
  };
}

function inputAudit() {
  const loaded = [
    ...(window.SVR_PHASE340_PLATFORM_STATE?.loaded || []),
    ...(window.SVR_PHASE340_PLATFORM_STATE?.deferredLoaded || [])
  ];
  const androidRoots = document.querySelectorAll('#svr347Root,#svr343Root,#svr326Root,#svr339Root,[data-svr-android-controller],.svr-android-controller').length;
  if (detected === 'quest') {
    const renderer = window.__SVR_RENDERER__;
    const handsModule = loaded.some((path) => String(path).endsWith('phase331_quest_meta_hands_table_interaction_lock.js'));
    const gestureModule = loaded.some((path) => String(path).endsWith('phase334_table_layout_gesture_poker_lock.js'));
    const stabilityModule = loaded.some((path) => String(path).endsWith('phase335_oculus_acceptance_gameplay_stability_lock.js'));
    const result = {
      handsPrimary: handsModule && gestureModule && typeof renderer?.xr?.getHand === 'function',
      controllerFallback: typeof renderer?.xr?.getController === 'function',
      stabilityModule,
      androidRoots,
      snapTurnDegrees: 45,
      forwardReference: 'headset-look-direction',
      teleportContract: 'hold-to-aim-release-to-teleport'
    };
    result.pass = result.handsPrimary && result.controllerFallback && result.stabilityModule && androidRoots === 0;
    return result;
  }
  const controllerQa = window.SVR_PHASE350_ANDROID_CONTROLLER_QA?.() || null;
  const result = {
    controllerQa,
    authorityRoots: controllerQa?.authorityRoots ?? document.querySelectorAll('#svr347Root').length,
    moveControls: controllerQa?.moveControls ?? document.querySelectorAll('#svr347Root [data-role="move"],#svr347Move').length,
    lookControls: controllerQa?.lookControls ?? document.querySelectorAll('#svr347Root [data-role="look"],#svr347Look').length,
    actionPanels: controllerQa?.actionPanels ?? document.querySelectorAll('#svr347Root .svr347-actions,#svr347Actions').length,
    visibleLegacyRoots: controllerQa?.visibleLegacyRoots ?? 0,
    leftRightContract: 'left-input-moves-left-right-input-moves-right'
  };
  result.pass = result.authorityRoots === 1
    && result.moveControls === 1
    && result.lookControls === 1
    && result.actionPanels === 1
    && result.visibleLegacyRoots === 0;
  return result;
}

function winnerSnapshot() {
  const winners = Array.isArray(state.winners) ? state.winners : [];
  const details = winners.map((winner) => {
    const player = players[winner.id] || players.find((entry) => entry.name === winner.name);
    return {
      id: winner.id,
      name: winner.name || player?.name || 'WINNER',
      amount: Number(winner.amount || 0),
      label: winner.label || winner.hand || 'Winning hand',
      holeCards: (player?.hand || []).map(cardText)
    };
  });
  return {
    handNo: Number(state.handNo || 0),
    phase: String(state.phase || 'idle'),
    settledPot: Number(state.settledPot || 0),
    winners: details,
    board: (state.community || []).map(cardText),
    totalStacks: players.reduce((sum, player) => sum + Number(player.stack || 0), 0),
    fundedPlayers: players.filter((player) => Number(player.stack || 0) > 0).length
  };
}

function primaryWinner(snapshot = winnerSnapshot()) {
  return snapshot.winners[0] || null;
}

function ensureAndroidFallback() {
  if (detected !== 'android') return null;
  const root = document.getElementById('svr347Root') || document.body;
  let panel = document.getElementById('svr359AndroidResult');
  if (panel) return panel;
  panel = document.createElement('section');
  panel.id = 'svr359AndroidResult';
  panel.hidden = true;
  panel.style.cssText = 'position:absolute;z-index:31;left:50%;top:50%;transform:translate(-50%,-50%);width:min(90vw,520px);padding:16px;border:1px solid #ffd98a;border-radius:20px;background:rgba(2,5,12,.97);box-shadow:0 24px 80px rgba(0,0,0,.82);text-align:center;color:#fff;font-family:system-ui;pointer-events:auto';
  panel.innerHTML = '<h2 id="svr359AndroidTitle" style="margin:0 0 8px;color:#ffd98a">HAND COMPLETE</h2><div id="svr359AndroidWinner"></div><div id="svr359AndroidCards" style="margin-top:8px"></div><div id="svr359AndroidCountdown" style="margin-top:10px;color:#7ffcff"></div><button id="svr359AndroidNext" type="button" style="margin-top:12px;min-height:44px;border:1px solid #ffd98a;border-radius:12px;background:#402900;color:#fff;font-weight:900">NEXT HAND NOW</button>';
  panel.querySelector('#svr359AndroidNext')?.addEventListener('click', () => nextHand('manual'));
  root.appendChild(panel);
  return panel;
}

function ensureQuestPanel() {
  if (detected !== 'quest' || !window.__SVR_SCENE__) return null;
  if (questPanel?.parent) return questPanel;
  const existing = window.__SVR_SCENE__.getObjectByName?.('PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL');
  if (existing) {
    questPanel = existing;
    return questPanel;
  }
  questCanvas = document.createElement('canvas');
  questCanvas.width = 1024;
  questCanvas.height = 512;
  questContext = questCanvas.getContext('2d');
  questTexture = new THREE.CanvasTexture(questCanvas);
  questTexture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: questTexture, transparent: true, depthWrite: false, toneMapped: false });
  questPanel = new THREE.Sprite(material);
  questPanel.name = 'PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL';
  questPanel.scale.set(1.45, 0.72, 1);
  questPanel.visible = false;
  questPanel.renderOrder = 9359;
  window.__SVR_SCENE__.add(questPanel);
  return questPanel;
}

function placeQuestPanel() {
  const panel = ensureQuestPanel();
  if (!panel) return false;
  const table = tableAuthority();
  if (!table) return false;
  table.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(table);
  if (box.isEmpty()) return false;
  const center = new THREE.Vector3();
  box.getCenter(center);
  panel.position.set(center.x, box.max.y + 0.82, center.z - 0.08);
  return true;
}

function drawQuestPanel(snapshot, seconds) {
  const panel = ensureQuestPanel();
  if (!panel || !questContext || !questCanvas) return false;
  const winner = primaryWinner(snapshot);
  const ctx = questContext;
  ctx.clearRect(0, 0, questCanvas.width, questCanvas.height);
  ctx.fillStyle = 'rgba(2,5,14,.94)';
  ctx.fillRect(20, 20, 984, 472);
  ctx.strokeStyle = '#ffd98a';
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, 976, 464);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd98a';
  ctx.font = '900 74px system-ui';
  ctx.fillText(winner ? `${winner.name} WINS ${money(winner.amount)}` : 'HAND COMPLETE', 512, 98, 930);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px system-ui';
  ctx.fillText(winner?.label || 'Pot settled', 512, 175, 930);
  ctx.fillStyle = '#7ffcff';
  ctx.font = '800 42px system-ui';
  ctx.fillText(`CARDS ${winner?.holeCards?.join(' ') || '—'}   BOARD ${snapshot.board.join(' ') || '—'}`, 512, 252, 940);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px system-ui';
  ctx.fillText(`SETTLED POT ${money(snapshot.settledPot)}   TABLE CHIPS ${snapshot.totalStacks.toLocaleString()}`, 512, 330, 940);
  ctx.fillStyle = runtime.continuous ? '#ffd98a' : '#c8d5e5';
  ctx.font = '850 38px system-ui';
  ctx.fillText(runtime.continuous ? `NEXT HAND IN ${seconds}s` : 'CONTINUOUS PLAY PAUSED', 512, 414, 900);
  questTexture.needsUpdate = true;
  placeQuestPanel();
  panel.visible = true;
  runtime.panelUpdates += 1;
  return true;
}

function updateAndroidPanel(snapshot, seconds) {
  const existing = document.getElementById('svr357Showdown');
  const winner = primaryWinner(snapshot);
  if (existing && !existing.hidden) {
    let line = document.getElementById('svr359ContinuousLine');
    if (!line) {
      line = document.createElement('div');
      line.id = 'svr359ContinuousLine';
      line.style.cssText = 'margin:10px 0;color:#7ffcff;font:900 11px/1.3 system-ui';
      existing.querySelector('#svr357ResultActions')?.before(line);
    }
    line.textContent = runtime.continuous ? `Continuous play: next hand in ${seconds}s` : 'Continuous play paused';
    runtime.panelUpdates += 1;
    return true;
  }
  const panel = ensureAndroidFallback();
  if (!panel) return false;
  panel.hidden = false;
  panel.querySelector('#svr359AndroidWinner').textContent = winner
    ? `${winner.name} wins ${money(winner.amount)} with ${winner.label}`
    : `Settled pot ${money(snapshot.settledPot)}`;
  panel.querySelector('#svr359AndroidCards').textContent = `Cards ${winner?.holeCards?.join(' ') || '—'} • Board ${snapshot.board.join(' ') || '—'}`;
  panel.querySelector('#svr359AndroidCountdown').textContent = runtime.continuous ? `Next hand in ${seconds}s` : 'Continuous play paused';
  runtime.panelUpdates += 1;
  return true;
}

function hidePanels() {
  if (questPanel) questPanel.visible = false;
  const android = document.getElementById('svr359AndroidResult');
  if (android) android.hidden = true;
  const line = document.getElementById('svr359ContinuousLine');
  if (line) line.textContent = '';
}

function cancelCountdown() {
  if (countdownTimer) clearTimeout(countdownTimer);
  countdownTimer = 0;
  scheduledHand = -1;
  deadline = 0;
  runtime.countdownSeconds = null;
}

function nextHand(source = 'manual') {
  cancelCountdown();
  const previous = Number(state.handNo || 0);
  let accepted = false;
  try {
    if (typeof window.SVR_POKER_NEXT_HAND === 'function') accepted = window.SVR_POKER_NEXT_HAND() !== false;
    else accepted = startHand() !== false;
  } catch {
    accepted = startHand() !== false;
  }
  if (accepted) {
    if (source === 'auto') runtime.autoNextHands += 1;
    else runtime.manualNextHands += 1;
  }
  hidePanels();
  window.SVR_PHASE359_LAST_NEXT_HAND = {
    source,
    accepted,
    previous,
    current: Number(state.handNo || 0),
    at: new Date().toISOString()
  };
  return accepted;
}

function scheduleContinuous(snapshot) {
  if (!runtime.continuous || scheduledHand === snapshot.handNo) return;
  cancelCountdown();
  scheduledHand = snapshot.handNo;
  deadline = Date.now() + CONTINUOUS_DELAY_MS;
  countdownTimer = window.setTimeout(() => {
    if (runtime.continuous && String(state.phase || '').toLowerCase() === 'showdown' && Number(state.handNo || 0) === scheduledHand) {
      nextHand('auto');
    }
  }, CONTINUOUS_DELAY_MS);
}

function sync() {
  if (!ACTIVE) return;
  const phase = String(state.phase || 'idle').toLowerCase();
  if (phase !== 'showdown' || !(state.winners || []).length || Number(state.settledPot || 0) <= 0) {
    if (scheduledHand >= 0 && Number(state.handNo || 0) !== scheduledHand) cancelCountdown();
    if (phase !== 'showdown') hidePanels();
    return;
  }
  const snapshot = winnerSnapshot();
  const winner = primaryWinner(snapshot);
  runtime.lastShowdownHand = snapshot.handNo;
  runtime.lastWinner = winner?.name || null;
  runtime.lastAmount = winner?.amount || 0;
  runtime.lastHandLabel = winner?.label || null;
  runtime.lastHoleCards = winner?.holeCards || [];
  runtime.lastBoard = snapshot.board;
  scheduleContinuous(snapshot);
  const seconds = runtime.continuous && deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;
  runtime.countdownSeconds = runtime.continuous ? seconds : null;
  if (detected === 'quest') drawQuestPanel(snapshot, seconds);
  else updateAndroidPanel(snapshot, seconds);
}

function gameplayAudit() {
  const snapshot = winnerSnapshot();
  const input = inputAudit();
  const table = tableAudit();
  const platformQa = detected === 'quest'
    ? window.SVR_PHASE358_QA?.() || null
    : window.SVR_PHASE357_QA?.() || null;
  const settlementReady = typeof window.SVR_POKER_NEXT_HAND === 'function'
    && typeof window.SVR_POKER_ACTION === 'function'
    && typeof window.SVR_RUN_PHASE336_POKER_AUDIT === 'function';
  const result = {
    build: BUILD,
    platform: detected,
    active: ACTIVE,
    continuous: runtime.continuous,
    table,
    input,
    platformQa,
    settlementReady,
    phase: snapshot.phase,
    handNo: snapshot.handNo,
    winner: primaryWinner(snapshot),
    board: snapshot.board,
    settledPot: snapshot.settledPot,
    totalStacks: snapshot.totalStacks,
    fundedPlayers: snapshot.fundedPlayers,
    panel: detected === 'quest'
      ? Boolean(window.__SVR_SCENE__?.getObjectByName?.('PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL'))
      : Boolean(document.getElementById('svr357Showdown') || document.getElementById('svr359AndroidResult')),
    checkedAt: new Date().toISOString()
  };
  result.pass = ACTIVE
    && table.pass
    && input.pass
    && settlementReady
    && result.totalStacks === 6000
    && result.fundedPlayers >= 2;
  runtime.checkedAt = result.checkedAt;
  window.SVR_PHASE359_QA_STATE = result;
  return result;
}

function toggleContinuous(value) {
  runtime.continuous = value === undefined ? !runtime.continuous : Boolean(value);
  if (!runtime.continuous) cancelCountdown();
  else sync();
  return runtime.continuous;
}

function install() {
  if (!ACTIVE || runtime.installedAt) return;
  runtime.installedAt = new Date().toISOString();
  window.SVR_PHASE359_STATE = runtime;
  window.SVR_PHASE359_QA = gameplayAudit;
  window.SVR_PHASE359_NEXT_HAND = () => nextHand('manual');
  window.SVR_PHASE359_TOGGLE_CONTINUOUS = toggleContinuous;
  window.SVR_PHASE359_WINNER = winnerSnapshot;
  interval = window.setInterval(sync, 250);
  [400, 1200, 2800].forEach((delay) => setTimeout(() => {
    if (detected === 'quest') ensureQuestPanel();
    else ensureAndroidFallback();
    sync();
  }, delay));
  window.addEventListener('beforeunload', () => {
    if (interval) clearInterval(interval);
    cancelCountdown();
  }, { once: true });
}

install();
