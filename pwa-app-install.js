(() => {
  const BUILD = 'PHASE-104-SITE-ONLY-APP-MENU-INSTALL-LOCK';
  const APP_PAGE = '/site/app.html';
  const MANIFEST_URL = '/manifest.webmanifest';
  const SERVICE_WORKER_URL = '/pwa-sw.js';
  let installEvent = null;

  function isSiteArea() {
    const path = location.pathname || '/';
    return path === '/site' || path === '/site/' || path.startsWith('/site/');
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
    style.textContent = `.svr-app-install-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(255,217,138,.66)!important;border-radius:999px!important;background:linear-gradient(135deg,rgba(255,217,138,.96),rgba(127,252,255,.84))!important;color:#05060b!important;font-family:Orbitron,system-ui,Arial!important;font-weight:900!important;letter-spacing:.055em!important;text-transform:uppercase!important;text-decoration:none!important;box-shadow:0 16px 42px rgba(0,0,0,.38),0 0 18px rgba(255,217,138,.16)!important;cursor:pointer!important}.svr-site-menu-download-button{position:fixed!important;top:10px!important;right:90px!important;z-index:2147483647!important;min-height:39px!important;padding:9px 13px!important;font-size:.74rem!important;line-height:1!important;white-space:nowrap!important;backdrop-filter:blur(18px)!important}.svr-market-nav-app-button{flex:0 0 auto!important;padding:8px 11px!important;font-size:.76rem!important;min-width:auto!important}.market-links .svr-app-install-btn{padding:8px 11px;font-size:.78rem;min-width:auto}@media(max-width:520px){.svr-site-menu-download-button{right:82px!important;top:10px!important;min-height:38px!important;padding:9px 11px!important;font-size:.68rem!important}.svr-site-menu-download-button .svr-app-full-label{display:none!important}}`;
    document.head.appendChild(style);
  }

  function setButtonText(text) {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.id === 'svr-site-menu-download-button') {
        button.innerHTML = text === 'App Installed' ? 'Installed' : '<span class="svr-app-full-label">Download </span>App';
      } else {
        button.textContent = text || 'Download App';
      }
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
      writeStatus(accepted ? 'SVR Poker app installation started.' : 'Install was dismissed. Press Install App again or use the browser menu.');
      return;
    }
    if (location.pathname !== APP_PAGE) {
      location.href = APP_PAGE;
      return;
    }
    writeStatus('Install prompt is not available in this browser yet. On Android Chrome, tap the browser menu and choose Install app or Add to Home screen. On desktop Chrome or Edge, use the install icon in the address bar or the browser menu.');
  }

  function makeButton(className) {
    const button = document.createElement('a');
    button.href = APP_PAGE;
    button.className = `svr-app-install-btn ${className || ''}`.trim();
    button.dataset.svrAppInstall = '1';
    button.textContent = 'Download App';
    button.addEventListener('click', openInstall);
    return button;
  }

  function wireButtons() {
    document.querySelectorAll('[data-svr-app-install]').forEach((button) => {
      if (button.dataset.svrInstallWired === '1') return;
      button.dataset.svrInstallWired = '1';
      button.addEventListener('click', openInstall);
    });
  }

  function removePublicButtons() {
    if (isSiteArea()) return;
    document.querySelectorAll('[data-svr-app-install],#svr-site-menu-download-button,#svr-header-app-download-button').forEach((el) => el.remove());
  }

  function placeSiteMenuButton() {
    let button = document.getElementById('svr-site-menu-download-button');
    if (!button) {
      button = makeButton('svr-site-menu-download-button');
      button.id = 'svr-site-menu-download-button';
      button.innerHTML = '<span class="svr-app-full-label">Download </span>App';
      document.body.appendChild(button);
    }
    const oldPublicButton = document.getElementById('svr-header-app-download-button');
    if (oldPublicButton && oldPublicButton !== button) oldPublicButton.remove();
    const menu = document.getElementById('svr-body-floating-menu');
    if (menu) {
      const rect = menu.getBoundingClientRect();
      button.style.right = `${Math.max(74, Math.round(window.innerWidth - rect.left + 8))}px`;
      button.style.top = `${Math.max(8, Math.round(rect.top))}px`;
    } else {
      button.style.right = '';
      button.style.top = '';
    }
  }

  function placeNavButton() {
    const links = document.querySelector('.market-links');
    if (!links || links.querySelector('[data-svr-app-install]')) return;
    const button = makeButton('svr-market-nav-app-button');
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
    if (!isSiteArea()) {
      removePublicButtons();
      return;
    }
    addHeadLinks();
    addStyles();
    placeSiteMenuButton();
    placeNavButton();
    wireButtons();
    installServiceWorker();
    setTimeout(() => { placeSiteMenuButton(); wireButtons(); }, 400);
    setTimeout(() => { placeSiteMenuButton(); wireButtons(); }, 1400);
    window.addEventListener('resize', placeSiteMenuButton);
    window.SVR_PWA_HEADER_BUTTON = { build: BUILD, active: true, siteOnly: true, appPage: APP_PAGE, checkedAt: new Date().toISOString() };
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
