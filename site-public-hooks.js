(() => {
  const API_BASE = window.SVR_SERVER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com';
  const ADMIN_KEY = 'svr_admin_presence';
  const MESSAGE_KEY = 'svr_public_messages_backup';
  const SESSION_KEY = 'svr_site_session_id';
  const STATUS_REFRESH_MS = 30000;

  let lastAdminState = 'unknown';

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function track(eventType, metadata = {}) {
    const body = JSON.stringify({
      eventType,
      pagePath: location.pathname || '/',
      pageTitle: document.title || 'SVR Poker',
      referrer: document.referrer || '',
      sessionId: sessionId(),
      source: 'site',
      provider: 'server',
      metadata: { href: location.href, ...metadata }
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(`${API_BASE}/api/analytics/event`, blob)) return;
      }
    } catch (e) {}
    fetch(`${API_BASE}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
      keepalive: body.length < 60000
    }).catch(() => {});
  }

  function getAdminBadgeElements() {
    const all = Array.from(document.querySelectorAll('.admin-status,[data-admin-pill],.status-pill'));
    return all.filter((el) => {
      const text = (el.textContent || '').trim().toUpperCase();
      return el.matches('.admin-status,[data-admin-pill]') || text.includes('ADMIN ONLINE') || text.includes('ADMIN OFFLINE') || text.includes('ADMIN STATUS');
    });
  }

  function setAdminVisualState(isOnline, sourceText) {
    const state = isOnline ? 'online' : 'offline';
    lastAdminState = state;
    try { localStorage.setItem(ADMIN_KEY, state); } catch (e) {}
    getAdminBadgeElements().forEach((el) => {
      el.dataset.state = state;
      el.dataset.source = sourceText || 'server-api-or-fallback';
      el.classList.toggle('online', isOnline);
      el.classList.toggle('offline', !isOnline);
      const text = isOnline ? 'ADMIN ONLINE' : 'ADMIN OFFLINE';
      const label = el.querySelector('[data-admin-label]');
      if (label) label.textContent = text;
      else el.textContent = text;
      el.setAttribute('aria-label', text);
      el.title = text;
    });
    window.SVR_ADMIN_PRESENCE = { state, isOnline, source: sourceText || 'server-api-or-fallback', updatedAt: new Date().toISOString() };
  }

  function setAdminLoadingState() {
    const fallback = (() => { try { return localStorage.getItem(ADMIN_KEY); } catch (e) { return null; } })();
    if (fallback === 'offline') setAdminVisualState(false, 'local-loading');
    else setAdminVisualState(true, 'loading');
  }

  async function fetchAdminStatus() {
    const response = await fetch(`${API_BASE}/api/admin/status`, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Admin status request failed: ${response.status}`);
    return response.json();
  }

  async function paintAdminState() {
    try {
      const data = await fetchAdminStatus();
      if (!data || data.ok === false) throw new Error(data && data.error ? data.error : 'Invalid admin status payload');
      const online = Boolean(data.isOnline ?? data.online ?? data.adminOnline ?? data.status === 'online');
      setAdminVisualState(online, 'server-api');
    } catch (error) {
      const fallback = (() => { try { return localStorage.getItem(ADMIN_KEY); } catch (e) { return null; } })();
      setAdminVisualState(fallback !== 'offline', 'fallback');
    }
  }

  async function postPublicMessage(entry) {
    const response = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ ...entry, provider: 'server' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Message request failed: ${response.status}`);
    return data;
  }

  function saveLocalMessageBackup(entry) {
    let current = [];
    try { current = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]'); } catch (e) { current = []; }
    current.push(entry);
    try { localStorage.setItem(MESSAGE_KEY, JSON.stringify(current.slice(-100))); } catch (e) {}
  }

  function wireMessageForm() {
    const form = document.getElementById('visitor-message-form');
    if (!form || form.dataset.svrWired === '1') return;
    form.dataset.svrWired = '1';
    const status = document.getElementById('visitor-message-status');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const entry = {
        name: (data.name || '').trim(),
        email: (data.email || '').trim(),
        subject: (data.subject || 'SVR public site message').trim(),
        message: (data.message || '').trim(),
        source: location.pathname || 'svrpoker-site'
      };
      if (!entry.message) { if (status) status.textContent = 'Please enter a message before sending.'; return; }
      if (status) status.textContent = 'Sending message to SVR...';
      track('message_submit_attempt', { source: entry.source });
      try {
        await postPublicMessage(entry);
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: true });
        form.reset();
        if (status) status.textContent = 'Message sent to SVR. Thank you.';
        track('message_submit_success', { source: entry.source });
      } catch (error) {
        saveLocalMessageBackup({ ...entry, createdAt: new Date().toISOString(), sent: false, error: error.message });
        if (status) status.textContent = 'Message saved locally. Live server connection could not be reached yet.';
        track('message_submit_fallback', { source: entry.source });
      }
    });
  }

  function wireClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a,button');
      if (!link) return;
      const label = (link.textContent || link.getAttribute('aria-label') || link.href || 'click').trim().slice(0, 120);
      const href = link.href || '';
      if (/store/i.test(label) || /store/i.test(href)) track('store_click', { label, href });
      else if (/sponsor|partner/i.test(label + ' ' + href)) track('sponsor_interest_click', { label, href });
      else if (/donate|cash|support/i.test(label + ' ' + href)) track('support_click', { label, href });
      else if (/game|preview|play/i.test(label + ' ' + href)) track('game_interest_click', { label, href });
    }, { passive: true });
  }

  function wireBannerSlider() {
    const deck = document.querySelector('[data-svr-slide-deck]');
    if (!deck || deck.dataset.svrWired === '1') return;
    deck.dataset.svrWired = '1';
    const slides = Array.from(deck.querySelectorAll('.svr-slide'));
    const dotsWrap = document.querySelector('[data-slide-dots]');
    const counter = document.querySelector('[data-slide-counter]');
    const prev = document.querySelector('[data-slide-prev]');
    const next = document.querySelector('[data-slide-next]');
    const autoplayMs = Math.max(2500, Number(deck.dataset.autoplayMs || 5200));
    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    const dots = slides.map((slide, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Open slide ${i + 1}`);
      button.addEventListener('click', () => show(i, 'dot'));
      if (dotsWrap) dotsWrap.appendChild(button);
      return button;
    });
    function show(nextIndex, source = 'auto') {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      if (counter) counter.textContent = '';
      const active = slides[index];
      track('banner_slide_view', { slideId: active.dataset.slideId || `slide-${index + 1}`, slideType: active.dataset.slideType || 'info', slideIndex: index + 1, source });
      resetTimer();
    }
    function resetTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => show(index + 1, 'auto'), autoplayMs);
    }
    if (prev) prev.addEventListener('click', () => show(index - 1, 'prev'));
    if (next) next.addEventListener('click', () => show(index + 1, 'next'));
    deck.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a');
      if (!link) return;
      const active = slides[index];
      track('banner_slide_click', { slideId: active.dataset.slideId || `slide-${index + 1}`, slideType: active.dataset.slideType || 'info', slideIndex: index + 1, label: link.textContent.trim(), href: link.href });
    });
    show(index, 'boot');
  }

  function refinePublicText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.nodeValue) return;
      node.nodeValue = node.nodeValue
        .replace(/AWS/g, 'server')
        .replace(/Azure/g, 'server')
        .replace(/A director-camera view of the SVR Poker lobby, built for visitors, sponsors, testers, and future VR portal previews\./g, 'Step into SVR Poker: a premium social poker destination built for players, partners, private rooms, storefronts, tournaments, and community impact.')
        .replace(/The site now uses a stronger cinematic poker visual direction: competitive energy, community, rewards, and clean navigation\. Internal infrastructure details stay private so the website remains professional and customer-facing\./g, 'Register your profile, explore the store, preview the rooms, and see how sponsors can become part of a polished VR-ready poker world.');
    });
    const liveCopy = document.querySelector('.live-copy');
    if (liveCopy) {
      const kicker = liveCopy.querySelector('.kicker');
      const title = liveCopy.querySelector('h1');
      if (kicker) kicker.textContent = 'Premium Social Poker';
      if (title) title.textContent = 'SVR Poker';
      const trust = liveCopy.querySelectorAll('.trust-strip span');
      const labels = ['Play-Money Poker', 'Private Rooms', 'Sponsor Ready', 'Store Preview'];
      trust.forEach((span, i) => { if (labels[i]) span.textContent = labels[i]; });
    }
  }

  function wireTouchNavigation() {
    const nav = document.querySelector('.market-nav');
    const links = document.querySelector('.market-links');
    if (!nav || !links || nav.dataset.touchNavWired === '1') return;
    const isAndroid = /Android/i.test(navigator.userAgent || '');
    const isTouchSmall = window.matchMedia && window.matchMedia('(pointer: coarse), (max-width: 760px)').matches;
    if (!isAndroid && !isTouchSmall) return;
    nav.dataset.touchNavWired = '1';
    nav.classList.add('svr-touch-nav');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'svr-nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    links.classList.add('is-collapsed');
    const brand = nav.querySelector('.market-brand');
    if (brand && brand.nextSibling) nav.insertBefore(toggle, brand.nextSibling);
    else nav.prepend(toggle);
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      links.classList.toggle('is-collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close Menu' : 'Menu';
    });
  }

  function boot() {
    document.body.classList.add('svr-polished-site');
    setAdminLoadingState();
    paintAdminState();
    wireMessageForm();
    wireClicks();
    wireBannerSlider();
    refinePublicText();
    wireTouchNavigation();
    track('page_view');
    setTimeout(paintAdminState, 1500);
    setInterval(paintAdminState, STATUS_REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
