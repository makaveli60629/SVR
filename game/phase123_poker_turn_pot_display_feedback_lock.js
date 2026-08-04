import * as THREE from "three";

const LABEL = "PHASE-123-POKER-TURN-POT-DISPLAY-FEEDBACK-LOCK";
const ROOT = "PHASE123_POKER_TURN_POT_DISPLAY_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;

const ACTION_COLORS = { fold:RED, check:CYAN, call:GREEN, raise:GOLD, all_in:0xffffff, next:PURPLE };
let state = {
  lastAction:"WAITING",
  lastSource:"table-ready",
  visualPot:0,
  handNumber:1,
  actionCount:0,
  pulse:0,
  activeColor:GOLD,
  checkedAt:null
};
let panelCanvas = null;
let panelTexture = null;
let tablePanel = null;
let potHalo = null;
let turnHalo = null;
let dealerButtonGlow = null;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function glow(color, opacity=.24){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function actionLabel(action){ return String(action || "WAITING").toUpperCase().replace("_","-"); }
function potDelta(action){
  if(action === "call") return 250;
  if(action === "raise") return 500;
  if(action === "all_in") return 1500;
  if(action === "check") return 0;
  if(action === "fold") return 0;
  if(action === "next") return 0;
  return 0;
}
function refreshPanel(){
  if(!panelCanvas){ panelCanvas = document.createElement("canvas"); panelCanvas.width = 1024; panelCanvas.height = 512; }
  const c = panelCanvas;
  const x = c.getContext("2d");
  const color = state.activeColor || GOLD;
  const hex = `#${color.toString(16).padStart(6,"0")}`;
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#02040a"); bg.addColorStop(.5,"#100511"); bg.addColorStop(1,"#02040a");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.88)"; x.lineWidth = 12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = hex; x.lineWidth = 7; x.strokeRect(58,58,c.width-116,c.height-116);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = hex; x.shadowBlur = 20;
  x.fillStyle = "#fff8df"; x.font = "900 58px system-ui,Arial"; x.fillText("TABLE STATUS",c.width/2,96,c.width-100);
  x.shadowBlur = 10;
  x.fillStyle = "#bffcff"; x.font = "900 42px system-ui,Arial"; x.fillText(`LAST: ${actionLabel(state.lastAction)}`,c.width/2,190,c.width-100);
  x.fillStyle = "#ffd98a"; x.font = "900 38px system-ui,Arial"; x.fillText(`POT DISPLAY: $${state.visualPot.toLocaleString()}`,c.width/2,270,c.width-100);
  x.fillStyle = "#ffffff"; x.font = "800 28px system-ui,Arial"; x.fillText(`HAND ${state.handNumber}  •  ACTIONS ${state.actionCount}`,c.width/2,340,c.width-110);
  x.fillStyle = "#8dffb4"; x.font = "800 22px system-ui,Arial"; x.fillText("VISUAL FEEDBACK ONLY • GAME LOGIC PRESERVED",c.width/2,410,c.width-100);
  if(!panelTexture){ panelTexture = new THREE.CanvasTexture(c); panelTexture.colorSpace = THREE.SRGBColorSpace; panelTexture.anisotropy = 4; }
  panelTexture.needsUpdate = true;
}
function addDisplays(scene){
  const root = scene.getObjectByName(ROOT);
  refreshPanel();
  tablePanel = new THREE.Mesh(new THREE.PlaneGeometry(4.7,2.05), new THREE.MeshBasicMaterial({map:panelTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  tablePanel.name = "PHASE123_POKER_TURN_POT_STATUS_DISPLAY";
  tablePanel.position.set(0,2.82,-4.55);
  tablePanel.renderOrder = 790;
  tablePanel.userData.phase123PokerDisplay = true;
  root.add(tablePanel);

  potHalo = new THREE.Mesh(new THREE.RingGeometry(1.05,1.24,96), glow(GOLD,.34));
  potHalo.name = "PHASE123_POKER_CENTER_POT_HALO";
  potHalo.position.set(0,.245,-2.82);
  potHalo.rotation.x = -Math.PI/2;
  potHalo.renderOrder = 775;
  potHalo.userData.phase123PokerDisplay = true;
  root.add(potHalo);

  turnHalo = new THREE.Mesh(new THREE.RingGeometry(1.75,1.92,96), glow(CYAN,.24));
  turnHalo.name = "PHASE123_PLAYER_ACTION_TURN_HALO";
  turnHalo.position.set(0,.24,.86);
  turnHalo.rotation.x = -Math.PI/2;
  turnHalo.renderOrder = 776;
  turnHalo.userData.phase123PokerDisplay = true;
  root.add(turnHalo);

  dealerButtonGlow = new THREE.Mesh(new THREE.RingGeometry(.34,.46,64), glow(GOLD,.30));
  dealerButtonGlow.name = "PHASE123_DEALER_BUTTON_SOFT_GLOW";
  dealerButtonGlow.position.set(-1.65,.255,-1.95);
  dealerButtonGlow.rotation.x = -Math.PI/2;
  dealerButtonGlow.renderOrder = 777;
  dealerButtonGlow.userData.phase123PokerDisplay = true;
  root.add(dealerButtonGlow);
}
function onPokerAction(e){
  const action = String(e?.detail?.action || "next").toLowerCase();
  state.lastAction = action;
  state.lastSource = String(e?.detail?.source || "poker-action");
  state.actionCount++;
  state.visualPot += potDelta(action);
  if(action === "next"){
    state.handNumber++;
    state.visualPot = 0;
  }
  state.activeColor = ACTION_COLORS[action] || GOLD;
  state.pulse = 1.0;
  state.checkedAt = new Date().toISOString();
  refreshPanel();
  window.SVR_PHASE123_LAST_TABLE_FEEDBACK = { action, source:state.lastSource, visualPot:state.visualPot, handNumber:state.handNumber, actionCount:state.actionCount, checkedAt:state.checkedAt };
}
function installEventListener(){
  if(window.SVR_PHASE123_TABLE_EVENT_LISTENER_INSTALLED) return;
  window.SVR_PHASE123_TABLE_EVENT_LISTENER_INSTALLED = true;
  window.addEventListener("svr-poker-player-action", onPokerAction);
}
function animate(){
  if(window.SVR_PHASE123_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE123_ANIMATION_LOOP_INSTALLED = true;
  const tick = ()=>{
    const scene = window.__SVR_SCENE__;
    const root = scene?.getObjectByName?.(ROOT);
    if(root){
      const t = performance.now()*.001;
      if(state.pulse > 0) state.pulse = Math.max(0,state.pulse-.018);
      const amp = state.pulse;
      if(tablePanel){ tablePanel.lookAt(0,1.58,6.0); tablePanel.position.y = 2.82 + Math.sin(t*1.2)*.018; }
      if(potHalo?.material){ potHalo.material.color.setHex(state.activeColor || GOLD); potHalo.material.opacity = .22 + amp*.34; potHalo.scale.setScalar(1 + amp*.18 + Math.sin(t*2.0)*.015); }
      if(turnHalo?.material){ turnHalo.material.color.setHex(state.activeColor || CYAN); turnHalo.material.opacity = .17 + amp*.30; turnHalo.scale.setScalar(1 + amp*.13 + Math.sin(t*2.8)*.018); }
      if(dealerButtonGlow?.material){ dealerButtonGlow.material.opacity = .22 + Math.sin(t*2.2)*.05; dealerButtonGlow.rotation.z += .008; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase123CoreProtected = true;
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
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    statusDisplay: !!scene?.getObjectByName?.("PHASE123_POKER_TURN_POT_STATUS_DISPLAY"),
    potHalo: !!scene?.getObjectByName?.("PHASE123_POKER_CENTER_POT_HALO"),
    turnHalo: !!scene?.getObjectByName?.("PHASE123_PLAYER_ACTION_TURN_HALO"),
    dealerButtonGlow: !!scene?.getObjectByName?.("PHASE123_DEALER_BUTTON_SOFT_GLOW"),
    eventListener: !!window.SVR_PHASE123_TABLE_EVENT_LISTENER_INSTALLED,
    phase122Feedback: !!window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK,
    lastFeedback: window.SVR_PHASE123_LAST_TABLE_FEEDBACK || null,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    actionObjects: count(scene,/ACTION|PHASE111_ACTION_PAD|PHASE112/i),
    watchObjects: count(scene,/WATCH/i),
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    ready: !scene?.getObjectByName?.(DUP) && !!scene?.getObjectByName?.("PHASE123_POKER_TURN_POT_STATUS_DISPLAY") && !!window.SVR_PHASE123_TABLE_EVENT_LISTENER_INSTALLED
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  addDisplays(scene);
  const protectedObjects = protectCore(scene);
  installEventListener();
  animate();
  const report = qa(scene);
  window.SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK = { build:LABEL, active:true, pokerTurnPotFeedback:true, visualOnly:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE123_TABLE_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
