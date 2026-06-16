// Phase 101V - Safe Loader Bridge
// Late-loads the Quest controller portal QA module after Phase 101T,
// then loads Phase 101W live movement/portal verification.

const LABEL = "PHASE-101V-SAFE-LOADER-BRIDGE-LOCK";

window.SVR_PHASE101V_SAFE_LOADER_BRIDGE = {
  build: LABEL,
  active: true,
  purpose: "Safely bridge Quest controller portal QA and live movement verification after Phase 101T without changing core boot recovery.",
  bootTouched: false,
  siteTouched: false,
  phase101wBridge: true,
  checkedAt: new Date().toISOString()
};

async function loadQuestPortalQa(){
  if(window.__SVR_PHASE101V_LOADED_101U__) return window.SVR_PHASE101U_QUEST_QA || null;
  window.__SVR_PHASE101V_LOADED_101U__ = true;
  try {
    const mod = await import("./phase101u_quest_controller_portal_teleport_qa.js?v=phase101v-bridge");
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.loaded101U = true;
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.checkedAt = new Date().toISOString();
    window.SVR_LOCKED_FINAL_BUILD = LABEL;
    return mod;
  } catch (error) {
    window.__SVR_PHASE101V_LOADED_101U__ = false;
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.error101U = String(error?.message || error);
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.checkedAt = new Date().toISOString();
    return null;
  }
}

async function loadQuestLiveVerify(){
  if(window.__SVR_PHASE101V_LOADED_101W__) return window.SVR_PHASE101W_QUEST_LIVE_VERIFY || null;
  window.__SVR_PHASE101V_LOADED_101W__ = true;
  try {
    await loadQuestPortalQa();
    const mod = await import("./phase101w_quest_live_movement_portal_verification.js?v=phase101w-bridge");
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.loaded101W = true;
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.checkedAt = new Date().toISOString();
    return mod;
  } catch (error) {
    window.__SVR_PHASE101V_LOADED_101W__ = false;
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.error101W = String(error?.message || error);
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.checkedAt = new Date().toISOString();
    return null;
  }
}

window.SVR_LOAD_PHASE101U_QA = loadQuestPortalQa;
window.SVR_LOAD_PHASE101W_VERIFY = loadQuestLiveVerify;

setTimeout(loadQuestPortalQa, 1200);
setTimeout(loadQuestLiveVerify, 2400);
setTimeout(loadQuestPortalQa, 4200);
setTimeout(loadQuestLiveVerify, 5400);
setTimeout(loadQuestPortalQa, 8200);
setTimeout(loadQuestLiveVerify, 9600);
