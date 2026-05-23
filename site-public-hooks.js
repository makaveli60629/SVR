(() => {
  const API_BASE = window.SVR_API_BASE || 'https://api.svrpoker.com';
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages_backup';
  const SESSION_KEY = 'svr_site_session_id';
  const STATUS_REFRESH_MS = 30000;
  const FORCE_ADMIN_ONLINE = true;

  let lastAdminState = 'online';

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function track(eventType, metadata = {}) {
    const body = JSON.stringify({
      eventType,
      pagePath: location.pathname || '/',
      pageTitle: document.title || 'SVR Poker',
      referrer: document.referrer || '',
      sessionId: sessionId(),
      source: 'site',
      metadata: { href: location.href, ...metadata }
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(`${API_BASE}/api/analytics/event`, blob)) return;
      }
    } catch (e) {}
    fetch(`${API_BASE}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
      keepalive: body.length < 60000
    }).catch(() => {});
  }

  function setAdminVisualState(isOnline, sourceText) {
    const forcedOnline = FORCE_ADMIN_ONLINE ? true : isOnline;
    const state = forcedOnline ? 'online' : 'offline';
    lastAdminState = state;
    try { localStorage.setItem(ADMIN_KEY, state); } catch (e) {}
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      el.dataset.state = state;
      el.dataset.source = sourceText || 'site-lock';
      el.classList.toggle('online', forcedOnline);
      el.classList.toggle('offline', !forcedOnline);
      const text = forcedOnline ? 'ADMIN ONLINE' : 'ADMIN OFFLINE';
      const label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = text;
      else el.textContent = text;
    });
  }

  function setAdminLoadingState() {
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      const label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = 'ADMIN ONLINE';
      else el.textContent = 'ADMIN ONLINE';
      el.classList.add('online');
      el.classList.remove('offline');
      el.dataset.state = 'online';
    });
  }

  async function fetchAdminStatus() {
    const response = await fetch(`${API_BASE}/api/admin/status`, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Admin status request failed: ${response.status}`);
    return response.json();
  }

  async function paintAdminState() {
    if (FORCE_ADMIN_ONLINE) {
      setAdminVisualState(true, 'site-lock');
      return;
    }
    try {
      const data = await fetchAdminStatus();
      if (!data || data.ok === false) throw new Error(data && data.error ? data.error : 'Invalid admin status payload');
      setAdminVisualState(Boolean(data.isOnline), 'api');
    } catch (error) {
      const fallback = (() => { try { return localStorage.getItem(ADMIN_KEY); } catch (e) { return null; } })();
      setAdminVisualState(fallback !== 'offline', 'fallback');
    }
  }

  async function postPublicMessage(entry) {
    const response = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(entry)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Message request failed: ${response.status}`);
    return data;
  }

  function saveLocalMessageBackup(entry) {
    let current = [];
    try { current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]'); } catch (e) { current = []; }
    current.push(entry);
    try { localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100))); } catch (e) {}
  }

  function wireMessageForm() {
    const form = document.getElementById('visitor-message-form');
    if (!form || form.dataset.svrWired === '1') return;
    form.dataset.svrWired = '1';
    const status = document.getElementById('visitor-message-status');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const entry = {
        name: (data.name || '').trim(),
        email: (data.email || '').trim(),
        subject: (data.subject || 'SVR public site message').trim(),
        message: (data.message || '').trim(),
        source: location.pathname || 'svrpoker-site'
      };
      if (!entry.message) { if (status) status.textContent = 'Please enter a message before sending.'; return; }
      if (status) status.textContent = 'Sending message to SVR...';
      track('message_submit_attempt', { source: entry.source });
      try {
        await postPublicMessage(entry);
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: true });
        form.reset();
        if (status) status.textContent = 'Message sent to SVR. Thank you.';
        track('message_submit_success', { source: entry.source });
      } catch (error) {
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: false, error: error.message });
        if (status) status.textContent = 'Message saved locally. Live API could not be reached yet.';
        track('message_submit_fallback', { source: entry.source });
      }
    });
  }

  function wireClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a,button');
      if (!link) return;
      const label = (link.textContent || link.getAttribute('aria-label') || link.href || 'click').trim().slice(0, 120);
      const href = link.href || '';
      if (/store/i.test(label) || /store/i.test(href)) track('store_click', { label, href });
      else if (/sponsor|partner/i.test(label + ' ' + href)) track('sponsor_interest_click', { label, href });
      else if (/donate|cash|support/i.test(label + ' ' + href)) track('support_click', { label, href });
      else if (/game|preview|play/i.test(label + ' ' + href)) track('game_interest_click', { label, href });
    }, { passive: true });
  }

  function boot() {
    setAdminLoadingState();
    paintAdminState();
    wireMessageForm();
    wireClicks();
    track('page_view');
    setTimeout(paintAdminState, 1500);
    setInterval(paintAdminState, STATUS_REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();