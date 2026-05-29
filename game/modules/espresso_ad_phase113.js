import * as THREE from "three";

const PHASE113 = "PHASE-113-ESPRESSO-1ST-TIER-REIKI-BUILDING-AD";
let lastScene = null;

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeAdTexture(){
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1400;
  const x = c.getContext("2d");

  const bg = x.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#170507");
  bg.addColorStop(1, "#080204");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);

  x.strokeStyle = "#ffd77b";
  x.lineWidth = 34;
  roundRect(x, 45, 45, 810, 1310, 30);
  x.stroke();
  x.lineWidth = 4;
  x.strokeStyle = "rgba(255,215,123,0.55)";
  roundRect(x, 60, 60, 780, 1280, 22);
  x.stroke();

  // Photo-style framed coffee area.
  roundRect(x, 86, 86, 728, 735, 42);
  x.fillStyle = "#1f0909";
  x.fill();
  x.lineWidth = 8;
  x.strokeStyle = "#f1b958";
  roundRect(x, 86, 86, 728, 735, 42);
  x.stroke();

  const wood = x.createLinearGradient(100, 95, 810, 820);
  wood.addColorStop(0, "#c88c42");
  wood.addColorStop(0.5, "#e1b66a");
  wood.addColorStop(1, "#9f6a32");
  x.fillStyle = wood;
  roundRect(x, 100, 100, 700, 707, 30);
  x.fill();
  x.strokeStyle = "rgba(85,45,18,0.23)";
  x.lineWidth = 5;
  for (let i = -150; i < 900; i += 60){
    x.beginPath();
    x.moveTo(i, 100);
    x.lineTo(i + 250, 807);
    x.stroke();
  }

  // Saucer and cup, designed to echo the supplied espresso image without using heavy geometry.
  const saucerGrad = x.createRadialGradient(430, 625, 80, 430, 625, 265);
  saucerGrad.addColorStop(0, "#ffffff");
  saucerGrad.addColorStop(0.55, "#d8d5ce");
  saucerGrad.addColorStop(1, "#8d8579");
  x.fillStyle = saucerGrad;
  x.beginPath();
  x.ellipse(430, 625, 278, 112, -0.02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(30,20,12,0.18)";
  x.beginPath();
  x.ellipse(500, 640, 190, 56, -0.02, 0, Math.PI * 2);
  x.fill();

  x.fillStyle = "#fffaf0";
  x.beginPath();
  x.ellipse(430, 430, 270, 150, 0.02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#f8f0df";
  roundRect(x, 172, 405, 520, 170, 70);
  x.fill();
  x.strokeStyle = "rgba(70,45,32,0.20)";
  x.lineWidth = 6;
  x.stroke();

  x.lineWidth = 22;
  x.strokeStyle = "#f8f0df";
  x.beginPath();
  x.arc(698, 470, 80, -0.95, 0.98);
  x.stroke();
  x.lineWidth = 10;
  x.strokeStyle = "rgba(90,58,42,0.23)";
  x.beginPath();
  x.arc(703, 470, 58, -0.95, 0.98);
  x.stroke();

  const crema = x.createRadialGradient(410, 390, 20, 410, 390, 260);
  crema.addColorStop(0, "#ffe0a3");
  crema.addColorStop(0.42, "#d38632");
  crema.addColorStop(1, "#7d3510");
  x.fillStyle = crema;
  x.beginPath();
  x.ellipse(430, 392, 242, 128, 0.02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(95,35,8,0.45)";
  for (let i = 0; i < 220; i++){
    const px = 250 + Math.random() * 360;
    const py = 285 + Math.random() * 175;
    x.beginPath();
    x.arc(px, py, 1.2 + Math.random() * 3.8, 0, Math.PI * 2);
    x.fill();
  }

  // Red tier label: requested small and visible.
  x.fillStyle = "#e41414";
  roundRect(x, 112, 112, 170, 48, 10);
  x.fill();
  x.fillStyle = "#ffffff";
  x.font = "900 29px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 197, 137);

  // Main text panels.
  x.fillStyle = "rgba(15,3,4,0.92)";
  roundRect(x, 105, 856, 690, 255, 30);
  x.fill();
  x.strokeStyle = "rgba(255,199,96,0.70)";
  x.lineWidth = 4;
  roundRect(x, 105, 856, 690, 255, 30);
  x.stroke();

  x.fillStyle = "#fff7e3";
  x.font = "900 87px Arial";
  x.textAlign = "center";
  x.fillText("ESPRESSO", 450, 945);
  x.fillStyle = "#ffd77b";
  x.font = "900 74px Arial";
  x.fillText("WITH CREAM", 450, 1030);
  x.fillStyle = "#f3eeee";
  x.font = "800 29px Arial";
  x.fillText("REAL PHOTO AD TEXTURE", 450, 1083);

  x.fillStyle = "rgba(68,31,14,0.82)";
  roundRect(x, 135, 1165, 630, 100, 22);
  x.fill();
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 3;
  roundRect(x, 135, 1165, 630, 100, 22);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 35px Arial";
  x.fillText("SVR LOBBY WALL AD", 450, 1218);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeTierTexture(){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = "rgba(8,0,0,0.88)";
  roundRect(x, 12, 18, 488, 92, 18);
  x.fill();
  x.strokeStyle = "#ff1f1f";
  x.lineWidth = 8;
  roundRect(x, 12, 18, 488, 92, 18);
  x.stroke();
  x.fillStyle = "#ff1f1f";
  x.font = "900 60px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function install(scene){
  if (!scene || scene.getObjectByName("ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113")) return false;

  const root = new THREE.Group();
  root.name = "ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113";

  // Building/banner placement: high behind the Reiki storefront side, facing into lobby.
  root.position.set(14.8, 8.2, -24.5);
  root.lookAt(new THREE.Vector3(0, 3.0, 0));

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(5.05, 7.55, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x100306, transparent: false, toneMapped: false })
  );
  backing.position.set(0, 0, -0.035);
  root.add(backing);

  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(4.55, 7.05),
    new THREE.MeshBasicMaterial({ map: makeAdTexture(), transparent: false, side: THREE.DoubleSide, toneMapped: false })
  );
  ad.position.set(0, 0, 0.02);
  root.add(ad);

  const tier = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.42),
    new THREE.MeshBasicMaterial({ map: makeTierTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })
  );
  tier.position.set(-1.50, 3.78, 0.06);
  root.add(tier);

  const glow = new THREE.PointLight(0xffd77b, 1.0, 10, 2.1);
  glow.position.set(0, 0.8, 1.2);
  root.add(glow);

  scene.add(root);
  scene.userData.phase113EspressoAd = root;
  console.log(`[${PHASE113}] Espresso with Cream 1st Tier ad placed behind Reiki storefront building`, root.position);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoAdPhase113){
  THREE.WebGLRenderer.prototype.__svrEspressoAdPhase113 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    install(scene);
    return originalRender.call(this, scene, camera);
  };
}

console.log(`[${PHASE113}] loaded`);
