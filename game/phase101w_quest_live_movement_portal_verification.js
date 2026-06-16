import * as THREE from "three";

const LABEL = "PHASE-101W-QUEST-LIVE-MOVEMENT-PORTAL-VERIFICATION-LOCK";
const ROOT = "PHASE101W_QUEST_LIVE_VERIFICATION_ROOT";

window.SVR_PHASE101W_QUEST_LIVE_VERIFY = {
  build: LABEL,
  active: true,
  purpose: "Quest live movement and portal selection verification after Phase 101U.",
  lateLoadSafe: true,
  bootTouched: false,
  siteTouched: false,
  samples: [],
  checkedAt: new Date().toISOString()
};

function nowIso(){ return new Date().toISOString(); }
function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.lastStatus = message;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.checkedAt = nowIso();
}
function makePanelTexture(lines){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.78)";
  ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = "#7ffcff";
  ctx.lineWidth = 10;
  ctx.strokeRect(24,24,976,464);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 44px system-ui,Arial";
  ctx.fillText("PHASE 101W QUEST VERIFY", 58, 58);
  ctx.font = "800 28px system-ui,Arial";
  lines.slice(0, 9).forEach((line, index) => {
    ctx.fillStyle = line.ok === false ? "#ff7b92" : line.ok === true ? "#8dffb0" : "#d7eaff";
    ctx.fillText(`${line.label}: ${line.value}`, 58, 132 + index * 38);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}
function updatePanel(root, lines){
  let panel = root.getObjectByName("PHASE101W_QA_PANEL");
  const material = new THREE.MeshBasicMaterial({ map: makePanelTexture(lines), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  if(!panel){
    panel = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.7), material);
    panel.name = "PHASE101W_QA_PANEL";
    panel.position.set(0, 2.75, 10.55);
    panel.rotation.y = Math.PI;
    panel.renderOrder = 90;
    root.add(panel);
  }else{
    if(panel.material?.map) panel.material.map.dispose?.();
    panel.material?.dispose?.();
    panel.material = material;
  }
}
function getCameraForward(camera){
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if(forward.lengthSq() < 0.0001) forward.set(0,0,-1);
  return forward.normalize();
}
function readMovementVector(){
  const v = window.SVR_PHASE101J_MOVE_VECTOR || window.SVR_PHASE101J_MOVE_FORWARD_SOURCE || null;
  return v || null;
}
function readPortalKeys(scene){
  const keys = new Set();
  scene?.traverse?.((obj) => {
    if(obj?.userData?.portalKey) keys.add(obj.userData.portalKey);
  });
  return Array.from(keys).sort();
}
function sampleState(scene, camera, renderer){
  const xrPresenting = !!renderer?.xr?.isPresenting;
  const cameraForward = camera ? getCameraForward(camera) : null;
  const portals = readPortalKeys(scene);
  const lastPortal = window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL || window.SVR_PHASE101T_LAST_PORTAL || null;
  const teleport = window.SVR_PHASE101J_AIM_FORWARD_LOCK || null;
  const sample = {
    checkedAt: nowIso(),
    xrPresenting,
    portals,
    lastPortal,
    cameraPosition: camera ? { x:+camera.position.x.toFixed(3), y:+camera.position.y.toFixed(3), z:+camera.position.z.toFixed(3) } : null,
    cameraForward: cameraForward ? { x:+cameraForward.x.toFixed(3), z:+cameraForward.z.toFixed(3) } : null,
    moveVector: readMovementVector(),
    teleport,
    questQa: window.SVR_PHASE101U_QUEST_QA || null,
    lobbyQa: window.SVR_PHASE101T_LOBBY_QA || null
  };
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.samples.push(sample);
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.samples = window.SVR_PHASE101W_QUEST_LIVE_VERIFY.samples.slice(-30);
  return sample;
}
function runQa(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const renderer = window.__SVR_RENDERER__;
  const sample = sampleState(scene, camera, renderer);
  const checks = {
    scene: !!scene,
    camera: !!camera,
    renderer: !!renderer,
    xrAvailable: !!renderer?.xr,
    bootReleased: !!window.SVR_GAME_READY || !!window.__SVR_GAME_READY__,
    phase101s: !!window.SVR_PHASE101S_FINISHED_LOBBY?.active,
    phase101t: !!window.SVR_PHASE101T_LOBBY_QA?.active,
    phase101u: !!window.SVR_PHASE101U_QUEST_QA?.active,
    portalCount: sample.portals.length >= 4,
    teleportForwardLockKnown: !!window.SVR_PHASE101J_AIM_FORWARD_LOCK || !!window.SVR_PHASE101J_SMOKE || !!window.SVR_PHASE101J_LOCOMOTION,
    controllerQaKnown: !!window.SVR_PHASE101U_QUEST_QA
  };
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  const status = failed.length ? "needs-review" : "ready";
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.checks = checks;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.failed = failed;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.status = status;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.lastSample = sample;
  window.SVR_PHASE101W_QUEST_LIVE_VERIFY.checkedAt = nowIso();
  return window.SVR_PHASE101W_QUEST_LIVE_VERIFY;
}
function installPortalEventRecorder(){
  if(window.__SVR_PHASE101W_PORTAL_RECORDER__) return;
  window.__SVR_PHASE101W_PORTAL_RECORDER__ = true;
  window.addEventListener("svr-portal-selected", (event) => {
    window.SVR_PHASE101W_QUEST_LIVE_VERIFY.lastPortalEvent = {
      detail: event.detail || null,
      receivedAt: nowIso()
    };
    runQa();
  });
}
function install(scene){
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);
  installPortalEventRecorder();
  const qa = runQa();
  const lines = [
    { label:"Scene", value:qa.checks.scene ? "OK" : "missing", ok:qa.checks.scene },
    { label:"Renderer", value:qa.checks.renderer ? "OK" : "missing", ok:qa.checks.renderer },
    { label:"WebXR", value:qa.checks.xrAvailable ? "available" : "missing", ok:qa.checks.xrAvailable },
    { label:"101S Lobby", value:qa.checks.phase101s ? "loaded" : "pending", ok:qa.checks.phase101s },
    { label:"101T Portals", value:qa.checks.phase101t ? "loaded" : "pending", ok:qa.checks.phase101t },
    { label:"101U Controller", value:qa.checks.phase101u ? "loaded" : "pending", ok:qa.checks.phase101u },
    { label:"Portals", value:String(qa.lastSample?.portals?.join(",") || "none"), ok:qa.checks.portalCount },
    { label:"Teleport", value:qa.checks.teleportForwardLockKnown ? "instrumented" : "not seen yet", ok:qa.checks.teleportForwardLockKnown },
    { label:"Status", value:qa.status, ok:qa.status === "ready" }
  ];
  updatePanel(root, lines);
  setStatus(qa.status === "ready" ? "Phase 101W Quest live verification ready" : `Phase 101W QA: ${qa.failed.join(", ")}`);
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101w-quest-live-verification-ready");
  return true;
}
function start(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  install(scene);
  return true;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if(start() || tries > 80) clearInterval(timer);
}, 250);
setInterval(() => {
  const scene = window.__SVR_SCENE__;
  if(scene?.getObjectByName?.(ROOT)) install(scene);
}, 5000);
setTimeout(start, 2200);
setTimeout(start, 5200);
setTimeout(start, 9200);
window.SVR_RUN_PHASE101W_QA = runQa;
