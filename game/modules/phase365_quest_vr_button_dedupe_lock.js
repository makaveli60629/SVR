export const BUILD = 'PHASE-365-QUEST-VR-BUTTON-DEDUPE-LOCK';

const QUEST = /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')
  || new URLSearchParams(location.search).get('platform') === 'quest';
const state = {
  build: BUILD,
  active: QUEST,
  sweeps: 0,
  removedButtons: 0,
  removedRoots: 0,
  removedStyles: 0,
  remainingButtons: 0,
  installedAt: null,
  checkedAt: null
};

let observer = null;
let interval = 0;

function removeNode(node) {
  if (!node?.isConnected) return false;
  node.remove();
  return true;
}

function sweep() {
  if (!QUEST) return 0;
  const buttons = [...document.querySelectorAll('#svr364EnterVr')];
  let keep = buttons.find((button) => button.offsetParent !== null) || buttons[0] || null;
  if (buttons.length > 1) {
    for (const button of buttons) {
      if (button === keep) continue;
      const root = button.closest('#svr364Xr');
      if (root && root !== keep?.closest('#svr364Xr')) {
        if (removeNode(root)) state.removedRoots += 1;
      } else if (removeNode(button)) state.removedButtons += 1;
    }
  }

  const roots = [...document.querySelectorAll('#svr364Xr')];
  const keepRoot = keep?.closest('#svr364Xr') || roots[0] || null;
  for (const root of roots) {
    if (root === keepRoot) continue;
    if (removeNode(root)) state.removedRoots += 1;
  }

  const styles = [...document.querySelectorAll('style#svr364XrStyle')];
  for (let index = 1; index < styles.length; index += 1) {
    if (removeNode(styles[index])) state.removedStyles += 1;
  }

  const remaining = [...document.querySelectorAll('#svr364EnterVr')];
  keep = remaining[0] || null;
  if (keep) {
    keep.dataset.svr365VrAuthority = '1';
    keep.setAttribute('aria-label', 'Enter SVR Poker VR');
  }

  state.sweeps += 1;
  state.remainingButtons = remaining.length;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE365_QUEST_VR_BUTTON_STATE = { ...state };
  return remaining.length;
}

function qa() {
  const customVrButtons = document.querySelectorAll('#svr364EnterVr').length;
  const oldVrButtons = document.querySelectorAll('.svr-vr-button,#VRButton').length;
  const result = {
    ...state,
    customVrButtons,
    oldVrButtons,
    pass: QUEST && customVrButtons === 1 && oldVrButtons === 0,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE365_QUEST_VR_BUTTON_QA_STATE = result;
  return result;
}

function install() {
  if (!QUEST || window.__SVR_PHASE365_QUEST_VR_BUTTON_DEDUPE__) return;
  window.__SVR_PHASE365_QUEST_VR_BUTTON_DEDUPE__ = true;
  state.installedAt = new Date().toISOString();
  observer = new MutationObserver(sweep);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  interval = window.setInterval(sweep, 220);
  window.SVR_PHASE365_QUEST_VR_BUTTON_SWEEP = sweep;
  window.SVR_PHASE365_QUEST_VR_BUTTON_QA = qa;
  [0, 80, 240, 600, 1200, 2400].forEach((delay) => window.setTimeout(sweep, delay));
}

install();
