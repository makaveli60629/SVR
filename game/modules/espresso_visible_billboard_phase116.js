import * as THREE from "three";

const PHASE116 = "PHASE-116-ESPRESSO-VISIBLE-LOBBY-BILLBOARD-LOCK";
let lastScene = null;

function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeEspressoTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1536;
  const x = c.getContext("2d");

  const bg = x.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#170507");
  bg.addColorStop(1, "#050102");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);

  x.strokeStyle = "#ffd77b";
  x.lineWidth = 38;
  rr(x, 50, 50, 924, 1436, 34);
  x.stroke();
  x.strokeStyle = "rgba(255,215,123,.55)";
  x.lineWidth = 5;
  rr(x, 76, 76, 872, 1384, 25);
  x.stroke();

  x.fillStyle = "#e41414";
  rr(x, 105, 95, 210, 66, 13);
  x.fill();
  x.fillStyle = "#fff";
  x.font = "900 38px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 210, 128);

  x.fillStyle = "#2a0908";
  rr(x, 105, 105, 814, 780, 45);
  x.fill();
  x.strokeStyle = "#f1b958";
  x.lineWidth = 9;
  rr(x, 105, 105, 814, 780, 45);
  x.stroke();

  const wood = x.createLinearGradient(110, 130, 915, 880);
  wood.addColorStop(0, "#c98d42");
  wood.addColorStop(.55, "#e5bb6f");
  wood.addColorStop(1, "#98602a");
  x.fillStyle = wood;
  rr(x, 125, 125, 774, 740, 32);
  x.fill();

  const saucer = x.createRadialGradient(505, 660, 80, 505, 660, 300);
  saucer.addColorStop(0, "#ffffff");
  saucer.addColorStop(.58, "#ddd9cf");
  saucer.addColorStop(1, "#837a70");
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
  crema.addColorStop(.42, "#d98a34");
  crema.addColorStop(1, "#78320d");
  x.fillStyle = crema;
  x.beginPath();
  x.ellipse(505, 420, 270, 136, .02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(92,32,8,.45)";
  for (let i = 0; i < 300; i++){
    const px = 300 + ((i * 37) % 420);
    const py = 315 + ((i * 61) % 190);
    x.beginPath();
    x.arc(px, py, 1.5 + ((i * 11) % 5), 0, Math.PI * 2);
    x.fill();
  }

  x.fillStyle = "rgba(15,3,4,.95)";
  rr(x, 120, 940, 784, 285, 32);
  x.fill();
  x.strokeStyle = "rgba(255,199,96,.82)";
  x.lineWidth = 5;
  rr(x, 120, 940, 784, 285, 32);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 102px Arial";
  x.fillText("ESPRESSO", 512, 1042);
  x.fillStyle = "#ffd77b";
  x.font = "900 84px Arial";
  x.fillText("WITH CREAM", 512, 1140);
  x.fillStyle = "#f2eeee";
  x.font = "800 34px Arial";
  x.fillText("REAL PHOTO AD TEXTURE", 512, 1195);

  x.fillStyle = "rgba(68,31,14,.90)";
  rr(x, 155, 1300, 714, 110, 24);
  x.fill();
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 4;
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

function makeTierTextTexture(){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = "rgba(0,0,0,.72)";
  rr(x, 16, 22, 480, 112, 18);
  x.fill();
  x.strokeStyle = "#ff1010";
  x.lineWidth = 8;
  rr(x, 16, 22, 480, 112, 18);
  x.stroke();
  x.fillStyle = "#ff1010";
  x.font = "900 68px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 256, 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function add(root, obj, x, y, z){
  obj.position.set(x, y, z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function orientToLobby(root){
  root.lookAt(new THREE.Vector3(0, 3.2, 0));
}

function hideOld(scene){
  [
    "ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113",
    "ESPRESSO_PHASE114_BIG_BUILDING_AD",
    "ESPRESSO_PHASE115_EXACT_POSITION_BUILDING",
    "ESPRESSO_PHASE115_VISIBLE_SKYLINE_BUILDING"
  ].forEach((name)=>{
    const old = scene.getObjectByName(name);
    if (old) old.visible = false;
  });
}

function install(scene){
  if (!scene || scene.getObjectByName("ESPRESSO_PHASE116_VISIBLE_REIKI_SKYLINE_BILLBOARD")) return false;
  hideOld(scene);

  const root = new THREE.Group();
  root.name = "ESPRESSO_PHASE116_VISIBLE_REIKI_SKYLINE_BILLBOARD";

  // Placed INSIDE the visible lobby/skyline zone instead of outside the wall.
  // This position is deliberately high and in front of the skyline so Quest cannot clip it.
  root.position.set(15.8, 0.0, -9.8);
  orientToLobby(root);
  root.frustumCulled = false;

  const poleMat = new THREE.MeshBasicMaterial({ color: 0x0a0d18, toneMapped: false });
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.24, 10.8, .24), poleMat), -3.95, 5.4, .12);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.24, 10.8, .24), poleMat), 3.95, 5.4, .12);

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(8.7, 12.9, .18),
    new THREE.MeshBasicMaterial({ color: 0x070102, toneMapped: false })
  );
  backing.name = "ESPRESSO_PHASE116_BLACK_BACKING_VISIBLE";
  add(root, backing, 0, 10.8, 0);

  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(8.25, 12.38),
    new THREE.MeshBasicMaterial({ map: makeEspressoTexture(), transparent: false, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  ad.name = "ESPRESSO_PHASE116_ESPRESSO_WITH_CREAM_AD_VISIBLE";
  ad.renderOrder = 99999;
  add(root, ad, 0, 10.8, -.13);

  const tier = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, .82),
    new THREE.MeshBasicMaterial({ map: makeTierTextTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  tier.name = "ESPRESSO_PHASE116_RED_1ST_TIER_LABEL_VISIBLE";
  tier.renderOrder = 100000;
  add(root, tier, -2.82, 17.35, -.20);

  const beacon = new THREE.PointLight(0xffd77b, 2.4, 32, 2.1);
  beacon.name = "ESPRESSO_PHASE116_VISIBLE_AD_LIGHT";
  add(root, beacon, 0, 11.0, -2.7);

  scene.add(root);
  scene.userData.phase116EspressoBillboard = root;
  console.log(`[${PHASE116}] visible Reiki skyline espresso billboard installed at`, root.position);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoPhase116Render){
  THREE.WebGLRenderer.prototype.__svrEspressoPhase116Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE116}] loaded`);
