/* SVR Quest onboarding and player-facing recovery layer.
 * Player guidance only: no renderer, scene, movement, poker, table, dealer or watch authority.
 */
const BUILD = 'SVR-QUEST-ONBOARDING-2';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const isQuest = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua);
const explicitlyOff = params.get('onboarding') === 'off';
const enabled = !explicitlyOff && (isQuest || params.get('onboarding') === '1');

if (enabled) {
  const tableOnly = params.get('tableonly') === '1';
  const autoSeated = params.get('autoseat') === '1' || params.get('seated') === '1';
  const teleportEnabled = params.get('teleport') !== 'off' && window.SVR_TELEPORT_DISABLED !== true;
  const productionTableMode = tableOnly || autoSeated;
  const seenKey = 'svr_quest_onboarding_seen_v2';
  const state = {
    build: BUILD,
    step: 0,
    visible: true,
    productionTableMode,
    teleportEnabled,
    startedAt: new Date().toISOString(),
    lastMessage: ''
  };

  const tableSteps = [
    ['Welcome to SVR Poker', 'Look around to confirm headset tracking. Hands are preferred; Quest controllers remain a fallback.'],
    ['Enter the table', 'When loading reaches 100%, press VR GAME ON. The production Quest route seats you at the table automatically.'],
    ['Check your wrist console', 'Your wrist console provides poker actions and recovery controls. Keep your wrist in a comfortable, readable position.'],
    ['Play the hand', 'Use the available poker actions for your turn. Eric, cards, pot, and the active table state should remain in front of you.']
  ];
  const lobbySteps = [
    ['Welcome to SVR Poker', 'Look around to confirm headset tracking. Hands are preferred; Quest controllers remain a fallback.'],
    ['Enter VR', 'Press VR GAME ON after loading completes.'],
    ['Move through the room', teleportEnabled ? 'Aim the teleport guide and release to move. Invalid destinations should be rejected clearly.' : 'Teleport is disabled in this route. Use the active movement controls or room-scale movement.'],
    ['Join the table', 'Approach the poker table and use the available seat or join control.'],
    ['Play the hand', 'Use the available poker actions for your turn. Cards, pot, and active-player feedback should remain readable.']
  ];
  const steps = productionTableMode ? tableSteps : lobbySteps;

  const style = document.createElement('style');
  style.textContent = `
    #svrQuestGuide{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:80;width:min(600px,calc(100vw - 28px));box-sizing:border-box;padding:18px 20px;color:#f5f4ff;background:linear-gradient(180deg,rgba(11,13,25,.96),rgba(5,7,15,.94));border:1px solid rgba(127,252,255,.72);border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.62),0 0 26px rgba(109,40,217,.16);font:16px/1.42 system-ui,sans-serif;backdrop-filter:blur(10px)}
    #svrQuestGuide[hidden]{display:none}#svrQuestGuide h2{margin:0 0 6px;font-size:20px;color:#7ffcff}#svrQuestGuide p{margin:0 0 14px;color:#e6e4f4}#svrQuestGuide .row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}#svrQuestGuide button{border:1px solid rgba(127,252,255,.65);border-radius:999px;padding:9px 16px;background:#111b2b;color:#fff;font-weight:800}#svrQuestGuide button.primary{background:#176276}#svrQuestGuide .count{float:right;color:#b9b4d2;font-size:13px}
    #svrQuestToast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:81;max-width:calc(100vw - 28px);padding:10px 16px;border-radius:999px;background:rgba(10,14,28,.96);border:1px solid rgba(246,226,127,.75);color:#fff5b0;font:700 14px system-ui,sans-serif;pointer-events:none;text-align:center}#svrQuestToast[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const guide = document.createElement('section');
  guide.id = 'svrQuestGuide';
  guide.setAttribute('aria-live', 'polite');
  guide.innerHTML = '<span class="count"></span><h2></h2><p></p><div class="row"><button data-action="skip">Skip guide</button><button class="primary" data-action="next">Next</button></div>';
  document.body.appendChild(guide);

  const toast = document.createElement('div');
  toast.id = 'svrQuestToast';
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);

  const title = guide.querySelector('h2');
  const copy = guide.querySelector('p');
  const count = guide.querySelector('.count');
  const nextButton = guide.querySelector('[data-action="next"]');

  function render() {
    const step = steps[state.step];
    title.textContent = step[0];
    copy.textContent = step[1];
    count.textContent = `${state.step + 1} / ${steps.length}`;
    nextButton.textContent = state.step === steps.length - 1 ? 'Done' : 'Next';
  }

  function finish({ persist = true } = {}) {
    guide.hidden = true;
    state.visible = false;
    if (persist) {
      try { localStorage.setItem(seenKey, '1'); } catch {}
    }
  }

  guide.addEventListener('click', event => {
    const action = event.target?.dataset?.action;
    if (action === 'skip') finish();
    if (action === 'next') {
      if (state.step < steps.length - 1) {
        state.step += 1;
        render();
      } else {
        finish();
      }
    }
  });

  try {
    if (localStorage.getItem(seenKey) === '1' && params.get('onboarding') !== '1') finish({ persist: false });
  } catch {}
  render();

  let toastTimer = 0;
  function notify(message, { force = false } = {}) {
    const text = String(message || '').trim();
    if (!text || (!force && text === state.lastMessage)) return;
    state.lastMessage = text;
    if (!force && !/move|closer|seat|ready|watch|vr game|hand|controller|table|error|failed|unavailable|occupied|turn|loading/i.test(text)) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
  }

  window.SVR_QUEST_ONBOARDING = {
    build: BUILD,
    state,
    next: () => {
      state.step = Math.min(state.step + 1, steps.length - 1);
      render();
    },
    finish,
    notify
  };

  window.addEventListener('svr:boot-progress', event => {
    const detail = event.detail || {};
    if (detail.percent >= 100) notify('Table ready. Press VR GAME ON.', { force: true });
  });
  window.addEventListener('svr:platform-ready', () => notify(productionTableMode ? 'Quest table core ready.' : 'Quest room core ready.'));
  window.addEventListener('svr:phase460-core-ready', () => notify('Table, Eric, lighting, and controls are ready.', { force: true }));
  window.addEventListener('svr:phase358-acceptance', event => {
    if (event.detail?.error) notify('Quest startup check failed. Reload the game and try again.', { force: true });
  });
  window.addEventListener('error', event => {
    if (!/ResizeObserver loop/i.test(String(event.message || ''))) notify('The game hit an error. Use TRY AGAIN or reload the game.', { force: true });
  });
  window.addEventListener('unhandledrejection', () => notify('The game could not finish loading. Use TRY AGAIN or reload the game.', { force: true }));
  ['svr:poker-state', 'svr:poker-player-action'].forEach(type => window.addEventListener(type, event => {
    const detail = event.detail || {};
    if (detail.waitingHuman || detail.waitingForHuman) notify('Your turn — choose an available poker action.', { force: true });
  }));
}