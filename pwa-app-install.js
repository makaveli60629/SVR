(() => {
  const BUILD = 'PHASE-158-SITE-FLOATING-DOWNLOAD-BUTTON-REMOVED';
  const APP_PAGE = '/downloads/';
  const MANIFEST_URL = '/manifest.webmanifest';
  const SERVICE_WORKER_URL = '/pwa-sw.js';
  let installEvent = null;

  function isSiteArea() {
    const path = location.pathname || '/';
    return path === '/site' || path === '/site/' || path.startsWith('/site/') || path.startsWith('/downloads/');
  }

  function addHeadLinks() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = MANIFEST_URL;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#9b4dff';
      document.head.appendChild(meta);
    }
  }

  function addStyles() {
    if (document.getElementById('svr-pwa-header-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-pwa-header-style';
    style.textContent = `.svr-app-install-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(255,217,138,.72)!important;border-radius:999px!important;background:linear-gradient(135deg,rgba(255,217,138,.98),rgba(127,252,255,.88))!important;color:#05060b!important;font-family:Orbitron,system-ui,Arial!important;font-weight:900!important;letter-spacing:.055em!important;text-transform:uppercase!important;text-decoration:none!important;box-shadow:0 16px 42px rgba(0,0,0,.38),0 0 18px rgba(255,217,138,.16)!important;cursor:pointer!important}.svr-site-menu-download-button{display:none!important}.svr-market-nav-app-button{flex:0 0 auto!important;padding:8px 11px!important;font-size:.76rem!important;min-width:auto!important}.market-links .svr-app-install-btn{padding:8px 11px!important;font-size:.78rem!important;min-width:auto!important}.svr-body-menu-panel .svr-app-install-btn{min-height:40px!important;padding:8px!important;font-size:.78rem!important}`;
    document.head.appendChild(style);
  }

  function setButtonText(text) {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.id === 'svr-site-menu-download-button') button.remove();
      else button.textContent = text || 'Download App';
      button.setAttribute('aria-label', text || 'Download SVR App');
      button.title = text || 'Download SVR App';
    });
  }

  function writeStatus(message) {
    const status = document.getElementById('svrAppInstallStatus');
    if (status) status.textContent = message;
    window.SVR_APP_INSTALL_STATUS = { build: BUILD, message, checkedAt: new Date().toISOString() };
  }

  async function openInstall(event) {
    if (event) event.preventDefault();
    if (installEvent) {
      installEvent.prompt();
      const choice = await installEvent.userChoice.catch(() => null);
      installEvent = null;
      const accepted = choice && choice.outcome === 'accepted';
      setButtonText(accepted ? 'App Installed' : 'Download App');
      writeStatus(accepted ? 'SVR Poker app installation started.' : 'Install was dismissed. Opening downloads for backup install options.');
      if (!accepted) location.href = `${APP_PAGE}?install=1&source=site-button`;
      return;
    }
    if (window.SVR_APP_DOWNLOAD_MANAGER && typeof window.SVR_APP_DOWNLOAD_MANAGER.open === 'function') {
      window.SVR_APP_DOWNLOAD_MANAGER.open('site-button');
      return;
    }
    location.href = `${APP_PAGE}?install=1&source=site-button`;
  }

  function makeButton(className) {
    const button = document.createElement('a');
    button.href = `${APP_PAGE}?install=1&source=site-button`;
    button.className = `svr-app-install-btn ${className || ''}`.trim();
    button.dataset.svrAppInstall = '1';
    button.dataset.svrInstallApp = '1';
    button.textContent = 'Download App';
    button.setAttribute('aria-label', 'Download SVR App');
    button.addEventListener('click', openInstall);
    return button;
  }

  function wireButtons() {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.id === 'svr-site-menu-download-button') { button.remove(); return; }
      if (button.dataset.svrPwaInstallWired === '1') return;
      button.dataset.svrPwaInstallWired = '1';
      button.addEventListener('click', openInstall);
    });
  }

  function removeFloatingDownloadButton() {
    document.querySelectorAll('#svr-site-menu-download-button,.svr-site-menu-download-button').forEach((el) => el.remove());
  }

  function removePublicButtons() {
    if (isSiteArea()) return;
    document.querySelectorAll('[data-svr-app-install],#svr-site-menu-download-button,#svr-header-app-download-button').forEach((el) => el.remove());
  }

  function placeSiteMenuButton() {
    removeFloatingDownloadButton();
  }

  function placeNavButton() {
    const links = document.querySelector('.market-links');
    if (!links || links.querySelector('[data-svr-app-install]')) return;
    const button = makeButton('svr-market-nav-app-button');
    button.textContent = 'Download App';
    const firstLink = links.querySelector('a');
    if (firstLink) links.insertBefore(button, firstLink);
    else links.appendChild(button);
  }

  function installServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && !/localhost|127\.0\.0\.1/.test(location.hostname)) return;
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch(() => {});
  }

  function boot() {
    if (!isSiteArea()) { removePublicButtons(); return; }
    addHeadLinks();
    addStyles();
    removeFloatingDownloadButton();
    placeNavButton();
    wireButtons();
    installServiceWorker();
    setTimeout(() => { removeFloatingDownloadButton(); wireButtons(); }, 120);
    setTimeout(() => { removeFloatingDownloadButton(); wireButtons(); }, 450);
    setTimeout(() => { removeFloatingDownloadButton(); wireButtons(); }, 1400);
    setTimeout(() => { removeFloatingDownloadButton(); wireButtons(); }, 2600);
    window.addEventListener('resize', removeFloatingDownloadButton);
    window.SVR_PWA_HEADER_BUTTON = { build: BUILD, active: true, siteOnly: true, floatingRemoved: true, appPage: APP_PAGE, checkedAt: new Date().toISOString() };
  }

  window.addEventListener('beforeinstallprompt', (event) => { if (!isSiteArea()) return; event.preventDefault(); installEvent = event; setButtonText('Install App'); writeStatus('Install prompt is ready. Press Install App to install SVR Poker.'); });
  window.addEventListener('appinstalled', () => { installEvent = null; setButtonText('App Installed'); writeStatus('SVR Poker app installed.'); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
