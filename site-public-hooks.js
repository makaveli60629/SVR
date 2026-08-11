(() => {
  const ADMIN_KEY='svr_admin_presence';
  const MESSAGE_KEY='svr_public_messages';
  const CACHE_EPOCH_KEY='svr_public_cache_epoch';
  const CACHE_EPOCH='phase409-public-status-player-turn-fit';
  const CURRENT_PHASE='phase409';
  const QUEST_PHASE='phase396';
  const SITE_PHASE='phase392';
  const AVATAR_PHASE='phase392';
  const ANDROID_PHASE='phase409';

  async function refreshRuntimeCaches(){
    try{
      const previousEpoch=localStorage.getItem(CACHE_EPOCH_KEY);
      if(previousEpoch!==CACHE_EPOCH){
        if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)))}
        if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(registration=>registration.unregister()))}
        localStorage.setItem(CACHE_EPOCH_KEY,CACHE_EPOCH);
      }
      if('serviceWorker'in navigator)await navigator.serviceWorker.register(`/sw.js?v=${CURRENT_PHASE}`,{scope:'/'});
    }catch(error){console.warn('SVR Phase 409 cache recovery could not complete.',error)}
  }
  function getAdminState(){const qs=new URLSearchParams(location.search),override=qs.get('admin');if(override==='online'||override==='offline'){localStorage.setItem(ADMIN_KEY,override);return override}return localStorage.getItem(ADMIN_KEY)||'offline'}
  function paintAdminState(){const current=getAdminState();document.querySelectorAll('.admin-status').forEach(element=>{element.dataset.state=current;element.classList.toggle('online',current==='online');element.classList.toggle('offline',current!=='online');element.textContent=current==='online'?'● Admin Online':'● Admin Offline'})}
  function paintPhaseBadge(){if(document.getElementById('svr-phase-live-badge'))return;const badge=document.createElement('div');badge.id='svr-phase-live-badge';badge.textContent='● PHASE 409 PUBLIC / PLAYER TURN';badge.setAttribute('aria-label','SVR Poker Phase 409 public status and mobile player-turn test');Object.assign(badge.style,{position:'fixed',top:'12px',right:'12px',zIndex:'2147483647',padding:'7px 11px',border:'1px solid #8dffb4',borderRadius:'999px',background:'rgba(0,12,18,.92)',color:'#8dffb4',font:'800 11px/1.1 system-ui,Arial,sans-serif',letterSpacing:'.08em',boxShadow:'0 0 24px rgba(141,255,180,.2)'});document.body.appendChild(badge);document.body.dataset.deployPhase=CURRENT_PHASE}
  function ensurePlatformDetector(){if(window.SVR_PLATFORM_DEVICE||document.querySelector('script[data-svr-platform]'))return;const script=document.createElement('script');script.src='/platform-device.js?v=phase409';script.dataset.svrPlatform='1';document.head.appendChild(script)}
  function ensurePhase409PublicStatus(){if(document.querySelector('script[data-phase409-public-status]'))return;const script=document.createElement('script');script.src='/phase409-public-status.js?v=phase409';script.dataset.phase409PublicStatus='1';document.body.appendChild(script)}
  function fallbackDevice(){const ua=navigator.userAgent||'',ipad=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1,quest=/Quest|Oculus|OculusBrowser|Meta Quest/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua)||ipad,android=/Android/i.test(ua)&&!quest;return{quest,ios,android,device:quest?'quest':ios?'ios':android?'android':'desktop',browser:/OculusBrowser/i.test(ua)?'oculus':/SamsungBrowser/i.test(ua)?'samsung':/Safari/i.test(ua)&&!/Chrome|CriOS/i.test(ua)?'safari':'other'}}
  function launchDevice(){return window.SVR_PLATFORM_DEVICE||fallbackDevice()}
  function applyPlatformLaunch(){
    const button=document.getElementById('platformGameButton'),notice=document.getElementById('platformNotice');if(!button||!notice)return;const d=launchDevice();
    if(!document.getElementById('phase409-device-label-style')){const style=document.createElement('style');style.id='phase409-device-label-style';style.textContent='#platformGameButton{flex-direction:column;gap:2px}#platformGameButton .svr-test-ready{display:block;font:800 8px/1.15 Rajdhani,system-ui;letter-spacing:.08em;opacity:.82}.svr-platform-quest .launch-page,.quest-browser .launch-page{max-width:min(760px,calc(100vw - 28px))}.svr-platform-quest .platform-note,.quest-browser .platform-note{max-width:min(630px,88vw)}';document.head.appendChild(style)}
    if(d.quest){button.textContent='Enter VR';button.href='./game/quest.html?v=phase396&source=launch-device';notice.innerHTML='<strong>Quest / Oculus detected:</strong> opening the dedicated seated VR test. This is the VR route.'}
    else if(d.ios){button.innerHTML='Play iPhone<span class="svr-test-ready">IPHONE GAME • NOT VR • TEST READY</span>';button.href='./game/iphone.html?v=phase409&source=launch-device';notice.innerHTML='<strong>iPhone / iPad detected:</strong> Phase 409 phone/tablet game • compact player boxes • protected player-turn guard • hand helper • profiles • tournament board and mic tools. For VR, have your Quest/Oculus headset ready.'}
    else if(d.android){button.innerHTML='Play Android<span class="svr-test-ready">ANDROID GAME • NOT VR • APP TEST READY</span>';button.href='./game/android.html?channel=stable&v=phase409&source=launch-device';notice.innerHTML='<strong>Android detected:</strong> Phase 409 phone/tablet game • protected poker engine • Darius-to-player turn guard • compact player boxes • one burn pile • Android APK RC2 remains available from the game menu. For virtual reality, have your Quest/Oculus headset ready.'}
    else{button.textContent='Preview Game';button.href='./game/camera3-showcase.html?v=phase392&source=launch-device';notice.innerHTML='<strong>Desktop preview:</strong> table showcase. Android and iPhone/iPad use the phone/tablet game; Quest/Oculus uses the dedicated VR route.'}
  }
  function normalizePublicLinks(){
    document.querySelectorAll('a[href]').forEach(anchor=>{
      let url;try{url=new URL(anchor.getAttribute('href'),location.href)}catch{return}if(url.origin!==location.origin)return;
      if(/\/game\/(?:android|android-play|android-stable|android-stable-phase402|android-stable-phase403|android-stable-phase404|android-stable-phase405|android-tabletop)\.html$/i.test(url.pathname)){url.pathname='/game/android.html';url.search='';url.searchParams.set('channel','stable');url.searchParams.set('v',ANDROID_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/game\/iphone(?:-tabletop)?\.html$/i.test(url.pathname)){url.searchParams.set('v',CURRENT_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash;return}
      if(/\/game\/(?:tournaments|tournament-results)\.html$/i.test(url.pathname)){url.searchParams.set('v',ANDROID_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash;return}
      if(/\/game\/(?:camera3-showcase|camera3-live|camera3|cam3|preview)\.html$/i.test(url.pathname)||url.searchParams.get('cam')==='director'){url.pathname='/game/camera3-showcase.html';url.search='';url.searchParams.set('v','phase392');url.searchParams.set('autocam','1');url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/game\/(?:index|quest)\.html$/i.test(url.pathname)){url.pathname='/game/quest.html';url.search='';url.searchParams.set('v',QUEST_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/site\/(?:avatar|profile)\.html$/i.test(url.pathname)){url.searchParams.set('v',AVATAR_PHASE);url.searchParams.set('deploy',CURRENT_PHASE);anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash;return}
      if(/\/site\/[^/]+\.html$/i.test(url.pathname)){url.searchParams.set('v',SITE_PHASE);url.searchParams.set('deploy',CURRENT_PHASE);anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash}
    })
  }
  function wireMessageForm(){const form=document.getElementById('visitor-message-form');if(!form)return;const status=document.getElementById('visitor-message-status');form.addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form).entries()),entry={name:(data.name||'').trim(),email:(data.email||'').trim(),message:(data.message||'').trim(),createdAt:new Date().toISOString(),source:'svrpoker-public-site'};if(!entry.message){if(status)status.textContent='Please enter a message before saving.';return}const current=JSON.parse(localStorage.getItem(MESSAGE_KEY)||'[]');current.push(entry);localStorage.setItem(MESSAGE_KEY,JSON.stringify(current.slice(-100)));form.reset();if(status)status.textContent='Message saved locally. Secure API delivery is not enabled on this static page yet.'})}
  function profilePortrait(){if(!/\/site\/profile\.html$/i.test(location.pathname)||document.querySelector('script[data-phase405-portrait]'))return;const s=document.createElement('script');s.type='module';s.src='/site/js/phase405-profile-portrait.js?v=phase409';s.dataset.phase405Portrait='1';document.body.appendChild(s)}
  refreshRuntimeCaches();ensurePlatformDetector();paintAdminState();paintPhaseBadge();normalizePublicLinks();wireMessageForm();profilePortrait();ensurePhase409PublicStatus();
  window.addEventListener('svr:platform-device',applyPlatformLaunch);requestAnimationFrame(()=>setTimeout(applyPlatformLaunch,0));setTimeout(applyPlatformLaunch,350);setTimeout(normalizePublicLinks,400);
})();