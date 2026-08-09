(() => {
  const ADMIN_KEY='svr_admin_presence';
  const MESSAGE_KEY='svr_public_messages';
  const CACHE_EPOCH_KEY='svr_public_cache_epoch';
  const CACHE_EPOCH='phase404-android-mobile-decision-safety';
  const CURRENT_PHASE='phase404';
  const QUEST_PHASE='phase396';
  const SITE_PHASE='phase392';
  const AVATAR_PHASE='phase392';
  const ANDROID_PHASE='phase404';

  async function refreshRuntimeCaches(){
    try{
      const previousEpoch=localStorage.getItem(CACHE_EPOCH_KEY);
      if(previousEpoch!==CACHE_EPOCH){
        if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)))}
        if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(registration=>registration.unregister()))}
        localStorage.setItem(CACHE_EPOCH_KEY,CACHE_EPOCH);
      }
      if('serviceWorker'in navigator)await navigator.serviceWorker.register(`/sw.js?v=${CURRENT_PHASE}`,{scope:'/'});
    }catch(error){console.warn('SVR Phase 404 cache recovery could not complete.',error)}
  }
  function getAdminState(){const qs=new URLSearchParams(location.search),override=qs.get('admin');if(override==='online'||override==='offline'){localStorage.setItem(ADMIN_KEY,override);return override}return localStorage.getItem(ADMIN_KEY)||'offline'}
  function paintAdminState(){const current=getAdminState();document.querySelectorAll('.admin-status').forEach(element=>{element.dataset.state=current;element.classList.toggle('online',current==='online');element.classList.toggle('offline',current!=='online');element.textContent=current==='online'?'● Admin Online':'● Admin Offline'})}
  function paintPhaseBadge(){if(document.getElementById('svr-phase-live-badge'))return;const badge=document.createElement('div');badge.id='svr-phase-live-badge';badge.textContent='● PHASE 404 MOBILE SAFETY';badge.setAttribute('aria-label','SVR Poker Phase 404 Android mobile decision safety');Object.assign(badge.style,{position:'fixed',top:'12px',right:'12px',zIndex:'2147483647',padding:'7px 11px',border:'1px solid #8dffb4',borderRadius:'999px',background:'rgba(0,12,18,.92)',color:'#8dffb4',font:'800 11px/1.1 system-ui,Arial,sans-serif',letterSpacing:'.08em',boxShadow:'0 0 24px rgba(141,255,180,.2)'});document.body.appendChild(badge);document.body.dataset.deployPhase=CURRENT_PHASE}
  function normalizePublicLinks(){
    document.querySelectorAll('a[href]').forEach(anchor=>{
      let url;try{url=new URL(anchor.getAttribute('href'),location.href)}catch{return}if(url.origin!==location.origin)return;
      if(/\/game\/(?:android|android-play|android-stable|android-stable-phase402|android-stable-phase403|android-stable-phase404|android-tabletop)\.html$/i.test(url.pathname)){url.pathname='/game/android.html';url.search='';url.searchParams.set('channel','stable');url.searchParams.set('v',ANDROID_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/game\/(?:tournaments|tournament-results)\.html$/i.test(url.pathname)){url.searchParams.set('v',ANDROID_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash;return}
      if(/\/game\/(?:camera3-showcase|camera3-live|camera3|cam3|preview)\.html$/i.test(url.pathname)||url.searchParams.get('cam')==='director'){url.pathname='/game/camera3-showcase.html';url.search='';url.searchParams.set('v','phase392');url.searchParams.set('autocam','1');url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/game\/(?:index|quest)\.html$/i.test(url.pathname)){url.pathname='/game/quest.html';url.search='';url.searchParams.set('v',QUEST_PHASE);url.searchParams.set('source','public-link');anchor.href=url.pathname+'?'+url.searchParams.toString();return}
      if(/\/site\/(?:avatar|profile)\.html$/i.test(url.pathname)){url.searchParams.set('v',AVATAR_PHASE);url.searchParams.set('deploy',CURRENT_PHASE);anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash;return}
      if(/\/site\/[^/]+\.html$/i.test(url.pathname)){url.searchParams.set('v',SITE_PHASE);url.searchParams.set('deploy',CURRENT_PHASE);anchor.href=url.pathname+'?'+url.searchParams.toString()+url.hash}
    })
  }
  function wireMessageForm(){const form=document.getElementById('visitor-message-form');if(!form)return;const status=document.getElementById('visitor-message-status');form.addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form).entries()),entry={name:(data.name||'').trim(),email:(data.email||'').trim(),message:(data.message||'').trim(),createdAt:new Date().toISOString(),source:'svrpoker-public-site'};if(!entry.message){if(status)status.textContent='Please enter a message before saving.';return}const current=JSON.parse(localStorage.getItem(MESSAGE_KEY)||'[]');current.push(entry);localStorage.setItem(MESSAGE_KEY,JSON.stringify(current.slice(-100)));form.reset();if(status)status.textContent='Message saved locally. Secure API delivery is not enabled on this static page yet.'})}
  refreshRuntimeCaches();paintAdminState();paintPhaseBadge();normalizePublicLinks();wireMessageForm();
})();