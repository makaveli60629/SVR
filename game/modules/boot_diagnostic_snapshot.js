
/* SVR Phase 213 - Boot Diagnostic Snapshot Lock */
(function(){
  const BUILD = "PHASE-226-PILOT-READY-SUMMARY-LOCK";
  const MAX_ERRORS = 40;
  const state = {
    build: BUILD,
    startedAt: new Date().toISOString(),
    visible: false,
    snapshots: [],
    errors: []
  };
  function clean(value){
    try { return JSON.parse(JSON.stringify(value, function(k,v){
      if (typeof v === 'function') return '[function]';
      if (v instanceof Error) return { name:v.name, message:v.message, stack:String(v.stack||'').slice(0,2000) };
      return v;
    })); } catch(_) { return String(value); }
  }
  function text(sel){ const el = document.querySelector(sel); return el ? String(el.textContent || '').trim() : ''; }
  function scriptSrcs(){ return Array.from(document.scripts || []).map(s => s.src || '[inline]').filter(Boolean); }
  function modulePresence(){
    return {
      bootGuard: !!window.SVR_BOOT_GUARD,
      bootFallback: !!window.SVR_BOOT_FALLBACK,
      markerHealth: !!window.SVR_MARKER_HEALTH,
      bootCacheWatchdog: !!window.SVR_BOOT_CACHE_WATCHDOG,
      runtimeCrashShield: !!window.SVR_RUNTIME_CRASH_SHIELD,
      safeEventBus: !!window.SVR_SAFE_EVENT_BUS,
      bridgeProxy: !!window.SVR_BRIDGE_PROXY,
      bridgeSelftest: !!window.SVR_BRIDGE_SELFTEST,
      enterpriseBridge: !!(window.SVR_ENTERPRISE_BRIDGE || window.SVR_ENTERPRISE),
      deployVerifier: !!window.SVR_DEPLOY_VERIFIER,
      smokeTest: !!window.SVR_SMOKE_TEST,
      sessionExport: !!window.SVR_SESSION_EXPORT
    };
  }
  async function fetchJson(url){
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'diag=' + Date.now(), { cache:'no-store' });
      const raw = await res.text();
      let body = raw;
      try { body = JSON.parse(raw); } catch(_) {}
      return { ok: res.ok, status: res.status, body };
    } catch(error){
      return { ok:false, error: clean(error) };
    }
  }
  async function snapshot(reason='manual'){
    const snap = {
      build: BUILD,
      reason,
      at: new Date().toISOString(),
      href: location.href,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      title: document.title,
      statusText: text('#status'),
      hudBuild: text('#hud .pill:last-child'),
      modeText: text('#mode'),
      scriptSrcs: scriptSrcs(),
      bootGuard: window.SVR_BOOT_GUARD ? {
        ready: safeCall(()=>window.SVR_BOOT_GUARD.ready()),
        imported: safeCall(()=>window.SVR_BOOT_GUARD.imported()),
        recoveryShown: safeCall(()=>window.SVR_BOOT_GUARD.recoveryShown())
      } : null,
      markerHealth: window.SVR_MARKER_HEALTH ? safeCall(()=>window.SVR_MARKER_HEALTH.run()) : null,
      modulePresence: modulePresence(),
      recentErrors: state.errors.slice(-12)
    };
    snap.versionJson = await fetchJson('./version.json');
    snap.deployHealth = await fetchJson('./deploy-health.json');
    snap.rootDeployHealth = await fetchJson('../deploy-health.json');
    state.snapshots.push(snap);
    if (state.snapshots.length > 20) state.snapshots.shift();
    window.dispatchEvent(new CustomEvent('svr_boot_diagnostic_snapshot', { detail: snap }));
    render(snap);
    return snap;
  }
  function safeCall(fn){ try { return clean(fn()); } catch(error){ return { error: clean(error) }; } }
  function ensurePanel(){
    let el = document.getElementById('svrBootDiagnosticPanel');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'svrBootDiagnosticPanel';
    el.style.cssText = 'position:fixed;right:14px;top:74px;z-index:90;width:min(520px,calc(100vw - 28px));max-height:72vh;overflow:auto;background:rgba(4,6,18,.94);border:1px solid rgba(140,255,220,.48);border-radius:18px;color:#eafff7;padding:14px 16px;box-shadow:0 20px 70px rgba(0,0,0,.65);font:12px/1.42 ui-monospace,SFMono-Regular,Consolas,monospace;display:none';
    document.body.appendChild(el);
    return el;
  }
  function render(snap){
    const el = ensurePanel();
    el.style.display = state.visible ? 'block' : 'none';
    if (!state.visible) return;
    const last = snap || state.snapshots[state.snapshots.length-1] || {};
    const versionBuild = last.versionJson && last.versionJson.body && last.versionJson.body.build;
    const deployBuild = last.deployHealth && last.deployHealth.body && last.deployHealth.body.build;
    el.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>SVR Boot Diagnostic</strong><button data-svr-bootdiag="close" style="border:1px solid #8cffdc;background:#071510;color:#eafff7;border-radius:999px;padding:5px 9px;cursor:pointer">Close</button></div>'+
      '<div style="margin-top:8px;color:#aef">Build: '+BUILD+'</div>'+
      '<div>HUD: '+escapeHtml(last.hudBuild || '')+'</div>'+
      '<div>version.json: '+escapeHtml(versionBuild || '[missing]')+'</div>'+
      '<div>game deploy-health: '+escapeHtml(deployBuild || '[missing]')+'</div>'+
      '<div>Status: '+escapeHtml(last.statusText || '')+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">'+
      '<button data-svr-bootdiag="refresh" style="border:1px solid #8cffdc;background:#071510;color:#eafff7;border-radius:999px;padding:6px 10px;cursor:pointer">Refresh</button>'+
      '<button data-svr-bootdiag="copy" style="border:1px solid #caa8ff;background:#150b23;color:white;border-radius:999px;padding:6px 10px;cursor:pointer">Copy JSON</button>'+
      '<button data-svr-bootdiag="download" style="border:1px solid #caa8ff;background:#150b23;color:white;border-radius:999px;padding:6px 10px;cursor:pointer">Download JSON</button>'+
      '</div><pre style="white-space:pre-wrap;background:rgba(0,0,0,.32);padding:10px;border-radius:12px;max-height:46vh;overflow:auto">'+escapeHtml(JSON.stringify(last, null, 2))+'</pre>';
  }
  function escapeHtml(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function toggle(){ state.visible = !state.visible; if (state.visible) snapshot('panel-open'); else render(); }
  async function copy(){ const snap = state.snapshots[state.snapshots.length-1] || await snapshot('copy'); await navigator.clipboard?.writeText?.(JSON.stringify(snap,null,2)); }
  async function download(){ const snap = state.snapshots[state.snapshots.length-1] || await snapshot('download'); const blob = new Blob([JSON.stringify(snap,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='svr-boot-diagnostic-phase226.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  window.addEventListener('error', e => { state.errors.push({type:'error', at:new Date().toISOString(), message:e.message, source:e.filename, line:e.lineno, col:e.colno}); if(state.errors.length>MAX_ERRORS) state.errors.shift(); });
  window.addEventListener('unhandledrejection', e => { state.errors.push({type:'unhandledrejection', at:new Date().toISOString(), reason:clean(e.reason)}); if(state.errors.length>MAX_ERRORS) state.errors.shift(); });
  document.addEventListener('keydown', e => { if ((e.key||'').toLowerCase()==='d' && !e.repeat) toggle(); });
  document.addEventListener('click', e => { const t=e.target && e.target.closest && e.target.closest('[data-svr-bootdiag]'); if(!t) return; const a=t.getAttribute('data-svr-bootdiag'); if(a==='close') toggle(); if(a==='refresh') snapshot('refresh'); if(a==='copy') copy(); if(a==='download') download(); });
  window.SVR_BOOT_DIAGNOSTIC = { build: BUILD, state, snapshot, toggle, copy, download };
  setTimeout(()=>snapshot('startup').catch(()=>{}), 1800);
})();
