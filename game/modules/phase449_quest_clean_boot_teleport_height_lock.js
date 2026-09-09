/* PHASE-449-QUEST-CLEAN-AUTO-BOOT-TELEPORT-HEIGHT-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-449-QUEST-CLEAN-AUTO-BOOT-TELEPORT-HEIGHT-LOCK';
export const TELEPORT_FLAGS = Object.freeze([
  'SVR_TELEPORT_ENABLED',
  'SVR_HAND_TELEPORT_ENABLED',
  'SVR_WATCH_TELEPORT_ENABLED',
  'SVR_GRIP_TELEPORT_ENABLED',
  'SVR_TABLE_TRAVEL_ENABLED',
  'SVR_MOVEMENT_ENABLED',
  'SVR_LOCOMOTION_ENABLED'
]);

const query = new URLSearchParams(location.search);
const ACTIVE = query.get('platform') === 'quest' || query.get('questfix') === '1' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const TELEPORT_NAME = /TELEPORT|TARGET.?RING|POINTER|RETICLE|PARTICLE.*ARC|ARC.*PARTICLE|LOCOMOTION.?ARC|WATCH.*TELEPORT/i;
const state = { build: BUILD, active: ACTIVE, installed: false, flagsLocked: 0, visualsHidden: 0, controlsHidden: 0, lastError: null, checkedAt: null };
let timer = 0;

export function lockBooleanFlag(target, key) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get: () => false, set: () => false });
      return target[key] === false;
    }
  } catch {}
  try { target[key] = false; } catch {}
  return target[key] === false;
}

function sweep(reason = 'guard') {
  if (!ACTIVE) return { ...state, reason };
  try {
    state.flagsLocked = TELEPORT_FLAGS.reduce((count, key) => count + Number(lockBooleanFlag(window, key)), 0);
    window.SVR_TELEPORT_DISABLED = true;
    window.SVR_ALL_TELEPORT_DISABLED = true;

    let visuals = 0;
    window.__SVR_SCENE__?.traverse?.(object => {
      if (!TELEPORT_NAME.test(String(object?.name || ''))) return;
      object.visible = false;
      object.userData = { ...(object.userData || {}), svrPhase449TeleportDisabled: true };
      visuals++;
    });
    state.visualsHidden = Math.max(state.visualsHidden, visuals);

    let controls = 0;
    document.querySelectorAll('[id*="teleport" i],[class*="teleport" i],[data-action*="teleport" i],[aria-label*="teleport" i]').forEach(element => {
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
      controls++;
    });
    state.controlsHidden = Math.max(state.controlsHidden, controls);
    state.installed = state.flagsLocked === TELEPORT_FLAGS.length;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE449_STATE = { ...state, reason };
    return window.SVR_PHASE449_STATE;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    return { ...state, reason };
  }
}

async function install() {
  if (!ACTIVE) return false;
  sweep('install');
  const renderer = window.__SVR_RENDERER__;
  renderer?.xr?.addEventListener?.('sessionstart', () => {
    setTimeout(() => { window.SVR_PHASE446_SWEEP?.('phase449-xr-height-calibration'); sweep('xr-sessionstart'); }, 300);
  });
  if (!timer) timer = window.setInterval(() => sweep('guard'), 200);
  return qa();
}

function qa() {
  const flagsOff = TELEPORT_FLAGS.every(key => window[key] === false);
  return { ...state, flagsOff, teleportDisabled: window.SVR_TELEPORT_DISABLED === true, pass: Boolean(ACTIVE && state.installed && flagsOff && !state.lastError), checkedAt: new Date().toISOString() };
}

window.SVR_PHASE449_SWEEP = sweep;
window.SVR_PHASE449_QA = qa;
window.SVR_PHASE449_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
