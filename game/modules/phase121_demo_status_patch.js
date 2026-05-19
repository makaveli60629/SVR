// PHASE-121-DEMO-STATUS-PATCH-LOCK
// Game-side only. Keeps the visible game build label current and reports a compact demo status.

const PHASE = 'PHASE-121-DEMO-STATUS-PATCH-LOCK';

function state(){
  const perf = window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null;
  const bundle = window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT?.audit?.() || null;
  const poker = window.SVR_PLAYABLE_POKER?.getState?.() || null;
  const missing = [];
  [
    'SVR_PLAYABLE_POKER','SVR_POKER_ACTION_HUD','SVR_PHASE116_CUSTOM_RAISE_UI',
    'SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT','SVR_PHASE120_DEMO_CANDIDATE_LOCK'
  ].forEach(k => { if (!window[k]) missing.push(k); });
  return {
    phase: PHASE,
    ok: missing.length === 0 && (!perf || perf.status !== 'LOW-PERF'),
    siteTouched: false,
    missing,
    perf,
    bundle,
    pokerStreet: poker?.street || null,
    pokerPot: poker?.pot ?? null,
    timestamp: new Date().toISOString()
  };
}

function syncLabel(){
  document.documentElement.dataset.svrBuild = PHASE;
  window.SVR_CURRENT_GAME_PHASE = PHASE;
  window.SVR_GAME_TRACK = 'game-side-only';
  window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
  const build = Array.from(document.querySelectorAll('.pill')).find(p => String(p.textContent || '').includes('BUILD:'));
  if (build) build.textContent = 'BUILD: ' + PHASE;
  if (!String(document.title || '').includes('Phase 121')) document.title = 'ScarlettVR Poker • Phase 121 demo status patch';
}

function tick(){
  syncLabel();
  const s = state();
  window.SVR_PHASE121_DEMO_STATUS_PATCH = { phase: PHASE, state, syncLabel, last: s };
  window.SVR_PHASE121_RUNTIME_AUDIT = s;
  setTimeout(tick, 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once:true }); else tick();
