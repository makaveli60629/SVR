/* PHASE-409-PUBLIC-CONSTRUCTION-STATUS-LOCK */
(()=>{
  const BUILD='PHASE-409-PUBLIC-CONSTRUCTION-STATUS-LOCK';
  const state={build:BUILD,server:'online',database:'online',ai:'online',admin:'offline',displayMode:'configured-status-display',remoteHealthVerified:false,lastError:null,checkedAt:null};
  const $=s=>document.querySelector(s);
  function style(){if($('#phase409-public-style'))return;const el=document.createElement('style');el.id='phase409-public-style';el.textContent=`
    #admin-status{font-size:9px!important;line-height:1!important;padding:5px 8px!important;min-height:auto!important;letter-spacing:.05em!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-inline:auto!important}
    .svr409-construction{display:flex;align-items:center;justify-content:center;width:max-content;max-width:94%;margin:0 auto 5px;padding:4px 10px;border:1px solid rgba(201,156,255,.5);border-radius:999px;background:rgba(14,6,24,.78);color:#efdfff;font:900 9px/1.15 Rajdhani,system-ui;letter-spacing:.1em;text-transform:uppercase;box-shadow:0 0 18px rgba(155,77,255,.12)}
    .svr409-health{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin:6px auto 0;max-width:460px}
    .svr409-health span{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border:1px solid rgba(141,255,180,.48);border-radius:999px;background:rgba(2,17,14,.8);color:#dfffea;font:900 7px/1 system-ui;letter-spacing:.055em;white-space:nowrap}
    .svr409-health span::before{content:'●';color:#8dffb4;text-shadow:0 0 8px #8dffb4}
  `;document.head.appendChild(el)}
  function ensure(){
    style();const copy=$('.launch-copy'),eyebrow=copy?.querySelector('.eyebrow');if(!copy||!eyebrow)return false;
    $('#svr407Construction')?.remove();$('#svr407Health')?.remove();
    let construction=$('#svr409Construction');if(!construction){construction=document.createElement('div');construction.id='svr409Construction';construction.className='svr409-construction';construction.textContent='SITE UNDER CONSTRUCTION'}
    if(construction.parentElement!==copy||construction.nextElementSibling!==eyebrow)copy.insertBefore(construction,eyebrow);
    let health=$('#svr409Health');if(!health){health=document.createElement('div');health.id='svr409Health';health.className='svr409-health';health.setAttribute('aria-label','SVR service status');health.innerHTML='<span id="svr409Server">SERVER ONLINE</span><span id="svr409Database">DATABASE ONLINE</span><span id="svr409Ai">AI ONLINE</span>'}
    if(health.parentElement!==copy||health.previousElementSibling!==eyebrow)eyebrow.insertAdjacentElement('afterend',health);
    const admin=$('#admin-status');state.admin=admin?.dataset?.state||(/online/i.test(admin?.textContent||'')?'online':'offline');state.checkedAt=new Date().toISOString();window.SVR_PHASE409_PUBLIC_STATUS={...state,refresh};return true
  }
  function refresh(){try{ensure();state.lastError=null}catch(error){state.lastError=String(error?.message||error)}state.checkedAt=new Date().toISOString();window.SVR_PHASE409_PUBLIC_STATUS={...state,refresh};return state}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();setInterval(refresh,30000)},{once:true}):(()=>{refresh();setInterval(refresh,30000)})();
})();
