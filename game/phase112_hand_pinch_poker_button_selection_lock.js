import * as THREE from "three";

const LABEL = "PHASE-112-HAND-PINCH-POKER-BUTTON-SELECTION-LOCK";
const ROOT = "PHASE112_HAND_PINCH_POKER_BUTTON_SELECTION_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const TARGET_ROOT = "PHASE112_HAND_POKER_TARGET_ROOT";

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const handPos = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const ray = new THREE.Raycaster();

let lastPinch = false;
let armedAction = null;
let currentTarget = null;
let pulse = 0;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function actionObjects(scene){
  const objects = [];
  scene?.traverse?.((o)=>{
    if(o?.userData?.phase111PokerAction || o?.userData?.svrPokerAction) objects.push(o);
  });
  return objects;
}
function getJoint(hand, name){
  return hand?.joints?.[name] || hand?.getObjectByName?.(name) || null;
}
function handPinching(hand){
  const thumb = getJoint(hand, "thumb-tip");
  const index = getJoint(hand, "index-finger-tip");
  if(!thumb || !index) return false;
  thumb.getWorldPosition(tmpA);
  index.getWorldPosition(tmpB);
  return tmpA.distanceTo(tmpB) < 0.035;
}
function handRay(hand){
  const wrist = getJoint(hand, "wrist") || hand;
  const index = getJoint(hand, "index-finger-tip") || hand;
  wrist.getWorldPosition(handPos);
  index.getWorldPosition(tmpB);
  rayDir.copy(tmpB).sub(handPos);
  if(rayDir.lengthSq() < 0.00001){
    hand.getWorldDirection(rayDir);
  } else {
    rayDir.normalize();
  }
  ray.set(handPos, rayDir);
  ray.far = 8;
  return ray;
}
function getHands(){
  const renderer = window.__SVR_RENDERER__;
  const hands = [];
  try {
    const h0 = renderer?.xr?.getHand?.(0);
    const h1 = renderer?.xr?.getHand?.(1);
    if(h0) hands.push(h0);
    if(h1) hands.push(h1);
  } catch {}
  const xrHands = window.__SVR_XR_HANDS__ || window.SVR_XR_HANDS || [];
  xrHands.forEach((h)=>{ if(h && !hands.includes(h)) hands.push(h); });
  return hands;
}
function dispatchAction(action){
  try { window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action, source:"phase112-hand-pinch", checkedAt:new Date().toISOString() } })); } catch {}
  window.SVR_PHASE112_LAST_HAND_POKER_ACTION = { action, source:"phase112-hand-pinch", checkedAt:new Date().toISOString() };
}
function makeTarget(scene){
  const old = scene.getObjectByName(TARGET_ROOT); if(old) old.parent?.remove(old);
  const g = new THREE.Group(); g.name = TARGET_ROOT; g.visible = false; scene.add(g);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.18, .26, 48),
    new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.82, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  ring.name = "PHASE112_HAND_POKER_TARGET_RING";
  ring.renderOrder = 900;
  g.add(ring);
  return g;
}
function setTarget(targetRoot, hit){
  if(!targetRoot) return;
  if(!hit){ targetRoot.visible = false; return; }
  targetRoot.visible = true;
  targetRoot.position.copy(hit.point);
  targetRoot.rotation.x = -Math.PI / 2;
  pulse += 0.08;
  const s = 1 + Math.sin(pulse) * 0.08;
  targetRoot.scale.setScalar(s);
}
function qa(scene){
  return {
    pads: actionObjects(scene).length,
    duplicateOverlay: scene.getObjectByName(DUP) ? 1 : 0,
    currentTarget: currentTarget?.userData?.phase111PokerAction || currentTarget?.userData?.svrPokerAction || null,
    lastAction: window.SVR_PHASE112_LAST_HAND_POKER_ACTION || null,
    ready: actionObjects(scene).length >= 6 && !scene.getObjectByName(DUP)
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  document.title = "Scarlett Poker VR";
  const removed = removeDuplicateTable(scene);
  let targetRoot = scene.getObjectByName(TARGET_ROOT) || makeTarget(scene);
  if(!window.SVR_PHASE112_HAND_LOOP_INSTALLED){
    window.SVR_PHASE112_HAND_LOOP_INSTALLED = true;
    const tick = ()=>{
      const liveScene = window.__SVR_SCENE__;
      if(!liveScene){ requestAnimationFrame(tick); return; }
      const pads = actionObjects(liveScene);
      targetRoot = liveScene.getObjectByName(TARGET_ROOT) || makeTarget(liveScene);
      let hit = null;
      let pinching = false;
      for(const hand of getHands()){
        if(!hand?.visible) continue;
        const r = handRay(hand);
        const result = r.intersectObjects(pads, true).find((x)=>x.object?.userData?.phase111PokerAction || x.object?.userData?.svrPokerAction);
        if(result){ hit = result; }
        if(handPinching(hand)) pinching = true;
      }
      currentTarget = hit?.object || null;
      setTarget(targetRoot, hit);
      const action = currentTarget?.userData?.phase111PokerAction || currentTarget?.userData?.svrPokerAction || null;
      if(pinching && action) armedAction = action;
      if(lastPinch && !pinching && armedAction){ dispatchAction(armedAction); armedAction = null; }
      if(!pinching && !action) armedAction = null;
      lastPinch = pinching;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const report = qa(scene);
  window.SVR_PHASE112_HAND_PINCH_POKER_BUTTON_SELECTION_LOCK = { build:LABEL, active:true, handPinchPokerButtons:true, removedDuplicateTable:removed, eventName:"svr-poker-player-action", report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE112_HAND_POKER_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
