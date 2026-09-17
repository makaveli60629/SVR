(() => {
  const BUILD = 'SVR-AVATAR-STORE-BRIDGE-V1';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"]/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;'
  }[ch]));

  function wireAvatarStoreEntryPoints() {
    const quickNav = document.querySelector('.svr-store-quick-nav');
    if (quickNav && !quickNav.querySelector('[data-avatar-store-link]')) {
      const link = document.createElement('a');
      link.href = 'avatar-store.html';
      link.dataset.avatarStoreLink = 'true';
      link.textContent = 'Avatar Store';
      quickNav.prepend(link);
    }

    const heroActions = document.querySelector('.store-hero .actions');
    if (heroActions && !heroActions.querySelector('[data-avatar-store-action]')) {
      const link = document.createElement('a');
      link.href = 'avatar-store.html';
      link.className = 'btn secondary';
      link.dataset.avatarStoreAction = 'true';
      link.textContent = 'Build Your Avatar';
      heroActions.appendChild(link);
    }

    const bannerGrid = document.querySelector('.svr-store-banner-grid');
    if (bannerGrid && !bannerGrid.querySelector('[data-avatar-store-banner]')) {
      const tile = document.createElement('a');
      tile.className = 'svr-store-banner-tile';
      tile.href = 'avatar-store.html';
      tile.dataset.avatarStoreBanner = 'true';
      tile.innerHTML = '<strong>Avatar Store</strong><span>Build your player, preview clothing, hair, nails, shoes, jewelry and wearable drops.</span>';
      bannerGrid.prepend(tile);
    }

    document.body.dataset.avatarStoreBridge = BUILD;
  }

  function flattenCatalog(data){
    const order = ['svr', 'pga', 'reiki', 'smoker', 'support'];
    const items = [];
    order.forEach((group) => {
      const list = Array.isArray(data?.[group]) ? data[group] : [];
      list.forEach((item) => items.push({ group, ...item }));
    });
    return items;
  }

  function render(items){
    const grid = document.getElementById('sampleStoreGrid');
    if (!grid || !items.length) return;
    grid.innerHTML = items.map((item) => `
      <article class="svr-product-card" data-store-group="${escapeHtml(item.group)}">
        <span class="svr-eyebrow">${escapeHtml(item.category || item.group)}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description || 'SVR store sample item for review.')}</p>
        <strong class="svr-price">${escapeHtml(item.price || 'Sandbox')}</strong>
        <span class="svr-sandbox">${escapeHtml(item.status || 'Preview only')}</span>
      </article>
    `).join('');
  }

  wireAvatarStoreEntryPoints();

  const grid = document.getElementById('sampleStoreGrid');
  if (!grid) return;

  fetch('data/store-samples.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then((data) => render(flattenCatalog(data)))
    .catch(() => {
      grid.dataset.catalogFallback = 'true';
    });
})();
