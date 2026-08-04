export const BUILD = 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  joined: false,
  tableReady: false,
  tableAligned: false,
  tableScans: 0,
  dealerReady: false,
  controls: 0,
  duplicateControlsHidden: 0,
  legacySeatButtonsHidden: 0,
  joinAttempts: 0,
  successfulJoins: 0,
  firstDeals: 0,
  automaticNextHands: 0,
  lowPowerRecoveries: 0,
  longFrameGaps: 0,
  lastFrameGapMs: 0,
  lastJoinAt: null,
  lastLowPowerAt: 0,
  lastError: null,
  checkedAt: null
};

const LEGACY_ROOTS = [
  '#svr326Root', '#svrAndroidGamePad', '#svrTapMovePanel', '#svrAndroidLiteHud',
  '#svrAndroidRecoverView', '#svr343Hud', '#svr344ActionToast', '.svr-stick'
].join(',');

let overlay = null;
let brand = null;
let tableRef = null;
let tableAligned = false;
let frameAt = performance.now();
let nextHandTimer = 0;
let repairTimer = 0;
let observer = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const joinedNow = () => Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE ?? window.SVR_PHASE363_STATE?.joined ?? state.joined);
const authoritativeSeatButton = () => document.querySelector('#svr347Actions [data-ui="seat"]');

function installStyles() {
  if (document.getElementById('svr369-style')) return;
  const style = document.createElement('style');
  style.id = 'svr369-style';
  style.textContent = `
    #svr369Entry{position:fixed;inset:0;z-index:2147483645;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 50% 35%,rgba(44,18,74,.88),rgba(3,5,12,.97) 68%);font-family:system-ui,Arial;color:#fff}
    #svr369Entry[hidden]{display:none!important}
    .svr369-card{width:min(430px,94vw);padding:22px;border:1px solid rgba(127,252,255,.65);border-radius:24px;background:rgba(3,7,17,.94);text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.72),0 0 36px rgba(127,252,255,.14)}
    .svr369-card img{width:104px;height:104px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(176,103,255,.45))}.svr369-card h1{margin:10px 0 4px;font-size:26px}.svr369-card p{margin:6px 0;color:#d9e9ef;line-height:1.35}
    .svr369-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.svr369-actions button{min-height:48px;border:1px solid rgba(255,217,138,.7);border-radius:14px;background:#111827;color:#fff;font-weight:950;touch-action:manipulation}.svr369-actions .primary{grid-column:1/-1;background:linear-gradient(135deg,#7ffcff,#9b4dff);color:#03040b;border:0;font-size:16px}
    #svr369Status{min-height:20px;margin-top:10px;color:#ffd98a;font-weight:850}
    #svr369Brand{position:fixed;left:max(10px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));z-index:2147483501;display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid rgba(127,252,255,.5);border-radius:999px;background:rgba(0,0,0,.7);pointer-events:none;color:#fff;font:900 10px system-ui;letter-spacing:.06em}
    #svr369Brand img{width:28px;height:28px;object-fit:contain}
    body.svr369-lobby #svr347Root{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    body.svr369-seated #svr347Root{visibility:visible!important;opacity:1!important}
    body.svr369-lobby #svr369Brand{display:none!important}
    @media(max-width:420px){.svr369-card{padding:18px}.svr369-card img{width:86px;height:86px}}
  `;
  document.head.appendChild(style);
}

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('section');
  overlay.id = 'svr369Entry';
  overlay.innerHTML = `
    <div class="svr369-card">
      <img src="/logo.png" alt="SVR Poker logo">
      <h1>SVR POKER</h1>
      <p>Your Android table is ready. Join first, then the cards and controls activate.</p>
      <div class="svr369-actions">
        <button id="svr369Join" class="primary" type="button">JOIN TABLE</button>
        <button id="svr369LowPower" type="button">LOW POWER</button>
        <button id="svr369Reload" type="button">RELOAD</button>
      </div>
      <div id="svr369Status" role="status">Checking the real table and dealer…</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#svr369Join').addEventListener('click', joinTable);
  overlay.querySelector('#svr369LowPower').addEventListener('click', () => applyLowPower('entry-button'));
  overlay.querySelector('#svr369Reload').addEventListener('click', () => location.reload());
  return overlay;
}

function ensureBrand() {
  if (brand) return brand;
  brand = document.createElement('div');
  brand.id = 'svr369Brand';
  brand.innerHTML = '<img src="/logo.png" alt=""><span>SVR POKER • ANDROID</span>';
  document.body.appendChild(brand);
  return brand;
}

function status(message, error = false) {
  const node = document.getElementById('svr369Status');
  if (node) {
    node.textContent = message;
    node.style.color = error ? '#ff9fbd' : '#ffd98a';
  }
}

function locateTable() {
  if (tableRef?.isObject3D) return tableRef;
  const scene = window.__SVR_SCENE__;
  const names = [
    'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
    'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
    'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
    'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
    'PHASE326_ANDROID_TABLE_FALLBACK'
  ];
  state.tableScans += 1;
  let table = window.SVR_TABLE_AUTHORITY;
  if (!table?.isObject3D) {
    for (const name of names) {
      table = scene?.getObjectByName?.(name);
      if (table?.isObject3D) break;
    }
  }
  if (table?.isObject3D) tableRef = table;
  return tableRef;
}

function tableObject({ align = false } = {}) {
  const table = locateTable();
  if (!table?.isObject3D) {
    state.tableReady = false;
    return null;
  }
  table.visible = true;
  window.SVR_TABLE_AUTHORITY = table;
  state.tableReady = true;
  if (align && !tableAligned) {
    window.SVR_PHASE364_ALIGN_TABLE?.();
    window.SVR_PHASE340_GOVERN?.();
    tableAligned = true;
    state.tableAligned = true;
  }
  return table;
}

function protectSeatAuthority() {
  const seat = authoritativeSeatButton();
  if (!seat) return null;
  seat.hidden = false;
  seat.removeAttribute('aria-hidden');
  try { seat.inert = false; } catch {}
  return seat;
}

function hideDuplicates() {
  const seatAuthority = protectSeatAuthority();
  let hidden = 0;
  document.querySelectorAll(LEGACY_ROOTS).forEach((element) => {
    if (element.closest?.('#svr347Root')) return;
    if (element.hidden && element.getAttribute('aria-hidden') === 'true') return;
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    try { element.inert = true; } catch {}
    hidden += 1;
  });
  let seatHidden = 0;
  document.querySelectorAll('button').forEach((button) => {
    if (button === seatAuthority || button.matches?.('#svr347Actions [data-ui="seat"]')) return;
    if (button.id === 'svr369Join' || button.closest('#runtimeRecovery')) return;
    if (button.closest('#svr347Actions')) return;
    const text = String(button.textContent || '').trim().toUpperCase();
    if (!['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME'].includes(text)) return;
    if (button.hidden && button.getAttribute('aria-hidden') === 'true') return;
    button.hidden = true;
    button.setAttribute('aria-hidden', 'true');
    try { button.inert = true; } catch {}
    seatHidden += 1;
  });
  state.duplicateControlsHidden += hidden;
  state.legacySeatButtonsHidden += seatHidden;
  state.controls = document.querySelectorAll('#svr347Root').length;
}

function setJoined(joined, reason = 'state') {
  state.joined = Boolean(joined);
  document.body.classList.toggle('svr369-lobby', !joined);
  document.body.classList.toggle('svr369-seated', joined);
  ensureOverlay().hidden = joined;
  ensureBrand();
  const seat = protectSeatAuthority();
  if (seat) seat.textContent = joined ? 'LEAVE TABLE' : 'JOIN TABLE';
  if (!joined) {
    clearTimeout(nextHandTimer);
    status('Table ready. Press JOIN TABLE to begin.');
  }
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE369_ANDROID_STATE = { ...state, reason };
}

function applyLowPower(reason = 'manual') {
  const now = performance.now();
  if (reason === 'long-frame-gap' && now - state.lastLowPowerAt < 10000) return false;
  const renderer = window.__SVR_RENDERER__;
  try {
    window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.('android');
    renderer?.setPixelRatio?.(Math.min(0.95, window.devicePixelRatio || 1));
    if (renderer?.shadowMap) renderer.shadowMap.enabled = false;
    document.body.classList.add('svr369-low-power');
    state.lowPowerRecoveries += 1;
    state.lastLowPowerAt = now;
    status('Low-power rendering enabled. Join the table when ready.');
    window.SVR_PHASE369_ANDROID_STATE = { ...state, lowPowerReason: reason };
    return true;
  } catch (error) {
    state.lastError = String(error?.message || error);
    return false;
  }
}

async function joinTable() {
  if (joinedNow()) return;
  state.joinAttempts += 1;
  status('Joining table and preparing your first hand…');
  const table = tableObject({ align: true });
  if (!table) {
    status('The real table is still loading. Reload the table once.', true);
    return;
  }
  try {
    const result = window.SVR_PHASE363_JOIN_TABLE?.('phase369-logo-entry');
    if (result === false) throw new Error('JOIN_REJECTED');
    setJoined(true, 'join-button');
    await wait(120);
    window.SVR_PHASE364_ANDROID_SEAT?.();
    window.SVR_PHASE365_SYNC?.();
    window.SVR_PHASE367_DEVICE_CALIBRATE?.();
    await wait(180);
    window.SVR_RESET_POKER_TABLE?.(15000);
    state.firstDeals += 1;
    state.successfulJoins += 1;
    state.lastJoinAt = new Date().toISOString();
    status('Joined. Your first hand is starting.');
    window.setTimeout(() => {
      window.SVR_PHASE368_LOAD_CARD_DEALER?.();
      window.SVR_PHASE368_ALIGN_CARD_DEALER?.();
      window.SVR_PHASE368_PLAY_CARD_DEALER?.('android-first-deal');
    }, 900);
  } catch (error) {
    state.lastError = String(error?.message || error);
    setJoined(false, 'join-error');
    status(`Join recovery: ${state.lastError}`, true);
  }
}

function onPokerState(event) {
  const detail = event?.detail || window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
  if (!joinedNow() || detail.phase !== 'showdown') return;
  clearTimeout(nextHandTimer);
  nextHandTimer = window.setTimeout(() => {
    if (!joinedNow()) return;
    const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
    if (audit.phase === 'showdown') {
      window.SVR_POKER_NEXT_HAND?.();
      state.automaticNextHands += 1;
      window.SVR_PHASE368_PLAY_CARD_DEALER?.('android-continuous-next-hand');
    }
  }, 3200);
}

function frameWatch(now) {
  const gap = now - frameAt;
  frameAt = now;
  if (gap > 1400) {
    state.longFrameGaps += 1;
    state.lastFrameGapMs = Math.round(gap);
    applyLowPower('long-frame-gap');
  }
  requestAnimationFrame(frameWatch);
}

async function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  installStyles();
  ensureOverlay();
  ensureBrand();
  document.body.dataset.build = BUILD;
  document.body.dataset.release = BUILD;
  document.body.classList.add('svr369-android');

  window.SVR_PHASE363_LEAVE_TABLE?.('phase369-clean-boot-lobby');
  setJoined(false, 'clean-boot');
  tableObject({ align: true });
  hideDuplicates();

  observer = new MutationObserver(() => hideDuplicates());
  observer.observe(document.body, { subtree: true, childList: true });
  repairTimer = window.setInterval(() => {
    if (!state.tableReady) tableObject({ align: true });
    else if (tableRef?.isObject3D) tableRef.visible = true;
    protectSeatAuthority();
    state.dealerReady = Boolean(window.SVR_PHASE368_CARD_DEALER_STATE?.loaded);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE369_ANDROID_STATE = { ...state };
  }, 2500);

  window.addEventListener('svr:phase363-immediate-join-state', (event) => {
    setJoined(Boolean(event.detail?.joined), event.detail?.reason || 'phase363-event');
  });
  window.addEventListener('svr:poker-state', onPokerState);
  window.addEventListener('svr:phase368-card-dealer-ready', () => {
    state.dealerReady = true;
    window.SVR_PHASE368_ALIGN_CARD_DEALER?.();
  });
  document.getElementById('runtimeLowPowerButton')?.addEventListener('click', () => applyLowPower('runtime-recovery-button'));
  requestAnimationFrame(frameWatch);

  window.SVR_PHASE369_JOIN_TABLE = joinTable;
  window.SVR_PHASE369_LOW_POWER = applyLowPower;
  window.SVR_PHASE369_ANDROID_QA = () => {
    const table = tableObject({ align: false });
    return {
      ...state,
      joined: joinedNow(),
      tableReady: Boolean(table),
      tableAligned,
      dealerReady: Boolean(window.SVR_PHASE368_CARD_DEALER_STATE?.loaded),
      controllerRoots: document.querySelectorAll('#svr347Root').length,
      authoritativeSeatButtons: document.querySelectorAll('#svr347Actions [data-ui="seat"]').length,
      legacyControllersVisible: [...document.querySelectorAll(LEGACY_ROOTS)].filter((element) => !element.hidden && !element.closest?.('#svr347Root')).length,
      entryVisible: !ensureOverlay().hidden,
      pass: Boolean(table && tableAligned && document.querySelectorAll('#svr347Root').length <= 1 && document.querySelectorAll('#svr347Actions [data-ui="seat"]').length === 1 && state.lastError == null),
      checkedAt: new Date().toISOString()
    };
  };
  window.SVR_PHASE369_ANDROID_STATE = { ...state };
}

install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  window.SVR_PHASE369_ANDROID_STATE = { ...state };
});

window.addEventListener('beforeunload', () => {
  clearInterval(repairTimer);
  clearTimeout(nextHandTimer);
  observer?.disconnect?.();
}, { once: true });
