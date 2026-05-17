// PHASE-84Z-AUDIT-SCENE-ENABLE-SKYLINE-LOCK
// Runtime-safe guardrails for SVR Poker WebXR builds.
// This module does not rewrite the scene. It records the architecture contract
// and runs a lightweight audit so future updates do not accidentally flatten
// the lobby, remove the moon/sky locks, or break scene routing.

export const SVR_WEBXR_PHASE = "PHASE-84Z-AUDIT-SCENE-ENABLE-SKYLINE-LOCK";

export const SVR_WEBXR_CONTRACT = Object.freeze({
  project: "SVR Poker / ScarlettVR Poker",
  runtime: "Browser WebXR / Three.js modular JavaScript",
  productionSignature: SVR_WEBXR_PHASE,
  siteLocked: true,
  zipLimitMB: 25,
  requiredZones: Object.freeze([
    "lobby",
    "table",
    "seat",
    "reiki",
    "reikiRoom",
    "pga",
    "legends",
    "sponsor",
    "scorpion"
  ]),
  requiredZoneLabels: Object.freeze([
    "Lobby",
    "Table",
    "Seat",
    "Reiki",
    "Zen Den",
    "PGA",
    "Legend",
    "Sponsor",
    "Scorpion"
  ]),
  enabledOptionalScenes: Object.freeze([
    "pgaDrive",
    "chipPutt",
    "storeRoom",
    "smokerLounge"
  ]),
  protectedSceneItems: Object.freeze([
    "permanent moon / mars sky presence",
    "neon purple/cyan accent trims",
    "store portal / store mirror surface",
    "10-second silent winning hand banner",
    "wrist watch quick navigation",
    "private scene routing",
    "Espresso With Cream building ad slot"
  ]),
  inputStrategy: Object.freeze({
    primary: "OpenXR skeletal hand tracking",
    fallback: "Quest/Oculus controller input mapped through hidden controller objects and hand-style proxies",
    controllerMeshPolicy: "Controller objects must remain hidden; visible hands/proxies are allowed",
    snapTurn: "Right-stick left/right = 45-degree snap turn",
    move: "Right-stick up/down = look-forward movement",
    teleport: "Hold A / grip / trigger / hand pinch-fist to aim; release to teleport"
  }),
  reikiApprovalLock: Object.freeze({
    allowed: "SVR branding and AWAITING APPROVAL placeholders only",
    blockedTerms: Object.freeze([
      "Trueitive",
      "Truitive",
      "trueitive.com",
      "truitive.com",
      "Shyona",
      "Royston"
    ])
  })
});

function findMissingButtons(){
  const missing = [];
  for (const zone of SVR_WEBXR_CONTRACT.requiredZones){
    const btn = document.querySelector(`#sceneNav [data-scene="${zone}"]`);
    if (!btn) missing.push(zone);
  }
  return missing;
}

function hasBuildLabel(){
  const html = document.documentElement?.outerHTML || "";
  return html.includes(SVR_WEBXR_PHASE);
}

export function runWebXREnforcerAudit({ log = console.log } = {}){
  const missingZones = findMissingButtons();
  const result = {
    phase: SVR_WEBXR_PHASE,
    ok: missingZones.length === 0 && hasBuildLabel(),
    timestamp: new Date().toISOString(),
    siteLocked: SVR_WEBXR_CONTRACT.siteLocked,
    buildLabelPresent: hasBuildLabel(),
    missingZones,
    requiredZones: [...SVR_WEBXR_CONTRACT.requiredZones],
    inputStrategy: SVR_WEBXR_CONTRACT.inputStrategy,
    protectedSceneItems: [...SVR_WEBXR_CONTRACT.protectedSceneItems]
  };
  window.SVR_WEBXR_ENFORCER = SVR_WEBXR_CONTRACT;
  window.SVR_WEBXR_AUDIT = result;
  try { log("[SVR WEBXR ENFORCER]", result); } catch (_) {}
  return result;
}
