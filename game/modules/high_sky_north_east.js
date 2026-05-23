import * as THREE from "three";

const PHASE = "PHASE-129-VIEW-PERFORMANCE-SPAWN-TELEPORT-MODULE-LOCK";

function haloTexture(){
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128,128,4,128,128,126);
  g.addColorStop(0,"rgba(255,255,255,.95)");
  g.addColorStop(.24,"rgba(220,232,255,.34)");
  g.addColorStop(.68,"rgba(120,150,255,.10)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function starTexture(){
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 1024;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,0,c.height);
  bg.addColorStop(0,"#00020b"); bg.addColorStop(.42,"#02051d"); bg.addColorStop(1,"#000105");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<1500;i++){
    const y = Math.random() * c.height * .72;
    const a = .25 + Math.random() * .65;
    x.fillStyle = `rgba(255,255,255,${a})`;
    const s = Math.random() < .06 ? 2 : 1;
    x.fillRect(Math.random()*c.width, y, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function tryTexture(url, fallbackColor){
  const tex = new THREE.TextureLoader().load(url, t=>{ t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; });
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function installHighSkyNorthEast({ scene, worldRoot = null } = {}){
  if (!scene) return null;
  const existing = scene.getObjectByName("SVR_PHASE129_HIGH_SKY_NORTH_EAST");
  if (existing) return existing.userData.api;
  const group = new THREE.Group();
  group.name = "SVR_PHASE129_HIGH_SKY_NORTH_EAST";
  group.userData.svrNoWorldShift = true;
  (worldRoot || scene).add(group);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(980, 48, 24), new THREE.MeshBasicMaterial({ map: starTexture(), side: THREE.BackSide, depthWrite:false, fog:false }));
  sky.name = "SVR_VISIBLE_HIGH_SKY";
  sky.userData.svrNoWorldShift = true;
  group.add(sky);

  const halo = haloTexture();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(20, 64, 48), new THREE.MeshBasicMaterial({ map: tryTexture("./assets/texture/moon_diffuse.png"), color:0xf5f6f8, fog:false }));
  moon.name = "SVR_MOON_HIGH_NORTH_VISIBLE";
  moon.position.set(0, 240, -420);
  moon.frustumCulled = false;
  group.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color:0xf4f7ff, opacity:.42, transparent:true, depthWrite:false, depthTest:false, fog:false, blending:THREE.AdditiveBlending }));
  moonHalo.position.copy(moon.position);
  moonHalo.scale.set(175,175,1);
  group.add(moonHalo);

  const mars = new THREE.Mesh(new THREE.SphereGeometry(12, 48, 36), new THREE.MeshBasicMaterial({ map: tryTexture("./assets/texture/mars/diffuse_1k.jpg"), color:0xe17a4f, fog:false }));
  mars.name = "SVR_MARS_HIGH_EAST_VISIBLE";
  mars.position.set(330, 212, -40);
  mars.frustumCulled = false;
  group.add(mars);
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color:0xff9b6b, opacity:.32, transparent:true, depthWrite:false, depthTest:false, fog:false, blending:THREE.AdditiveBlending }));
  marsHalo.position.copy(mars.position);
  marsHalo.scale.set(115,115,1);
  group.add(marsHalo);

  const api = {
    phase: PHASE,
    moon: "high north visible",
    mars: "high east visible",
    update(dt = .016){
      const t = performance.now() * .001;
      moon.rotation.y += dt * .035;
      mars.rotation.y += dt * .045;
      moon.position.set(0 + Math.sin(t*.045)*3, 240 + Math.sin(t*.08)*2, -420);
      mars.position.set(330, 212 + Math.sin(t*.07+1.2)*2, -40 + Math.cos(t*.04)*3);
      moonHalo.position.copy(moon.position);
      marsHalo.position.copy(mars.position);
    }
  };
  group.userData.api = api;
  window.SVR_PHASE129_HIGH_SKY = { phase: PHASE, moon: api.moon, mars: api.mars, siteTouched:false };
  return api;
}
