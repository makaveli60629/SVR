import * as THREE from "three";

const PHASE114 = "PHASE-114-ESPRESSO-BIG-BUILDING-AD-CURRENT-POSITION";
let lastScene = null;

const TARGET = Object.freeze({
  x: 27.38,
  y: 0.0,
  z: -0.88,
  label: "USER_HUB_POSITION_TABLE_CURRENT_POSITION"
});

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeBuildingWindowTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 2048;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "#081427");
  g.addColorStop(0.45, "#050914");
  g.addColorStop(1, "#02040a");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < 34; row++){
    for (let col = 0; col < 12; col++){
      const px = 54 + col * 78;
      const py = 62 + row * 58;
      const lit = ((row * 7 + col * 11) % 5) !== 0;
      x.fillStyle = lit ? "rgba(78,170,255,0.55)" : "rgba(10,18,35,0.82)";
      roundRect(x, px, py, 42, 26, 3);
      x.fill();
      if (lit){
        x.fillStyle = "rgba(160,230,255,0.14)";
        x.fillRect(px + 4, py + 4, 34, 3);
      }
    }
  }
  x.strokeStyle = "rgba(130,220,255,0.16)";
  x.lineWidth = 2;
  for (let i = 0; i < c.width; i += 78){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke(); }
  for (let i = 0; i < c.height; i += 58){ x.beginPath(); x.moveTo(0, i); x.lineTo(c.width, i); x.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function makeEspressoTexture(){
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1400;
  const x = c.getContext("2d");

  const bg = x.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#160507");
  bg.addColorStop(1, "#060203");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);

  x.strokeStyle = "#ffd77b";
  x.lineWidth = 34;
  roundRect(x, 45, 45, 810, 1310, 30);
  x.stroke();
  x.lineWidth = 4;
  x.strokeStyle = "rgba(255,215,123,0.62)";
  roundRect(x, 62, 62, 776, 1276, 22);
  x.stroke();

  // small red tier label requested by user
  x.fillStyle = "#e41414";
  roundRect(x, 100, 92, 185, 58, 12);
  x.fill();
  x.fillStyle = "#ffffff";
  x.font = "900 32px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 192, 121);

  // photo-style coffee frame
  x.fillStyle = "#1e0909";
  roundRect(x, 86, 86, 728, 735, 42);
  x.fill();
  x.strokeStyle = "#f1b958";
  x.lineWidth = 8;
  roundRect(x, 86, 86, 728, 735, 42);
  x.stroke();

  const wood = x.createLinearGradient(90, 95, 810, 820);
  wood.addColorStop(0, "#c9893c");
  wood.addColorStop(0.55, "#e3b66b");
  wood.addColorStop(1, "#9f642e");
  x.fillStyle = wood;
  roundRect(x, 104, 104, 692, 700, 28);
  x.fill();
  x.strokeStyle = "rgba(70,35,12,0.24)";
  x.lineWidth = 5;
  for (let i = -160; i < 900; i += 58){
    x.beginPath();
    x.moveTo(i, 104);
    x.lineTo(i + 250, 804);
    x.stroke();
  }

  const saucer = x.createRadialGradient(430, 625, 80, 430, 625, 260);
  saucer.addColorStop(0, "#ffffff");
  saucer.addColorStop(0.58, "#dedbd1");
  saucer.addColorStop(1, "#8b8378");
  x.fillStyle = saucer;
  x.beginPath();
  x.ellipse(430, 625, 278, 112, -0.02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(30,20,12,0.18)";
  x.beginPath();
  x.ellipse(505, 645, 190, 56, -0.02, 0, Math.PI * 2);
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

  const crema = x.createRadialGradient(410, 390, 20, 410, 390, 260);
  crema.addColorStop(0, "#ffe0a3");
  crema.addColorStop(0.42, "#d38632");
  crema.addColorStop(1, "#7d3510");
  x.fillStyle = crema;
  x.beginPath();
  x.ellipse(430, 392, 242, 128, 0.02, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(95,35,8,0.45)";
  for (let i = 0; i < 260; i++){
    const px = 245 + ((i * 41) % 365);
    const py = 285 + ((i * 67) % 175);
    x.beginPath();
    x.arc(px, py, 1.2 + ((i * 13) % 5), 0, Math.PI * 2);
    x.fill();
  }

  x.fillStyle = "rgba(15,3,4,0.94)";
  roundRect(x, 105, 856, 690, 255, 30);
  x.fill();
  x.strokeStyle = "rgba(255,199,96,0.78)";
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

  x.fillStyle = "rgba(68,31,14,0.88)";
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

function add(root, obj, x, y, z){ obj.position.set(x, y, z); root.add(obj); return obj; }

function install(scene){
  if (!scene || scene.getObjectByName("ESPRESSO_PHASE114_BIG_BUILDING_AD")) return false;

  // Hide older misplaced espresso ad, if it loaded from Phase 113.
  const old = scene.getObjectByName("ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113");
  if (old) old.visible = false;

  const root = new THREE.Group();
  root.name = "ESPRESSO_PHASE114_BIG_BUILDING_AD";
  root.position.set(TARGET.x, TARGET.y, TARGET.z);
  root.lookAt(new THREE.Vector3(0, 4.5, 0));
  root.userData.phase114Target = TARGET;

  const buildingMat = new THREE.MeshBasicMaterial({ map: makeBuildingWindowTexture(), color: 0xffffff, toneMapped: false });
  const building = new THREE.Mesh(new THREE.BoxGeometry(12.0, 34.0, 3.2), buildingMat);
  building.name = "ESPRESSO_PHASE114_BIGGEST_BUILDING";
  add(root, building, 0, 17.0, 0);

  const roofGlow = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.22, 3.45), new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false }));
  roofGlow.name = "ESPRESSO_PHASE114_ROOF_GOLD_TRIM";
  add(root, roofGlow, 0, 34.15, 0);

  const adBack = new THREE.Mesh(new THREE.BoxGeometry(7.45, 11.45, 0.10), new THREE.MeshBasicMaterial({ color: 0x090102, toneMapped: false }));
  adBack.name = "ESPRESSO_PHASE114_AD_BACKING";
  add(root, adBack, 0, 18.2, -1.665);

  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(7.05, 11.05),
    new THREE.MeshBasicMaterial({ map: makeEspressoTexture(), transparent: false, side: THREE.DoubleSide, toneMapped: false })
  );
  ad.name = "ESPRESSO_WITH_CREAM_VISIBLE_1ST_TIER_AD";
  add(root, ad, 0, 18.2, -1.73);

  const tierLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 0.58),
    new THREE.MeshBasicMaterial({ color: 0xff1414, side: THREE.DoubleSide, toneMapped: false })
  );
  tierLabel.name = "ESPRESSO_PHASE114_RED_1ST_TIER_LABEL";
  add(root, tierLabel, -2.45, 24.15, -1.78);

  const beacon = new THREE.PointLight(0xffd77b, 2.0, 26, 2.0);
  beacon.name = "ESPRESSO_PHASE114_AD_LIGHT";
  add(root, beacon, 0, 18.5, -3.6);

  scene.add(root);
  scene.userData.phase114EspressoBuildingAd = root;
  console.log(`[${PHASE114}] biggest building and visible espresso ad placed`, TARGET);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoBuildingPhase114){
  THREE.WebGLRenderer.prototype.__svrEspressoBuildingPhase114 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1200);
console.log(`[${PHASE114}] loaded`);
