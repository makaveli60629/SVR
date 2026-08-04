(() => {
  const BUILD = 'PHASE-374-PHYSICAL-APP-LAUNCHER-LOCK';
  if (window.SVR_APP_DOWNLOAD_MANAGER_LOADED) return;
  window.SVR_APP_DOWNLOAD_MANAGER_LOADED = true;

  const ROUTES = {
    launcher: '/index.html?v=phase374&source=app',
    android: '/game/android.html?channel=stable&v=phase374&source=app',
    quest: '/game/index.html?platform=quest&v=phase374&source=app',
    preview: '/game/camera3.html?preview=1&cam=director&autocam=1&embed=1&v=phase374',
    site: '/site/index.html?v=phase374&source=app',
    downloads: '/downloads/'
  };
  const APK_CANDIDATES = ['/downloads/svr-poker.apk', '/android/svr-poker.apk', '/update/svr-poker.apk'];
  let deferredPrompt = null;
  let discoveredApk = null;
  let serviceWorkerReady = false;

  const platform = () => {
    const ua = navigator.userAgent || '';
    if (/Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'desktop';
  };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function ensureHead() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest?v=phase374';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#9b4dff';
      document.head.appendChild(meta);
    }
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator) || (location.protocol !== 'https:' && location.hostname !== 'localhost')) return false;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || '';
        if (script && !/pwa-sw\.js|sw\.js/.test(script)) await registration.unregister();
      }
      const registration = await navigator.serviceWorker.register('/pwa-sw.js?v=phase374', { scope: '/', updateViaCache: 'none' });
      await registration.update().catch(() => undefined);
      serviceWorkerReady = true;
      window.SVR_PWA_SERVICE_WORKER = { ok: true, build: BUILD, script: '/pwa-sw.js?v=phase374', scope: registration.scope, checkedAt: new Date().toISOString() };
      return true;
    } catch (error) {
      window.SVR_PWA_SERVICE_WORKER = { ok: false, build: BUILD, error: String(error?.message || error), checkedAt: new Date().toISOString() };
      return false;
    }
  }

  async function discoverApk() {
    for (const path of APK_CANDIDATES) {
      try {
        const response = await fetch(`${path}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        if (response.ok) { discoveredApk = path; break; }
      } catch {}
    }
    window.SVR_ANDROID_APK_DISCOVERY = { build: BUILD, apkPath: discoveredApk, checkedAt: new Date().toISOString() };
  }

  function ensureStyle() {
    if (document.getElementById('svr374-install-style')) return;
    const style = document.createElement('style');
    style.id = 'svr374-install-style';
    style.textContent = `
      #svr374InstallModal{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.82);backdrop-filter:blur(12px);font-family:system-ui,Arial;color:#fff}
      #svr374InstallModal[hidden]{display:none!important}.svr374-install-card{width:min(620px,94vw);border:1px solid rgba(86,255,154,.56);border-radius:24px;background:rgba(4,7,16,.98);padding:20px;box-shadow:0 28px 90px rgba(0,0,0,.82)}
      .svr374-install-card h2{margin:0 0 8px;color:#56ff9a}.svr374-install-card p{color:#dfe8f8;line-height:1.45}.svr374-install-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}.svr374-install-grid a,.svr374-install-grid button{display:flex;align-items:center;justify-content:center;min-height:46px;border:1px solid rgba(127,252,255,.5);border-radius:999px;background:#111827;color:#fff;text-decoration:none;font-weight:900;padding:10px;cursor:pointer}.svr374-install-grid .primary{border:0;background:linear-gradient(135deg,#56ff9a,#7ffcff);color:#02070a}.svr374-install-meta{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#02040a;padding:10px;color:#c9ffdc;font-size:12px;line-height:1.5}@media(max-width:560px){.svr374-install-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function modal() {
    ensureStyle();
    let root = document.getElementById('svr374InstallModal');
    if (!root) {
      root = document.createElement('section');
      root.id = 'svr374InstallModal';
      document.body.appendChild(root);
    }
    const p = platform();
    const installCopy = standalone()
      ? 'Installed app mode is active.'
      : deferredPrompt
        ? 'The browser install prompt is ready.'
        : 'Use the browser menu and choose Install app or Add to Home screen.';
    root.innerHTML = `
      <div class="svr374-install-card">
        <h2>SVR POKER • PHASE 374</h2>
        <p>${installCopy} The installed app now opens the current Android physical-release route instead of the former site-only launcher.</p>
        <div class="svr374-install-meta">Platform: ${p}<br>Service worker: ${serviceWorkerReady ? 'Phase 374 ready' : 'checking'}<br>Android route: ${ROUTES.android}<br>Quest route: ${ROUTES.quest}<br>APK: ${discoveredApk || 'existing rc1 wrapper; no forced update'}</div>
        <div class="svr374-install-grid">
          <button class="primary" type="button" data-install>${standalone() ? 'APP INSTALLED' : 'INSTALL SITE APP'}</button>
          <a href="${p === 'quest' ? ROUTES.quest : ROUTES.android}">${p === 'quest' ? 'ENTER QUEST' : 'PLAY ANDROID'}</a>
          <a href="${ROUTES.launcher}">OPEN RELEASE LAUNCHER</a>
          ${discoveredApk ? `<a href="${discoveredApk}" download>DOWNLOAD APK</a>` : `<a href="${ROUTES.downloads}">OPEN DOWNLOADS</a>`}
          <button type="button" data-clear>CLEAR OLD CACHE</button>
          <button type="button" data-close>CLOSE</button>
        </div>
      </div>`;
    root.hidden = false;
    root.querySelector('[data-close]').onclick = () => { root.hidden = true; };
    root.querySelector('[data-install]').onclick = install;
    root.querySelector('[data-clear]').onclick = clearOldCache;
    return root;
  }

  async function install(event) {
    event?.preventDefault?.();
    if (standalone()) { modal(); return; }
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      await prompt.prompt();
      const result = await prompt.userChoice.catch(() => ({ outcome: 'unknown' }));
      window.SVR_APP_INSTALL_RESULT = { build: BUILD, outcome: result.outcome, checkedAt: new Date().toISOString() };
      return;
    }
    modal();
  }

  async function clearOldCache() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {}
    location.replace(`${ROUTES.launcher}&fresh=${Date.now()}`);
  }

  function wire() {
    document.querySelectorAll('[data-svr-install-app],[data-svr-app-install],[data-svr-download-app]').forEach((button) => {
      if (button.dataset.svr374Wired === '1') return;
      button.dataset.svr374Wired = '1';
      button.addEventListener('click', install);
      button.textContent = standalone() ? 'App Installed' : 'Install App';
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    wire();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    wire();
  });

  async function boot() {
    ensureHead();
    ensureStyle();
    await registerWorker();
    await discoverApk();
    wire();
    setTimeout(wire, 900);
    window.SVR_APP_DOWNLOAD_MANAGER = {
      build: BUILD,
      active: true,
      phase: 374,
      platform: platform(),
      standalone: standalone(),
      serviceWorkerReady,
      apkPath: discoveredApk,
      routes: ROUTES,
      open: modal,
      install,
      clearOldCache,
      checkedAt: new Date().toISOString()
    };
    if (new URLSearchParams(location.search).has('install')) setTimeout(modal, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
