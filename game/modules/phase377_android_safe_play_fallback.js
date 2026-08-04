import './phase376_android_safe_play_fallback.js?v=phase377';

export const BUILD = 'PHASE-377-ANDROID-CANONICAL-SAFE-PLAY-FALLBACK';

function retargetControls() {
  const root = document.getElementById('svr376SafeTable');
  if (!root) return false;
  const title = root.querySelector('.svr376-safe-title');
  if (title) title.textContent = 'SVR POKER — ANDROID TABLE';
  const retry = root.querySelector('#svr376Retry3d');
  const leave = root.querySelector('#svr376SafeLeave');
  if (retry) {
    retry.textContent = 'TRY 3D ROOM';
    retry.onclick = () => location.replace(`/game/android-play.html?channel=stable&v=phase377&mode=3d&t=${Date.now()}`);
  }
  if (leave) {
    leave.textContent = 'LEAVE TABLE';
    leave.onclick = () => location.replace(`/game/android-play.html?channel=stable&v=phase377&leave=${Date.now()}`);
  }
  document.body.dataset.build = BUILD;
  window.SVR_PHASE377_SAFE_STATE = {
    build: BUILD,
    active: true,
    tablePresent: true,
    checkedAt: new Date().toISOString()
  };
  return true;
}

export function startSafePlay() {
  window.SVR_PHASE376_START_SAFE_PLAY?.();
  [0, 80, 250].forEach((delay) => setTimeout(retargetControls, delay));
  return true;
}

window.SVR_PHASE377_START_SAFE_PLAY = startSafePlay;
if (window.SVR_PHASE377_SAFE_AUTOSTART === true) startSafePlay();
