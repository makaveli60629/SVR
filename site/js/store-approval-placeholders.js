// Phase 98S-P — Store approval placeholders runtime patch
// Approval-safe store additions without rewriting the full store page.

(function(){
  const PHASE = '98S-P';

  function makeCard({ eyebrow, title, body, price, status, cls = '' }) {
    const article = document.createElement('article');
    article.className = `svr-product-card ${cls}`.trim();
    article.innerHTML = `<span class="svr-eyebrow"></span><h3></h3><p></p><strong class="svr-price"></strong><span class="svr-sandbox"></span>`;
    article.querySelector('.svr-eyebrow').textContent = eyebrow;
    article.querySelector('h3').textContent = title;
    article.querySelector('p').textContent = body;
    article.querySelector('.svr-price').textContent = price;
    article.querySelector('.svr-sandbox').textContent = status;
    return article;
  }

  function hasCard(container, title) {
    if (!container) return false;
    return Array.from(container.querySelectorAll('h3')).some(h => h.textContent.trim().toLowerCase() === title.toLowerCase());
  }

  function addSampleItems() {
    const sample = document.getElementById('sampleStoreGrid');
    if (sample && !hasCard(sample, 'SVR Premium Hoodie')) {
      sample.appendChild(makeCard({
        eyebrow: 'Apparel',
        title: 'SVR Premium Hoodie',
        body: 'Black and neon hoodie concept for future merch drops and avatar matching.',
        price: 'Sandbox',
        status: 'Preview only'
      }));
    }
    if (sample && !hasCard(sample, 'Reiki Wellness Book')) {
      sample.appendChild(makeCard({
        eyebrow: 'Reiki Book',
        title: 'Reiki Wellness Book',
        body: 'Book placeholder by the Reiki partner. Final title, cover, author display, price, and description are waiting for approval.',
        price: 'Pending',
        status: 'Awaiting approval',
        cls: 'approval-safe'
      }));
    }
  }

  function addReikiBookLaneCard() {
    const reikiLane = document.querySelector('#reiki-store .svr-final-grid');
    if (!reikiLane || hasCard(reikiLane, 'Reiki Wellness Book')) return;
    reikiLane.insertBefore(makeCard({
      eyebrow: 'Reiki Book',
      title: 'Reiki Wellness Book',
      body: 'Approval-safe placeholder card. Final book title, author display, cover, price, and purchase status are waiting for approval.',
      price: 'Pending',
      status: 'Awaiting approval',
      cls: 'approval-safe'
    }), reikiLane.firstChild);
  }

  function fixFooterEncoding() {
    const note = document.querySelector('.footer-note');
    if (!note) return;
    note.textContent = '© 2026 SVR Poker. Scarlett Holding LLC • Team Nova • R.Chadee';
  }

  function addPhaseBadge() {
    const heroStatus = document.querySelector('.svr-store-status');
    if (!heroStatus || heroStatus.querySelector('[data-phase="98S-P"]')) return;
    const badge = document.createElement('span');
    badge.dataset.phase = PHASE;
    badge.textContent = 'Store placeholders locked';
    heroStatus.appendChild(badge);
  }

  function run() {
    addSampleItems();
    addReikiBookLaneCard();
    fixFooterEncoding();
    addPhaseBadge();
    window.SVR_STORE_APPROVAL_PLACEHOLDERS = {
      phase: PHASE,
      installed: true,
      reikiBook: 'Awaiting approval',
      footerEncodingFixed: true
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
