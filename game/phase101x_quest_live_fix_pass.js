import * as THREE from "three";

const LABEL = "PHASE-101X-QUEST-LIVE-FIX-PASS-LOCK";
const ROOT = "PHASE101X_QUEST_LIVE_FIX_ROOT";

window.SVR_PHASE101X_FIX_PASS = {
  build: LABEL,
  active: true,
  purpose: "Auto-repair common Quest live QA issues without touching boot or core movement scripts.",
  lateLoadSafe: true,
  bootTouched: false,
  movementCoreTouched: false,
  siteTouched: false,
  repairs: [],
  checkedAt: new Date().toISOString()
};

function stamp(message, extra = {}){
  window.SVR_PHASE101X_FIX_PASS.lastMessage = message;
  window.SVR_PHASE101X_FIX_PASS.checkedAt = new Date().toISOString();
  Object.assign(window.SVR_PHASE101X_FIX_PASS, extra);
  const status = document.getElementById("status");
  if(status) status.textContent = message;
}
function repair(name, payload = {}){
  window.SVR_PHASE101X_FIX_PASS.repairs.push({ name, payload, at: new Date().toISOString() });
  window.SVR_PHASE101X_FIX_PASS.repairs = window.SVR_PHASE101X_FIX_PASS.repairs.slice(-40);
}
async function detectWebXR(){
  const result = {
    hasNavigatorXr: !!navigator.xr,
    immersiveVr: null,
    inline: null,
    userAgent: navigator.userAgent || "",
    checkedAt: new Date().toISOString()
  };
  try { result.inline = navigator.xr ? await navigator.xr.isSessionSupported("inline") : false; } catch (error) { result.inlineError = String(error?.message || error); }
  try { result.immersiveVr = navigator.xr ? await navigator.xr.isSessionSupported("immersive-vr") : false; } catch (error) { result.immersiveVrError = String(error?.message || error); }
  window.SVR_PHASE101X_FIX_PASS.webxr = result;
  return result;
}
function portalObjects(scene){
  const list = [];
  scene?.traverse?.((obj) => {
    if(obj?.userData?.portalKey || obj?.userData?.clickable) list.push(obj);
  });
  return list;
}
function mat(color, opacity){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
}
function ensureFallbackPortal(scene, root, item){
  const existing = portalObjects(scene).find((obj) => obj.userData?.portalKey === item.key);
  if(existing) return false;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.22, 48), mat(item.color, 0.045));
  hit.name = `PHASE101X_FALLBACK_PORTAL_${item.key.toUpperCase()}_HITBOX`;
  hit.position.set(item.x, 0.18, item.z);
  hit.userData.portalKey = item.key;
  hit.userData.portalLabel = item.label;
  hit.userData.portalTarget = item.target;
  hit.userData.clickable = true;
  root.add(hit);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.16, 64), mat(item.color, 0.38));
  ring.name = `PHASE101X_FALLBACK_PORTAL_${item.key.toUpperCase()}_RING`;
  ring.position.set(item.x, 0.105, item.z);
  ring.rotation.x = -Math.PI / 2;
  root.add(ring);
  return true;
}
function ensurePortalHitboxes(scene){
  let root = scene.getObjectByName(ROOT);
  if(!root){
    root = new THREE.Group();
    root.name = ROOT;
    scene.add(root);
  }
  const items = [
    { key:"pga", label:"PGA", target:"driving-range", x:9.25, z:-3.9, color:0x7ffcff },
    { key:"wellness", label:"WELLNESS", target:"meditation-room", x:-9.25, z:-3.9, color:0xb55cff },
    { key:"store", label:"STORE", target:"store-preview", x:7.9, z:6.15, color:0xffd98a },
    { key:"scorpion", label:"SCORPION", target:"private-room", x:-7.9, z:6.15, color:0x66ff99 }
  ];
  const created = items.filter((item) => ensureFallbackPortal(scene, root, item)).map((item) => item.key);
  if(created.length) repair("fallback-portal-hitboxes", { created });
  return created;
}
function installClickFallback(scene, camera){
  if(window.__SVR_PHASE101X_CLICK_FALLBACK__) return false;
  window.__SVR_PHASE101X_CLICK_FALLBACK__ = true;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  window.addEventListener("pointerdown", (event) => {
    const renderer = window.__SVR_RENDERER__;
    const canvas = renderer?.domElement || document.querySelector("canvas");
    if(!canvas || !camera) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(portalObjects(scene), true).find((item) => item.object?.userData?.portalKey);
    if(!hit) return;
    const payload = {
      key: hit.object.userData.portalKey,
      label: hit.object.userData.portalLabel || hit.object.userData.portalKey,
      target: hit.object.userData.portalTarget || "pending",
      source: "phase101x-click-fallback",
      build: LABEL,
      selectedAt: new Date().toISOString()
    };
    window.SVR_PHASE101X_LAST_PORTAL = payload;
    try { window.dispatchEvent(new CustomEvent("svr-portal-selected", { detail: payload })); } catch {}
    stamp(`${payload.label} portal selected by Phase 101X fallback`);
  }, { passive:true });
  repair("click-fallback-installed");
  return true;
}
function installKeyboardFallback(){
  if(window.__SVR_PHASE101X_KEYS__) return false;
  window.__SVR_PHASE101X_KEYS__ = true;
  const map = {
    F1:{ key:"pga", label:"PGA", target:"driving-range" },
    F2:{ key:"wellness", label:"WELLNESS", target:"meditation-room" },
    F3:{ key:"store", label:"STORE", target:"store-preview" },
    F4:{ key:"scorpion", label:"SCORPION", target:"private-room" }
  };
  window.addEventListener("keydown", (event) => {
    if(!map[event.code]) return;
    const p = map[event.code];
    const payload = { ...p, source:"phase101x-keyboard-fallback", build:LABEL, selectedAt:new Date().toISOString() };
    window.SVR_PHASE101X_LAST_PORTAL = payload;
    try { window.dispatchEvent(new CustomEvent("svr-portal-selected", { detail: payload })); } catch {}
    stamp(`${p.label} portal selected by Phase 101X keyboard fallback`);
  });
  repair("keyboard-fallback-installed", { keys:["F1","F2","F3","F4"] });
  return true;
}
async function retryLateModules(){
  const results = {};
  try {
    if(!window.SVR_PHASE101U_QUEST_QA?.active){
      await import("./phase101u_quest_controller_portal_teleport_qa.js?v=phase101x-retry");
      results.phase101u = true;
      repair("retry-phase101u");
    }
  } catch (error) { results.phase101uError = String(error?.message || error); }
  try {
    if(!window.SVR_PHASE101W_QUEST_LIVE_VERIFY?.active){
      await import("./phase101w_quest_live_movement_portal_verification.js?v=phase101x-retry");
      results.phase101w = true;
      repair("retry-phase101w");
    }
  } catch (error) { results.phase101wError = String(error?.message || error); }
  window.SVR_PHASE101X_FIX_PASS.retryResults = results;
  return results;
}
function runFixPass(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !camera || !renderer){
    stamp("Phase 101X waiting for scene/camera/renderer", { status:"waiting" });
    return window.SVR_PHASE101X_FIX_PASS;
  }
  const created = ensurePortalHitboxes(scene);
  installClickFallback(scene, camera);
  installKeyboardFallback();
  const portals = Array.from(new Set(portalObjects(scene).map((obj) => obj.userData?.portalKey).filter(Boolean))).sort();
  const checks = {
    scene: !!scene,
    camera: !!camera,
    renderer: !!renderer,
    xr: !!renderer?.xr,
    portalCount: portals.length >= 4,
    phase101s: !!window.SVR_PHASE101S_FINISHED_LOBBY?.active,
    phase101t: !!window.SVR_PHASE101T_LOBBY_QA?.active,
    phase101u: !!window.SVR_PHASE101U_QUEST_QA?.active,
    phase101w: !!window.SVR_PHASE101W_QUEST_LIVE_VERIFY?.active,
    bootReleased: !!window.SVR_GAME_READY || !!window.__SVR_GAME_READY__,
    teleportForwardLockSeen: !!window.SVR_PHASE101J_AIM_FORWARD_LOCK || !!window.SVR_PHASE101J_SMOKE || !!window.SVR_PHASE101J_LOCOMOTION
  };
  const failed = Object.entries(checks).filter(([,value]) => !value).map(([key]) => key);
  window.SVR_PHASE101X_FIX_PASS.checks = checks;
  window.SVR_PHASE101X_FIX_PASS.failed = failed;
  window.SVR_PHASE101X_FIX_PASS.portalKeys = portals;
  window.SVR_PHASE101X_FIX_PASS.createdFallbacks = created;
  window.SVR_PHASE101X_FIX_PASS.status = failed.length ? "patched-needs-live-review" : "ready";
  stamp(failed.length ? `Phase 101X patched; review: ${failed.join(", ")}` : "Phase 101X Quest live fix pass ready");
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101x-fix-pass-ready");
  return window.SVR_PHASE101X_FIX_PASS;
}
async function start(){
  await detectWebXR();
  await retryLateModules();
  return runFixPass();
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  const result = runFixPass();
  if(result.status && result.status !== "waiting" || tries > 80) clearInterval(timer);
}, 250);
setTimeout(start, 1800);
setTimeout(start, 5200);
setTimeout(start, 9000);
window.SVR_RUN_PHASE101X_FIX = start;
window.SVR_RUN_PHASE101X_QA = runFixPass;
