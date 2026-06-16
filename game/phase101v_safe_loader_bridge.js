// Phase 101V - Safe Loader Bridge
// Late-loads the Quest controller portal QA module after Phase 101T.

const LABEL = "PHASE-101V-SAFE-LOADER-BRIDGE-LOCK";

window.SVR_PHASE101V_SAFE_LOADER_BRIDGE = {
  build: LABEL,
  active: true,
  purpose: "Safely bridge Phase 101U Quest controller portal QA after Phase 101T without changing core boot recovery.",
  bootTouched: false,
  siteTouched: false,
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
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.error = String(error?.message || error);
    window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.checkedAt = new Date().toISOString();
    return null;
  }
}

window.SVR_LOAD_PHASE101U_QA = loadQuestPortalQa;

setTimeout(loadQuestPortalQa, 1200);
setTimeout(loadQuestPortalQa, 4200);
setTimeout(loadQuestPortalQa, 8200);
