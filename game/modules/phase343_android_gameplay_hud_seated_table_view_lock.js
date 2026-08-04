import * as THREE from 'three';
import { state, players } from './phase336_authoritative_engine.js';

const BUILD = 'PHASE-343-ANDROID-GAMEPLAY-HUD-SEATED-TABLE-VIEW-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')
  || /\/game\/android\.html$/i.test(location.pathname);

let installed = false;
let legacySit = null;
let legacyLobby = null;
let seated = false;
let drawerOpen = false;
let lastSeatAt = 0;
let observer = null;
let syncTimer = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const scene = () => window.__SVR_SCENE__ || null;
const camera = () => window.__SVR_RENDERER__?.xr?.isPresenting
  ? window.__SVR_RENDERER__.xr.getCamera(window.__SVR_CAMERA__)
  : window.__SVR_CAMERA__ || null;
const rig = () => window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
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
  const table = tableObject();
  if (!table) return null;
  table.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(table);
  if (box.isEmpty()) return null;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const canonical = window.SVR_PHASE341_TABLE_LAYOUT;
  return {
    table,
    box,
    size,
    center: canonical?.center ? new THREE.Vector3(canonical.center.x, canonical.center.y || center.y, canonical.center.z) : center,
    width: canonical?.size?.x || Math.max(2.2, Math.min(size.x * 0.94, 4.1)),
    depth: canonical?.size?.z || Math.max(1.18, Math.min(size.z * 0.92, 2.25)),
    top: canonical?.top || box.max.y
  };
}

function installCss() {
  if ($('#svr343-style')) return;
  const style = document.createElement('style');
  style.id = 'svr343-style';
  style.textContent = `
body.svr343-android{--svr343-cyan:#7ffcff;--svr343-gold:#ffd98a;--svr343-ink:rgba(3,7,15,.82)}
body.svr343-android #svr326Turn,
body.svr343-android #svr326Cards,
body.svr343-android #svr326Status,
body.svr343-android #svr326Raise,
body.svr343-android .svr326Small{display:none!important;opacity:0!important;pointer-events:none!important}
body.svr343-android #svr326Root{display:block!important;position:fixed!important;inset:0!important;z-index:2147483000!important;pointer-events:none!important;font-family:system-ui,Arial,sans-serif!important;color:#fff!important}
body.svr343-android #svr326Root *{box-sizing:border-box}
body.svr343-android #svr326Move,
body.svr343-android #svr326Look{width:104px!important;height:104px!important;bottom:max(16px,env(safe-area-inset-bottom))!important;border:1.5px solid rgba(127,252,255,.72)!important;background:radial-gradient(circle at 50% 50%,rgba(0,34,48,.46),rgba(0,5,14,.34))!important;box-shadow:0 0 22px rgba(127,252,255,.20),inset 0 0 26px rgba(127,252,255,.08)!important;pointer-events:auto!important}
body.svr343-android #svr326Move{left:14px!important}
body.svr343-android #svr326Look{right:14px!important}
body.svr343-android .svr326Knob{left:34px!important;top:34px!important;width:36px!important;height:36px!important;background:rgba(127,252,255,.84)!important;box-shadow:0 0 22px rgba(127,252,255,.62)!important}
body.svr343-android .svr326Label{bottom:-25px!important;font-size:11px!important;letter-spacing:.14em!important}
body.svr343-android .svr326Actions{position:absolute!important;left:50%!important;right:auto!important;bottom:144px!important;transform:translateX(-50%)!important;width:min(58vw,330px)!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;pointer-events:auto!important}
body.svr343-android .svr326Actions button{height:50px!important;min-width:0!important;border-radius:15px!important;border:1px solid rgba(255,217,138,.68)!important;background:linear-gradient(180deg,rgba(11,15,26,.92),rgba(3,6,13,.92))!important;color:#fff!important;font:900 12px/1.05 system-ui,Arial!important;letter-spacing:.025em!important;padding:5px!important;box-shadow:0 8px 24px rgba(0,0,0,.34)!important;pointer-events:auto!important;touch-action:manipulation!important}
body.svr343-android .svr326Actions button.ready,
body.svr343-android .svr326Actions button[data-ui="seat"]{border-color:rgba(127,252,255,.88)!important;background:linear-gradient(180deg,rgba(0,82,92,.86),rgba(0,34,48,.88))!important;box-shadow:0 0 20px rgba(127,252,255,.22)!important}
body.svr343-android .svr326Actions button:disabled{opacity:.38!important;filter:saturate(.5)!important}
#svr343Hud{position:fixed;inset:0;z-index:2147483050;pointer-events:none;color:#fff;font-family:system-ui,Arial,sans-serif}
#svr343Hud *{box-sizing:border-box}
#svr343Top{position:absolute;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;width:min(92vw,520px);pointer-events:none}
#svr343Status{flex:1;min-width:0;border:1px solid rgba(127,252,255,.58);border-radius:999px;background:rgba(0,0,0,.70);backdrop-filter:blur(10px);padding:8px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 8px 28px rgba(0,0,0,.32)}
#svr343State{font:950 13px/1 system-ui;letter-spacing:.08em;white-space:nowrap}
#svr343Meta{font:800 10px/1 system-ui;color:#d8fbff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#svr343Recenter{width:38px;height:38px;border-radius:50%;border:1px solid rgba(127,252,255,.68);background:rgba(0,20,30,.76);color:#fff;font-size:18px;font-weight:950;pointer-events:auto;touch-action:manipulation}
#svr343Community{position:absolute;top:max(62px,calc(env(safe-area-inset-top) + 52px));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid rgba(255,217,138,.48);border-radius:15px;background:rgba(0,0,0,.48);backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.24)}
.svr343CommunityCard{width:34px;height:48px;border-radius:6px;display:grid;place-items:center;background:linear-gradient(145deg,#f9f4e7,#ded7c8);color:#111;border:1px solid rgba(0,0,0,.78);font:1000 15px/1 system-ui;box-shadow:0 3px 10px rgba(0,0,0,.28)}
.svr343CommunityCard.empty{background:linear-gradient(145deg,rgba(28,20,64,.90),rgba(4,13,28,.95));border-color:rgba(127,252,255,.42);color:rgba(255,255,255,.28)}
.svr343CommunityCard.red{color:#aa001c}
#svr343Hole{position:absolute;left:50%;bottom:282px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px 8px 6px 10px;border:1px solid rgba(255,217,138,.58);border-radius:16px;background:rgba(0,0,0,.62);backdrop-filter:blur(9px);box-shadow:0 10px 26px rgba(0,0,0,.30)}
#svr343HoleLabel{font:900 10px/1 system-ui;letter-spacing:.08em;color:#ffd98a;writing-mode:vertical-rl;transform:rotate(180deg)}
.svr343HoleCard{width:42px;height:60px;border-radius:7px;display:grid;place-items:center;background:#f7f2e5;color:#111;border:1.5px solid #111;font:1000 19px/1 system-ui;box-shadow:0 4px 12px rgba(0,0,0,.32)}
.svr343HoleCard.red{color:#aa001c}
.svr343HoleCard.empty{background:linear-gradient(145deg,#17133f,#071426);border-color:#7ffcff;color:rgba(255,255,255,.35)}
#svr343RaiseDrawer{position:absolute;left:50%;bottom:276px;transform:translateX(-50%) translateY(12px);width:min(88vw,420px);border:1px solid rgba(255,217,138,.72);border-radius:18px;background:rgba(2,5,12,.94);backdrop-filter:blur(14px);padding:10px 12px;display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;opacity:0;visibility:hidden;pointer-events:none;transition:.18s ease;box-shadow:0 18px 48px rgba(0,0,0,.56)}
#svr343RaiseDrawer.open{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
#svr343RaiseAmount{font:950 13px/1 system-ui;color:#ffd98a;min-width:74px;text-align:center}
#svr343RaiseSlider{width:100%;accent-color:#ffd98a}
#svr343RaiseConfirm,#svr343RaiseClose{height:38px;border-radius:12px;font:950 11px system-ui;pointer-events:auto;touch-action:manipulation}
#svr343RaiseConfirm{border:1px solid #7ffcff;background:rgba(0,75,84,.82);color:#fff;padding:0 12px}
#svr343RaiseClose{position:absolute;right:6px;top:-34px;width:34px;border:1px solid rgba(255,255,255,.30);background:rgba(0,0,0,.75);color:#fff}
body.svr343-raise-open #svr343Hole{opacity:0;visibility:hidden}
@media (max-height:650px){#svr343Hole{bottom:262px}.svr343HoleCard{width:38px;height:54px}body.svr343-android .svr326Actions{bottom:132px}body.svr343-android #svr326Move,body.svr343-android #svr326Look{width:94px!important;height:94px!important}#svr343RaiseDrawer{bottom:255px}}
@media (orientation:landscape){body.svr343-android .svr326Actions{left:auto!important;right:18px!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;width:220px!important;grid-template-columns:repeat(2,1fr)!important}#svr343Hole{left:20px;bottom:132px;transform:none}#svr343Community{top:14px}#svr343RaiseDrawer{left:auto;right:250px;bottom:20px;transform:none;width:min(44vw,420px)}#svr343RaiseDrawer.open{transform:none}}
`;
  document.head.appendChild(style);
}

function ensureLegacyRoot() {
  const root = $('#svr326Root');
  if (!root) return null;
  $$('#svr326Root').slice(1).forEach((item) => item.remove());
  $$('.svr-stick').forEach((item) => {
    if (!['svr326Move', 'svr326Look'].includes(item.id)) item.remove();
  });
  return root;
}

function buildHud() {
  const root = ensureLegacyRoot();
  if (!root) return false;
  let actions = $('.svr326Actions', root);
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'svr326Actions';
    root.appendChild(actions);
  }
  if (actions.dataset.phase343 !== '1') {
    actions.dataset.phase343 = '1';
    actions.innerHTML = `
      <button type="button" data-phase341-primary="1" data-act="fold">FOLD</button>
      <button type="button" data-ui="seat">SIT</button>
      <button type="button" data-act="check">CHECK</button>
      <button type="button" data-act="call">CALL</button>
      <button type="button" data-ui="raise">RAISE</button>
      <button type="button" data-act="allin">ALL IN</button>`;
  }

  let hud = $('#svr343Hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'svr343Hud';
    hud.innerHTML = `
      <div id="svr343Top">
        <div id="svr343Status"><span id="svr343State">LOBBY</span><span id="svr343Meta">TABLE READY</span></div>
        <button id="svr343Recenter" type="button" aria-label="Recenter table view">↺</button>
      </div>
      <div id="svr343Community" aria-label="Community cards">
        ${Array.from({ length: 5 }, (_, i) => `<div class="svr343CommunityCard empty" data-community="${i}">•</div>`).join('')}
      </div>
      <div id="svr343Hole" aria-label="Your cards"><span id="svr343HoleLabel">YOUR CARDS</span><div class="svr343HoleCard empty" data-hole="0">•</div><div class="svr343HoleCard empty" data-hole="1">•</div></div>
      <div id="svr343RaiseDrawer">
        <button id="svr343RaiseClose" type="button" aria-label="Close raise controls">×</button>
        <span id="svr343RaiseAmount">$0</span>
        <input id="svr343RaiseSlider" type="range" min="50" max="1000" step="50" value="50" aria-label="Raise amount">
        <button id="svr343RaiseConfirm" type="button">RAISE</button>
      </div>`;
    document.body.appendChild(hud);
  }
  bindUi(actions, hud);
  return true;
}

function formatCard(card) {
  if (!card) return '';
  const suit = { S: '♠', H: '♥', D: '♦', C: '♣' }[card.s] || '';
  return `${card.r || '?'}${suit}`;
}

function setCard(element, card) {
  if (!element) return;
  const text = formatCard(card);
  element.textContent = text || '•';
  element.classList.toggle('empty', !text);
  element.classList.toggle('red', /[♥♦]/.test(text));
}

function auditState() {
  try {
    return window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null;
  } catch {
    return null;
  }
}

function currentPlayer(audit) {
  return audit?.players?.find?.((player) => player.name === 'YOU') || audit?.players?.[0] || players?.[0] || null;
}

function legalActions(audit) {
  return new Set(audit?.legalActions || []);
}

function setDrawer(value) {
  drawerOpen = Boolean(value);
  $('#svr343RaiseDrawer')?.classList.toggle('open', drawerOpen);
  document.body.classList.toggle('svr343-raise-open', drawerOpen);
}

function configureRaise(audit) {
  const slider = $('#svr343RaiseSlider');
  if (!slider) return;
  const player = currentPlayer(audit) || { stack: 0, bet: 0 };
  const currentBet = Number(audit?.currentBet ?? state.currentBet ?? 0);
  const minRaise = Math.max(50, Number(audit?.minRaise ?? state.minRaise ?? 50));
  const total = Math.max(currentBet, Number(player.stack || 0) + Number(player.bet || 0));
  const minimum = Math.min(total, Math.max(currentBet + minRaise, minRaise));
  const step = total >= 1000 ? 50 : total >= 200 ? 25 : 5;
  slider.min = String(Math.max(step, minimum || step));
  slider.max = String(Math.max(Number(slider.min), total || Number(slider.min)));
  slider.step = String(step);
  let value = Number(slider.value || slider.min);
  value = Math.max(Number(slider.min), Math.min(Number(slider.max), value));
  slider.value = String(value);
  window.SVR_ANDROID_RAISE_AMOUNT = value;
  const amount = $('#svr343RaiseAmount');
  if (amount) amount.textContent = `$${value.toLocaleString()}`;
  const legacy = $('#svr326RaiseSlider');
  if (legacy) legacy.value = String(value);
}

function syncHud() {
  if (!ACTIVE || !buildHud()) return;
  seated = Boolean(window.SVR_PHASE326_ANDROID_PLAY_STATE?.seated ?? seated);
  const audit = auditState();
  const player = currentPlayer(audit);
  const legal = legalActions(audit);
  const phase = String(audit?.phase || state.phase || 'idle').toUpperCase();
  const waitingHuman = Boolean(audit?.waitingHuman ?? state.waitingHuman);
  const currentBet = Number(audit?.currentBet ?? state.currentBet ?? 0);
  const need = Math.max(0, currentBet - Number(player?.bet || 0));
  const pot = Number(audit?.pot ?? state.pot ?? 0);

  $('#svr343State').textContent = seated ? (waitingHuman ? 'YOUR TURN' : 'SEATED') : 'LOBBY';
  $('#svr343Meta').textContent = seated ? `${phase} • POT $${pot.toLocaleString()}` : 'TAP SIT FOR TABLE VIEW';

  const hole = player?.hand || [];
  $$('.svr343HoleCard').forEach((element, index) => setCard(element, hole[index]));
  $$('.svr343CommunityCard').forEach((element, index) => setCard(element, state.community?.[index]));

  const primary = $('[data-phase341-primary="1"]', $('#svr326Root'));
  if (primary) {
    const next = ['SHOWDOWN', 'IDLE', 'COMPLETE'].includes(phase);
    primary.dataset.act = next ? 'next' : 'fold';
    primary.textContent = next ? 'NEXT HAND' : 'FOLD';
    primary.disabled = seated && !next && legal.size > 0 && !legal.has('fold');
  }

  const seatButton = $('[data-ui="seat"]', $('#svr326Root'));
  if (seatButton) seatButton.textContent = seated ? 'LEAVE' : 'SIT';
  const check = $('[data-act="check"]', $('#svr326Root'));
  const call = $('[data-act="call"]', $('#svr326Root'));
  const allin = $('[data-act="allin"]', $('#svr326Root'));
  const raise = $('[data-ui="raise"]', $('#svr326Root'));
  if (check) check.disabled = !seated || (legal.size > 0 && !legal.has('check'));
  if (call) {
    call.textContent = need ? `CALL $${need.toLocaleString()}` : 'CALL';
    call.disabled = !seated || (legal.size > 0 && !legal.has('call'));
  }
  if (allin) allin.disabled = !seated || (legal.size > 0 && !legal.has('allin'));
  if (raise) raise.disabled = !seated || (legal.size > 0 && !legal.has('raise') && !legal.has('bet'));

  configureRaise(audit);
  window.SVR_PHASE343_STATE = {
    build: BUILD,
    active: true,
    seated,
    phase,
    pot,
    callAmount: need,
    communityCards: state.community?.length || 0,
    holeCards: hole.length,
    drawerOpen,
    checkedAt: new Date().toISOString()
  };
}

function positionAtTable({ callLegacy = false } = {}) {
  const metrics = tableMetrics();
  const cam = camera();
  if (!metrics || !cam) return false;
  if (callLegacy && typeof legacySit === 'function') {
    try { legacySit(); } catch {}
  }
  seated = true;
  lastSeatAt = performance.now();
  const distance = Math.max(1.10, Math.min(1.55, metrics.depth * 0.70));
  const position = new THREE.Vector3(metrics.center.x, metrics.top + 0.68, metrics.center.z + distance);
  const target = new THREE.Vector3(metrics.center.x, metrics.top + 0.035, metrics.center.z - metrics.depth * 0.03);
  const playerRig = rig();
  try {
    if (playerRig?.setPlayerPose) {
      playerRig.setPlayerPose(position.x, 0, position.z);
    } else {
      cam.position.copy(position);
    }
    cam.lookAt(target);
  } catch {}
  document.body.classList.add('svr343-seated');
  [50, 180, 520].forEach((delay) => setTimeout(() => {
    try {
      const activeCamera = camera();
      const activeRig = rig();
      if (activeRig?.setPlayerPose) activeRig.setPlayerPose(position.x, 0, position.z);
      else activeCamera?.position.copy(position);
      activeCamera?.lookAt(target);
    } catch {}
  }, delay));
  syncHud();
  return true;
}

function leaveTable() {
  try { legacyLobby?.(); } catch {}
  seated = false;
  document.body.classList.remove('svr343-seated');
  setDrawer(false);
  syncHud();
  return true;
}

function bindUi(actions, hud) {
  if (actions.dataset.phase343Bound !== '1') {
    actions.dataset.phase343Bound = '1';
    actions.addEventListener('pointerdown', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.ui === 'seat') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (seated) leaveTable();
        else positionAtTable({ callLegacy: true });
      } else if (button.dataset.ui === 'raise') {
        event.preventDefault();
        event.stopImmediatePropagation();
        configureRaise(auditState());
        setDrawer(true);
      }
    }, true);
  }
  if (hud.dataset.phase343Bound !== '1') {
    hud.dataset.phase343Bound = '1';
    $('#svr343Recenter', hud)?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      positionAtTable({ callLegacy: !seated });
    }, { passive: false });
    $('#svr343RaiseClose', hud)?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setDrawer(false);
    }, { passive: false });
    $('#svr343RaiseSlider', hud)?.addEventListener('input', (event) => {
      const value = Number(event.target.value || 0);
      window.SVR_ANDROID_RAISE_AMOUNT = value;
      const amount = $('#svr343RaiseAmount');
      if (amount) amount.textContent = `$${value.toLocaleString()}`;
      const legacy = $('#svr326RaiseSlider');
      if (legacy) legacy.value = String(value);
    });
    $('#svr343RaiseConfirm', hud)?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const value = Number($('#svr343RaiseSlider', hud)?.value || window.SVR_ANDROID_RAISE_AMOUNT || 0);
      window.SVR_ANDROID_RAISE_AMOUNT = value;
      try { window.SVR_POKER_RAISE_TO?.(value); } catch (error) { window.SVR_PHASE343_LAST_ERROR = String(error?.message || error); }
      setDrawer(false);
      setTimeout(syncHud, 0);
    }, { passive: false });
  }
}

function rectsOverlap(a, b) {
  return a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function qa() {
  const metrics = tableMetrics();
  const cam = camera();
  const camPos = new THREE.Vector3();
  cam?.getWorldPosition?.(camPos);
  const center = metrics?.center || new THREE.Vector3();
  const tableDistance = metrics ? Math.hypot(camPos.x - center.x, camPos.z - center.z) : null;
  if (cam) {
    cam.updateMatrixWorld?.(true);
    cam.updateProjectionMatrix?.();
  }
  const projected = metrics && cam ? center.clone().project(cam) : null;
  const actions = $('.svr326Actions')?.getBoundingClientRect?.();
  const move = $('#svr326Move')?.getBoundingClientRect?.();
  const look = $('#svr326Look')?.getBoundingClientRect?.();
  const hole = $('#svr343Hole')?.getBoundingClientRect?.();
  const result = {
    build: BUILD,
    active: ACTIVE,
    controls: {
      roots: $$('#svr326Root').length,
      move: $$('#svr326Move').length,
      look: $$('#svr326Look').length
    },
    hud: {
      communitySlots: $$('.svr343CommunityCard').length,
      holeSlots: $$('.svr343HoleCard').length,
      actionButtons: $$('.svr326Actions button').length,
      raiseDrawer: Boolean($('#svr343RaiseDrawer'))
    },
    overlap: {
      actionsMove: rectsOverlap(actions, move),
      actionsLook: rectsOverlap(actions, look),
      actionsHole: rectsOverlap(actions, hole)
    },
    table: {
      available: Boolean(metrics),
      cameraDistance: tableDistance == null ? null : +tableDistance.toFixed(3),
      centeredInView: projected ? Math.abs(projected.x) <= 0.70 && Math.abs(projected.y) <= 0.72 && projected.z >= -1 && projected.z <= 1 : false,
      visibleCommunity3D: Boolean(scene()?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT'))
    },
    poker: {
      phase: state.phase,
      communityCards: state.community?.length || 0,
      holeCards: players?.[0]?.hand?.length || 0
    },
    seated,
    lastSeatAt,
    checkedAt: new Date().toISOString()
  };
  result.pass = result.controls.roots === 1
    && result.controls.move === 1
    && result.controls.look === 1
    && result.hud.communitySlots === 5
    && result.hud.holeSlots === 2
    && !result.overlap.actionsMove
    && !result.overlap.actionsLook
    && !result.overlap.actionsHole
    && result.table.available;
  window.SVR_PHASE343_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || installed) return;
  const root = ensureLegacyRoot();
  if (!root) {
    setTimeout(install, 180);
    return;
  }
  installed = true;
  legacySit = window.SVR_ANDROID_SIT_TO_TABLE;
  legacyLobby = window.SVR_ANDROID_LOBBY_MODE;
  installCss();
  document.body.classList.add('svr343-android');
  buildHud();
  window.SVR_ANDROID_SIT_TO_TABLE = () => positionAtTable({ callLegacy: true });
  window.SVR_ANDROID_CENTER_PLAYER = () => positionAtTable({ callLegacy: !seated });
  window.SVR_PHASE343_SIT = () => positionAtTable({ callLegacy: true });
  window.SVR_PHASE343_LEAVE = leaveTable;
  window.SVR_PHASE343_QA = qa;
  window.addEventListener('svr:poker-state', () => setTimeout(syncHud, 0));
  window.addEventListener('resize', () => setTimeout(syncHud, 80));
  observer = new MutationObserver(() => buildHud());
  observer.observe(document.body, { childList: true, subtree: true });
  [0, 240, 700, 1500, 3000].forEach((delay) => setTimeout(syncHud, delay));
  syncTimer = window.setInterval(syncHud, 500);
  window.SVR_PHASE343_RUNTIME = { build: BUILD, active: true, installedAt: new Date().toISOString() };
}

[120, 500, 1200, 2400].forEach((delay) => setTimeout(install, delay));
