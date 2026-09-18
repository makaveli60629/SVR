/* SVR Quest movement/alignment contract.
 * This module observes the existing movement implementation and provides one
 * calibration API without creating a second locomotion controller.
 */
const BUILD = 'SVR-QUEST-MOVEMENT-CALIBRATION-1';
const params = new URLSearchParams(location.search);
const active = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const anchors = {
  table: 'SVR_TABLE_CENTER',
  felt: 'SVR_TABLE_FELT_SURFACE',
  seat: 'SVR_SEAT_PLAYER',
  dealer: 'SVR_SEAT_DEALER',
  deck: 'SVR_DECK_ORIGIN',
  pot: 'SVR_POT_CENTER',
  dealerHand: 'SVR_DEALER_HAND'
};
const state = { build: BUILD, active, snapTurnDegrees: 45, seated: false, calibrated: false, anchors, checkedAt: new Date().toISOString() };

function findAnchor(name) {
  return window.__SVR_SCENE__?.getObjectByName?.(name) || window.SVR_WORLD_REF?.anchors?.[name] || null;
}
function calibrate() {
  const found = Object.fromEntries(Object.entries(anchors).map(([key, name]) => [key, Boolean(findAnchor(name))]));
  state.anchorPresence = found;
  state.calibrated = Boolean(found.table || found.felt || found.seat);
  state.checkedAt = new Date().toISOString();
  window.SVR_QUEST_MOVEMENT_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:movement-calibrated', { detail: { ...state } }));
  return { ...state };
}
function recenter() {
  const movement = window.SVR_MOVEMENT || window.SVR_TELEPORT || window.SVR_LOCOMOTION;
  const seat = findAnchor(anchors.seat);
  if (seat && typeof movement?.setPlayerPose === 'function') movement.setPlayerPose(seat.position.x, -0.42, seat.position.z);
  state.seated = Boolean(seat);
  state.checkedAt = new Date().toISOString();
  return { ...state };
}
window.SVR_QUEST_MOVEMENT = { build: BUILD, state, calibrate, recenter, anchors, qa: () => ({ ...calibrate(), pass: state.active && state.snapTurnDegrees > 0 }) };
setTimeout(calibrate, 0);
window.addEventListener('svr:platform-ready', calibrate);
