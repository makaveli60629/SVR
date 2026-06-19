import * as THREE from "three";

const LABEL = "PHASE-116-PORTAL-ROUTE-ACTIVATION-NAVIGATION-LOCK";
const ROOT = "PHASE116_PORTAL_ROUTE_ACTIVATION_ROOT";
const TARGET_ROOT = "PHASE116_PORTAL_TARGET_RING_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const STORE_URL = "https://svrpoker.com/site/store.html";

const ROUTES = {
  WELLNESS: { key:"wellness", label:"Wellness", type:"page", href:"./reiki.html?v=phase116" },
  POKER: { key:"poker", label:"Poker Table", type:"local", action:"table-focus" },
  PGA: { key:"pga", label:"PGA Range", type:"page", href:"./range.html?v=phase116" },
  STORE: { key:"store", label:"SVR Store", type:"web", href:STORE_URL },
  SCORPION: { key:"scorpion", label:"Scorpion Room", type:"page", href:"./scorpion.html?v=phase116" },
  LOUNGE: { key:"lounge", label:"SVR Lounge", type:"page", href:"./smoker-lounge.html?v=phase116" },
  VIBES: { key:"vibes", label:"Vibes Theater", type:"page", href:"./theater.html?v=phase116" }
};

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const handPos = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const ray = new THREE.Raycaster();
let lastPinch = false;
let armedRoute = null;
let currentTarget = null;
let pulse = 0;

function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function routeFromName(name){
  const n = String(name || "").toUpperCase();
  if(n.includes("WELLNESS")) return ROUTES.WELLNESS;
  if(n.includes("PGA")) return ROUTES.PGA;
  if(n.includes("STORE")) return ROUTES.STORE;
  if(n.includes("SCORPION")) return ROUTES.SCORPION;
  if(n.includes("LOUNGE")) return ROUTES.LOUNGE;
  if(n.includes("VIBES")) return ROUTES.VIBES;
  if(n.includes("POKER")) return ROUTES.POKER;
  return null;
}
function portalRoots(scene){
  const roots = [];
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/^PHASE99_CORRECT_DOORWAY_|^PHASE115_CORRECT_DOORWAY_/i.test(n)) roots.push(o);
  });
  return roots;
}
function markPortal(root){
  const rec = routeFromName(root.name);
  if(!rec) return false;
  root.userData.phase116PortalRoute = rec;
  root.traverse?.((child)=>{
    child.userData.phase116PortalRoute = rec;
    child.userData.phase116SelectablePortal = true;
    child.renderOrder = Math.max(child.renderOrder || 0, 620);
    if(child.isMesh){ child.frustumCulled = false; }
  });
  return true;
}
function selectablePortals(scene){
  const arr = [];
  scene?.traverse?.((o)=>{ if(o.visible !== false && o.userData?.phase116SelectablePortal) arr.push(o); });
  return arr;
}
function focusPokerTable(){
  const camera = window.__SVR_CAMERA__;
  if(camera && !window.__SVR_RENDERER__?.xr?.isPresenting){
    camera.position.set(0,1.62,5.4);
    camera.lookAt(0,1.35,-2.7);
  }
  try { window.dispatchEvent(new CustomEvent("svr-portal-local-action", { detail:{ action:"table-focus", source:"phase116", checkedAt:new Date().toISOString() } })); } catch {}
  window.SVR_PHASE116_LAST_ROUTE = { route:"poker", action:"table-focus", checkedAt:new Date().toISOString() };
}
function openRoute(rec){
  if(!rec) return false;
  const now = performance.now();
  if(window.__SVR_PHASE116_LAST_OPEN__ && now - window.__SVR_PHASE116_LAST_OPEN__ < 850) return false;
  window.__SVR_PHASE116_LAST_OPEN__ = now;
  window.SVR_PHASE116_LAST_ROUTE = { ...rec, checkedAt:new Date().toISOString() };
  if(rec.type === "local") { focusPokerTable(); return true; }
  if(rec.type === "web" && rec.href){ window.open(rec.href, "_blank", "noopener,noreferrer"); return true; }
  if(rec.type === "page" && rec.href){ location.href = rec.href; return true; }
  return false;
}
function installPointer(scene){
  if(window.SVR_PHASE116_POINTER_INSTALLED) return;
  window.SVR_PHASE116_POINTER_INSTALLED = true;
  const rc = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener("pointerdown", (ev)=>{
    const renderer = window.__SVR_RENDERER__;
    const camera = window.__SVR_CAMERA__;
    const canvas = renderer?.domElement || document.querySelector("canvas");
    if(!renderer || !camera || !canvas) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / Math.max(r.width,1)) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / Math.max(r.height,1)) * 2 + 1;
    rc.setFromCamera(mouse, camera);
    const hit = rc.intersectObjects(selectablePortals(scene), true).find((x)=>x.object?.userData?.phase116PortalRoute)?.object;
    if(hit?.userData?.phase116PortalRoute){ ev.preventDefault?.(); openRoute(hit.userData.phase116PortalRoute); }
  }, { passive:false });
}
function installControllers(scene){
  const renderer = window.__SVR_RENDERER__;
  if(!renderer?.xr) return;
  const rc = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3(0,0,-1);
  function bind(index){
    const controller = renderer.xr.getController?.(index);
    if(!controller || controller.userData.phase116PortalSelectBound) return;
    controller.userData.phase116PortalSelectBound = true;
    controller.addEventListener("selectend", ()=>{
      controller.updateMatrixWorld(true);
      controller.getWorldPosition(origin);
      dir.set(0,0,-1).applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion())).normalize();
      rc.set(origin, dir);
      rc.far = 12;
      const hit = rc.intersectObjects(selectablePortals(scene), true).find((x)=>x.object?.userData?.phase116PortalRoute)?.object;
      if(hit?.userData?.phase116PortalRoute) openRoute(hit.userData.phase116PortalRoute);
    });
  }
  bind(0); bind(1);
  renderer.xr.addEventListener?.("sessionstart", ()=>{ bind(0); bind(1); });
}
function getJoint(hand, name){ return hand?.joints?.[name] || hand?.getObjectByName?.(name) || null; }
function handPinching(hand){
  const thumb = getJoint(hand,"thumb-tip");
  const index = getJoint(hand,"index-finger-tip");
  if(!thumb || !index) return false;
  thumb.getWorldPosition(tmpA); index.getWorldPosition(tmpB);
  return tmpA.distanceTo(tmpB) < 0.035;
}
function handRay(hand){
  const wrist = getJoint(hand,"wrist") || hand;
  const index = getJoint(hand,"index-finger-tip") || hand;
  wrist.getWorldPosition(handPos); index.getWorldPosition(tmpB);
  rayDir.copy(tmpB).sub(handPos);
  if(rayDir.lengthSq() < 0.00001) hand.getWorldDirection(rayDir); else rayDir.normalize();
  ray.set(handPos, rayDir); ray.far = 12;
  return ray;
}
function getHands(){
  const renderer = window.__SVR_RENDERER__;
  const hands = [];
  try { const h0 = renderer?.xr?.getHand?.(0), h1 = renderer?.xr?.getHand?.(1); if(h0) hands.push(h0); if(h1) hands.push(h1); } catch {}
  const extra = window.__SVR_XR_HANDS__ || window.SVR_XR_HANDS || [];
  extra.forEach((h)=>{ if(h && !hands.includes(h)) hands.push(h); });
  return hands;
}
function makeTarget(scene){
  const old = scene.getObjectByName(TARGET_ROOT); if(old) old.parent?.remove(old);
  const g = new THREE.Group(); g.name = TARGET_ROOT; g.visible = false; scene.add(g);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.30,.42,64), new THREE.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name = "PHASE116_PORTAL_TARGET_RING"; ring.rotation.x = -Math.PI/2; ring.renderOrder = 940; g.add(ring);
  return g;
}
function setTarget(targetRoot, hit){
  if(!targetRoot) return;
  if(!hit){ targetRoot.visible = false; return; }
  targetRoot.visible = true;
  targetRoot.position.copy(hit.point);
  pulse += .07;
  targetRoot.scale.setScalar(1 + Math.sin(pulse) * .08);
}
function installHands(scene){
  if(window.SVR_PHASE116_HAND_LOOP_INSTALLED) return;
  window.SVR_PHASE116_HAND_LOOP_INSTALLED = true;
  let targetRoot = scene.getObjectByName(TARGET_ROOT) || makeTarget(scene);
  const tick = ()=>{
    const liveScene = window.__SVR_SCENE__;
    if(!liveScene){ requestAnimationFrame(tick); return; }
    targetRoot = liveScene.getObjectByName(TARGET_ROOT) || makeTarget(liveScene);
    const selectables = selectablePortals(liveScene);
    let hit = null;
    let pinching = false;
    for(const hand of getHands()){
      if(!hand?.visible) continue;
      const result = handRay(hand).intersectObjects(selectables, true).find((x)=>x.object?.userData?.phase116PortalRoute);
      if(result) hit = result;
      if(handPinching(hand)) pinching = true;
    }
    currentTarget = hit?.object || null;
    setTarget(targetRoot, hit);
    const rec = currentTarget?.userData?.phase116PortalRoute || null;
    if(pinching && rec) armedRoute = rec;
    if(lastPinch && !pinching && armedRoute){ openRoute(armedRoute); armedRoute = null; }
    if(!pinching && !rec) armedRoute = null;
    lastPinch = pinching;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function qa(scene){
  const roots = portalRoots(scene);
  const mapped = roots.filter((r)=>!!r.userData.phase116PortalRoute);
  return {
    roots: roots.length,
    mapped: mapped.length,
    routes: mapped.map((r)=>({ name:r.name, key:r.userData.phase116PortalRoute.key, href:r.userData.phase116PortalRoute.href || null, type:r.userData.phase116PortalRoute.type })),
    selectableObjects: selectablePortals(scene).length,
    oneTable: !scene.getObjectByName(DUP),
    currentTarget: currentTarget?.userData?.phase116PortalRoute?.key || null,
    lastRoute: window.SVR_PHASE116_LAST_ROUTE || null,
    ready: mapped.length >= 7 && !scene.getObjectByName(DUP)
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  let marked = 0;
  portalRoots(scene).forEach((r)=>{ if(markPortal(r)) marked++; });
  installPointer(scene); installControllers(scene); installHands(scene);
  const report = qa(scene);
  window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK = { build:LABEL, active:true, marked, removedDuplicateTable, report, routes:ROUTES, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE116_PORTAL_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
