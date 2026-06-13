(() => {
  const API = window.SVR_OWNER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com';
  const LOCAL_ANALYTICS_KEY = 'svr_local_analytics_backup';
  const LOCAL_MESSAGES_KEY = 'svr_public_messages_backup';
  const LOCAL_ADMIN_KEY = 'svr_admin_presence';

  const $ = (id) => document.getElementById(id);
  const safe = (s) => String(s || '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const n = (v) => Number(v || 0).toLocaleString();

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (error) { return fallback; }
  }

  function getLocalMessages() {
    const list = readJson(LOCAL_MESSAGES_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function getLocalAnalytics() {
    return readJson(LOCAL_ANALYTICS_KEY, {});
  }

  function getMessageCounts() {
    const list = getLocalMessages();
    const active = list.filter((m) => !m.archived_at && !m.archived).length;
    const unread = list.filter((m) => !m.is_read && !m.read).length;
    const archived = list.length - active;
    return { active, unread, archived, total: list.length };
  }

  function getAnalyticsSummary() {
    const store = getLocalAnalytics();
    const today = new Date().toISOString().slice(0, 10);
    const day = (store.days && store.days[today]) || {};
    const sessions = store.sessions ? Object.keys(store.sessions).length : 0;
    const todaySessions = day.sessions ? Object.keys(day.sessions).length : 0;
    return {
      allPageViews: Number(store.totalPageViews || 0),
      allEvents: Number(store.totalEvents || 0),
      sessions,
      todayViews: Number(day.pageViews || 0),
      todayEvents: Number(day.events || 0),
      todaySessions,
      storeClicks: Number(store.storeClicks || 0),
      gameClicks: Number(store.gameClicks || 0),
      supportClicks: Number(store.supportClicks || 0),
      updatedAt: store.updatedAt || 'pending'
    };
  }

  function paintTopCounts(source = 'local fallback') {
    const c = getMessageCounts();
    if ($('counts')) $('counts').textContent = `Active ${c.active} · Unread ${c.unread} · Archived ${c.archived}`;
    if ($('memberCounts')) $('memberCounts').textContent = 'Members: local pending';
    if ($('billboardCounts')) $('billboardCounts').textContent = 'Billboards: local pending';
    const online = (() => { try { return localStorage.getItem(LOCAL_ADMIN_KEY) !== 'offline'; } catch (e) { return true; } })();
    if ($('status')) {
      $('status').innerHTML = online ? '<span class="status-dot status-online"></span>Admin Online' : '<span class="status-dot status-offline"></span>Admin Offline';
      $('status').className = `pill status-pill ${online ? 'good' : 'bad'}`;
      $('status').title = source;
    }
  }

  function renderLocalAnalytics(note = '') {
    const a = getAnalyticsSummary();
    const cards = [
      ['All Page Views', a.allPageViews],
      ['Unique Sessions', a.sessions],
      ['Today Views', a.todayViews],
      ['Today Sessions', a.todaySessions],
      ['All Events', a.allEvents],
      ['Today Events', a.todayEvents],
      ['Store Clicks', a.storeClicks],
      ['Game Clicks', a.gameClicks],
      ['Support Clicks', a.supportClicks],
      ['Messages Saved Local', getMessageCounts().total],
      ['Members', 'API pending'],
      ['Billboards', 'API pending']
    ];
    const html = '<div class="stats">' + cards.map((c) => `<div class="stat"><span class="muted">${safe(c[0])}</span><b>${safe(c[1])}</b></div>`).join('') + '</div>';
    const details = `<p class="muted">${safe(note || 'Showing hidden local fallback counters for this browser while the live API route is unavailable. Public visitors cannot see this panel.')}</p><p class="muted">Last local counter update: ${safe(a.updatedAt)}</p>`;
    if ($('analytics')) $('analytics').innerHTML = html + details;
  }

  function renderLocalMessages() {
    const list = getLocalMessages();
    paintTopCounts('local messages');
    if (!$('dataView')) return;
    if (!list.length) {
      $('dataView').innerHTML = 'No local messages saved in this browser yet. Live API messages may still be pending until the backend route is restored.';
      return;
    }
    $('dataView').innerHTML = list.slice().reverse().map((m, i) => `<div class="msg ${m.sent ? '' : 'unread'}"><b>${safe(m.subject || 'Local message')}</b> <span class="pill">${m.sent ? 'Sent backup' : 'Local fallback'}</span><br><span class="muted">From: ${safe(m.name || 'Anonymous')} ${safe(m.email || '')}<br>${safe(m.createdAt || m.created_at || '')} · ${safe(m.source || 'site')}</span><br><br>${safe(m.message || '')}<br><br><span class="muted">Local ID: ${i + 1}</span></div>`).join('');
  }

  async function ping(path, options = {}) {
    const res = await fetch(API + path, Object.assign({ cache: 'no-store', headers: { Accept: 'application/json' } }, options));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
    return data;
  }

  async function tryServerAnalytics() {
    if ($('analytics')) $('analytics').textContent = 'Checking live API counters...';
    try {
      const d = await ping('/api/admin/analytics/summary');
      const t = d.totals || d.summary || d || {};
      const b = d.business || {};
      const cards = [
        ['All Page Views', t.all_page_views ?? t.totalPageViews ?? t.totalViews],
        ['Unique Sessions', t.all_sessions ?? t.uniqueSessions ?? t.sessions],
        ['24h Views', t.page_views_24h ?? t.viewsToday],
        ['7d Views', t.page_views_7d],
        ['30d Views', t.page_views_30d],
        ['30d Messages', b.messages_30d],
        ['30d Leads', b.leads_30d],
        ['Active Store Items', b.active_store_items]
      ];
      if ($('analytics')) $('analytics').innerHTML = '<div class="stats">' + cards.map((c) => `<div class="stat"><span class="muted">${safe(c[0])}</span><b>${n(c[1])}</b></div>`).join('') + '</div><p class="good">Live API counters loaded.</p>';
    } catch (error) {
      renderLocalAnalytics(`Live API counter route unavailable: ${error.message}. Showing hidden local fallback counters instead.`);
    }
  }

  function setAdminOnline(value) {
    try { localStorage.setItem(LOCAL_ADMIN_KEY, value ? 'online' : 'offline'); } catch (error) {}
    paintTopCounts('local admin toggle');
    if ($('controlNote')) $('controlNote').textContent = value ? 'Admin Online set locally. Live API route still pending.' : 'Admin Offline set locally. Live API route still pending.';
  }

  function installOwnerFallback() {
    paintTopCounts('local boot');
    renderLocalAnalytics('Hidden owner-only local counter loaded. Live API routes will override this after backend deployment.');

    const loginBtn = $('loginBtn');
    if (loginBtn) loginBtn.onclick = async () => {
      if ($('loginNote')) $('loginNote').textContent = 'Checking owner API...';
      try {
        await ping('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: ($('email')?.value || '').trim(), password: $('password')?.value || '' }) });
        if ($('loginNote')) $('loginNote').textContent = 'Owner API login route responded.';
      } catch (error) {
        if ($('loginNote')) $('loginNote').textContent = `API route not found. Local owner counter mode active: ${error.message}`;
      }
      await tryServerAnalytics();
      renderLocalMessages();
    };

    const logoutBtn = $('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = () => {
      if ($('loginNote')) $('loginNote').textContent = 'Logged out locally in this browser.';
      if ($('dataView')) $('dataView').textContent = 'Log in, then choose a section.';
    };

    if ($('onlineBtn')) $('onlineBtn').onclick = () => setAdminOnline(true);
    if ($('offlineBtn')) $('offlineBtn').onclick = () => setAdminOnline(false);
    if ($('analyticsBtn')) $('analyticsBtn').onclick = tryServerAnalytics;
    if ($('refreshBtn')) $('refreshBtn').onclick = renderLocalMessages;
    if ($('tabMessages')) $('tabMessages').onclick = renderLocalMessages;

    ['membersBtn','billboardsBtn','storeBtn','gameBtn','logsBtn','tabMembers','tabBillboards','tabStore','tabGame','tabLogs'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('click', () => {
        if ($('controlNote')) $('controlNote').textContent = 'This section needs the live API route. Counter fallback remains active.';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installOwnerFallback);
  else installOwnerFallback();
})();
