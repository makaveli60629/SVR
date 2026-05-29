import * as THREE from "three";

const PHASE115 = "PHASE-115-ESPRESSO-VISIBLE-BUILDING-AD-LOCK";
let lastScene = null;

// User current-position request. A matching giant ad/building is also mirrored above the Reiki skyline
// so it is visible even if the exterior skyline wall clips the exact outside placement.
const TARGET = Object.freeze({ x: 27.38, y: 0.0, z: -0.88 });

function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeWindowTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 2048;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "#0a1d38");
  g.addColorStop(0.52, "#050b18");
  g.addColorStop(1, "#02040a");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  for (let row=0; row<36; row++){
    for (let col=0; col<12; col++){
      const px = 50 + col * 78;
      const py = 60 + row * 55;
      const lit = ((row * 3 + col * 5) % 4) !== 0;
      x.fillStyle = lit ? "rgba(80,185,255,0.70)" : "rgba(6,13,28,0.88)";
      rr(x, px, py, 44, 26, 3);
      x.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeEspressoTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1536;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,0,c.height);
  bg.addColorStop(0,"#170507");
  bg.addColorStop(1,"#050102");
  x.fillStyle = bg;
  x.fillRect(0,0,c.width,c.height);
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

  // Coffee image approximation, large and readable.
  x.fillStyle = "#2a0908";
  rr(x, 105, 105, 814, 780, 45);
  x.fill();
  x.strokeStyle = "#f1b958";
  x.lineWidth = 9;
  rr(x, 105, 105, 814, 780, 45);
  x.stroke();

  const wood = x.createLinearGradient(110,130,915,880);
  wood.addColorStop(0,"#c98d42"); wood.addColorStop(.55,"#e5bb6f"); wood.addColorStop(1,"#98602a");
  x.fillStyle = wood;
  rr(x, 125, 125, 774, 740, 32);
  x.fill();

  const saucer = x.createRadialGradient(505,660,80,505,660,300);
  saucer.addColorStop(0,"#ffffff"); saucer.addColorStop(.58,"#ddd9cf"); saucer.addColorStop(1,"#837a70");
  x.fillStyle = saucer;
  x.beginPath(); x.ellipse(505,660,315,128,-.03,0,Math.PI*2); x.fill();

  x.fillStyle = "#fff8ea";
  x.beginPath(); x.ellipse(505,455,305,160,.02,0,Math.PI*2); x.fill();
  x.fillStyle = "#f8efdf";
  rr(x, 220, 435, 570, 185, 80); x.fill();
  x.lineWidth = 25; x.strokeStyle = "#f8efdf";
  x.beginPath(); x.arc(800,505,88,-.95,.98); x.stroke();
  const crema = x.createRadialGradient(488,420,25,488,420,285);
  crema.addColorStop(0,"#ffe5a8"); crema.addColorStop(.42,"#d98a34"); crema.addColorStop(1,"#78320d");
  x.fillStyle = crema;
  x.beginPath(); x.ellipse(505,420,270,136,.02,0,Math.PI*2); x.fill();
  x.fillStyle = "rgba(92,32,8,.45)";
  for(let i=0;i<300;i++){ const px=300+((i*37)%420); const py=315+((i*61)%190); x.beginPath(); x.arc(px,py,1.5+((i*11)%5),0,Math.PI*2); x.fill(); }

  x.fillStyle = "rgba(15,3,4,.95)";
  rr(x, 120, 940, 784, 285, 32); x.fill();
  x.strokeStyle = "rgba(255,199,96,.82)"; x.lineWidth = 5; rr(x,120,940,784,285,32); x.stroke();
  x.fillStyle = "#fff7e3"; x.font = "900 102px Arial"; x.fillText("ESPRESSO", 512, 1042);
  x.fillStyle = "#ffd77b"; x.font = "900 84px Arial"; x.fillText("WITH CREAM", 512, 1140);
  x.fillStyle = "#f2eeee"; x.font = "800 34px Arial"; x.fillText("REAL PHOTO AD TEXTURE", 512, 1195);

  x.fillStyle = "rgba(68,31,14,.90)"; rr(x,155,1300,714,110,24); x.fill();
  x.strokeStyle = "#ffd77b"; x.lineWidth = 4; rr(x,155,1300,714,110,24); x.stroke();
  x.fillStyle = "#fff7e3"; x.font = "900 42px Arial"; x.fillText("SVR LOBBY WALL AD", 512, 1358);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function add(root, obj, x, y, z){ obj.position.set(x,y,z); obj.frustumCulled = false; root.add(obj); return obj; }

function faceLobby(root){
  root.lookAt(new THREE.Vector3(0, 4.0, 0));
}

function makeBuildingGroup(name, position, scale = 1){
  const root = new THREE.Group();
  root.name = name;
  root.position.copy(position);
  root.scale.setScalar(scale);
  faceLobby(root);
  root.frustumCulled = false;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(15, 46, 4.2),
    new THREE.MeshBasicMaterial({ map: makeWindowTexture(), color: 0xffffff, toneMapped: false })
  );
  building.name = `${name}_BIG_BUILDING`;
  add(root, building, 0, 23, 0);

  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(15.6, .32, 4.6), new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped:false }));
  topTrim.name = `${name}_TOP_GOLD_TRIM`;
  add(root, topTrim, 0, 46.2, 0);

  const adBack = new THREE.Mesh(new THREE.BoxGeometry(9.6, 14.8, .18), new THREE.MeshBasicMaterial({ color: 0x080102, toneMapped:false }));
  adBack.name = `${name}_AD_BACKING`;
  add(root, adBack, 0, 25.5, -2.18);

  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(9.15, 14.25),
    new THREE.MeshBasicMaterial({ map: makeEspressoTexture(), transparent:false, side:THREE.DoubleSide, toneMapped:false, depthTest:true, depthWrite:true })
  );
  ad.name = `${name}_ESPRESSO_WITH_CREAM_AD_VISIBLE`;
  ad.renderOrder = 10000;
  add(root, ad, 0, 25.5, -2.30);

  const red = new THREE.Mesh(new THREE.PlaneGeometry(3.0,.78), new THREE.MeshBasicMaterial({ color:0xff1414, side:THREE.DoubleSide, toneMapped:false, depthTest:false }));
  red.name = `${name}_RED_1ST_TIER_LABEL`;
  red.renderOrder = 10001;
  add(root, red, -3.1, 33.0, -2.38);

  const light = new THREE.PointLight(0xffd77b, 2.8, 40, 2.0);
  light.name = `${name}_AD_LIGHT`;
  add(root, light, 0, 26, -5.5);

  return root;
}

function install(scene){
  if (!scene || scene.getObjectByName("ESPRESSO_PHASE115_EXACT_POSITION_BUILDING")) return false;

  // Hide previous attempts so only the visible final phase remains.
  ["ESPRESSO_WITH_CREAM_REIKI_BUILDING_AD_PHASE113", "ESPRESSO_PHASE114_BIG_BUILDING_AD"].forEach((n)=>{
    const old = scene.getObjectByName(n);
    if (old) old.visible = false;
  });

  const exact = makeBuildingGroup("ESPRESSO_PHASE115_EXACT_POSITION_BUILDING", new THREE.Vector3(TARGET.x, TARGET.y, TARGET.z), 1.0);
  scene.add(exact);

  // Second high-visibility copy above/behind Reiki skyline, still in the same sponsor direction.
  // This guarantees the banner is visible from inside the lobby even if the exterior wall clips the exact placement.
  const visible = makeBuildingGroup("ESPRESSO_PHASE115_VISIBLE_SKYLINE_BUILDING", new THREE.Vector3(20.5, 0, -13.5), 0.92);
  scene.add(visible);

  scene.userData.phase115EspressoAd = { exact, visible, target: TARGET };
  console.log(`[${PHASE115}] installed exact + visible espresso building ad`, TARGET);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoPhase115Render){
  THREE.WebGLRenderer.prototype.__svrEspressoPhase115Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE115}] loaded`);
