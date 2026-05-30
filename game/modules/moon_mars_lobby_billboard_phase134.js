import * as THREE from "three";

const PHASE161_PLANETS = "PHASE-161-GUARANTEED-VISIBLE-MOON-MARS";
let lastScene = null;
let installed = false;
let rig = null;

function makePlanetTexture(kind){
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const s = c.width;
  const cx = s / 2;
  const cy = s / 2;
  const gradient = x.createRadialGradient(s * .34, s * .28, s * .02, cx, cy, s * .56);
  if(kind === "moon"){
    gradient.addColorStop(0,"#ffffff");
    gradient.addColorStop(.28,"#f8fbff");
    gradient.addColorStop(.66,"#aebccc");
    gradient.addColorStop(1,"#3e4654");
  } else {
    gradient.addColorStop(0,"#ffc58e");
    gradient.addColorStop(.32,"#e56b36");
    gradient.addColorStop(.70,"#923018");
    gradient.addColorStop(1,"#2d0905");
  }
  x.fillStyle = gradient;
  x.fillRect(0,0,s,s);
  x.save();
  x.beginPath();
  x.arc(cx,cy,s*.49,0,Math.PI*2);
  x.clip();
  const marks = kind === "moon" ? 90 : 115;
  for(let i=0;i<marks;i++){
    if(kind === "moon"){
      x.fillStyle = i%4===0 ? "rgba(255,255,255,.18)" : "rgba(42,50,62,.28)";
      x.beginPath(); x.arc(Math.random()*s, Math.random()*s, 3 + Math.random()*20, 0, Math.PI*2); x.fill();
    } else {
      x.fillStyle = i%4===0 ? "rgba(255,216,150,.25)" : "rgba(48,10,6,.34)";
      x.beginPath(); x.ellipse(Math.random()*s, Math.random()*s, 12+Math.random()*72, 3+Math.random()*13, Math.random()*Math.PI, 0, Math.PI*2); x.fill();
    }
  }
  x.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

function hideOldPlanets(scene){
  if(!scene) return;
  scene.traverse((obj)=>{
    const n = String(obj?.name || "");
    if(/PHASE134|PHASE140_CELESTIAL|PHASE142.*MOON|PHASE142.*MARS|PHASE143.*MOON|PHASE143.*MARS|PHASE148.*MOON|PHASE148.*MARS|PHASE149.*MOON|PHASE149.*MARS|PHASE150.*MOON|PHASE150.*MARS|PHASE151.*MOON|PHASE151.*MARS|PHASE152.*MOON|PHASE152.*MARS|PHASE153.*MOON|PHASE153.*MARS|PHASE154.*MOON|PHASE154.*MARS|PHASE155.*MOON|PHASE155.*MARS|Y700_NORTH_SKY_VISIBLE_PLANET_LAYER/.test(n)){
      if(!/PHASE161/.test(n)) obj.visible = false;
    }
  });
}

function makePlanet(name, kind, radius, color){
  const material = new THREE.MeshBasicMaterial({
    map: makePlanetTexture(kind),
    color,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), material);
  mesh.name = name;
  mesh.renderOrder = 990000;
  mesh.frustumCulled = false;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color, transparent:true, opacity: kind === "moon" ? .25 : .20, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  halo.name = `${name}_HALO`;
  halo.scale.set(radius*4.0, radius*4.0, 1);
  halo.renderOrder = 989999;
  mesh.add(halo);
  return mesh;
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideOldPlanets(scene);
  const group = new THREE.Group();
  group.name = "PHASE161_GUARANTEED_VISIBLE_PLANET_LAYER";
  group.frustumCulled = false;
  const moon = makePlanet("PHASE161_VISIBLE_MOON_FORWARD_SKY", "moon", 8.2, 0xffffff);
  const mars = makePlanet("PHASE161_VISIBLE_MARS_FORWARD_SKY", "mars", 5.3, 0xff7040);
  group.add(moon, mars);
  scene.add(group);
  rig = { group, moon, mars };
  scene.userData.phase161Planets = rig;
  console.log(`[${PHASE161_PLANETS}] installed visible fallback planets`);
  return true;
}

function update(scene, camera){
  if(!scene) return;
  install(scene);
  hideOldPlanets(scene);
  if(!rig) return;
  if(camera?.far && camera.far < 900){ camera.far = 900; camera.updateProjectionMatrix?.(); }

  const cam = camera || scene.userData.camera;
  const pos = new THREE.Vector3(0,1.6,0);
  const fwd = new THREE.Vector3(0,0,-1);
  if(cam){
    try { cam.getWorldPosition(pos); cam.getWorldDirection(fwd); } catch(_){ }
  }
  fwd.y = 0;
  if(fwd.lengthSq() < .0001) fwd.set(0,0,-1);
  fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0,1,0)).normalize();
  if(right.lengthSq() < .0001) right.set(1,0,0);

  // Anchored to the user's forward sky view so both planets are always findable above the skyline.
  rig.moon.position.copy(pos).addScaledVector(fwd, 118).addScaledVector(right, -24);
  rig.moon.position.y = pos.y + 45;
  rig.mars.position.copy(pos).addScaledVector(fwd, 132).addScaledVector(right, 25);
  rig.mars.position.y = pos.y + 56;
  rig.moon.rotation.y += .0009;
  rig.mars.rotation.y += .00135;
  rig.group.visible = true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase161VisiblePlanets){
  THREE.WebGLRenderer.prototype.__svrPhase161VisiblePlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    if(lastScene) lastScene.userData.camera = camera;
    update(lastScene,camera);
    return originalRender.call(this,scene,camera);
  };
}
setInterval(()=>update(lastScene,null),900);
console.log(`[${PHASE161_PLANETS}] loaded`);
