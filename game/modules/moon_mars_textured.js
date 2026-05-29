import * as THREE from "three";

const PHASE95 = "PHASE-95-TEXTURED-MOON-MARS-ALL-ROOMS-LOCK";
let cachedMoonTexture = null;
let cachedMarsTexture = null;
let cachedMoonBump = null;
let cachedMarsBump = null;

function canvasTexture(size, painter){
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const x = c.getContext("2d");
  painter(x, size, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeMoonTexture(){
  if (cachedMoonTexture) return cachedMoonTexture;
  cachedMoonTexture = canvasTexture(1024, (x, s)=>{
    const g = x.createRadialGradient(s * 0.36, s * 0.30, s * 0.05, s * 0.50, s * 0.52, s * 0.68);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#dfe6ef");
    g.addColorStop(1, "#8d96a5");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    x.globalAlpha = 0.55;
    for (let i=0;i<120;i++){
      const cx = Math.random() * s;
      const cy = Math.random() * s;
      const r = 8 + Math.random() * 58;
      const cg = x.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
      cg.addColorStop(0, "rgba(70,76,86,0.42)");
      cg.addColorStop(0.55, "rgba(110,118,132,0.26)");
      cg.addColorStop(1, "rgba(255,255,255,0.04)");
      x.fillStyle = cg;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 0.22;
    for (let i=0;i<34;i++){
      x.strokeStyle = "rgba(70,80,100,0.28)";
      x.lineWidth = 2 + Math.random() * 3;
      x.beginPath();
      const y = Math.random() * s;
      x.moveTo(0, y);
      x.bezierCurveTo(s * 0.25, y + Math.random()*90-45, s * 0.75, y + Math.random()*90-45, s, y + Math.random()*50-25);
      x.stroke();
    }
  });
  return cachedMoonTexture;
}

function makeMarsTexture(){
  if (cachedMarsTexture) return cachedMarsTexture;
  cachedMarsTexture = canvasTexture(1024, (x, s)=>{
    const g = x.createLinearGradient(0,0,s,s);
    g.addColorStop(0, "#e49365");
    g.addColorStop(0.45, "#ba5638");
    g.addColorStop(1, "#5f241b");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    for (let i=0;i<90;i++){
      x.fillStyle = i % 3 === 0 ? "rgba(255,196,128,0.20)" : "rgba(71,22,16,0.24)";
      x.beginPath();
      x.ellipse(Math.random()*s, Math.random()*s, 35+Math.random()*170, 6+Math.random()*30, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    x.globalAlpha = 0.26;
    x.strokeStyle = "rgba(255,222,170,0.28)";
    for (let i=0;i<42;i++){
      x.lineWidth = 1 + Math.random()*3;
      const y = Math.random()*s;
      x.beginPath();
      x.moveTo(0,y);
      x.bezierCurveTo(s*.32,y+Math.random()*80-40,s*.72,y+Math.random()*80-40,s,y+Math.random()*40-20);
      x.stroke();
    }
  });
  return cachedMarsTexture;
}

function makeNoiseBump(kind = "moon"){
  if (kind === "moon" && cachedMoonBump) return cachedMoonBump;
  if (kind === "mars" && cachedMarsBump) return cachedMarsBump;
  const tex = canvasTexture(512, (x, s)=>{
    x.fillStyle = kind === "moon" ? "#9a9a9a" : "#8a5a47";
    x.fillRect(0,0,s,s);
    for (let i=0;i<900;i++){
      const v = kind === "moon" ? 100 + Math.random()*120 : 75 + Math.random()*110;
      x.fillStyle = `rgba(${v|0},${v|0},${v|0},${0.12 + Math.random()*0.20})`;
      x.beginPath();
      x.arc(Math.random()*s, Math.random()*s, 1 + Math.random()*7, 0, Math.PI*2);
      x.fill();
    }
  });
  if (kind === "moon") cachedMoonBump = tex;
  else cachedMarsBump = tex;
  return tex;
}

function makeHalo(color, opacity = 0.22){
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128,128,8,128,128,126);
  g.addColorStop(0, `rgba(255,255,255,${opacity})`);
  g.addColorStop(0.25, `rgba(${(color>>16)&255},${(color>>8)&255},${color&255},${opacity})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
}

export function createTexturedMoonMars(scene, options = {}){
  const moonRadius = options.moonRadius ?? 2.25;
  const marsRadius = options.marsRadius ?? 1.35;
  const moonPos = options.moonPosition || new THREE.Vector3(-18, 18, -42);
  const marsPos = options.marsPosition || new THREE.Vector3(18, 20, -52);

  const group = new THREE.Group();
  group.name = options.name || "SVR_TEXTURED_MOON_MARS";
  group.userData.phase95Planets = true;
  scene.add(group);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(moonRadius, 64, 40),
    new THREE.MeshStandardMaterial({ map: makeMoonTexture(), bumpMap: makeNoiseBump("moon"), bumpScale: 0.12, color: 0xffffff, roughness: 0.88, metalness: 0.0, emissive: 0xdbeaff, emissiveIntensity: 0.05 })
  );
  moon.name = "SVR_TEXTURED_MOON";
  moon.position.copy(moonPos);
  moon.frustumCulled = false;
  group.add(moon);

  const moonHalo = makeHalo(0xdbeaff, 0.24);
  moonHalo.name = "SVR_TEXTURED_MOON_HALO";
  moonHalo.scale.setScalar(moonRadius * 8.5);
  moon.add(moonHalo);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(marsRadius, 64, 40),
    new THREE.MeshStandardMaterial({ map: makeMarsTexture(), bumpMap: makeNoiseBump("mars"), bumpScale: 0.20, color: 0xffffff, roughness: 0.86, metalness: 0.0, emissive: 0x3d1208, emissiveIntensity: 0.05 })
  );
  mars.name = "SVR_TEXTURED_MARS";
  mars.position.copy(marsPos);
  mars.frustumCulled = false;
  group.add(mars);

  const marsHalo = makeHalo(0xff9b6b, 0.20);
  marsHalo.name = "SVR_TEXTURED_MARS_HALO";
  marsHalo.scale.setScalar(marsRadius * 9.5);
  mars.add(marsHalo);

  const moonLight = new THREE.PointLight(0xdbeaff, options.moonLight ?? 2.0, 120, 1.7);
  moonLight.position.copy(moon.position);
  group.add(moonLight);
  const marsLight = new THREE.PointLight(0xff9b6b, options.marsLight ?? 1.25, 100, 1.8);
  marsLight.position.copy(mars.position);
  group.add(marsLight);

  group.userData.tick = (dt, t)=>{
    moon.rotation.y += dt * 0.055;
    mars.rotation.y += dt * 0.072;
    moon.position.x = moonPos.x + Math.sin(t * 0.020) * (options.orbit ?? 1.6);
    moon.position.y = moonPos.y + Math.sin(t * 0.055) * 0.45;
    mars.position.x = marsPos.x + Math.sin(t * 0.016 + 1.1) * (options.orbit ?? 1.6);
    mars.position.y = marsPos.y + Math.sin(t * 0.047 + 0.7) * 0.38;
    moonLight.position.copy(moon.position);
    marsLight.position.copy(mars.position);
  };
  return { group, moon, mars };
}

function classifyExistingPlanet(mesh){
  if (!mesh?.isMesh || !/SphereGeometry/.test(String(mesh.geometry?.type || ""))) return null;
  if (mesh.position.y < 8 || mesh.position.z > -10) return null;
  const c = mesh.material?.color;
  if (!c) return null;
  if (c.r > 0.68 && c.g > 0.62 && c.b > 0.62) return "moon";
  if (c.r > 0.45 && c.g > 0.12 && c.g < 0.62 && c.b < 0.52) return "mars";
  return null;
}

export function textureExistingMoonMars(scene){
  scene.traverse((obj)=>{
    const kind = classifyExistingPlanet(obj);
    if (!kind || obj.userData.phase95Textured) return;
    obj.userData.phase95Textured = true;
    obj.name = kind === "moon" ? "SVR_EXISTING_TEXTURED_MOON" : "SVR_EXISTING_TEXTURED_MARS";
    const map = kind === "moon" ? makeMoonTexture() : makeMarsTexture();
    const bump = kind === "moon" ? makeNoiseBump("moon") : makeNoiseBump("mars");
    obj.material = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: kind === "moon" ? 0.12 : 0.20, color: 0xffffff, roughness: 0.88, metalness: 0.0, emissive: kind === "moon" ? 0xdbeaff : 0x3d1208, emissiveIntensity: 0.04 });
    obj.frustumCulled = false;
    obj.visible = true;
  });
}

export function tickTexturedMoonMars(scene, dt = 0.016){
  const t = scene.userData._time || performance.now() * 0.001;
  scene.traverse((obj)=>{ if (obj?.userData?.phase95Planets && obj.userData.tick) obj.userData.tick(dt, t); });
}

export { PHASE95 };
