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
    } catch {
      return `svr-site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function readStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function writeStore(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
  }

  function record(eventType, metadata = {}) {
    const now = new Date().toISOString();
    const day = now.slice(0, 10);
    const sessionId = getSessionId();
    const store = readStore();
    store.totalEvents = Number(store.totalEvents || 0) + 1;
    store.totalPageViews = Number(store.totalPageViews || 0) + (eventType === 'page_view' ? 1 : 0);
    store.sessions = store.sessions || {};
    store.sessions[sessionId] = now;
    store.days = store.days || {};
    store.days[day] = store.days[day] || { pageViews: 0, events: 0, sessions: {} };
    store.days[day].events += 1;
    if (eventType === 'page_view') store.days[day].pageViews += 1;
    store.days[day].sessions[sessionId] = true;
    store.recent = Array.isArray(store.recent) ? store.recent : [];
    store.recent.push({ eventType, at: now, path: location.pathname || '/', title: document.title || '', metadata });
    store.recent = store.recent.slice(-200);
    store.updatedAt = now;
    writeStore(store);
    window.SVR_LOCAL_ANALYTICS = store;
  }

  function injectAndroidReleaseNotice() {
    if (document.getElementById('svr-apk-notice') || document.getElementById('svr-phase378-release-notice')) return;
    const style = document.createElement('style');
    style.id = 'svr-phase378-release-style';
    style.textContent = `#svr-phase378-release-notice{position:fixed;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));z-index:2147483645;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding:10px;border:1px solid #8dffb4;border-radius:16px;background:rgba(0,10,16,.97);box-shadow:0 20px 70px rgba(0,0,0,.85);color:#fff;font:800 12px system-ui,Arial}#svr-phase378-release-notice strong{color:#8dffb4;letter-spacing:.06em}#svr-phase378-release-notice a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 12px;border-radius:999px;background:#8dffb4;color:#02040a;text-decoration:none;font-weight:950}#svr-phase378-release-notice a.play{background:#7ffcff}#svr-phase378-release-notice button{width:32px;height:32px;border:1px solid #ffffff33;border-radius:999px;background:#ffffff12;color:#fff;font-size:18px}@media(max-width:520px){#svr-phase378-release-notice a{flex:1}body{padding-bottom:max(84px,env(safe-area-inset-bottom))!important}}`;
    document.head.appendChild(style);
    const notice = document.createElement('aside');
    notice.id = 'svr-phase378-release-notice';
    notice.setAttribute('aria-label', 'SVR Android APK RC2 release');
    notice.innerHTML = `<strong>NEW ANDROID APK RC2</strong><a href="/downloads/svr-poker-android-rc2.apk?phase=378" download>DOWNLOAD APK</a><a class="play" href="/game/android-stable.html?v=phase378">PLAY ANDROID</a><button type="button" aria-label="Close Android release notice">×</button>`;
    notice.querySelector('button').addEventListener('click', () => notice.remove());
    document.body.appendChild(notice);
  }

  function wireClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a,button');
      if (!link) return;
      const label = (link.textContent || link.getAttribute('aria-label') || link.href || 'click').trim().slice(0, 120);
      const href = link.href || '';
      if (/apk|download/i.test(label + ' ' + href)) record('android_apk_click', { label, href });
      else if (/game|preview|play|vr/i.test(label + ' ' + href)) record('game_interest_click', { label, href });
      else if (/store/i.test(label + ' ' + href)) record('store_click', { label, href });
      else if (/support|donate|cash/i.test(label + ' ' + href)) record('support_click', { label, href });
      else record('site_click', { label, href });
    }, { passive: true });
  }

  function boot() {
    record('page_view', { href: location.href, referrer: document.referrer || '', build: 'PHASE-378-PUBLIC-APK-NOTICE' });
    wireClicks();
    injectAndroidReleaseNotice();
    window.SVR_PHASE378_PUBLIC_NOTICE = { active: true, apk: '/downloads/svr-poker-android-rc2.apk', game: '/game/android-stable.html?v=phase378', checkedAt: new Date().toISOString() };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
