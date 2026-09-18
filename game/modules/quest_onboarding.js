/* SVR Quest onboarding and player-facing recovery layer.
 * Loaded by the Quest entry point after the renderer exists.
 * It deliberately uses DOM only and does not create a second scene/table.
 */
const BUILD = 'SVR-QUEST-ONBOARDING-1';
const params = new URLSearchParams(location.search);
const isQuest = params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const enabled = isQuest || params.get('onboarding') === '1';

if (enabled) {
  const state = { step: 0, visible: true, startedAt: new Date().toISOString(), lastMessage: '' };
  const steps = [
    ['Welcome to SVR Poker', 'Look around to confirm your headset is tracking. Use controllers or pinch with your hands.'],
    ['Move to the table', 'Hold the grip or trigger to aim the teleport arc, then release to teleport.'],
    ['Take your seat', 'Move close to the table and select QUICK SIT on your wrist console.'],
    ['Play the hand', 'Use the large table actions to fold, check, call, or raise. Your pot and turn are shown above the felt.']
  ];
  const style = document.createElement('style');
  style.textContent = `
    #svrQuestGuide{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:80;width:min(560px,calc(100vw - 28px));box-sizing:border-box;padding:18px 20px;color:#f5f4ff;background:rgba(5,8,18,.92);border:1px solid rgba(127,252,255,.7);border-radius:18px;box-shadow:0 16px 50px rgba(0,0,0,.55);font:16px/1.4 system-ui,sans-serif;backdrop-filter:blur(10px)}
    #svrQuestGuide[hidden]{display:none}#svrQuestGuide h2{margin:0 0 6px;font-size:20px;color:#7ffcff}#svrQuestGuide p{margin:0 0 14px;color:#e6e4f4}#svrQuestGuide .row{display:flex;gap:10px;justify-content:flex-end}#svrQuestGuide button{border:1px solid rgba(127,252,255,.65);border-radius:999px;padding:9px 16px;background:#111b2b;color:#fff;font-weight:700}#svrQuestGuide button.primary{background:#176276}#svrQuestGuide .count{float:right;color:#b9b4d2;font-size:13px}
    #svrQuestToast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:81;padding:10px 16px;border-radius:999px;background:rgba(10,14,28,.94);border:1px solid rgba(246,226,127,.75);color:#fff5b0;font:600 14px system-ui,sans-serif;pointer-events:none}#svrQuestToast[hidden]{display:none}
  `;
  document.head.appendChild(style);
  const guide = document.createElement('section');
  guide.id = 'svrQuestGuide'; guide.setAttribute('aria-live', 'polite');
  guide.innerHTML = '<span class="count"></span><h2></h2><p></p><div class="row"><button data-action="skip">Skip guide</button><button class="primary" data-action="next">Next</button></div>';
  document.body.appendChild(guide);
  const toast = document.createElement('div'); toast.id = 'svrQuestToast'; toast.hidden = true; toast.setAttribute('role','status'); document.body.appendChild(toast);
  const title = guide.querySelector('h2'), copy = guide.querySelector('p'), count = guide.querySelector('.count');
  const render = () => { const step = steps[state.step]; title.textContent = step[0]; copy.textContent = step[1]; count.textContent = `${state.step + 1} / ${steps.length}`; guide.querySelector('[data-action="next"]').textContent = state.step === steps.length - 1 ? 'Done' : 'Next'; };
  const finish = () => { guide.hidden = true; state.visible = false; try { localStorage.setItem('svr_quest_onboarding_seen','1'); } catch {} };
  guide.addEventListener('click', event => { const action = event.target?.dataset?.action; if (action === 'skip') finish(); if (action === 'next') state.step < steps.length - 1 ? (state.step += 1, render()) : finish(); });
  try { if (localStorage.getItem('svr_quest_onboarding_seen') === '1' && params.get('onboarding') !== '1') finish(); } catch {}
  render();
  let toastTimer = 0;
  const notify = (message) => { if (!message || message === state.lastMessage) return; state.lastMessage = message; const text = String(message); if (!/move|closer|seat|ready|teleport|hand|controller|table|error|failed|unavailable|occupied/i.test(text)) return; toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3200); };
  window.SVR_QUEST_ONBOARDING = { build: BUILD, state, next: () => { state.step = Math.min(state.step + 1, steps.length - 1); render(); }, finish, notify };
  window.addEventListener('svr:platform-ready', () => notify('Table ready. Enter VR, then move toward the poker table.'));
  window.addEventListener('svr:platform-deferred-ready', () => notify('Social features are ready.'));
  window.addEventListener('svr:phase358-acceptance', event => { if (event.detail?.error) notify('Table test failed. Reload and try again.'); });
  window.addEventListener('error', event => { if (!/ResizeObserver loop/i.test(String(event.message || ''))) notify('The game hit an error. Reload Game to recover.'); });
  window.addEventListener('unhandledrejection', () => notify('The game could not finish loading. Reload Game to recover.'));
  ['svr:poker-state','svr:poker-player-action'].forEach(type => window.addEventListener(type, event => { const detail = event.detail || {}; if (detail.waitingHuman || detail.waitingForHuman) notify('Your turn — choose an action at the table.'); }));
}
