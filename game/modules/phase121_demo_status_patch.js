// PHASE-180-PASSIVE-PHASE121-STATUS-PATCH
// Game-side only. Replaces the old Phase 121 status loop with a passive one-shot status snapshot.
// It no longer rewrites the visible build label/title every second.

const PHASE = 'PHASE-180-PASSIVE-PHASE121-STATUS-PATCH';
const LEGACY_PHASE = 'PHASE-121-DEMO-STATUS-PATCH-LOCK';

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
    legacyPhase: LEGACY_PHASE,
    passive: true,
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

function boot(){
  const s = state();
  window.SVR_PHASE121_DEMO_STATUS_PATCH = { phase: PHASE, legacyPhase: LEGACY_PHASE, state, last: s, passive: true };
  window.SVR_PHASE121_RUNTIME_AUDIT = s;
  window.SVR_PHASE180_BOOT_LOOP_FIX = window.SVR_PHASE180_BOOT_LOOP_FIX || { phase: 'PHASE-180-BOOT-LOOP-FIX', passiveAudits: [] };
  window.SVR_PHASE180_BOOT_LOOP_FIX.passiveAudits.push('phase121_demo_status_patch.js');
  try { console.info('[SVR Passive Phase 121 Status]', s); } catch {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
