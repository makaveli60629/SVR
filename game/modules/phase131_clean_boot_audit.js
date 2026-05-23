// PHASE-134-CLIENT-PERFORMANCE-AUDIT-STABILIZE-LOCK
// Game-side only. Dynamic clean boot audit guard.
// Purpose: verify current build without forcing stale Phase 131 labels.

function currentPhase(){
  return window.SVR_BUILD_PHASE || window.SVR_CURRENT_GAME_PHASE || 'PHASE-134-CLIENT-PERFORMANCE-AUDIT-STABILIZE-LOCK';
}
function q(sel){ return document.querySelector(sel); }
function all(sel){ return Array.from(document.querySelectorAll(sel)); }
function setBuildLabel(){
  const phase = currentPhase();
  window.SVR_CURRENT_GAME_PHASE = phase;
  window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
  document.documentElement.dataset.svrBuild = phase;
  all('.pill').forEach((el)=>{
    if (String(el.textContent || '').includes('BUILD:') && el.textContent !== 'BUILD: ' + phase) el.textContent = 'BUILD: ' + phase;
  });
}
function audit(){
  setBuildLabel();
  const phase = currentPhase();
  const scene = window.SVR_CORE_SCENE || null;
  const worldRoot = window.SVR_WORLD_ROOT || null;
  const stableLobby = worldRoot?.getObjectByName?.('SVR_PHASE133_STABLE_REFINED_LOBBY') || scene?.getObjectByName?.('SVR_PHASE133_STABLE_REFINED_LOBBY') || null;
  const floor = worldRoot?.getObjectByName?.('SVR_PHASE133_CORRECT_LOBBY_FLOOR') || scene?.getObjectByName?.('SVR_PHASE133_CORRECT_LOBBY_FLOOR') || null;
  const sky = worldRoot?.getObjectByName?.('SVR_STABLE_HIGH_ORBIT_SKY') || scene?.getObjectByName?.('SVR_STABLE_HIGH_ORBIT_SKY') || null;
  const scripts = all('script[type="module"]').map(s=>s.getAttribute('src') || '').filter(Boolean);
  const stale = all('.pill').map(e=>e.textContent || '').filter(t=>/PHASE-10[0-9]|PHASE-12[0-9]|PHASE-13[0-3]/.test(t) && !t.includes(phase));
  const report = {
    phase,
    ok: Boolean(window.SVR_CORE_SCENE && window.SVR_CORE_RENDERER && window.SVR_WORLD_ROOT && stableLobby && floor),
    cleanBootScripts: scripts,
    scriptCount: scripts.length,
    stableLobbyPresent: Boolean(stableLobby || window.SVR_PHASE133_STABLE_LOBBY),
    floorPresent: Boolean(floor),
    orbitSkyPresent: Boolean(sky || window.SVR_PHASE133_STABLE_LOBBY),
    viewPerformancePresent: Boolean(window.SVR_VIEW_PERFORMANCE_MANAGER),
    teleportPresent: Boolean(window.SVR_PHASE129_TELEPORT_FIX || window.SVR_TELEPORT_POSE),
    staleVisibleLabels: stale,
    siteTouched: false,
    timestamp: new Date().toISOString()
  };
  window.SVR_PHASE134_CLEAN_BOOT_AUDIT = report;
  window.SVR_PHASE131_CLEAN_BOOT_AUDIT = report;
  return report;
}
function makePanel(){
  if (q('#svrPhaseCleanAudit')) return;
  const style = document.createElement('style');
  style.textContent = '#svrPhaseCleanAudit{position:fixed;left:12px;bottom:12px;z-index:60;border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(0,0,0,.62);color:#7ff5c7;padding:8px 12px;font:900 11px/1 system-ui;pointer-events:auto;cursor:pointer}#svrPhaseCleanAuditPanel{position:fixed;left:12px;bottom:54px;z-index:60;width:min(420px,calc(100vw - 24px));max-height:46vh;overflow:auto;border:1px solid rgba(127,245,199,.32);border-radius:14px;background:rgba(2,6,14,.88);color:#eafff4;padding:10px;font:12px/1.35 system-ui;display:none}#svrPhaseCleanAuditPanel.open{display:block}body.preview-mode #svrPhaseCleanAudit,body.preview-mode #svrPhaseCleanAuditPanel{display:none!important}';
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.id = 'svrPhaseCleanAudit';
  btn.type = 'button';
  btn.textContent = 'CLEAN BOOT';
  const panel = document.createElement('pre');
  panel.id = 'svrPhaseCleanAuditPanel';
  document.body.append(btn,panel);
  btn.addEventListener('click',()=>{ panel.classList.toggle('open'); panel.textContent = JSON.stringify(audit(), null, 2); });
}
function loop(){
  const r = audit();
  const btn = q('#svrPhaseCleanAudit');
  if (btn) btn.textContent = r.ok ? 'CLEAN BOOT OK' : 'CLEAN BOOT CHECK';
  setTimeout(loop, 5000);
}
function boot(){ makePanel(); loop(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
