/*
 * SVR Poker Phase 214 - Boot Route Health Verify Lock
 * Verifies the direct route links used by boot fallback/recovery so testers can see if a private scene route is missing, stale, or blocked by cache/CDN.
 */
(function(){
  const BUILD = 'PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK';
  const ROUTES = [
    { key:'lobby', label:'Lobby', url:'./index.html?v=phase242-routecheck' },
    { key:'scorpion', label:'Scorpion', url:'./scorpion.html?v=phase242-routecheck' },
    { key:'pgaDrive', label:'PGA Drive', url:'./pga-drive.html?v=phase242-routecheck' },
    { key:'chipPutt', label:'Chip/Putt', url:'./chip-putt.html?v=phase242-routecheck' },
    { key:'reiki', label:'Reiki Room', url:'./reiki.html?v=phase242-routecheck' },
    { key:'store', label:'VR Store', url:'./store-room.html?v=phase242-routecheck' },
    { key:'smoker', label:'Smoker Lounge', url:'./smoker-lounge.html?v=phase242-routecheck' },
    { key:'cam3', label:'Cam 3 Preview', url:'./cam3.html?v=phase242-routecheck' }
  ];
  let lastResult = null;
  let overlay = null;
  function now(){ return new Date().toISOString(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function ensureOverlay(){
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'svrBootRouteHealth';
    overlay.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:95;max-width:520px;max-height:72vh;overflow:auto;background:rgba(3,7,18,.94);border:1px solid rgba(140,255,220,.55);border-radius:18px;color:#eafff7;padding:14px 16px;font:12px/1.45 system-ui,Segoe UI,Arial,sans-serif;box-shadow:0 24px 70px rgba(0,0,0,.65);display:none';
    document.body.appendChild(overlay);
    return overlay;
  }
  async function probe(route){
    const absolute = new URL(route.url, location.href).href;
    const started = performance.now();
    try {
      // GET avoids inconsistent HEAD behavior on static hosts and still stays tiny for these HTML files.
      const res = await fetch(absolute, { cache:'no-store', credentials:'same-origin' });
      const text = await res.text().catch(()=> '');
      return { ...route, ok: res.ok, status: res.status, ms: Math.round(performance.now()-started), bytes: text.length, hasHtml: /<html|<!doctype/i.test(text), url:absolute };
    } catch (error) {
      return { ...route, ok:false, status:0, ms:Math.round(performance.now()-started), error:String(error && (error.message || error)), url:absolute };
    }
  }
  async function run(reason='manual'){
    const results = [];
    for (const route of ROUTES) results.push(await probe(route));
    const failures = results.filter(r => !r.ok || !r.hasHtml);
    lastResult = { build: BUILD, reason, at: now(), href: location.href, ok: failures.length === 0, failures: failures.length, results };
    try { window.dispatchEvent(new CustomEvent('svr_boot_route_health_update', { detail:lastResult })); } catch(_) {}
    render(lastResult, true);
    return lastResult;
  }
  function render(result=lastResult, show=true){
    const el = ensureOverlay();
    if (!result) { el.innerHTML = '<b>SVR Route Health</b><br>No route check yet.<br><button data-svr-route-health="run">Run Route Check</button>'; }
    else {
      const rows = result.results.map(r => `<tr><td>${esc(r.label)}</td><td>${r.ok && r.hasHtml ? 'OK' : 'CHECK'}</td><td>${esc(r.status)}</td><td>${esc(r.ms)}ms</td><td><a style="color:#8cffdc" href="${esc(r.url)}">open</a></td></tr>`).join('');
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><b>SVR Route Health</b><span>${result.ok ? 'READY' : 'REVIEW'}</span></div><small>${esc(result.build)} • ${esc(result.at)}</small><table style="width:100%;border-collapse:collapse;margin-top:8px"><thead><tr><th align="left">Route</th><th>Status</th><th>HTTP</th><th>Time</th><th>Link</th></tr></thead><tbody>${rows}</tbody></table><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button data-svr-route-health="run">Run Again</button><button data-svr-route-health="copy">Copy JSON</button><button data-svr-route-health="download">Download JSON</button><button data-svr-route-health="hide">Hide</button></div><p style="margin:8px 0 0;color:#b8ffe9">Press L to toggle this panel.</p>`;
    }
    el.querySelectorAll('button').forEach(btn=>{ btn.style.cssText='padding:7px 10px;border-radius:999px;border:1px solid rgba(140,255,220,.55);background:#061510;color:#eafff7;cursor:pointer'; });
    el.style.display = show ? 'block' : 'none';
  }
  function toggle(){ const el=ensureOverlay(); if(el.style.display==='none' || !el.style.display) render(lastResult, true); else el.style.display='none'; }
  async function copy(){ if (!lastResult) await run('copy'); const txt=JSON.stringify(lastResult,null,2); try{ await navigator.clipboard.writeText(txt); }catch(_){ console.log(txt); } }
  function download(){ const data=JSON.stringify(lastResult || {build:BUILD, at:now(), results:[]}, null, 2); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='svr-route-health-phase242.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000); }
  document.addEventListener('click', ev=>{ const btn=ev.target && ev.target.closest && ev.target.closest('[data-svr-route-health]'); if(!btn) return; const act=btn.getAttribute('data-svr-route-health'); if(act==='run') run('button'); if(act==='copy') copy(); if(act==='download') download(); if(act==='hide') ensureOverlay().style.display='none'; });
  window.addEventListener('keydown', ev=>{ if(ev.key && ev.key.toLowerCase()==='l' && !ev.ctrlKey && !ev.altKey && !ev.metaKey){ toggle(); if(!lastResult) run('keyboard'); }});
  window.SVR_BOOT_ROUTE_HEALTH = { build:BUILD, routes:ROUTES.slice(), run, render, toggle, latest:()=>lastResult };
  setTimeout(()=>run('startup'), 1200);
})();
