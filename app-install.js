(() => {
  const BUILD = 'PHASE-110-MODULAR-SVR-APP-DOWNLOAD-MANAGER';
  if (window.SVR_APP_DOWNLOAD_MANAGER_LOADED) return;
  window.SVR_APP_DOWNLOAD_MANAGER_LOADED = true;

  const ROUTES = {
    downloads: '/downloads/',
    siteApp: '/site/app.html?install=1',
    siteHome: '/site/index.html?source=app-download',
    game: '/game/index.html?source=app-download',
    store: '/site/store.html?source=app-download',
    support: '/site/contact.html?source=app-download'
  };
  const APK_CANDIDATES = ['/downloads/svr-poker.apk', '/android/svr-poker.apk', '/update/svr-poker.apk'];
  let deferredPrompt = null;
  let installReady = false;
  let discoveredApk = null;

  function appRoot(path = '/') { return new URL(path, window.location.origin).toString(); }
  function platformName(){const ua=navigator.userAgent||'';if(/iPhone|iPad|iPod/i.test(ua))return'ios';if(/Android/i.test(ua))return'android';if(/Quest|Oculus/i.test(ua))return'quest';return'desktop';}
  function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;}
  function setStatus(message){const el=document.getElementById('svrAppInstallStatus')||document.querySelector('[data-svr-download-status]');if(el)el.textContent=message;window.SVR_APP_DOWNLOAD_STATUS={build:BUILD,message,checkedAt:new Date().toISOString()};}

  function ensureHeadLinks(){
    if(!document.querySelector('link[rel="manifest"]')){const manifest=document.createElement('link');manifest.rel='manifest';manifest.href=appRoot('/manifest.webmanifest?v=phase110-download');document.head.appendChild(manifest);}
    if(!document.querySelector('meta[name="theme-color"]')){const theme=document.createElement('meta');theme.name='theme-color';theme.content='#9b4dff';document.head.appendChild(theme);}
    if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){const apple=document.createElement('meta');apple.name='apple-mobile-web-app-capable';apple.content='yes';document.head.appendChild(apple);}
    if(!document.querySelector('meta[name="apple-mobile-web-app-title"]')){const title=document.createElement('meta');title.name='apple-mobile-web-app-title';title.content='SVR Poker';document.head.appendChild(title);}
    if(!document.querySelector('link[rel="apple-touch-icon"]')){const icon=document.createElement('link');icon.rel='apple-touch-icon';icon.href=appRoot('/logo.png');document.head.appendChild(icon);}
  }

  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator))return {ok:false,reason:'service-worker-unavailable'};
    if(!/^https:$/i.test(location.protocol)&&location.hostname!=='localhost')return {ok:false,reason:'https-required'};
    for(const path of ['/pwa-sw.js','/sw.js']){
      try{const registration=await navigator.serviceWorker.register(appRoot(path),{scope:'/'});window.SVR_PWA_SERVICE_WORKER={ok:true,script:path,scope:registration.scope,build:BUILD,checkedAt:new Date().toISOString()};return {ok:true,registration,path};}
      catch(error){window.SVR_PWA_SERVICE_WORKER={ok:false,script:path,error:String(error&&error.message||error),build:BUILD,checkedAt:new Date().toISOString()};}
    }
    return {ok:false,reason:'registration-failed'};
  }

  function ensureInstallStyles(){
    if(document.getElementById('svr-app-download-style'))return;
    const style=document.createElement('style');
    style.id='svr-app-download-style';
    style.textContent=`
      [data-svr-install-app],[data-svr-app-install],[data-svr-download-app]{cursor:pointer}
      .svr-install-modal{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(12px);font-family:Rajdhani,system-ui,Arial;color:#fff}
      .svr-install-card{width:min(620px,calc(100vw - 28px));border:1px solid rgba(141,255,180,.52);border-radius:26px;background:radial-gradient(circle at 18% 0%,rgba(141,255,180,.16),transparent 34%),rgba(4,5,16,.98);box-shadow:0 30px 110px rgba(0,0,0,.88),0 0 38px rgba(141,255,180,.14);padding:22px;text-align:left}
      .svr-install-card h2{margin:0 0 8px;font-family:Orbitron,system-ui,Arial;letter-spacing:.06em;color:#8dffb4;text-transform:uppercase;font-size:1.16rem}.svr-install-card p{margin:8px 0;color:#e7dcff;line-height:1.45}.svr-install-card ol{margin:12px 0 0;padding-left:20px;color:#fff}.svr-install-card li{margin:6px 0}.svr-install-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.svr-install-actions button,.svr-install-actions a{display:inline-flex;align-items:center;justify-content:center;min-width:140px;padding:11px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-weight:900;cursor:pointer}.svr-install-actions .primary{background:linear-gradient(135deg,#8dffb4,#7ffcff);color:#03040b}.svr-download-row{display:grid;gap:8px;margin-top:12px}.svr-download-pill{border:1px solid rgba(141,255,180,.24);border-radius:14px;background:rgba(141,255,180,.07);padding:9px 10px;color:#dfffe9;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function modalCopy(){
    const p=platformName();
    if(p==='ios')return{title:'Install SVR Poker on iPhone',body:'Use Safari to add SVR Poker to the Home Screen.',steps:['Open this page in Safari.','Tap Share.','Choose Add to Home Screen.','Tap Add.']};
    if(p==='quest')return{title:'SVR Quest / VR Launcher',body:'Use this app route as the launcher, then open the VR room in a WebXR browser.',steps:['Tap Launch VR Room.','Use the WebXR browser.','Press Enter VR inside the game.','Use AI Support to report any issue.']};
    if(p==='android')return{title:'Install SVR Poker on Android',body:'Use Chrome or a compatible Android browser. If the install prompt does not open, use the browser menu.',steps:['Tap Install Site App.','If no prompt appears, tap the browser menu.','Choose Install app or Add to Home screen.','Open SVR Poker from your device apps.']};
    return{title:'Install SVR Poker',body:'Use the browser install prompt or install icon to save SVR Poker as an app.',steps:['Tap Install Site App.','Accept the browser install prompt if shown.','Use Open Downloads for all app launch options.']};
  }

  function showInstallModal(message=''){
    ensureInstallStyles();
    document.querySelector('.svr-install-modal')?.remove();
    const copy=modalCopy();
    const apkLine=discoveredApk?`<a class="primary" href="${discoveredApk}" download>Download Android APK</a>`:'<span class="svr-download-pill">Android APK slot: ready, file not published yet</span>';
    const modal=document.createElement('div');
    modal.className='svr-install-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML=`<section class="svr-install-card"><h2>${copy.title}</h2><p>${message||copy.body}</p><ol>${copy.steps.map(step=>`<li>${step}</li>`).join('')}</ol><div class="svr-download-row"><span class="svr-download-pill">Site app: PWA install route active</span><span class="svr-download-pill">Game launcher: ready</span>${apkLine}</div><div class="svr-install-actions"><button class="primary" type="button" data-svr-run-install>Install Site App</button><a href="${ROUTES.downloads}">Open Downloads</a><a href="${ROUTES.game}">Launch VR Room</a><button type="button" data-close-install>Close</button></div></section>`;
    modal.addEventListener('click',(event)=>{if(event.target===modal||event.target.closest('[data-close-install]'))modal.remove();if(event.target.closest('[data-svr-run-install]')){installApp(event,true);}});
    document.body.appendChild(modal);
  }

  async function discoverApk(){
    for(const path of APK_CANDIDATES){
      try{const response=await fetch(path,{method:'HEAD',cache:'no-store'});if(response.ok){discoveredApk=path;break;}}
      catch{}
    }
    window.SVR_ANDROID_APK_DISCOVERY={build:BUILD,apkPath:discoveredApk,checkedAt:new Date().toISOString()};
    return discoveredApk;
  }

  async function installApp(event,forcePrompt=false){
    if(event)event.preventDefault();
    if(isStandalone()){showInstallModal('SVR Poker already appears to be running as an installed app.');return;}
    if(deferredPrompt){const promptEvent=deferredPrompt;deferredPrompt=null;promptEvent.prompt();const result=await promptEvent.userChoice.catch(()=>({outcome:'unknown'}));window.SVR_APP_INSTALL_RESULT={outcome:result.outcome,build:BUILD,checkedAt:new Date().toISOString()};refreshButtons();setStatus(result.outcome==='accepted'?'Install started.':'Install was dismissed. Use browser menu or Open Downloads.');return;}
    if(forcePrompt||location.pathname.startsWith('/downloads')||location.pathname.startsWith('/site/app')){showInstallModal();setStatus('Install instructions opened. Use the browser menu if no native prompt appears.');return;}
    location.href=ROUTES.downloads+'?install=1&source=site';
  }

  function refreshButtons(){
    const installed=isStandalone();
    document.querySelectorAll('[data-svr-install-app],[data-svr-app-install],[data-svr-download-app]').forEach(btn=>{if(installed)btn.textContent='App Installed';else if(installReady)btn.textContent='Install App';else if(btn.dataset.svrDownloadApp==='apk')btn.textContent='Android APK';else btn.textContent='Download App';btn.title=installed?'SVR Poker is already installed':'Open SVR download and install options';});
  }

  function wireButtons(){
    document.querySelectorAll('[data-svr-install-app],[data-svr-app-install],[data-svr-download-app]').forEach(btn=>{if(btn.dataset.svrInstallWired==='1')return;btn.dataset.svrInstallWired='1';btn.addEventListener('click',installApp);});
    refreshButtons();
  }

  window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();deferredPrompt=event;installReady=true;refreshButtons();setStatus('Install prompt is ready. Press Install App.');});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;installReady=false;window.SVR_APP_INSTALLED={ok:true,build:BUILD,installedAt:new Date().toISOString()};refreshButtons();setStatus('SVR Poker app installed.');});

  async function boot(){ensureHeadLinks();ensureInstallStyles();await registerServiceWorker();await discoverApk();wireButtons();setTimeout(wireButtons,750);setTimeout(wireButtons,1800);if(new URLSearchParams(location.search).has('install'))setTimeout(()=>showInstallModal(),400);window.SVR_APP_DOWNLOAD_MANAGER={build:BUILD,active:true,modular:true,siteReady:true,gameReady:true,standalone:isStandalone(),platform:platformName(),apkPath:discoveredApk,checkedAt:new Date().toISOString()};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
