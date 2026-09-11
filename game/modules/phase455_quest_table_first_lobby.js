/* PHASE-455-QUEST-TABLE-FIRST-LOBBY */
export const BUILD = 'PHASE-455-QUEST-TABLE-FIRST-LOBBY';

const params = new URLSearchParams(location.search);
const ACTIVE = params.get('tableonly') === '1' || params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const state = { build: BUILD, active: ACTIVE, installed: false, seated: false, ericReady: false, playerReady: false, roomReady: false, duplicates: 0, lastError: null, checkedAt: null };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let timer = 0;

function countVisible(pattern) {
  let count = 0;
  window.__SVR_SCENE__?.traverse?.(object => { if (object.visible !== false && pattern.test(String(object.name || ''))) count++; });
  return count;
}

function isRuntimeVisual(object, runtime) {
  for (let current = object; current; current = current.parent) {
    if (current === runtime?.table?.group || current === runtime?.table?.table || current === runtime?.dealer?.group || current === runtime?.dealer?.propGroup) return true;
    if (current.userData?.svrPhase440Approved || current.userData?.svrPhase441Approved) return true;
  }
  return false;
}

function visibleClutterCounts(runtime) {
  const counts = { tables: 0, floatingLines: 0 };
  const tableClutter = /(?:LEGACY|DUPLICATE|EXTRA|FLOATING).*(?:TABLE|TOP|SURFACE|FELT|COVER|OVERLAY)|TABLE.*(?:TOP|TOPPER|COVER).*LEGACY|PROTECTIVE.*(?:TOP|COVER)|TABLETOP|HOLOGRAM.*(?:TABLE|SURFACE)|TABLE.*OVERLAY/i;
  const floatingLine = /WHITE.?LINE|BLINK|FLASH|FLOATING.*LINE|GUIDE.?LINE|PHASE441_TABLE_SAFE_DECALS/i;
  window.__SVR_SCENE__?.traverse?.(object => {
    if (!object?.parent || object.visible === false || isRuntimeVisual(object, runtime)) return;
    const label = String(object.name || '') + ' ' + String(object.material?.name || '');
    if (tableClutter.test(label)) counts.tables++;
    if (floatingLine.test(label)) counts.floatingLines++;
  });
  return counts;
}

function hideLegacyUI() {
  document.querySelectorAll('#hud,#sceneNav,[id*="portal" i],[class*="portal" i],[id*="recovery" i],[class*="recovery" i],[id*="low-power" i],[class*="low-power" i]').forEach(element => {
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    element.style.display = 'none';
    element.style.pointerEvents = 'none';
  });
}

function sweep(reason = 'guard') {
  if (!ACTIVE) return false;
  try {
    window.SVR_TELEPORT_DISABLED = true;
    window.SVR_TELEPORT_ENABLED = false;
    window.SVR_MOVEMENT_ENABLED = false;
    window.SVR_PHASE453_SWEEP?.('phase455-' + reason);
    window.SVR_PHASE446_SWEEP?.('phase455-' + reason);
    window.SVR_PHASE390_DIRECT_FRONT_SEAT?.('phase455-' + reason);
    hideLegacyUI();

    const room = window.__SVR_SCENE__?.getObjectByName?.('PHASE453_DIRECT_TABLE_ROOM');
    const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
    const player = window.__SVR_SCENE__?.getObjectByName?.('PHASE444_SINGLE_HEADS_UP_PLAYER');
    const qa446 = window.SVR_PHASE446_QA?.() || {};
    const clutter = visibleClutterCounts(runtime);

    state.roomReady = Boolean(room?.visible !== false && room?.parent);
    state.ericReady = Boolean(runtime?.dealer?.loaded && runtime?.dealer?.group?.visible !== false);
    state.playerReady = Boolean(player?.visible !== false && player?.parent);
    state.seated = Boolean(qa446.pass && qa446.seated && qa446.approvedTableVisible && qa446.approvedEricVisible);
    state.duplicates = clutter.tables + clutter.floatingLines;
    state.installed = state.roomReady && state.ericReady && state.playerReady && state.seated && state.duplicates === 0 && window.SVR_TELEPORT_DISABLED === true && window.SVR_TELEPORT_ENABLED === false && window.SVR_MOVEMENT_ENABLED === false;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE455_STATE = { ...state, reason, clutter, phase446: qa446, visibleEric: countVisible(/ERIC/i), visiblePlayer: countVisible(/PHASE444_SINGLE_HEADS_UP_PLAYER/) };
    return qa();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    return false;
  }
}

function qa() {
  return { ...state, pass: Boolean(state.installed && !state.lastError), checkedAt: new Date().toISOString() };
}

async function install() {
  if (!ACTIVE) return false;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
    if (window.__SVR_SCENE__ && runtime?.table?.table && runtime?.dealer?.loaded && window.SVR_PHASE444_QA?.()?.pass) break;
    await wait(80);
  }
  sweep('install');
  window.__SVR_RENDERER__?.xr?.addEventListener?.('sessionstart', () => setTimeout(() => sweep('xr-sessionstart'), 120));
  for (const delay of [100, 300, 800, 1600, 3200]) setTimeout(() => sweep('settle-' + delay), delay);
  if (!timer) timer = window.setInterval(() => sweep('guard'), 750);
  return qa();
}

window.SVR_PHASE455_SWEEP = sweep;
window.SVR_PHASE455_QA = qa;
window.SVR_PHASE455_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
