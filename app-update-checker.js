(() => {
  const BUILD = 'PHASE-374-OPTIONAL-APK-UPDATE-LOCK';
  const DEPLOY_URL = '/update/app-version.json';
  const RELEASE_URL = '/game/phase374-release.json';
  const STORE_KEY = 'svr_app_update_state';
  const CHECK_MS = 1000 * 60 * 15;

  const readState = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } };
  const writeState = (value) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch {} };
  const fetchJson = async (url) => {
    const response = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${url}:${response.status}`);
    return response.json();
  };

  function installedVersionCode() {
    return Number(window.SVR_ANDROID_UPDATE_POLICY?.apkVersionCode || readState().installedApkVersionCode || 1);
  }

  function ensureStyle() {
    if (document.getElementById('svr374-update-style')) return;
    const style = document.createElement('style');
    style.id = 'svr374-update-style';
    style.textContent = `
      #svr374UpdateButton{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483646;border:1px solid rgba(86,255,154,.75);border-radius:999px;background:rgba(2,12,9,.9);color:#56ff9a;padding:9px 12px;font:900 10px system-ui;letter-spacing:.08em;cursor:pointer}#svr374UpdateButton[hidden]{display:none!important}
      #svr374UpdatePanel{position:fixed;right:12px;bottom:58px;z-index:2147483647;width:min(390px,calc(100vw - 24px));border:1px solid rgba(86,255,154,.65);border-radius:18px;background:rgba(3,7,14,.98);color:#fff;padding:14px;font-family:system-ui;box-shadow:0 24px 70px rgba(0,0,0,.75)}#svr374UpdatePanel[hidden]{display:none!important}.svr374-update-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.svr374-update-actions a,.svr374-update-actions button{flex:1;min-width:120px;border:1px solid rgba(127,252,255,.5);border-radius:999px;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:9px;font-weight:900}.svr374-update-actions .primary{border:0;background:linear-gradient(135deg,#56ff9a,#7ffcff);color:#02070a}
    `;
    document.head.appendChild(style);
  }

  function removeUi() {
    document.getElementById('svr374UpdateButton')?.remove();
    document.getElementById('svr374UpdatePanel')?.remove();
  }

  function showUi(current) {
    ensureStyle();
    let button = document.getElementById('svr374UpdateButton');
    if (!button) {
      button = document.createElement('button');
      button.id = 'svr374UpdateButton';
      button.type = 'button';
      button.textContent = 'OPTIONAL APK UPDATE';
      document.body.appendChild(button);
    }
    let panel = document.getElementById('svr374UpdatePanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'svr374UpdatePanel';
      panel.hidden = true;
      document.body.appendChild(panel);
    }
    panel.innerHTML = `<strong>SVR ANDROID UPDATE</strong><p>${current.message}</p><p>Version ${current.apkVersionName} • Code ${current.apkVersionCode}</p><div class="svr374-update-actions"><a class="primary" href="${current.apkUrl}" download>DOWNLOAD APK</a><a href="${current.androidUrl}">PLAY WEB VERSION</a><button type="button" data-close>CLOSE</button></div>`;
    panel.querySelector('[data-close]').onclick = () => { panel.hidden = true; };
    button.onclick = () => { panel.hidden = false; };
    button.hidden = false;
    return { button, panel };
  }

  async function check({ manual = false } = {}) {
    let deploy = {};
    let release = {};
    const errors = [];
    try { deploy = await fetchJson(DEPLOY_URL); } catch (error) { errors.push(String(error?.message || error)); }
    try { release = await fetchJson(RELEASE_URL); } catch (error) { errors.push(String(error?.message || error)); }
    const apk = release.apkPolicy || {};
    const current = {
      build: release.build || deploy.build || 'unknown',
      phase: Number(release.phase || deploy.phase || 0),
      androidUrl: release.androidEntry || deploy.androidSafeUrl || '/game/android.html?channel=stable&v=phase374',
      questUrl: release.questEntry || deploy.questUrl || '/game/index.html?platform=quest&v=phase374',
      apkVersionCode: Number(apk.versionCode || deploy.apkVersionCode || 1),
      apkVersionName: apk.versionName || deploy.apkVersionName || '0.1.0-rc1',
      apkUrl: apk.apkUrl || deploy.apkUrl || '',
      releaseReady: apk.releaseReady === true || deploy.releaseReady === true,
      forceUpdate: apk.forceUpdate === true || deploy.forceUpdate === true,
      showUpdatePrompt: apk.showUpdatePrompt === true || deploy.showUpdatePrompt === true,
      manualUpdateOnly: apk.manualUpdateOnly !== false && deploy.manualUpdateOnly !== false,
      message: deploy.message || 'The current game is delivered through the Phase 374 web runtime.'
    };
    const installed = installedVersionCode();
    const apkDue = Boolean(current.releaseReady && current.apkUrl && current.apkVersionCode > installed);
    const automaticBannerAllowed = Boolean(current.forceUpdate && current.showUpdatePrompt && !current.manualUpdateOnly);
    window.SVR_APP_UPDATE_MANAGER = {
      build: BUILD,
      active: true,
      installedApkVersionCode: installed,
      apkDue,
      automaticBannerAllowed,
      current,
      errors,
      checkedAt: new Date().toISOString()
    };
    if (apkDue) {
      const ui = showUi(current);
      if (manual || automaticBannerAllowed) ui.panel.hidden = false;
    } else removeUi();
    return window.SVR_APP_UPDATE_MANAGER;
  }

  window.SVR_CHECK_FOR_APP_UPDATE = () => check({ manual: true });
  window.SVR_SET_INSTALLED_APK_VERSION = (code, name = '') => {
    writeState({ installedApkVersionCode: Number(code || 1), installedApkVersionName: String(name || ''), updatedAt: new Date().toISOString() });
    return check();
  };
  addEventListener('load', () => setTimeout(() => check(), 900));
  setInterval(() => check().catch(() => undefined), CHECK_MS);
})();
