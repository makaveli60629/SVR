(() => {
  const BUILD = 'PHASE-356-GPT-SUPPORT-PLATFORM-CONTEXT-READABILITY-LOCK';
  const API_BASE = String(window.SVR_SERVER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com').replace(/\/$/, '');
  const HISTORY_KEY = 'svr_phase356_ai_history';
  const SESSION_KEY = 'svr_support_chat_session';
  const MAX_HISTORY = 12;
  if (window.SVR_SUPPORT_CHAT_BOT_PHASE356_LOADED) return;
  window.SVR_SUPPORT_CHAT_BOT_PHASE356_LOADED = true;

  function platform() {
    const forced = String(document.body?.dataset?.platform || window.SVR_PLATFORM || '').toLowerCase();
    if (forced) return forced;
    const ua = navigator.userAgent || '';
    if (/Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
    if (/Android/i.test(ua)) return 'android';
    if (/Windows|Macintosh|Linux/i.test(ua)) return 'desktop';
    return 'web';
  }

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `svr-ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch {
      return `svr-ai-${Date.now().toString(36)}`;
    }
  }

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(value) ? value.slice(-MAX_HISTORY) : [];
    } catch { return []; }
  }

  function saveHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch {}
  }

  function removeLegacyWidgets() {
    for (const selector of ['#svrSupportChatLaunch', '#svrSupportChatPanel', '#svr-inline-support-chat', '#svrSupportChatNative']) {
      const node = document.querySelector(selector);
      if (node && node.id !== 'svrPhase356Ai') node.remove();
    }
  }

  function knowledgeAnswer(message) {
    const q = String(message || '').toLowerCase();
    const p = platform();
    if (/freeze|frozen|stuck|black screen|goes black|crash|lag/.test(q)) {
      return `Android recovery\n\nThe current stable Android route uses a low-power recovery system. If play freezes, open the recovery panel, choose Continue Low Power, and resume the hand. If the screen does not recover, choose Reload Table. The poker state is saved locally for a short recovery window.\n\nWhen reporting it, include the betting street, last button pressed, and whether sound or animations continued.`;
    }
    if (/android|apk|phone|mobile/.test(q)) {
      return `Android and APK\n\nThe installed APK is a wrapper for the stable SVR web game. APK version 0.1.0-rc1 remains manual-update only; normal game refinements load from the stable web route without forcing a reinstall. Use one MOVE/LOOK controller set, sit at the table, press DEAL, and use only the highlighted legal actions.`;
    }
    if (/avatar|profile|dressing|pedestal|legend/.test(q)) {
      return `Profile avatar\n\nThe profile showroom uses a rotating SVR Legend avatar on a live pedestal as the temporary professional default. The dressing room and saved profile fields remain the shared source for Android, Quest, desktop, and the future Unity client.`;
    }
    if (/sponsor|advertis|billboard|business|partner|hub/.test(q)) {
      return `Sponsorship and private hubs\n\nSVR can present approved brands through lobby signage, public website placements, private portal rooms, event promotion, storefronts, and focused sponsor hubs. Send the business name, contact information, desired placement or room, approved media, target date, and the action visitors should take.`;
    }
    if (/store|membership|buy|merch|item/.test(q)) {
      return `Store and membership\n\nThe current store is a preview path for future membership, merchandise, avatar items, and game-related offerings. No purchase should be treated as complete unless the checkout page clearly confirms a production transaction.`;
    }
    if (/poker|cards|deal|fold|call|raise|check|all in|turn/.test(q)) {
      return `Poker gameplay\n\nSit first, then press DEAL. Your two cards face you and five community cards appear through flop, turn, and river. YOUR TURN means the highlighted actions are valid; dim actions are unavailable. A completed hand records the winner, settles the pot, and enables NEXT HAND.`;
    }
    if (/quest|oculus|vr|webxr/.test(q)) {
      return `Quest / VR\n\nQuest remains supported through the WebXR route with hands-first interaction and controller fallback. Android is the current primary testing platform, while Quest and desktop retain the shared poker rules, player profile, and future Unity blueprint contracts.`;
    }
    if (/unity|blueprint|platform/.test(q)) {
      return `Platform blueprint\n\nSVR keeps platform detection, poker authority, profile/avatar fields, controls, and deployment records separated from visual clients. That lets the established web systems be cloned into the future Unity Android, Quest, and desktop clients without rewriting the game rules.`;
    }
    if (/contact|admin|human|support|email/.test(q)) {
      return `Contact SVR\n\nFor unresolved account, sponsorship, or technical issues, email admin@svrpoker.com. Include your device, page or game route, what you selected, and the result.`;
    }
    if (/status|ready|phase|progress|what works/.test(q)) {
      return `Current build status\n\nSVR is actively refining Android full-hand stability, the website profile showroom, platform-aware support, and professional public presentation. The game is play-money testing software; real-device Android acceptance remains the final confirmation for the latest runtime fix.`;
    }
    return `I can answer questions about SVR Poker gameplay, Android and the APK, Quest/VR, profiles and avatars, sponsorship, private hubs, the store, platform blueprints, and support.\n\nYou are currently on the ${p} experience at ${location.pathname}.`;
  }

  function context() {
    const value = {
      platform: platform(),
      path: location.pathname,
      pageTitle: document.title,
      gameBuild: document.body?.dataset?.build || window.SVR_PHASE340_PLATFORM_STATE?.build || null,
      gameReady: Boolean(window.SVR_GAME_READY || window.__SVR_GAME_READY__),
      sessionId: sessionId(),
      language: document.documentElement.lang || navigator.language || 'en'
    };
    window.SVR_PLATFORM_CONTEXT = { build: BUILD, ...value, checkedAt: new Date().toISOString() };
    return value;
  }

  async function askServer(message, history) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 26000);
    try {
      const response = await fetch(`${API_BASE}/api/ai/support`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-SVR-Client': 'svr-web-ai-phase356'
        },
        body: JSON.stringify({ message, history: history.slice(-MAX_HISTORY), context: context() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || `AI_${response.status}`);
      return { reply: String(data.reply).trim(), source: 'gpt', model: data.model || null };
    } finally {
      clearTimeout(timer);
    }
  }

  function injectStyles() {
    if (document.getElementById('svr-phase356-ai-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-phase356-ai-style';
    style.textContent = `
      #svrPhase356Ai{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483647;font-family:Rajdhani,system-ui,Arial;color:#fff}
      #svrPhase356Ai *{box-sizing:border-box}
      .svr356-ai-launch{border:1px solid rgba(127,252,255,.78);border-radius:999px;background:linear-gradient(135deg,#7ffcff,#9b4dff);color:#03040b;padding:12px 16px;font:900 12px Orbitron,system-ui;letter-spacing:.07em;text-transform:uppercase;box-shadow:0 18px 60px rgba(0,0,0,.72),0 0 24px rgba(127,252,255,.3);cursor:pointer}
      .svr356-ai-shell{display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.82);padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));backdrop-filter:blur(11px)}
      #svrPhase356Ai.open .svr356-ai-shell{display:grid;place-items:center}
      .svr356-ai-panel{width:min(920px,100%);height:min(820px,100%);min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border:1px solid rgba(127,252,255,.5);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(8,13,28,.99),rgba(2,4,12,.99));box-shadow:0 35px 120px rgba(0,0,0,.88)}
      .svr356-ai-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(127,252,255,.055)}
      .svr356-ai-head strong{display:block;font:900 clamp(14px,2vw,19px) Orbitron,system-ui;letter-spacing:.08em;color:#dffcff}.svr356-ai-head span{display:block;margin-top:3px;color:#8dffb4;font-weight:800;font-size:12px}
      .svr356-ai-head-actions{display:flex;gap:7px}.svr356-ai-head button{border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.07);color:#fff;min-width:38px;min-height:38px;padding:8px 11px;font-weight:900;cursor:pointer}
      .svr356-ai-messages{min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:16px;scrollbar-gutter:stable;display:flex;flex-direction:column;gap:12px}
      .svr356-ai-message{max-width:min(760px,94%);padding:12px 14px;border-radius:17px;line-height:1.42;font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
      .svr356-ai-message.assistant{align-self:flex-start;border:1px solid rgba(127,252,255,.25);background:rgba(127,252,255,.095);color:#ecfdff}.svr356-ai-message.user{align-self:flex-end;border:1px solid rgba(255,217,138,.3);background:rgba(255,217,138,.13);color:#fff9e7}.svr356-ai-message.pending{opacity:.72}
      .svr356-ai-source{display:block;margin-top:8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8dffb4}
      .svr356-ai-compose{display:grid;gap:9px;padding:13px 14px;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.28)}
      .svr356-ai-quick{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px}.svr356-ai-quick button{flex:0 0 auto;border:1px solid rgba(127,252,255,.23);border-radius:999px;background:rgba(255,255,255,.06);color:#fff;padding:8px 11px;font-weight:800;cursor:pointer}
      .svr356-ai-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px}.svr356-ai-row textarea{width:100%;min-height:82px;max-height:180px;resize:vertical;border:2px solid rgba(127,252,255,.52);border-radius:16px;background:rgba(0,0,0,.42);color:#fff;padding:12px 13px;font:800 16px Rajdhani,system-ui;outline:none}.svr356-ai-row textarea:focus{border-color:#8dffb4;box-shadow:0 0 24px rgba(141,255,180,.16)}
      .svr356-ai-send{align-self:stretch;min-width:112px;border:0;border-radius:16px;background:linear-gradient(135deg,#8dffb4,#7ffcff);color:#04100b;font:900 12px Orbitron,system-ui;letter-spacing:.06em;text-transform:uppercase;padding:12px;cursor:pointer}.svr356-ai-send:disabled{opacity:.5;cursor:wait}
      .svr356-ai-status{min-height:16px;text-align:center;color:#ffd98a;font-size:12px}
      body.svr-phase356-ai-open{overflow:hidden!important}
      @media(max-width:650px){.svr356-ai-shell{padding:0}.svr356-ai-panel{width:100%;height:100%;border-radius:0;border-left:0;border-right:0}.svr356-ai-head{padding-top:max(12px,env(safe-area-inset-top))}.svr356-ai-compose{padding-bottom:max(12px,env(safe-area-inset-bottom))}.svr356-ai-row{grid-template-columns:1fr}.svr356-ai-row textarea{min-height:96px}.svr356-ai-send{min-height:48px}.svr356-ai-message{max-width:97%;font-size:16px}}
    `;
    document.head.appendChild(style);
  }

  function mount() {
    if (document.getElementById('svrPhase356Ai')) return;
    removeLegacyWidgets();
    injectStyles();
    const root = document.createElement('div');
    root.id = 'svrPhase356Ai';
    root.innerHTML = `
      <button class="svr356-ai-launch" type="button" aria-label="Open SVR GPT support">● Ask SVR AI</button>
      <section class="svr356-ai-shell" role="dialog" aria-modal="true" aria-label="SVR AI support">
        <div class="svr356-ai-panel">
          <header class="svr356-ai-head"><div><strong>SVR GPT SUPPORT</strong><span id="svr356AiMode">PLATFORM-AWARE SUPPORT • ${platform().toUpperCase()}</span></div><div class="svr356-ai-head-actions"><button data-ai-clear type="button" aria-label="Clear chat">Clear</button><button data-ai-close type="button" aria-label="Close chat">×</button></div></header>
          <div class="svr356-ai-messages" id="svr356AiMessages" aria-live="polite"></div>
          <form class="svr356-ai-compose" id="svr356AiForm"><div class="svr356-ai-quick"><button type="button" data-prompt="Why does Android freeze and how do I recover?">Android freeze</button><button type="button" data-prompt="How do I play a complete poker hand?">Play a hand</button><button type="button" data-prompt="Tell me about the profile legend avatar and dressing room.">Avatar</button><button type="button" data-prompt="How can a business sponsor an SVR hub?">Sponsor</button><button type="button" data-prompt="How will the Unity version use these platform blueprints?">Unity plan</button></div><div class="svr356-ai-row"><textarea name="message" maxlength="2000" placeholder="Ask any SVR Poker question…" aria-label="Ask SVR AI support"></textarea><button class="svr356-ai-send" type="submit">Ask GPT</button></div><div class="svr356-ai-status" id="svr356AiStatus"></div></form>
        </div>
      </section>`;
    document.body.appendChild(root);

    const messages = root.querySelector('#svr356AiMessages');
    const status = root.querySelector('#svr356AiStatus');
    const form = root.querySelector('#svr356AiForm');
    const textarea = form.querySelector('textarea');
    const send = form.querySelector('button[type="submit"]');
    let history = readHistory();

    function add(role, text, source = '') {
      const item = document.createElement('div');
      item.className = `svr356-ai-message ${role === 'user' ? 'user' : 'assistant'}`;
      item.textContent = text;
      if (source) {
        const tag = document.createElement('span');
        tag.className = 'svr356-ai-source';
        tag.textContent = source;
        item.appendChild(tag);
      }
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
      return item;
    }

    function renderHistory() {
      messages.textContent = '';
      if (!history.length) add('assistant', `Welcome. I am SVR's platform-aware support assistant. You are using the ${platform()} experience. Ask about gameplay, Android, the APK, Quest, avatars, sponsorship, the store, or the Unity roadmap.`, 'SVR support');
      history.forEach((entry) => add(entry.role, entry.content, entry.source || 'saved'));
    }

    async function submit(message) {
      const clean = String(message || '').trim();
      if (!clean || send.disabled) return;
      history.push({ role: 'user', content: clean, source: 'you' });
      history = history.slice(-MAX_HISTORY);
      add('user', clean, 'you');
      const pending = add('assistant', 'Thinking through your SVR question…', 'connecting');
      pending.classList.add('pending');
      send.disabled = true;
      status.textContent = 'Connecting to SVR GPT support…';
      try {
        const result = await askServer(clean, history.slice(0, -1));
        pending.firstChild.nodeValue = result.reply;
        pending.querySelector('.svr356-ai-source').textContent = result.model ? `GPT • ${result.model}` : 'GPT';
        pending.classList.remove('pending');
        history.push({ role: 'assistant', content: result.reply, source: 'gpt' });
        status.textContent = 'GPT response received.';
      } catch (error) {
        const reply = knowledgeAnswer(clean);
        pending.firstChild.nodeValue = reply;
        pending.querySelector('.svr356-ai-source').textContent = 'SVR offline knowledge';
        pending.classList.remove('pending');
        history.push({ role: 'assistant', content: reply, source: 'offline' });
        status.textContent = /AI_NOT_CONFIGURED|AI_503/.test(String(error?.message || error)) ? 'GPT backend is awaiting secure configuration. Offline SVR knowledge answered.' : 'Live GPT was unavailable. Offline SVR knowledge answered.';
      } finally {
        history = history.slice(-MAX_HISTORY);
        saveHistory(history);
        send.disabled = false;
        messages.scrollTop = messages.scrollHeight;
      }
    }

    function open() {
      root.classList.add('open');
      document.body.classList.add('svr-phase356-ai-open');
      setTimeout(() => textarea.focus(), 80);
    }
    function close() {
      root.classList.remove('open');
      document.body.classList.remove('svr-phase356-ai-open');
    }

    root.querySelector('.svr356-ai-launch').addEventListener('click', open);
    root.querySelector('[data-ai-close]').addEventListener('click', close);
    root.querySelector('.svr356-ai-shell').addEventListener('click', (event) => { if (event.target.classList.contains('svr356-ai-shell')) close(); });
    root.querySelector('[data-ai-clear]').addEventListener('click', () => { history = []; saveHistory(history); renderHistory(); status.textContent = 'Conversation cleared.'; });
    root.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => submit(button.dataset.prompt)));
    form.addEventListener('submit', (event) => { event.preventDefault(); const message = textarea.value; textarea.value = ''; submit(message); });
    textarea.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && root.classList.contains('open')) close(); });
    renderHistory();

    const observer = new MutationObserver(removeLegacyWidgets);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(removeLegacyWidgets, 0);
    setTimeout(removeLegacyWidgets, 500);
    setTimeout(removeLegacyWidgets, 1800);

    window.SVR_SUPPORT_CHAT_BOT = {
      build: BUILD,
      active: true,
      gptEndpoint: `${API_BASE}/api/ai/support`,
      platform: platform(),
      fullHeightReadable: true,
      offlineKnowledgeFallback: true,
      checkedAt: new Date().toISOString()
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
