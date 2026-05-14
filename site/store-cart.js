/* SVR Store sandbox cart. Front-end preview only. No live payments. */
(function(){
  const key = 'svr_store_sandbox_cart';
  const money = cents => '$' + (Number(cents || 0) / 100).toFixed(2);
  function read(){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
  function write(items){ localStorage.setItem(key, JSON.stringify(items.slice(-100))); render(); }
  function add(item){ const items = read(); items.push(item); write(items); }
  function clear(){ write([]); }
  function render(){
    const items = read();
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = String(items.length));
    document.querySelectorAll('[data-cart-total]').forEach(el => el.textContent = money(items.reduce((sum, i) => sum + Number(i.priceCents || 0), 0)));
    document.querySelectorAll('[data-cart-list]').forEach(el => {
      if (!items.length) { el.innerHTML = '<p class="cart-empty">Cart is empty. Add sample items to preview the flow.</p>'; return; }
      el.innerHTML = items.map(i => `<div class="cart-line"><span>${escapeHtml(i.name)}<br><small>${escapeHtml(i.hub || 'SVR')}</small></span><strong>${money(i.priceCents)}</strong></div>`).join('');
    });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-cart]');
    if (btn) {
      e.preventDefault();
      add({ name: btn.dataset.name, hub: btn.dataset.hub, priceCents: Number(btn.dataset.priceCents || 0) });
      const status = document.querySelector('[data-cart-status]');
      if (status) status.textContent = `${btn.dataset.name} added to sandbox cart.`;
    }
    const clearBtn = e.target.closest('[data-clear-cart]');
    if (clearBtn) { e.preventDefault(); clear(); const status = document.querySelector('[data-cart-status]'); if (status) status.textContent = 'Sandbox cart cleared.'; }
    const checkoutBtn = e.target.closest('[data-sandbox-checkout]');
    if (checkoutBtn) {
      e.preventDefault();
      const payload = { mode:'stripe_sandbox_preview_only', checkoutEnabled:false, items: read(), createdAt:new Date().toISOString(), nextEndpoint:'/api/stripe/create-checkout-session' };
      localStorage.setItem('svr_store_last_sandbox_checkout', JSON.stringify(payload, null, 2));
      const status = document.querySelector('[data-cart-status]');
      if (status) status.textContent = 'Sandbox checkout payload saved locally. No sale was created.';
      const preview = document.querySelector('[data-checkout-payload]');
      if (preview) preview.textContent = JSON.stringify(payload, null, 2);
    }
  });
  document.addEventListener('DOMContentLoaded', render);
  render();
})();
