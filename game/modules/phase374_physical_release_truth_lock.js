export const BUILD = 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = /Quest|Oculus|Meta Quest/i.test(ua) || params.get('platform') === 'quest'
  ? 'quest'
  : (/Android/i.test(ua) ? 'android' : 'desktop');

const state = {
  build: BUILD,
  platform,
  installed: false,
  deploy: null,
  deployError: null,
  tableFound: false,
  tableVisible: false,
  joined: false,
  seated: false,
  coreReady: false,
  recoveryRuns: 0,
  cacheResets: 0,
  lastReason: 'boot',
  checkedAt: null,
  pass: false
};

let badge;
let panel;
let statusText;
let detailText;
let timer = 0;

const tableNames = [
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
  'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
  'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED'
];

function locateTable() {
  const scene = window.__SVR_SCENE__;
  let table = window.SVR_TABLE_AUTHORITY;
  if (!table?.isObject3D) {
    for (const name of tableNames) {
      table = scene?.getObjectByName?.(name);
      if (table?.isObject3D) break;
    }
  }
  if (!table?.isObject3D) return null;
  table.visible = true;
  table.traverse?.((object) => {
    object.visible = true;
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      if (Number.isFinite(material.opacity) && material.opacity <= 0.05) material.opacity = 1;
      material.needsUpdate = true;
    }
  });
  window.SVR_TABLE_AUTHORITY = table;
  return table;
}

function joinedNow() {
  return Boolean(
    window.SVR_PHASE363_JOINED_IMMEDIATE
    || window.SVR_PHASE363_STATE?.joined
    || window.SVR_PHASE361_STATE?.seated
  );
}

function seatedNow() {
  return Boolean(
    document.body.classList.contains('svr363-seated')
    || document.body.classList.contains('svr365-seated')
    || window.SVR_PHASE361_STATE?.seated
  );
}

function coreReadyNow() {
  if (platform === 'android') return window.SVR_PHASE372_CORE_READY === true;
  if (platform === 'quest') return Boolean(window.SVR_PHASE373_FINALIZER_QA || window.SVR_PHASE373_QA);
  return Boolean(window.__SVR_SCENE__ && window.__SVR_RENDERER__);
}

async function readDeployHealth() {
  try {
    const response = await fetch(`/deploy-health.json?phase374=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    state.deploy = await response.json();
    state.deployError = null;
  } catch (error) {
    state.deployError = String(error?.message || error);
  }
}

function inspect(reason = 'inspect') {
  const table = locateTable();
  state.tableFound = Boolean(table);
  state.tableVisible = Boolean(table?.visible);
  state.joined = joinedNow();
  state.seated = seatedNow();
  state.coreReady = coreReadyNow();
  state.lastReason = reason;
  state.checkedAt = new Date().toISOString();
  const deployedPhase374 = String(state.deploy?.build || '').includes('374')
    || String(state.deploy?.physicalRelease || '').includes('374');
  state.pass = Boolean(state.coreReady && state.tableFound && state.tableVisible && deployedPhase374);
  window.SVR_PHASE374_STATE = { ...state };
  render();
  return window.SVR_PHASE374_STATE;
}

function phaseLabel() {
  const commit = String(state.deploy?.commit || '').slice(0, 8) || 'pending';
  return `PHASE 374 • ${platform.toUpperCase()} • ${state.pass ? 'LIVE' : 'CHECK'} • ${commit}`;
}

function render() {
  if (!badge) return;
  badge.dataset.pass = state.pass ? '1' : '0';
  badge.textContent = phaseLabel();
  if (statusText) {
    statusText.textContent = state.pass
      ? 'CURRENT PHYSICAL RELEASE VERIFIED'
      : 'RECOVERY ACTIVE — CHECKING CURRENT DEVICE BUILD';
  }
  if (detailText) {
    detailText.textContent = JSON.stringify({
      platform: state.platform,
      deployedBuild: state.deploy?.build || null,
      deployedCommit: state.deploy?.commit || null,
      coreReady: state.coreReady,
      tableFound: state.tableFound,
      tableVisible: state.tableVisible,
      joined: state.joined,
      seated: state.seated,
      recoveryRuns: state.recoveryRuns,
      deployError: state.deployError
    }, null, 2);
  }
}

function ensureUi() {
  if (badge) return;
  const style = document.createElement('style');
  style.id = 'svr374-physical-release-style';
  style.textContent = `
    #svr374Badge{position:fixed;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));z-index:2147483647;border:1px solid rgba(255,217,138,.78);border-radius:999px;background:rgba(5,8,16,.92);color:#ffd98a;padding:9px 12px;font:900 10px/1.1 system-ui,Arial;letter-spacing:.07em;box-shadow:0 10px 36px rgba(0,0,0,.65);backdrop-filter:blur(12px);cursor:pointer;touch-action:manipulation}
    #svr374Badge[data-pass="1"]{border-color:rgba(86,255,154,.9);color:#56ff9a;box-shadow:0 0 24px rgba(86,255,154,.24)}
    #svr374Panel{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.82);font-family:system-ui,Arial;color:#fff;backdrop-filter:blur(12px)}
    #svr374Panel[hidden]{display:none!important}.svr374-card{width:min(560px,94vw);max-height:88vh;overflow:auto;border:1px solid rgba(127,252,255,.7);border-radius:22px;background:rgba(4,7,16,.98);padding:20px;box-shadow:0 28px 90px rgba(0,0,0,.8)}
    .svr374-card h2{margin:0 0 8px;color:#7ffcff;font-size:18px}.svr374-card p{margin:6px 0;color:#e6ecff}.svr374-card pre{white-space:pre-wrap;word-break:break-word;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#02040a;padding:12px;color:#c9ffdc;font-size:11px}
    .svr374-actions{display:flex;gap:8px;flex-wrap:wrap}.svr374-actions button{flex:1;min-width:130px;min-height:44px;border:1px solid rgba(127,252,255,.55);border-radius:999px;background:#111827;color:#fff;font-weight:900}.svr374-actions .primary{border:0;background:linear-gradient(135deg,#56ff9a,#7ffcff);color:#02070a}
  `;
  document.head.appendChild(style);

  badge = document.createElement('button');
  badge.id = 'svr374Badge';
  badge.type = 'button';
  badge.textContent = 'PHASE 374 • CHECKING';
  badge.addEventListener('click', () => { panel.hidden = false; inspect('badge-open'); });
  document.body.appendChild(badge);

  panel = document.createElement('section');
  panel.id = 'svr374Panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="svr374-card">
      <h2>SVR PHYSICAL RELEASE VERIFIER</h2>
      <p id="svr374Status">Checking current deployment…</p>
      <pre id="svr374Details">Loading…</pre>
      <div class="svr374-actions">
        <button class="primary" type="button" data-recover>RUN DEVICE RECOVERY</button>
        <button type="button" data-refresh>REFRESH STATUS</button>
        <button type="button" data-cache>CLEAR OLD CACHE</button>
        <button type="button" data-close>CLOSE</button>
      </div>
    </div>`;
  document.body.appendChild(panel);
  statusText = panel.querySelector('#svr374Status');
  detailText = panel.querySelector('#svr374Details');
  panel.querySelector('[data-recover]').addEventListener('click', () => recover('manual-panel'));
  panel.querySelector('[data-refresh]').addEventListener('click', async () => { await readDeployHealth(); inspect('manual-refresh'); });
  panel.querySelector('[data-cache]').addEventListener('click', clearOldCache);
  panel.querySelector('[data-close]').addEventListener('click', () => { panel.hidden = true; });
}

async function recover(reason = 'automatic') {
  state.recoveryRuns += 1;
  state.lastReason = reason;
  locateTable();
  if (platform === 'android') {
    window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.(`phase374:${reason}`);
    window.SVR_PHASE365_SYNC?.();
    window.SVR_PHASE365_REFRESH_CARD_BRAND?.();
    window.SVR_PHASE367_DEVICE_CALIBRATE?.();
  } else if (platform === 'quest') {
    window.SVR_PHASE373_REPAIR_TABLE?.();
    window.SVR_PHASE373_REPAIR_NPCS?.();
    window.SVR_PHASE373_POSTFLIGHT_REPAIR_NPCS?.();
    if (!seatedNow()) window.SVR_PHASE373_STABLE_LOBBY?.(`phase374:${reason}`);
    window.SVR_PHASE373_FINALIZE_TABLE?.(`phase374:${reason}`);
    if (seatedNow()) window.SVR_PHASE373_FINALIZE_SEAT?.(`phase374:${reason}`);
    else window.SVR_PHASE373_POSTFLIGHT_RESTORE_TELEPORT?.(`phase374:${reason}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 180));
  return inspect(`recovered:${reason}`);
}

async function clearOldCache() {
  state.cacheResets += 1;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    state.deployError = String(error?.message || error);
  }
  const next = new URL(location.href);
  next.searchParams.set('v', 'phase374');
  next.searchParams.set('fresh', String(Date.now()));
  location.replace(next.toString());
}

async function install() {
  if (state.installed) return;
  state.installed = true;
  document.body.dataset.physicalRelease = 'phase374';
  document.body.classList.add('svr-phase374-physical-release');
  ensureUi();
  window.SVR_PHASE374_RECOVER = recover;
  window.SVR_PHASE374_CLEAR_OLD_CACHE = clearOldCache;
  window.SVR_PHASE374_QA = () => inspect('qa');
  await readDeployHealth();
  inspect('installed');
  setTimeout(() => recover('initial-1s'), 1000);
  setTimeout(() => recover('initial-4s'), 4000);
  timer = window.setInterval(() => inspect('interval'), 2500);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  window.addEventListener('svr:phase372-core-ready', () => recover('android-core-ready'));
  window.addEventListener('svr:phase373-core-ready', () => recover('quest-core-ready'));
  window.addEventListener('svr:phase363-immediate-join-state', () => inspect('join-state'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recover('visibility'); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
