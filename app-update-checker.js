(() => {
  const BUILD = 'PHASE-347-OPTIONAL-APK-UPDATE-MENU-LOCK';
  const DEPLOY_MANIFEST_URL = '/update/app-version.json';
  const RELEASE_MANIFEST_URL = '/game/android-release.json';
  const STORE_KEY = 'svr_app_update_state';
  const CHECK_MS = 1000 * 60 * 15;

  function readState(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } }
  function writeState(value){ try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch {} }
  async function fetchJson(url){
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache:'no-store', headers:{ Accept:'application/json' } });
    if(!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }
  function installedVersionCode(){
    const state = readState();
    return Number(window.SVR_ANDROID_UPDATE_POLICY?.apkVersionCode || state.installedApkVersionCode || 1);
  }
  function normalize(deploy, release){
    const d = deploy || {}, r = release || {};
    return {
      build: r.currentGameBuild || d.gameBuild || d.build || 'unknown',
      commit: d.commit || '',
      deployedAt: d.deployedAt || '',
      androidUrl: r.webEntry || d.androidSafeUrl || '/game/android.html?channel=stable',
      downloadsUrl: r.downloadsUrl || d.downloadsUrl || '/downloads/',
      packageName: r.packageName || d.packageName || 'com.svrpoker.app',
      apkVersionCode: Number(r.apkVersionCode || d.apkVersionCode || 1),
      apkVersionName: r.apkVersionName || d.apkVersionName || '0.1.0-rc1',
      apkUrl: r.apkUrl || d.apkUrl || '',
      apkSha256: r.apkSha256 || d.apkSha256 || '',
      releaseReady: r.releaseReady === true,
      forceUpdate: r.forceUpdate === true,
      showUpdatePrompt: r.showUpdatePrompt === true,
      manualUpdateOnly: r.manualUpdateOnly !== false,
      message: r.updateMessage || d.message || 'An optional SVR Poker Android update is available.'
    };
  }
  function ensureStyle(){
    if(document.getElementById('svr-app-update-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-app-update-style';
    style.textContent = `#svrApkUpdateMenu{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483646;border:1px solid rgba(141,255,180,.76);border-radius:999px;background:rgba(0,10,16,.82);color:#dffff0;padding:9px 12px;font:900 10px system-ui,Arial;letter-spacing:.08em;box-shadow:0 0 25px rgba(141,255,180,.25);backdrop-filter:blur(12px);cursor:pointer;animation:svrUpdatePulse 2.4s ease-in-out infinite}#svrApkUpdateMenu[hidden]{display:none!important}@keyframes svrUpdatePulse{50%{box-shadow:0 0 38px rgba(141,255,180,.5)}}#svrAppUpdatePanel{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(58px,calc(env(safe-area-inset-bottom) + 48px));z-index:2147483647;width:min(92vw,390px);display:grid;gap:10px;border:1px solid rgba(141,255,180,.68);border-radius:18px;background:rgba(0,5,12,.93);color:#fff;padding:14px;box-shadow:0 24px 70px rgba(0,0,0,.72);backdrop-filter:blur(16px);font-family:system-ui,Arial}#svrAppUpdatePanel strong{color:#8dffb4;font-size:13px}#svrAppUpdatePanel span{font-size:12px;color:#dffeff;line-height:1.4}.svrUpdateActions{display:flex;gap:8px;flex-wrap:wrap}.svrUpdateActions a,.svrUpdateActions button{flex:1;border:1px solid rgba(141,255,180,.56);border-radius:999px;background:rgba(141,255,180,.12);color:#effff5;text-decoration:none;text-align:center;padding:9px 10px;font:900 11px system-ui;cursor:pointer}.svrUpdateActions .primary{background:linear-gradient(135deg,#8dffb4,#7ffcff);color:#02070a;border:0}`;
    document.head.appendChild(style);
  }
  function removeUi(){
    document.getElementById('svrApkUpdateMenu')?.remove();
    document.getElementById('svrAppUpdatePanel')?.remove();
  }
  function showPanel(current){
    ensureStyle();
    document.getElementById('svrAppUpdatePanel')?.remove();
    const panel = document.createElement('div');
    panel.id = 'svrAppUpdatePanel';
    panel.innerHTML = `<strong>OPTIONAL ANDROID UPDATE</strong><span>${current.message}</span><span>Version ${current.apkVersionName} • Code ${current.apkVersionCode}</span><div class="svrUpdateActions"><a class="primary" href="${current.apkUrl}" download>Download APK</a><a href="${current.androidUrl}">Play Web Version</a><button type="button" data-close>Close</button></div>`;
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    document.body.appendChild(panel);
  }
  function showMenu(current){
    ensureStyle();
    let button = document.getElementById('svrApkUpdateMenu');
    if(!button){
      button = document.createElement('button');
      button.id = 'svrApkUpdateMenu';
      button.type = 'button';
      button.textContent = 'APP UPDATE';
      document.body.appendChild(button);
    }
    button.hidden = false;
    button.onclick = () => showPanel(current);
  }
  async function check({ manual=false } = {}){
    let deploy = null, release = null;
    try { deploy = await fetchJson(DEPLOY_MANIFEST_URL); } catch(error){ window.SVR_APP_UPDATE_DEPLOY_ERROR = String(error.message || error); }
    try { release = await fetchJson(RELEASE_MANIFEST_URL); } catch(error){ window.SVR_APP_UPDATE_RELEASE_ERROR = String(error.message || error); }
    const current = normalize(deploy, release);
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
      checkedAt: new Date().toISOString()
    };
    if(apkDue) {
      showMenu(current);
      if(manual || automaticBannerAllowed) showPanel(current);
    } else removeUi();
    return window.SVR_APP_UPDATE_MANAGER;
  }
  window.SVR_CHECK_FOR_APP_UPDATE = () => check({ manual:true });
  window.SVR_SET_INSTALLED_APK_VERSION = (code, name='') => {
    const state = readState();
    writeState({ ...state, installedApkVersionCode:Number(code || 1), installedApkVersionName:String(name || ''), updatedAt:new Date().toISOString() });
    return check({ manual:false });
  };
  window.addEventListener('load', () => setTimeout(() => check({ manual:false }), 1200));
  setInterval(() => check({ manual:false }).catch(() => undefined), CHECK_MS);
})();
