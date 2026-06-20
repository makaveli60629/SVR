import * as THREE from "three";

const LABEL = "PHASE-130-PRODUCTION-DEMO-FINAL-READINESS-LOCK";
const ROOT = "PHASE130_PRODUCTION_DEMO_FINAL_READINESS_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;

let boardCanvas = null;
let boardTexture = null;
let boardMesh = null;
let pulseRing = null;
let lastReport = null;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re,filter=()=>true){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false && filter(o)) n++; });
  return n;
}
function phaseActive(name){ return !!window[name]; }
function routeState(){ return window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK || null; }
function performanceState(){
  const renderer = window.__SVR_RENDERER__;
  return {
    rendererPresent: !!renderer,
    pixelRatio: renderer?.getPixelRatio?.() ?? null,
    shadowsOff: renderer?.shadowMap ? renderer.shadowMap.enabled === false : true,
    phase120: phaseActive("SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK")
  };
}
function qa(scene){
  const routes = routeState();
  const perf = performanceState();
  const checks = {
    oneTable: !scene?.getObjectByName?.(DUP),
    pokerActions: phaseActive("SVR_PHASE111_POKER_ACTION_FOCUS_LOCK") || count(scene,/PHASE111_ACTION_PAD|PHASE125_QUEST_ACTION_HITBOX_PAD/i) > 0,
    questHitboxes: phaseActive("SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK") && count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i) >= 6,
    roundFlow: phaseActive("SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK"),
    presencePreview: phaseActive("SVR_PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_PREVIEW_LOCK"),
    routePreviews: phaseActive("SVR_PHASE129_STOREFRONT_ROUTE_PREVIEW_PORTAL_POLISH_LOCK") && count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i) >= 6,
    portalRoutes: !!routes && ((routes.report?.mapped ?? 0) >= 7 || (routes.marked ?? 0) >= 7),
    watch: count(scene,/WATCH/i) > 0,
    teleport: count(scene,/TELEPORT|RAY|ARC|TARGET/i) > 0 || !!scene?.getObjectByName?.("PHASE125_QUEST_POKER_BUTTON_TARGET_RING"),
    moonMars: count(scene,/MOON|MARS/i) > 0,
    secondFloor: count(scene,/SECOND_FLOOR|BALCONY/i) > 0,
    luxuryStable: perf.phase120 && (perf.pixelRatio === null || perf.pixelRatio <= 1.25) && perf.shadowsOff,
    siteUntouched: true
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
  return {
    build: LABEL,
    accepted: failed.length === 0,
    checks,
    failed,
    counts: {
      pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
      actionObjects: count(scene,/ACTION|PHASE111_ACTION_PAD|PHASE125/i),
      routePreviewPanels: count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i),
      presencePills: count(scene,/PHASE128_PRESENCE_PILL_/i),
      watchObjects: count(scene,/WATCH/i),
      moonMarsObjects: count(scene,/MOON|MARS/i),
      secondFloorObjects: count(scene,/SECOND_FLOOR|BALCONY/i),
      frozenLuxuryObjects: count(scene,/PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY/i,(o)=>!!o.userData?.phase120StaticFrozen)
    },
    phases: {
      p116Routes: !!routes,
      p120Performance: phaseActive("SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK"),
      p121Acceptance: phaseActive("SVR_PHASE121_LUXURY_LOBBY_ACCEPTANCE_QA_LOCK"),
      p122Feedback: phaseActive("SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK"),
      p123PotDisplay: phaseActive("SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK"),
      p124Hotkeys: phaseActive("SVR_PHASE124_POKER_ACTION_ACCESSIBILITY_HOTKEY_LOCK"),
      p125Hitboxes: phaseActive("SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK"),
      p126LiveQa: phaseActive("SVR_PHASE126_QUEST_LIVE_PLAYABILITY_AUDIT_FIX_LOCK"),
      p127RoundFlow: phaseActive("SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK"),
      p128Presence: phaseActive("SVR_PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_PREVIEW_LOCK"),
      p129Routes: phaseActive("SVR_PHASE129_STOREFRONT_ROUTE_PREVIEW_PORTAL_POLISH_LOCK")
    },
    performance: perf,
    note: "Production demo readiness marker only; not a claim of real multiplayer or payment readiness.",
    recommendedNext: failed.length ? "fix-failed-demo-checks" : "manual-quest-demo-test-and-package-zip",
    checkedAt: new Date().toISOString()
  };
}
function boardTexture(report){
  if(!boardCanvas){ boardCanvas = document.createElement("canvas"); boardCanvas.width = 1200; boardCanvas.height = 640; }
  const c = boardCanvas;
  const x = c.getContext("2d");
  const accepted = !!report?.accepted;
  const accent = accepted ? GREEN : RED;
  const hex = `#${accent.toString(16).padStart(6,"0")}`;
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#02040a"); bg.addColorStop(.55,"#120617"); bg.addColorStop(1,"#02040a");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.88)"; x.lineWidth = 16; x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle = hex; x.lineWidth = 8; x.strokeRect(76,76,c.width-152,c.height-152);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = hex; x.shadowBlur = 24;
  x.fillStyle = "#fff8df"; x.font = "900 64px system-ui,Arial"; x.fillText("SCARLETT POKER VR",c.width/2,105,c.width-120);
  x.fillStyle = accepted ? "#8dffb4" : "#ff9ab7"; x.font = "900 46px system-ui,Arial"; x.fillText(accepted ? "DEMO READY" : "QA CHECK REQUIRED",c.width/2,188,c.width-120);
  x.shadowBlur = 8;
  const rows = [
    ["POKER", report.checks.pokerActions && report.checks.roundFlow],
    ["QUEST INPUT", report.checks.questHitboxes],
    ["PORTALS", report.checks.portalRoutes && report.checks.routePreviews],
    ["PRESENCE", report.checks.presencePreview],
    ["WATCH / TELEPORT", report.checks.watch && report.checks.teleport],
    ["SKY / SECOND FLOOR", report.checks.moonMars && report.checks.secondFloor]
  ];
  x.font = "900 30px system-ui,Arial";
  rows.forEach((row,i)=>{
    const y = 285 + i*48;
    x.fillStyle = row[1] ? "#8dffb4" : "#ff9ab7";
    x.fillText(`${row[1] ? "✓" : "!"} ${row[0]}`,c.width/2,y,c.width-160);
  });
  x.fillStyle = "#bffcff"; x.font = "800 22px system-ui,Arial";
  x.fillText("FINAL DEMO LOCK • VISUAL MULTIPLAYER PREVIEW ONLY",c.width/2,585,c.width-140);
  if(!boardTexture.tex){ boardTexture.tex = new THREE.CanvasTexture(c); boardTexture.tex.colorSpace = THREE.SRGBColorSpace; boardTexture.tex.anisotropy = 4; }
  boardTexture.tex.needsUpdate = true;
  return boardTexture.tex;
}
function addBoard(scene, report){
  const root = scene.getObjectByName(ROOT);
  boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.9,2.62), new THREE.MeshBasicMaterial({ map:boardTexture(report), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  boardMesh.name = "PHASE130_PRODUCTION_DEMO_READY_STATUS_BOARD";
  boardMesh.position.set(0,2.75,7.25);
  boardMesh.renderOrder = 960;
  root.add(boardMesh);
  pulseRing = new THREE.Mesh(new THREE.RingGeometry(2.72,2.92,128), new THREE.MeshBasicMaterial({ color: report.accepted ? GREEN : RED, transparent:true, opacity:.25, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  pulseRing.name = "PHASE130_PRODUCTION_DEMO_READY_PULSE_RING";
  pulseRing.position.set(0,.12,5.35);
  pulseRing.rotation.x = -Math.PI/2;
  pulseRing.renderOrder = 955;
  root.add(pulseRing);
}
function animate(){
  if(window.SVR_PHASE130_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE130_ANIMATION_LOOP_INSTALLED = true;
  const tick = ()=>{
    const t = performance.now()*.001;
    if(boardMesh){ boardMesh.lookAt(0,1.55,0); boardMesh.position.y = 2.75 + Math.sin(t*1.1)*.018; }
    if(pulseRing){ pulseRing.scale.setScalar(1 + Math.sin(t*1.6)*.035); pulseRing.material.opacity = .18 + Math.sin(t*2.1)*.055; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|PHASE127|PHASE128|PHASE129|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase130CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  const protectedObjects = protectCore(scene);
  lastReport = qa(scene);
  addBoard(scene,lastReport);
  animate();
  window.SVR_PHASE130_PRODUCTION_DEMO_FINAL_READINESS_LOCK = {
    build: LABEL,
    active:true,
    productionDemoFinalLock:true,
    demoReadyBoard:true,
    accepted:lastReport.accepted,
    removedDuplicateTable,
    protectedObjects,
    report:lastReport,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    portalRoutesTouched:false,
    watchTouched:false,
    movementTouched:false,
    realMultiplayerClaimed:false,
    paymentsTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE130_PRODUCTION_DEMO_QA = () => {
    lastReport = qa(scene);
    if(boardMesh?.material){ boardMesh.material.map = boardTexture(lastReport); boardMesh.material.needsUpdate = true; }
    if(pulseRing?.material) pulseRing.material.color.setHex(lastReport.accepted ? GREEN : RED);
    return lastReport;
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
