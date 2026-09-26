(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const statusEl = document.querySelector('#reservation-status');
  const noteEl = document.querySelector('#availability-note');
  const countEl = document.querySelector('#available-count');
  const siteGrid = document.querySelector('#site-grid');

  const fallback = {
    projectStage: 'predevelopment',
    acceptingReservations: false,
    availableCount: 0,
    note: 'Reservations are not open. Property acquisition, approvals and construction must be completed first.',
    sites: Array.from({ length: 6 }, (_, index) => ({
      id: 'RV-' + String(index + 1).padStart(2, '0'),
      type: index < 2 ? 'Future pull-through site' : 'Future full-hookup site',
      status: 'planned'
    }))
  };

  function render(data) {
    const open = Boolean(data.acceptingReservations);
    if (statusEl) statusEl.textContent = open ? 'Reservations open' : 'Pre-development — reservations not open';
    if (noteEl) noteEl.textContent = data.note || fallback.note;
    if (countEl) countEl.textContent = Number.isFinite(Number(data.availableCount)) ? data.availableCount : 0;

    if (!siteGrid) return;
    siteGrid.innerHTML = '';
    (data.sites || fallback.sites).forEach((site) => {
      const card = document.createElement('article');
      card.className = 'site-card';
      const isOpen = site.status === 'available' && open;
      card.innerHTML = [
        '<div class="site-card-head">',
        '<h3>' + escapeHtml(site.id || 'RV Site') + '</h3>',
        '<span class="badge ' + (isOpen ? 'open' : '') + '">' + escapeHtml(isOpen ? 'Available' : (site.status || 'planned')) + '</span>',
        '</div>',
        '<p>' + escapeHtml(site.type || 'Future RV site') + '</p>'
      ].join('');
      siteGrid.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  fetch('./availability.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('availability unavailable');
      return response.json();
    })
    .then(render)
    .catch(() => render(fallback));
})();