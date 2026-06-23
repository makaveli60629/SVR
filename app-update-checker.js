(() => {
  const BUILD = 'PHASE-154-APP-UPDATE-MANAGER-LOCK';
  const MANIFEST_URL = '/update/app-version.json';
  const HEALTH_URL = '/deploy-health.json';
  const STORE_KEY = 'svr_app_update_seen';
  const CHECK_MS = 1000 * 60 * 5;
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  function nowIso(){ return new Date().toISOString(); }
  function readSeen(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } }
  function writeSeen(data){ try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {} }
  async function fetchJson(url){
    const response = await fetch(`${url}${url.includes('?')?'&':'?'}t=${Date.now()}`, { cache:'no-store', headers:{'Accept':'application/json'} });
    if(!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }
  function normalizeManifest(manifest, health){
    const h = health || {};
    const m = manifest || {};
    return {
      build: m.build || h.build || 'unknown',
      commit: m.commit || h.commit || '',
      deployedAt: m.deployedAt || h.deployedAt || '',
      gameBuild: m.gameBuild || m.build || h.build || '',
      gameUrl: m.gameUrl || '/game/index.html',
      androidSafeUrl: m.androidSafeUrl || '/game/android.html',
      downloadsUrl: m.downloadsUrl || '/downloads/?install=1',
      apkVersionCode: Number(m.apkVersionCode || 0),
      apkVersionName: m.apkVersionName || '',
      apkUrl: m.apkUrl || '',
      apkSha256: m.apkSha256 || '',
      packageName: m.packageName || 'com.svrpoker.app',
      required: Boolean(m.required || false),
      message: m.message || 'A new SVR update is available.'
    };
  }
  function isNewer(current, seen){
    if(!seen || !seen.commit) return false;
    if(current.commit && seen.commit && current.commit !== seen.commit) return true;
    if(current.build && seen.build && current.build !== seen.build) return true;
    if(current.deployedAt && seen.deployedAt && Date.parse(current.deployedAt) > Date.parse(seen.deployedAt)) return true;
    return false;
  }
  function ensureStyle(){
    if(document.getElementById('svr-app-update-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-app-update-style';
    style.textContent = `
      #svrAppUpdateBanner{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483647;width:min(94vw,720px);display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid rgba(141,255,180,.66);border-radius:18px;background:rgba(0,0,0,.84);box-shadow:0 0 34px rgba(141,255,180,.22),0 24px 80px rgba(0,0,0,.72);backdrop-filter:blur(14px);padding:12px 14px;color:#fff;font-family:system-ui,Arial,sans-serif}.svr-update-copy{display:grid;gap:3px}.svr-update-copy strong{font-size:13px;color:#8dffb4;letter-spacing:.06em;text-transform:uppercase}.svr-update-copy span{font-size:12px;color:#eaffff}.svr-update-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.svr-update-actions button,.svr-update-actions a{border:1px solid rgba(141,255,180,.56);border-radius:999px;background:rgba(141,255,180,.12);color:#eafff1;text-decoration:none;font:900 11px system-ui,Arial;padding:8px 10px;cursor:pointer}.svr-update-actions .primary{background:linear-gradient(135deg,rgba(141,255,180,.96),rgba(127,252,255,.84));color:#02070a}.svr-update-actions .danger{border-color:rgba(255,91,140,.58);color:#ffdbe7;background:rgba(255,91,140,.13)}@media(max-width:640px){#svrAppUpdateBanner{grid-template-columns:1fr;bottom:8px}.svr-update-actions{justify-content:stretch}.svr-update-actions button,.svr-update-actions a{flex:1;text-align:center}}
    `;
    document.head.appendChild(style);
  }
  async function refreshServiceWorker(){
    try{
      if('serviceWorker' in navigator){
        const reg = await navigator.serviceWorker.getRegistration('/');
        await reg?.update?.();
        if(reg?.waiting) reg.waiting.postMessage?.({ type:'SKIP_WAITING' });
      }
    }catch{}
  }
  async function clearAppCaches(){
    try{
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => /svr-poker|svr/i.test(k)).map(k => caches.delete(k)));
      }
    }catch{}
  }
  function showBanner(current){
    ensureStyle();
    document.getElementById('svrAppUpdateBanner')?.remove();
    const banner = document.createElement('div');
    banner.id = 'svrAppUpdateBanner';
    const shortCommit = current.commit ? current.commit.slice(0,7) : 'latest';
    banner.innerHTML = `
      <div class="svr-update-copy"><strong>${current.required ? 'SVR update required' : 'SVR update available'}</strong><span>${current.message}</span><span>Build: ${current.build || 'latest'} • Commit: ${shortCommit}</span></div>
      <div class="svr-update-actions"><button class="primary" type="button" data-svr-update-reload>Update Now</button><a href="${current.androidSafeUrl}?v=${encodeURIComponent(current.commit || Date.now())}">Android Safe</a><a href="${current.downloadsUrl}">Downloads</a>${current.apkUrl ? `<a href="${current.apkUrl}">APK</a>` : ''}<button class="danger" type="button" data-svr-update-dismiss>Later</button></div>
    `;
    banner.querySelector('[data-svr-update-reload]')?.addEventListener('click', async () => {
      writeSeen({ build: current.build, commit: current.commit, deployedAt: current.deployedAt, updatedAt: nowIso() });
      await refreshServiceWorker();
      await clearAppCaches();
      location.reload();
    });
    banner.querySelector('[data-svr-update-dismiss]')?.addEventListener('click', () => {
      writeSeen({ build: current.build, commit: current.commit, deployedAt: current.deployedAt, dismissedAt: nowIso() });
      banner.remove();
    });
    document.body.appendChild(banner);
  }
  async function check({ quiet=false } = {}){
    let manifest = null;
    let health = null;
    try { manifest = await fetchJson(MANIFEST_URL); } catch(error){ window.SVR_APP_UPDATE_LAST_MANIFEST_ERROR = String(error.message || error); }
    try { health = await fetchJson(HEALTH_URL); } catch(error){ window.SVR_APP_UPDATE_LAST_HEALTH_ERROR = String(error.message || error); }
    const current = normalizeManifest(manifest, health);
    const seen = readSeen();
    if(!seen.commit && current.commit){ writeSeen({ build: current.build, commit: current.commit, deployedAt: current.deployedAt, firstSeenAt: nowIso() }); }
    const updateAvailable = isNewer(current, seen);
    window.SVR_APP_UPDATE_MANAGER = { build: BUILD, active:true, standalone:isStandalone, updateAvailable, current, seen, manifestUrl:MANIFEST_URL, healthUrl:HEALTH_URL, checkedAt:nowIso() };
    if(updateAvailable && !quiet) showBanner(current);
    return window.SVR_APP_UPDATE_MANAGER;
  }
  window.SVR_CHECK_FOR_APP_UPDATE = () => check({ quiet:false });
  window.addEventListener('load', () => setTimeout(() => check({ quiet:false }), 1200));
  setInterval(() => check({ quiet:true }).then((state)=>{ if(state.updateAvailable) showBanner(state.current); }).catch(()=>{}), CHECK_MS);
})();
