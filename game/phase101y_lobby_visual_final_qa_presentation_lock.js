import * as THREE from "three";

const LABEL = "PHASE-101Y-LOBBY-VISUAL-FINAL-QA-PRESENTATION-LOCK";
const ROOT = "PHASE101Y_LOBBY_VISUAL_FINAL_QA_ROOT";

window.SVR_PHASE101Y_PRESENTATION_QA = {
  build: LABEL,
  active: true,
  purpose: "Final visual QA and screenshot-ready presentation lock for the finished lobby.",
  lateLoadSafe: true,
  bootTouched: false,
  movementCoreTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function iso(){ return new Date().toISOString(); }
function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE101Y_PRESENTATION_QA.lastStatus = message;
  window.SVR_PHASE101Y_PRESENTATION_QA.checkedAt = iso();
}
function matGlow(color, opacity = 0.26){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
}
function makeTexture(title, subtitle = "", lines = [], accent = "#7ffcff"){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.76)";
  ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(26,26,972,460);
  ctx.strokeStyle = "#ffd98a";
  ctx.lineWidth = 4;
  ctx.strokeRect(56,56,912,400);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px system-ui,Arial";
  ctx.fillText(title,512,122);
  if(subtitle){
    ctx.fillStyle = accent;
    ctx.font = "800 28px system-ui,Arial";
    ctx.fillText(subtitle,512,184);
  }
  ctx.textAlign = "left";
  ctx.font = "800 25px system-ui,Arial";
  lines.slice(0,7).forEach((line, index) => {
    ctx.fillStyle = line.ok === false ? "#ff8096" : line.ok === true ? "#91ffb6" : "#d7eaff";
    ctx.fillText(`${line.label}: ${line.value}`, 80, 245 + index * 34);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}
function addPanel(root, name, title, subtitle, lines, x, y, z, ry, w, h, accent){
  const material = new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle, lines, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.name = name;
  mesh.position.set(x,y,z);
  mesh.rotation.y = ry;
  mesh.renderOrder = 95;
  root.add(mesh);
  return mesh;
}
function ensurePresentationMarkers(root){
  const spots = [
    { name:"SPAWN", x:0, z:8.35, color:0x7ffcff },
    { name:"TABLE", x:0, z:2.55, color:0xffd98a },
    { name:"PGA", x:9.25, z:-3.9, color:0x7ffcff },
    { name:"WELLNESS", x:-9.25, z:-3.9, color:0xb55cff },
    { name:"STORE", x:7.9, z:6.15, color:0xffd98a },
    { name:"SCORPION", x:-7.9, z:6.15, color:0x66ff99 }
  ];
  spots.forEach((spot) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 48), matGlow(spot.color, 0.22));
    ring.name = `PHASE101Y_PRESENTATION_MARKER_${spot.name}`;
    ring.position.set(spot.x, 0.115, spot.z);
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);
  });
}
function portalKeys(scene){
  const keys = new Set();
  scene?.traverse?.((obj) => { if(obj?.userData?.portalKey) keys.add(obj.userData.portalKey); });
  return Array.from(keys).sort();
}
function objectExists(scene, name){ return !!scene?.getObjectByName?.(name); }
function runVisualQa(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const renderer = window.__SVR_RENDERER__;
  const keys = portalKeys(scene);
  const checks = {
    scene: !!scene,
    camera: !!camera,
    renderer: !!renderer,
    bootReleased: !!window.SVR_GAME_READY || !!window.__SVR_GAME_READY__,
    phase101sLobby: !!window.SVR_PHASE101S_FINISHED_LOBBY?.active,
    phase101tPortals: !!window.SVR_PHASE101T_LOBBY_QA?.active,
    phase101xFixPass: !!window.SVR_PHASE101X_FIX_PASS?.active,
    portalCount: keys.length >= 4,
    moon: objectExists(scene, "PHASE101S_REAL_MOON_HIGH_NORTH_GROUP"),
    mars: objectExists(scene, "PHASE101S_MARS_HIGH_NORTH_GROUP"),
    tableFocus: objectExists(scene, "PHASE101S_TABLE_FOCUS_HALO"),
    qaBoard: objectExists(scene, "PHASE101T_QA_BOARD")
  };
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  const qa = window.SVR_PHASE101Y_PRESENTATION_QA;
  qa.checks = checks;
  qa.failed = failed;
  qa.portalKeys = keys;
  qa.status = failed.length ? "needs-visual-review" : "screenshot-ready";
  qa.presentationUrls = {
    current: location.href,
    fresh: "/game/index.html?v=phase101y-presentation-lock",
    clean: "/game/index.html?v=phase101y-clean-shot&presentation=1"
  };
  qa.checkedAt = iso();
  return qa;
}
function applyPresentationCamera(camera){
  if(!camera || window.__SVR_PHASE101Y_CAMERA_LOCKED__) return false;
  const params = new URLSearchParams(location.search);
  const requested = params.has("presentation") || params.has("camera101y");
  if(!requested) return false;
  camera.position.set(0, 1.72, 10.4);
  camera.lookAt(0, 1.42, -2.6);
  camera.updateProjectionMatrix?.();
  window.__SVR_PHASE101Y_CAMERA_LOCKED__ = true;
  window.SVR_PHASE101Y_PRESENTATION_QA.presentationCameraApplied = true;
  return true;
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

  const qa = runVisualQa();
  const lines = [
    { label:"Lobby", value:qa.checks.phase101sLobby ? "finished" : "pending", ok:qa.checks.phase101sLobby },
    { label:"Portals", value:qa.portalKeys.join(", ") || "missing", ok:qa.checks.portalCount },
    { label:"Moon", value:qa.checks.moon ? "high north" : "missing", ok:qa.checks.moon },
    { label:"Mars", value:qa.checks.mars ? "high north" : "missing", ok:qa.checks.mars },
    { label:"Table", value:qa.checks.tableFocus ? "focused" : "review", ok:qa.checks.tableFocus },
    { label:"Boot", value:qa.checks.bootReleased ? "released" : "review", ok:qa.checks.bootReleased },
    { label:"Status", value:qa.status, ok:qa.status === "screenshot-ready" }
  ];
  addPanel(root, "PHASE101Y_PRESENTATION_QA_BOARD", "SVR LOBBY FINAL QA", "Screenshot / Webex presentation lock", lines, 0, 3.05, 11.18, Math.PI, 5.9, 2.75, "#7ffcff");
  ensurePresentationMarkers(root);
  applyPresentationCamera(camera);
  setStatus(qa.status === "screenshot-ready" ? "Phase 101Y lobby screenshot-ready" : `Phase 101Y review: ${qa.failed.join(", ")}`);
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101y-presentation-ready");
  return true;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if(install() || tries > 80) clearInterval(timer);
}, 250);
setTimeout(install, 2400);
setTimeout(install, 5600);
setTimeout(install, 9600);
window.SVR_RUN_PHASE101Y_QA = runVisualQa;
window.SVR_APPLY_PHASE101Y_PRESENTATION_CAMERA = () => applyPresentationCamera(window.__SVR_CAMERA__ || window.__SVR_SCENE__?.userData?._camera);
