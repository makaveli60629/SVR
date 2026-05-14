(() => {
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages';

  function getAdminState() {
    const qs = new URLSearchParams(window.location.search);
    const override = qs.get('admin');
    if (override === 'online' || override === 'offline') {
      localStorage.setItem(ADMIN_KEY, override);
      return override;
    }
    localStorage.setItem(ADMIN_KEY, 'online');
    return 'online';
  }

  function paintAdminState() {
    const state = getAdminState();
    const isOnline = state === 'online';
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach((el) => {
      el.dataset.state = state;
      el.classList.toggle('online', isOnline);
      el.classList.toggle('offline', !isOnline);
      const label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = isOnline ? 'Admin Online' : 'Admin Offline';
      else if (el.classList.contains('admin-status')) el.textContent = isOnline ? '● Admin Online' : '● Admin Offline';
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
  setTimeout(paintAdminState, 250);
  setTimeout(paintAdminState, 1000);
})();
