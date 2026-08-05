(() => {
  const BUILD = 'PHASE-381-PUBLIC-SERVER-DATABASE-ADMIN-AI-STATUS-LOCK';
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages';
  const CURRENT_PHASE = 'phase381';
  const statusState = {
    build: BUILD,
    server: 'checking',
    database: 'checking',
    admin: 'offline',
    ai: 'online',
    apiBase: '',
    checkedAt: null
  };

  function getAdminState() {
    const qs = new URLSearchParams(window.location.search);
    const override = qs.get('admin');
    if (override === 'online' || override === 'offline') {
      try { localStorage.setItem(ADMIN_KEY, override); } catch {}
      return override;
    }
    try { return localStorage.getItem(ADMIN_KEY) || 'offline'; } catch { return 'offline'; }
  }

  function classFor(value) {
    if (value === 'online') return 'online';
    if (value === 'offline') return 'offline';
    return 'standby';
  }

  function paintOne(key, value, text) {
    document.querySelectorAll(`[data-svr-status="${key}"]`).forEach((element) => {
      element.dataset.state = value;
      element.classList.remove('online', 'offline', 'standby');
      element.classList.add(classFor(value));
      element.textContent = text;
    });
  }

  function paintAdminAndAi() {
    const admin = getAdminState();
    const ai = admin === 'online' ? 'standby' : 'online';
    statusState.admin = admin;
    statusState.ai = ai;
    paintOne('admin', admin, admin === 'online' ? 'Admin Online' : 'Admin Offline');
    paintOne('ai', ai, admin === 'online' ? 'AI Support Standby' : 'AI Support Online');
    document.querySelectorAll('.admin-status').forEach((element) => {
      element.dataset.state = admin;
      element.classList.toggle('online', admin === 'online');
      element.classList.toggle('offline', admin !== 'online');
      if (!element.hasAttribute('data-svr-status')) {
        element.textContent = admin === 'online' ? '● Admin Online' : '● AI Support Online';
      }
    });
    document.querySelectorAll('[data-svr-ask-ai]').forEach((button) => {
      button.hidden = false;
      button.disabled = false;
      button.textContent = admin === 'online' ? 'Ask AI Support' : 'Ask AI Support • Online';
    });
  }

  async function checkServer() {
    paintOne('server', 'checking', 'Server Checking');
    try {
      const response = await fetch(`/deploy-health.json?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      const online = response.ok && data?.status === 'ok';
      statusState.server = online ? 'online' : 'offline';
      paintOne('server', statusState.server, online ? 'Server Online' : 'Server Offline');
      return online;
    } catch {
      statusState.server = 'offline';
      paintOne('server', 'offline', 'Server Offline');
      return false;
    }
  }

  async function checkDatabase() {
    paintOne('database', 'checking', 'Database Checking');
    let config = null;
    try {
      const response = await fetch(`/site/config/player-api.json?t=${Date.now()}`, { cache: 'no-store' });
      config = response.ok ? await response.json() : null;
    } catch {}
    const apiBase = String(config?.apiBase || '').replace(/\/$/, '');
    statusState.apiBase = apiBase;
    if (!apiBase) {
      statusState.database = 'standby';
      paintOne('database', 'standby', 'Database Standby');
      return false;
    }
    const healthPaths = ['/health', '/api/health', '/api/status'];
    for (const path of healthPaths) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      try {
        const response = await fetch(`${apiBase}${path}`, { cache: 'no-store', credentials: 'include', signal: controller.signal });
        if (response.ok) {
          statusState.database = 'online';
          paintOne('database', 'online', 'Database Online');
          clearTimeout(timer);
          return true;
        }
      } catch {}
      clearTimeout(timer);
    }
    statusState.database = 'offline';
    paintOne('database', 'offline', 'Database Offline');
    return false;
  }

  function normalizeGameLinks() {
    document.querySelectorAll('a[href]').forEach((anchor) => {
      let url;
      try { url = new URL(anchor.getAttribute('href'), window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (/\/game\/(?:android|android-play|android-lobby)\.html$/i.test(url.pathname)) {
        url.pathname = '/game/android-lobby.html';
        url.searchParams.delete('channel');
        url.searchParams.set('v', CURRENT_PHASE);
        anchor.href = url.pathname + '?' + url.searchParams.toString();
        return;
      }
      if (/\/game\/android-stable\.html$/i.test(url.pathname)) {
        url.searchParams.set('v', CURRENT_PHASE);
        anchor.href = url.pathname + '?' + url.searchParams.toString();
        return;
      }
      if (/\/game\/index\.html$/i.test(url.pathname)) {
        url.searchParams.set('v', CURRENT_PHASE);
        anchor.href = url.pathname + '?' + url.searchParams.toString();
      }
    });
  }

  function openAiSupport() {
    const launch = document.querySelector('#svrPhase356Ai .svr356-ai-launch');
    if (launch) {
      launch.click();
      return true;
    }
    window.dispatchEvent(new CustomEvent('svr:open-ai-support'));
    setTimeout(() => document.querySelector('#svrPhase356Ai .svr356-ai-launch')?.click(), 120);
    return false;
  }

  function wireAiButtons() {
    document.querySelectorAll('[data-svr-ask-ai]').forEach((button) => {
      if (button.dataset.svrAiWired === '1') return;
      button.dataset.svrAiWired = '1';
      button.addEventListener('click', openAiSupport);
    });
  }

  function wireMessageForm() {
    const form = document.getElementById('visitor-message-form');
    if (!form || form.dataset.svrWired === '1') return;
    form.dataset.svrWired = '1';
    const status = document.getElementById('visitor-message-status');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const entry = {
        name: String(data.name || '').trim(),
        email: String(data.email || '').trim(),
        message: String(data.message || '').trim(),
        createdAt: new Date().toISOString(),
        source: location.pathname
      };
      if (!entry.message) {
        if (status) status.textContent = 'Please enter a message before saving.';
        return;
      }
      try {
        const current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
        current.push(entry);
        localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100)));
      } catch {}
      form.reset();
      if (status) status.textContent = 'Message saved. AI support remains available while the admin is offline.';
    });
  }

  async function refresh() {
    paintAdminAndAi();
    normalizeGameLinks();
    wireAiButtons();
    wireMessageForm();
    await Promise.allSettled([checkServer(), checkDatabase()]);
    statusState.checkedAt = new Date().toISOString();
    window.SVR_PHASE381_PUBLIC_STATUS = { ...statusState };
  }

  window.SVR_PHASE381_PUBLIC_STATUS_REFRESH = refresh;
  window.SVR_PHASE381_OPEN_AI_SUPPORT = openAiSupport;
  refresh();
  setInterval(() => {
    paintAdminAndAi();
    wireAiButtons();
  }, 5000);
  setInterval(() => {
    checkServer();
    checkDatabase();
  }, 60000);
})();
