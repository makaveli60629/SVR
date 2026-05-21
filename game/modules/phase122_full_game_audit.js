// PHASE-180-PASSIVE-PHASE122-FULL-GAME-AUDIT
// Game-side only. Replaces the old Phase 122 looping audit/status panel with a passive one-shot audit.
// It no longer rewrites the visible build label/title every second.

const PHASE = 'PHASE-180-PASSIVE-PHASE122-FULL-GAME-AUDIT';
const LEGACY_PHASE = 'PHASE-122-FULL-GAME-AUDIT-RUNTIME-SYNC-LOCK';
const REQUIRED = [
  'SVR_PLAYABLE_POKER',
  'SVR_POKER_ACTION_HUD',
  'SVR_PHASE101_VISUAL_CARD_MESH_SYNC',
  'SVR_PHASE102_CHIP_MOTION_FX',
  'SVR_PHASE103_CONTROLLER_INPUT',
  'SVR_PHASE104_PRIVATE_ROUTE_GUARD',
  'SVR_PHASE107_RAISE_SIZING_HUD',
  'SVR_PHASE108_WATCH_POKER_DISABLED_STATES',
  'SVR_PHASE110_QUEST_PERFORMANCE_MONITOR',
  'SVR_PHASE111_GAMEPLAY_DEMO_POLISH',
  'SVR_PHASE113_RUNTIME_HEALTH_SYNC',
  'SVR_PHASE116_CUSTOM_RAISE_UI',
  'SVR_PHASE119_ADMIN_ONLINE',
  'SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT',
  'SVR_PHASE120_DEMO_CANDIDATE_LOCK',
  'SVR_PHASE121_DEMO_STATUS_PATCH'
];

function missing(){ return REQUIRED.filter(k => !window[k]); }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function bundle(){ return window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT?.audit?.() || null; }
function candidate(){ return window.SVR_PHASE120_DEMO_CANDIDATE_LOCK?.candidate?.() || null; }
function poker(){ return window.SVR_PLAYABLE_POKER?.getState?.() || null; }
function routes(){ return window.SVR_PHASE104_PRIVATE_ROUTE_GUARD?.audit || null; }

function audit(){
  const m = missing();
  const p = perf();
  const b = bundle();
  const c = candidate();
  const ps = poker();
  const r = routes();
  const routeMissing = r?.missingRoutes?.length || 0;
  const ok = m.length === 0 && (!p || p.status !== 'LOW-PERF') && (!b || b.loadedBytes < 25 * 1024 * 1024);
  const out = {
    phase: PHASE,
    legacyPhase: LEGACY_PHASE,
    passive: true,
    ok,
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals: m,
    routeMissing,
    performance: p,
    bundle: b,
    candidate: c,
    pokerStreet: ps?.street || null,
    pokerPot: ps?.pot ?? null,
    modules: {
      poker: !!window.SVR_PLAYABLE_POKER,
      hud: !!window.SVR_POKER_ACTION_HUD,
      cards: !!window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC,
      chips: !!window.SVR_PHASE102_CHIP_MOTION_FX,
      controller: !!window.SVR_PHASE103_CONTROLLER_INPUT,
      routes: !!window.SVR_PHASE104_PRIVATE_ROUTE_GUARD,
      raiseHud: !!window.SVR_PHASE107_RAISE_SIZING_HUD,
      watchLocks: !!window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES,
      perf: !!window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR,
      demo: !!window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH,
      healthSync: !!window.SVR_PHASE113_RUNTIME_HEALTH_SYNC,
      customRaise: !!window.SVR_PHASE116_CUSTOM_RAISE_UI,
      adminOnline: !!window.SVR_ADMIN_ONLINE,
      bundleAudit: !!window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT,
      demoCandidate: !!window.SVR_PHASE120_DEMO_CANDIDATE_LOCK,
      phase121Patch: !!window.SVR_PHASE121_DEMO_STATUS_PATCH
    },
    timestamp: new Date().toISOString()
  };
  window.SVR_PHASE122_FULL_GAME_AUDIT = out;
  window.SVR_PHASE122_RUNTIME_AUDIT = out;
  window.SVR_PHASE121_RUNTIME_AUDIT = out;
  window.dispatchEvent(new CustomEvent('svr-runtime-audit', { detail: out }));
  return out;
}

function boot(){
  const out = audit();
  window.SVR_PHASE122_FULL_GAME_AUDIT_MODULE = { phase: PHASE, legacyPhase: LEGACY_PHASE, audit, passive: true, last: out };
  window.SVR_PHASE180_BOOT_LOOP_FIX = window.SVR_PHASE180_BOOT_LOOP_FIX || { phase: 'PHASE-180-BOOT-LOOP-FIX', passiveAudits: [] };
  window.SVR_PHASE180_BOOT_LOOP_FIX.passiveAudits.push('phase122_full_game_audit.js');
  try { console.info('[SVR Passive Phase 122 Audit]', out); } catch {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
