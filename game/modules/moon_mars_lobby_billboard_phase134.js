import * as THREE from "three";

const PHASE155_PLANETS = "PHASE-155-Y700-NORTH-SKY-VISIBLE-PLANETS";
let lastScene = null;
let installed = false;
let rig = null;

// Y is UP. Phase 155 raises both planets to Y=700 while keeping them in the north sky.
const PLANET_CONFIG = {
  moon: {
    name: "PHASE155_REAL_MOON_Y700_NORTH_SKY_VISIBLE",
    kind: "moon",
    radius: 58,
    base: new THREE.Vector3(-120, 700, -860),
    renderOrder: 420000
  },
  mars: {
    name: "PHASE155_REAL_MARS_Y700_NORTH_SKY_VISIBLE",
    kind: "mars",
    radius: 38,
    base: new THREE.Vector3(140, 700, -900),
    renderOrder: 420001
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
    gradient.addColorStop(0.28, "#f7fbff");
    gradient.addColorStop(0.66, "#aebccc");
    gradient.addColorStop(1.00, "#3e4654");
  } else {
    gradient.addColorStop(0.00, "#ffc58e");
    gradient.addColorStop(0.32, "#e56b36");
    gradient.addColorStop(0.70, "#923018");
    gradient.addColorStop(1.00, "#2d0905");
  }
  x.fillStyle = gradient;
  x.fillRect(0, 0, s, s);

  x.save();
  x.beginPath();
  x.arc(cx, cy, s * 0.49, 0, Math.PI * 2);
  x.clip();

  const marks = kind === "moon" ? 180 : 220;
  for (let i = 0; i < marks; i++){
    if (kind === "moon"){
      x.fillStyle = i % 4 === 0 ? "rgba(255,255,255,.20)" : "rgba(42,50,62,.32)";
      x.beginPath();
      x.arc(Math.random() * s, Math.random() * s, 5 + Math.random() * 38, 0, Math.PI * 2);
      x.fill();
    } else {
      x.fillStyle = i % 4 === 0 ? "rgba(255,216,150,.28)" : "rgba(48,10,6,.36)";
      x.beginPath();
      x.ellipse(
        Math.random() * s,
        Math.random() * s,
        20 + Math.random() * 145,
        4 + Math.random() * 24,
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
    const isOldPlanet = /PHASE134|PHASE140_CELESTIAL|PHASE142.*MOON|PHASE142.*MARS|PHASE143.*MOON|PHASE143.*MARS|PHASE148.*MOON|PHASE148.*MARS|PHASE149.*MOON|PHASE149.*MARS|PHASE150.*MOON|PHASE150.*MARS|PHASE151.*MOON|PHASE151.*MARS|PHASE152.*MOON|PHASE152.*MARS|PHASE153.*MOON|PHASE153.*MARS|PHASE154.*MOON|PHASE154.*MARS|PHASE153_Y500_HIGHEST_SKY_PLANET_LAYER|PHASE154_Y500_NORTH_SKY_VISIBLE_PLANET_LAYER/.test(name);
    if (isOldPlanet && !/PHASE155/.test(name)) obj.visible = false;
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

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(config.radius, 96, 48), material);
  mesh.name = config.name;
  mesh.position.copy(config.base);
  mesh.renderOrder = config.renderOrder;
  mesh.frustumCulled = false;

  const glow = new THREE.PointLight(
    config.kind === "moon" ? 0xdbeaff : 0xff8f5b,
    config.kind === "moon" ? 4.5 : 3.1,
    520,
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
  group.name = "PHASE155_Y700_NORTH_SKY_VISIBLE_PLANET_LAYER";
  group.frustumCulled = false;

  const moon = makePlanet(PLANET_CONFIG.moon);
  const mars = makePlanet(PLANET_CONFIG.mars);

  group.add(moon, mars);
  scene.add(group);

  rig = { group, moon, mars };
  scene.userData.phase155Planets = rig;
  console.log(`[${PHASE155_PLANETS}] installed`, {
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
  rig.moon.position.set(-120 + Math.sin(t * 0.010) * 10, 700 + Math.sin(t * 0.018) * 3.0, -860 + Math.cos(t * 0.008) * 8);
  rig.mars.position.set(140 + Math.sin(t * 0.009 + 1.1) * 10, 700 + Math.sin(t * 0.016 + 0.8) * 3.0, -900 + Math.cos(t * 0.007 + 0.5) * 8);
  rig.moon.rotation.y += 0.0010;
  rig.mars.rotation.y += 0.0016;

  if (camera?.far && camera.far < 3000){
    camera.far = 3000;
    camera.updateProjectionMatrix?.();
  }
  rig.group.visible = true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPhase155Y700NorthSkyPlanets){
  THREE.WebGLRenderer.prototype.__svrPhase155Y700NorthSkyPlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    update(lastScene, camera);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>update(lastScene, null), 600);
console.log(`[${PHASE155_PLANETS}] loaded`);
