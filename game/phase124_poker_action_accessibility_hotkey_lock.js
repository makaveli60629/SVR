import * as THREE from "three";

const LABEL = "PHASE-124-POKER-ACTION-ACCESSIBILITY-HOTKEY-LOCK";
const ROOT = "PHASE124_POKER_ACTION_ACCESSIBILITY_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;

const ACTIONS = [
  { key:"fold", label:"FOLD", hotkey:"F", code:"KeyF", color:RED },
  { key:"check", label:"CHECK", hotkey:"C", code:"KeyC", color:CYAN },
  { key:"call", label:"CALL", hotkey:"V", code:"KeyV", color:GREEN },
  { key:"raise", label:"RAISE", hotkey:"R", code:"KeyR", color:GOLD },
  { key:"all_in", label:"ALL-IN", hotkey:"A", code:"KeyA", color:0xffffff },
  { key:"next", label:"NEXT", hotkey:"H", code:"KeyH", color:PURPLE }
];

let state = {
  lastDispatched:null,
  lastHotkey:null,
  eventCount:0,
  pulse:0,
  activeColor:GOLD,
  checkedAt:null
};
let stripMesh = null;
let confirmMesh = null;
let stripCanvas = null;
let stripTexture = null;
let confirmCanvas = null;
let confirmTexture = null;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function canvasTexture(canvas){ const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex; }
function stripTex(){
  if(!stripCanvas){ stripCanvas=document.createElement("canvas"); stripCanvas.width=1400; stripCanvas.height=340; }
  const c=stripCanvas, x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#03050b"); g.addColorStop(.5,"#150813"); g.addColorStop(1,"#02040a");
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.86)"; x.lineWidth=12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle="#fff8df"; x.font="900 46px system-ui,Arial"; x.fillText("POKER ACTION HOTKEYS",c.width/2,70,c.width-100);
  const cellW=(c.width-120)/ACTIONS.length;
  ACTIONS.forEach((a,i)=>{
    const left=60+i*cellW;
    const hex=`#${a.color.toString(16).padStart(6,"0")}`;
    x.strokeStyle=hex; x.lineWidth=5; x.strokeRect(left+10,118,cellW-20,145);
    x.fillStyle="rgba(255,255,255,.035)"; x.fillRect(left+12,120,cellW-24,141);
    x.shadowColor=hex; x.shadowBlur=16;
    x.fillStyle="#ffffff"; x.font="900 38px system-ui,Arial"; x.fillText(a.label,left+cellW/2,162,cellW-30);
    x.shadowBlur=8;
    x.fillStyle="#bffcff"; x.font="900 34px system-ui,Arial"; x.fillText(a.hotkey,left+cellW/2,218,cellW-30);
  });
  x.shadowBlur=0; x.fillStyle="#8dffb4"; x.font="800 22px system-ui,Arial"; x.fillText("DESKTOP TEST FALLBACK • QUEST HAND-PINCH AND TABLE BUTTONS STILL ACTIVE",c.width/2,300,c.width-100);
  if(!stripTexture) stripTexture=canvasTexture(c); else stripTexture.needsUpdate=true;
  return stripTexture;
}
function confirmTex(){
  if(!confirmCanvas){ confirmCanvas=document.createElement("canvas"); confirmCanvas.width=900; confirmCanvas.height=300; }
  const c=confirmCanvas, x=c.getContext("2d");
  const color=state.activeColor||GOLD; const hex=`#${color.toString(16).padStart(6,"0")}`;
  x.clearRect(0,0,c.width,c.height);
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#02040a"); g.addColorStop(.55,"#120617"); g.addColorStop(1,"#02040a");
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.82)"; x.lineWidth=10; x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle=hex; x.lineWidth=6; x.strokeRect(54,54,c.width-108,c.height-108);
  x.textAlign="center"; x.textBaseline="middle";
  x.shadowColor=hex; x.shadowBlur=18;
  x.fillStyle="#fff8df"; x.font="900 52px system-ui,Arial"; x.fillText(state.lastDispatched ? `CONFIRMED: ${state.lastDispatched.toUpperCase().replace("_","-")}` : "READY",c.width/2,122,c.width-90);
  x.shadowBlur=8; x.fillStyle="#bffcff"; x.font="800 28px system-ui,Arial"; x.fillText(state.lastHotkey ? `HOTKEY ${state.lastHotkey} • EVENT ${state.eventCount}` : "SELECT ACTION",c.width/2,195,c.width-90);
  if(!confirmTexture) confirmTexture=canvasTexture(c); else confirmTexture.needsUpdate=true;
  return confirmTexture;
}
function addPanels(scene){
  const root=scene.getObjectByName(ROOT);
  stripMesh=new THREE.Mesh(new THREE.PlaneGeometry(5.9,1.43),new THREE.MeshBasicMaterial({map:stripTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  stripMesh.name="PHASE124_POKER_ACTION_HOTKEY_HELPER_STRIP";
  stripMesh.position.set(0,1.22,2.12);
  stripMesh.rotation.x=-.44;
  stripMesh.renderOrder=810;
  stripMesh.userData.phase124PokerHotkey=true;
  root.add(stripMesh);

  confirmMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.2),new THREE.MeshBasicMaterial({map:confirmTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  confirmMesh.name="PHASE124_POKER_ACTION_CONFIRMATION_PANEL";
  confirmMesh.position.set(0,2.25,1.52);
  confirmMesh.rotation.x=-.22;
  confirmMesh.renderOrder=811;
  confirmMesh.userData.phase124PokerHotkey=true;
  root.add(confirmMesh);
}
function dispatchAction(action, source, hotkey){
  const rec=ACTIONS.find((a)=>a.key===action) || ACTIONS.find((a)=>a.hotkey===hotkey);
  if(!rec) return false;
  state.lastDispatched=rec.key;
  state.lastHotkey=rec.hotkey;
  state.eventCount++;
  state.pulse=1;
  state.activeColor=rec.color;
  state.checkedAt=new Date().toISOString();
  confirmTex();
  window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action:rec.key, source:source || "phase124-hotkey", hotkey:rec.hotkey, phase:124 } }));
  window.SVR_PHASE124_LAST_ACTION_DISPATCH = { action:rec.key, hotkey:rec.hotkey, eventCount:state.eventCount, checkedAt:state.checkedAt };
  return true;
}
function installHotkeys(){
  if(window.SVR_PHASE124_HOTKEYS_INSTALLED) return;
  window.SVR_PHASE124_HOTKEYS_INSTALLED=true;
  window.addEventListener("keydown", (ev)=>{
    if(ev.repeat) return;
    const targetTag=String(ev.target?.tagName||"").toLowerCase();
    if(targetTag === "input" || targetTag === "textarea" || ev.target?.isContentEditable) return;
    const rec=ACTIONS.find((a)=>a.code===ev.code || a.hotkey.toLowerCase()===String(ev.key||"").toLowerCase());
    if(!rec) return;
    ev.preventDefault?.();
    dispatchAction(rec.key,"phase124-hotkey",rec.hotkey);
  }, { passive:false });
}
function animate(){
  if(window.SVR_PHASE124_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE124_ANIMATION_LOOP_INSTALLED=true;
  const tick=()=>{
    const t=performance.now()*.001;
    if(state.pulse>0) state.pulse=Math.max(0,state.pulse-.025);
    if(confirmMesh){
      confirmMesh.lookAt(0,1.58,6.0);
      confirmMesh.position.y=2.25+Math.sin(t*1.8)*.02+state.pulse*.06;
      if(confirmMesh.material) confirmMesh.material.opacity=.78+state.pulse*.22;
    }
    if(stripMesh){ stripMesh.lookAt(0,1.35,7.0); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible=true;
      o.userData.phase124CoreProtected=true;
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
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    helperStrip: !!scene?.getObjectByName?.("PHASE124_POKER_ACTION_HOTKEY_HELPER_STRIP"),
    confirmationPanel: !!scene?.getObjectByName?.("PHASE124_POKER_ACTION_CONFIRMATION_PANEL"),
    hotkeysInstalled: !!window.SVR_PHASE124_HOTKEYS_INSTALLED,
    actionMap: ACTIONS.map((a)=>({ action:a.key, hotkey:a.hotkey, code:a.code })),
    lastDispatch: window.SVR_PHASE124_LAST_ACTION_DISPATCH || null,
    phase122Feedback: !!window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK,
    phase123Display: !!window.SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    actionObjects: count(scene,/ACTION|PHASE111_ACTION_PAD|PHASE112/i),
    watchObjects: count(scene,/WATCH/i),
    ready: !scene?.getObjectByName?.(DUP) && !!window.SVR_PHASE124_HOTKEYS_INSTALLED && !!scene?.getObjectByName?.("PHASE124_POKER_ACTION_HOTKEY_HELPER_STRIP")
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable=removeDuplicateTable(scene);
  addPanels(scene);
  const protectedObjects=protectCore(scene);
  installHotkeys();
  animate();
  const report=qa(scene);
  window.SVR_PHASE124_POKER_ACTION_ACCESSIBILITY_HOTKEY_LOCK={ build:LABEL, active:true, pokerActionAccessibility:true, hotkeyFallback:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE124_HOTKEY_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
