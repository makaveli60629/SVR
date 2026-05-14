
(function(){
  const cfg = window.SVR_SITE_CONFIG || {};
  const API_BASE = (cfg.API_BASE || '').replace(/\/$/, '');
  const localKey = 'svr_site_messages';
  function $(id){ return document.getElementById(id); }
  function setAdminOnline(online){
    document.querySelectorAll('[data-admin-pill]').forEach(el=>{
      el.classList.toggle('online', !!online);
      const label = el.querySelector('[data-admin-label]');
      if(label) label.textContent = online ? 'Admin Online' : 'Admin Offline';
    });
  }
  async function refreshAdmin(){
    if(!API_BASE){ setAdminOnline(false); return; }
    try{
      const r = await fetch(API_BASE + '/api/admin/status', {cache:'no-store'});
      const data = await r.json();
      setAdminOnline(!!data.isOnline);
    }catch(e){ setAdminOnline(false); }
  }
  function readLocal(){
    try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; }
  }
  function writeLocal(items){ localStorage.setItem(localKey, JSON.stringify(items.slice(-100))); }
  function renderLocalMessages(){
    const target = $('localMessageList');
    if(!target) return;
    const items = readLocal().slice().reverse();
    target.innerHTML = items.length ? items.map(m => `<tr><td>${esc(m.name||'Visitor')}</td><td>${esc(m.email||'')}</td><td>${esc(m.message||'')}</td><td>${esc(m.createdAt||'')}</td></tr>`).join('') : '<tr><td colspan="4">No local messages yet.</td></tr>';
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  async function submitMessage(payload){
    if(API_BASE){
      const r = await fetch(API_BASE + '/api/messages', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error('API message failed');
      return r.json();
    }
    const items = readLocal();
    items.push({...payload, createdAt:new Date().toISOString(), source:'local_safe_mode'});
    writeLocal(items); renderLocalMessages();
    return {status:'stored-local'};
  }
  document.addEventListener('submit', async (e)=>{
    const form = e.target.closest('[data-message-form]');
    if(!form) return;
    e.preventDefault();
    const status = form.querySelector('[data-form-status]');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.source = payload.source || location.pathname;
    if(status) status.textContent = 'Sending...';
    try{
      await submitMessage(payload);
      form.reset();
      if(status) status.textContent = API_BASE ? 'Message sent to SVR support.' : 'Message saved in safe local mode until backend API is connected.';
    }catch(err){ if(status) status.textContent = 'Message could not send. Check API settings.'; }
  });
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-demo-login]');
    if(!btn) return;
    const status = $('adminDemoStatus');
    if(status) status.textContent = 'Preview mode only. Real owner login activates after Azure API/JWT is connected.';
  });
  refreshAdmin(); renderLocalMessages();
})();
