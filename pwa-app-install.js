(() => {
  const BUILD = 'PHASE-158-SITE-HEADER-DOWNLOAD-BUTTON-REMOVED';
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
    style.textContent = `.svr-site-menu-download-button,.svr-market-nav-app-button,#svr-site-menu-download-button,#svr-header-app-download-button{display:none!important;visibility:hidden!important;pointer-events:none!important}.market-links [data-svr-app-install]{display:none!important;visibility:hidden!important;pointer-events:none!important}`;
    document.head.appendChild(style);
  }

  function setButtonText(text) {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.closest('.market-links') || button.id === 'svr-site-menu-download-button' || button.id === 'svr-header-app-download-button') {
        button.remove();
        return;
      }
      button.textContent = text || 'Download App';
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

  function wireRemainingButtons() {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.closest('.market-links') || button.id === 'svr-site-menu-download-button' || button.id === 'svr-header-app-download-button') {
        button.remove();
        return;
      }
      if (button.dataset.svrPwaInstallWired === '1') return;
      button.dataset.svrPwaInstallWired = '1';
      button.addEventListener('click', openInstall);
    });
  }

  function removeFloatingAndHeaderDownloadButtons() {
    document.querySelectorAll('#svr-site-menu-download-button,.svr-site-menu-download-button,#svr-header-app-download-button,.svr-market-nav-app-button,.market-links [data-svr-app-install]').forEach((el) => el.remove());
  }

  function removePublicButtons() {
    if (isSiteArea()) return;
    document.querySelectorAll('#svr-site-menu-download-button,.svr-site-menu-download-button,#svr-header-app-download-button,.svr-market-nav-app-button,.market-links [data-svr-app-install]').forEach((el) => el.remove());
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
    removeFloatingAndHeaderDownloadButtons();
    wireRemainingButtons();
    installServiceWorker();
    setTimeout(() => { removeFloatingAndHeaderDownloadButtons(); wireRemainingButtons(); }, 120);
    setTimeout(() => { removeFloatingAndHeaderDownloadButtons(); wireRemainingButtons(); }, 450);
    setTimeout(() => { removeFloatingAndHeaderDownloadButtons(); wireRemainingButtons(); }, 1400);
    setTimeout(() => { removeFloatingAndHeaderDownloadButtons(); wireRemainingButtons(); }, 2600);
    window.addEventListener('resize', removeFloatingAndHeaderDownloadButtons);
    window.SVR_PWA_HEADER_BUTTON = { build: BUILD, active: true, siteOnly: true, floatingRemoved: true, headerNavRemoved: true, appPage: APP_PAGE, checkedAt: new Date().toISOString() };
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    if (!isSiteArea()) return;
    event.preventDefault();
    installEvent = event;
    setButtonText('Install App');
    writeStatus('Install prompt is ready. Press Install App to install SVR Poker.');
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    setButtonText('App Installed');
    writeStatus('SVR Poker app installed.');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
