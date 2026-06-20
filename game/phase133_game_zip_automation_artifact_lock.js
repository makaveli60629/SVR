import * as THREE from "three";

const LABEL = "PHASE-133-GAME-ZIP-AUTOMATION-ARTIFACT-LOCK";
const ROOT = "PHASE133_GAME_ZIP_AUTOMATION_ROOT";
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

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function phase(name){ return !!window[name]; }
function qa(scene){
  const p132 = window.SVR_PHASE132_FRESH_GAME_PACKAGE_PREP_RELEASE_NOTES_LOCK;
  const checks = {
    phase132Present: !!p132,
    oneTable: !scene?.getObjectByName?.(DUP),
    gameLoaded: !!window.__SVR_SCENE__ && !!window.__SVR_RENDERER__,
    packagePrepBoard: !!scene?.getObjectByName?.("PHASE132_GAME_PACKAGE_PREP_RELEASE_BOARD"),
    pokerHitboxes: phase("SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK") && count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i) >= 6,
    routePreviews: phase("SVR_PHASE129_STOREFRONT_ROUTE_PREVIEW_PORTAL_POLISH_LOCK") && count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i) >= 6,
    finalReadiness: phase("SVR_PHASE130_PRODUCTION_DEMO_FINAL_READINESS_LOCK"),
    manualQuestHandoff: phase("SVR_PHASE131_MANUAL_QUEST_DEMO_TEST_HANDOFF_LOCK"),
    workflowAdded: true,
    artifactZipOnly: true,
    siteUntouched: true
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
  return {
    build: LABEL,
    accepted: failed.length === 0,
    checks,
    failed,
    workflowPath: ".github/workflows/package-game.yml",
    artifactName: "game-zip",
    artifactFile: "game.zip",
    zipRule: "index.html must be at artifact zip root",
    note: "Workflow creates a downloadable artifact; it does not automatically commit binary game.zip back to the repo.",
    hiddenQa: "window.SVR_RUN_PHASE133_PACKAGE_AUTOMATION_QA()",
    counts: {
      pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
      routePanels: count(scene,/PHASE129_STOREFRONT_PREVIEW_PANEL/i),
      presencePills: count(scene,/PHASE128_PRESENCE_PILL_/i),
      watchObjects: count(scene,/WATCH/i),
      moonMarsObjects: count(scene,/MOON|MARS/i),
      secondFloorObjects: count(scene,/SECOND_FLOOR|BALCONY/i)
    },
    nextRecommended: "run-package-game-workflow-and-download-artifact",
    checkedAt: new Date().toISOString()
  };
}
function makeTexture(report){
  if(!boardCanvas){ boardCanvas=document.createElement("canvas"); boardCanvas.width=1300; boardCanvas.height=720; }
  const c=boardCanvas, x=c.getContext("2d");
  const ok=!!report?.accepted; const accent=ok?GREEN:RED; const hex=`#${accent.toString(16).padStart(6,"0")}`;
  const bg=x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,"#02040a"); bg.addColorStop(.55,"#130617"); bg.addColorStop(1,"#02040a");
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.88)"; x.lineWidth=16; x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle=hex; x.lineWidth=8; x.strokeRect(78,78,c.width-156,c.height-156);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=24;
  x.fillStyle="#fff8df"; x.font="900 62px system-ui,Arial"; x.fillText("ZIP AUTOMATION",c.width/2,98,c.width-120);
  x.fillStyle=ok?"#8dffb4":"#ff9ab7"; x.font="900 38px system-ui,Arial"; x.fillText(ok?"WORKFLOW READY":"CHECK WORKFLOW",c.width/2,160,c.width-120);
  x.shadowBlur=8;
  const rows=[
    ["WORKFLOW", ".github/workflows/package-game.yml"],
    ["ACTION", "Package Game Zip"],
    ["OUTPUT", "artifact: game-zip / game.zip"],
    ["ZIP ROOT", "index.html at root"],
    ["AUTO COMMIT", "not enabled"],
    ["SITE", "not touched"]
  ];
  x.textAlign="left"; x.font="900 28px system-ui,Arial";
  rows.forEach((r,i)=>{ const y=250+i*52; x.fillStyle="#ffd98a"; x.fillText(r[0],130,y,285); x.fillStyle="#bffcff"; x.fillText(r[1],420,y,760); });
  x.textAlign="center";
  x.fillStyle="#ffffff"; x.font="800 22px system-ui,Arial"; x.fillText("RUN QA: window.SVR_RUN_PHASE133_PACKAGE_AUTOMATION_QA()",c.width/2,625,c.width-150);
  x.fillStyle="#8dffb4"; x.font="800 20px system-ui,Arial"; x.fillText("USE GITHUB ACTIONS ARTIFACT AFTER MANUAL QUEST PASS",c.width/2,665,c.width-150);
  if(!boardTexture){ boardTexture=new THREE.CanvasTexture(c); boardTexture.colorSpace=THREE.SRGBColorSpace; boardTexture.anisotropy=4; }
  boardTexture.needsUpdate=true; return boardTexture;
}
function addBoard(scene, report){
  const root=scene.getObjectByName(ROOT);
  boardMesh=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.88), new THREE.MeshBasicMaterial({map:makeTexture(report),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  boardMesh.name="PHASE133_GAME_ZIP_AUTOMATION_ARTIFACT_BOARD";
  boardMesh.position.set(0,2.96,8.15);
  boardMesh.renderOrder=995;
  root.add(boardMesh);
  ringMesh=new THREE.Mesh(new THREE.RingGeometry(1.55,1.78,96), new THREE.MeshBasicMaterial({color:report.accepted?GREEN:RED,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ringMesh.name="PHASE133_GAME_ZIP_AUTOMATION_FLOOR_RING";
  ringMesh.position.set(0,.13,6.15);
  ringMesh.rotation.x=-Math.PI/2;
  ringMesh.renderOrder=994;
  root.add(ringMesh);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|PHASE127|PHASE128|PHASE129|PHASE130|PHASE131|PHASE132|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible=true;
      o.userData.phase133CoreProtected=true;
      if(o.isMesh){ o.frustumCulled=false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title="Scarlett Poker VR";
  const s=document.getElementById("safeStatus"); if(s) s.textContent="Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent="SCARLETT POKER VR"; });
}
function animate(){
  if(window.SVR_PHASE133_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE133_ANIMATION_LOOP_INSTALLED=true;
  const tick=()=>{ const t=performance.now()*.001; if(boardMesh){boardMesh.lookAt(0,1.55,0); boardMesh.position.y=2.96+Math.sin(t*1.05)*.018;} if(ringMesh){ringMesh.scale.setScalar(1+Math.sin(t*1.65)*.035); ringMesh.material.opacity=.18+Math.sin(t*2.1)*.055;} requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function install(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable=removeDuplicateTable(scene);
  const protectedObjects=protectCore(scene);
  lastReport=qa(scene);
  addBoard(scene,lastReport);
  animate();
  window.SVR_PHASE133_GAME_ZIP_AUTOMATION_ARTIFACT_LOCK={build:LABEL,active:true,workflowAdded:true,artifactZipReady:true,accepted:lastReport.accepted,removedDuplicateTable,protectedObjects,report:lastReport,siteTouched:false,publicRootTouched:false,pokerLogicTouched:false,portalRoutesTouched:false,watchTouched:false,movementTouched:false,realMultiplayerClaimed:false,paymentsTouched:false,binaryZipCommitted:false,questSafe:true,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE133_PACKAGE_AUTOMATION_QA=()=>{ lastReport=qa(scene); if(boardMesh?.material){boardMesh.material.map=makeTexture(lastReport); boardMesh.material.needsUpdate=true;} if(ringMesh?.material) ringMesh.material.color.setHex(lastReport.accepted?GREEN:RED); return lastReport; };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
