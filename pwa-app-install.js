(() => {
  const BUILD = 'PHASE-102-PWA-APP-DOWNLOAD-SIGNED-READY';
  const APP_PAGE = '/site/app.html';
  const MANIFEST_URL = '/manifest.webmanifest';
  const SERVICE_WORKER_URL = '/pwa-sw.js';
  let deferredPrompt = null;

  function ensureHead() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = MANIFEST_URL;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#9b4dff';
      document.head.appendChild(theme);
    }
  }

  function injectStyle() {
    if (document.getElementById('svr-pwa-install-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-pwa-install-style';
    style.textContent = '.svr-app-install-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;border:1px solid rgba(255,217,138,.64)!important;border-radius:999px!important;background:linear-gradient(135deg,rgba(255,217,138,.96),rgba(127,252,255,.82))!important;color:#05060b!important;font-family:Orbitron,system-ui,Arial!important;font-weight:900!important;letter-spacing:.055em!important;text-transform:uppercase!important;text-decoration:none!important;box-shadow:0 16px 42px rgba(0,0,0,.35),0 0 18px rgba(255,217,138,.16)!important;cursor:pointer!important}.action-row .svr-app-install-btn,#control-dock-container .svr-app-install-btn{min-width:min(40vw,220px);padding:12px 22px;font-size:clamp(.90rem,1.25vw,1rem)}.market-links .svr-app-install-btn{padding:8px 11px;font-size:.78rem;min-width:auto}.svr-body-menu-panel .svr-app-install-btn{min-height:40px!important;padding:8px!important;font-size:.78rem!important}@media(max-width:520px){.action-row .svr-app-install-btn,#control-dock-container .svr-app-install-btn{width:min(78vw,310px);min-width:min(78vw,310px)}}';
    document.head.appendChild(style);
  }

  function label(text) {
    document.querySelectorAll('[data-svr-app-install]').forEach((el) => {
      if (el.dataset.lockLabel === '1') return;
      el.textContent = text || 'Download App';
      el.title = text || 'Download SVR App';
      el.setAttribute('aria-label', text || 'Download SVR App');
    });
  }

  async function installApp(event) {
    if (event) event.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      label(choice && choice.outcome === 'accepted' ? 'App Installed' : 'Download App');
      window.SVR_APP_INSTALL = { build: BUILD, prompted: true, choice: choice && choice.outcome || 'unknown', checkedAt: new Date().toISOString() };
      return;
    }
    window.SVR_APP_INSTALL = { build: BUILD, prompted: false, fallback: APP_PAGE, checkedAt: new Date().toISOString() };
    if (location.pathname !== APP_PAGE) location.href = APP_PAGE;
  }

  function makeButton(extraClass) {
    const a = document.createElement('a');
    a.href = APP_PAGE;
    a.className = ['svr-app-install-btn', extraClass || ''].join(' ').trim();
    a.dataset.svrAppInstall = '1';
    a.textContent = 'Download App';
    a.setAttribute('aria-label', 'Download SVR App');
    a.addEventListener('click', installApp);
    return a;
  }

  function wireExisting() {
    document.querySelectorAll('[data-svr-app-install]').forEach((el) => {
      if (el.dataset.svrInstallWired === '1') return;
      el.dataset.svrInstallWired = '1';
      el.addEventListener('click', installApp);
    });
  }

  function injectButtons() {
    if (!document.querySelector('[data-svr-app-install]')) {
      const dock = document.getElementById('control-dock-container') || document.querySelector('.action-row');
      if (dock) dock.appendChild(makeButton('launch-download'));
    }
    const marketLinks = document.querySelector('.market-links');
    if (marketLinks && !marketLinks.querySelector('[data-svr-app-install]')) {
      marketLinks.appendChild(makeButton('market-download'));
    }
    const floating = document.getElementById('svr-body-floating-menu-panel');
    if (floating && !floating.querySelector('[data-svr-app-install]')) {
      floating.appendChild(makeButton('floating-download'));
    }
    wireExisting();
  }

  function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    const secure = location.protocol === 'https:' || /localhost|127\.0\.0\.1/i.test(location.hostname);
    if (!secure) return;
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' })
      .then((registration) => {
        window.SVR_PWA = { build: BUILD, registered: true, scope: registration.scope, checkedAt: new Date().toISOString() };
      })
      .catch((error) => {
        window.SVR_PWA = { build: BUILD, registered: false, error: String(error && error.message || error), checkedAt: new Date().toISOString() };
      });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    label('Install App');
    window.SVR_APP_INSTALL = { build: BUILD, ready: true, checkedAt: new Date().toISOString() };
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    label('App Installed');
    window.SVR_APP_INSTALL = { build: BUILD, installed: true, checkedAt: new Date().toISOString() };
  });

  function boot() {
    ensureHead();
    injectStyle();
    injectButtons();
    registerWorker();
    setTimeout(injectButtons, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
