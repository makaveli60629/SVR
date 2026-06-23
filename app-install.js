(() => {
  const BUILD = 'SVR-PWA-INSTALL-DOWNLOAD-LOCK-01';
  if (window.SVR_APP_INSTALL_LOADED) return;
  window.SVR_APP_INSTALL_LOADED = true;

  let deferredPrompt = null;
  let installReady = false;

  function appRoot(path = '/') {
    return new URL(path, window.location.origin).toString();
  }

  function ensureHeadLinks() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = appRoot('/manifest.webmanifest?v=phase102-pwa');
      document.head.appendChild(manifest);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#9b4dff';
      document.head.appendChild(theme);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const apple = document.createElement('meta');
      apple.name = 'apple-mobile-web-app-capable';
      apple.content = 'yes';
      document.head.appendChild(apple);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const title = document.createElement('meta');
      title.name = 'apple-mobile-web-app-title';
      title.content = 'SVR Poker';
      document.head.appendChild(title);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const icon = document.createElement('link');
      icon.rel = 'apple-touch-icon';
      icon.href = appRoot('/logo.png');
      document.head.appendChild(icon);
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return { ok: false, reason: 'service-worker-unavailable' };
    if (!/^https:$/i.test(location.protocol) && location.hostname !== 'localhost') return { ok: false, reason: 'https-required' };
    try {
      const registration = await navigator.serviceWorker.register(appRoot('/sw.js'), { scope: '/' });
      window.SVR_PWA_SERVICE_WORKER = { ok: true, scope: registration.scope, build: BUILD, checkedAt: new Date().toISOString() };
      return { ok: true, registration };
    } catch (error) {
      window.SVR_PWA_SERVICE_WORKER = { ok: false, error: String(error && error.message || error), build: BUILD, checkedAt: new Date().toISOString() };
      return { ok: false, error };
    }
  }

  function platformName() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function ensureInstallStyles() {
    if (document.getElementById('svr-app-install-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-app-install-style';
    style.textContent = `
      [data-svr-install-app]{cursor:pointer}
      .svr-install-inline-status{display:inline-flex;align-items:center;gap:6px;margin-left:6px;color:#bffcff;font-size:.75rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      .svr-install-modal{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);font-family:Rajdhani,system-ui,Arial;color:#fff}
      .svr-install-card{width:min(520px,calc(100vw - 28px));border:1px solid rgba(127,252,255,.48);border-radius:24px;background:radial-gradient(circle at 20% 0%,rgba(155,77,255,.28),transparent 34%),rgba(4,5,16,.98);box-shadow:0 30px 110px rgba(0,0,0,.88),0 0 38px rgba(127,252,255,.14);padding:22px;text-align:left}
      .svr-install-card h2{margin:0 0 8px;font-family:Orbitron,system-ui,Arial;letter-spacing:.06em;color:#bffcff;text-transform:uppercase;font-size:1.2rem}
      .svr-install-card p{margin:8px 0;color:#e7dcff;line-height:1.45}.svr-install-card ol{margin:12px 0 0;padding-left:20px;color:#fff}.svr-install-card li{margin:6px 0}.svr-install-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.svr-install-actions button,.svr-install-actions a{display:inline-flex;align-items:center;justify-content:center;min-width:140px;padding:11px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-weight:900;cursor:pointer}.svr-install-actions .primary{background:linear-gradient(135deg,#7ffcff,#9b4dff);color:#03040b}
    `;
    document.head.appendChild(style);
  }

  function modalCopy() {
    const p = platformName();
    if (p === 'ios') {
      return {
        title: 'Install SVR Poker on iPhone',
        body: 'Apple requires browser-based web apps to be added from Safari.',
        steps: ['Open this page in Safari.', 'Tap the Share button.', 'Choose Add to Home Screen.', 'Tap Add.']
      };
    }
    if (p === 'android') {
      return {
        title: 'Install SVR Poker on Android',
        body: 'Use Chrome or a compatible Android browser. If the install prompt does not appear automatically, use the browser menu.',
        steps: ['Open this page in Chrome.', 'Tap the three-dot menu.', 'Choose Install app or Add to Home screen.', 'Confirm SVR Poker.']
      };
    }
    return {
      title: 'Install SVR Poker',
      body: 'Use a Chromium browser install icon or menu option to install SVR Poker as an app.',
      steps: ['Open the browser menu or install icon.', 'Choose Install SVR Poker.', 'Launch SVR Poker from your device apps.']
    };
  }

  function showInstructions(message = '') {
    ensureInstallStyles();
    document.querySelector('.svr-install-modal')?.remove();
    const copy = modalCopy();
    const modal = document.createElement('div');
    modal.className = 'svr-install-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <section class="svr-install-card">
        <h2>${copy.title}</h2>
        <p>${message || copy.body}</p>
        <ol>${copy.steps.map(step => `<li>${step}</li>`).join('')}</ol>
        <p><strong>Status:</strong> PWA install is HTTPS-backed. Production APK signing requires the private SVR Android keystore in GitHub secrets.</p>
        <div class="svr-install-actions">
          <a class="primary" href="/downloads/">Open Downloads</a>
          <button type="button" data-close-install>Close</button>
        </div>
      </section>
    `;
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-close-install]')) modal.remove();
    });
    document.body.appendChild(modal);
  }

  async function installApp(event) {
    if (event) event.preventDefault();
    if (isStandalone()) {
      showInstructions('SVR Poker already appears to be running as an installed app.');
      return;
    }
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      promptEvent.prompt();
      const result = await promptEvent.userChoice.catch(() => ({ outcome: 'unknown' }));
      window.SVR_APP_INSTALL_RESULT = { outcome: result.outcome, build: BUILD, checkedAt: new Date().toISOString() };
      refreshButtons();
      return;
    }
    showInstructions();
  }

  function makeButton(label = 'Download App', className = '') {
    const btn = document.createElement('a');
    btn.href = '/downloads/';
    btn.textContent = label;
    btn.className = className;
    btn.dataset.svrInstallApp = '1';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Download or install the SVR Poker app');
    btn.addEventListener('click', installApp);
    return btn;
  }

  function injectButtons() {
    ensureInstallStyles();
    if (!document.querySelector('[data-svr-install-app]')) {
      const dock = document.getElementById('control-dock-container') || document.querySelector('.launch-page .action-row');
      if (dock) dock.appendChild(makeButton('Download App', 'btn btn-primary'));
    }
    const marketLinks = document.querySelector('.market-links');
    if (marketLinks && !marketLinks.querySelector('[data-svr-install-app]')) {
      marketLinks.appendChild(makeButton('Download App', ''));
    }
    const heroActions = document.querySelector('.live-copy .actions,.hero .actions');
    if (heroActions && !heroActions.querySelector('[data-svr-install-app]')) {
      heroActions.appendChild(makeButton('Download App', 'btn secondary'));
    }
    document.querySelectorAll('[data-svr-install-app]').forEach((btn) => {
      if (btn.dataset.svrInstallWired === '1') return;
      btn.dataset.svrInstallWired = '1';
      btn.addEventListener('click', installApp);
    });
    refreshButtons();
  }

  function refreshButtons() {
    const installed = isStandalone();
    document.querySelectorAll('[data-svr-install-app]').forEach((btn) => {
      if (installed) btn.textContent = 'App Installed';
      else if (installReady) btn.textContent = 'Install App';
      else btn.textContent = 'Download App';
      btn.title = installed ? 'SVR Poker is already installed' : 'Install SVR Poker on this device';
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installReady = true;
    refreshButtons();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installReady = false;
    window.SVR_APP_INSTALLED = { ok: true, build: BUILD, installedAt: new Date().toISOString() };
    refreshButtons();
  });

  async function boot() {
    ensureHeadLinks();
    await registerServiceWorker();
    injectButtons();
    setTimeout(injectButtons, 750);
    setTimeout(injectButtons, 1800);
    window.SVR_APP_INSTALL = { build: BUILD, active: true, standalone: isStandalone(), platform: platformName(), checkedAt: new Date().toISOString() };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
