(() => {
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages';
  const DEFAULT_ADMIN_STATE = 'offline';

  function forceOfflineStyle() {
    if (document.getElementById('svr-force-admin-offline-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-force-admin-offline-style';
    style.textContent = `
      .admin-status,
      .admin-status.online,
      .admin-status.offline,
      [data-admin-pill],
      [data-admin-pill].online,
      [data-admin-pill].offline {
        color: #ffb1c7 !important;
        border-color: rgba(255,106,154,.45) !important;
        text-shadow: 0 0 14px rgba(255,106,154,.32) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getAdminState() {
    const qs = new URLSearchParams(window.location.search);
    const override = qs.get('admin');
    if (override === 'online') {
      localStorage.setItem(ADMIN_KEY, DEFAULT_ADMIN_STATE);
      return DEFAULT_ADMIN_STATE;
    }
    if (override === 'offline') {
      localStorage.setItem(ADMIN_KEY, DEFAULT_ADMIN_STATE);
      return DEFAULT_ADMIN_STATE;
    }
    localStorage.setItem(ADMIN_KEY, DEFAULT_ADMIN_STATE);
    return DEFAULT_ADMIN_STATE;
  }

  function paintAdminState() {
    forceOfflineStyle();
    const state = getAdminState();
    const isOnline = false;
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      el.dataset.state = state;
      el.classList.remove('online');
      el.classList.add('offline');
      const label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = 'Admin Offline';
      else if (el.classList.contains('admin-status')) el.textContent = '● Admin Offline';
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
        name: (data.name || '').trim(),
        email: (data.email || '').trim(),
        message: (data.message || '').trim(),
        createdAt: new Date().toISOString(),
        source: location.pathname || 'svrpoker-site'
      };
      if (!entry.message) {
        if (status) status.textContent = 'Please enter a message before saving.';
        return;
      }
      let current = [];
      try { current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]'); } catch (e) { current = []; }
      current.push(entry);
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100)));
      form.reset();
      if (status) status.textContent = 'Message saved locally. Backend API/Azure SQL can be wired next.';
    });
  }

  function boot() {
    paintAdminState();
    wireMessageForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(paintAdminState, 10);
  setTimeout(paintAdminState, 250);
  setTimeout(paintAdminState, 1000);
  setInterval(paintAdminState, 2500);
})();
