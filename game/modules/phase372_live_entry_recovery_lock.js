export const BUILD = 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = /Android/i.test(ua) && !/Quest|Oculus|Meta Quest/i.test(ua)
  ? 'android'
  : (/Quest|Oculus|Meta Quest/i.test(ua) || params.get('platform') === 'quest' ? 'quest' : 'desktop');

const state = {
  build: BUILD,
  platform,
  installed: false,
  runtimeStarted: false,
  tableReady: false,
  joined: false,
  attempts: 0,
  lastError: null,
  checkedAt: null
};

let root = null;
let statusNode = null;
let primaryButton = null;
let activePromise = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const joinedNow = () => Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE ?? window.SVR_PHASE363_STATE?.joined ?? window.SVR_PHASE361_STATE?.seated);

function publish(reason = 'state') {
  state.joined = joinedNow();
  state.tableReady = Boolean(window.SVR_TABLE_AUTHORITY?.isObject3D || locateTable());
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE372_STATE = { ...state, reason };
  return window.SVR_PHASE372_STATE;
}

function locateTable() {
  const scene = window.__SVR_SCENE__;
  const names = [
    'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
    'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
    'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
    'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED'
  ];
  let table = window.SVR_TABLE_AUTHORITY;
  if (!table?.isObject3D) {
    for (const name of names) {
      table = scene?.getObjectByName?.(name);
      if (table?.isObject3D) break;
    }
  }
  if (table?.isObject3D) {
    table.visible = true;
    window.SVR_TABLE_AUTHORITY = table;
    return table;
  }
  return null;
}

function setStatus(message, error = false) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.dataset.error = error ? '1' : '0';
}

function ensureUi() {
  if (root) return root;
  const style = document.createElement('style');
  style.id = 'svr372-style';
  style.textContent = `
    #svr372Entry{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 50% 35%,rgba(52,18,82,.94),rgba(2,4,10,.985) 70%);font-family:system-ui,Arial;color:#fff}
    #svr372Entry[hidden]{display:none!important}.svr372-card{width:min(440px,94vw);padding:22px;border:1px solid rgba(127,252,255,.72);border-radius:24px;background:rgba(3,7,17,.96);text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.78),0 0 36px rgba(127,252,255,.16)}
    .svr372-card img{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(176,103,255,.48))}.svr372-card h1{margin:8px 0 4px;font-size:25px}.svr372-card p{margin:6px 0;color:#dcecf2;line-height:1.38}
    .svr372-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.svr372-actions button{min-height:48px;border:1px solid rgba(255,217,138,.72);border-radius:14px;background:#111827;color:#fff;font-weight:950;touch-action:manipulation}.svr372-actions .primary{grid-column:1/-1;border:0;background:linear-gradient(135deg,#7ffcff,#9b4dff);color:#03040b;font-size:16px}
    #svr372Status{min-height:20px;margin-top:10px;color:#ffd98a;font-weight:850}#svr372Status[data-error="1"]{color:#ff9fbd}
  `;
  document.head.appendChild(style);
  root = document.createElement('section');
  root.id = 'svr372Entry';
  const primaryLabel = platform === 'android' ? 'JOIN TABLE' : 'START VR LOBBY';
  root.innerHTML = `
    <div class="svr372-card">
      <img src="/logo.png" alt="SVR Poker logo">
      <h1>SVR POKER</h1>
      <p>${platform === 'android' ? 'Load the real poker table, then seat and deal from one button.' : 'Load the real lobby and table before entering or seating in VR.'}</p>
      <div class="svr372-actions">
        <button id="svr372Primary" class="primary" type="button">${primaryLabel}</button>
        <button id="svr372LowPower" type="button">LOW POWER</button>
        <button id="svr372Reload" type="button">RELOAD</button>
      </div>
      <div id="svr372Status" role="status">Preparing the verified table…</div>
    </div>`;
  document.body.appendChild(root);
  statusNode = root.querySelector('#svr372Status');
  primaryButton = root.querySelector('#svr372Primary');
  primaryButton.addEventListener('click', primaryAction);
  root.querySelector('#svr372LowPower').addEventListener('click', () => {
    window.SVR_PHASE369_LOW_POWER?.('phase372-entry');
    const renderer = window.__SVR_RENDERER__;
    renderer?.setPixelRatio?.(Math.min(.9, window.devicePixelRatio || 1));
    if (renderer?.shadowMap) renderer.shadowMap.enabled = false;
    setStatus('Low-power rendering enabled.');
  });
  root.querySelector('#svr372Reload').addEventListener('click', () => location.reload());
  return root;
}

function startRuntime() {
  state.runtimeStarted = true;
  document.getElementById('startRuntimeBtn')?.click();
  window.dispatchEvent(new CustomEvent('svr:phase372-runtime-requested'));
}

async function waitForTable(timeoutMs = 45000) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    const table = locateTable();
    if (table) return table;
    await wait(250);
  }
  throw new Error('TABLE_READY_TIMEOUT');
}

async function waitForFunction(names, timeoutMs = 30000) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    for (const name of names) {
      if (typeof window[name] === 'function') return window[name];
    }
    await wait(200);
  }
  throw new Error(`FUNCTION_READY_TIMEOUT:${names.join(',')}`);
}

async function runAndroidJoin() {
  startRuntime();
  setStatus('Loading the table and Android controls…');
  await waitForTable();
  setStatus('Table ready. Seating and dealing…');
  const join = await waitForFunction(['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']);
  const result = await join('phase372-visible-entry');
  if (result === false) throw new Error('JOIN_REJECTED');
  const startedAt = performance.now();
  while (!joinedNow() && performance.now() - startedAt < 15000) await wait(180);
  if (!joinedNow()) throw new Error('JOIN_STATE_TIMEOUT');
  window.SVR_PHASE364_ANDROID_SEAT?.(true);
  window.SVR_PHASE365_SYNC?.();
  window.SVR_PHASE367_DEVICE_CALIBRATE?.();
  root.hidden = true;
  publish('android-joined');
  return true;
}

async function runQuestLobby() {
  startRuntime();
  setStatus('Loading the Quest lobby and verified table…');
  await waitForTable();
  window.SVR_PHASE364_LOBBY_SPAWN?.();
  window.SVR_PHASE361_LOBBY_SPAWN?.();
  document.body.classList.add('boot-released');
  root.hidden = true;
  publish('quest-lobby-ready');
  return true;
}

async function primaryAction() {
  if (activePromise) return activePromise;
  state.attempts += 1;
  primaryButton.disabled = true;
  primaryButton.textContent = platform === 'android' ? 'JOINING TABLE…' : 'LOADING VR LOBBY…';
  activePromise = (platform === 'android' ? runAndroidJoin() : runQuestLobby())
    .catch((error) => {
      state.lastError = String(error?.message || error);
      setStatus(`Recovery needed: ${state.lastError}`, true);
      primaryButton.disabled = false;
      primaryButton.textContent = platform === 'android' ? 'RETRY JOIN TABLE' : 'RETRY VR LOBBY';
      publish('error');
      return false;
    })
    .finally(() => { activePromise = null; });
  return activePromise;
}

function install() {
  if (state.installed) return;
  state.installed = true;
  ensureUi();
  window.SVR_PHASE372_PRIMARY_ACTION = primaryAction;
  window.SVR_PHASE372_QA = () => ({
    ...publish('qa'),
    entryCount: document.querySelectorAll('#svr372Entry').length,
    primaryVisible: Boolean(primaryButton && !root.hidden),
    tableVisible: Boolean(locateTable()?.visible),
    pass: document.querySelectorAll('#svr372Entry').length === 1 && !state.lastError
  });
  window.addEventListener('svr:phase363-immediate-join-state', (event) => {
    if (event.detail?.joined) root.hidden = true;
    publish(event.detail?.reason || 'join-state');
  });
  window.addEventListener('svr:phase368-card-dealer-ready', () => publish('dealer-ready'));
  publish('installed');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
