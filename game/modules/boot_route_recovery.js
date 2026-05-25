/* SVR Phase 213 - Boot Route Health Verify Lock
 * No Three.js dependency. Gives testers a route recovery panel even when main runtime is unstable.
 */
(function(){
  const BUILD = 'PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK';
  const state = { build: BUILD, opened: false, reports: [], startedAt: new Date().toISOString() };
  const esc = (v)=>String(v == null ? '' : v).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const routeList = [
    ['Lobby hard refresh','./index.html?v=phase235-route-'+Date.now()],
    ['Lobby no cache','./index.html?nocache='+Date.now()],
    ['Scorpion Poker','./scorpion.html?v=phase235'],
    ['PGA Drive','./pga-drive.html?v=phase235'],
    ['Chip / Putt','./chip-putt.html?v=phase235'],
    ['Reiki Room','./reiki.html?v=phase235'],
    ['VR Store','./store-room.html?v=phase235'],
    ['Smoker Lounge','./smoker-lounge.html?v=phase235'],
    ['Cam 3 Preview','./cam3.html?v=phase235']
  ];
  function collect(reason='manual'){
    const report = {
      build: BUILD,
      reason,
      at: new Date().toISOString(),
      href: location.href,
      userAgent: navigator.userAgent,
      title: document.title,
      statusText: document.getElementById('status')?.textContent || '',
      scripts: Array.from(document.scripts||[]).map(s=>s.src||'[inline]').filter(Boolean),
      hasBootGuard: !!window.SVR_BOOT_GUARD,
      hasBootFallback: !!window.SVR_BOOT_FALLBACK,
      hasMarkerHealth: !!window.SVR_MARKER_HEALTH,
      hasBootDiagnostic: !!window.SVR_BOOT_DIAGNOSTIC,
      hasBridgeProxy: !!window.SVR_BRIDGE_PROXY,
      hasCrashShield: !!window.SVR_RUNTIME_CRASH_SHIELD,
      hasSafeEventBus: !!window.SVR_SAFE_EVENT_BUS
    };
    state.reports.push(report);
    if (state.reports.length > 20) state.reports.shift();
    try { window.dispatchEvent(new CustomEvent('svr_boot_route_recovery_update', { detail: report })); } catch(_) {}
    try { localStorage.setItem('svr_boot_route_recovery_reports', JSON.stringify(state.reports)); } catch(_) {}
    return report;
  }
  function ensureStyle(){
    if (document.getElementById('svrBootRouteRecoveryStyle')) return;
    const style = document.createElement('style'); style.id='svrBootRouteRecoveryStyle';
    style.textContent = '#svrBootRouteRecovery{position:fixed;right:14px;bottom:14px;z-index:97;width:min(520px,calc(100vw - 28px));max-height:80vh;overflow:auto;border:1px solid rgba(140,255,220,.5);border-radius:20px;background:rgba(3,6,12,.94);color:#eafff7;box-shadow:0 22px 70px rgba(0,0,0,.72);font:13px/1.42 system-ui,Segoe UI,Arial,sans-serif;padding:14px}#svrBootRouteRecovery h3{margin:0 0 6px;color:#fff}#svrBootRouteRecovery .small{color:#b8b5ff;font-size:12px}#svrBootRouteRecovery .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}#svrBootRouteRecovery a,#svrBootRouteRecovery button{border:1px solid rgba(140,255,220,.45);background:rgba(5,28,20,.82);color:#eafff7;border-radius:999px;padding:8px 10px;text-decoration:none;cursor:pointer;font-weight:700;text-align:center}#svrBootRouteRecovery pre{white-space:pre-wrap;max-height:180px;overflow:auto;background:rgba(0,0,0,.35);border-radius:12px;padding:10px;color:#dff}';
    document.head.appendChild(style);
  }
  function render(report){
    ensureStyle();
    let el = document.getElementById('svrBootRouteRecovery');
    if (!el) { el = document.createElement('div'); el.id='svrBootRouteRecovery'; document.body.appendChild(el); }
    const links = routeList.map(([label,url])=>'<a href="'+esc(url)+'">'+esc(label)+'</a>').join('');
    el.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h3>SVR Boot Route Recovery</h3><button data-svr-route-recovery="close">Close</button></div>'+
      '<div class="small">Build: '+esc(BUILD)+' • Use this if the lobby boot path stalls or a private scene must be opened directly.</div>'+
      '<div class="grid">'+links+'</div>'+
      '<div class="grid"><button data-svr-route-recovery="copy">Copy Report</button><button data-svr-route-recovery="download">Download Report</button><button data-svr-route-recovery="refresh">Refresh Report</button></div>'+
      '<pre>'+esc(JSON.stringify(report || collect('render'), null, 2))+'</pre>';
    state.opened = true;
  }
  function show(reason='manual'){ render(collect(reason)); }
  function close(){ const el=document.getElementById('svrBootRouteRecovery'); if(el) el.remove(); state.opened=false; }
  async function copy(){ const r=state.reports[state.reports.length-1] || collect('copy'); try { await navigator.clipboard.writeText(JSON.stringify(r,null,2)); } catch(_) { download(); } }
  function download(){ const r=state.reports[state.reports.length-1] || collect('download'); const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='svr-boot-route-recovery-phase235.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  document.addEventListener('keydown', e=>{ if((e.key||'').toLowerCase()==='r' && !e.repeat) state.opened ? close() : show('keyboard-r'); });
  document.addEventListener('click', e=>{ const t=e.target && e.target.closest && e.target.closest('[data-svr-route-recovery]'); if(!t) return; const a=t.getAttribute('data-svr-route-recovery'); if(a==='close') close(); if(a==='copy') copy(); if(a==='download') download(); if(a==='refresh') show('refresh'); });
  window.SVR_BOOT_ROUTE_RECOVERY = { build: BUILD, state, routeList, collect, show, close, copy, download };
  setTimeout(()=>collect('startup'), 1000);
})();
