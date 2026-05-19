// PHASE-120-DEMO-CANDIDATE-LOCK
// Game-side only. Final demo-candidate gate panel tying together audit, PERF,
// BUNDLE, ADMIN ONLINE, poker, custom raise, routes, cards, chips, and watch locks.
// This does not touch the website or /site files.

const PHASE = 'PHASE-120-DEMO-CANDIDATE-LOCK';
let btn, panel, body, lastSig = '';

function audit(){ return window.SVR_PHASE120_RUNTIME_AUDIT || window.SVR_PHASE114_RUNTIME_AUDIT || window.SVR_PHASE112_RUNTIME_AUDIT || window.SVR_PHASE110_RUNTIME_AUDIT || null; }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function bundle(){ return window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT?.audit?.() || null; }
function poker(){ return window.SVR_PLAYABLE_POKER?.getState?.() || null; }
function routes(){ return window.SVR_PHASE104_PRIVATE_ROUTE_GUARD?.audit || null; }
function yes(v){ return v ? 'YES' : 'NO'; }
function isPreview(){ const p = new URLSearchParams(location.search); return document.body.classList.contains('preview-mode') || p.has('preview') || p.get('cam') === 'director'; }
function candidate(){
  const a = audit();
  const p = perf();
  const b = bundle();
  const ps = poker();
  const r = routes();
  const missing = a?.missingGlobals?.length || 0;
  const blocked = a?.blockedApprovalTermsPresent?.length || 0;
  const stale = a?.stalePhaseLabels?.length || 0;
  const routeMissing = r?.missingRoutes?.length || 0;
  const perfOk = !p || (p.status !== 'LOW-PERF');
  const bundleOk = !b || b.loadedBytes < (25 * 1024 * 1024);
  const adminOk = !!window.SVR_ADMIN_ONLINE;
  const coreOk = !!window.SVR_PLAYABLE_POKER && !!window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC && !!window.SVR_PHASE102_CHIP_MOTION_FX && !!window.SVR_PHASE116_CUSTOM_RAISE_UI;
  const ok = !!a?.ok && missing === 0 && blocked === 0 && stale === 0 && perfOk && bundleOk && adminOk && coreOk;
  return { phase:PHASE, ok, auditPhase:a?.phase || 'waiting', missing, blocked, stale, routeMissing, perf:p, bundle:b, poker:ps, adminOk, coreOk, siteTouched:!!a?.siteTouched, timestamp:new Date().toISOString() };
}
function style(){
  if(document.getElementById('svr-demo-candidate-style')) return;
  const s = document.createElement('style');
  s.id = 'svr-demo-candidate-style';
  s.textContent = '#svrDemoCandidateBtn{position:fixed;left:50%;top:62px;transform:translateX(-50%);z-index:50;border:1px solid rgba(246,226,127,.62);border-radius:999px;background:rgba(5,8,16,.82);color:#f6e27f;padding:8px 14px;font:950 11px/1 system-ui;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,.45)}#svrDemoCandidatePanel{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:50;width:min(560px,calc(100vw - 24px));max-height:66vh;overflow:auto;border:1px solid rgba(246,226,127,.44);border-radius:18px;background:linear-gradient(135deg,rgba(5,8,16,.94),rgba(26,12,44,.96));color:#f6f3ff;padding:12px;display:none;font:12px/1.35 system-ui;box-shadow:0 18px 52px rgba(0,0,0,.52)}#svrDemoCandidatePanel.open{display:block}.dc-row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.08);padding:6px 0}.dc-key{color:rgba(246,243,255,.68)}.dc-val{font-weight:900;text-align:right}.good{color:#7ff5c7}.warn{color:#f6e27f}.bad{color:#ff6b7f}.dc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.dc-actions button{border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:7px 10px;font-weight:900;cursor:pointer}body.preview-mode #svrDemoCandidateBtn,body.preview-mode #svrDemoCandidatePanel{display:none!important}';
  document.head.appendChild(s);
}
function row(k,v,c){ return '<div class="dc-row"><span class="dc-key">'+k+'</span><span class="dc-val '+(c||'')+'">'+v+'</span></div>'; }
function make(){
  if(btn || isPreview()) return;
  style();
  btn = document.createElement('button'); btn.id = 'svrDemoCandidateBtn'; btn.type = 'button'; btn.textContent = 'DEMO CANDIDATE';
  panel = document.createElement('section'); panel.id = 'svrDemoCandidatePanel'; panel.innerHTML = '<strong>SVR Demo Candidate Gate</strong><div id="svrDemoCandidateBody"></div>';
  body = panel.querySelector('#svrDemoCandidateBody');
  document.body.append(btn, panel);
  btn.addEventListener('click',()=>panel.classList.toggle('open'));
}
function render(){
  make(); if(!body) return;
  const c = candidate();
  const sig = JSON.stringify({ok:c.ok, audit:c.auditPhase, miss:c.missing, blocked:c.blocked, stale:c.stale, fps:c.perf?.fps, bundle:c.bundle?.loadedMB, admin:c.adminOk, core:c.coreOk, route:c.routeMissing});
  if(sig === lastSig) return; lastSig = sig;
  btn.textContent = c.ok ? 'DEMO CANDIDATE OK' : 'DEMO CANDIDATE CHECK';
  const statusClass = c.ok ? 'good' : 'warn';
  body.innerHTML =
    row('Phase', PHASE) +
    row('Candidate status', c.ok ? 'READY FOR DEMO TEST' : 'CHECK ITEMS', statusClass) +
    row('Audit', c.auditPhase, c.missing || c.blocked || c.stale ? 'warn' : 'good') +
    row('Admin online', yes(c.adminOk), c.adminOk ? 'good' : 'bad') +
    row('Core poker stack', yes(c.coreOk), c.coreOk ? 'good' : 'bad') +
    row('Missing globals', c.missing || 'none', c.missing ? 'bad' : 'good') +
    row('Blocked approval terms', c.blocked || 'none', c.blocked ? 'bad' : 'good') +
    row('Stale labels', c.stale || 'none', c.stale ? 'warn' : 'good') +
    row('Private routes missing', c.routeMissing || 'none', c.routeMissing ? 'warn' : 'good') +
    row('Performance', c.perf ? (c.perf.status + ' • ' + c.perf.fps + ' FPS') : 'waiting', c.perf?.status === 'LOW-PERF' ? 'bad' : 'good') +
    row('Bundle', c.bundle ? (c.bundle.loadedMB + ' MB / 25 MB') : 'waiting', c.bundle?.loadedBytes > 25*1024*1024 ? 'bad' : 'good') +
    row('Poker', c.poker ? ((c.poker.street || 'ready').toUpperCase() + ' • Pot $' + (c.poker.pot || 0)) : 'waiting', c.poker ? 'good' : 'warn') +
    row('Site touched', yes(c.siteTouched), c.siteTouched ? 'bad' : 'good') +
    '<div class="dc-actions"><button id="dcHealth">Open HEALTH</button><button id="dcPerf">Open PERF</button><button id="dcBundle">Open BUNDLE</button><button id="dcNext">Next Hand</button></div>';
  body.querySelector('#dcHealth')?.addEventListener('click',()=>window.SVR_PHASE110_RUNTIME_HEALTH_PANEL?.open?.() || window.SVR_PHASE105_RUNTIME_HEALTH_PANEL?.open?.());
  body.querySelector('#dcPerf')?.addEventListener('click',()=>document.getElementById('svrQuestPerfBody')?.classList.toggle('open'));
  body.querySelector('#dcBundle')?.addEventListener('click',()=>document.getElementById('svrBundlePanel')?.classList.toggle('open'));
  body.querySelector('#dcNext')?.addEventListener('click',()=>window.SVR_PLAYABLE_POKER?.nextHand?.());
}
function boot(){
  window.SVR_PHASE120_DEMO_CANDIDATE_LOCK = { phase:PHASE, candidate, render };
  setInterval(render, 1000);
  setTimeout(render, 700);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
