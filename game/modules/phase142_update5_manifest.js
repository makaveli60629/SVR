import * as THREE from "three";

const PHASE142 = "PHASE-142-UPDATE-5-MODULAR-INTEGRATION-LOCK";
let lastScene = null;
let installed = false;

const LOUNGE_POS = new THREE.Vector3(-20.74, 0, 5.00);
const CAT_POS = new THREE.Vector3(0, 0.08, 17.82);

function makeTextTexture(title, subtitle, footer = ""){
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 820;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#020307");
  g.addColorStop(.48,"#180a24");
  g.addColorStop(1,"#030407");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 18;
  x.strokeRect(34,34,c.width-68,c.height-68);
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 7;
  x.strokeRect(82,82,c.width-164,c.height-164);
  x.strokeStyle = "rgba(180,140,255,.86)";
  x.lineWidth = 4;
  x.strokeRect(120,120,c.width-240,c.height-240);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 20;
  x.fillStyle = "#fff7e3";
  x.font = "900 118px Arial";
  x.fillText(title, c.width/2, 310);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "900 48px Arial";
  x.fillText(subtitle, c.width/2, 420);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.86)";
  x.font = "700 34px Arial";
  if (footer) x.fillText(footer, c.width/2, 535);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makePlanet(kind){
  const color = kind === "moon" ? 0xffffff : 0xc1440e;
  const emissive = kind === "moon" ? 0xffffff : 0xc1440e;
  const radius = kind === "moon" ? 6 : 3.8;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 32),
    new THREE.MeshBasicMaterial({ color, depthWrite: false, depthTest: false, toneMapped: false })
  );
  mesh.name = kind === "moon" ? "PHASE142_FORCE_VISIBLE_MOON" : "PHASE142_FORCE_VISIBLE_MARS";
  mesh.renderOrder = kind === "moon" ? 280000 : 280001;
  mesh.frustumCulled = false;
  const light = new THREE.PointLight(emissive, kind === "moon" ? 2.8 : 2.0, 120, 2);
  light.name = `${mesh.name}_LIGHT`;
  mesh.add(light);
  return mesh;
}

function hidePriorPhaseObjects(scene){
  [
    "PHASE140_LOUNGE_STOREFRONT_ANCHORED",
    "LOUNGE_STOREFRONT_FORCE_VISIBLE_PHASE131",
    "LOUNGE_STOREFRONT_HUB_PHASE130",
    "PHASE140_CELESTIAL_FORCE_LAYER"
  ].forEach((name)=>{
    const obj = scene.getObjectByName(name);
    if (obj) obj.visible = false;
  });
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hidePriorPhaseObjects(scene);

  scene.userData.svrUpdate5 = {
    phase: PHASE142,
    handTeleport: "Phase141 inverted hand aim correction active; fingertip origin, corrected hand-only forward vector.",
    pokerDealOrder: "LEFT_TO_RIGHT_CLOCKWISE_BY_SEAT_INDEX_LOCKED",
    loungeAnchor: { x: LOUNGE_POS.x, y: LOUNGE_POS.y, z: LOUNGE_POS.z },
    catAnchor: { x: CAT_POS.x, y: CAT_POS.y, z: CAT_POS.z, facing: "north toward poker table" },
    celestial: "Moon/Mars forced visible with depthTest/depthWrite disabled and high render order."
  };

  const lounge = new THREE.Group();
  lounge.name = "PHASE142_THE_LOUNGE_STOREFRONT";
  lounge.position.copy(LOUNGE_POS);
  lounge.lookAt(new THREE.Vector3(0, 2.2, 0));
  lounge.frustumCulled = false;

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x05040a, toneMapped: false });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x0b1630, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x71f7ff, toneMapped: false });
  const purpleMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, toneMapped: false });

  const back = new THREE.Mesh(new THREE.BoxGeometry(12.6, 6.4, .22), frameMat);
  back.position.set(0, 3.25, .16);
  lounge.add(back);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 5.55), glassMat);
  glass.position.set(0, 3.25, .02);
  glass.renderOrder = 245000;
  lounge.add(glass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 4.9), new THREE.MeshBasicMaterial({ map: makeTextTexture("THE LOUNGE", "PRIVATE SOCIAL ROOM", "hands-only quick-select portal"), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  sign.position.set(0, 3.45, -.04);
  sign.renderOrder = 245001;
  lounge.add(sign);

  const topGold = new THREE.Mesh(new THREE.BoxGeometry(12.95, .14, .30), goldMat);
  topGold.position.set(0, 6.55, -.04);
  lounge.add(topGold);
  const bottomCyan = new THREE.Mesh(new THREE.BoxGeometry(12.95, .10, .26), cyanMat);
  bottomCyan.position.set(0, .13, -.04);
  lounge.add(bottomCyan);
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(.12, 6.45, .26), purpleMat);
  leftTrim.position.set(-6.45, 3.32, -.04);
  lounge.add(leftTrim);
  const rightTrim = leftTrim.clone();
  rightTrim.position.x = 6.45;
  lounge.add(rightTrim);
  const marker = new THREE.Mesh(new THREE.RingGeometry(1.08,1.38,80), new THREE.MeshBasicMaterial({ color: 0xffd77b, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  marker.name = "PHASE142_LOUNGE_PORTAL_MARKER";
  marker.rotation.x = -Math.PI/2;
  marker.position.set(0,.12,1.35);
  marker.renderOrder = 244999;
  lounge.add(marker);
  lounge.add(new THREE.PointLight(0xffd77b, 2.4, 13, 2));
  scene.add(lounge);

  const cat = scene.getObjectByName("SOUTH_WALL_CAT_DECOR_PHASE136") || scene.getObjectByName("SOUTH_WALL_CAT_DECOR_PHASE135");
  if (cat){
    cat.position.copy(CAT_POS);
    cat.lookAt(new THREE.Vector3(0, .65, 0));
    cat.visible = true;
    cat.frustumCulled = false;
  }

  const sky = new THREE.Group();
  sky.name = "PHASE142_CELESTIAL_FORCE_LAYER";
  sky.frustumCulled = false;
  const moon = makePlanet("moon");
  moon.position.set(-15,65,-120);
  const mars = makePlanet("mars");
  mars.position.set(35,75,-110);
  sky.add(moon, mars);
  scene.add(sky);

  scene.userData._phase142Update5Tick = (dt)=>{
    const t = performance.now() * 0.001;
    moon.rotation.y += dt * 0.12;
    mars.rotation.y += dt * 0.16;
    moon.position.x = -15 + Math.sin(t * 0.045) * 5;
    mars.position.x = 35 + Math.sin(t * 0.035 + 1.1) * 5;
  };

  console.log(`[${PHASE142}] installed`);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase142Update5){
  THREE.WebGLRenderer.prototype.__svrPhase142Update5 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    if(lastScene?.userData?._phase142Update5Tick) lastScene.userData._phase142Update5Tick(0.016);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>install(lastScene), 1000);
console.log(`[${PHASE142}] loaded`);
