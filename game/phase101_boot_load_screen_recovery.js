import * as THREE from "three";

const LABEL = "PHASE-101-BOOT-LOAD-SCREEN-RECOVERY-LOCK";
const STARTED_AT = Date.now();

window.SVR_PHASE101_BOOT_RECOVERY = {
  build: LABEL,
  active: true,
  purpose: "Prevent stuck loading screen and guarantee visible lobby/fallback renderer.",
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function setText(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

function logBoot(message){
  window.SVR_PHASE101_BOOT_RECOVERY.lastMessage = message;
  window.SVR_PHASE101_BOOT_RECOVERY.checkedAt = new Date().toISOString();
  setText("status", message);
}

function hideBoot(reason){
  const boot = document.getElementById("bootFallback");
  if(boot){
    boot.style.opacity = "0";
    boot.style.pointerEvents = "none";
    setTimeout(() => { boot.style.display = "none"; }, 380);
  }
  window.SVR_PHASE101_BOOT_RECOVERY.cleared = true;
  window.SVR_PHASE101_BOOT_RECOVERY.clearReason = reason;
  window.SVR_PHASE101_BOOT_RECOVERY.clearMs = Date.now() - STARTED_AT;
  window.SVR_PHASE101_BOOT_RECOVERY.checkedAt = new Date().toISOString();
}

function showErrorPanel(title, detail){
  const err = document.getElementById("err");
  if(err){
    err.style.display = "block";
    err.textContent = `${title}\n${detail || ""}`.trim();
  }
  logBoot(title);
}

function makeLabel(text, sub){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#030612";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "#7ffcff";
  ctx.lineWidth = 12;
  ctx.strokeRect(28,28,canvas.width-56,canvas.height-56);
  ctx.strokeStyle = "#ffd98a";
  ctx.lineWidth = 4;
  ctx.strokeRect(58,58,canvas.width-116,canvas.height-116);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 74px system-ui,Arial";
  ctx.fillText(text, canvas.width/2, 185);
  ctx.fillStyle = "#ffd98a";
  ctx.font = "800 34px system-ui,Arial";
  ctx.fillText(sub, canvas.width/2, 300);
  ctx.fillStyle = "#bffcff";
  ctx.font = "700 24px system-ui,Arial";
  ctx.fillText("Phase 101 boot-safe renderer", canvas.width/2, 382);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBootSafeLobby(){
  if(window.__SVR_SCENE__ || window.__SVR_RENDERER__) return false;
  const app = document.getElementById("app");
  if(!app) return false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000007);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.2, 800);
  camera.position.set(0, 1.62, 7.2);
  camera.lookAt(0, 1.35, -2.0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  app.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xc8dcff, 0x050611, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(-5, 9, 7);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 28),
    new THREE.MeshStandardMaterial({ color: 0x111522, roughness: 0.82, metalness: 0.04 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 15),
    new THREE.MeshBasicMaterial({ color: 0x5b071b, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.z = 1.5;
  carpet.position.y = 0.018;
  scene.add(carpet);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x070a15, roughness: 0.9, metalness: 0.02 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(32, 5.5, 0.3), wallMat);
  backWall.position.set(0, 2.75, -13.2);
  scene.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 28), wallMat);
  leftWall.position.set(-16, 2.75, 0);
  scene.add(leftWall);
  const rightWall = leftWall.clone();
  rightWall.position.x = 16;
  scene.add(rightWall);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 2.8),
    new THREE.MeshBasicMaterial({ map: makeLabel("SVR POKER", "Boot-safe lobby recovered"), transparent: true, side: THREE.DoubleSide })
  );
  panel.position.set(0, 3.1, -12.95);
  scene.add(panel);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.22, 72),
    new THREE.MeshStandardMaterial({ color: 0x081b10, roughness: 0.7, metalness: 0.08 })
  );
  table.scale.z = 0.62;
  table.position.set(0, 0.86, 0.55);
  scene.add(table);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 32, 20),
    new THREE.MeshStandardMaterial({ color: 0xd8d6ce, emissive: 0x121820, emissiveIntensity: 0.2, roughness: 0.78 })
  );
  moon.position.set(-4.0, 8.8, -17.0);
  scene.add(moon);
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xbf4b2e, emissive: 0x210703, emissiveIntensity: 0.2, roughness: 0.8 })
  );
  mars.position.set(5.5, 8.2, -19.0);
  scene.add(mars);

  function roomClamp(x,z){ return { x: THREE.MathUtils.clamp(x, -15.2, 15.2), z: THREE.MathUtils.clamp(z, -12.8, 13.5) }; }

  scene.userData._camera = camera;
  scene.userData._tickWorld = (dt) => {
    moon.rotation.y += dt * 0.03;
    mars.rotation.y += dt * 0.05;
  };

  window.__SVR_SCENE__ = scene;
  window.__SVR_CAMERA__ = camera;
  window.__SVR_RENDERER__ = renderer;
  window.__SVR_BOOT_SAFE_LOBBY__ = true;
  window.__SVR_GAME_READY__ = true;
  window.SVR_PHASE101_BOOT_RECOVERY.fallbackRenderer = true;
  window.SVR_PHASE101_BOOT_RECOVERY.roomClamp = true;

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    scene.userData._tickWorld?.(dt);
    renderer.render(scene, camera);
  });

  hideBoot("phase101-fallback-renderer");
  setText("mode", "Boot-safe lobby");
  logBoot("Boot-safe lobby recovered. Full runtime did not initialize in time.");
  return true;
}

window.addEventListener("error", (event) => {
  window.SVR_PHASE101_BOOT_RECOVERY.lastError = event?.error?.stack || event?.message || String(event);
  showErrorPanel("Runtime error captured by Phase 101 boot recovery.", window.SVR_PHASE101_BOOT_RECOVERY.lastError);
});

window.addEventListener("unhandledrejection", (event) => {
  window.SVR_PHASE101_BOOT_RECOVERY.lastRejection = event?.reason?.stack || event?.reason || String(event?.reason || event);
  showErrorPanel("Runtime promise rejection captured by Phase 101 boot recovery.", window.SVR_PHASE101_BOOT_RECOVERY.lastRejection);
});

const clearTimer = setInterval(() => {
  if(window.__SVR_GAME_READY__){
    hideBoot("game-ready");
    clearInterval(clearTimer);
    return;
  }
  if(window.__SVR_SCENE__ && window.__SVR_RENDERER__ && Date.now() - STARTED_AT > 1800){
    hideBoot("scene-visible-before-ready");
    clearInterval(clearTimer);
  }
}, 250);

setTimeout(() => {
  if(!window.__SVR_SCENE__ && !window.__SVR_RENDERER__){
    createBootSafeLobby();
  }
}, 5200);

setTimeout(() => {
  if(!window.__SVR_GAME_READY__ && window.__SVR_SCENE__ && window.__SVR_RENDERER__){
    hideBoot("scene-visible-timeout");
    logBoot("Scene visible. Loader cleared by Phase 101 timeout guard.");
  }
}, 8200);

logBoot("Phase 101 boot recovery armed.");
