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
    return localStorage.getItem(ADMIN_KEY) || 'online';
  }

  function paintAdminState() {
    const state = getAdminState();
    document.querySelectorAll('.admin-status').forEach((el) => {
      el.dataset.state = state;
      el.classList.toggle('online', state === 'online');
      el.classList.toggle('offline', state !== 'online');
      el.textContent = state === 'online' ? '● Admin Online' : '● Admin Offline';
    });
  }

  function injectSiteDonationButton() {
    const heroStack = document.querySelector('.hero-brand-stack');
    if (!heroStack || document.querySelector('.cashapp-dev-donation')) return;

    const link = document.createElement('a');
    link.className = 'cashapp-dev-donation';
    link.href = 'https://cash.app/$RonaldChadee7';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Donate to support SVR Poker site development and expansion costs through Cash App');
    link.innerHTML = '<span class="cashapp-dev-label">Support site development</span><strong>$RonaldChadee7</strong><small>Donation for site development and expansion costs only</small>';

    heroStack.prepend(link);
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
        source: 'svrpoker-public-site-phase-2'
      };
      if (!entry.message) {
        if (status) status.textContent = 'Please enter a message before saving.';
        return;
      }
      const current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
      current.push(entry);
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100)));
      form.reset();
      if (status) status.textContent = 'Message saved locally. Backend API and Azure SQL can be connected when the secure backend is ready.';
    });
  }

  paintAdminState();
  injectSiteDonationButton();
  wireMessageForm();
})();
