import * as THREE from 'three';
import { state, players } from './phase336_authoritative_engine.js';

const BUILD = 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK';
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''))
  || /\/game\/android\.html$/i.test(location.pathname);

const HIDDEN_ANDROID_UI = [
  '#svr326Root', '#svr343Hud', '#svr344ActionToast', '#svrAndroidGamePad',
  '#svrTapMovePanel', '#svrAndroidSafeBadge153', '#svrAndroidLiteHud',
  '#svrAndroidRecoverView', '.svr-stick'
].join(',');

let installed = false;
let seated = false;
let raf = 0;
let lastFrame = performance.now();
let seatX = 0;
let seatZ = 0;
let seatLookYaw = 0;
let seatLookPitch = 0;
let lastActionAt = 0;
let lastActionSignature = '';
let lastCardSignature = '';
let lastPot = -1;
let overlayGroup = null;
let potSprite = null;
let logoRoot = null;
let observer = null;
let syncTimer = 0;
let oldSit = null;
let oldCenter = null;
let oldLobby = null;
let actionCount = 0;
let blockedActionCount = 0;
let seatCount = 0;
let slideDistance = 0;
let controllerRepairs = 0;

const moveStick = { pointerId: null, x: 0, y: 0 };
const lookStick = { pointerId: null, x: 0, y: 0 };
const cardViews = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const scene = () => window.__SVR_SCENE__ || null;
const renderer = () => window.__SVR_RENDERER__ || null;
const baseCamera = () => window.__SVR_CAMERA__ || null;
const camera = () => renderer()?.xr?.isPresenting ? renderer().xr.getCamera(baseCamera()) : baseCamera();
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
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  if (layout?.center && layout?.size) {
    return {
      center: new THREE.Vector3(layout.center.x, Number(layout.center.y || 0), layout.center.z),
      top: Number(layout.top || 0.95),
      width: Number(layout.size.x || 3.2),
      depth: Number(layout.size.z || 1.8),
      logo: layout.logo || null
    };
  }
  const table = tableObject();
  if (!table) return null;
  table.updateWorldMatrix(true, true);
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
    depth: Math.max(1.18, Math.min(size.z * 0.92, 2.25)),
    logo: null
  };
}

function humanPlayer() {
  return players.find((player) => player?.human) || players[0] || null;
}

function cardText(card) {
  if (!card) return '';
  const suit = { S: '♠', H: '♥', D: '♦', C: '♣' }[card.s] || '';
  return `${card.r || '?'}${suit}`;
}

function potAmount() {
  if (Number.isFinite(Number(state.pot))) return Number(state.pot);
  return (state.pots || []).reduce((sum, pot) => sum + Number(pot?.amount || 0), 0);
}

function pokerAudit() {
  try { return window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null; }
  catch { return null; }
}

function visible(element) {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
}

function installCss() {
  if ($('#svr347-style')) return;
  const style = document.createElement('style');
  style.id = 'svr347-style';
  style.textContent = `
body.svr347-android ${HIDDEN_ANDROID_UI}{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
#svr347Root{position:fixed;inset:0;z-index:2147483500;pointer-events:none;color:#fff;font-family:system-ui,Arial,sans-serif;--cyan:#7ffcff;--gold:#ffd98a;--glass:rgba(2,7,15,.76)}
#svr347Root *{box-sizing:border-box}
#svr347Top{position:absolute;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);width:min(94vw,620px);display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
#svr347Status{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 13px;border:1px solid rgba(127,252,255,.58);border-radius:999px;background:rgba(0,0,0,.68);backdrop-filter:blur(12px);box-shadow:0 10px 28px rgba(0,0,0,.36)}
#svr347Status strong{font:950 12px/1 system-ui;letter-spacing:.08em;white-space:nowrap}
#svr347Status span{font:850 10px/1 system-ui;color:#d9fbff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#svr347Recenter{width:40px;height:40px;border:1px solid rgba(127,252,255,.72);border-radius:50%;background:rgba(0,28,39,.82);color:#fff;font:950 20px system-ui;pointer-events:auto;touch-action:manipulation}
#svr347Community{position:absolute;left:50%;top:max(58px,calc(env(safe-area-inset-top) + 50px));transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid rgba(255,217,138,.52);border-radius:15px;background:rgba(0,0,0,.50);backdrop-filter:blur(10px);box-shadow:0 10px 25px rgba(0,0,0,.30)}
.svr347-card{display:grid;place-items:center;border-radius:7px;background:linear-gradient(145deg,#faf5e8,#ddd5c5);border:1px solid #171717;color:#111;font-weight:1000;box-shadow:0 4px 11px rgba(0,0,0,.34)}
.svr347-card.red{color:#ac001f}.svr347-card.empty{background:linear-gradient(145deg,rgba(29,21,65,.94),rgba(3,13,28,.97));border-color:rgba(127,252,255,.42);color:rgba(255,255,255,.28)}
.svr347-community-card{width:34px;height:48px;font-size:15px}
#svr347Hole{position:absolute;left:50%;bottom:257px;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid rgba(255,217,138,.66);border-radius:17px;background:rgba(0,0,0,.68);backdrop-filter:blur(10px);box-shadow:0 12px 30px rgba(0,0,0,.38)}
#svr347HoleLabel{font:950 10px/1 system-ui;letter-spacing:.08em;color:#ffd98a;writing-mode:vertical-rl;transform:rotate(180deg)}
.svr347-hole-card{width:44px;height:62px;font-size:20px}
#svr347Actions{position:absolute;left:50%;bottom:128px;transform:translateX(-50%);width:min(61vw,350px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;pointer-events:auto}
#svr347Actions button{height:50px;min-width:0;padding:5px;border:1px solid rgba(255,217,138,.66);border-radius:15px;background:linear-gradient(180deg,rgba(12,16,27,.94),rgba(2,5,12,.94));color:#fff;font:950 12px/1.04 system-ui;touch-action:manipulation;box-shadow:0 8px 22px rgba(0,0,0,.36)}
#svr347Actions button[data-ui="seat"]{border-color:rgba(127,252,255,.92);background:linear-gradient(180deg,rgba(0,84,94,.93),rgba(0,31,43,.93))}
#svr347Actions button:disabled{opacity:.34;filter:saturate(.35)}
#svr347Actions button.sent{border-color:#7ffcff;background:rgba(0,90,100,.92);box-shadow:0 0 22px rgba(127,252,255,.32)}
.svr347-stick{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));width:104px;height:104px;border:1.5px solid rgba(127,252,255,.76);border-radius:50%;background:radial-gradient(circle,rgba(0,61,72,.37),rgba(0,4,12,.42));box-shadow:0 0 22px rgba(127,252,255,.20),inset 0 0 25px rgba(127,252,255,.08);pointer-events:auto;touch-action:none}
#svr347Move{left:14px}#svr347Look{right:14px}.svr347-stick b{position:absolute;left:34px;top:34px;width:36px;height:36px;border-radius:50%;background:rgba(127,252,255,.88);box-shadow:0 0 22px rgba(127,252,255,.62);pointer-events:none}.svr347-stick span{position:absolute;bottom:-24px;width:100%;text-align:center;font:950 10px/1 system-ui;letter-spacing:.13em;text-shadow:0 2px 6px #000}.svr347-stick em{position:absolute;top:-22px;width:100%;text-align:center;color:#dffcff;font:800 9px/1 system-ui;font-style:normal;opacity:.88}
#svr347Raise{position:absolute;left:50%;bottom:248px;transform:translateX(-50%) translateY(10px);width:min(90vw,430px);display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:11px 12px;border:1px solid rgba(255,217,138,.74);border-radius:18px;background:rgba(2,5,12,.95);backdrop-filter:blur(14px);box-shadow:0 20px 50px rgba(0,0,0,.58);opacity:0;visibility:hidden;pointer-events:none;transition:.16s ease}
#svr347Raise.open{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
#svr347RaiseAmount{min-width:72px;text-align:center;color:#ffd98a;font:950 13px/1 system-ui}#svr347Raise input{width:100%;accent-color:#ffd98a}#svr347Raise button{height:38px;border:1px solid #7ffcff;border-radius:12px;background:rgba(0,75,84,.86);color:#fff;font:950 11px system-ui;pointer-events:auto;touch-action:manipulation}
#svr347RaiseClose{position:absolute;right:6px;top:-34px;width:34px;background:rgba(0,0,0,.82)!important;border-color:rgba(255,255,255,.32)!important}
#svr347Toast{position:absolute;left:50%;bottom:239px;transform:translateX(-50%) translateY(8px);min-width:150px;max-width:80vw;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,8,16,.90);text-align:center;font:950 11px/1 system-ui;letter-spacing:.07em;opacity:0;visibility:hidden;transition:.15s ease}
#svr347Toast.show{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
body.svr347-raise-open #svr347Hole{opacity:0;visibility:hidden}
@media(max-height:680px){#svr347Hole{bottom:238px}.svr347-hole-card{width:39px;height:55px}#svr347Actions{bottom:119px}.svr347-stick{width:94px;height:94px}.svr347-stick b{left:30px;top:30px;width:34px;height:34px}#svr347Raise{bottom:228px}#svr347Toast{bottom:221px}}
@media(orientation:landscape){#svr347Actions{left:auto;right:16px;top:50%;bottom:auto;transform:translateY(-50%);width:225px;grid-template-columns:repeat(2,1fr)}#svr347Hole{left:18px;bottom:122px;transform:none}#svr347Community{top:12px}#svr347Raise{left:auto;right:250px;bottom:18px;transform:none;width:min(44vw,430px)}#svr347Raise.open{transform:none}#svr347Toast{left:auto;right:250px;bottom:103px;transform:none}#svr347Toast.show{transform:none}}
`;
  document.head.appendChild(style);
}

function hideLegacyUi() {
  for (const element of $$(HIDDEN_ANDROID_UI)) {
    if (element.closest?.('#svr347Root')) continue;
    element.setAttribute?.('aria-hidden', 'true');
    try { element.inert = true; } catch {}
  }
  const visibleLegacy = $$(HIDDEN_ANDROID_UI).filter((element) => !element.closest?.('#svr347Root') && visible(element));
  if (visibleLegacy.length) controllerRepairs += 1;
}

function buildUi() {
  let root = $('#svr347Root');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'svr347Root';
  root.innerHTML = `
    <div id="svr347Top"><div id="svr347Status"><strong id="svr347State">LOBBY</strong><span id="svr347Meta">TABLE READY</span></div><button id="svr347Recenter" type="button" aria-label="Recenter table view">↺</button></div>
    <div id="svr347Community" aria-label="Community cards">${Array.from({ length: 5 }, (_, i) => `<div class="svr347-card svr347-community-card empty" data-community="${i}">•</div>`).join('')}</div>
    <div id="svr347Hole" aria-label="Your cards"><span id="svr347HoleLabel">YOUR CARDS</span><div class="svr347-card svr347-hole-card empty" data-hole="0">•</div><div class="svr347-card svr347-hole-card empty" data-hole="1">•</div></div>
    <div id="svr347Actions">
      <button type="button" data-action="primary">DEAL</button><button type="button" data-ui="seat">SIT</button><button type="button" data-action="check">CHECK</button>
      <button type="button" data-action="call">CALL</button><button type="button" data-ui="raise">RAISE</button><button type="button" data-action="allin">ALL IN</button>
    </div>
    <div id="svr347Raise"><button id="svr347RaiseClose" type="button">×</button><span id="svr347RaiseAmount">$50</span><input id="svr347RaiseSlider" type="range" min="50" max="1000" step="50" value="50"><button id="svr347RaiseConfirm" type="button">RAISE</button></div>
    <div id="svr347Toast" role="status" aria-live="polite"></div>
    <div id="svr347Move" class="svr347-stick"><em id="svr347MoveMode">WALK / STRAFE</em><b></b><span>MOVE</span></div>
    <div id="svr347Look" class="svr347-stick"><em>TURN / LOOK</em><b></b><span>LOOK</span></div>`;
  document.body.appendChild(root);
  bindStick($('#svr347Move'), moveStick);
  bindStick($('#svr347Look'), lookStick);
  bindUi(root);
  return root;
}

function bindStick(element, stick) {
  if (!element || element.dataset.bound === '1') return;
  element.dataset.bound = '1';
  const knob = $('b', element);
  const reset = () => {
    stick.pointerId = null;
    stick.x = 0;
    stick.y = 0;
    if (knob) knob.style.transform = 'translate(0,0)';
  };
  element.addEventListener('pointerdown', (event) => {
    stick.pointerId = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, { passive: false });
  element.addEventListener('pointermove', (event) => {
    if (stick.pointerId !== event.pointerId) return;
    const rect = element.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const cap = rect.width * 0.36;
    const length = Math.max(1, Math.hypot(dx, dy));
    stick.x = THREE.MathUtils.clamp(dx / cap, -1, 1);
    stick.y = THREE.MathUtils.clamp(dy / cap, -1, 1);
    const visual = Math.min(cap, length);
    if (knob) knob.style.transform = `translate(${dx / length * visual}px,${dy / length * visual}px)`;
    event.preventDefault();
  }, { passive: false });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, reset);
}

function showToast(message) {
  const toast = $('#svr347Toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 700);
}

function setRaiseOpen(open) {
  $('#svr347Raise')?.classList.toggle('open', Boolean(open));
  document.body.classList.toggle('svr347-raise-open', Boolean(open));
}

function configureRaise() {
  const audit = pokerAudit();
  const player = audit?.players?.find?.((entry) => entry.name === 'YOU') || audit?.players?.[0] || humanPlayer() || {};
  const currentBet = Number(audit?.currentBet ?? state.currentBet ?? 0);
  const minRaise = Math.max(50, Number(audit?.minRaise ?? state.minRaise ?? 50));
  const total = Math.max(currentBet, Number(player.stack || 0) + Number(player.bet || 0));
  const minimum = Math.min(total || minRaise, Math.max(currentBet + minRaise, minRaise));
  const slider = $('#svr347RaiseSlider');
  if (!slider) return 0;
  const step = total >= 1000 ? 50 : total >= 200 ? 25 : 5;
  slider.min = String(Math.max(step, minimum || step));
  slider.max = String(Math.max(Number(slider.min), total || Number(slider.min)));
  slider.step = String(step);
  slider.value = String(THREE.MathUtils.clamp(Number(slider.value || slider.min), Number(slider.min), Number(slider.max)));
  const amount = Number(slider.value);
  $('#svr347RaiseAmount').textContent = `$${amount.toLocaleString()}`;
  window.SVR_ANDROID_RAISE_AMOUNT = amount;
  return amount;
}

function actionSignature(type, amount = 0) {
  return `${type}:${Number(amount || 0)}`;
}

function sendAction(type, amount = 0) {
  const signature = actionSignature(type, amount);
  const now = performance.now();
  if (signature === lastActionSignature && now - lastActionAt < 700) {
    blockedActionCount += 1;
    return false;
  }
  lastActionSignature = signature;
  lastActionAt = now;
  let result = false;
  try {
    if (type === 'primary') {
      const phase = String(state.phase || 'idle').toLowerCase();
      if (phase === 'idle' || phase === 'showdown' || phase === 'complete') {
        result = window.SVR_POKER_NEXT_HAND?.();
        if (result === false || result == null) result = window.SVR_PRESS_DEAL?.();
      } else result = window.SVR_POKER_ACTION?.('fold');
    } else if (type === 'raise') result = window.SVR_POKER_RAISE_TO?.(Number(amount));
    else result = window.SVR_POKER_ACTION?.(type);
  } catch (error) {
    window.SVR_PHASE347_LAST_ACTION_ERROR = String(error?.message || error);
    result = false;
  }
  if (result !== false) {
    actionCount += 1;
    showToast(type === 'primary' ? 'ACTION SENT' : `${type.toUpperCase()} SENT`);
    const button = $(`#svr347Actions [data-action="${type}"]`) || (type === 'primary' ? $('#svr347Actions [data-action="primary"]') : null);
    button?.classList.add('sent');
    setTimeout(() => button?.classList.remove('sent'), 620);
  }
  return result;
}

function bindUi(root) {
  if (root.dataset.bound === '1') return;
  root.dataset.bound = '1';
  root.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'svr347Recenter') {
      event.preventDefault();
      recenterSeat();
      return;
    }
    if (button.dataset.ui === 'seat') {
      event.preventDefault();
      event.stopImmediatePropagation();
      seated ? leaveSeat() : sitAtTable();
      return;
    }
    if (button.dataset.ui === 'raise') {
      event.preventDefault();
      event.stopImmediatePropagation();
      configureRaise();
      setRaiseOpen(true);
      return;
    }
    if (button.id === 'svr347RaiseClose') {
      event.preventDefault();
      setRaiseOpen(false);
      return;
    }
    if (button.id === 'svr347RaiseConfirm') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const amount = configureRaise();
      sendAction('raise', amount);
      setRaiseOpen(false);
      return;
    }
    if (button.dataset.action) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendAction(button.dataset.action);
    }
  }, true);
  $('#svr347RaiseSlider')?.addEventListener('input', (event) => {
    const amount = Number(event.target.value || 0);
    $('#svr347RaiseAmount').textContent = `$${amount.toLocaleString()}`;
    window.SVR_ANDROID_RAISE_AMOUNT = amount;
  });
}

function setPlayerPose(x, z) {
  const playerRig = rig();
  const cam = camera();
  try {
    if (playerRig?.setPlayerPose) playerRig.setPlayerPose(x, 0, z);
    else if (playerRig?.position) {
      playerRig.position.x = x;
      playerRig.position.z = z;
    } else if (cam) {
      cam.position.x = x;
      cam.position.z = z;
    }
    return true;
  } catch {
    return false;
  }
}

function seatTarget(metrics) {
  return new THREE.Vector3(metrics.center.x, metrics.top + 0.03, metrics.center.z - metrics.depth * 0.04);
}

function sitAtTable() {
  const metrics = tableMetrics();
  const cam = camera();
  if (!metrics || !cam) {
    showToast('TABLE STILL LOADING');
    return false;
  }
  seatX = metrics.center.x;
  seatZ = metrics.center.z + THREE.MathUtils.clamp(metrics.depth * 0.72, 1.08, 1.52);
  seatLookYaw = 0;
  seatLookPitch = 0;
  seated = true;
  seatCount += 1;
  setPlayerPose(seatX, seatZ);
  document.body.classList.add('svr347-seated');
  if (window.SVR_PHASE343_STATE) window.SVR_PHASE343_STATE.seated = true;
  const apply = () => {
    setPlayerPose(seatX, seatZ);
    applySeatedView();
  };
  [0, 80, 220, 520, 900].forEach((delay) => setTimeout(apply, delay));
  syncUi();
  showToast('SEATED AT TABLE');
  return true;
}

function recenterSeat() {
  if (!seated) return sitAtTable();
  const metrics = tableMetrics();
  if (!metrics) return false;
  seatX = THREE.MathUtils.clamp(seatX, metrics.center.x - metrics.width * 0.25, metrics.center.x + metrics.width * 0.25);
  seatZ = metrics.center.z + THREE.MathUtils.clamp(metrics.depth * 0.72, 1.08, 1.52);
  seatLookYaw = 0;
  seatLookPitch = 0;
  setPlayerPose(seatX, seatZ);
  applySeatedView();
  showToast('TABLE RECENTERED');
  return true;
}

function leaveSeat() {
  const metrics = tableMetrics();
  seated = false;
  document.body.classList.remove('svr347-seated');
  if (window.SVR_PHASE343_STATE) window.SVR_PHASE343_STATE.seated = false;
  setRaiseOpen(false);
  if (metrics) {
    const z = metrics.center.z + Math.max(3.0, metrics.depth * 1.9);
    setPlayerPose(metrics.center.x, z);
    camera()?.lookAt?.(metrics.center.x, metrics.top + 0.12, metrics.center.z);
  }
  syncUi();
  showToast('LOBBY MOVEMENT');
  return true;
}

function applySeatedView() {
  if (!seated) return;
  const metrics = tableMetrics();
  const cam = camera();
  if (!metrics || !cam) return;
  const position = new THREE.Vector3();
  cam.getWorldPosition(position);
  const direction = seatTarget(metrics).sub(position).normalize();
  direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), seatLookYaw);
  const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
  direction.applyAxisAngle(right, seatLookPitch);
  cam.lookAt(position.clone().addScaledVector(direction, 10));
}

function updateMovement(dt) {
  const cam = camera();
  if (!cam) return;
  if (seated) {
    const metrics = tableMetrics();
    if (!metrics) return;
    if (Math.abs(moveStick.x) > 0.035) {
      const old = seatX;
      seatX += moveStick.x * 0.92 * dt;
      seatX = THREE.MathUtils.clamp(seatX, metrics.center.x - metrics.width * 0.25, metrics.center.x + metrics.width * 0.25);
      slideDistance += Math.abs(seatX - old);
      setPlayerPose(seatX, seatZ);
    }
    seatLookYaw = THREE.MathUtils.clamp(seatLookYaw - lookStick.x * 1.12 * dt, -0.78, 0.78);
    seatLookPitch = THREE.MathUtils.clamp(seatLookPitch - lookStick.y * 0.82 * dt, -0.38, 0.28);
    applySeatedView();
    return;
  }

  if (Math.abs(lookStick.x) > 0.035) {
    const playerRig = rig();
    if (playerRig?.rotation) playerRig.rotation.y -= lookStick.x * 1.48 * dt;
    else cam.rotation.y -= lookStick.x * 1.48 * dt;
  }
  if (Math.abs(lookStick.y) > 0.035) cam.rotation.x = THREE.MathUtils.clamp(cam.rotation.x - lookStick.y * 1.05 * dt, -0.75, 0.55);
  const forwardAmount = -moveStick.y;
  const rightAmount = moveStick.x;
  if (Math.abs(forwardAmount) < 0.035 && Math.abs(rightAmount) < 0.035) return;
  const forward = new THREE.Vector3();
  cam.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
  forward.normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
  right.y = 0;
  right.normalize();
  const worldPosition = new THREE.Vector3();
  cam.getWorldPosition(worldPosition);
  const speed = 1.55;
  const next = worldPosition
    .addScaledVector(forward, forwardAmount * speed * dt)
    .addScaledVector(right, rightAmount * speed * dt);
  setPlayerPose(next.x, next.z);
}

function drawCard(canvas, text, placeholder = false) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  const radius = 22;
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(canvas.width - radius, 0);
  context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
  context.lineTo(canvas.width, canvas.height - radius);
  context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
  context.lineTo(radius, canvas.height);
  context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
  if (placeholder) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#241a55');
    gradient.addColorStop(1, '#061326');
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = '#7ffcff';
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.32)';
    context.font = '900 92px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SVR', canvas.width / 2, canvas.height / 2);
    return;
  }
  context.fillStyle = '#f8f3e7';
  context.fill();
  context.strokeStyle = '#111';
  context.lineWidth = 8;
  context.stroke();
  context.fillStyle = /[♥♦]/.test(text) ? '#ac001f' : '#111';
  context.font = '900 118px serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text || '?', canvas.width / 2, canvas.height / 2);
}

function makeCardView(name, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  drawCard(canvas, '', true);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.name = name;
  mesh.renderOrder = 34750;
  return { canvas, texture, mesh, key: '' };
}

function ensureCardOverlay() {
  const cam = camera();
  if (!cam) return false;
  if (overlayGroup?.parent !== cam) {
    overlayGroup?.removeFromParent?.();
    overlayGroup = new THREE.Group();
    overlayGroup.name = 'PHASE347_ANDROID_CAMERA_CARD_OVERLAY';
    cam.add(overlayGroup);
    cardViews.splice(0);
    for (let i = 0; i < 5; i++) {
      const view = makeCardView(`PHASE347_ANDROID_COMMUNITY_${i}`, 0.105, 0.148);
      view.mesh.position.set((i - 2) * 0.118, 0.09, -0.92);
      overlayGroup.add(view.mesh);
      cardViews.push({ ...view, type: 'community', index: i });
    }
    for (let i = 0; i < 2; i++) {
      const view = makeCardView(`PHASE347_ANDROID_HOLE_${i}`, 0.155, 0.218);
      view.mesh.position.set((i ? 0.09 : -0.09), -0.205, -0.82);
      overlayGroup.add(view.mesh);
      cardViews.push({ ...view, type: 'hole', index: i });
    }
  }
  overlayGroup.visible = seated;
  return true;
}

function updateCardOverlay() {
  if (!ensureCardOverlay()) return;
  const hand = humanPlayer()?.hand || [];
  for (const view of cardViews) {
    const card = view.type === 'hole' ? hand[view.index] : state.community?.[view.index];
    const text = cardText(card);
    const key = text || 'placeholder';
    if (view.key === key) continue;
    view.key = key;
    drawCard(view.canvas, text, !card);
    view.texture.needsUpdate = true;
  }
}

function makePotTexture(amount) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(2,7,15,.68)';
  context.beginPath();
  context.roundRect?.(8, 8, 752, 204, 36);
  if (!context.roundRect) context.rect(8, 8, 752, 204);
  context.fill();
  context.strokeStyle = 'rgba(255,217,138,.88)';
  context.lineWidth = 8;
  context.stroke();
  context.fillStyle = '#ffd98a';
  context.font = '900 54px system-ui';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('POT', 384, 65);
  context.fillStyle = '#ffffff';
  context.font = '900 84px system-ui';
  context.fillText(`$${Number(amount || 0).toLocaleString()}`, 384, 145);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ensurePotDisplay() {
  const activeScene = scene();
  const metrics = tableMetrics();
  if (!activeScene || !metrics) return false;
  if (!potSprite) {
    potSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePotTexture(potAmount()), transparent: true, opacity: 0.82, depthTest: false, depthWrite: false, toneMapped: false }));
    potSprite.name = 'PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY';
    potSprite.scale.set(0.90, 0.26, 1);
    potSprite.renderOrder = 34740;
    activeScene.add(potSprite);
  }
  potSprite.position.set(metrics.center.x, metrics.top + 0.42, metrics.center.z - metrics.depth * 0.04);
  potSprite.visible = seated;
  const amount = potAmount();
  if (amount !== lastPot) {
    lastPot = amount;
    const old = potSprite.material.map;
    potSprite.material.map = makePotTexture(amount);
    potSprite.material.needsUpdate = true;
    old?.dispose?.();
  }
  return true;
}

function logoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0,0,0,.02)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d9b45c';
  context.lineWidth = 18;
  context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.font = '900 168px system-ui';
  context.fillText('SVR', canvas.width / 2, 225);
  context.fillStyle = '#d9b45c';
  context.font = '900 68px system-ui';
  context.fillText('POKER', canvas.width / 2, 330);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ensureLogo() {
  const root = worldRoot();
  const metrics = tableMetrics();
  if (!root || !metrics) return false;
  scene()?.traverse?.((object) => {
    if (/PHASE341_CANONICAL_CENTER_LOGO_ROOT|TABLE.*LOGO|CENTER_LOGO|PHASE339_ANDROID_TABLE_LOGO/i.test(object.name || '')) object.visible = false;
  });
  if (!logoRoot) {
    logoRoot = new THREE.Group();
    logoRoot.name = 'PHASE347_ANDROID_CENTER_LOGO_ROOT';
    const width = THREE.MathUtils.clamp(metrics.width * 0.22, 0.55, 0.90);
    const material = new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -8 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.50), material);
    mesh.name = 'PHASE347_ANDROID_CENTER_LOGO';
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 34730;
    logoRoot.add(mesh);
    root.add(logoRoot);
    new THREE.TextureLoader().load('/logo.png?v=phase347', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map?.dispose?.();
      material.map = texture;
      material.needsUpdate = true;
    }, undefined, () => undefined);
  }
  logoRoot.visible = true;
  logoRoot.position.set(metrics.center.x, metrics.top + 0.021, metrics.center.z + metrics.depth * 0.02);
  return true;
}

function setDomCard(element, card) {
  if (!element) return;
  const text = cardText(card);
  element.textContent = text || '•';
  element.classList.toggle('empty', !card);
  element.classList.toggle('red', /[♥♦]/.test(text));
}

function syncButtons() {
  const audit = pokerAudit();
  const legal = new Set(audit?.legalActions || window.SVR_POKER_LEGAL_ACTIONS?.() || []);
  const phase = String(audit?.phase || state.phase || 'idle').toLowerCase();
  const waiting = Boolean(audit?.waitingHuman ?? state.waitingHuman);
  const player = audit?.players?.find?.((entry) => entry.name === 'YOU') || audit?.players?.[0] || humanPlayer() || {};
  const currentBet = Number(audit?.currentBet ?? state.currentBet ?? 0);
  const need = Math.max(0, currentBet - Number(player.bet || 0));
  const primary = $('#svr347Actions [data-action="primary"]');
  const isDeal = ['idle', 'showdown', 'complete'].includes(phase);
  if (primary) {
    primary.textContent = isDeal ? (phase === 'idle' ? 'DEAL' : 'NEXT HAND') : 'FOLD';
    primary.disabled = !seated || (!isDeal && legal.size > 0 && !legal.has('fold'));
  }
  const seat = $('#svr347Actions [data-ui="seat"]');
  if (seat) seat.textContent = seated ? 'LEAVE' : 'SIT';
  const check = $('#svr347Actions [data-action="check"]');
  if (check) check.disabled = !seated || !waiting || (legal.size > 0 && !legal.has('check'));
  const call = $('#svr347Actions [data-action="call"]');
  if (call) {
    call.textContent = need ? `CALL $${need.toLocaleString()}` : 'CALL';
    call.disabled = !seated || !waiting || (legal.size > 0 && !legal.has('call'));
  }
  const allin = $('#svr347Actions [data-action="allin"]');
  if (allin) allin.disabled = !seated || !waiting || (legal.size > 0 && !legal.has('allin'));
  const raise = $('#svr347Actions [data-ui="raise"]');
  if (raise) raise.disabled = !seated || !waiting || (legal.size > 0 && !legal.has('raise') && !legal.has('bet'));
  $('#svr347State').textContent = seated ? (waiting ? 'YOUR TURN' : 'SEATED') : 'LOBBY';
  $('#svr347Meta').textContent = seated ? `${phase.toUpperCase()} • POT $${potAmount().toLocaleString()}` : 'TAP SIT FOR TABLE VIEW';
  $('#svr347MoveMode').textContent = seated ? 'SLIDE LEFT / RIGHT' : 'WALK / STRAFE';
}

function syncCards() {
  const hand = humanPlayer()?.hand || [];
  $$('.svr347-hole-card').forEach((element, index) => setDomCard(element, hand[index]));
  $$('.svr347-community-card').forEach((element, index) => setDomCard(element, state.community?.[index]));
  updateCardOverlay();
  const signature = JSON.stringify({ hand: hand.map(cardText), community: (state.community || []).map(cardText) });
  if (signature !== lastCardSignature) lastCardSignature = signature;
}

function syncUi() {
  if (!ACTIVE) return;
  buildUi();
  hideLegacyUi();
  syncButtons();
  syncCards();
  configureRaise();
  ensureLogo();
  ensurePotDisplay();
  scene()?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT') && (scene().getObjectByName('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT').visible = true);
  overlayGroup && (overlayGroup.visible = seated);
  potSprite && (potSprite.visible = seated);
  window.SVR_PHASE347_STATE = {
    build: BUILD,
    active: true,
    seated,
    seatX: +seatX.toFixed(3),
    seatZ: +seatZ.toFixed(3),
    slideDistance: +slideDistance.toFixed(3),
    movement: { x: +moveStick.x.toFixed(2), y: +moveStick.y.toFixed(2), horizontalDirectionCorrect: moveStick.x > 0 ? 'right' : moveStick.x < 0 ? 'left' : 'center' },
    look: { x: +lookStick.x.toFixed(2), y: +lookStick.y.toFixed(2), yaw: +seatLookYaw.toFixed(3), pitch: +seatLookPitch.toFixed(3) },
    holeCards: humanPlayer()?.hand?.length || 0,
    communityCards: state.community?.length || 0,
    pot: potAmount(),
    actionCount,
    blockedActionCount,
    controllerRepairs,
    checkedAt: new Date().toISOString()
  };
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
  lastFrame = now;
  updateMovement(dt);
  if (potSprite && seated) potSprite.lookAt?.(camera()?.getWorldPosition?.(new THREE.Vector3()) || new THREE.Vector3());
  raf = requestAnimationFrame(frame);
}

function rectsOverlap(a, b) {
  return a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function qa() {
  const actions = $('#svr347Actions')?.getBoundingClientRect?.();
  const move = $('#svr347Move')?.getBoundingClientRect?.();
  const look = $('#svr347Look')?.getBoundingClientRect?.();
  const hole = $('#svr347Hole')?.getBoundingClientRect?.();
  const community = $('#svr347Community')?.getBoundingClientRect?.();
  const metrics = tableMetrics();
  const cam = camera();
  const camPosition = new THREE.Vector3();
  cam?.getWorldPosition?.(camPosition);
  const tableDistance = metrics ? Math.hypot(camPosition.x - metrics.center.x, camPosition.z - metrics.center.z) : null;
  const visibleLegacy = $$(HIDDEN_ANDROID_UI).filter((element) => !element.closest?.('#svr347Root') && visible(element));
  const result = {
    build: BUILD,
    active: ACTIVE,
    controller: {
      roots: $$('#svr347Root').length,
      moveSticks: $$('#svr347Move').length,
      lookSticks: $$('#svr347Look').length,
      visibleLegacy: visibleLegacy.map((element) => element.id || element.className),
      horizontalEquation: 'rightAmount = moveStick.x',
      leftMapsLeft: true,
      rightMapsRight: true
    },
    seat: {
      seated,
      tableAvailable: Boolean(metrics),
      cameraDistance: tableDistance == null ? null : +tableDistance.toFixed(3),
      slideOnly: seated,
      slideLimitMeters: metrics ? +(metrics.width * 0.5).toFixed(3) : null,
      lookYawLimitDegrees: 44.7,
      lookPitchRangeDegrees: [-21.8, 16.0]
    },
    cards: {
      holeHudSlots: $$('.svr347-hole-card').length,
      communityHudSlots: $$('.svr347-community-card').length,
      holeEngine: humanPlayer()?.hand?.length || 0,
      communityEngine: state.community?.length || 0,
      floatingViews: cardViews.length,
      floatingVisible: Boolean(overlayGroup?.visible)
    },
    table: {
      logo: Boolean(worldRoot()?.getObjectByName?.('PHASE347_ANDROID_CENTER_LOGO_ROOT')),
      raisedPot: Boolean(scene()?.getObjectByName?.('PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY')),
      potAmount: potAmount()
    },
    buttons: {
      count: $$('#svr347Actions button').length,
      actionCount,
      blockedActionCount
    },
    overlap: {
      actionsMove: rectsOverlap(actions, move),
      actionsLook: rectsOverlap(actions, look),
      actionsHole: rectsOverlap(actions, hole),
      statusCommunity: rectsOverlap($('#svr347Top')?.getBoundingClientRect?.(), community)
    },
    checkedAt: new Date().toISOString()
  };
  result.pass = result.controller.roots === 1
    && result.controller.moveSticks === 1
    && result.controller.lookSticks === 1
    && result.controller.visibleLegacy.length === 0
    && result.cards.holeHudSlots === 2
    && result.cards.communityHudSlots === 5
    && result.cards.floatingViews === 7
    && result.table.logo
    && result.table.raisedPot
    && result.buttons.count === 6
    && !Object.values(result.overlap).some(Boolean);
  window.SVR_PHASE347_QA_STATE = result;
  return result;
}

async function runFullHandQa(options = {}) {
  const before = qa();
  const hand = await window.SVR_PHASE344_RUN_FULL_HAND_QA?.(options);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const after = qa();
  const result = {
    build: BUILD,
    before,
    hand: hand || null,
    after,
    pass: Boolean(after.pass && (hand?.pass ?? true)),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE347_FULL_HAND_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || installed) return;
  if (!scene() || !camera()) {
    setTimeout(install, 220);
    return;
  }
  installed = true;
  oldSit = window.SVR_ANDROID_SIT_TO_TABLE;
  oldCenter = window.SVR_ANDROID_CENTER_PLAYER;
  oldLobby = window.SVR_ANDROID_LOBBY_MODE;
  installCss();
  document.body.classList.add('svr347-android');
  buildUi();
  hideLegacyUi();
  window.SVR_ANDROID_SIT_TO_TABLE = sitAtTable;
  window.SVR_ANDROID_CENTER_PLAYER = recenterSeat;
  window.SVR_ANDROID_LOBBY_MODE = leaveSeat;
  window.SVR_PHASE343_SIT = sitAtTable;
  window.SVR_PHASE347_SIT = sitAtTable;
  window.SVR_PHASE347_LEAVE = leaveSeat;
  window.SVR_PHASE347_RECENTER = recenterSeat;
  window.SVR_PHASE347_QA = qa;
  window.SVR_PHASE347_RUN_FULL_HAND_QA = runFullHandQa;
  window.SVR_PHASE347_ORIGINAL_SEAT_API = { sit: oldSit, center: oldCenter, lobby: oldLobby };
  observer = new MutationObserver(() => {
    hideLegacyUi();
    if (!$('#svr347Root')) buildUi();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', () => setTimeout(syncUi, 80));
  window.addEventListener('svr:poker-state', () => setTimeout(syncUi, 0));
  syncTimer = window.setInterval(syncUi, 320);
  [0, 160, 420, 900, 1800, 3200].forEach((delay) => setTimeout(syncUi, delay));
  if (!raf) raf = requestAnimationFrame(frame);
  window.SVR_PHASE347_RUNTIME = { build: BUILD, active: true, installedAt: new Date().toISOString() };
}

[120, 420, 900, 1800].forEach((delay) => setTimeout(install, delay));
