(() => {
  const layers = [
    'phase102-luxury.css?v=phase102-luxury-polish',
    'phase103-floating-menu-fix.css?v=menu-layer-fix',
    'phase104-alignment-polish.css?v=alignment-polish',
    'store-alignment-fix.css?v=store-align-hero-fix',
    'site-android-readiness.css?v=android-store-banner-lock'
  ];

  layers.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  function wireBodyFloatingMenu(){
    const navLinks = document.querySelector('.market-links');
    const shouldFloat = /Android/i.test(navigator.userAgent || '') || (window.matchMedia && window.matchMedia('(pointer: coarse), (max-width: 860px)').matches);
    if (!navLinks || !shouldFloat || document.getElementById('svr-body-floating-menu')) return;
    document.documentElement.classList.add('svr-touch-nav');
    const style = document.createElement('style');
    style.textContent = `.svr-body-menu-btn{position:fixed!important;top:calc(10px + env(safe-area-inset-top,0px))!important;right:10px!important;z-index:2147483647!important;border:1px solid rgba(105,232,255,.48)!important;border-radius:999px!important;background:linear-gradient(135deg,rgba(105,232,255,.28),rgba(255,91,233,.22))!important;color:#fff!important;font-family:Orbitron,Arial,sans-serif!important;font-weight:900!important;letter-spacing:.06em!important;text-transform:uppercase!important;padding:10px 14px!important;box-shadow:0 20px 58px rgba(0,0,0,.64)!important;backdrop-filter:blur(18px)!important}.svr-body-menu-panel{position:fixed!important;top:calc(58px + env(safe-area-inset-top,0px))!important;right:9px!important;width:min(330px,calc(100vw - 18px))!important;max-height:calc(100dvh - 78px)!important;overflow:auto!important;z-index:2147483646!important;display:none!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:10px!important;border-radius:20px!important;border:1px solid rgba(105,232,255,.36)!important;background:rgba(5,5,14,.985)!important;box-shadow:0 30px 96px rgba(0,0,0,.82)!important;backdrop-filter:blur(20px)!important}.svr-body-menu-panel.is-open{display:grid!important}.svr-body-menu-panel a,.svr-body-menu-panel span{display:flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;padding:8px!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.10)!important;background:rgba(255,255,255,.065)!important;color:#fff!important;text-decoration:none!important;font-weight:800!important;font-size:.84rem!important;text-align:center!important}.svr-body-menu-panel span{font-family:Orbitron,Arial,sans-serif!important;font-size:.64rem!important;color:#a7ff80!important;letter-spacing:.08em!important}.svr-touch-nav .market-links{display:none!important}`;
    document.head.appendChild(style);
    const btn = document.createElement('button');
    btn.id = 'svr-body-floating-menu';
    btn.className = 'svr-body-menu-btn';
    btn.type = 'button';
    btn.textContent = 'Menu';
    btn.setAttribute('aria-expanded','false');
    const panel = document.createElement('div');
    panel.className = 'svr-body-menu-panel';
    Array.from(navLinks.children).forEach((child) => {
      const copy = child.cloneNode(true);
      if (copy.tagName === 'A') copy.addEventListener('click', () => {
        panel.classList.remove('is-open');
        btn.textContent = 'Menu';
        btn.setAttribute('aria-expanded','false');
      });
      panel.appendChild(copy);
    });
    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      btn.textContent = open ? 'Close' : 'Menu';
      btn.setAttribute('aria-expanded', String(open));
    });
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  function initSlideDeck(deck){
    const slides = Array.from(deck.querySelectorAll('.svr-slide'));
    if (!slides.length || deck.dataset.svrSliderReady === '1') return;
    deck.dataset.svrSliderReady = '1';

    const section = deck.closest('.phase94-slider-section, .section') || deck.parentElement;
    const prev = section?.querySelector('[data-slide-prev]');
    const next = section?.querySelector('[data-slide-next]');
    const dotHost = section?.querySelector('[data-slide-dots]');
    const intervalMs = Math.max(2200, Number(deck.dataset.autoplayMs || 4200));
    let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
    if (index < 0) index = 0;
    let timer = 0;

    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      const img = slide.querySelector('img');
      if (img) {
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => {
          slide.classList.add('svr-slide-image-failed');
          if (!slide.querySelector('.svr-slide-fallback-copy')) {
            const fallback = document.createElement('div');
            fallback.className = 'svr-slide-fallback-copy';
            fallback.innerHTML = `<strong>${img.alt || 'SVR Poker'}</strong><span>Banner creative loading fallback</span>`;
            slide.appendChild(fallback);
          }
        }, { once: true });
      }
    });

    function drawDots(){
      if (!dotHost) return;
      dotHost.innerHTML = '';
      slides.forEach((slide, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = i === index ? 'is-active' : '';
        dot.setAttribute('aria-label', `Show banner ${i + 1}: ${slide.querySelector('img')?.alt || slide.dataset.slideId || 'SVR banner'}`);
        dot.addEventListener('click', () => go(i, true));
        dotHost.appendChild(dot);
      });
    }

    function render(){
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (dotHost) Array.from(dotHost.children).forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function go(nextIndex, manual = false){
      index = (nextIndex + slides.length) % slides.length;
      render();
      if (manual) restart();
    }

    function restart(){
      window.clearInterval(timer);
      timer = window.setInterval(() => go(index + 1), intervalMs);
    }

    prev?.addEventListener('click', () => go(index - 1, true));
    next?.addEventListener('click', () => go(index + 1, true));

    let touchX = null;
    deck.addEventListener('pointerdown', (event) => { touchX = event.clientX; }, { passive: true });
    deck.addEventListener('pointerup', (event) => {
      if (touchX == null) return;
      const delta = event.clientX - touchX;
      touchX = null;
      if (Math.abs(delta) > 44) go(index + (delta < 0 ? 1 : -1), true);
    }, { passive: true });

    deck.addEventListener('mouseenter', () => window.clearInterval(timer));
    deck.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.clearInterval(timer);
      else restart();
    });

    drawDots();
    render();
    restart();
  }

  function wireBannerSliders(){
    document.querySelectorAll('[data-svr-slide-deck]').forEach(initSlideDeck);
  }

  const ads = [
    {label:'Sponsor Sample', img:'assets/marketing/espresso-ad.svg', title:'Espresso With Cream', copy:'Sample sponsor creative for website banners and future VR building-wall placements.', href:'sponsor-event.html'},
    {label:'SVR Store', img:'assets/marketing/store-feature.svg', title:'SVR Store', copy:'Digital items, apparel concepts, sponsor products, and collectible drops.', href:'store.html'},
    {label:'Billboard Package', img:'assets/marketing/billboard-wall.svg', title:'VR Billboard', copy:'Lobby wall, private room, storefront, and event-signage placement.', href:'billboards.html'},
    {label:'Android Ready', img:'assets/marketing/mobile-vr.svg', title:'Android + Quest Ready', copy:'Large touch targets, lightweight banners, and VR portal-friendly layout.', href:'membership.html'}
  ];

  function wireAds(){
    document.querySelectorAll('[data-market-ad]').forEach((slot, i) => {
      const ad = ads[i % ads.length];
      slot.innerHTML = `<div class="ad-label"><span>${ad.label}</span><span>Marketing Placement</span></div><a class="ad-card" href="${ad.href}" style="display:block;text-decoration:none;color:inherit"><img loading="lazy" decoding="async" src="${ad.img}" alt="${ad.title}"><h3>${ad.title}</h3><p>${ad.copy}</p></a>`;
    });
  }

  function boot(){
    document.documentElement.classList.toggle('is-android', /Android/i.test(navigator.userAgent || ''));
    wireBodyFloatingMenu();
    wireBannerSliders();
    wireAds();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();