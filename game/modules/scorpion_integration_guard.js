// PHASE-88-SCORPION-INTEGRATION-QUEST-VALIDATION-LOCK
// Lightweight runtime guard for Scorpion poker integration.
// Safe side-effect module: no external dependencies, no site/backend changes.

const BUILD = "PHASE-88-SCORPION-INTEGRATION-QUEST-VALIDATION-LOCK";
const REQUIRED_SCENES = [
  "lobby",
  "seat",
  "reiki",
  "pga",
  "scorpion",
  "store",
  "smoker",
  "reikiRoom",
  "pgaDrive",
  "chipPutt"
];

const REQUIRED_EVENTS = [
  "svr:poker:turn",
  "svr:poker:action",
  "svr:poker:showdown",
  "svr:poker:winner",
  "svr:poker:timer",
  "svr:poker:pot-sweep"
];

function nowIso(){
  try { return new Date().toISOString(); }
  catch { return "unknown"; }
}

function qsa(selector){
  try { return Array.from(document.querySelectorAll(selector)); }
  catch { return []; }
}

function makeRecord(){
  return {
    build: BUILD,
    installedAt: nowIso(),
    status: "installed",
    siteTouched: false,
    sqlTouched: false,
    packageRule: "under-25mb",
    warnings: [],
    errors: [],
    checks: {},
    eventsSeen: {},
    lastEvent: null,
    lastUpdatedAt: nowIso()
  };
}

function evaluateButtons(record){
  const buttons = qsa("[data-scene]").map((el)=>String(el.getAttribute("data-scene") || "").trim()).filter(Boolean);
  const unique = Array.from(new Set(buttons));
  record.checks.sceneButtons = unique;
  record.checks.hasScorpionRoute = unique.some((x)=>/scorpion/i.test(x));
  record.checks.hasSeatRoute = unique.some((x)=>/seat/i.test(x));
  record.checks.hasReikiRoute = unique.some((x)=>/reiki/i.test(x));
  record.checks.hasPgaRoute = unique.some((x)=>/pga|drive|chip/i.test(x));
  record.checks.hasStoreRoute = unique.some((x)=>/store/i.test(x));
  if (!record.checks.hasScorpionRoute) record.warnings.push("Scorpion route was not found in current DOM data-scene buttons.");
  if (!record.checks.hasSeatRoute) record.warnings.push("Seat route was not found in current DOM data-scene buttons.");
}

function evaluateVersion(record){
  const text = (document.body?.innerText || document.documentElement?.innerText || "").slice(0, 50000);
  record.checks.visibleBuildLabel = /PHASE-88|Scorpion Integration|Quest Validation/i.test(text);
  record.checks.oldPhaseLabelsVisible = /PHASE-39|PHASE-48|PHASE-60|PHASE-62/i.test(text);
  if (record.checks.oldPhaseLabelsVisible) record.warnings.push("Old phase label text may still be visible in runtime UI.");
}

function evaluateRuntime(record){
  record.checks.webxrAvailable = !!navigator.xr;
  record.checks.isSecureContext = !!window.isSecureContext;
  record.checks.hasWebglCanvas = qsa("canvas").length > 0;
  record.checks.hasHud = !!document.getElementById("hud");
  record.checks.hasSceneNav = !!document.getElementById("sceneNav");
}

function markEvent(record, eventName, detail){
  record.eventsSeen[eventName] = (record.eventsSeen[eventName] || 0) + 1;
  record.lastEvent = {
    name: eventName,
    at: nowIso(),
    detail: detail || null
  };
  record.lastUpdatedAt = nowIso();
}

function installEventWatchers(record){
  for (const eventName of REQUIRED_EVENTS){
    window.addEventListener(eventName, (ev)=>markEvent(record, eventName, ev?.detail || null), { passive: true });
  }
  window.addEventListener("error", (ev)=>{
    record.errors.push({ type: "error", at: nowIso(), message: ev?.message || String(ev) });
    record.status = "runtime-error-seen";
  });
  window.addEventListener("unhandledrejection", (ev)=>{
    record.errors.push({ type: "unhandledrejection", at: nowIso(), message: String(ev?.reason || ev) });
    record.status = "runtime-error-seen";
  });
}

function refresh(record){
  record.warnings = [];
  evaluateButtons(record);
  evaluateVersion(record);
  evaluateRuntime(record);
  record.lastUpdatedAt = nowIso();
  return record;
}

function install(){
  if (window.SVR_SCORPION_INTEGRATION_GUARD?.build === BUILD){
    return window.SVR_SCORPION_INTEGRATION_GUARD;
  }
  const record = makeRecord();
  installEventWatchers(record);
  record.refresh = ()=>refresh(record);
  record.assertReady = ()=>{
    refresh(record);
    return {
      ok: record.errors.length === 0,
      build: record.build,
      checks: record.checks,
      warnings: record.warnings.slice(),
      errors: record.errors.slice()
    };
  };
  window.SVR_SCORPION_INTEGRATION_GUARD = record;
  window.SVR_PHASE_88_LOCK = record;
  const run = ()=>refresh(record);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  setTimeout(run, 1500);
  setTimeout(run, 5000);
  return record;
}

install();

export { BUILD, install as installScorpionIntegrationGuard };
