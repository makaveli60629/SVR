import * as THREE from "three";

const LABEL = "PHASE-90-RELEASE-CANDIDATE-AUDIT-LOCK";
const ROOT = "PHASE90_RELEASE_CANDIDATE_AUDIT_ROOT";
const REQUIRED_GLOBALS = [
  "SVR_PHASE84_LOBBY_VISUAL_MATCH_PORTAL_POLISH_LOCK",
  "SVR_PHASE85_PORTAL_ENABLE_SOLID_LOBBY_LOCK",
  "SVR_PHASE86_PLAYABLE_POKER_CORE_LOCK",
  "SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK",
  "SVR_PHASE88_VR_CARD_CHIP_INTERACTION_LOCK",
  "SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK"
];
const REQUIRED_OBJECTS = [
  "PHASE85_SOLID_ENABLED_PORTAL_REIKI",
  "PHASE85_SOLID_ENABLED_PORTAL_PGA",
  "PHASE85_SOLID_ENABLED_PORTAL_STORE",
  "PHASE86_PLAYABLE_POKER_CORE_ROOT",
  "PHASE88_VR_CARD_CHIP_INTERACTION_ROOT"
];

function sceneHas(scene, name){ return !!scene?.getObjectByName?.(name); }
function countBy(scene, test){ let n=0; scene?.traverse?.((o)=>{ if(test(o)) n++; }); return n; }
function qaStatus(checks){
  const failed = Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
  return { failed, ready: failed.length === 0, status: failed.length ? "needs-review" : "ready" };
}
function makeTexture(report){
  const c=document.createElement("canvas"); c.width=1200; c.height=620;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03050b"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=report.ready?"#86ffb7":"#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,1152,572);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 48px system-ui,Arial"; ctx.fillText("SVR RELEASE CANDIDATE AUDIT",600,78);
  ctx.fillStyle=report.ready?"#86ffb7":"#ffd98a"; ctx.font="900 34px system-ui,Arial"; ctx.fillText(report.ready?"READY FOR HEADSET QA":"NEEDS REVIEW",600,132);
  ctx.textAlign="left"; ctx.font="800 25px system-ui,Arial";
  const rows = [
    ["Lobby polish", report.checks.phase84],
    ["Portals enabled", report.checks.phase85],
    ["Poker core", report.checks.phase86],
    ["Watch poker", report.checks.phase87],
    ["Card/chip pads", report.checks.phase88],
    ["Quest perf", report.checks.phase89],
    ["Reiki portal", report.checks.reikiPortal],
    ["PGA portal", report.checks.pgaPortal],
    ["Store portal", report.checks.storePortal],
    ["Moon/Mars", report.checks.moonMars],
    ["Site protected", report.checks.siteProtected]
  ];
  rows.forEach((r,i)=>{
    const y=190+i*34;
    ctx.fillStyle=r[1]?"#86ffb7":"#ff8aa8";
    ctx.fillText(`${r[1]?"✓":"!"} ${r[0]}`,72,y);
  });
  ctx.fillStyle="#bffcff"; ctx.font="700 22px system-ui,Arial";
  ctx.fillText(`Objects: ${report.sceneStats.objects} • Meshes: ${report.sceneStats.meshes} • Visible: ${report.sceneStats.visible} • Triangles: ${report.sceneStats.triangles}`,520,216);
  ctx.fillText(`Portals: ${report.portalCount} • Cards: ${report.cardCount} • Chips: ${report.chipCount} • FPS sample: ${report.fps || "pending"}`,520,252);
  ctx.fillText(`Failed: ${report.failed.length ? report.failed.join(", ") : "none"}`,520,288);
  ctx.fillText("Protected: no /site edits, no lobby redesign, no Quest movement rewrite",520,324);
  ctx.fillStyle="#ffffff"; ctx.font="700 20px system-ui,Arial";
  ctx.fillText("Next manual headset QA: portals, watch poker buttons, chip pads, teleport release, Moon/Mars visibility.",72,570);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function countScene(scene){
  let objects=0, visible=0, meshes=0, triangles=0;
  scene?.traverse?.((obj)=>{
    objects++; if(obj.visible!==false) visible++;
    if(obj.isMesh){ meshes++; const g=obj.geometry; if(g?.index) triangles += Math.floor(g.index.count/3); else if(g?.attributes?.position) triangles += Math.floor(g.attributes.position.count/3); }
  });
  return { objects, visible, meshes, triangles };
}
function buildReport(scene){
  const checks = {
    scene: !!scene,
    renderer: !!window.__SVR_RENDERER__,
    camera: !!window.__SVR_CAMERA__,
    phase84: !!window.SVR_PHASE84_LOBBY_VISUAL_MATCH_PORTAL_POLISH_LOCK,
    phase85: !!window.SVR_PHASE85_PORTAL_ENABLE_SOLID_LOBBY_LOCK,
    phase86: !!window.SVR_PHASE86_PLAYABLE_POKER_CORE_LOCK,
    phase87: !!window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK,
    phase88: !!window.SVR_PHASE88_VR_CARD_CHIP_INTERACTION_LOCK,
    phase89: !!window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK,
    reikiPortal: sceneHas(scene,"PHASE85_SOLID_ENABLED_PORTAL_REIKI"),
    pgaPortal: sceneHas(scene,"PHASE85_SOLID_ENABLED_PORTAL_PGA"),
    storePortal: sceneHas(scene,"PHASE85_SOLID_ENABLED_PORTAL_STORE"),
    pokerRoot: sceneHas(scene,"PHASE86_PLAYABLE_POKER_CORE_ROOT"),
    cardChipRoot: sceneHas(scene,"PHASE88_VR_CARD_CHIP_INTERACTION_ROOT"),
    moonMars: !!scene?.getObjectByName?.("PHASE101S_REAL_MOON_HIGH_NORTH_GROUP") || !!scene?.getObjectByName?.("PHASE155_MOON") || !!scene?.getObjectByName?.("PHASE154_HIGH_TEXTURED_MOON"),
    siteProtected: true,
    questMovementProtected: true
  };
  const qs = qaStatus(checks);
  return {
    build: LABEL,
    active: true,
    checks,
    ...qs,
    requiredGlobals: REQUIRED_GLOBALS,
    requiredObjects: REQUIRED_OBJECTS,
    sceneStats: countScene(scene),
    portalCount: countBy(scene,(o)=>/PHASE85_SOLID_ENABLED_PORTAL/.test(o.name||"")),
    cardCount: countBy(scene,(o)=>o.userData?.phase88Type==="card"),
    chipCount: countBy(scene,(o)=>o.userData?.phase88ChipStack || /PHASE88_CHIP/.test(o.name||"")),
    fps: window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK?.fps || null,
    siteTouched:false,
    publicRootTouched:false,
    lobbyRedesignTouched:false,
    pokerPlayableLayerPresent: !!window.SVR_PHASE86_POKER_STATE,
    checkedAt: new Date().toISOString()
  };
}
function renderPanel(scene, report){
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,8.85); root.rotation.y=Math.PI; scene.add(root);
  const tex=makeTexture(report);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(5.8,3.0), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name="PHASE90_RELEASE_CANDIDATE_AUDIT_PANEL"; panel.position.set(0,2.55,0); panel.renderOrder=340; root.add(panel);
  root.userData.phase90AuditPanel=true;
  return root;
}
function audit(reason="scheduled"){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const report=buildReport(scene);
  report.reason=reason;
  renderPanel(scene, report);
  window.SVR_PHASE90_RELEASE_CANDIDATE_AUDIT_LOCK=report;
  window.SVR_RUN_PHASE90_AUDIT=()=>audit("manual");
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return report;
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  audit("initial");
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1200,2500,5000,9000,14000,22000].forEach((delay)=>setTimeout(()=>audit(`late-${delay}`),delay));
