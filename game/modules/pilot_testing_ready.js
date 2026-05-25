// SVR Poker Phase 200 - Pilot Testing Ready Gate
// Public Matrix page is not touched by this module.
(function(){
  const BUILD = 'PHASE-209-SAFE-EVENT-BUS-LOCK';
  const storageKey = 'svr_pilot_testing_ready_reports';
  const requiredModules = [
    ['SVR_DEPLOY_VERIFIER','Deploy verifier'],
    ['SVR_SMOKE_TEST','Smoke test'],
    ['SVR_RELEASE_CANDIDATE','Release candidate checklist'],
    ['SVR_PLAYTEST_WIZARD','Playtest wizard'],
    ['SVR_BUG_REPORTER','Bug reporter'],
    ['SVR_TESTER_FEEDBACK','Tester feedback'],
    ['SVR_TEST_QUEUE','Test queue'],
    ['SVR_TEST_REPORT_BUNDLE','Test report bundle'],
    ['SVR_DEMO_CERTIFICATION','Demo certification'],
    ['SVR_SESSION_EXPORT','Session export']
  ];

  function getLocalArray(key){
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function saveLocalArray(key, value){
    try { localStorage.setItem(key, JSON.stringify(value.slice(-50))); } catch {}
  }
  function moduleStatus(){
    return requiredModules.map(([key,label]) => ({ key, label, ok: !!window[key] }));
  }
  function score(status){
    const pass = status.filter(x => x.ok).length;
    const pct = Math.round((pass / status.length) * 100);
    let readiness = 'READY_FOR_PILOT_TESTING';
    if (pct < 90) readiness = 'NEEDS_REVIEW';
    if (pct < 70) readiness = 'BLOCKED';
    return { pass, total: status.length, pct, readiness };
  }
  function collect(){
    const modules = moduleStatus();
    const rating = score(modules);
    const payload = {
      build: BUILD,
      generatedAt: new Date().toISOString(),
      url: location.href,
      userAgent: navigator.userAgent,
      readiness: rating.readiness,
      score: rating,
      modules,
      shortcuts: {
        'V': 'Deploy verifier',
        'T': 'Smoke test',
        'U': 'Release candidate checklist',
        'W': 'Guided playtest wizard',
        'G': 'Bug report panel',
        'J': 'Tester feedback panel',
        'K': 'Test queue dashboard',
        'B': 'Test report bundle',
        'Z': 'Demo certification',
        'P': 'Pilot testing ready gate',
        'X/Y': 'Download/copy session export'
      },
      protectedLocks: {
        publicMatrixPageTouched: false,
        dealerBodyDisabled: true,
        directGameFolderDeploy: true,
        gameZipUnder25mb: true,
        unapprovedWellnessBrandingRemoved: true
      },
      testingFocus: [
        'Seat and play a complete hand through showdown',
        'Verify fold/check/call/raise/all-in controls',
        'Verify watch decision hints and countdown',
        'Verify hand history, action log, side pots, and demo certification',
        'Export session report and attach bug reports as needed'
      ]
    };
    const existing = getLocalArray(storageKey);
    existing.push(payload);
    saveLocalArray(storageKey, existing);
    window.dispatchEvent(new CustomEvent('svr_pilot_testing_ready_update', { detail: payload }));
    try { fetch('/api/game/pilot-ready', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive:true }).catch(()=>{}); } catch {}
    return payload;
  }
  function makePanel(){
    let el = document.getElementById('svr-pilot-ready-panel');
    if (!el){
      el = document.createElement('div');
      el.id = 'svr-pilot-ready-panel';
      el.style.cssText = 'position:fixed;right:16px;top:16px;z-index:99999;width:min(430px,calc(100vw - 32px));max-height:86vh;overflow:auto;background:rgba(6,4,14,.94);color:#fff;border:1px solid rgba(144,255,205,.45);border-radius:16px;padding:14px;box-shadow:0 20px 70px rgba(0,0,0,.6);font:12px/1.4 system-ui,Segoe UI,Arial;display:none;';
      document.body.appendChild(el);
    }
    return el;
  }
  async function copyLatest(){
    const latest = collect();
    const text = JSON.stringify(latest, null, 2);
    try { await navigator.clipboard.writeText(text); alert('Pilot testing report copied.'); }
    catch { prompt('Copy pilot testing report:', text); }
  }
  function downloadLatest(){
    const latest = collect();
    const blob = new Blob([JSON.stringify(latest, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `svr-pilot-ready-${BUILD}-${Date.now()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }
  function render(){
    const data = collect();
    const el = makePanel();
    const rows = data.modules.map(m => `<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);padding:4px 0"><span>${m.label}</span><b style="color:${m.ok ? '#7dffb2' : '#ff6975'}">${m.ok ? 'OK' : 'MISSING'}</b></div>`).join('');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px">
        <b style="color:#b9ffdc">SVR Pilot Testing Ready</b>
        <button id="svrPilotClose" style="border:1px solid rgba(255,255,255,.25);background:#111;color:#fff;border-radius:999px;padding:3px 8px">×</button>
      </div>
      <div><b>Build:</b> ${data.build}</div>
      <div><b>Status:</b> <span style="color:${data.readiness === 'READY_FOR_PILOT_TESTING' ? '#7dffb2' : data.readiness === 'NEEDS_REVIEW' ? '#ffd166' : '#ff6975'}">${data.readiness}</span></div>
      <div><b>Score:</b> ${data.score.pct}% (${data.score.pass}/${data.score.total})</div>
      <h4 style="margin:12px 0 6px;color:#d7c7ff">Module Checks</h4>
      ${rows}
      <h4 style="margin:12px 0 6px;color:#d7c7ff">Pilot Test Focus</h4>
      <ol style="padding-left:20px;margin:0 0 10px">${data.testingFocus.map(x=>`<li>${x}</li>`).join('')}</ol>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button id="svrPilotCopy" style="padding:7px 10px;border-radius:999px;border:1px solid #7dffb2;background:#0a1f16;color:#fff">Copy JSON</button>
        <button id="svrPilotDownload" style="padding:7px 10px;border-radius:999px;border:1px solid #b99cff;background:#140b22;color:#fff">Download JSON</button>
      </div>
      <p style="opacity:.75;margin:10px 0 0">Shortcut: P toggles this panel. Public Matrix page lock remains untouched.</p>
    `;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    document.getElementById('svrPilotClose')?.addEventListener('click', ()=> el.style.display='none');
    document.getElementById('svrPilotCopy')?.addEventListener('click', copyLatest);
    document.getElementById('svrPilotDownload')?.addEventListener('click', downloadLatest);
    return data;
  }
  const api = { build: BUILD, collect, render, downloadLatest, copyLatest, storageKey };
  window.SVR_PILOT_TESTING_READY = api;
  window.addEventListener('keydown', event => {
    if ((event.key || '').toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) render();
  });
  setTimeout(()=>collect(), 1600);
})();
