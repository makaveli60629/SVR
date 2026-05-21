// PHASE-180-PASSIVE-RUNTIME-AUDIT-GUARD
// Game-side only. This replaces the old Phase 114 looping audit label writer.
// It preserves audit visibility but never rewrites the active build label/title on a timer.

const PHASE = "PHASE-180-PASSIVE-RUNTIME-AUDIT-GUARD";
const LEGACY_PHASE = "PHASE-114-RUNTIME-AUDIT-HEALTH-SYNC-LOCK";
const REQUIRED_GLOBALS = [
  ["SVR_PLAYABLE_POKER", "playable poker engine"],
  ["SVR_POKER_ACTION_HUD", "desktop/android poker HUD"],
  ["SVR_PHASE91_TABLE_FX", "performance table FX"],
  ["SVR_PHASE92_NPC_BOT_ANIMATION_FX", "NPC bot animation FX"],
  ["SVR_PHASE95_POKER_FEEDBACK_FX", "poker feedback FX"],
  ["SVR_PHASE101_VISUAL_CARD_MESH_SYNC", "visual card mesh sync"],
  ["SVR_PHASE102_CHIP_MOTION_FX", "chip motion FX"],
  ["SVR_PHASE103_CONTROLLER_INPUT", "Quest controller input state"],
  ["SVR_PHASE104_PRIVATE_ROUTE_GUARD", "private scene route guard"],
  ["SVR_PHASE105_RUNTIME_HEALTH_PANEL", "runtime health panel"],
  ["SVR_PHASE107_RAISE_SIZING_HUD", "raise sizing HUD"],
  ["SVR_PHASE108_WATCH_POKER_DISABLED_STATES", "watch poker disabled states"],
  ["SVR_PHASE110_QUEST_PERFORMANCE_MONITOR", "Quest performance monitor"],
  ["SVR_PHASE111_GAMEPLAY_DEMO_POLISH", "gameplay demo polish panel"],
  ["SVR_PHASE113_RUNTIME_HEALTH_SYNC", "health perf demo sync patch"]
];
const REQUIRED_SCENE_BUTTONS = ["lobby", "seat", "reiki", "pga", "legends", "sponsor", "scorpion", "pgaDrive", "chipPutt", "storeRoom", "smokerLounge"];
const APPROVAL_BLOCKED_TERMS = ["Trueitive", "Truitive", "trueitive.com", "truitive.com", "Shyona", "Royston"];

function textIncludesAny(text, terms){
  const body = String(text || "").toLowerCase();
  return terms.filter(term => body.includes(term.toLowerCase()));
}
function getMissingButtons(){
  return REQUIRED_SCENE_BUTTONS.filter(key => !document.querySelector(`#sceneNav [data-scene="${key}"]`));
}
function getMissingGlobals(){
  return REQUIRED_GLOBALS.filter(([key]) => !window[key]).map(([key, label]) => ({ key, label }));
}
function getModuleStates(){
  const poker = window.SVR_PLAYABLE_POKER;
  const pokerState = poker?.getState?.();
  const feedback = window.SVR_PHASE95_POKER_FEEDBACK_FX;
  const privateRoutes = window.SVR_PHASE104_PRIVATE_ROUTE_GUARD?.audit || null;
  const perf = window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null;
  const demo = window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH?.report?.() || null;
  const sync = window.SVR_PHASE113_RUNTIME_HEALTH_SYNC?.status?.() || null;
  return {
    poker: !!poker,
    pokerPhase: pokerState?.phase || null,
    pokerStreet: pokerState?.street || null,
    pokerPot: pokerState?.pot ?? null,
    pokerAwaitingPlayer: !!pokerState?.awaitingPlayer,
    pokerHud: !!window.SVR_POKER_ACTION_HUD,
    raiseSizingHud: !!window.SVR_PHASE107_RAISE_SIZING_HUD,
    watchDisabledStates: !!window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES,
    tableFx: !!window.SVR_PHASE91_TABLE_FX,
    npcFx: !!window.SVR_PHASE92_NPC_BOT_ANIMATION_FX,
    feedbackFx: !!feedback,
    feedbackAudioUnlocked: typeof feedback?.audioUnlocked === "function" ? !!feedback.audioUnlocked() : false,
    cardMeshSync: !!window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC,
    chipMotionFx: !!window.SVR_PHASE102_CHIP_MOTION_FX,
    controllerInput: !!window.SVR_PHASE103_CONTROLLER_INPUT,
    controllerInputState: window.SVR_PHASE103_CONTROLLER_INPUT?.input || null,
    privateRouteGuard: !!window.SVR_PHASE104_PRIVATE_ROUTE_GUARD,
    privateRoutesOk: privateRoutes ? !!privateRoutes.ok : null,
    privateMissingRoutes: privateRoutes?.missingRoutes || [],
    questPerformanceMonitor: !!window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR,
    questPerformance: perf,
    gameplayDemoPolish: !!window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH,
    gameplayDemoOk: demo ? !!demo.ok : null,
    healthPerfDemoSync: !!window.SVR_PHASE113_RUNTIME_HEALTH_SYNC,
    healthPerfDemoStatus: sync,
    healthPanel: !!window.SVR_PHASE105_RUNTIME_HEALTH_PANEL || !!window.SVR_PHASE98_RUNTIME_HEALTH_PANEL,
    npcSystem: !!window.SVR_NPC_AVATAR_SYSTEM,
    lowPerf: document.body.classList.contains("svr-low-perf")
  };
}

function runAudit(){
  const htmlText = document.documentElement?.innerText || document.body?.innerText || "";
  const blockedApprovalTermsPresent = textIncludesAny(htmlText, APPROVAL_BLOCKED_TERMS);
  const missingGlobals = getMissingGlobals();
  const missingSceneButtons = getMissingButtons();
  const modules = getModuleStates();
  const audit = {
    phase: PHASE,
    legacyPhase: LEGACY_PHASE,
    passive: true,
    timestamp: new Date().toISOString(),
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals,
    missingSceneButtons,
    blockedApprovalTermsPresent,
    modules,
    expectedSceneButtons: [...REQUIRED_SCENE_BUTTONS],
    ok: missingGlobals.length === 0 && missingSceneButtons.length === 0 && blockedApprovalTermsPresent.length === 0
  };
  window.SVR_PHASE180_PASSIVE_RUNTIME_AUDIT = audit;
  window.SVR_PHASE114_RUNTIME_AUDIT = audit;
  window.SVR_PHASE112_RUNTIME_AUDIT = audit;
  window.SVR_PHASE110_RUNTIME_AUDIT = audit;
  window.SVR_PHASE105_RUNTIME_AUDIT = audit;
  window.SVR_PHASE98_RUNTIME_AUDIT = audit;
  window.dispatchEvent(new CustomEvent("svr-runtime-audit", { detail: audit }));
  return audit;
}

function boot(){
  const audit = runAudit();
  window.SVR_PHASE180_BOOT_LOOP_FIX = window.SVR_PHASE180_BOOT_LOOP_FIX || { phase: PHASE, passiveAudits: [] };
  window.SVR_PHASE180_BOOT_LOOP_FIX.passiveAudits.push("runtime_audit_guard.js");
  try { console.info("[SVR Passive Runtime Audit]", audit); } catch {}
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
