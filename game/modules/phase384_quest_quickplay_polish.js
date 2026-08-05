/* PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK
   Compatibility coordinator. Felt/logo/orientation authority moved to
   PHASE-384-QUEST-LOBBY-WORLD-INTERACTION-POLISH-LOCK.
*/
import * as THREE from 'three';

export const BUILD = 'PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const active = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua) || params.has('desktop') || params.has('standard');
const state = {
  build: BUILD,
  active,
  installed: false,
  questSingleEric: true,
  ericFound: false,
  duplicateEricsHidden: 0,
  externalSkeletonsHidden: 0,
  dealerMotionRequested: false,
  worldAuthority: 'PHASE-384-QUEST-LOBBY-WORLD-INTERACTION-POLISH-LOCK',
  legacyOversizedFeltDisabled: true,
  legacyBackwardDealerRotationDisabled: true,
  lastError: null,
  installedAt: null,
  checkedAt: null
};
let scene = null;
let eric = null;
let timer = 0;

function walk(root, visitor, limit = 22000) {
  const stack = root ? [root] : [];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object) stack.push(child);
  }
}
function isInside(object, root) {
  let current = object;
  while (current) { if (current === root) return true; current = current.parent; }
  return false;
}
function rootUnderScene(object) {
  let current = object;
  while (current?.parent && current.parent !== scene && current.parent?.name !== 'PHASE200_ORDERED_GRAND_LOBBY_ROOT') current = current.parent;
  return current || object;
}
function approvedEric() {
  let found = null;
  walk(scene, (object) => {
    if (found) return;
    if (object.userData?.svrPhase381Approved || object.userData?.svrApprovedDealerRig || object.name === 'PHASE381_APPROVED_CARD_DEALER_RIG') found = object;
  });
  return found;
}
function dedupeDealer() {
  if (!scene || !eric) return 0;
  const duplicates = new Set();
  let skeletons = 0;
  walk(scene, (object) => {
    if (object === eric || isInside(object, eric)) return;
    const label = `${object.name || ''} ${object.userData?.sourceAsset || ''}`;
    if (/eric|approvedDealer|card[_ -]?dealer[_ -]?rig/i.test(label)) duplicates.add(rootUnderScene(object));
    if (object.isSkeletonHelper || object.isBone || /skeleton[_ -]?helper|armature[_ -]?debug|bone[_ -]?structure|phase368_card_dealer_root/i.test(label)) {
      const root = object.isBone ? rootUnderScene(object) : object;
      root.visible = false;
      root.userData = { ...(root.userData || {}), svrPhase384ExternalSkeletonHidden: true };
      skeletons += 1;
    }
  });
  let hidden = 0;
  for (const root of duplicates) {
    if (!root || root === eric || isInside(root, eric)) continue;
    root.visible = false;
    root.userData = { ...(root.userData || {}), svrPhase384DuplicateEricHidden: true };
    hidden += 1;
  }
  state.duplicateEricsHidden = Math.max(state.duplicateEricsHidden, hidden);
  state.externalSkeletonsHidden = Math.max(state.externalSkeletonsHidden, skeletons);
  return hidden;
}
function disableLegacyFelt() {
  for (const name of ['PHASE384_PROFESSIONAL_SVR_FELT', 'PHASE384_SVR_TABLE_LOGO']) {
    const object = scene?.getObjectByName?.(name);
    if (object) object.visible = false;
  }
}
function sweep() {
  scene = window.__SVR_SCENE__ || scene;
  if (!scene) return false;
  eric = approvedEric() || eric;
  if (eric) {
    eric.visible = true;
    state.ericFound = true;
    dedupeDealer();
    if (!state.dealerMotionRequested) {
      window.SVR_PHASE381_PLAY_ERIC?.('phase384-quick-play-demo');
      state.dealerMotionRequested = true;
    }
  }
  disableLegacyFelt();
  window.SVR_PHASE384_WORLD_SWEEP?.();
  return Boolean(eric);
}
function qa() {
  state.checkedAt = new Date().toISOString();
  const world = window.SVR_PHASE384_WORLD_QA?.() || window.SVR_PHASE384_WORLD_STATE || null;
  return {
    ...state,
    world,
    pass: !active || Boolean(state.installed && state.ericFound && state.questSingleEric && state.legacyOversizedFeltDisabled && state.legacyBackwardDealerRotationDisabled && (!world || world.pass !== false))
  };
}
function install() {
  if (!active || state.installed) return;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  timer = window.setInterval(sweep, 850);
  window.addEventListener('svr:phase381-core-ready', sweep);
  window.addEventListener('svr:phase384-core-ready', sweep);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
}
install();
window.SVR_PHASE384_QUEST_SWEEP = sweep;
window.SVR_PHASE384_QUEST_QA = qa;
window.SVR_PHASE384_QUEST_STATE = state;
