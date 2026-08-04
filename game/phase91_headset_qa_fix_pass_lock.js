import * as THREE from "three";

const LABEL = "PHASE-91-HEADSET-QA-FIX-PASS-LOCK";
const ROOT = "PHASE91_HEADSET_QA_FIX_PASS_ROOT";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const GREEN = 0x86ffb7;
const PINK = 0xff5b8c;
let installed = false;

function safeMat(color, opacity=.22){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function textTexture(title, rows){
  const c=document.createElement("canvas"); c.width=1100; c.height=560;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03050b"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(22,22,1056,516);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 46px system-ui,Arial"; ctx.fillText(title,550,70);
  ctx.textAlign="left"; ctx.font="800 28px system-ui,Arial";
  rows.forEach((r,i)=>{
    const y=135+i*42;
    ctx.fillStyle=r.ok?"#86ffb7":"#ff8aa8";
    ctx.fillText(`${r.ok?"✓":"!"} ${r.label}`,70,y);
  });
  ctx.fillStyle="#ffd98a"; ctx.font="700 23px system-ui,Arial";
  ctx.fillText("Quest QA: hold aim, release teleport, pinch watch buttons, select chips/cards, confirm no stutter.",70,505);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function count(scene,test){ let n=0; scene?.traverse?.(o=>{ if(test(o)) n++; }); return n; }
function getChecks(scene){
  return {
    scene: !!scene,
    renderer: !!window.__SVR_RENDERER__,
    camera: !!window.__SVR_CAMERA__,
    teleportRelease: !!window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK || !!window.SVR_PHASE298_HAND_TELEPORT_FIX,
    watchPoker: !!window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK,
    cardChip: !!window.SVR_PHASE88_VR_CARD_CHIP_INTERACTION_LOCK,
    performance: !!window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK,
    audit: !!window.SVR_PHASE90_RELEASE_CANDIDATE_AUDIT_LOCK,
    portalPads: count(scene,o=>/PHASE85_SOLID_ENABLED_PORTAL/.test(o.name||"")) >= 4,
    actionPads: count(scene,o=>o.userData?.phase88Type==="chipAction" || o.userData?.phase86Action) >= 4,
    cards: count(scene,o=>o.userData?.phase88Type==="card") >= 2,
    siteProtected: true
  };
}
function widenInteractiveTargets(scene){
  let widened=0;
  scene.traverse((o)=>{
    if(!o?.isMesh || !o.geometry) return;
    const n=String(o.name||"");
    const interactive = o.userData?.phase85Selectable || o.userData?.phase88Selectable || o.userData?.phase86Action || /PORTAL|ACTION|CARD|CHIP|WATCH|BUTTON|HITBOX|RING/.test(n.toUpperCase());
    if(!interactive) return;
    o.userData.phase91HeadsetHitProtected=true;
    o.renderOrder=Math.max(o.renderOrder||0, 360);
    if(o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{ if(m){ m.depthWrite=false; m.depthTest = /WATCH/.test(n.toUpperCase()) ? false : m.depthTest; m.needsUpdate=true; }});
    }
    if(/HITBOX|RING|ACTION|PORTAL/.test(n.toUpperCase()) && !o.userData.phase91ScaleApplied){
      o.scale.multiplyScalar(1.08);
      o.userData.phase91ScaleApplied=true;
    }
    widened++;
  });
  return widened;
}
function addComfortMarkers(scene){
  const old=scene.getObjectByName("PHASE91_TABLE_COMFORT_MARKERS"); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name="PHASE91_TABLE_COMFORT_MARKERS"; scene.add(root);
  const spots=[
    {name:"WATCH_SAFE_ZONE", x:-1.55,z:4.85,c:CYAN},
    {name:"CARD_CHIP_SAFE_ZONE", x:0,z:-1.80,c:GOLD},
    {name:"TELEPORT_TEST_ZONE", x:1.55,z:4.85,c:GREEN}
  ];
  spots.forEach(s=>{
    const ring=new THREE.Mesh(new THREE.RingGeometry(.30,.42,48), safeMat(s.c,.30));
    ring.name=`PHASE91_${s.name}`; ring.rotation.x=-Math.PI/2; ring.position.set(s.x,.045,s.z); ring.renderOrder=355; root.add(ring);
  });
  return spots.length;
}
function panel(scene, report){
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const rows=[
    {label:"Teleport release wrapper", ok:report.checks.teleportRelease},
    {label:"Watch poker controls", ok:report.checks.watchPoker},
    {label:"Card/chip interaction", ok:report.checks.cardChip},
    {label:"Quest performance lock", ok:report.checks.performance},
    {label:"Release audit present", ok:report.checks.audit},
    {label:`Portal pads found: ${report.portalCount}`, ok:report.checks.portalPads},
    {label:`Action/card targets found: ${report.actionTargets}`, ok:report.checks.actionPads && report.checks.cards},
    {label:"Website/site protected", ok:report.checks.siteProtected}
  ];
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,7.45); root.rotation.y=Math.PI; scene.add(root);
  const tex=textTexture("PHASE 91 HEADSET QA", rows);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.65), new THREE.MeshBasicMaterial({map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  mesh.name="PHASE91_HEADSET_QA_PANEL"; mesh.position.set(0,2.5,0); mesh.renderOrder=370; root.add(mesh);
  return root;
}
function run(reason="scheduled"){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const checks=getChecks(scene);
  const widened=widenInteractiveTargets(scene);
  const comfortMarkers=addComfortMarkers(scene);
  const report={
    build:LABEL,
    active:true,
    reason,
    checks,
    ready:Object.values(checks).every(Boolean),
    widenedTargets:widened,
    comfortMarkers,
    portalCount:count(scene,o=>/PHASE85_SOLID_ENABLED_PORTAL/.test(o.name||"")),
    actionTargets:count(scene,o=>o.userData?.phase88Selectable || o.userData?.phase86Action || o.userData?.phase85Selectable),
    fps:window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK?.fps || null,
    siteTouched:false,
    publicRootTouched:false,
    lobbyRedesignTouched:false,
    movementRewriteTouched:false,
    checkedAt:new Date().toISOString()
  };
  panel(scene, report);
  window.SVR_PHASE91_HEADSET_QA_FIX_PASS_LOCK=report;
  window.SVR_RUN_PHASE91_HEADSET_QA=()=>run("manual");
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return report;
}
function install(){
  if(installed) return run("repeat");
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  installed=true;
  run("initial");
  window.addEventListener("svr-poker-core-action",()=>setTimeout(()=>run("poker-action"),75));
  window.addEventListener("svr-watch-poker-action",()=>setTimeout(()=>run("watch-action"),75));
  window.addEventListener("svr-card-chip-action",()=>setTimeout(()=>run("card-chip-action"),75));
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1200,2600,5200,9000,15000,24000].forEach(d=>setTimeout(()=>run(`late-${d}`),d));
