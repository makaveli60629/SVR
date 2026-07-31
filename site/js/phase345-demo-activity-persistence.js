import { account } from './phase345-player-account-client.js?v=phase345';

const ACTIVITY_KEY = 'svr_phase345_demo_daily_activity_v1';
const PROFILE_KEY = 'svr_phase345_demo_player_v1';
const original = {
  heartbeat: account.heartbeat.bind(account),
  endActivitySession: account.endActivitySession.bind(account),
  rewardStatus: account.rewardStatus.bind(account),
  claimDailyReward: account.claimDailyReward.bind(account)
};

const today = () => new Date().toISOString().slice(0, 10);
function readActivity() {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || 'null');
    if (!value || value.date !== today()) return { date: today(), activeSeconds: 0, heartbeatCount: 0 };
    return value;
  } catch {
    return { date: today(), activeSeconds: 0, heartbeatCount: 0 };
  }
}
function writeActivity(value) {
  const next = {
    date: today(),
    activeSeconds: Math.max(0, Number(value.activeSeconds || 0)),
    heartbeatCount: Math.max(0, Number(value.heartbeatCount || 0)),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
  return next;
}
function emit() {
  window.dispatchEvent(new CustomEvent('svr:account-session', { detail: account.snapshot() }));
  window.dispatchEvent(new CustomEvent('svr:account-change', { detail: account.snapshot() }));
}

account.heartbeat = async function patchedHeartbeat(metadata = {}) {
  if (account.state.mode !== 'demo') return original.heartbeat(metadata);
  const before = Number(account.state.session?.activeSeconds || 0);
  const session = await original.heartbeat(metadata);
  const after = Number(session?.activeSeconds || before);
  const delta = Math.max(0, after - before);
  const daily = readActivity();
  writeActivity({
    activeSeconds: daily.activeSeconds + delta,
    heartbeatCount: daily.heartbeatCount + (session ? 1 : 0)
  });
  return session;
};

account.endActivitySession = async function patchedEnd(metadata = {}) {
  if (account.state.mode === 'demo' && account.state.session) await account.heartbeat(metadata);
  return original.endActivitySession(metadata);
};

account.rewardStatus = async function patchedRewardStatus() {
  if (account.state.mode !== 'demo') return original.rewardStatus();
  const daily = readActivity();
  const claimed = String(account.state.profile?.lastRewardClaim || '').slice(0, 10) === today();
  const requiredSeconds = Number(account.state.config?.minimumActivitySeconds || 300);
  const requiredHeartbeats = 3;
  return {
    eligible: !claimed && daily.activeSeconds >= requiredSeconds && daily.heartbeatCount >= requiredHeartbeats,
    claimed,
    activeSeconds: daily.activeSeconds,
    heartbeatCount: daily.heartbeatCount,
    requiredSeconds,
    requiredHeartbeats,
    rewardChips: Number(account.state.config?.dailyRewardChips || 5000),
    demoMode: true
  };
};

account.claimDailyReward = async function patchedClaim() {
  if (account.state.mode !== 'demo') return original.claimDailyReward();
  const status = await account.rewardStatus();
  if (!status.eligible) throw new Error(status.claimed ? 'REWARD_ALREADY_CLAIMED' : 'MORE_ACTIVITY_REQUIRED');
  const profile = {
    ...account.state.profile,
    playMoney: Number(account.state.profile?.playMoney || 0) + status.rewardChips,
    dailyStreak: Number(account.state.profile?.dailyStreak || 0) + 1,
    lastRewardClaim: new Date().toISOString(),
    demoMode: true
  };
  account.state.profile = profile;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  emit();
  return { claimed: true, rewardChips: status.rewardChips, profile, demoMode: true };
};

window.SVR_PHASE345_DEMO_ACTIVITY = {
  read: readActivity,
  reset: () => writeActivity({ activeSeconds: 0, heartbeatCount: 0 }),
  build: 'PHASE-345-DEMO-ACTIVITY-PERSISTENCE-FIX'
};

export { account };
