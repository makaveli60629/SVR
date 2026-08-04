// SVR Phase 175 internal site/backend hooks. Public Matrix page is not touched.
(function(){
  const API_BASE = window.SVR_API_BASE || localStorage.getItem('SVR_API_BASE') || '';
  const phase = 'PHASE-175-CLEAN-RUNTIME-POKER-DB-LOCK';
  async function api(path, options={}){
    if(!API_BASE) return { ok:false, offline:true, message:'API base not configured', phase };
    const res = await fetch(API_BASE + path, { headers: { 'Content-Type':'application/json', ...(options.headers||{}) }, ...options });
    const data = await res.json().catch(()=>({}));
    return { ok:res.ok, status:res.status, ...data };
  }
  window.SVRPhase175 = { phase, api, health:()=>api('/api/health'), adminStatus:()=>api('/api/admin/status') };
  document.addEventListener('DOMContentLoaded', async()=>{
    const nodes = document.querySelectorAll('[data-svr-admin-status]');
    if(!nodes.length) return;
    const status = await window.SVRPhase175.adminStatus();
    nodes.forEach(n=>{ n.textContent = status.online ? '● Admin Online' : '● Admin Offline'; n.classList.toggle('online', !!status.online); });
  });
})();
