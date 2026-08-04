(() => {
  const grid = document.getElementById('sampleStoreGrid');
  if (!grid) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[ch]));

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
    if (!items.length) return;
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

  fetch('data/store-samples.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then((data) => render(flattenCatalog(data)))
    .catch(() => {
      grid.dataset.catalogFallback = 'true';
    });
})();
