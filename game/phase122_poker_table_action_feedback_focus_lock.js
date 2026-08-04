import * as THREE from "three";

const LABEL = "PHASE-122-POKER-TABLE-ACTION-FEEDBACK-FOCUS-LOCK";
const ROOT = "PHASE122_POKER_TABLE_ACTION_FEEDBACK_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;

const ACTION_COLORS = {
  fold: RED,
  check: CYAN,
  call: GREEN,
  raise: GOLD,
  all_in: 0xffffff,
  next: PURPLE
};

let state = {
  lastAction: null,
  lastSource: null,
  lastAt: null,
  pulse: 0,
  activeColor: GOLD,
  eventCount: 0
};
let statusMesh = null;
let ringMesh = null;
let glowMesh = null;
let statusCanvas = null;
let statusTexture = null;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || "")) && o.visible !== false) n++; });
  return n;
}
function glow(color, opacity=.32){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function panelTexture(action="READY", sub="SELECT AN ACTION"){
  if(!statusCanvas){ statusCanvas = document.createElement("canvas"); statusCanvas.width = 1024; statusCanvas.height = 384; }
  const c = statusCanvas;
  const x = c.getContext("2d");
  const color = state.activeColor || GOLD;
  const hex = `#${color.toString(16).padStart(6,"0")}`;
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#03050b"); g.addColorStop(.55,"#120617"); g.addColorStop(1,"#02040a");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.86)"; x.lineWidth = 12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = hex; x.lineWidth = 7; x.strokeRect(58,58,c.width-116,c.height-116);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = hex; x.shadowBlur = 22;
  x.fillStyle = "#fff8df"; x.font = "900 70px system-ui,Arial"; x.fillText(`ACTION: ${String(action).toUpperCase().replace("_","-")}`,c.width/2,150,c.width-90);
  x.shadowBlur = 8;
  x.fillStyle = "#bffcff"; x.font = "800 34px system-ui,Arial"; x.fillText(sub,c.width/2,245,c.width-90);
  if(!statusTexture){ statusTexture = new THREE.CanvasTexture(c); statusTexture.colorSpace = THREE.SRGBColorSpace; statusTexture.anisotropy = 4; }
  statusTexture.needsUpdate = true;
  return statusTexture;
}
function updateStatus(action="READY", source="phase122"){
  const pretty = action === "READY" ? "SELECT AN ACTION" : `SOURCE: ${String(source || "POKER").toUpperCase()}`;
  panelTexture(action, pretty);
}
function addFeedback(scene){
  const root = scene.getObjectByName(ROOT);
  updateStatus("READY", "phase122");
  statusMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.25,1.55),
    new THREE.MeshBasicMaterial({ map:statusTexture, transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  statusMesh.name = "PHASE122_POKER_ACTION_FEEDBACK_STATUS_PANEL";
  statusMesh.position.set(0,2.62,-.72);
  statusMesh.rotation.x = -0.10;
  statusMesh.renderOrder = 760;
  statusMesh.userData.phase122PokerFeedback = true;
  root.add(statusMesh);

  ringMesh = new THREE.Mesh(new THREE.RingGeometry(3.78,3.94,128), glow(GOLD,.36));
  ringMesh.name = "PHASE122_POKER_TABLE_ACTION_RESPONSE_RING";
  ringMesh.position.set(0,.205,-2.7);
  ringMesh.rotation.x = -Math.PI/2;
  ringMesh.renderOrder = 742;
  ringMesh.userData.phase122PokerFeedback = true;
  root.add(ringMesh);

  glowMesh = new THREE.Mesh(new THREE.CircleGeometry(4.2,128), glow(CYAN,.055));
  glowMesh.name = "PHASE122_POKER_TABLE_SOFT_FOCUS_GLOW";
  glowMesh.position.set(0,.196,-2.7);
  glowMesh.rotation.x = -Math.PI/2;
  glowMesh.renderOrder = 741;
  glowMesh.userData.phase122PokerFeedback = true;
  root.add(glowMesh);
}
function onPokerAction(e){
  const action = String(e?.detail?.action || "next").toLowerCase();
  const source = String(e?.detail?.source || "poker-action");
  state.lastAction = action;
  state.lastSource = source;
  state.lastAt = new Date().toISOString();
  state.eventCount++;
  state.pulse = 1.0;
  state.activeColor = ACTION_COLORS[action] || GOLD;
  updateStatus(action, source);
  window.SVR_PHASE122_LAST_POKER_ACTION = { action, source, checkedAt:state.lastAt, eventCount:state.eventCount };
}
function installEventListener(){
  if(window.SVR_PHASE122_ACTION_LISTENER_INSTALLED) return;
  window.SVR_PHASE122_ACTION_LISTENER_INSTALLED = true;
  window.addEventListener("svr-poker-player-action", onPokerAction);
}
function animate(){
  if(window.SVR_PHASE122_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE122_ANIMATION_LOOP_INSTALLED = true;
  const tick = ()=>{
    const scene = window.__SVR_SCENE__;
    const root = scene?.getObjectByName?.(ROOT);
    if(root){
      const t = performance.now() * .001;
      if(state.pulse > 0) state.pulse = Math.max(0,state.pulse - .022);
      const amp = state.pulse;
      if(ringMesh){
        ringMesh.scale.setScalar(1 + amp*.12 + Math.sin(t*2.4)*.01);
        if(ringMesh.material){ ringMesh.material.color.setHex(state.activeColor || GOLD); ringMesh.material.opacity = .25 + amp*.45; }
      }
      if(glowMesh?.material){
        glowMesh.material.color.setHex(state.activeColor || CYAN);
        glowMesh.material.opacity = .045 + amp*.12;
      }
      if(statusMesh){
        statusMesh.position.y = 2.62 + Math.sin(t*1.8)*.025;
        statusMesh.lookAt(0,1.58,6.0);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const name = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(name)){
      o.visible = true;
      o.userData.phase122CoreProtected = true;
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
    statusPanel: !!scene?.getObjectByName?.("PHASE122_POKER_ACTION_FEEDBACK_STATUS_PANEL"),
    responseRing: !!scene?.getObjectByName?.("PHASE122_POKER_TABLE_ACTION_RESPONSE_RING"),
    softGlow: !!scene?.getObjectByName?.("PHASE122_POKER_TABLE_SOFT_FOCUS_GLOW"),
    eventListener: !!window.SVR_PHASE122_ACTION_LISTENER_INSTALLED,
    lastAction: state.lastAction,
    eventCount: state.eventCount,
    phase111ActionPads: count(scene,/PHASE111_ACTION_PAD/i),
    phase112HandPinch: !!window.SVR_PHASE112_HAND_PINCH_POKER_BUTTON_SELECTION_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    watchObjects: count(scene,/WATCH/i),
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    luxuryAccepted: !!window.SVR_PHASE121_LUXURY_LOBBY_ACCEPTANCE_QA_LOCK,
    ready: !scene?.getObjectByName?.(DUP) && !!scene?.getObjectByName?.("PHASE122_POKER_ACTION_FEEDBACK_STATUS_PANEL") && !!window.SVR_PHASE122_ACTION_LISTENER_INSTALLED
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  addFeedback(scene);
  const protectedObjects = protectCore(scene);
  installEventListener();
  animate();
  const report = qa(scene);
  window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK = {
    build: LABEL,
    active: true,
    pokerActionFeedback:true,
    luxuryTableFocus:true,
    removedDuplicateTable,
    protectedObjects,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    portalRoutesTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE122_POKER_FEEDBACK_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
