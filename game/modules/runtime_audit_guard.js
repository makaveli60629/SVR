// PHASE-93-RUNTIME-AUDIT-GUARD-LOCK
// Game-side only. Runtime audit/phase sync guard for the SVR Poker game track.
// This module does not modify the website or /site. It only validates and records
// game runtime health after boot so stale phase labels and missing modules are easier to catch.

const PHASE = "PHASE-93-RUNTIME-AUDIT-GUARD-LOCK";
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
  if (!String(document.title || "").includes("Phase 93")) document.title = "ScarlettVR Poker • Phase 93 runtime audit guard";
}

function runAudit(){
  setBuildLabel();
  updateVisualLabel();
  const htmlText = document.documentElement?.innerText || document.body?.innerText || "";
  const blockedTermsPresent = textIncludesAny(htmlText, APPROVAL_BLOCKED_TERMS);
  const audit = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals: getMissingGlobals(),
    missingSceneButtons: getMissingButtons(),
    blockedApprovalTermsPresent,
    modules: getModuleStates(),
    ok: false
  };
  audit.ok = audit.missingSceneButtons.length === 0 && audit.blockedApprovalTermsPresent.length === 0;
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
    const audit = runAudit();
    const sig = JSON.stringify({ missing: audit.missingGlobals, buttons: audit.missingSceneButtons, blocked: audit.blockedApprovalTermsPresent, modules: audit.modules });
    if (sig !== lastSig){
      lastSig = sig;
      try { console.info("[SVR Phase 93 Runtime Audit]", audit); } catch {}
    }
    if (runs < 36) setTimeout(loop, 1000);
  };
  setTimeout(loop, 600);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
