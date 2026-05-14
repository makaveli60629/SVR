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
    return localStorage.getItem(ADMIN_KEY) || 'offline';
  }

  function paintAdminState() {
    const state = getAdminState();
    document.querySelectorAll('.admin-status').forEach((el) => {
      el.dataset.state = state;
      el.classList.toggle('online', state === 'online');
      el.classList.toggle('offline', state !== 'online');
      el.textContent = state === 'online' ? 'â— Admin Online' : 'â— Admin Offline';
    });
  }

  function wireMessageForm() {
    const form = document.getElementById('visitor-message-form');
    if (!form) return;
    const status = document.getElementById('visitor-message-status');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const entry = {
        name: (data.name || '').trim(),
        email: (data.email || '').trim(),
        message: (data.message || '').trim(),
        createdAt: new Date().toISOString(),
        source: 'svrpoker-public-site-restore'
      };
      if (!entry.message) {
        if (status) status.textContent = 'Please enter a message before saving.';
        return;
      }
      const current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
      current.push(entry);
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100)));
      form.reset();
      if (status) status.textContent = 'Message saved locally. Backend API/Azure SQL can be wired next.';
    });
  }

  paintAdminState();
  wireMessageForm();
})();

/* SVR_ADMIN_FORCE_ONLINE_LOCK
   Keeps public/admin status green for preview without touching the public page HTML. */
(function(){
  try { localStorage.setItem('svr_admin_presence', 'online'); } catch(e) {}
  function forceOnline(){
    document.querySelectorAll('.admin-status,[data-admin-pill]').forEach(function(el){
      el.dataset.state = 'online';
      el.classList.add('online');
      el.classList.remove('offline');
      var label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = 'Admin Online';
      else if (el.classList.contains('admin-status')) el.textContent = 'â— Admin Online';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', forceOnline);
  else forceOnline();
  setTimeout(forceOnline, 250);
  setTimeout(forceOnline, 1000);
})();
