/*
 * SVR Poker Phase 213 - Boot Route Health Verify Lock
 * Runs without Three.js. Purpose: never leave the player stuck on Booting.
 */
(function(){
  const BUILD = 'PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK';
  let active = false;
  let reports = [];
  const esc = (v)=>String(v == null ? '' : v).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const now = ()=>new Date().toISOString();
  function collect(reason, detail){
    const report = {
      build: BUILD,
      reason: String(reason || 'unknown'),
      detail: String(detail && (detail.stack || detail.message || detail) || '').slice(0, 5000),
      href: location.href,
      userAgent: navigator.userAgent,
      time: now(),
      hasImportMap: !!document.querySelector('script[type="importmap"]'),
      statusText: document.getElementById('status')?.textContent || '',
      modules: {
        enterpriseBridge: !!window.SVR_ENTERPRISE_BRIDGE,
        bootGuard: !!window.SVR_BOOT_GUARD
      }
    };
    reports.push(report);
    try { localStorage.setItem('svr_boot_reports', JSON.stringify(reports.slice(-20))); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('svr_boot_fallback_report', { detail: report })); } catch(_) {}
    return report;
  }
  function setStatus(text){ const el=document.getElementById('status'); if(el) el.textContent=text; }
  function download(report){
    const blob = new Blob([JSON.stringify(report || reports[reports.length-1] || collect('manual'), null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'svr-boot-report-' + Date.now() + '.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }
  async function copy(report){
    const text = JSON.stringify(report || reports[reports.length-1] || collect('manual'), null, 2);
    try { await navigator.clipboard.writeText(text); setStatus('Boot fallback: report copied'); }
    catch(_) { download(report); }
  }
  function privateLinks(){
    return [
      ['Lobby retry','./index.html?v=phase252-retry-'+Date.now()],
      ['No-cache reload','./index.html?nocache='+Date.now()],
      ['Scorpion','./scorpion.html?v=phase252'],
      ['PGA Drive','./pga-drive.html?v=phase252'],
      ['Chip/Putt','./chip-putt.html?v=phase252'],
      ['Reiki Room','./reiki.html?v=phase252'],
      ['VR Store','./store-room.html?v=phase252'],
      ['Smoker Lounge','./smoker-lounge.html?v=phase252']
    ];
  }
  function show(reason, detail){
    if(active) return;
    active = true;
    const report = collect(reason, detail);
    setStatus('Boot fallback active — recovery shell loaded');
    document.body.classList.remove('preview-mode');
    let wrap = document.getElementById('svrBootFallback');
    if(!wrap){ wrap = document.createElement('div'); wrap.id='svrBootFallback'; document.body.appendChild(wrap); }
    const links = privateLinks().map(([label,url])=>`<a class="svr-boot-fallback-btn" href="${esc(url)}">${esc(label)}</a>`).join('');
    wrap.innerHTML = `
      <div class="svr-boot-fallback-card">
        <div class="svr-boot-fallback-kicker">SVR Boot Fallback</div>
        <h1>Game boot was recovered.</h1>
        <p>The runtime did not finish loading normally, so this fallback shell stopped the permanent Booting screen. This usually means a CDN/import issue, stale cache, or a JavaScript module error.</p>
        <div class="svr-boot-fallback-grid">
          <div><b>Build</b><span>${esc(BUILD)}</span></div>
          <div><b>Status</b><span>${esc(reason)}</span></div>
          <div><b>Time</b><span>${esc(report.time)}</span></div>
        </div>
        <div class="svr-boot-fallback-actions">${links}</div>
        <div class="svr-boot-fallback-actions">
          <button class="svr-boot-fallback-btn" data-svr-boot-report="copy">Copy Boot Report</button>
          <button class="svr-boot-fallback-btn" data-svr-boot-report="download">Download Boot Report</button>
        </div>
        <pre>${esc(report.detail || 'No error stack reported. Main module likely timed out before ready signal.')}</pre>
      </div>`;
    if(!document.getElementById('svrBootFallbackStyle')){
      const style=document.createElement('style'); style.id='svrBootFallbackStyle'; style.textContent = `
        #svrBootFallback{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at top,#241447 0%,#06060b 48%,#000 100%);color:#fff;font-family:system-ui,Segoe UI,Arial,sans-serif;overflow:auto}
        .svr-boot-fallback-card{max-width:920px;width:min(920px,100%);border:1px solid rgba(150,255,220,.45);border-radius:24px;background:rgba(0,0,0,.72);box-shadow:0 28px 80px rgba(0,0,0,.75);padding:24px}
        .svr-boot-fallback-kicker{color:#83ffd6;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800}.svr-boot-fallback-card h1{margin:.25rem 0 0;font-size:clamp(28px,5vw,54px);line-height:.98}.svr-boot-fallback-card p{color:#d8d3ff;max-width:760px}.svr-boot-fallback-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:16px 0}.svr-boot-fallback-grid div{border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px;background:rgba(255,255,255,.04)}.svr-boot-fallback-grid b{display:block;color:#83ffd6;font-size:12px}.svr-boot-fallback-grid span{font-size:13px;color:#fff}.svr-boot-fallback-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.svr-boot-fallback-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;border:1px solid rgba(150,255,220,.5);background:rgba(6,24,18,.78);color:#eafff6;text-decoration:none;cursor:pointer;font-weight:700}.svr-boot-fallback-btn:hover{background:rgba(16,68,48,.85)}.svr-boot-fallback-card pre{max-height:180px;overflow:auto;white-space:pre-wrap;border-radius:14px;background:rgba(0,0,0,.48);border:1px solid rgba(255,255,255,.12);padding:12px;color:#ffd9e6}
      `; document.head.appendChild(style);
    }
    wrap.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('[data-svr-boot-report]'); if(!btn) return;
      if(btn.dataset.svrBootReport === 'copy') copy(report);
      if(btn.dataset.svrBootReport === 'download') download(report);
    }, {once:false});
  }
  window.SVR_BOOT_FALLBACK = { show, collect, download, copy, getReports:()=>reports.slice(), build: BUILD };
})();
