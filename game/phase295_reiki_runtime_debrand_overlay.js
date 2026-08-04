import * as THREE from "three";

const BUILD = "PHASE-295-REIKI-RUNTIME-DEBRAND-OVERLAY-LOCK";

function makeTexture(title, subtitle = "", accent = "#7ffcff"){
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#03070b");
  gradient.addColorStop(0.55, "#090b14");
  gradient.addColorStop(1, "#06151a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 86px system-ui, Arial";
  ctx.fillText(title, canvas.width / 2, 135, canvas.width - 90);
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#ffd98a";
  ctx.font = "800 42px system-ui, Arial";
  ctx.fillText(subtitle, canvas.width / 2, 242, canvas.width - 100);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePanel(title, subtitle, width, height, accent){
  const mat = new THREE.MeshBasicMaterial({
    map: makeTexture(title, subtitle, accent),
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.renderOrder = 9998;
  return mesh;
}

function makeFloorPortal(){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(512, 512, 70, 512, 512, 430);
  grad.addColorStop(0, "rgba(127,252,255,0.92)");
  grad.addColorStop(0.55, "rgba(88,255,180,0.34)");
  grad.addColorStop(1, "rgba(10,30,25,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = "rgba(127,252,255,0.98)";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(512, 512, 265, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "900 82px system-ui, Arial";
  ctx.fillText("ENTER REIKI HUB", 512, 690);
  ctx.fillStyle = "#ffd98a";
  ctx.font = "800 42px system-ui, Arial";
  ctx.fillText("AWAITING APPROVAL", 512, 760);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1.25, 72), mat);
  mesh.rotation.x = -Math.PI * 0.5;
  mesh.position.set(0, 0.075, 0.98);
  mesh.renderOrder = 9999;
  return mesh;
}

function install(){
  const scene = window.__SVR_SCENE__;
  if (!scene || scene.getObjectByName("SVR_PHASE295_REIKI_RUNTIME_DEBRAND_OVERLAY")) return false;

  const R = 42;
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.01, Math.sin(angle) * (R - 4.05));

  const root = new THREE.Group();
  root.name = "SVR_PHASE295_REIKI_RUNTIME_DEBRAND_OVERLAY";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));

  const header = makePanel("REIKI HUB", "SVR WELLNESS PREVIEW • AWAITING APPROVAL", 7.8, 0.98, "#7ffcff");
  header.position.set(0, 5.12, 0.84);
  root.add(header);

  const subHeader = makePanel("SVR PRESENTATION", "APPROVAL-SAFE PLACEHOLDER", 6.65, 0.78, "#a77cff");
  subHeader.position.set(0, 4.28, 0.86);
  root.add(subHeader);

  const leftPanel = makePanel("WELLNESS ROOM", "Approved media and booking copy go here later", 3.35, 4.08, "#7ffcff");
  leftPanel.position.set(-4.10, 2.18, -2.00);
  root.add(leftPanel);

  const centerPanel = makePanel("REIKI PREVIEW", "Meditation • quiet room • approval pending", 2.80, 4.08, "#ffd98a");
  centerPanel.position.set(0, 2.18, -1.98);
  root.add(centerPanel);

  const rightPanel = makePanel("AWAITING APPROVAL", "Sponsor/founder media disabled", 3.05, 4.08, "#ff5b8c");
  rightPanel.position.set(4.05, 2.18, -2.00);
  root.add(rightPanel);

  const reserve = makePanel("SVR STOREFRONT", "HOLOGRAM • SLIDES • PRIVATE ROOM", 3.20, 0.74, "#8dffb4");
  reserve.position.set(4.05, -1.22, -1.94);
  root.add(reserve);

  root.add(makeFloorPortal());
  scene.add(root);

  window.SVR_PHASE295_REIKI_RUNTIME_DEBRAND_OVERLAY = {
    build: BUILD,
    installed: true,
    approvalSafe: true,
    protectedSite: true,
    installedAt: new Date().toISOString()
  };
  return true;
}

let tries = 0;
const timer = setInterval(()=>{
  tries += 1;
  if (install() || tries > 80) clearInterval(timer);
}, 250);

window.addEventListener("DOMContentLoaded", install);
setTimeout(install, 1000);
setTimeout(install, 2500);
