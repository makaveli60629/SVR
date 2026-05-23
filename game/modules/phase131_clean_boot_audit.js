// PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK
// Game-side only. Clean boot audit guard after index cleanup.
// Purpose: stop stale phase labels/modules, verify core floor/sky/performance,
// and publish a compact runtime report without changing site/public files.

const PHASE = 'PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK';

function q(sel){ return document.querySelector(sel); }
function all(sel){ return Array.from(document.querySelectorAll(sel)); }
function setBuildLabel(){
  window.SVR_BUILD_PHASE = PHASE;
  window.SVR_CURRENT_GAME_PHASE = PHASE;
  window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
  document.documentElement.dataset.svrBuild = PHASE;
  if (!String(document.title || '').includes('Phase 131')) document.title = 'ScarlettVR Poker • Phase 131 clean boot audit repair';
  all('.pill').forEach((el)=>{
    if (String(el.textContent || '').includes('BUILD:')) el.textContent = 'BUILD: ' + PHASE;
  });
}
function audit(){
  setBuildLabel();
  const scene = window.SVR_CORE_SCENE || null;
  const worldRoot = window.SVR_WORLD_ROOT || null;
  const floor = scene?.getObjectByName?.('SVR_PHASE130_VISIBLE_LOBBY_FLOOR_RECOVERY') || worldRoot?.getObjectByName?.('SVR_PHASE130_VISIBLE_LOBBY_FLOOR_RECOVERY') || null;
  const sky = scene?.getObjectByName?.('SVR_PHASE130_ORBIT_SKY_SYSTEM') || worldRoot?.getObjectByName?.('SVR_PHASE130_ORBIT_SKY_SYSTEM') || null;
  const scripts = all('script[type="module"]').map(s=>s.getAttribute('src') || '').filter(Boolean);
  const stale = all('.pill').map(e=>e.textContent || '').filter(t=>/PHASE-12[0-9]|PHASE-10[0-9]/.test(t) && !t.includes(PHASE));
  const report = {
    phase: PHASE,
    ok: Boolean(window.SVR_CORE_SCENE && window.SVR_CORE_RENDERER && window.SVR_WORLD_ROOT),
    cleanBootScripts: scripts,
    scriptCount: scripts.length,
    floorRecoveryPresent: Boolean(floor || window.SVR_PHASE130_LOBBY_FLOOR_RECOVERY),
    orbitSkyPresent: Boolean(sky || window.SVR_PHASE130_ORBIT_SKY || window.SVR_PHASE129_HIGH_SKY),
    viewPerformancePresent: Boolean(window.SVR_VIEW_PERFORMANCE_MANAGER),
    teleportPresent: Boolean(window.SVR_PHASE129_TELEPORT_FIX || window.SVR_TELEPORT_POSE),
    staleVisibleLabels: stale,
    siteTouched: false,
    timestamp: new Date().toISOString()
  };
  window.SVR_PHASE131_CLEAN_BOOT_AUDIT = report;
  if (floor?.userData?.api?.update) floor.userData.api.update();
  if (sky?.userData?.api?.update) sky.userData.api.update(0.016);
  return report;
}
function makePanel(){
  if (q('#svrPhase131CleanAudit')) return;
  const style = document.createElement('style');
  style.textContent = '#svrPhase131CleanAudit{position:fixed;left:12px;bottom:12px;z-index:60;border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(0,0,0,.62);color:#7ff5c7;padding:8px 12px;font:900 11px/1 system-ui;pointer-events:auto;cursor:pointer}#svrPhase131CleanAuditPanel{position:fixed;left:12px;bottom:54px;z-index:60;width:min(420px,calc(100vw - 24px));max-height:46vh;overflow:auto;border:1px solid rgba(127,245,199,.32);border-radius:14px;background:rgba(2,6,14,.88);color:#eafff4;padding:10px;font:12px/1.35 system-ui;display:none}#svrPhase131CleanAuditPanel.open{display:block}body.preview-mode #svrPhase131CleanAudit,body.preview-mode #svrPhase131CleanAuditPanel{display:none!important}';
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.id = 'svrPhase131CleanAudit';
  btn.type = 'button';
  btn.textContent = 'CLEAN BOOT';
  const panel = document.createElement('pre');
  panel.id = 'svrPhase131CleanAuditPanel';
  document.body.append(btn,panel);
  btn.addEventListener('click',()=>{ panel.classList.toggle('open'); panel.textContent = JSON.stringify(audit(), null, 2); });
}
function loop(){
  const r = audit();
  const btn = q('#svrPhase131CleanAudit');
  if (btn) btn.textContent = r.ok ? 'CLEAN BOOT OK' : 'CLEAN BOOT CHECK';
  setTimeout(loop, 1500);
}
function boot(){ makePanel(); loop(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
