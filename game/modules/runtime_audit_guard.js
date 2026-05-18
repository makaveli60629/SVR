// PHASE-96-RUNTIME-AUDIT-EXPANSION-LOCK
// Game-side only. Expands runtime health reporting to include Phase 95 feedback FX,
// stale phase-label detection, and safer public audit data. No website or /site edits.

const PHASE = "PHASE-96-RUNTIME-AUDIT-EXPANSION-LOCK";
const REQUIRED_GLOBALS = [
  ["SVR_PLAYABLE_POKER", "playable poker engine"],
  ["SVR_POKER_ACTION_HUD", "desktop/android poker HUD"],
  ["SVR_PHASE91_TABLE_FX", "performance table FX"],
  ["SVR_PHASE92_NPC_BOT_ANIMATION_FX", "NPC bot animation FX"],
  ["SVR_PHASE95_POKER_FEEDBACK_FX", "poker feedback FX"]
];
const REQUIRED_SCENE_BUTTONS = ["lobby", "seat", "reiki", "pga", "legends", "sponsor", "scorpion", "pgaDrive", "chipPutt", "storeRoom", "smokerLounge"];
const APPROVAL_BLOCKED_TERMS = ["Trueitive", "Truitive", "trueitive.com", "truitive.com", "Shyona", "Royston"];
const KNOWN_STALE_PHASES = ["PHASE-85", "PHASE-86", "PHASE-87", "PHASE-88", "PHASE-89", "PHASE-90", "PHASE-91", "PHASE-92", "PHASE-93", "PHASE-94", "PHASE-95"];

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
function getVisibleBuildText(){
  const pills = Array.from(document.querySelectorAll(".pill"));
  const buildPill = pills.find(pill => String(pill.textContent || "").includes("BUILD:"));
  return String(buildPill?.textContent || "");
}
function findStaleLabels(){
  const visible = `${document.title || ""}\n${getVisibleBuildText()}\n${document.documentElement.dataset.svrBuild || ""}`;
  return KNOWN_STALE_PHASES.filter(label => visible.includes(label) && !PHASE.includes(label));
}
function getModuleStates(){
  const poker = window.SVR_PLAYABLE_POKER;
  const pokerState = poker?.getState?.();
  const feedback = window.SVR_PHASE95_POKER_FEEDBACK_FX;
  return {
    poker: !!poker,
    pokerPhase: pokerState?.phase || null,
    pokerStreet: pokerState?.street || null,
    pokerPot: pokerState?.pot ?? null,
    pokerAwaitingPlayer: !!pokerState?.awaitingPlayer,
    pokerHud: !!window.SVR_POKER_ACTION_HUD,
    tableFx: !!window.SVR_PHASE91_TABLE_FX,
    npcFx: !!window.SVR_PHASE92_NPC_BOT_ANIMATION_FX,
    feedbackFx: !!feedback,
    feedbackAudioUnlocked: typeof feedback?.audioUnlocked === "function" ? !!feedback.audioUnlocked() : false,
    npcSystem: !!window.SVR_NPC_AVATAR_SYSTEM,
    lowPerf: document.body.classList.contains("svr-low-perf")
  };
}
function setBuildLabel(){
  document.documentElement.dataset.svrBuild = PHASE;
  window.SVR_CURRENT_GAME_PHASE = PHASE;
  window.SVR_GAME_TRACK = "game-side-only";
  window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
}
function updateVisualLabel(){
  const pills = Array.from(document.querySelectorAll(".pill"));
  const buildPill = pills.find(pill => String(pill.textContent || "").includes("BUILD:"));
  if (buildPill) buildPill.textContent = `BUILD: ${PHASE}`;
  if (!String(document.title || "").includes("Phase 96")) document.title = "ScarlettVR Poker • Phase 96 runtime audit expansion";
}
function runAudit(){
  setBuildLabel();
  updateVisualLabel();
  const htmlText = document.documentElement?.innerText || document.body?.innerText || "";
  const blockedApprovalTermsPresent = textIncludesAny(htmlText, APPROVAL_BLOCKED_TERMS);
  const missingGlobals = getMissingGlobals();
  const missingSceneButtons = getMissingButtons();
  const stalePhaseLabels = findStaleLabels();
  const modules = getModuleStates();
  const audit = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals,
    missingSceneButtons,
    blockedApprovalTermsPresent,
    stalePhaseLabels,
    modules,
    expectedSceneButtons: [...REQUIRED_SCENE_BUTTONS],
    ok: false
  };
  audit.ok = missingGlobals.length === 0 && missingSceneButtons.length === 0 && blockedApprovalTermsPresent.length === 0 && stalePhaseLabels.length === 0;
  window.SVR_PHASE96_RUNTIME_AUDIT = audit;
  window.SVR_PHASE94_RUNTIME_AUDIT = audit;
  window.SVR_PHASE93_RUNTIME_AUDIT = audit;
  window.dispatchEvent(new CustomEvent("svr-runtime-audit", { detail: audit }));
  return audit;
}
function boot(){
  setBuildLabel();
  updateVisualLabel();
  let lastSig = "";
  let runs = 0;
  const loop = () => {
    runs += 1;
    let audit;
    try {
      audit = runAudit();
    } catch (err){
      audit = { phase: PHASE, ok: false, error: err?.message || String(err), timestamp: new Date().toISOString() };
      window.SVR_PHASE96_RUNTIME_AUDIT = audit;
      window.SVR_PHASE94_RUNTIME_AUDIT = audit;
      window.SVR_PHASE93_RUNTIME_AUDIT = audit;
    }
    const sig = JSON.stringify({ missing: audit.missingGlobals, buttons: audit.missingSceneButtons, blocked: audit.blockedApprovalTermsPresent, stale: audit.stalePhaseLabels, modules: audit.modules, error: audit.error });
    if (sig !== lastSig){
      lastSig = sig;
      try { console.info("[SVR Phase 96 Runtime Audit]", audit); } catch {}
    }
    if (runs < 60) setTimeout(loop, 1000);
  };
  setTimeout(loop, 600);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
