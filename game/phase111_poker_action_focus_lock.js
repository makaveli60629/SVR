import * as THREE from "three";

const LABEL = "PHASE-111-POKER-ACTION-FOCUS-LOCK";
const ROOT = "PHASE111_POKER_ACTION_FOCUS_ROOT";
const PAD_ROOT = "PHASE111_POKER_ACTION_PADS_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const ACTIONS = [
  ["fold", "FOLD", 0xff5b8c],
  ["check", "CHECK", 0x7ffcff],
  ["call", "CALL", 0x86ffb7],
  ["raise", "RAISE", 0xffd98a],
  ["all_in", "ALL-IN", 0xffffff],
  ["next", "NEXT", 0xbd7cff]
];

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function labelTexture(label){
  const c = document.createElement("canvas"); c.width = 512; c.height = 192;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,.72)"; g.fillRect(0,0,c.width,c.height);
  g.strokeStyle = "#ffd98a"; g.lineWidth = 10; g.strokeRect(8,8,c.width-16,c.height-16);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#ffffff"; g.font = "900 58px system-ui,Arial"; g.fillText(label,256,96);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function dispatchAction(action){
  try { window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action, source:"phase111-action-pad", checkedAt:new Date().toISOString() } })); } catch {}
  window.SVR_PHASE111_LAST_ACTION = { action, source:"phase111-action-pad", checkedAt:new Date().toISOString() };
}
function makePads(scene){
  const old = scene.getObjectByName(PAD_ROOT); if(old) old.parent?.remove(old);
  const group = new THREE.Group();
  group.name = PAD_ROOT;
  group.position.set(0, .98, .85);
  scene.add(group);
  ACTIONS.forEach(([key,label,color], i)=>{
    const x = -2.75 + i * 1.1;
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(.92, .36),
      new THREE.MeshBasicMaterial({ map:labelTexture(label), color:0xffffff, transparent:true, opacity:.94, side:THREE.DoubleSide, depthWrite:false })
    );
    pad.name = `PHASE111_ACTION_PAD_${key.toUpperCase()}`;
    pad.position.set(x, 0, 0);
    pad.rotation.x = -Math.PI / 2;
    pad.renderOrder = 760;
    pad.userData.phase111PokerAction = key;
    pad.userData.svrPokerAction = key;
    group.add(pad);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.47, .54, 48),
      new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.58, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
    );
    ring.name = `PHASE111_ACTION_PAD_RING_${key.toUpperCase()}`;
    ring.position.set(x, .012, 0);
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 759;
    ring.userData.phase111PokerAction = key;
    ring.userData.svrPokerAction = key;
    group.add(ring);
  });
  return group.children.length;
}
function installPointer(scene, camera){
  if(window.SVR_PHASE111_POINTER_INSTALLED) return;
  window.SVR_PHASE111_POINTER_INSTALLED = true;
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener("pointerdown", (e)=>{
    const renderer = window.__SVR_RENDERER__;
    const canvas = renderer?.domElement || document.querySelector("canvas");
    const cam = window.__SVR_CAMERA__ || camera;
    if(!canvas || !cam) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / Math.max(r.width,1)) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / Math.max(r.height,1)) * 2 + 1;
    ray.setFromCamera(mouse, cam);
    const hit = ray.intersectObjects(scene.children, true).find((h)=>h.object?.userData?.phase111PokerAction)?.object;
    if(hit?.userData?.phase111PokerAction) dispatchAction(hit.userData.phase111PokerAction);
  }, { passive:true });
}
function qa(scene){
  let duplicateOverlay = 0, pads = 0, pokerObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE103_MAIN_TABLE_SURFACE/i.test(n)) duplicateOverlay++;
    if(/PHASE111_ACTION_PAD_/i.test(n)) pads++;
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i.test(n) && o.visible !== false) pokerObjects++;
  });
  return { duplicateOverlay, pads, pokerObjects, ready:duplicateOverlay === 0 && pads >= 6 && pokerObjects > 0 };
}
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function install(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanUi();
  const removed = removeDuplicateTable(scene);
  const createdPadObjects = makePads(scene);
  installPointer(scene, camera);
  const report = qa(scene);
  window.SVR_PHASE111_POKER_ACTION_FOCUS_LOCK = { build:LABEL, active:true, actionPads:true, createdPadObjects, removedDuplicateTable:removed, report, eventName:"svr-poker-player-action", actions:ACTIONS.map(a=>a[0]), siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE111_ACTION_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
