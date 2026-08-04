import * as THREE from "three";

const LABEL = "PHASE-101-PARTIAL-RUNTIME-RENDER-GUARD";
const STARTED_AT = Date.now();

window.SVR_PHASE101_PARTIAL_RENDER_GUARD = {
  build: LABEL,
  active: true,
  purpose: "Render an already-created scene if the full runtime stalls before its animation loop starts.",
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function hideBoot(reason){
  const boot = document.getElementById("bootFallback");
  if(boot){
    boot.style.opacity = "0";
    boot.style.pointerEvents = "none";
    setTimeout(() => { boot.style.display = "none"; }, 380);
  }
  window.SVR_PHASE101_PARTIAL_RENDER_GUARD.bootHiddenReason = reason;
  window.SVR_PHASE101_PARTIAL_RENDER_GUARD.checkedAt = new Date().toISOString();
}

function makeMarkerTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(3,6,18,.92)";
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = "#ffd98a";
  ctx.lineWidth = 10;
  ctx.strokeRect(24,24,c.width-48,c.height-48);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px system-ui,Arial";
  ctx.fillText("SVR POKER", c.width/2, 130);
  ctx.fillStyle = "#7ffcff";
  ctx.font = "800 30px system-ui,Arial";
  ctx.fillText("Runtime scene visible • completing load", c.width/2, 220);
  ctx.fillStyle = "#ffd98a";
  ctx.font = "700 22px system-ui,Arial";
  ctx.fillText("Phase 101 render guard", c.width/2, 292);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function addPartialMarker(scene){
  if(scene.getObjectByName("PHASE101_PARTIAL_RUNTIME_MARKER")) return;
  const light = new THREE.HemisphereLight(0xd8e6ff, 0x080812, 0.72);
  light.name = "PHASE101_PARTIAL_RUNTIME_HEMI_LIGHT";
  scene.add(light);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.8),
    new THREE.MeshBasicMaterial({ map: makeMarkerTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  panel.name = "PHASE101_PARTIAL_RUNTIME_MARKER";
  panel.position.set(0, 2.7, -5.5);
  scene.add(panel);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0x111522, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
  );
  floor.name = "PHASE101_PARTIAL_RUNTIME_FLOOR_MARKER";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);
}

function installPartialRenderLoop(){
  if(window.__SVR_GAME_READY__) return false;
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  if(!scene || !renderer || !camera) return false;
  if(window.__SVR_PHASE101_PARTIAL_LOOP_ACTIVE__) return true;

  addPartialMarker(scene);
  scene.userData._camera = camera;
  window.__SVR_PHASE101_PARTIAL_LOOP_ACTIVE__ = true;
  window.SVR_PHASE101_PARTIAL_RENDER_GUARD.partialLoopActive = true;
  window.SVR_PHASE101_PARTIAL_RENDER_GUARD.installedMs = Date.now() - STARTED_AT;
  window.SVR_PHASE101_PARTIAL_RENDER_GUARD.checkedAt = new Date().toISOString();

  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    scene.userData._tickWorld?.(dt);
    renderer.render(scene, camera);
  });

  hideBoot("phase101-partial-runtime-render-loop");
  const status = document.getElementById("status");
  if(status) status.textContent = "Scene recovered by Phase 101 render guard.";
  return true;
}

const guardTimer = setInterval(() => {
  if(window.__SVR_GAME_READY__){
    clearInterval(guardTimer);
    return;
  }
  if(Date.now() - STARTED_AT > 1600 && installPartialRenderLoop()){
    clearInterval(guardTimer);
  }
}, 250);

setTimeout(() => {
  if(!window.__SVR_GAME_READY__) installPartialRenderLoop();
}, 3600);
