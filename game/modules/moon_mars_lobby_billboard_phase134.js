import * as THREE from "three";

const PHASE153_PLANETS = "PHASE-153-Y500-HIGHEST-SKY-PLANETS";
let lastScene = null;
let installed = false;
let rig = null;

const PLANET_CONFIG = {
  moon: {
    name: "PHASE153_REAL_MOON_Y500_HIGHEST_SKY",
    kind: "moon",
    radius: 24,
    base: new THREE.Vector3(-18, 500, -46),
    renderOrder: 390000
  },
  mars: {
    name: "PHASE153_REAL_MARS_Y500_HIGHEST_SKY",
    kind: "mars",
    radius: 16,
    base: new THREE.Vector3(24, 500, -54),
    renderOrder: 390001
  }
};

function makePlanetTexture(kind){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext("2d");
  const s = c.width;
  const cx = s / 2;
  const cy = s / 2;

  const gradient = x.createRadialGradient(s * 0.34, s * 0.28, s * 0.02, cx, cy, s * 0.56);
  if (kind === "moon"){
    gradient.addColorStop(0.00, "#ffffff");
    gradient.addColorStop(0.30, "#f1f7ff");
    gradient.addColorStop(0.68, "#aab6c8");
    gradient.addColorStop(1.00, "#3e4654");
  } else {
    gradient.addColorStop(0.00, "#ffc58e");
    gradient.addColorStop(0.34, "#d85b2c");
    gradient.addColorStop(0.72, "#8d2e18");
    gradient.addColorStop(1.00, "#2d0905");
  }
  x.fillStyle = gradient;
  x.fillRect(0, 0, s, s);

  x.save();
  x.beginPath();
  x.arc(cx, cy, s * 0.49, 0, Math.PI * 2);
  x.clip();

  const marks = kind === "moon" ? 150 : 190;
  for (let i = 0; i < marks; i++){
    if (kind === "moon"){
      x.fillStyle = i % 4 === 0 ? "rgba(255,255,255,.18)" : "rgba(42,50,62,.30)";
      x.beginPath();
      x.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 34, 0, Math.PI * 2);
      x.fill();
    } else {
      x.fillStyle = i % 4 === 0 ? "rgba(255,216,150,.25)" : "rgba(48,10,6,.34)";
      x.beginPath();
      x.ellipse(
        Math.random() * s,
        Math.random() * s,
        18 + Math.random() * 135,
        4 + Math.random() * 20,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      x.fill();
    }
  }
  x.restore();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function hideOldPlanets(scene){
  if (!scene) return;
  scene.traverse((obj)=>{
    const name = String(obj?.name || "");
    const isOldPlanet = /PHASE134|PHASE140_CELESTIAL|PHASE142.*MOON|PHASE142.*MARS|PHASE143.*MOON|PHASE143.*MARS|PHASE148.*MOON|PHASE148.*MARS|PHASE149.*MOON|PHASE149.*MARS|PHASE150.*MOON|PHASE150.*MARS|PHASE151.*MOON|PHASE151.*MARS|PHASE152.*MOON|PHASE152.*MARS/.test(name);
    if (isOldPlanet && !/PHASE153/.test(name)) obj.visible = false;
  });
}

function makePlanet(config){
  const material = new THREE.MeshBasicMaterial({
    map: makePlanetTexture(config.kind),
    color: 0xffffff,
    depthWrite: false,
    depthTest: false,
    toneMapped: false
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(config.radius, 80, 40), material);
  mesh.name = config.name;
  mesh.position.copy(config.base);
  mesh.renderOrder = config.renderOrder;
  mesh.frustumCulled = false;

  const glow = new THREE.PointLight(
    config.kind === "moon" ? 0xdbeaff : 0xff8f5b,
    config.kind === "moon" ? 4.0 : 2.8,
    320,
    2
  );
  glow.name = `${config.name}_GLOW`;
  mesh.add(glow);

  return mesh;
}

function install(scene){
  if (!scene || installed) return false;
  installed = true;
  hideOldPlanets(scene);

  const group = new THREE.Group();
  group.name = "PHASE153_Y500_HIGHEST_SKY_PLANET_LAYER";
  group.frustumCulled = false;

  const moon = makePlanet(PLANET_CONFIG.moon);
  const mars = makePlanet(PLANET_CONFIG.mars);

  group.add(moon, mars);
  scene.add(group);

  rig = { group, moon, mars };
  scene.userData.phase153Planets = rig;
  console.log(`[${PHASE153_PLANETS}] installed`, {
    moon: { x: PLANET_CONFIG.moon.base.x, y: PLANET_CONFIG.moon.base.y, z: PLANET_CONFIG.moon.base.z, radius: PLANET_CONFIG.moon.radius },
    mars: { x: PLANET_CONFIG.mars.base.x, y: PLANET_CONFIG.mars.base.y, z: PLANET_CONFIG.mars.base.z, radius: PLANET_CONFIG.mars.radius }
  });
  return true;
}

function update(scene, camera){
  if (!scene) return;
  install(scene);
  hideOldPlanets(scene);
  if (!rig) return;

  const t = performance.now() * 0.001;
  rig.moon.position.set(-18 + Math.sin(t * 0.012) * 5, 500 + Math.sin(t * 0.020) * 2.0, -46 + Math.cos(t * 0.010) * 1.5);
  rig.mars.position.set(24 + Math.sin(t * 0.010 + 1.1) * 5, 500 + Math.sin(t * 0.018 + 0.8) * 2.0, -54 + Math.cos(t * 0.009 + 0.5) * 1.5);
  rig.moon.rotation.y += 0.0010;
  rig.mars.rotation.y += 0.0016;

  if (camera?.far && camera.far < 1500){
    camera.far = 1500;
    camera.updateProjectionMatrix?.();
  }
  rig.group.visible = true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPhase153Y500Planets){
  THREE.WebGLRenderer.prototype.__svrPhase153Y500Planets = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    update(lastScene, camera);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>update(lastScene, null), 600);
console.log(`[${PHASE153_PLANETS}] loaded`);
