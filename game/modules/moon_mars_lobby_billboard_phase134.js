import * as THREE from "three";

const PHASE149_PLANETS = "PHASE-149-REAL-SPHERE-PLANETS-HIGH-SKY";
let lastScene = null;
let installed = false;
let rig = null;

function makePlanetTexture(kind){
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  const s = c.width;
  const cx = s / 2;
  const cy = s / 2;

  const g = x.createRadialGradient(s*.34, s*.28, s*.02, cx, cy, s*.56);
  if (kind === "moon"){
    g.addColorStop(0, "#ffffff");
    g.addColorStop(.32, "#eef5ff");
    g.addColorStop(.70, "#9ba7b8");
    g.addColorStop(1, "#3e4654");
  } else {
    g.addColorStop(0, "#ffc58e");
    g.addColorStop(.34, "#d85b2c");
    g.addColorStop(.72, "#8d2e18");
    g.addColorStop(1, "#2d0905");
  }
  x.fillStyle = g;
  x.fillRect(0,0,s,s);

  x.save();
  x.beginPath();
  x.arc(cx, cy, s*.49, 0, Math.PI*2);
  x.clip();
  if (kind === "moon"){
    for(let i=0;i<115;i++){
      x.fillStyle = i % 4 === 0 ? "rgba(255,255,255,.18)" : "rgba(42,50,62,.28)";
      x.beginPath();
      x.arc(Math.random()*s, Math.random()*s, 4 + Math.random()*28, 0, Math.PI*2);
      x.fill();
    }
  } else {
    for(let i=0;i<150;i++){
      x.fillStyle = i % 4 === 0 ? "rgba(255,216,150,.25)" : "rgba(48,10,6,.32)";
      x.beginPath();
      x.ellipse(Math.random()*s, Math.random()*s, 18 + Math.random()*120, 4 + Math.random()*18, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
  }
  x.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function hideFakePlanets(scene){
  scene.traverse((o)=>{
    const n = String(o?.name || "");
    if(/PHASE134_.*SKY.*VISIBLE|PHASE134_.*HALO|PHASE143_VISIBLE_MOON|PHASE143_VISIBLE_MARS|PHASE148_HIGH_VISIBLE_MOON|PHASE148_HIGH_VISIBLE_MARS|PHASE142_VISIBLE_LOBBY_MOON|PHASE142_VISIBLE_LOBBY_MARS/.test(n)){
      o.visible = false;
    }
  });
}

function makeSpherePlanet(name, kind, radius, position, renderOrder){
  const mat = new THREE.MeshBasicMaterial({
    map: makePlanetTexture(kind),
    color: 0xffffff,
    depthWrite: false,
    depthTest: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), mat);
  mesh.name = name;
  mesh.position.copy(position);
  mesh.renderOrder = renderOrder;
  mesh.frustumCulled = false;
  const glow = new THREE.PointLight(kind === "moon" ? 0xdbeaff : 0xff8f5b, kind === "moon" ? 2.2 : 1.6, 90, 2);
  glow.name = `${name}_GLOW`;
  mesh.add(glow);
  return mesh;
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideFakePlanets(scene);

  const group = new THREE.Group();
  group.name = "PHASE149_REAL_HIGH_SKY_PLANETS";
  group.frustumCulled = false;

  const moon = makeSpherePlanet("PHASE149_REAL_MOON_HIGH_SKY", "moon", 7.2, new THREE.Vector3(-20, 68, -58), 340000);
  const mars = makeSpherePlanet("PHASE149_REAL_MARS_HIGH_SKY", "mars", 4.6, new THREE.Vector3(24, 78, -66), 340001);
  group.add(moon, mars);
  scene.add(group);
  rig = { group, moon, mars };
  scene.userData.phase149RealPlanets = rig;
  console.log(`[${PHASE149_PLANETS}] installed real sphere planets`);
  return true;
}

function update(scene, camera){
  if(!scene) return;
  install(scene);
  hideFakePlanets(scene);
  if(!rig) return;
  const t = performance.now() * .001;
  rig.moon.position.set(-20 + Math.sin(t*.030)*5, 68 + Math.sin(t*.045)*1.0, -58 + Math.cos(t*.025)*2.0);
  rig.mars.position.set(24 + Math.sin(t*.026 + 1.1)*5, 78 + Math.sin(t*.040 + .8)*1.0, -66 + Math.cos(t*.022 + .5)*2.0);
  rig.moon.rotation.y += .0016;
  rig.mars.rotation.y += .0022;
  if(camera?.far && camera.far < 400){ camera.far = 400; camera.updateProjectionMatrix?.(); }
  rig.group.visible = true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase149RealPlanets){
  THREE.WebGLRenderer.prototype.__svrPhase149RealPlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    update(lastScene,camera);
    return originalRender.call(this,scene,camera);
  };
}
setInterval(()=>update(lastScene,null),600);
console.log(`[${PHASE149_PLANETS}] loaded`);
