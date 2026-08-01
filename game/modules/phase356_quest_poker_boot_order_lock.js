export const BUILD = 'PHASE-356-QUEST-POKER-BOOT-ORDER-LOCK';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const started = performance.now();
const state = {
  build: BUILD,
  active: true,
  tableReady: false,
  tablePresentationImported: false,
  tablePresentationReady: false,
  pokerEngineImported: false,
  rulesBridgeImported: false,
  elapsedMs: 0,
  error: null
};

function cardsReady() {
  const scene = window.__SVR_SCENE__;
  if (!scene || !window.SVR_PHASE341_TABLE_LAYOUT) return false;
  return Boolean(
    scene.getObjectByName?.('PHASE341_HOLE_0_0')
    && scene.getObjectByName?.('PHASE341_HOLE_0_1')
    && scene.getObjectByName?.('PHASE341_COMMUNITY_0')
    && scene.getObjectByName?.('PHASE341_COMMUNITY_4')
    && scene.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT')
  );
}

async function waitForTable(timeoutMs = 10000) {
  const begin = performance.now();
  while (performance.now() - begin < timeoutMs) {
    window.SVR_PHASE356_BOOT_GOVERN?.();
    if (window.SVR_TABLE_AUTHORITY && window.__SVR_SCENE__ && window.__SVR_CAMERA__) return true;
    await wait(100);
  }
  return false;
}

async function waitForCards(timeoutMs = 12000) {
  const begin = performance.now();
  while (performance.now() - begin < timeoutMs) {
    if (cardsReady()) return true;
    try { await window.SVR_PHASE341_REBUILD?.(); } catch {}
    if (cardsReady()) return true;
    await wait(120);
  }
  return false;
}

try {
  state.tableReady = await waitForTable();
  if (!state.tableReady) throw new Error('PHASE356_QUEST_TABLE_NOT_READY');

  await import('./phase341_canonical_table_geometry_card_motion_lock.js');
  state.tablePresentationImported = true;
  state.tablePresentationReady = await waitForCards();
  if (!state.tablePresentationReady) throw new Error('PHASE356_QUEST_CARDS_NOT_READY');

  await import('./p85_poker_truth_lock.js');
  state.pokerEngineImported = typeof window.SVR_POKER_ACTION === 'function';
  if (!state.pokerEngineImported) throw new Error('PHASE356_QUEST_POKER_ENGINE_NOT_READY');

  await import('./phase336_authoritative_poker_rules_pot_settlement_lock.js');
  state.rulesBridgeImported = true;
} catch (error) {
  state.error = String(error?.stack || error?.message || error);
  throw error;
} finally {
  state.elapsedMs = +(performance.now() - started).toFixed(1);
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE356_POKER_BOOT_STATE = state;
}

window.SVR_PHASE356_POKER_BOOT_QA = () => ({
  ...state,
  tablePresentationReady: cardsReady(),
  pokerAction: typeof window.SVR_POKER_ACTION,
  pokerState: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
  checkedAt: new Date().toISOString(),
  pass: state.tableReady && cardsReady() && typeof window.SVR_POKER_ACTION === 'function' && !state.error
});
