import * as THREE from "three";

const PHASE149_CAT = "PHASE-149-CAT-ONLY-NO-FAKE-PLANETS";
let lastScene = null;
let installed = false;

function makeText(title, sub) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#05040a";
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 16;
  x.strokeRect(26, 26, c.width - 52, c.height - 52);
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 7;
  x.strokeRect(72, 72, c.width - 144, c.height - 144);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff7e3";
  x.font = "900 78px Arial";
  x.fillText(title, c.width / 2, 205);
  x.fillStyle = "#71f7ff";
  x.font = "800 36px Arial";
  x.fillText(sub, c.width / 2, 305);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeVisibleCat() {
  const root = new THREE.Group();
  root.name = "PHASE149_VISIBLE_SOUTH_WALL_CAT_ONLY";
  root.position.set(0, 0.08, 15.65);
  root.rotation.y = Math.PI;
  root.frustumCulled = false;

  const bed = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 2.05, 0.24, 64),
    new THREE.MeshBasicMaterial({ color: 0x2a0718, toneMapped: false })
  );
  bed.position.y = 0.12;
  bed.scale.z = 0.70;
  root.add(bed);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(2.02, 0.08, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false, depthTest: false })
  );
  rim.position.y = 0.30;
  rim.rotation.x = Math.PI / 2;
  rim.scale.z = 0.70;
  rim.renderOrder = 300000;
  root.add(rim);

  const fur = new THREE.MeshStandardMaterial({ color: 0xb07a4f, roughness: 0.88, metalness: 0, emissive: 0x160806, emissiveIntensity: 0.06 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18), fur);
  body.position.y = 0.68;
  body.scale.set(1.75, 0.62, 0.90);
  body.frustumCulled = false;
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 16), fur);
  head.position.set(-1.16, 0.84, 0.06);
  head.frustumCulled = false;
  root.add(head);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.15),
    new THREE.MeshBasicMaterial({ map: makeText("SVR CAT", "south wall companion"), transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false })
  );
  sign.position.set(0, 2.15, -0.46);
  sign.renderOrder = 300001;
  root.add(sign);

  const light = new THREE.PointLight(0xffd77b, 3.5, 9, 2);
  light.position.set(0, 1.8, 0.9);
  root.add(light);
  return root;
}

function hideFakePlanets(scene){
  scene.traverse((o)=>{
    const n = String(o?.name || "");
    if(/PHASE143_VISIBLE_MOON|PHASE143_VISIBLE_MARS|PHASE148_HIGH_VISIBLE_MOON|PHASE148_HIGH_VISIBLE_MARS|PHASE142_VISIBLE_LOBBY_MOON|PHASE142_VISIBLE_LOBBY_MARS/.test(n)){
      o.visible = false;
    }
  });
}

function install(scene) {
  if (!scene || installed) return;
  installed = true;
  hideFakePlanets(scene);

  ["SOUTH_WALL_CAT_DECOR_PHASE136", "SOUTH_WALL_CAT_DECOR_PHASE135"].forEach((name) => {
    const obj = scene.getObjectByName(name);
    if (obj) obj.visible = false;
  });

  const layer = new THREE.Group();
  layer.name = "PHASE149_CAT_ONLY_LAYER";
  layer.frustumCulled = false;
  layer.add(makeVisibleCat());
  scene.add(layer);
  console.log(`[${PHASE149_CAT}] cat-only layer installed; fake planets disabled`);
}

const oldRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPhase149CatOnly) {
  THREE.WebGLRenderer.prototype.__svrPhase149CatOnly = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera) {
    lastScene = scene || lastScene;
    install(lastScene);
    if (lastScene) hideFakePlanets(lastScene);
    return oldRender.call(this, scene, camera);
  };
}
setInterval(() => { install(lastScene); if(lastScene) hideFakePlanets(lastScene); }, 1000);
console.log(`[${PHASE149_CAT}] loaded`);
