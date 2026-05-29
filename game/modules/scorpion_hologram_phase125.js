import * as THREE from "three";

const PHASE125 = "PHASE-125-SCORPION-PORTAL-HOLOGRAM-LOCK";
let lastScene = null;
let installed = false;

const SCORPION_FALLBACK = new THREE.Vector3(12.37, 0, 15.19);

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeScorpionTexture(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 900;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);

  const cyan = "#71f7ff";
  const purple = "#b48cff";
  const magenta = "#ff4fd8";
  const mint = "#78ffbf";

  // Transparent hologram glass frame. No white fill.
  x.save();
  const glass = x.createLinearGradient(0, 0, c.width, c.height);
  glass.addColorStop(0, "rgba(20, 255, 255, 0.10)");
  glass.addColorStop(0.45, "rgba(110, 35, 255, 0.08)");
  glass.addColorStop(1, "rgba(255, 0, 200, 0.07)");
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
  x.restore();

  // Grid/radar hologram lines.
  x.save();
  x.globalAlpha = 0.30;
  x.strokeStyle = cyan;
  x.lineWidth = 1.5;
  for (let i = 120; i < c.width - 120; i += 70){
    x.beginPath(); x.moveTo(i, 120); x.lineTo(i, 640); x.stroke();
  }
  for (let i = 140; i < 650; i += 46){
    x.beginPath(); x.moveTo(120, i); x.lineTo(c.width - 120, i); x.stroke();
  }
  x.restore();

  // Scorpion symbol.
  x.save();
  x.translate(c.width / 2, 390);
  x.shadowColor = cyan;
  x.shadowBlur = 30;
  x.lineCap = "round";
  x.lineJoin = "round";

  // Body segments.
  for (let i = 0; i < 6; i++){
    const w = 130 - i * 9;
    const h = 72 - i * 5;
    x.beginPath();
    x.ellipse(0, -110 + i * 46, w, h, 0, 0, Math.PI * 2);
    x.fillStyle = i % 2 ? "rgba(180,140,255,0.24)" : "rgba(113,247,255,0.18)";
    x.fill();
    x.lineWidth = 8;
    x.strokeStyle = i % 2 ? purple : cyan;
    x.stroke();
  }

  // Head.
  x.beginPath();
  x.ellipse(0, -190, 105, 76, 0, 0, Math.PI * 2);
  x.fillStyle = "rgba(113,247,255,0.18)";
  x.fill();
  x.lineWidth = 9;
  x.strokeStyle = cyan;
  x.stroke();

  // Claws arms.
  function claw(side){
    x.strokeStyle = side < 0 ? cyan : magenta;
    x.lineWidth = 12;
    x.beginPath();
    x.moveTo(side * 82, -190);
    x.bezierCurveTo(side * 190, -270, side * 315, -252, side * 380, -180);
    x.stroke();
    x.beginPath();
    x.moveTo(side * 380, -180);
    x.bezierCurveTo(side * 462, -230, side * 540, -180, side * 478, -110);
    x.stroke();
    x.beginPath();
    x.moveTo(side * 383, -178);
    x.bezierCurveTo(side * 462, -122, side * 430, -50, side * 336, -92);
    x.stroke();
  }
  claw(-1); claw(1);

  // Legs.
  x.lineWidth = 8;
  for (let i = 0; i < 4; i++){
    const y = -98 + i * 58;
    const spread = 168 + i * 18;
    [-1, 1].forEach((side)=>{
      x.strokeStyle = side < 0 ? "rgba(113,247,255,0.95)" : "rgba(180,140,255,0.95)";
      x.beginPath();
      x.moveTo(side * 75, y);
      x.lineTo(side * spread, y + 38);
      x.lineTo(side * (spread + 84), y + 90);
      x.stroke();
    });
  }

  // Tail.
  x.lineWidth = 14;
  x.strokeStyle = mint;
  x.beginPath();
  x.moveTo(0, 175);
  x.bezierCurveTo(0, 265, 80, 315, 150, 260);
  x.bezierCurveTo(245, 185, 205, 70, 112, 80);
  x.stroke();
  x.lineWidth = 9;
  x.strokeStyle = magenta;
  x.beginPath();
  x.moveTo(112, 80);
  x.lineTo(178, 26);
  x.lineTo(166, 116);
  x.stroke();

  // Glow core.
  const glow = x.createRadialGradient(0, 5, 18, 0, 5, 310);
  glow.addColorStop(0, "rgba(113,247,255,0.30)");
  glow.addColorStop(0.45, "rgba(180,140,255,0.14)");
  glow.addColorStop(1, "rgba(255,79,216,0.00)");
  x.fillStyle = glow;
  x.beginPath();
  x.arc(0, 0, 310, 0, Math.PI * 2);
  x.fill();
  x.restore();

  // Labels.
  x.save();
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = cyan;
  x.shadowBlur = 18;
  x.fillStyle = "#eaffff";
  x.font = "900 76px Arial";
  x.fillText("SCORPION ROOM", c.width / 2, 690);
  x.shadowColor = purple;
  x.fillStyle = cyan;
  x.font = "800 36px Arial";
  x.fillText("PRIVATE POKER PORTAL", c.width / 2, 744);
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

function findScorpionPortal(scene){
  let portal = null;
  scene.traverse((obj)=>{
    if (portal) return;
    if (obj?.userData?.portalKey === "scorpion" || obj?.name === "PORTAL_scorpion") portal = obj;
  });
  return portal;
}

function install(scene){
  if (!scene || installed) return false;
  const portal = findScorpionPortal(scene);
  const parent = portal || scene;
  const root = new THREE.Group();
  root.name = "SCORPION_PORTAL_HOLOGRAM_PHASE125";
  root.frustumCulled = false;

  if (portal){
    root.position.set(0, 2.9, -0.18);
    root.rotation.set(0, 0, 0);
  } else {
    root.position.copy(SCORPION_FALLBACK).setY(2.9);
    root.lookAt(new THREE.Vector3(0, 2.3, 0));
  }

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 3.05),
    new THREE.MeshBasicMaterial({
      map: makeScorpionTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  panel.name = "SCORPION_ROOM_NEON_HOLOGRAM_PANEL";
  panel.renderOrder = 150000;
  panel.frustumCulled = false;
  root.add(panel);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.55, 96),
    new THREE.MeshBasicMaterial({ color: 0x71f7ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.name = "SCORPION_HOLOGRAM_PORTAL_HALO";
  halo.position.set(0, -1.92, 0);
  halo.rotation.x = -Math.PI / 2;
  halo.renderOrder = 149999;
  root.add(halo);

  const glow = new THREE.PointLight(0xb48cff, 1.9, 8, 2.0);
  glow.name = "SCORPION_HOLOGRAM_PURPLE_GLOW";
  glow.position.set(0, 0.35, -0.55);
  root.add(glow);

  parent.add(root);
  installed = true;
  scene.userData.phase125ScorpionHologram = root;
  console.log(`[${PHASE125}] installed`, portal ? "attached to scorpion portal" : "fallback position");
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrScorpionHologramPhase125){
  THREE.WebGLRenderer.prototype.__svrScorpionHologramPhase125 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE125}] loaded`);
