// PHASE-94-RUNTIME-AUDIT-GUARD-HOTFIX-LOCK
// Game-side only. Fixes the Phase 93 runtime audit typo and strengthens
// health checks without touching the website or /site.

const PHASE = "PHASE-94-RUNTIME-AUDIT-GUARD-HOTFIX-LOCK";
const REQUIRED_GLOBALS = [
  ["SVR_PLAYABLE_POKER", "playable poker engine"],
  ["SVR_POKER_ACTION_HUD", "desktop/android poker HUD"],
  ["SVR_PHASE91_TABLE_FX", "performance table FX"],
  ["SVR_PHASE92_NPC_BOT_ANIMATION_FX", "NPC bot animation FX"]
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
  return {
    poker: !!poker,
    pokerPhase: pokerState?.phase || null,
    pokerStreet: pokerState?.street || null,
    pokerPot: pokerState?.pot ?? null,
    pokerHud: !!window.SVR_POKER_ACTION_HUD,
    tableFx: !!window.SVR_PHASE91_TABLE_FX,
    npcFx: !!window.SVR_PHASE92_NPC_BOT_ANIMATION_FX,
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
  if (!String(document.title || "").includes("Phase 94")) document.title = "ScarlettVR Poker • Phase 94 runtime audit hotfix";
}
function runAudit(){
  setBuildLabel();
  updateVisualLabel();
  const htmlText = document.documentElement?.innerText || document.body?.innerText || "";
  const blockedApprovalTermsPresent = textIncludesAny(htmlText, APPROVAL_BLOCKED_TERMS);
  const missingGlobals = getMissingGlobals();
  const missingSceneButtons = getMissingButtons();
  const audit = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals,
    missingSceneButtons,
    blockedApprovalTermsPresent,
    modules: getModuleStates(),
    ok: false
  };
  audit.ok = missingGlobals.length === 0 && missingSceneButtons.length === 0 && blockedApprovalTermsPresent.length === 0;
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
      window.SVR_PHASE94_RUNTIME_AUDIT = audit;
      window.SVR_PHASE93_RUNTIME_AUDIT = audit;
    }
    const sig = JSON.stringify({ missing: audit.missingGlobals, buttons: audit.missingSceneButtons, blocked: audit.blockedApprovalTermsPresent, modules: audit.modules, error: audit.error });
    if (sig !== lastSig){
      lastSig = sig;
      try { console.info("[SVR Phase 94 Runtime Audit]", audit); } catch {}
    }
    if (runs < 45) setTimeout(loop, 1000);
  };
  setTimeout(loop, 600);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
