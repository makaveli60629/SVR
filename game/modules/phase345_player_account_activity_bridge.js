import { account } from '../../site/js/phase345-demo-activity-persistence.js?v=phase345';

const BUILD = 'PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK';
const state = {
  build: BUILD,
  active: true,
  platform: window.SVR_PLATFORM || document.body?.dataset?.platform || 'desktop',
  accountMode: 'loading',
  playerId: null,
  sessionId: null,
  heartbeatCount: 0,
  startedAt: null,
  lastHeartbeatAt: null,
  lastError: null
};
let heartbeatTimer = 0;
let starting = false;

function gameMetadata() {
  const poker = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
  return {
    build: document.body?.dataset?.build || BUILD,
    route: location.pathname,
    phase: poker.phase || null,
    handNo: poker.handNo || 0,
    seated: Boolean(window.SVR_PHASE343_STATE?.seated || document.body.classList.contains('svr343-seated')),
    visible: document.visibilityState === 'visible'
  };
}
function update() {
  const snapshot = account.snapshot();
  state.accountMode = snapshot.mode;
  state.playerId = snapshot.profile?.playerId || null;
  state.sessionId = snapshot.session?.sessionId || null;
  state.heartbeatCount = Number(snapshot.session?.heartbeatCount || state.heartbeatCount || 0);
  state.lastHeartbeatAt = snapshot.session?.lastHeartbeatAt || state.lastHeartbeatAt;
  window.SVR_PHASE345_ACCOUNT_ACTIVITY_STATE = { ...state, checkedAt: new Date().toISOString() };
  const pill = document.getElementById('svr345AccountPill');
  if (pill && !snapshot.profile) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    pill.href = `/site/login.html?return=${returnTo}`;
  }
}
async function startSession() {
  if (starting || account.state.session || !account.state.profile) return account.state.session;
  starting = true;
  try {
    const session = await account.startActivitySession(state.platform, gameMetadata());
    state.startedAt = session?.startedAt || new Date().toISOString();
    update();
    return session;
  } catch (error) {
    state.lastError = String(error?.message || error);
    update();
    return null;
  } finally {
    starting = false;
  }
}
async function heartbeat() {
  if (document.visibilityState !== 'visible') return null;
  if (!account.state.session) await startSession();
  if (!account.state.session) return null;
  try {
    const session = await account.heartbeat(gameMetadata());
    state.heartbeatCount = Number(session?.heartbeatCount || 0);
    state.lastHeartbeatAt = session?.lastHeartbeatAt || new Date().toISOString();
    update();
    return session;
  } catch (error) {
    state.lastError = String(error?.message || error);
    update();
    return null;
  }
}
async function endSession(reason = 'page-exit') {
  if (!account.state.session) return null;
  try {
    const result = await account.endActivitySession({ ...gameMetadata(), reason });
    update();
    return result;
  } catch (error) {
    state.lastError = String(error?.message || error);
    update();
    return null;
  }
}
async function boot() {
  await account.bootstrap();
  update();
  if (account.state.profile) await startSession();
  clearInterval(heartbeatTimer);
  heartbeatTimer = window.setInterval(heartbeat, 60000);
  window.addEventListener('svr:poker-state', update);
  window.addEventListener('svr:account-change', async () => {
    update();
    if (account.state.profile && !account.state.session) await startSession();
  });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') await heartbeat();
  });
  window.addEventListener('pagehide', () => { endSession('pagehide'); }, { once: true });
  window.addEventListener('beforeunload', () => { endSession('beforeunload'); }, { once: true });
  window.SVR_PHASE345_ACCOUNT_QA = () => ({
    build: BUILD,
    platform: state.platform,
    account: account.snapshot(),
    bridge: { ...state },
    apiConfigured: Boolean(account.state.config?.apiBase),
    productionDatabaseWritesEnabled: Boolean(account.state.config?.apiBase && account.state.apiHealthy && account.state.mode === 'api'),
    demoWritesLocalOnly: account.state.mode === 'demo',
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE345_START_SESSION = startSession;
  window.SVR_PHASE345_HEARTBEAT = heartbeat;
  window.SVR_PHASE345_END_SESSION = endSession;
}

if ((window.SVR_PLATFORM || '') === 'android') {
  const style = document.createElement('style');
  style.textContent = '#svr345AccountPill{top:max(106px,calc(env(safe-area-inset-top) + 94px))!important;right:8px!important;font-size:9px!important;padding:5px 7px!important;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
  document.head.appendChild(style);
}

boot().catch((error) => {
  state.lastError = String(error?.message || error);
  update();
});
