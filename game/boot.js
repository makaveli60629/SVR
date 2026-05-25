/*
 * SVR Poker Phase 201 - Boot Guard Recovery Lock
 * Purpose: stop permanent Booting screen by loading main.js through a guarded dynamic import.
 * Public Matrix launch page is not touched.
 */
(function(){
  var BUILD = 'PHASE-201-BOOT-GUARD-RECOVERY-LOCK';
  var startedAt = new Date().toISOString();
  var statusEl = document.getElementById('status');
  var errEl = document.getElementById('err');
  var recEl = document.getElementById('bootRecovery');
  var ready = false;
  var imported = false;
  var recoveryShown = false;

  function setStatus(text){
    if (statusEl) statusEl.textContent = text;
  }
  function safeText(value){ return String(value == null ? '' : value).replace(/[<>]/g, '').slice(0, 3000); }
  function showRecovery(title, detail, soft){
    if (ready) return;
    recoveryShown = true;
    setStatus(soft ? 'Boot guard: still loading…' : 'Boot recovery active');
    var message = safeText(detail && (detail.stack || detail.message || detail));
    if (errEl && !soft) {
      errEl.style.display = 'block';
      errEl.textContent = title + '\n\n' + message;
    }
    if (!recEl) return;
    recEl.style.cssText = [
      'position:fixed','left:16px','right:16px','bottom:72px','z-index:70',
      'max-width:760px','margin:auto','display:block','padding:14px 16px','border-radius:18px',
      'background:rgba(5,7,18,.92)','border:1px solid rgba(140,255,220,.48)','color:#eafff7',
      'box-shadow:0 18px 54px rgba(0,0,0,.68)','font:13px/1.45 system-ui,Segoe UI,Arial,sans-serif'
    ].join(';');
    recEl.innerHTML = '<strong>SVR Boot Guard</strong><br>' +
      '<span>' + safeText(title) + '</span><br>' +
      '<small>Build: ' + BUILD + ' • Started: ' + startedAt + '</small><br>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button data-svr-boot="reload" style="padding:8px 12px;border-radius:999px;border:1px solid #8cffdc;background:#061510;color:#eafff7;cursor:pointer">Reload Game</button>' +
      '<button data-svr-boot="cache" style="padding:8px 12px;border-radius:999px;border:1px solid #caa8ff;background:#120a1e;color:#fff;cursor:pointer">Reload No Cache</button>' +
      '<a href="./preview.html?v=phase201" style="padding:8px 12px;border-radius:999px;border:1px solid #8cffdc;color:#eafff7;text-decoration:none">Preview</a>' +
      '<a href="./scorpion.html?v=phase201" style="padding:8px 12px;border-radius:999px;border:1px solid #8cffdc;color:#eafff7;text-decoration:none">Scorpion</a>' +
      '</div>' +
      (message ? '<pre style="white-space:pre-wrap;max-height:160px;overflow:auto;background:rgba(0,0,0,.35);padding:8px;border-radius:10px;margin-top:10px">' + message + '</pre>' : '');
  }
  function hideRecovery(){
    ready = true;
    if (recEl) recEl.style.display = 'none';
    if (errEl) errEl.style.display = 'none';
  }

  window.SVR_BOOT_GUARD = { build: BUILD, startedAt: startedAt, ready: function(){return ready;}, imported: function(){return imported;}, recoveryShown: function(){return recoveryShown;} };

  document.addEventListener('click', function(event){
    var target = event.target && event.target.closest && event.target.closest('[data-svr-boot]');
    if (!target) return;
    var action = target.getAttribute('data-svr-boot');
    if (action === 'reload') location.reload();
    if (action === 'cache') location.href = './index.html?v=phase201-' + Date.now();
  });

  window.addEventListener('svr_game_ready', function(event){
    hideRecovery();
    setStatus((event.detail && event.detail.preview) ? 'Live preview ready' : 'Ready. Enter VR.');
  });
  window.addEventListener('error', function(event){
    if (!ready) showRecovery('Runtime error before ready signal.', event.error || event.message || event, false);
  });
  window.addEventListener('unhandledrejection', function(event){
    if (!ready) showRecovery('Promise rejection before ready signal.', event.reason || event, false);
  });

  setStatus('Boot guard: loading game module…');

  setTimeout(function(){
    if (!ready) showRecovery('Game is taking longer than expected. Boot guard is active; wait a moment or reload without cache.', '', true);
  }, 7000);
  setTimeout(function(){
    if (!ready) showRecovery('Game did not send ready signal. This usually means a blocked CDN module, stale browser cache, or a runtime import failure.', '', false);
  }, 18000);

  import('./main.js?v=phase201').then(function(){
    imported = true;
    setStatus('Game module loaded. Building scene…');
  }).catch(function(error){
    imported = false;
    showRecovery('Failed to import main game module. Booting screen stopped by recovery guard.', error, false);
  });
})();
