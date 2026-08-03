export const BUILD = 'PHASE-364-POKER-AUDIT-COMMITTED-ALIAS';

const state = {
  build: BUILD,
  installed: false,
  wraps: 0,
  checkedAt: null,
  lastError: null
};

let original = null;

function activeStreetBet(player) {
  const direct = Number(player?.bet ?? player?.committed);
  if (Number.isFinite(direct)) return Math.max(0, direct);
  const action = String(player?.lastAction || '');
  const match = action.match(/(?:raises to|bets|all[- ]?in|SB|BB)\s+(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function install() {
  if (state.installed) return true;
  if (typeof window.SVR_RUN_PHASE336_POKER_AUDIT !== 'function') return false;
  original = window.SVR_RUN_PHASE336_POKER_AUDIT;
  window.SVR_RUN_PHASE336_POKER_AUDIT = (...args) => {
    const report = original(...args);
    if (!report || !Array.isArray(report.players)) return report;
    return {
      ...report,
      players: report.players.map((player) => ({
        ...player,
        committed: activeStreetBet(player)
      }))
    };
  };
  state.installed = true;
  state.wraps += 1;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE364_POKER_AUDIT_ALIAS_STATE = { ...state };
  return true;
}

const timer = window.setInterval(() => {
  try {
    if (install()) window.clearInterval(timer);
  } catch (error) {
    state.lastError = String(error?.message || error);
    window.SVR_PHASE364_POKER_AUDIT_ALIAS_STATE = { ...state };
  }
}, 60);

window.SVR_PHASE364_POKER_AUDIT_ALIAS_QA = () => {
  const report = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
  const players = report?.players || [];
  const aliasesPresent = players.length > 0 && players.every((player) => Number.isFinite(Number(player.committed)));
  return {
    ...state,
    playerCount: players.length,
    aliasesPresent,
    pass: Boolean(state.installed && aliasesPresent),
    checkedAt: new Date().toISOString()
  };
};

install();
