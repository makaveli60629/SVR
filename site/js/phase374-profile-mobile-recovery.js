(() => {
  const BUILD = 'PHASE-374-PROFILE-MOBILE-AVATAR-MENU-RECOVERY-LOCK';
  const body = document.body;
  const stage = document.getElementById('profileShowroom');
  if (!stage || !body?.hasAttribute('data-profile-showroom')) return;

  const state = {
    build: BUILD,
    installed: true,
    mobile: matchMedia('(max-width:720px)').matches,
    assetAvailable: null,
    retryAttempted: false,
    fallbackStabilized: false,
    lastStatus: null,
    lastError: null,
    checkedAt: null
  };

  function publish(reason = 'state') {
    const showroom = window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || {};
    state.lastStatus = showroom.status || null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE374_PROFILE_STATE = { ...state, reason, showroom };
    return window.SVR_PHASE374_PROFILE_STATE;
  }

  function status(message) {
    const node = document.getElementById('showroomStatus');
    if (node) node.textContent = message;
  }

  function retryLabel() {
    const button = document.getElementById('showroomRetry');
    if (!button) return;
    button.textContent = 'Retry Full 3D';
    button.hidden = false;
  }

  function normalizeMobileUi() {
    const links = document.querySelector('.nav .links');
    if (links) {
      links.removeAttribute('tabindex');
      links.setAttribute('aria-label', 'Profile navigation');
    }
    const mode = document.getElementById('modePill');
    if (mode && mode.textContent.trim() === 'LOADING') mode.textContent = 'PROFILE CAMERA';
    retryLabel();
  }

  async function assetCheck() {
    try {
      const response = await fetch('/game/assets/models/eric/eric.fbx?v=phase374', {
        method: 'HEAD',
        cache: 'no-store'
      });
      state.assetAvailable = response.ok;
      return response.ok;
    } catch (error) {
      state.assetAvailable = false;
      state.lastError = String(error?.message || error);
      return false;
    }
  }

  async function recover() {
    normalizeMobileUi();
    const available = await assetCheck();
    const showroom = window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || {};
    if (showroom.status === '3d-ready') {
      status(showroom.fallbackUsed
        ? 'Lightweight avatar ready. Tap Retry Full 3D for the detailed model.'
        : '3D avatar ready. Drag to rotate and pinch to zoom.');
      state.fallbackStabilized = Boolean(showroom.fallbackUsed);
      return publish('already-ready');
    }

    if (available && !state.retryAttempted) {
      state.retryAttempted = true;
      status('Avatar asset restored. Retrying the 3D camera…');
      try {
        await window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.();
      } catch (error) {
        state.lastError = String(error?.message || error);
      }
    }

    window.setTimeout(() => {
      const latest = window.SVR_PHASE351_PROFILE_SHOWROOM_STATE || {};
      if (latest.status !== '3d-ready') {
        state.fallbackStabilized = true;
        status(available
          ? 'Mobile avatar preview is active. Tap Retry Full 3D when ready.'
          : 'Mobile avatar preview is active while the detailed model is unavailable.');
        retryLabel();
      }
      publish('recovery-finished');
    }, 4500);

    return publish('recovery-started');
  }

  function qa() {
    const canvas = document.getElementById('profileShowroomCanvas');
    const controls = document.querySelector('.showroom-controls');
    const rect = canvas?.getBoundingClientRect?.();
    const controlsRect = controls?.getBoundingClientRect?.();
    const result = {
      ...publish('qa'),
      canvasVisible: Boolean(rect && rect.width > 0 && rect.height >= 350),
      controlsVisible: Boolean(controlsRect && controlsRect.width > 0 && controlsRect.height > 0),
      controlsBelowCanvas: !state.mobile || Boolean(rect && controlsRect && controlsRect.top >= rect.bottom - 2),
      horizontalMenuScrollRemoved: getComputedStyle(document.querySelector('.nav .links') || document.body).overflowX !== 'auto',
      pass: Boolean(
        rect && rect.width > 0 && rect.height >= 350
        && controlsRect && controlsRect.width > 0
        && (!state.mobile || controlsRect.top >= rect.bottom - 2)
      ),
      checkedAt: new Date().toISOString()
    };
    window.SVR_PHASE374_PROFILE_QA_STATE = result;
    return result;
  }

  body.dataset.profileRecovery = BUILD;
  window.SVR_PHASE374_PROFILE_RECOVER = recover;
  window.SVR_PHASE374_PROFILE_QA = qa;

  window.addEventListener('resize', normalizeMobileUi, { passive: true });
  window.addEventListener('svr:profile-showroom-ready', () => {
    normalizeMobileUi();
    publish('showroom-ready');
  });
  window.addEventListener('svr:account-change', () => window.setTimeout(recover, 250));

  normalizeMobileUi();
  window.setTimeout(recover, 1800);
  window.setTimeout(() => publish('installed'), 0);
})();
