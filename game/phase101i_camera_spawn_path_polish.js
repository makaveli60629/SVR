import * as THREE from "three";

const LABEL = "PHASE-101I-CAMERA-SPAWN-PATH-POLISH-LOCK";
const ROOT = "PHASE101I_CAMERA_SPAWN_PATH_POLISH_ROOT";

window.SVR_PHASE101I_CAMERA_PATH = {
  build: LABEL,
  active: true,
  purpose: "Center the first desktop/Webex view, open the walking path, and keep Phase 260 clean.",
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function isXR(){
  return !!window.__SVR_RENDERER__?.xr?.isPresenting;
}

function isDebug(){
  const qs = new URLSearchParams(location.search || "");
  return qs.has("debug") || qs.has("hud") || qs.get("showHud") === "1";
}

function makeGlow(color, opacity = 0.28){
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function makeMat(color, opacity = 0.72){
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness: 0.72,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
}

function addBox(root, name, sx, sy, sz, x, y, z, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function installPathGuides(scene){
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);

  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);

  const gold = makeGlow(0xffd98a, 0.36);
  const cyan = makeGlow(0x7ffcff, 0.24);
  const dark = makeMat(0x050711, 0.38);

  // Soft center corridor, intentionally low and transparent.
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 11.8),
    new THREE.MeshBasicMaterial({ color: 0x210613, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })
  );
  runner.name = "PHASE101I_OPEN_CENTER_WALKING_RUNNER";
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.045, 2.3);
  root.add(runner);

  // Low rail glow lines frame the walking path without blocking it.
  addBox(root, "PHASE101I_LEFT_CLEAR_PATH_GLOW", 0.035, 0.035, 11.8, -2.05, 0.075, 2.3, gold);
  addBox(root, "PHASE101I_RIGHT_CLEAR_PATH_GLOW", 0.035, 0.035, 11.8, 2.05, 0.075, 2.3, gold);
  addBox(root, "PHASE101I_CENTER_CYAN_GUIDE", 0.025, 0.025, 10.2, 0, 0.082, 2.0, cyan);

  // Subtle matte blockers behind the view edge to reduce black-panel dominance without changing room layout.
  addBox(root, "PHASE101I_SIDE_PANEL_VISUAL_SOFTENER_LEFT", 0.06, 2.2, 5.8, -15.7, 1.45, 0.7, dark);
  addBox(root, "PHASE101I_SIDE_PANEL_VISUAL_SOFTENER_RIGHT", 0.06, 2.2, 5.8, 15.7, 1.45, 0.7, dark);

  window.SVR_PHASE101I_CAMERA_PATH.pathGuides = true;
  window.SVR_PHASE101I_CAMERA_PATH.checkedAt = new Date().toISOString();
}

function setDesktopCamera(){
  const camera = window.__SVR_CAMERA__;
  const renderer = window.__SVR_RENDERER__;
  if(!camera || !renderer || isXR()) return false;
  if(window.SVR_PHASE101I_CAMERA_PATH.cameraAligned && !isDebug()) return false;

  const qs = new URLSearchParams(location.search || "");
  if(qs.has("nosnap") || qs.has("seat")) return false;

  // Pull back slightly and center the view down the aisle for desktop/Webex.
  camera.position.set(0, 1.62, 9.45);
  camera.lookAt(0, 1.42, -3.65);
  camera.updateProjectionMatrix?.();

  window.SVR_PHASE101I_CAMERA_PATH.cameraAligned = true;
  window.SVR_PHASE101I_CAMERA_PATH.camera = { x: 0, y: 1.62, z: 9.45, lookX: 0, lookY: 1.42, lookZ: -3.65 };
  window.SVR_PHASE101I_CAMERA_PATH.checkedAt = new Date().toISOString();
  return true;
}

function removeNearViewClutter(scene){
  let removed = 0;
  const remove = [];
  scene.traverse((obj) => {
    const name = String(obj?.name || "");
    if(!name) return;
    if(/^PHASE101_PARTIAL_RUNTIME_/i.test(name)) remove.push(obj);
    if(/^PHASE257_/i.test(name) || /^PHASE258_/i.test(name)) remove.push(obj);
    if(/^PHASE259_.*(CANOPY|ROMAN|COLONNADE)/i.test(name)) remove.push(obj);
  });
  for(const obj of remove){
    if(obj.parent){ obj.parent.remove(obj); removed++; }
  }
  window.SVR_PHASE101I_CAMERA_PATH.nearClutterRemoved = removed;
}

function run(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return;
  installPathGuides(scene);
  removeNearViewClutter(scene);
  setDesktopCamera();
}

run();
setTimeout(run, 400);
setTimeout(run, 1200);
setTimeout(run, 2800);
setTimeout(run, 5200);
setTimeout(run, 9000);
