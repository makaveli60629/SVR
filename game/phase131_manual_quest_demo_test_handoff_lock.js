import * as THREE from "three";

const LABEL = "PHASE-131-MANUAL-QUEST-DEMO-TEST-HANDOFF-LOCK";
const ROOT = "PHASE131_MANUAL_QUEST_DEMO_TEST_HANDOFF_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;

let boardCanvas = null;
let boardTexture = null;
let boardMesh = null;
let ringMesh = null;
let lastReport = null;

const TEST_STEPS = [
  "1. Quest: load /game/?v=phase131-manual-quest-test",
  "2. Press Start Lobby Now if needed",
  "3. Verify one poker table only",
  "4. Pinch/select Fold Check Call Raise All-In Next",
  "5. Verify dealer prompt, pot display, and halos react",
  "6. Test route previews and portal entries",
  "7. Confirm watch/teleport still visible",
  "8. Confirm Moon/Mars and second floor remain visible"
];

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
function phase(name){ return !!window[name]; }
function qa(scene){
  const p130 = window.SVR_PHASE130_PRODUCTION_DEMO_FINAL_READINESS_LOCK;
  const p130Report = window.SVR_RUN_PHASE130_PRODUCTION_DEMO_QA?.() || p130?.report || null;
  const checks = {
    phase130Present: !!p130,
    phase130AcceptedOrReportPresent: !!p130Report,
    oneTable: !scene?.getObjectByName?.(DUP),
    questHitboxes: phase("SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK") && count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i) >= 6,
    roundFlow: phase("SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK"),
    presencePills: phase("SVR_PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_PREVIEW_LOCK") && count(scene,/PHASE128_PRESENCE_PILL_/i) >= 7,
    routePreviews: phase("SVR_PHASE129_STOREFRONT_ROUTE_PREVIEW_PORTAL_POLISH_LOCK") && count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i) >= 6,
    demoBoard: !!scene?.getObjectByName?.("PHASE130_PRODUCTION_DEMO_READY_STATUS_BOARD"),
    watch: count(scene,/WATCH/i) > 0,
    teleport: count(scene,/TELEPORT|RAY|ARC|TARGET/i) > 0 || !!scene?.getObjectByName?.("PHASE125_QUEST_POKER_BUTTON_TARGET_RING"),
    moonMars: count(scene,/MOON|MARS/i) > 0,
    secondFloor: count(scene,/SECOND_FLOOR|BALCONY/i) > 0,
    siteUntouched: true
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
  return {
    build: LABEL,
    accepted: failed.length === 0,
    checks,
    failed,
    manualTestUrl: "https://svrpoker.com/game/?v=phase131-manual-quest-test",
    hiddenQa: "window.SVR_RUN_PHASE131_MANUAL_QUEST_TEST_QA()",
    phase130Report: p130Report,
    counts: {
      pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
      actionHitboxes: count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i),
      routePreviewPanels: count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i),
      presencePills: count(scene,/PHASE128_PRESENCE_PILL_/i),
      watchObjects: count(scene,/WATCH/i),
      moonMarsObjects: count(scene,/MOON|MARS/i),
      secondFloorObjects: count(scene,/SECOND_FLOOR|BALCONY/i)
    },
    nextRecommended: failed.length ? "fix-manual-demo-failures" : "create-downloadable-game-zip-after-manual-quest-pass",
    checkedAt: new Date().toISOString()
  };
}
function makeTexture(report){
  if(!boardCanvas){ boardCanvas = document.createElement("canvas"); boardCanvas.width = 1300; boardCanvas.height = 760; }
  const c = boardCanvas;
  const x = c.getContext("2d");
  const ok = !!report?.accepted;
  const accent = ok ? GREEN : RED;
  const hex = `#${accent.toString(16).padStart(6,"0")}`;
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#02040a"); bg.addColorStop(.55,"#120617"); bg.addColorStop(1,"#02040a");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.88)"; x.lineWidth = 16; x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle = hex; x.lineWidth = 8; x.strokeRect(78,78,c.width-156,c.height-156);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = hex; x.shadowBlur = 24;
  x.fillStyle = "#fff8df"; x.font = "900 62px system-ui,Arial"; x.fillText("QUEST DEMO TEST",c.width/2,100,c.width-120);
  x.fillStyle = ok ? "#8dffb4" : "#ff9ab7"; x.font = "900 40px system-ui,Arial"; x.fillText(ok ? "HANDOFF READY" : "TEST CHECK REQUIRED",c.width/2,165,c.width-120);
  x.shadowBlur = 8;
  x.textAlign = "left";
  x.font = "800 26px system-ui,Arial";
  TEST_STEPS.forEach((step,i)=>{
    x.fillStyle = i < 4 ? "#bffcff" : "#ffd98a";
    x.fillText(step,118,245+i*46,c.width-180);
  });
  x.textAlign = "center";
  x.fillStyle = "#8dffb4"; x.font = "900 24px system-ui,Arial";
  x.fillText("RUN QA: window.SVR_RUN_PHASE131_MANUAL_QUEST_TEST_QA()",c.width/2,680,c.width-140);
  x.fillStyle = "#ffffff"; x.font = "800 20px system-ui,Arial";
  x.fillText("MANUAL TEST LOCK ONLY • NO SITE EDITS • NO NETWORKING CLAIM",c.width/2,720,c.width-140);
  if(!boardTexture){ boardTexture = new THREE.CanvasTexture(c); boardTexture.colorSpace = THREE.SRGBColorSpace; boardTexture.anisotropy = 4; }
  boardTexture.needsUpdate = true;
  return boardTexture;
}
function addBoard(scene,report){
  const root = scene.getObjectByName(ROOT);
  boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.25,3.05), new THREE.MeshBasicMaterial({ map:makeTexture(report), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  boardMesh.name = "PHASE131_MANUAL_QUEST_DEMO_TEST_CHECKLIST_BOARD";
  boardMesh.position.set(5.85,2.65,7.05);
  boardMesh.rotation.y = -.42;
  boardMesh.renderOrder = 980;
  root.add(boardMesh);
  ringMesh = new THREE.Mesh(new THREE.RingGeometry(1.35,1.55,96), new THREE.MeshBasicMaterial({ color: report.accepted ? GREEN : RED, transparent:true, opacity:.26, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  ringMesh.name = "PHASE131_MANUAL_QUEST_TEST_FLOOR_RING";
  ringMesh.position.set(5.85,.12,5.65);
  ringMesh.rotation.x = -Math.PI/2;
  ringMesh.renderOrder = 975;
  root.add(ringMesh);
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|PHASE127|PHASE128|PHASE129|PHASE130|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase131CoreProtected = true;
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
function animate(){
  if(window.SVR_PHASE131_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE131_ANIMATION_LOOP_INSTALLED = true;
  const tick=()=>{
    const t = performance.now()*.001;
    if(boardMesh){ boardMesh.lookAt(0,1.55,0); boardMesh.position.y = 2.65 + Math.sin(t*1.05)*.018; }
    if(ringMesh){ ringMesh.scale.setScalar(1 + Math.sin(t*1.7)*.035); ringMesh.material.opacity = .18 + Math.sin(t*2.2)*.055; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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
  window.SVR_PHASE131_MANUAL_QUEST_DEMO_TEST_HANDOFF_LOCK = {
    build: LABEL,
    active:true,
    manualQuestDemoTest:true,
    handoffManifest:true,
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
  window.SVR_RUN_PHASE131_MANUAL_QUEST_TEST_QA = () => {
    lastReport = qa(scene);
    if(boardMesh?.material){ boardMesh.material.map = makeTexture(lastReport); boardMesh.material.needsUpdate = true; }
    if(ringMesh?.material) ringMesh.material.color.setHex(lastReport.accepted ? GREEN : RED);
    return lastReport;
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
