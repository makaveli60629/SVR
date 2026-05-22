(() => {
  const API_BASE = window.SVR_API_BASE || 'https://api.svrpoker.com';
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages_backup';
  const STATUS_REFRESH_MS = 30000;

  let lastAdminState = 'offline';

  function setAdminVisualState(isOnline, sourceText) {
    const state = isOnline ? 'online' : 'offline';
    lastAdminState = state;
    try { localStorage.setItem(ADMIN_KEY, state); } catch (e) {}

    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      el.dataset.state = state;
      el.dataset.source = sourceText || 'aws-api';
      el.classList.toggle('online', isOnline);
      el.classList.toggle('offline', !isOnline);

      const label = el.querySelector('[data-admin-label]');
      const text = isOnline ? 'Admin Online' : 'Admin Offline';
      if (label) label.textContent = text;
      else if (el.classList.contains('admin-status')) el.textContent = isOnline ? '● Admin Online' : '● Admin Offline';
    });
  }

  function setAdminLoadingState() {
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      if (!el.textContent || el.textContent.includes('Offline') || el.textContent.includes('Online')) {
        const label = el.querySelector('[data-admin-label]');
        if (label) label.textContent = 'Checking Admin Status';
        else if (el.classList.contains('admin-status')) el.textContent = '● Checking Admin Status';
      }
    });
  }

  async function fetchAdminStatus() {
    const response = await fetch(`${API_BASE}/api/admin/status`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`Admin status request failed: ${response.status}`);
    return response.json();
  }

  async function paintAdminState() {
    try {
      const data = await fetchAdminStatus();
      if (!data || data.ok === false) throw new Error(data && data.error ? data.error : 'Invalid admin status payload');
      setAdminVisualState(Boolean(data.isOnline), 'aws-api');
    } catch (error) {
      console.warn('SVR admin status API unavailable:', error.message);
      const fallback = (() => {
        try { return localStorage.getItem(ADMIN_KEY); } catch (e) { return null; }
      })();
      setAdminVisualState(fallback === 'online' && lastAdminState === 'online', 'fallback');
    }
  }

  async function postPublicMessage(entry) {
    const response = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(entry)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Message request failed: ${response.status}`);
    }
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

      if (!entry.message) {
        if (status) status.textContent = 'Please enter a message before sending.';
        return;
      }

      if (status) status.textContent = 'Sending message to SVR...';

      try {
        await postPublicMessage(entry);
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: true });
        form.reset();
        if (status) status.textContent = 'Message sent to SVR. Thank you.';
      } catch (error) {
        console.warn('SVR message API unavailable:', error.message);
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: false, error: error.message });
        if (status) status.textContent = 'Message saved locally. Live API could not be reached yet.';
      }
    });
  }

  function boot() {
    setAdminLoadingState();
    paintAdminState();
    wireMessageForm();
    setTimeout(paintAdminState, 1500);
    setInterval(paintAdminState, STATUS_REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
