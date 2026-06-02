import * as THREE from "three";
import { CONFIG } from "./config.js";

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function drawLeaf(ctx, cx, cy, rx, ry, rot){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(rx, -ry * 0.58, rx * 0.94, ry * 0.52, 0, ry);
  ctx.bezierCurveTo(-rx * 0.94, ry * 0.52, -rx, -ry * 0.58, 0, -ry);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -ry * 0.62);
  ctx.quadraticCurveTo(0, 0, 0, ry * 0.66);
  ctx.stroke();
  ctx.restore();
}

function drawCircuit(ctx, points){
  ctx.beginPath();
  points.forEach(([x, y], i)=>{
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  for (const [x, y] of points){
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function createReikiHubLogoTexture({ compact = false } = {}){
  return makeCanvasTexture(1024, compact ? 512 : 768, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(3,10,13,0.96)");
    bg.addColorStop(0.58, "rgba(11,22,26,0.92)");
    bg.addColorStop(1, "rgba(2,5,8,0.96)");
    ctx.fillStyle = bg;
    roundRect(ctx, 22, 22, w - 44, h - 44, 42);
    ctx.fill();

    ctx.shadowColor = "rgba(188,255,255,0.95)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(204,255,255,0.94)";
    ctx.lineWidth = compact ? 9 : 11;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const iconCy = compact ? 180 : 260;
    const scale = compact ? 0.76 : 1.0;
    const centerX = w * 0.5;
    drawLeaf(ctx, centerX, iconCy, 58 * scale, 172 * scale, 0);
    drawLeaf(ctx, centerX - 110 * scale, iconCy + 15 * scale, 52 * scale, 160 * scale, -0.62);
    drawLeaf(ctx, centerX + 110 * scale, iconCy + 15 * scale, 52 * scale, 160 * scale, 0.62);
    drawLeaf(ctx, centerX - 205 * scale, iconCy + 68 * scale, 50 * scale, 144 * scale, -1.08);
    drawLeaf(ctx, centerX + 205 * scale, iconCy + 68 * scale, 50 * scale, 144 * scale, 1.08);

    ctx.lineWidth = compact ? 6 : 7;
    drawCircuit(ctx, [[centerX, iconCy - 110 * scale], [centerX, iconCy - 178 * scale]]);
    drawCircuit(ctx, [[centerX - 66 * scale, iconCy - 40 * scale], [centerX - 100 * scale, iconCy - 90 * scale], [centerX - 100 * scale, iconCy - 134 * scale]]);
    drawCircuit(ctx, [[centerX + 66 * scale, iconCy - 40 * scale], [centerX + 100 * scale, iconCy - 90 * scale], [centerX + 100 * scale, iconCy - 134 * scale]]);
    drawCircuit(ctx, [[centerX - 188 * scale, iconCy + 48 * scale], [centerX - 258 * scale, iconCy + 10 * scale], [centerX - 320 * scale, iconCy + 10 * scale]]);
    drawCircuit(ctx, [[centerX + 188 * scale, iconCy + 48 * scale], [centerX + 258 * scale, iconCy + 10 * scale], [centerX + 320 * scale, iconCy + 10 * scale]]);
    drawCircuit(ctx, [[centerX - 260 * scale, iconCy + 118 * scale], [centerX - 350 * scale, iconCy + 150 * scale]]);
    drawCircuit(ctx, [[centerX + 260 * scale, iconCy + 118 * scale], [centerX + 350 * scale, iconCy + 150 * scale]]);

    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(220,255,255,0.96)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = compact ? "800 74px system-ui, Segoe UI, Arial" : "800 96px system-ui, Segoe UI, Arial";
    ctx.letterSpacing = "4px";
    ctx.fillText("REIKI HUB", centerX, compact ? 405 : 640);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(180,255,255,0.62)";
    ctx.lineWidth = 5;
    roundRect(ctx, 34, 34, w - 68, h - 68, 34);
    ctx.stroke();
  });
}

function addPlane(root, texture, width, height, position, { floor = false, opacity = 1 } = {}){
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(position.x, position.y, position.z);
  if (floor) mesh.rotation.x = -Math.PI * 0.5;
  mesh.renderOrder = 80;
  mesh.name = "SVR_REIKI_HUB_LOGO_LOCK";
  mesh.userData.svrReikiHubLogo = true;
  root.add(mesh);
  return mesh;
}

export function installReikiHubLogoLock(scene){
  if (!scene || scene.userData.reikiHubLogoLockInstalled) return null;
  scene.userData.reikiHubLogoLockInstalled = true;

  const R = CONFIG.ROOM_RADIUS || 24;
  const center = new THREE.Vector3(R - 4.05, 0.01, 0);
  const inward = new THREE.Vector3(-1, 0, 0);
  const root = new THREE.Group();
  root.name = "SVR_REIKI_HUB_OFFICIAL_LOGO_GROUP";
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const wideLogo = createReikiHubLogoTexture({ compact: true });
  const badgeLogo = createReikiHubLogoTexture({ compact: false });

  // Main storefront header replacement/overlay.
  addPlane(root, wideLogo, 3.75, 1.36, { x: 0, y: 5.18, z: 0.80 });

  // Left/right badge plates replace generic/SVR placeholder logo positions on the Reiki storefront.
  addPlane(root, badgeLogo, 1.36, 1.02, { x: -4.98, y: 4.68, z: 0.82 });
  addPlane(root, badgeLogo, 1.36, 1.02, { x: 4.98, y: 4.68, z: 0.82 });

  // Portal floor mark replacement for the Reiki entry circle.
  addPlane(root, badgeLogo, 1.42, 1.06, { x: 0, y: 0.052, z: 0.98 }, { floor: true, opacity: 0.96 });

  // Center wall brand plate inside the storefront so the hub identity is clear from the table side.
  addPlane(root, wideLogo, 2.20, 1.04, { x: 0, y: 3.82, z: -2.02 });

  return root;
}
