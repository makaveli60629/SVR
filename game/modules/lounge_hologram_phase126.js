import * as THREE from "three";

const PHASE126 = "PHASE-126-LOUNGE-PORTAL-HOLOGRAM-LOCK";
let lastScene = null;
let installed = false;

const LOUNGE_FALLBACK = new THREE.Vector3(-20.74, 0, 5.00);

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeLoungeTexture(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 900;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);

  const cyan = "#71f7ff";
  const purple = "#b48cff";
  const magenta = "#ff4fd8";
  const gold = "#ffd77b";

  // Transparent SVR hologram frame. No white background and no stock-logo/watermark text.
  const glass = x.createLinearGradient(0, 0, c.width, c.height);
  glass.addColorStop(0, "rgba(113,247,255,0.10)");
  glass.addColorStop(0.52, "rgba(180,140,255,0.08)");
  glass.addColorStop(1, "rgba(255,79,216,0.07)");
  x.fillStyle = glass;
  roundRect(x, 44, 44, c.width - 88, c.height - 88, 46);
  x.fill();

  x.lineWidth = 10;
  x.strokeStyle = "rgba(113,247,255,0.78)";
  roundRect(x, 44, 44, c.width - 88, c.height - 88, 46);
  x.stroke();
  x.lineWidth = 4;
  x.strokeStyle = "rgba(180,140,255,0.86)";
  roundRect(x, 72, 72, c.width - 144, c.height - 144, 34);
  x.stroke();

  // Soft circuit/radar lines.
  x.save();
  x.globalAlpha = 0.26;
  x.strokeStyle = cyan;
  x.lineWidth = 1.5;
  for (let i = 120; i < c.width - 120; i += 70){ x.beginPath(); x.moveTo(i, 120); x.lineTo(i, 640); x.stroke(); }
  for (let i = 140; i < 650; i += 46){ x.beginPath(); x.moveTo(120, i); x.lineTo(c.width - 120, i); x.stroke(); }
  x.restore();

  // Cocktail neon icon: martini glass + flame/smoke swirl.
  x.save();
  x.translate(c.width / 2, 380);
  x.shadowColor = cyan;
  x.shadowBlur = 26;
  x.lineCap = "round";
  x.lineJoin = "round";

  // Outer halo.
  x.strokeStyle = "rgba(180,140,255,0.88)";
  x.lineWidth = 10;
  x.beginPath();
  x.arc(0, -30, 230, 0, Math.PI * 2);
  x.stroke();

  // Glass bowl.
  x.strokeStyle = cyan;
  x.lineWidth = 13;
  x.beginPath();
  x.moveTo(-250, -190);
  x.lineTo(250, -190);
  x.lineTo(58, 70);
  x.quadraticCurveTo(0, 118, -58, 70);
  x.closePath();
  x.stroke();
  x.fillStyle = "rgba(113,247,255,0.10)";
  x.fill();

  // Neon liquid line.
  x.strokeStyle = magenta;
  x.lineWidth = 9;
  x.beginPath();
  x.moveTo(-170, -105);
  x.bezierCurveTo(-80, -135, 85, -70, 175, -112);
  x.stroke();

  // Stem and base.
  x.strokeStyle = gold;
  x.lineWidth = 12;
  x.beginPath();
  x.moveTo(0, 88);
  x.lineTo(0, 250);
  x.stroke();
  x.beginPath();
  x.moveTo(-130, 250);
  x.quadraticCurveTo(0, 292, 130, 250);
  x.stroke();

  // Swirl/flame coming out of glass.
  x.strokeStyle = magenta;
  x.lineWidth = 12;
  x.beginPath();
  x.moveTo(38, -190);
  x.bezierCurveTo(132, -250, 110, -340, 24, -312);
  x.bezierCurveTo(-64, -282, -22, -210, 38, -190);
  x.stroke();
  x.strokeStyle = cyan;
  x.lineWidth = 9;
  x.beginPath();
  x.moveTo(-16, -205);
  x.bezierCurveTo(-102, -280, -92, -360, -10, -395);
  x.stroke();

  // Stars/sparkles.
  function star(px, py, s, color){
    x.strokeStyle = color;
    x.lineWidth = 5;
    x.beginPath(); x.moveTo(px - s, py); x.lineTo(px + s, py); x.stroke();
    x.beginPath(); x.moveTo(px, py - s); x.lineTo(px, py + s); x.stroke();
  }
  star(-315, -30, 20, cyan);
  star(320, -5, 18, magenta);
  star(-245, 170, 13, gold);
  star(250, 160, 14, purple);

  const glow = x.createRadialGradient(0, -10, 20, 0, -10, 330);
  glow.addColorStop(0, "rgba(113,247,255,0.24)");
  glow.addColorStop(0.5, "rgba(180,140,255,0.12)");
  glow.addColorStop(1, "rgba(255,79,216,0.00)");
  x.fillStyle = glow;
  x.beginPath();
  x.arc(0, 0, 330, 0, Math.PI * 2);
  x.fill();
  x.restore();

  // Clean label text only. No LogoDesign watermark and no stock logo wording.
  x.save();
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = cyan;
  x.shadowBlur = 18;
  x.fillStyle = "#eaffff";
  x.font = "900 78px Arial";
  x.fillText("LOUNGE", c.width / 2, 690);
  x.shadowColor = purple;
  x.fillStyle = cyan;
  x.font = "800 36px Arial";
  x.fillText("PRIVATE SOCIAL PORTAL", c.width / 2, 744);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(226,255,255,0.86)";
  x.font = "700 28px Arial";
  x.fillText("FIST TELEPORT LOGO ON MARKER  •  RELEASE TO ENTER", c.width / 2, 794);
  x.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function findLoungePortal(scene){
  let portal = null;
  scene.traverse((obj)=>{
    if (portal) return;
    const key = obj?.userData?.portalKey;
    if (key === "smokerLounge" || key === "lounge" || obj?.name === "PORTAL_smokerLounge" || obj?.name === "PORTAL_lounge") portal = obj;
  });
  return portal;
}

function install(scene){
  if (!scene || installed) return false;
  const portal = findLoungePortal(scene);
  const parent = portal || scene;
  const root = new THREE.Group();
  root.name = "LOUNGE_PORTAL_HOLOGRAM_PHASE126";
  root.frustumCulled = false;

  if (portal){
    root.position.set(0, 2.9, -0.18);
    root.rotation.set(0, 0, 0);
  } else {
    root.position.copy(LOUNGE_FALLBACK).setY(2.9);
    root.lookAt(new THREE.Vector3(0, 2.3, 0));
  }

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 3.05),
    new THREE.MeshBasicMaterial({
      map: makeLoungeTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  panel.name = "LOUNGE_NEON_HOLOGRAM_PANEL";
  panel.renderOrder = 150000;
  panel.frustumCulled = false;
  root.add(panel);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.55, 96),
    new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.name = "LOUNGE_HOLOGRAM_PORTAL_HALO";
  halo.position.set(0, -1.92, 0);
  halo.rotation.x = -Math.PI / 2;
  halo.renderOrder = 149999;
  root.add(halo);

  const glow = new THREE.PointLight(0xff4fd8, 1.9, 8, 2.0);
  glow.name = "LOUNGE_HOLOGRAM_MAGENTA_GLOW";
  glow.position.set(0, 0.35, -0.55);
  root.add(glow);

  parent.add(root);
  installed = true;
  scene.userData.phase126LoungeHologram = root;
  console.log(`[${PHASE126}] installed`, portal ? "attached to lounge portal" : "fallback position");
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrLoungeHologramPhase126){
  THREE.WebGLRenderer.prototype.__svrLoungeHologramPhase126 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE126}] loaded`);
