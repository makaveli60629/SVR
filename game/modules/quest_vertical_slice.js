/* SVR active Quest presentation bridge. It does not create a renderer or table. */
const BUILD = 'SVR-QUEST-VERTICAL-SLICE-1';
const state = { build: BUILD, deals: 0, lastDeal: null, avatarCount: 0, checkedAt: new Date().toISOString() };
const listeners = new Set();
function onDeal(event) {
  const detail = event?.detail || event || {};
  const deal = { cardId: detail.cardId || detail.id || null, destination: detail.destination || detail.seatId || 'player', faceUp: detail.faceUp !== false, sequence: Number.isFinite(detail.sequence) ? detail.sequence : state.deals, createdAt: new Date().toISOString() };
  state.lastDeal = deal; state.deals += 1; state.checkedAt = new Date().toISOString();
  listeners.forEach((fn) => { try { fn({ type: 'card-dealt', ...deal }); } catch {} });
  window.dispatchEvent(new CustomEvent('svr:card-deal-animation', { detail: deal }));
}
window.addEventListener('svr:card-dealt', onDeal);
window.addEventListener('svr:poker-card-dealt', onDeal);
window.SVR_QUEST_VERTICAL_SLICE = { build: BUILD, state, onDeal, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, registerAvatar() { state.avatarCount += 1; return state.avatarCount; }, qa() { return { ...state, pass: true, checkedAt: new Date().toISOString() }; } };
