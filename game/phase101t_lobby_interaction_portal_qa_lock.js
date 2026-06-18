import * as THREE from "three";

const LABEL = "PHASE-101T-LOBBY-INTERACTION-PORTAL-QA-LOCK";
const ROOT = "PHASE101T_LOBBY_INTERACTION_PORTAL_QA_ROOT";

window.SVR_PHASE101T_LOBBY_QA = {
  build: LABEL,
  active: true,
  purpose: "Add safe lobby portal interaction zones and QA markers after the finished lobby loads.",
  lateLoadSafe: true,
  bootTouched: false,
  siteTouched: false,
  phase295TrimChain: true,
  phase296StorefrontChain: true,
  phase85PortalChain: true,
  phase86PokerChain: true,
  phase88CardChipChain: true,
  checkedAt: new Date().toISOString()
};

function makeTextTexture(title, subtitle = "", accent = "#7ffcff"){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,1024,512);
  ctx.fillStyle = "rgba(0,0,0,.74)";
  ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(26,26,972,460);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 70px system-ui,Arial";
  ctx.fillText(title,512,190);
  if(subtitle){
    ctx.fillStyle = accent;
    ctx.font = "800 32px system-ui,Arial";
    ctx.fillText(subtitle,512,312);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}
function matGlow(color, opacity = 0.28){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function matText(title, subtitle, accent){
  return new THREE.MeshBasicMaterial({ map: makeTextTexture(title, subtitle, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false });
}
function addTextPanel(root, name, title, subtitle, x, y, z, ry, w, h, accent){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), matText(title, subtitle, accent));
  mesh.name = name;
  mesh.position.set(x,y,z);
  mesh.rotation.y = ry;
  mesh.renderOrder = 50;
  root.add(mesh);
  return mesh;
}
function addZone(root, config){
  const group = new THREE.Group();
  group.name = `PHASE101T_ZONE_${config.key}`;
  group.position.set(config.x,0,config.z);
  root.add(group);

  const ring = new THREE.Mesh(new THREE.RingGeometry(config.radius * 0.78, config.radius, 64), matGlow(config.color, 0.46));
  ring.name = `PHASE101T_ZONE_${config.key}_RING`;
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.095;
  ring.userData.portalKey = config.key;
  ring.userData.portalLabel = config.label;
  group.add(ring);

  const hit = new THREE.Mesh(new THREE.CylinderGeometry(config.radius, config.radius, 0.18, 64), new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.025, depthWrite: false }));
  hit.name = `PHASE101T_ZONE_${config.key}_HITBOX`;
  hit.position.y = 0.18;
  hit.userData.portalKey = config.key;
  hit.userData.portalLabel = config.label;
  hit.userData.portalTarget = config.target;
  hit.userData.clickable = true;
  hit.renderOrder = 80;
  group.add(hit);

  addTextPanel(group, `PHASE101T_ZONE_${config.key}_PROMPT`, config.label, config.subtitle, 0, 1.65, -0.92, 0, 2.65, 1.05, config.accent);
  return group;
}
function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE101T_LOBBY_QA.lastStatus = message;
  window.SVR_PHASE101T_LOBBY_QA.checkedAt = new Date().toISOString();
}
function announcePortal(zone){
  const label = zone?.userData?.portalLabel || zone?.userData?.portalKey || "Portal";
  const target = zone?.userData?.portalTarget || "pending";
  const payload = {
    key: zone?.userData?.portalKey || "unknown",
    label,
    target,
    activatedAt: new Date().toISOString(),
    build: LABEL
  };
  window.SVR_PHASE101T_LAST_PORTAL = payload;
  setStatus(`${label} portal selected • target: ${target}`);
  try { window.dispatchEvent(new CustomEvent("svr-portal-selected", { detail: payload })); } catch {}
  try { window.SVR_GO_PORTAL?.(payload.key); } catch {}
  return payload;
}
function installPointerInteraction(scene, camera){
  if(window.__SVR_PHASE101T_POINTER_INSTALLED__) return;
  window.__SVR_PHASE101T_POINTER_INSTALLED__ = true;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(event){
    const renderer = window.__SVR_RENDERER__;
    const canvas = renderer?.domElement || document.querySelector("canvas");
    if(!canvas || !camera) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    return hits.find((hit) => hit.object?.userData?.clickable || hit.object?.userData?.portalKey)?.object || null;
  }
  window.addEventListener("pointerdown", (event) => {
    const obj = pick(event);
    if(obj?.userData?.portalKey) announcePortal(obj);
  }, { passive: true });
}
function installKeyboardShortcuts(){
  if(window.__SVR_PHASE101T_KEYS_INSTALLED__) return;
  window.__SVR_PHASE101T_KEYS_INSTALLED__ = true;
  const map = {
    Digit1: { portalKey:"pga", portalLabel:"PGA", portalTarget:"driving-range" },
    Digit2: { portalKey:"wellness", portalLabel:"WELLNESS", portalTarget:"meditation-room" },
    Digit3: { portalKey:"store", portalLabel:"STORE", portalTarget:"store-preview" },
    Digit4: { portalKey:"scorpion", portalLabel:"SCORPION", portalTarget:"private-room" }
  };
  window.addEventListener("keydown", (event) => {
    if(!map[event.code]) return;
    announcePortal({ userData: map[event.code] });
  });
}
function runQa(scene){
  const checks = {};
  checks.scene = !!scene;
  checks.renderer = !!window.__SVR_RENDERER__;
  checks.camera = !!window.__SVR_CAMERA__;
  checks.finishedLobby = !!window.SVR_PHASE101S_FINISHED_LOBBY?.active;
  checks.phase260Geometry = !!window.SVR_PHASE260_GEOMETRY || !!scene?.getObjectByName?.("PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT");
  checks.portalRoot = !!scene?.getObjectByName?.(ROOT);
  checks.bootReleased = !!window.SVR_GAME_READY || !!window.__SVR_GAME_READY__;
  checks.moonMars = !!scene?.getObjectByName?.("PHASE101S_REAL_MOON_HIGH_NORTH_GROUP") && !!scene?.getObjectByName?.("PHASE101S_MARS_HIGH_NORTH_GROUP");
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  window.SVR_PHASE101T_LOBBY_QA.checks = checks;
  window.SVR_PHASE101T_LOBBY_QA.failed = failed;
  window.SVR_PHASE101T_LOBBY_QA.status = failed.length ? "needs-review" : "ready";
  window.SVR_PHASE101T_LOBBY_QA.checkedAt = new Date().toISOString();
  return failed;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  if(!scene || !camera) return false;
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);

  const zones = [
    { key:"pga", label:"PGA", subtitle:"Select for driving range", target:"driving-range", x:9.25, z:-3.9, radius:1.05, color:0x7ffcff, accent:"#7ffcff" },
    { key:"wellness", label:"WELLNESS", subtitle:"Select for meditation room", target:"meditation-room", x:-9.25, z:-3.9, radius:1.05, color:0xb55cff, accent:"#b55cff" },
    { key:"store", label:"STORE", subtitle:"Select for shop preview", target:"store-preview", x:7.9, z:6.15, radius:1.05, color:0xffd98a, accent:"#ffd98a" },
    { key:"scorpion", label:"SCORPION", subtitle:"Select for private room", target:"private-room", x:-7.9, z:6.15, radius:1.05, color:0x66ff99, accent:"#66ff99" }
  ];
  zones.forEach((zone) => addZone(root, zone));

  addTextPanel(root, "PHASE101T_QA_BOARD", "LOBBY READY", "1 PGA • 2 Wellness • 3 Store • 4 Scorpion", 0, 2.55, 9.95, Math.PI, 5.25, 1.25, "#7ffcff");
  installPointerInteraction(scene, camera);
  installKeyboardShortcuts();

  const failed = runQa(scene);
  setStatus(failed.length ? `Phase 101T QA needs review: ${failed.join(", ")}` : "Phase 101T lobby interaction QA ready");
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101t-lobby-interaction-ready");
  return true;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if(install() || tries > 80) clearInterval(timer);
}, 250);
setTimeout(install, 2200);
setTimeout(install, 5200);
setTimeout(install, 9000);
window.SVR_RUN_PHASE101T_QA = () => runQa(window.__SVR_SCENE__);
import("./phase295_storefront_doorway_trim_lock.js?v=phase295-trim-chain").catch((e)=>{ window.SVR_PHASE295_CHAIN_ERROR = String(e?.message || e); });
import("./phase296_storefront_presence_lock.js?v=phase296-presence-chain").catch((e)=>{ window.SVR_PHASE296_CHAIN_ERROR = String(e?.message || e); });
import("./phase296_storefront_panels.js?v=phase296-panels-chain").catch((e)=>{ window.SVR_PHASE296_PANEL_ERROR = String(e?.message || e); });
import("./phase85_portal_enable_solid_lobby_lock.js?v=phase85-portal-solid-chain").catch((e)=>{ window.SVR_PHASE85_PORTAL_ERROR = String(e?.message || e); });
import("./phase86_playable_poker_core_lock.js?v=phase86-playable-poker-chain").catch((e)=>{ window.SVR_PHASE86_POKER_ERROR = String(e?.message || e); });
import("./phase88_vr_card_chip_interaction_lock.js?v=phase88-card-chip-chain").catch((e)=>{ window.SVR_PHASE88_CARD_CHIP_ERROR = String(e?.message || e); });
