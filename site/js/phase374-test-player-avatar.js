export const BUILD = 'PHASE-374-TEST-PLAYER-AVATAR-LOCK';

const PROFILE_URL = '/site/config/phase374-test-player.json';
const DEMO_KEY = 'svr_phase345_demo_player_v1';
const TEST_KEY = 'svr_phase374_test_player_v1';

async function loadTemplate() {
  const response = await fetch(`${PROFILE_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`TEST_PLAYER_TEMPLATE_${response.status}`);
  return response.json();
}

function writeProfile(profile) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(profile));
  localStorage.setItem(TEST_KEY, JSON.stringify({
    build: BUILD,
    playerId: profile.playerId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  }));
  return profile;
}

export async function createPhase374TestPlayer(overrides = {}) {
  const template = await loadTemplate();
  const now = new Date().toISOString();
  const profile = {
    ...template,
    ...overrides,
    playerId: String(overrides.playerId || template.playerId || 'phase374-local-test-player'),
    displayName: String(overrides.displayName || template.displayName || 'SVR Test Player').slice(0, 40),
    email: String(overrides.email || template.email || 'test-player@svrpoker.com'),
    role: 'player',
    playMoney: Number(overrides.playMoney || template.playMoney || 50000),
    avatarUrl: String(overrides.avatarUrl || template.avatarUrl || '/logo.png'),
    avatarModelUrl: String(overrides.avatarModelUrl || template.avatarModelUrl || '/game/assets/models/eric/eric.fbx'),
    avatarName: String(overrides.avatarName || template.avatarName || 'Eric'),
    equippedOutfit: { ...(template.equippedOutfit || {}), ...(overrides.equippedOutfit || {}) },
    demoMode: true,
    testAccount: true,
    cloudAccount: false,
    createdAt: overrides.createdAt || template.createdAt || now,
    updatedAt: now,
    lastLoginAt: now
  };
  writeProfile(profile);
  window.SVR_PHASE374_TEST_PLAYER = { build: BUILD, profile: { ...profile }, checkedAt: now };
  window.dispatchEvent(new CustomEvent('svr:phase374-test-player-created', { detail: { profile: { ...profile } } }));
  return profile;
}

export function readPhase374TestPlayer() {
  try {
    const profile = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
    if (!profile?.testAccount) return null;
    return profile;
  } catch {
    return null;
  }
}

export function clearPhase374TestPlayer() {
  const profile = readPhase374TestPlayer();
  if (profile?.testAccount) localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(TEST_KEY);
  window.SVR_PHASE374_TEST_PLAYER = { build: BUILD, profile: null, clearedAt: new Date().toISOString() };
  return true;
}

window.SVR_PHASE374_CREATE_TEST_PLAYER = createPhase374TestPlayer;
window.SVR_PHASE374_READ_TEST_PLAYER = readPhase374TestPlayer;
window.SVR_PHASE374_CLEAR_TEST_PLAYER = clearPhase374TestPlayer;
