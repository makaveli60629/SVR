/* PHASE-407-PUBLIC-CONSTRUCTION-STATUS-LOCK */
(()=>{
  const BUILD='PHASE-407-PUBLIC-CONSTRUCTION-STATUS-LOCK',POLL_MS=30000;
  const state={build:BUILD,apiBase:'',server:'checking',database:'checking',admin:'offline',lastError:null,checkedAt:null};
  const $=s=>document.querySelector(s);
  function style(){if($('#phase407-public-style'))return;const el=document.createElement('style');el.id='phase407-public-style';el.textContent=`
    #admin-status{font-size:9px!important;line-height:1!important;padding:5px 8px!important;min-height:auto!important;letter-spacing:.05em!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-inline:auto!important}
    .svr407-construction{display:inline-flex;align-items:center;justify-content:center;margin:8px auto 4px;padding:4px 9px;border:1px solid rgba(201,156,255,.44);border-radius:999px;background:rgba(14,6,24,.72);color:#e5cfff;font:800 9px/1.15 Rajdhani,system-ui;letter-spacing:.08em;text-transform:uppercase}
    .svr407-health{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin:5px auto 3px;max-width:420px}
    .svr407-health span{display:inline-flex;align-items:center;gap:3px;padding:3px 6px;border:1px solid #ffffff25;border-radius:999px;background:rgba(2,8,18,.75);color:#9fb6c9;font:800 7px/1 system-ui;letter-spacing:.05em}
    .svr407-health span::before{content:'●';color:#8da0ad}.svr407-health span.online{border-color:#8dffb455;color:#dfffea}.svr407-health span.online::before{color:#8dffb4;text-shadow:0 0 7px #8dffb4}.svr407-health span.offline{border-color:#ff628944;color:#ffc1d0}.svr407-health span.offline::before{color:#ff6289}.svr407-health span.checking::before{color:#ffd98a}
  `;document.head.appendChild(el)}
  function ensure(){
    style();const admin=$('#admin-status');if(!admin)return false;
    if(!$('#svr407Construction'))admin.insertAdjacentHTML('afterend','<div id="svr407Construction" class="svr407-construction">Site Under Construction • Mobile Game Testing Active</div>');
    if(!$('#svr407Health'))$('#svr407Construction')?.insertAdjacentHTML('afterend','<div id="svr407Health" class="svr407-health" aria-label="SVR system health"><span id="svr407Server" class="checking">SERVER CHECKING</span><span id="svr407Database" class="checking">DATABASE CHECKING</span></div>');
    return true;
  }
  function paint(id,value,label){const el=$(id);if(!el)return;el.classList.remove('online','offline','checking');el.classList.add(value);el.textContent=`${label} ${value==='online'?'ONLINE':value==='offline'?'OFFLINE':'CHECKING'}`}
  async function resolveApiBase(){
    const local=(window.SVR_API_BASE||localStorage.getItem('SVR_API_BASE')||'').trim();if(local)return local.replace(/\/$/,'');
    try{const r=await fetch('/site/config/player-api.json?v=phase407',{cache:'no-store'});if(r.ok){const j=await r.json();const base=(j.apiBase||j.presenceApiBase||'').trim();if(base)return base.replace(/\/$/,'')}}catch{}
    return '';
  }
  function normalized(v){if(v===true)return true;if(typeof v==='string')return /online|connected|ready|ok|true/i.test(v);return false}
  async function refresh(){
    ensure();state.apiBase=await resolveApiBase();state.server='checking';state.database='checking';paint('#svr407Server','checking','SERVER');paint('#svr407Database','checking','DATABASE');
    const endpoint=state.apiBase?`${state.apiBase}/api/health`:'/api/health';
    try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2800),r=await fetch(endpoint,{cache:'no-store',credentials:'include',signal:controller.signal});clearTimeout(timer);if(!r.ok)throw new Error(`health ${r.status}`);const j=await r.json().catch(()=>({}));state.server=normalized(j.status??j.server??j.ok??true)?'online':'offline';state.database=normalized(j.database??j.db??j.sql??j.databaseStatus)?'online':'offline';state.lastError=null}catch(e){state.server='offline';state.database='offline';state.lastError=state.apiBase?String(e?.message||e):'No public API base configured yet.'}
    paint('#svr407Server',state.server,'SERVER');paint('#svr407Database',state.database,'DATABASE');state.checkedAt=new Date().toISOString();
    const admin=$('#admin-status');state.admin=admin?.dataset?.state||(/online/i.test(admin?.textContent||'')?'online':'offline');
    window.SVR_PHASE407_PUBLIC_STATUS={...state,refresh};return state
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{ensure();refresh();setInterval(refresh,POLL_MS)},{once:true}):(()=>{ensure();refresh();setInterval(refresh,POLL_MS)})();
})();
