// PHASE-119-QUEST-REGRESSION-BUNDLE-ADMIN-ONLINE-LOCK
// Game-side only. Turns on a visible admin-online status flag/panel for runtime testing.
// This is not backend authentication and does not grant real admin privileges.

const PHASE = 'PHASE-119-QUEST-REGRESSION-BUNDLE-ADMIN-ONLINE-LOCK';
let root;
function style(){
  if(document.getElementById('svr-admin-online-style')) return;
  const s=document.createElement('style');
  s.id='svr-admin-online-style';
  s.textContent='#svrAdminOnline{position:fixed;left:12px;top:62px;z-index:49;border:1px solid rgba(127,245,199,.52);border-radius:999px;background:rgba(3,8,14,.78);color:#7ff5c7;padding:7px 11px;font:900 11px/1 system-ui;box-shadow:0 10px 28px rgba(0,0,0,.38);pointer-events:auto}body.preview-mode #svrAdminOnline{display:none!important}';
  document.head.appendChild(s);
}
function boot(){
  window.SVR_ADMIN_ONLINE = true;
  window.SVR_ADMIN_MODE = 'online-visual-runtime-flag';
  window.SVR_PHASE119_ADMIN_ONLINE = { phase:PHASE, online:true, realBackendAuth:false, siteTouched:false };
  style();
  root=document.createElement('div');
  root.id='svrAdminOnline';
  root.textContent='ADMIN ONLINE';
  document.body.appendChild(root);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
