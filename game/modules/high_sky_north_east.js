import * as THREE from "three";

const PHASE = "PHASE-130-ORBIT-SKY-PERFORMANCE-STABILITY-LOCK";

function haloTexture(){
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128,128,4,128,128,126);
  g.addColorStop(0,"rgba(255,255,255,.98)");
  g.addColorStop(.24,"rgba(220,232,255,.42)");
  g.addColorStop(.68,"rgba(120,150,255,.14)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function starTexture(){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,0,c.height);
  bg.addColorStop(0,"#00010a"); bg.addColorStop(.42,"#02051b"); bg.addColorStop(1,"#000104");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<700;i++){
    const y = Math.random() * c.height * .70;
    const a = .20 + Math.random() * .62;
    x.fillStyle = `rgba(255,255,255,${a})`;
    const s = Math.random() < .045 ? 2 : 1;
    x.fillRect(Math.random()*c.width, y, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function tryTexture(url){
  const tex = new THREE.TextureLoader().load(url, t=>{ t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; });
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function installHighSkyNorthEast({ scene, worldRoot = null } = {}){
  if (!scene) return null;
  const old = scene.getObjectByName("SVR_PHASE129_HIGH_SKY_NORTH_EAST") || scene.getObjectByName("SVR_PHASE130_ORBIT_SKY_SYSTEM");
  if (old) old.removeFromParent();

  const group = new THREE.Group();
  group.name = "SVR_PHASE130_ORBIT_SKY_SYSTEM";
  group.userData.svrNoWorldShift = true;
  (worldRoot || scene).add(group);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1150, 40, 20),
    new THREE.MeshBasicMaterial({ map: starTexture(), side: THREE.BackSide, depthWrite:false, depthTest:false, fog:false })
  );
  sky.name = "SVR_VISIBLE_HIGH_STAR_SKY_PHASE130";
  sky.userData.svrNoWorldShift = true;
  sky.frustumCulled = false;
  group.add(sky);

  const halo = haloTexture();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(44, 48, 32),
    new THREE.MeshBasicMaterial({ map: tryTexture("./assets/texture/moon_diffuse.png"), color:0xf7f8fb, fog:false, depthTest:true })
  );
  moon.name = "SVR_MOON_ORBIT_HIGH_NORTH_VISIBLE";
  moon.frustumCulled = false;
  group.add(moon);

  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color:0xf4f7ff, opacity:.48, transparent:true, depthWrite:false, depthTest:false, fog:false, blending:THREE.AdditiveBlending }));
  moonHalo.name = "SVR_MOON_ORBIT_HIGH_NORTH_HALO";
  moonHalo.scale.set(310,310,1);
  moonHalo.frustumCulled = false;
  group.add(moonHalo);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(27, 40, 28),
    new THREE.MeshBasicMaterial({ map: tryTexture("./assets/texture/mars/diffuse_1k.jpg"), color:0xe98555, fog:false, depthTest:true })
  );
  mars.name = "SVR_MARS_ORBIT_HIGH_EAST_VISIBLE";
  mars.frustumCulled = false;
  group.add(mars);

  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color:0xff9b6b, opacity:.34, transparent:true, depthWrite:false, depthTest:false, fog:false, blending:THREE.AdditiveBlending }));
  marsHalo.name = "SVR_MARS_ORBIT_HIGH_EAST_HALO";
  marsHalo.scale.set(215,215,1);
  marsHalo.frustumCulled = false;
  group.add(marsHalo);

  const api = {
    phase: PHASE,
    moon: "large high north orbit",
    mars: "large high east orbit",
    update(dt = .016){
      const t = performance.now() * .001;
      const moonA = -Math.PI / 2 + t * 0.018; // starts north, slow lobby orbit
      const marsA = 0 + t * 0.021;            // starts east, slow lobby orbit
      const moonRadius = 720;
      const marsRadius = 640;
      moon.rotation.y += dt * .030;
      mars.rotation.y += dt * .040;
      moon.position.set(Math.cos(moonA) * moonRadius, 720 + Math.sin(t*.05)*9, Math.sin(moonA) * moonRadius);
      mars.position.set(Math.cos(marsA) * marsRadius, 620 + Math.sin(t*.055+1.2)*8, Math.sin(marsA) * marsRadius);
      moonHalo.position.copy(moon.position);
      marsHalo.position.copy(mars.position);
      sky.position.set(0, 0, 0);
    }
  };
  group.userData.api = api;
  api.update(0.016);
  window.SVR_PHASE130_ORBIT_SKY = { phase: PHASE, moon: api.moon, mars: api.mars, siteTouched:false };
  window.SVR_PHASE129_HIGH_SKY = window.SVR_PHASE130_ORBIT_SKY;
  return api;
}
