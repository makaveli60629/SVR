/*
 * SVR Poker Phase 213 - Boot Diagnostic Snapshot Lock
 * Purpose: capture boot/import/cache evidence and avoid permanent Booting stalls.
 */
(function(){
  var BUILD = 'PHASE-263-MISSING-ASSET-FALLBACK-LOBBY-RENDER-LOCK';
  var startedAt = new Date().toISOString();
  var statusEl = document.getElementById('status');
  var errEl = document.getElementById('err');
  var recEl = document.getElementById('bootRecovery');
  var ready = false;
  var imported = false;
  var recoveryShown = false;
  var fallbackStarted = false;
  var mainTimer = null;

  function setStatus(text){ if (statusEl) statusEl.textContent = text; }
  function safeText(value){ return String(value == null ? '' : value).replace(/[<>]/g, '').slice(0, 3000); }
  function softReport(title, detail){
    try { window.dispatchEvent(new CustomEvent('svr_boot_guard_report', { detail: { build: BUILD, title: title, detail: safeText(detail && (detail.stack || detail.message || detail)), at: new Date().toISOString(), href: location.href } })); } catch(_) {}
  }
  function startFallback(reason, detail){
    if (ready || fallbackStarted) return;
    fallbackStarted = true;
    setStatus('Boot fallback: loading recovery shellâ€¦');
    import('./modules/boot_fallback.js?v=phase263-asset-fallback-render').then(function(){
      if (window.SVR_BOOT_FALLBACK && !ready) window.SVR_BOOT_FALLBACK.show(reason, detail);
    }).catch(function(error){
      showRecovery('Fallback shell failed. Manual reload required.', error, false);
    });
  }
  function showRecovery(title, detail, soft){
    if (ready) return;
    recoveryShown = true;
    setStatus(soft ? 'Boot guard: still loadingâ€¦' : 'Boot recovery active');
    var message = safeText(detail && (detail.stack || detail.message || detail));
    if (errEl && !soft) { errEl.style.display = 'block'; errEl.textContent = title + '\n\n' + message; }
    if (!recEl) return;
    recEl.style.cssText = ['position:fixed','left:16px','right:16px','bottom:72px','z-index:70','max-width:760px','margin:auto','display:block','padding:14px 16px','border-radius:18px','background:rgba(5,7,18,.92)','border:1px solid rgba(140,255,220,.48)','color:#eafff7','box-shadow:0 18px 54px rgba(0,0,0,.68)','font:13px/1.45 system-ui,Segoe UI,Arial,sans-serif'].join(';');
    recEl.innerHTML = '<strong>SVR Boot Guard</strong><br><span>' + safeText(title) + '</span><br><small>Build: ' + BUILD + ' â€¢ Started: ' + startedAt + '</small><br><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button data-svr-boot="reload" style="padding:8px 12px;border-radius:999px;border:1px solid #8cffdc;background:#061510;color:#eafff7;cursor:pointer">Reload Game</button><button data-svr-boot="cache" style="padding:8px 12px;border-radius:999px;border:1px solid #caa8ff;background:#120a1e;color:#fff;cursor:pointer">Reload No Cache</button><button data-svr-boot="fallback" style="padding:8px 12px;border-radius:999px;border:1px solid #8cffdc;background:#061510;color:#eafff7;cursor:pointer">Open Recovery Shell</button></div>' + (message ? '<pre style="white-space:pre-wrap;max-height:160px;overflow:auto;background:rgba(0,0,0,.35);padding:8px;border-radius:10px;margin-top:10px">' + message + '</pre>' : '');
  }
  function hideRecovery(){
    ready = true;
    if (mainTimer) clearTimeout(mainTimer);
    if (recEl) recEl.style.display = 'none';
    if (errEl) errEl.style.display = 'none';
    var fb = document.getElementById('svrBootFallback'); if (fb) fb.style.display = 'none';
  }
  window.SVR_BOOT_GUARD = { build: BUILD, startedAt: startedAt, ready: function(){return ready;}, imported: function(){return imported;}, recoveryShown: function(){return recoveryShown;}, startFallback: startFallback };
  import('./modules/boot_route_recovery.js?v=phase263-asset-fallback-render').catch(function(error){ softReport('Boot route recovery module failed.', error); });
  import('./modules/boot_route_health.js?v=phase263-asset-fallback-render').catch(function(error){ softReport('Boot route health module failed.', error); });

  document.addEventListener('click', function(event){
    var target = event.target && event.target.closest && event.target.closest('[data-svr-boot]'); if (!target) return;
    var action = target.getAttribute('data-svr-boot');
    if (action === 'reload') location.reload();
    if (action === 'cache') location.href = './index.html?v=phase263-asset-fallback-render-' + Date.now();
    if (action === 'fallback') startFallback('Manual recovery shell requested.', '');
  });
  window.addEventListener('svr_game_ready', function(event){ hideRecovery(); setStatus((event.detail && event.detail.preview) ? 'Live preview ready' : 'Ready. Enter VR.'); });
  window.addEventListener('error', function(event){ if (!ready) { softReport('Runtime error before ready signal.', event.error || event.message || event); showRecovery('Runtime error before ready signal.', event.error || event.message || event, false); startFallback('Runtime error before ready signal.', event.error || event.message || event); } });
  window.addEventListener('unhandledrejection', function(event){ if (!ready) { softReport('Promise rejection before ready signal.', event.reason || event); showRecovery('Promise rejection before ready signal.', event.reason || event, false); startFallback('Promise rejection before ready signal.', event.reason || event); } });
  setStatus('Boot guard: loading game moduleâ€¦');
  setTimeout(function(){ if (!ready) { showRecovery('Game is taking longer than expected. Recovery shell and route recovery are available.', '', true); if (window.SVR_BOOT_ROUTE_RECOVERY) window.SVR_BOOT_ROUTE_RECOVERY.collect('slow-boot'); } }, 6000);
  mainTimer = setTimeout(function(){ if (!ready) { showRecovery('Game did not send ready signal. Opening recovery shell so Booting cannot freeze.', '', false); startFallback('Main runtime timeout before ready signal.', 'Likely CDN/import/cache/runtime module issue.'); } }, 15000);
  import('./main.js?v=phase263-asset-fallback-render').then(function(){ imported = true; setStatus('Game module loaded. Building sceneâ€¦'); }).catch(function(error){ imported = false; showRecovery('Failed to import main game module. Booting screen stopped by recovery guard.', error, false); startFallback('Failed to import main game module.', error); });
})();















