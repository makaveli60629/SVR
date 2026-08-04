(() => {
  const KEY = 'svr_local_analytics_backup';
  const SESSION_KEY = 'svr_site_session_id';

  function getSessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (error) {
      return `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (error) {}
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function record(eventType, metadata = {}) {
    const now = new Date().toISOString();
    const day = todayKey();
    const sessionId = getSessionId();
    const store = readStore();
    store.totalEvents = Number(store.totalEvents || 0) + 1;
    store.totalPageViews = Number(store.totalPageViews || 0) + (eventType === 'page_view' ? 1 : 0);
    store.storeClicks = Number(store.storeClicks || 0) + (/store/i.test(eventType) ? 1 : 0);
    store.gameClicks = Number(store.gameClicks || 0) + (/game|preview|play/i.test(eventType) ? 1 : 0);
    store.supportClicks = Number(store.supportClicks || 0) + (/support|donate|cash/i.test(eventType) ? 1 : 0);
    store.sessions = store.sessions || {};
    store.sessions[sessionId] = now;
    store.days = store.days || {};
    store.days[day] = store.days[day] || { pageViews: 0, events: 0, sessions: {} };
    store.days[day].events = Number(store.days[day].events || 0) + 1;
    if (eventType === 'page_view') store.days[day].pageViews = Number(store.days[day].pageViews || 0) + 1;
    store.days[day].sessions = store.days[day].sessions || {};
    store.days[day].sessions[sessionId] = true;
    store.recent = Array.isArray(store.recent) ? store.recent : [];
    store.recent.push({ eventType, at: now, path: location.pathname || '/', title: document.title || '', metadata });
    store.recent = store.recent.slice(-200);
    store.updatedAt = now;
    writeStore(store);
    window.SVR_LOCAL_ANALYTICS = store;
  }

  function wireClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a,button');
      if (!link) return;
      const label = (link.textContent || link.getAttribute('aria-label') || link.href || 'click').trim().slice(0, 120);
      const href = link.href || '';
      if (/store/i.test(label) || /store/i.test(href)) record('store_click', { label, href });
      else if (/sponsor|partner|billboard/i.test(label + ' ' + href)) record('sponsor_interest_click', { label, href });
      else if (/donate|cash|support/i.test(label + ' ' + href)) record('support_click', { label, href });
      else if (/game|preview|play|vr/i.test(label + ' ' + href)) record('game_interest_click', { label, href });
      else record('site_click', { label, href });
    }, { passive: true });
  }

  function boot() {
    record('page_view', { href: location.href, referrer: document.referrer || '' });
    wireClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
