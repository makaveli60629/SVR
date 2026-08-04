(() => {
  async function refreshAdminStatus(){
    try{
      const data = await window.SVRApi.get('/api/admin/status');
      document.querySelectorAll('[data-admin-status]').forEach(el => {
        el.textContent = data.online ? '● Admin Online' : '● Admin Offline';
        el.classList.toggle('online', !!data.online);
      });
    }catch(_err){
      document.querySelectorAll('[data-admin-status]').forEach(el => el.textContent = '● Admin Offline');
    }
  }
  async function submitMessage(form){
    const payload = Object.fromEntries(new FormData(form).entries());
    const result = await window.SVRApi.post('/api/messages', payload);
    form.querySelector('[data-message-result]')?.replaceChildren(document.createTextNode(result.ok ? 'Message saved.' : 'Message failed.'));
  }
  window.SVRBackendHooks = { refreshAdminStatus, submitMessage };
  document.addEventListener('DOMContentLoaded', () => {
    refreshAdminStatus();
    setInterval(refreshAdminStatus, 60000);
    document.querySelectorAll('[data-svr-message-form]').forEach(form => form.addEventListener('submit', e => { e.preventDefault(); submitMessage(form); }));
  });
})();
