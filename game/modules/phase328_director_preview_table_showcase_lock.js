import * as THREE from "three";

const BUILD = "PHASE-328-DIRECTOR-PREVIEW-TABLE-SHOWCASE-LOCK";
const params = new URLSearchParams(location.search);
const isDirector = window.self !== window.top || params.has("preview") || params.has("embed") || params.get("cam") === "director" || params.has("autocam");

let installed = false;
let logoRoot = null;
let orbitOn = false;

function scene() { return window.__SVR_SCENE__ || null; }
function camera() { return window.__SVR_CAMERA__ || null; }
function root() { const value = scene(); return value?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || value; }
function table() {
  const value = root();
  if (!value) return null;
  return value.getObjectByName?.("PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED") ||
    value.getObjectByName?.("PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT") ||
    value.getObjectByName?.("PHASE326_ANDROID_TABLE_FALLBACK") || null;
}

function tableBox() {
  const object = table();
  if (!object) return null;
  object.visible = true;
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return { obj: object, box, center, size, top: box.max.y };
}

function cleanDom() {
  if (document.getElementById("svr-phase328-style")) return;
  const style = document.createElement("style");
  style.id = "svr-phase328-style";
  style.textContent = `
    body.svr-phase328-director #hud,
    body.svr-phase328-director #sceneNav,
    body.svr-phase328-director #log,
    body.svr-phase328-director #err,
    body.svr-phase328-director #safeStage,
    body.svr-phase328-director #bootFallback,
    body.svr-phase328-director #svrPhaseBadge,
    body.svr-phase328-director .phase-label,
    body.svr-phase328-director #svr326Root,
    body.svr-phase328-director #svrAndroidGamePad,
    body.svr-phase328-director #svr327ReleaseBadge,
    body.svr-phase328-director #svr328PreviewBadge {
      display:none!important;
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    body.svr-phase328-director canvas {
      display:block!important;
      visibility:visible!important;
      opacity:1!important;
      background:#02040b!important;
    }
  `;
  document.head.appendChild(style);
}

function hideSceneOverlays() {
  const currentScene = scene();
  let hidden = 0;
  if (!currentScene) return hidden;
  const block = /(HUD|STATUS|BADGE|HITBOX|RAYCAST|FEEDBACK|TIMER|PANEL|MARKER|ANDROID.*ROOT|CONTROL|DEBUG)/i;
  currentScene.traverse((object) => {
    if (object === logoRoot) return;
    const name = String(object.name || "");
    if (!block.test(name)) return;
    if (/TABLE|CARD|CHIP|POT|FELT|LOGO/i.test(name)) return;
    if (object.visible) hidden += 1;
    object.visible = false;
  });
  return hidden;
}

function logoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 1024, 1024);
  const gradient = context.createRadialGradient(512, 512, 90, 512, 512, 500);
  gradient.addColorStop(0, "rgba(255,217,138,.94)");
  gradient.addColorStop(.32, "rgba(127,252,255,.34)");
  gradient.addColorStop(.78, "rgba(0,0,0,.08)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(512, 512, 500, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255,217,138,.94)";
  context.lineWidth = 24;
  context.beginPath();
  context.arc(512, 512, 392, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(127,252,255,.76)";
  context.lineWidth = 12;
  context.beginPath();
  context.arc(512, 512, 286, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#fff6ce";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 138px system-ui,Arial";
  context.fillText("SVR", 512, 460);
  context.font = "900 62px system-ui,Arial";
  context.fillText("POKER", 512, 570);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 1;
  return texture;
}

function placeLogo() {
  if (logoRoot?.parent) return true;
  const bounds = tableBox();
  const base = root();
  if (!bounds || !base) return false;
  logoRoot = new THREE.Group();
  logoRoot.name = "PHASE328_DIRECTOR_TABLE_LOGO_ROOT";
  base.add(logoRoot);
  const width = Math.max(1.25, Math.min(bounds.size.x * .46, 2.15));
  const height = Math.max(.72, Math.min(bounds.size.z * .32, 1.24));
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: true })
  );
  mesh.name = "PHASE328_SURFACE_SVR_TABLE_LOGO";
  mesh.position.set(bounds.center.x, bounds.top + .034, bounds.center.z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3280;
  logoRoot.add(mesh);
  return true;
}

function lights() {
  const currentScene = scene();
  if (!currentScene || currentScene.getObjectByName("PHASE328_PREVIEW_LIGHTS")) return;
  const group = new THREE.Group();
  group.name = "PHASE328_PREVIEW_LIGHTS";
  currentScene.add(group);
  group.add(new THREE.HemisphereLight(0xe7f7ff, 0x090912, 1.05));
  [
    [0, 6, 4, 0xffd98a, 1.25],
    [-4, 5, -3, 0x7ffcff, .82],
    [4, 5, -3, 0xa77cff, .78],
    [0, 5, -7, 0xffffff, .68]
  ].forEach((value, index) => {
    const light = new THREE.PointLight(value[3], value[4], 24, 2);
    light.name = "PHASE328_PREVIEW_LIGHT_" + index;
    light.position.set(value[0], value[1], value[2]);
    group.add(light);
  });
}

function orbit() {
  if (!isDirector || orbitOn) return;
  orbitOn = true;
  const loop = (now) => {
    const activeCamera = camera();
    const bounds = tableBox();
    if (activeCamera && bounds) {
      const angle = now * .00016;
      const radius = Math.max(3.2, Math.min(5.2, Math.max(bounds.size.x, bounds.size.z) * 1.28));
      const y = bounds.top + 1.55 + Math.sin(now * .00023) * .16;
      activeCamera.position.set(bounds.center.x + Math.sin(angle) * radius, y, bounds.center.z + Math.cos(angle) * radius);
      activeCamera.lookAt(bounds.center.x, bounds.top + .25, bounds.center.z);
      activeCamera.updateProjectionMatrix?.();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function publish(action = "ready") {
  window.SVR_PHASE328_PREVIEW = {
    build: BUILD,
    active: true,
    director: isDirector,
    tableLogo: !!logoRoot,
    apkUpdatePolicy: {
      forceUpdate: false,
      showUpdatePrompt: false,
      webEntry: "/game/android.html?channel=stable"
    },
    action,
    checkedAt: new Date().toISOString()
  };
  return window.SVR_PHASE328_PREVIEW;
}

function install() {
  if (installed || !isDirector) return;
  installed = true;
  document.body.classList.add("svr-phase328-director");
  cleanDom();
  document.getElementById("svr328PreviewBadge")?.remove();
  lights();
  placeLogo();
  const hidden = hideSceneOverlays();
  orbit();
  publish("installed hidden=" + hidden);
  setTimeout(() => publish("settled hidden=" + hideSceneOverlays()), 1400);
}

window.SVR_RUN_DIRECTOR_PREVIEW_POLISH = () => {
  installed = false;
  install();
  return publish("manual");
};

setTimeout(install, 650);
setTimeout(install, 2200);
