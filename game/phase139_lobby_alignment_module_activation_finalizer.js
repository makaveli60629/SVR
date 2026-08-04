import * as THREE from "three";

const LABEL = "PHASE-139-LOBBY-ALIGNMENT-MODULE-ACTIVATION-FINALIZER";
const ROOT = "PHASE139_LOBBY_ALIGNMENT_MODULE_ACTIVATION_ROOT";
const RED = 0xb20f24;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const GLASS = 0x8fdcff;
const FLOOR_Y = 3.42;

const ROOM_ROUTES = {
  lobby: { label: "Lobby", href: "./index.html?v=phase139&room=lobby" },
  table: { label: "Poker Table", href: "./index.html?v=phase139&focus=table" },
  reiki: { label: "Reiki Room", href: "./reiki.html?v=phase139" },
  pgaDrive: { label: "PGA Drive", href: "./pga-drive.html?v=phase139" },
  pgaChipPutt: { label: "PGA Chip/Putt", href: "./chip-putt.html?v=phase139" },
  store: { label: "VR Store", href: "./store-room.html?v=phase139", web: "https://svrpoker.com/site/store.html" },
  lounge: { label: "Smoker Lounge", href: "./smoker-lounge.html?v=phase139" },
  scorpion: { label: "Scorpion Room", href: "./scorpion.html?v=phase139" }
};

const OVERLAY_TEXT_RE = /LIVE\s+LEFT|LEFT\s*[\u2192\- ]\s*RIGHT|LEFT[-\s]?RIGHT|DEAL\s+SEQUENCE|DEAL\s+LOCK|UPDATE\s*3\.1|STABILITY\s+QA|GAME\.ZIP\s+EXPORT|FINAL\s+PREP|VERSION\s+SYNC|WAITING\s+FOR\s+CARD|QA\s+CHECK|PACKAGE\s+PREP|ARTIFACT|WORKFLOW/i;
const SCENE_HIDE_RE = /PHASE31[3-6]|LEFT.*RIGHT.*DEAL|DEAL.*SEQUENCE|DEAL.*LOCK|LIVE.*SEQUENCE|PHASE32[1-4]|UPDATE31|UPDATE\s*3\.1|STABILITY.*QA|GAMEZIP|GAME\.ZIP|FINAL.*PREP|VERSION.*SYNC|WAITING.*CARD|QA_CHECK|PACKAGE|ARTIFACT|WORKFLOW|CHECKLIST|DEBUG|DIAGNOSTIC|PHASE13[0-8].*(PANEL|BOARD|CHECKLIST|RING|READY|MANUAL|TUTORIAL)|PHASE129_STOREFRONT_PREVIEW_PANEL/i;
const STAIR_HIDE_RE = /PHASE136.*STAIR|PHASE136.*UPSTAIRS|PHASE137.*STAIR|PHASE137.*UPSTAIRS|PHASE138.*STAIR|PHASE138.*UPSTAIRS|PHASE138_ALIGNED|PHASE138_SINGLE|PHASE138_RED_ONLY|BLACK.*STAIR|STAIR.*BLACK|DUPLICATE.*STAIR|GLASS.*FENCE|FENCE.*DUPLICATE|BALCONY_SURFACE|WALKWAY/i;

function mat(color, opacity = 1, emissive = 0.04){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.1,
    transparent: opacity < 1,
    opacity,
    emissive: color,
    emissiveIntensity: emissive,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 0.58
  });
}
function textTexture(lines, color = "#7ffcff", bg = "rgba(0,0,0,.72)"){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 360;
  const x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = color; x.lineWidth = 8; x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = "rgba(255,217,138,.68)"; x.lineWidth = 4; x.strokeRect(54,54,c.width-108,c.height-108);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = color; x.shadowBlur = 14;
  x.fillStyle = "#fff8df"; x.font = "900 44px system-ui,Arial";
  x.fillText(lines[0] || "SVR", c.width/2, 92, c.width-96);
  x.shadowBlur = 4; x.fillStyle = "#bffcff"; x.font = "800 27px system-ui,Arial";
  for(let i=1;i<lines.length;i++) x.fillText(lines[i], c.width/2, 92+i*56, c.width-96);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function count(scene, re){ let n=0; scene?.traverse?.(o=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function removeRoot(scene){ const old = scene?.getObjectByName?.(ROOT); if(old) old.parent?.remove(old); }
function conceal(o, why){ if(!o) return false; o.visible = false; o.userData.phase139Hidden = why || true; return true; }
function hideSceneObjects(scene){
  let hidden = 0;
  scene?.traverse?.(o=>{
    const n = String(o.name || "");
    if(/PHASE139/i.test(n)) return;
    if(SCENE_HIDE_RE.test(n) || STAIR_HIDE_RE.test(n)){
      if(conceal(o, "phase139-finalizer")) hidden++;
    }
  });
  return hidden;
}
function sweepDom(){
  let removed = 0;
  document.querySelectorAll("#svr-phase321-stability-panel,#svr-phase322-final-panel,#svr-phase323-package-panel,#svr-phase324-version-panel,[id*='phase315'],[id*='phase316'],[id*='phase321'],[id*='phase322'],[id*='phase323'],[id*='phase324'],[id*='update31']").forEach(el=>{ el.remove(); removed++; });
  Array.from(document.body?.children || []).forEach(el=>{
    if(!el || el.id === "app" || el.id === "safeStage" || el.id === "svrPhaseBadge" || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
    const txt = String(el.textContent || "").slice(0,400);
    const idc = `${el.id || ""} ${el.className || ""}`;
    const cs = getComputedStyle(el);
    const isOverlay = cs.position === "fixed" || cs.position === "absolute" || /panel|hud|overlay|phase|debug|qa/i.test(idc);
    if(isOverlay && OVERLAY_TEXT_RE.test(`${idc} ${txt}`)){
      el.remove(); removed++;
    }
  });
  window.SVR_PHASE139_DOM_SWEEP_COUNT = (window.SVR_PHASE139_DOM_SWEEP_COUNT || 0) + removed;
  return removed;
}
function installDomAuthority(){
  let style = document.getElementById("phase139-authority-style");
  if(!style){
    style = document.createElement("style");
    style.id = "phase139-authority-style";
    style.textContent = `
      #svr-phase321-stability-panel,#svr-phase322-final-panel,#svr-phase323-package-panel,#svr-phase324-version-panel,
      [id*="phase315"],[id*="phase316"],[id*="phase321"],[id*="phase322"],[id*="phase323"],[id*="phase324"],[id*="update31"],
      [class*="phase315"],[class*="phase316"],[class*="phase321"],[class*="phase322"],[class*="phase323"],[class*="phase324"],[class*="update31"]{
        display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;
      }
      #svrPhaseBadge{position:fixed;left:10px;top:10px;z-index:99999;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,0,0,.62);color:#bffcff;font:900 12px system-ui,Arial;letter-spacing:.08em;pointer-events:none;box-shadow:0 0 18px rgba(127,252,255,.22)}
    `;
    document.head.appendChild(style);
  }
  let badge = document.getElementById("svrPhaseBadge");
  if(!badge){ badge = document.createElement("div"); badge.id = "svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent = "PHASE 139 • CLEAN LOBBY LOCK";
  sweepDom();
  if(!window.SVR_PHASE139_DOM_OBSERVER){
    const obs = new MutationObserver(()=>sweepDom());
    obs.observe(document.documentElement,{childList:true,subtree:true});
    window.SVR_PHASE139_DOM_OBSERVER = true;
  }
}
function installRoutes(){
  window.SVR_ROOM_ROUTES = ROOM_ROUTES;
  window.SVR_PHASE139_ROOM_ROUTES = ROOM_ROUTES;
  window.SVR_STORE_PORTAL_URL = ROOM_ROUTES.store.web;
  window.SVR_GO_ROOM = function(key){
    const route = ROOM_ROUTES[key] || ROOM_ROUTES.lobby;
    if(route.href) location.href = route.href;
    return route;
  };
  window.SVR_PHASE139_ALL_MODULES_ACTIVE = {
    build: LABEL,
    lobby: true,
    pokerTable: true,
    reikiRoom: true,
    pgaDrive: true,
    pgaChipPutt: true,
    vrStore: true,
    smokerLounge: true,
    scorpionRoom: true,
    routes: ROOM_ROUTES,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}
function floorHeight(x,z){
  const localX = x - 14.6;
  if(Math.abs(localX) <= 2.35 && z <= 7.7 && z >= -10.5){
    return THREE.MathUtils.clamp((7.7 - z) / 18.2, 0, 1) * FLOOR_Y;
  }
  if(Math.abs(x) <= 18.2 && z <= -10.5 && z >= -17.3) return FLOOR_Y;
  return 0;
}
function installFloor(){
  window.SVR_PHASE227_FLOOR_HEIGHT = floorHeight;
  window.SVR_PHASE137_FLOOR_HEIGHT = floorHeight;
  window.SVR_PHASE138_FLOOR_HEIGHT = floorHeight;
  window.SVR_PHASE139_FLOOR_HEIGHT = floorHeight;
}
function addSingleStair(root){
  const group = new THREE.Group();
  group.name = "PHASE139_SINGLE_CLEAN_RED_STAIR_ROUTE";
  group.position.set(14.6,0,0);
  root.add(group);
  const stairMat = mat(RED,.98,.055), gold = mat(GOLD,.95,.04), glass = mat(GLASS,.22,.10);
  const width = 4.65, steps = 18;
  for(let i=0;i<steps;i++){
    const u = i/(steps-1), z = 7.7 + (-18.2*u), y = .055 + FLOOR_Y*u;
    const step = new THREE.Mesh(new THREE.BoxGeometry(width,.11,.72), stairMat);
    step.name = `PHASE139_SINGLE_STAIR_RED_STEP_${i}`;
    step.position.set(0,y,z); step.userData.phase139Walkable = true; group.add(step);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(width+.08,.04,.055), gold);
    edge.name = `PHASE139_SINGLE_STAIR_GOLD_EDGE_${i}`;
    edge.position.set(0,y+.085,z-.36); group.add(edge);
  }
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(width+.08,.055,18.95), stairMat);
  ramp.name = "PHASE139_SINGLE_STAIR_CONTINUOUS_WALK_SURFACE";
  ramp.position.set(0,1.72,-1.35); ramp.rotation.x = -0.186; ramp.material.transparent = true; ramp.material.opacity = .72; ramp.userData.phase139Walkable = true; group.add(ramp);
  [-2.48,2.48].forEach(x=>{ const rail = new THREE.Mesh(new THREE.BoxGeometry(.085,.74,18.95), gold); rail.name = "PHASE139_SINGLE_STAIR_GOLD_SIDE_RAIL"; rail.position.set(x,2.08,-1.35); rail.rotation.x = -0.186; group.add(rail); });
  const landing = new THREE.Mesh(new THREE.BoxGeometry(width+.45,.10,2.35), stairMat);
  landing.name = "PHASE139_SINGLE_STAIR_TOP_LANDING_CONNECTED"; landing.position.set(0,FLOOR_Y+.055,-10.72); landing.userData.phase139Walkable = true; group.add(landing);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(33.4,.095,6.7), stairMat);
  deck.name = "PHASE139_SINGLE_UPSTAIRS_RED_CARPET_DECK"; deck.position.set(0,FLOOR_Y+.047,-14.0); deck.userData.phase139Walkable = true; root.add(deck);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(34.2,.84,.075), glass);
  rail.name = "PHASE139_SINGLE_CLEAN_BALCONY_GLASS_RAIL"; rail.position.set(0,FLOOR_Y+.64,-10.15); root.add(rail);
}
function addModuleDirectory(root){
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.15), new THREE.MeshBasicMaterial({
    map: textTexture(["ROOMS ACTIVE", "Reiki • PGA • Store • Lounge", "Scorpion • Poker Table", "Use portals or watch routes"], "#7ffcff"),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  }));
  panel.name = "PHASE139_COMPACT_ROOM_DIRECTORY_WALL_PANEL";
  panel.position.set(0,2.15,-18.75);
  panel.renderOrder = 990;
  root.add(panel);
}
function qa(scene){
  return {
    build: LABEL,
    root: !!scene?.getObjectByName?.(ROOT),
    phaseBadge: document.getElementById("svrPhaseBadge")?.textContent || null,
    hiddenSceneObjects: window.SVR_PHASE139_HIDDEN_SCENE_OBJECTS || 0,
    domSweeps: window.SVR_PHASE139_DOM_SWEEP_COUNT || 0,
    oldDealPanelsVisible: count(scene,/PHASE315|PHASE316|LEFT.*RIGHT.*DEAL|DEAL.*SEQUENCE/),
    oldStairsVisible: count(scene,/PHASE136.*STAIR|PHASE137.*STAIR|PHASE138.*STAIR|BLACK.*STAIR|DUPLICATE.*STAIR/),
    phase139StairSteps: count(scene,/PHASE139_SINGLE_STAIR_RED_STEP/),
    routes: Object.keys(ROOM_ROUTES),
    allModulesActive: !!window.SVR_PHASE139_ALL_MODULES_ACTIVE,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  installDomAuthority();
  installRoutes();
  installFloor();
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_PHASE139_BUILD_AUTHORITY = { build: LABEL, active: true, finalAuthority: true, siteTouched: false, checkedAt: new Date().toISOString() };
  if(!scene) return false;
  removeRoot(scene);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  const hidden = hideSceneObjects(scene);
  window.SVR_PHASE139_HIDDEN_SCENE_OBJECTS = (window.SVR_PHASE139_HIDDEN_SCENE_OBJECTS || 0) + hidden;
  addSingleStair(root);
  addModuleDirectory(root);
  window.SVR_RUN_PHASE139_LOBBY_AUDIT = () => qa(scene);
  window.SVR_PHASE139_LOBBY_ALIGNMENT_MODULE_ACTIVATION_FINALIZER = qa(scene);
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{
  tries++;
  install();
  if(tries > 72) clearInterval(timer);
}, 500);
[900,1800,3500,6500,10000,16000,24000].forEach(ms=>setTimeout(install, ms));
