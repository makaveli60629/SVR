(() => {
  const BUILD = 'PHASE-369-SITE-APK-BANNER-TELEMETRY-FOUNDATION-LOCK';
  const RELEASE_URL = '/game/android-release.json';
  const DEPLOY_URL = '/update/app-version.json';
  const TELEMETRY_KEY = 'svr_phase369_telemetry_queue';
  const INSTALL_KEY = 'svr_app_installation_id';
  const VERSION_KEY = 'svr_app_update_state';

  const state = {
    build: BUILD,
    installed: false,
    installationId: null,
    release: null,
    deploy: null,
    bannerReady: false,
    updateAvailable: false,
    eventsQueued: 0,
    serverEventsSent: 0,
    lastError: null,
    checkedAt: null
  };

  function installationId() {
    let value = '';
    try { value = localStorage.getItem(INSTALL_KEY) || ''; } catch {}
    if (!value) {
      value = globalThis.crypto?.randomUUID?.()
        || `svr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      try { localStorage.setItem(INSTALL_KEY, value); } catch {}
    }
    state.installationId = value;
    return value;
  }

  function readInstalledVersion() {
    try {
      const saved = JSON.parse(localStorage.getItem(VERSION_KEY) || '{}');
      return Number(saved.installedApkVersionCode || window.SVR_ANDROID_UPDATE_POLICY?.apkVersionCode || 0);
    } catch {
      return Number(window.SVR_ANDROID_UPDATE_POLICY?.apkVersionCode || 0);
    }
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`${url}:${response.status}`);
    return response.json();
  }

  function queueEvent(name, detail = {}) {
    const event = {
      eventId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      installationId: installationId(),
      name,
      detail,
      page: location.pathname,
      referrerHost: (() => { try { return document.referrer ? new URL(document.referrer).host : ''; } catch { return ''; } })(),
      userAgentFamily: /Android/i.test(navigator.userAgent || '') ? 'android' : 'web',
      createdAt: new Date().toISOString()
    };
    try {
      const list = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
      list.push(event);
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(list.slice(-200)));
      state.eventsQueued = Math.min(200, list.length);
    } catch {}

    const base = String(window.SVR_TELEMETRY_API_BASE || '').replace(/\/$/, '');
    if (base) {
      fetch(`${base}/api/v1/telemetry/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(event)
      }).then((response) => {
        if (response.ok) state.serverEventsSent += 1;
      }).catch(() => undefined);
    }
    publish();
    return event;
  }

  function ensureUpdateChecker() {
    if (document.querySelector('script[data-svr-phase369-update-checker]')) return;
    const script = document.createElement('script');
    script.src = '/app-update-checker.js?v=phase369';
    script.defer = true;
    script.dataset.svrPhase369UpdateChecker = '1';
    document.head.appendChild(script);
  }

  function normalizeRelease(release = {}, deploy = {}) {
    return {
      versionName: release.apkVersionName || deploy.apkVersionName || '0.1.0-rc1',
      versionCode: Number(release.apkVersionCode || deploy.apkVersionCode || 1),
      apkUrl: release.apkUrl || deploy.apkUrl || '',
      releaseReady: release.releaseReady === true,
      updateMessage: release.updateMessage || deploy.message || 'SVR Poker Android update information.',
      webEntry: release.webEntry || deploy.androidSafeUrl || '/game/android.html?channel=stable',
      downloadsUrl: release.downloadsUrl || deploy.downloadsUrl || '/downloads/',
      sha256: release.apkSha256 || deploy.apkSha256 || '',
      build: release.currentGameBuild || deploy.gameBuild || deploy.build || 'SVR Android'
    };
  }

  function bannerMarkup(current) {
    const available = current.releaseReady && current.apkUrl;
    const installedCode = readInstalledVersion();
    const updateAvailable = available && current.versionCode > installedCode;
    state.updateAvailable = updateAvailable;
    const primaryHref = available ? current.apkUrl : current.downloadsUrl;
    const primaryText = available ? 'DOWNLOAD APP' : 'OPEN DOWNLOAD CENTER';
    const status = available
      ? `Signed APK ${current.versionName} is ready.`
      : `Android web app is ready. Signed APK download activates when the verified package is attached.`;
    return `
      <div class="svr-apk-update-ready" data-apk-update-badge ${updateAvailable ? '' : 'hidden'}>● NEW UPDATE</div>
      <div class="svr-apk-art">
        <div class="svr-apk-logo-wrap"><img src="/logo.webp" alt="SVR Poker Android app logo"></div>
        <div class="svr-apk-copy">
          <span class="svr-apk-kicker">ANDROID APP RELEASE CENTER</span>
          <h2>SVR POKER APP</h2>
          <p>${status}<span class="svr-apk-version">Version ${current.versionName} • Build ${current.versionCode}</span></p>
        </div>
      </div>
      <div class="svr-slide-overlay">
        <a class="btn primary" data-apk-download href="${primaryHref}" ${available ? 'download' : ''} aria-disabled="${available ? 'false' : 'true'}">${primaryText}</a>
        <button class="btn secondary" type="button" data-apk-update>CHECK FOR UPDATE</button>
        <a class="btn secondary" data-apk-play href="${current.webEntry}">PLAY ANDROID NOW</a>
      </div>`;
  }

  function showInlineStatus(slide, message, type = 'normal') {
    let status = slide.querySelector('[data-apk-inline-status]');
    if (!status) {
      status = document.createElement('div');
      status.dataset.apkInlineStatus = '1';
      status.style.cssText = 'position:absolute;left:50%;bottom:92px;transform:translateX(-50%);z-index:5;max-width:86%;padding:7px 11px;border-radius:999px;background:rgba(0,0,0,.72);color:#dffcff;font:800 12px system-ui;text-align:center;';
      slide.appendChild(status);
    }
    status.style.color = type === 'error' ? '#ffb3c7' : type === 'ready' ? '#baffd2' : '#dffcff';
    status.textContent = message;
    clearTimeout(status._timer);
    status._timer = setTimeout(() => status.remove(), 6500);
  }

  function wireBanner(current) {
    const slide = document.querySelector('[data-svr-slide-deck] [data-slide-id="slide-00"]')
      || document.querySelector('[data-svr-slide-deck] .svr-slide');
    if (!slide) return false;
    slide.classList.add('svr-apk-slide');
    slide.dataset.slideType = 'apk-release';
    slide.innerHTML = bannerMarkup(current);
    slide.querySelector('[data-apk-download]')?.addEventListener('click', () => {
      queueEvent(current.releaseReady && current.apkUrl ? 'apk_download_click' : 'download_center_click', {
        versionName: current.versionName,
        versionCode: current.versionCode,
        releaseReady: current.releaseReady
      });
    });
    slide.querySelector('[data-apk-play]')?.addEventListener('click', () => {
      queueEvent('android_web_play_click', { route: current.webEntry });
    });
    slide.querySelector('[data-apk-update]')?.addEventListener('click', async () => {
      queueEvent('apk_update_check', { installedVersionCode: readInstalledVersion() });
      showInlineStatus(slide, 'Checking the verified Android release…');
      try {
        const manager = typeof window.SVR_CHECK_FOR_APP_UPDATE === 'function'
          ? await window.SVR_CHECK_FOR_APP_UPDATE()
          : null;
        const latest = manager?.current || normalizeRelease(await fetchJson(RELEASE_URL), {});
        const due = Boolean(latest.releaseReady && latest.apkUrl && Number(latest.apkVersionCode || latest.versionCode) > readInstalledVersion());
        slide.querySelector('[data-apk-update-badge]')?.toggleAttribute('hidden', !due);
        showInlineStatus(
          slide,
          due ? `Update ${latest.apkVersionName || latest.versionName} is available.` : 'You have the current available release.',
          due ? 'ready' : 'normal'
        );
      } catch (error) {
        state.lastError = String(error?.message || error);
        showInlineStatus(slide, 'Update check is temporarily unavailable.', 'error');
      }
      publish();
    });
    state.bannerReady = true;
    queueEvent('apk_banner_impression', {
      versionName: current.versionName,
      versionCode: current.versionCode,
      releaseReady: current.releaseReady
    });
    return true;
  }

  function publish() {
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE369_APK_BANNER_STATE = { ...state };
  }

  async function boot() {
    if (state.installed) return;
    state.installed = true;
    installationId();
    ensureUpdateChecker();
    try {
      const [release, deploy] = await Promise.all([
        fetchJson(RELEASE_URL).catch(() => null),
        fetchJson(DEPLOY_URL).catch(() => null)
      ]);
      state.release = release;
      state.deploy = deploy;
      wireBanner(normalizeRelease(release || {}, deploy || {}));
    } catch (error) {
      state.lastError = String(error?.message || error);
      wireBanner(normalizeRelease());
    }
    publish();
  }

  window.SVR_PHASE369_TELEMETRY_EVENT = queueEvent;
  window.SVR_PHASE369_APK_BANNER_QA = () => ({
    ...state,
    firstSlideIsApk: document.querySelector('[data-svr-slide-deck] .svr-slide')?.classList.contains('svr-apk-slide') || false,
    downloadControl: Boolean(document.querySelector('[data-apk-download]')),
    updateControl: Boolean(document.querySelector('[data-apk-update]')),
    imagesFitFrame: Boolean(document.querySelector('link[href*="phase369-apk-banner-telemetry.css"]')),
    pass: Boolean(state.bannerReady && document.querySelector('[data-apk-download]') && document.querySelector('[data-apk-update]')),
    checkedAt: new Date().toISOString()
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
