// PHASE-229-POWER-DEPLOY-WATCHER-LOCK
// Runtime helper: documents the hardened one-command phase apply path.
(function(){
  const state = {
    build: "PHASE-229-POWER-DEPLOY-WATCHER-LOCK",
    phase: 216,
    shortcut: "I",
    command: 'powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT.ps1"',
    packetPattern: 'SVR_PHASE*_NEXT_PACKET.zip',
    publicPageTouched: false,
    note: "Hardened updater chooses the highest phase packet in Downloads, expands it, applies it, commits, and pushes."
  };
  function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  window.SVR_AUTO_APPLY_HELPER = {
    state,
    show(){
      let panel = document.getElementById('svr-auto-apply-helper');
      if(!panel){
        panel = document.createElement('div');
        panel.id = 'svr-auto-apply-helper';
        panel.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;max-width:460px;background:rgba(0,0,0,.9);color:#eaffff;border:1px solid rgba(120,255,220,.45);border-radius:14px;padding:14px;font:12px/1.45 system-ui,Segoe UI,Arial;box-shadow:0 16px 48px rgba(0,0,0,.6)';
        document.body.appendChild(panel);
      }
      panel.innerHTML = '<b>SVR Auto Apply Helper</b><br>Build: ' + esc(state.build) +
        '<br><br><b>One command:</b><br><code>' + esc(state.command) + '</code>' +
        '<br><br><b>Packet:</b> newest/highest <code>' + esc(state.packetPattern) + '</code> in Downloads' +
        '<br><b>Public Matrix page:</b> untouched' +
        '<br><br><button id="svr-auto-apply-close" style="border:1px solid #78ffdc;background:#071;color:#fff;border-radius:999px;padding:6px 10px">Close</button>';
      panel.querySelector('#svr-auto-apply-close').onclick = () => this.hide();
      panel.style.display = 'block';
    },
    hide(){ const p=document.getElementById('svr-auto-apply-helper'); if(p) p.style.display='none'; }
  };
  window.addEventListener('keydown', (e)=>{ if((e.key||'').toLowerCase()==='i') window.SVR_AUTO_APPLY_HELPER.show(); });
  window.dispatchEvent(new CustomEvent('svr_auto_apply_helper_ready', {detail: state}));
})();
