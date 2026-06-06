import * as THREE from "three";

const PHASE117 = "PHASE-117-ESPRESSO-AD-VISIBLE-CONTRAST-LOCK";
let lastScene = null;
let installed = false;
let contrastDone = false;

function rr(ctx, x, y, w, h, r){
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
  c.width = 1024;
  c.height = 1536;
  const x = c.getContext("2d");

  const bg = x.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#1a0607");
  bg.addColorStop(1, "#050101");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);

  x.strokeStyle = "#ffd77b";
  x.lineWidth = 42;
  rr(x, 50, 50, 924, 1436, 34);
  x.stroke();
  x.strokeStyle = "rgba(255,225,130,.70)";
  x.lineWidth = 7;
  rr(x, 78, 78, 868, 1380, 24);
  x.stroke();

  x.fillStyle = "#e00000";
  rr(x, 104, 96, 230, 72, 14);
  x.fill();
  x.fillStyle = "#ffffff";
  x.font = "900 42px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 219, 132);

  // High-contrast coffee image block.
  x.fillStyle = "#240909";
  rr(x, 104, 110, 816, 770, 44);
  x.fill();
  x.strokeStyle = "#f2ba59";
  x.lineWidth = 10;
  rr(x, 104, 110, 816, 770, 44);
  x.stroke();

  const wood = x.createLinearGradient(120, 125, 910, 875);
  wood.addColorStop(0, "#c38536");
  wood.addColorStop(.55, "#e5b76b");
  wood.addColorStop(1, "#8f5826");
  x.fillStyle = wood;
  rr(x, 126, 132, 772, 724, 30);
  x.fill();

  const saucer = x.createRadialGradient(505, 660, 80, 505, 660, 300);
  saucer.addColorStop(0, "#ffffff");
  saucer.addColorStop(.58, "#dedad0");
  saucer.addColorStop(1, "#776f66");
  x.fillStyle = saucer;
  x.beginPath();
  x.ellipse(505, 660, 315, 128, -.03, 0, Math.PI * 2);
  x.fill();

  x.fillStyle = "#fff8ea";
  x.beginPath();
  x.ellipse(505, 455, 305, 160, .02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#f8efdf";
  rr(x, 220, 435, 570, 185, 80);
  x.fill();
  x.lineWidth = 25;
  x.strokeStyle = "#f8efdf";
  x.beginPath();
  x.arc(800, 505, 88, -.95, .98);
  x.stroke();

  const crema = x.createRadialGradient(488, 420, 25, 488, 420, 285);
  crema.addColorStop(0, "#ffe5a8");
  crema.addColorStop(.42, "#da8d36");
  crema.addColorStop(1, "#6c2a08");
  x.fillStyle = crema;
  x.beginPath();
  x.ellipse(505, 420, 270, 136, .02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(76,22,4,.55)";
  for (let i = 0; i < 330; i++){
    const px = 295 + ((i * 37) % 430);
    const py = 315 + ((i * 61) % 190);
    x.beginPath();
    x.arc(px, py, 1.5 + ((i * 11) % 5), 0, Math.PI * 2);
    x.fill();
  }

  x.fillStyle = "rgba(10,2,3,.97)";
  rr(x, 120, 940, 784, 285, 32);
  x.fill();
  x.strokeStyle = "rgba(255,210,100,.90)";
  x.lineWidth = 6;
  rr(x, 120, 940, 784, 285, 32);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 102px Arial";
  x.fillText("ESPRESSO", 512, 1042);
  x.fillStyle = "#ffd77b";
  x.font = "900 84px Arial";
  x.fillText("WITH CREAM", 512, 1140);
  x.fillStyle = "#f5eeee";
  x.font = "800 34px Arial";
  x.fillText("REAL PHOTO AD TEXTURE", 512, 1195);

  x.fillStyle = "rgba(68,31,14,.94)";
  rr(x, 155, 1300, 714, 110, 24);
  x.fill();
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 5;
  rr(x, 155, 1300, 714, 110, 24);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 42px Arial";
  x.fillText("SVR LOBBY WALL AD", 512, 1358);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBuildingTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 2048;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "#071733");
  g.addColorStop(.6, "#030812");
  g.addColorStop(1, "#010308");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < 34; row++){
    for (let col = 0; col < 12; col++){
      const px = 52 + col * 78;
      const py = 58 + row * 58;
      const lit = ((row + col * 3) % 4) !== 0;
      x.fillStyle = lit ? "rgba(55,180,255,.80)" : "rgba(8,16,35,.92)";
      rr(x, px, py, 42, 28, 3);
      x.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function add(root, obj, x, y, z){
  obj.position.set(x, y, z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function hideOldAds(scene){
  [
    "ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113",
    "ESPRESSO_PHASE114_BIG_BUILDING_AD",
    "ESPRESSO_PHASE115_EXACT_POSITION_BUILDING",
    "ESPRESSO_PHASE115_VISIBLE_SKYLINE_BUILDING",
    "ESPRESSO_PHASE116_VISIBLE_REIKI_SKYLINE_BILLBOARD"
  ].forEach((name)=>{
    const old = scene.getObjectByName(name);
    if (old) old.visible = false;
  });
}

function boostContrast(scene){
  if (!scene || contrastDone) return;
  contrastDone = true;
  scene.background = new THREE.Color(0x020307);
  scene.traverse((obj)=>{
    if (!obj?.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat)=>{
      if (!mat) return;
      if (mat.color){
        mat.color.multiplyScalar(1.12);
      }
      if (mat.emissive){
        const n = String(obj.name || "").toLowerCase();
        if (/sign|portal|hub|label|ad|reiki|pga|store|scorpion/.test(n)){
          mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.18);
        }
      }
      mat.needsUpdate = true;
    });
  });
}

function install(scene){
  if (!scene || installed) return false;
  installed = true;
  hideOldAds(scene);
  boostContrast(scene);

  // This is deliberately inside the lobby, in front of skyline geometry, and slightly over the Reiki side.
  // It will be visible immediately instead of depending on outside-building clipping.
  const root = new THREE.Group();
  root.name = "ESPRESSO_PHASE117_VISIBLE_CONTRAST_BILLBOARD";
  root.position.set(-13.5, 0.0, -10.8);
  root.lookAt(new THREE.Vector3(0, 3.2, 0));
  root.frustumCulled = false;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 22.0, 1.8),
    new THREE.MeshBasicMaterial({ map: makeBuildingTexture(), color: 0xffffff, toneMapped: false })
  );
  building.name = "ESPRESSO_PHASE117_VISIBLE_BUILDING_FACADE";
  add(root, building, 0, 11.0, 0.25);

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(7.3, 10.95, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x060102, toneMapped: false, depthTest: false })
  );
  backing.name = "ESPRESSO_PHASE117_AD_BLACK_BACKING";
  backing.renderOrder = 99990;
  add(root, backing, 0, 11.4, -0.82);

  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(6.9, 10.45),
    new THREE.MeshBasicMaterial({ map: makeAdTexture(), transparent: false, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  ad.name = "ESPRESSO_PHASE117_AD_FACE_ALWAYS_VISIBLE";
  ad.renderOrder = 99999;
  add(root, ad, 0, 11.4, -0.94);

  const borderMat = new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false, depthTest: false });
  add(root, new THREE.Mesh(new THREE.BoxGeometry(7.4, .16, .16), borderMat), 0, 16.76, -1.00).renderOrder = 100000;
  add(root, new THREE.Mesh(new THREE.BoxGeometry(7.4, .16, .16), borderMat), 0, 6.04, -1.00).renderOrder = 100000;
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.16, 10.9, .16), borderMat), -3.72, 11.4, -1.00).renderOrder = 100000;
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.16, 10.9, .16), borderMat), 3.72, 11.4, -1.00).renderOrder = 100000;

  const light = new THREE.PointLight(0xffd77b, 2.8, 30, 2.0);
  light.name = "ESPRESSO_PHASE117_VISIBLE_AD_LIGHT";
  add(root, light, 0, 11.5, -3.0);

  scene.add(root);
  scene.userData.phase117EspressoAd = root;
  console.log(`[${PHASE117}] installed visible billboard + contrast`, root.position);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoContrastPhase117){
  THREE.WebGLRenderer.prototype.__svrEspressoContrastPhase117 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE117}] loaded`);
