import * as THREE from "three";

const PHASE131_SKY = "PHASE-131-HIGH-TEXTURED-ORBITING-MOON-MARS";
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
    const g = x.createRadialGradient(s * 0.34, s * 0.28, s * 0.04, s * 0.52, s * 0.52, s * 0.70);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#eaf0f8");
    g.addColorStop(0.70, "#b5bfcc");
    g.addColorStop(1, "#626b78");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);

    const craters = [
      [0.28,0.34,0.072],[0.56,0.28,0.060],[0.64,0.58,0.088],[0.37,0.68,0.064],
      [0.75,0.38,0.044],[0.20,0.62,0.045],[0.48,0.48,0.038],[0.58,0.76,0.033]
    ];
    craters.forEach(([cx,cy,rr])=>{
      const r = s * rr;
      const cg = x.createRadialGradient(cx*s-r*.25, cy*s-r*.25, r*.08, cx*s, cy*s, r);
      cg.addColorStop(0, "rgba(255,255,255,0.20)");
      cg.addColorStop(0.45, "rgba(70,76,88,0.38)");
      cg.addColorStop(1, "rgba(245,250,255,0.05)");
      x.fillStyle = cg;
      x.beginPath();
      x.arc(cx*s, cy*s, r, 0, Math.PI*2);
      x.fill();
      x.strokeStyle = "rgba(245,250,255,0.22)";
      x.lineWidth = Math.max(2, r*.045);
      x.stroke();
    });

    x.globalAlpha = 0.42;
    for (let i=0;i<95;i++){
      const cx = Math.random() * s;
      const cy = Math.random() * s;
      const r = 5 + Math.random() * 35;
      const cg = x.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      cg.addColorStop(0, "rgba(60,66,76,0.38)");
      cg.addColorStop(0.7, "rgba(120,130,145,0.14)");
      cg.addColorStop(1, "rgba(255,255,255,0.03)");
      x.fillStyle = cg;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI*2);
      x.fill();
    }
  });
  return cachedMoonTexture;
}

function makeMarsTexture(){
  if (cachedMarsTexture) return cachedMarsTexture;
  cachedMarsTexture = canvasTexture(1024, (x, s)=>{
    const g = x.createRadialGradient(s*.40,s*.30,s*.04,s*.50,s*.52,s*.72);
    g.addColorStop(0, "#ffbd84");
    g.addColorStop(0.32, "#db7548");
    g.addColorStop(0.72, "#93371f");
    g.addColorStop(1, "#36100b");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);

    for (let i=0;i<120;i++){
      x.fillStyle = i % 4 === 0 ? "rgba(255,210,146,0.22)" : "rgba(65,16,10,0.25)";
      x.beginPath();
      x.ellipse(Math.random()*s, Math.random()*s, 38+Math.random()*190, 5+Math.random()*26, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }

    x.globalAlpha = 0.28;
    x.strokeStyle = "rgba(255,225,170,0.34)";
    for (let i=0;i<60;i++){
      x.lineWidth = 1 + Math.random()*3.5;
      const y = Math.random()*s;
      x.beginPath();
      x.moveTo(0,y);
      x.bezierCurveTo(s*.25,y+Math.random()*90-45,s*.72,y+Math.random()*90-45,s,y+Math.random()*40-20);
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
  g.addColorStop(0.24, `rgba(${(color>>16)&255},${(color>>8)&255},${color&255},${opacity})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: 1, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
}

export function createTexturedMoonMars(scene, options = {}){
  const moonRadius = options.moonRadius ?? 6.2;
  const marsRadius = options.marsRadius ?? 3.85;
  const moonPos = options.moonPosition || new THREE.Vector3(-36, 134, -168);
  const marsPos = options.marsPosition || new THREE.Vector3(48, 150, -205);

  const group = new THREE.Group();
  group.name = options.name || "SVR_TEXTURED_MOON_MARS";
  group.userData.phase95Planets = true;
  group.userData.phase97NorthSky = true;
  group.userData.phase131HighSky = true;
  group.userData.fixedNorthSky = !!options.fixedNorthSky;
  scene.add(group);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(moonRadius, 80, 52),
    new THREE.MeshStandardMaterial({ map: makeMoonTexture(), bumpMap: makeNoiseBump("moon"), bumpScale: 0.18, color: 0xffffff, roughness: 0.82, metalness: 0, emissive: 0xdbeaff, emissiveIntensity: 0.16 })
  );
  moon.name = "SVR_TEXTURED_MOON";
  moon.userData.planetKind = "moon";
  moon.position.copy(moonPos);
  moon.frustumCulled = false;
  group.add(moon);

  const moonHalo = makeHalo(0xdbeaff, 0.30);
  moonHalo.name = "SVR_TEXTURED_MOON_HALO";
  moonHalo.scale.setScalar(moonRadius * 8.2);
  moon.add(moonHalo);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(marsRadius, 80, 52),
    new THREE.MeshStandardMaterial({ map: makeMarsTexture(), bumpMap: makeNoiseBump("mars"), bumpScale: 0.28, color: 0xffffff, roughness: 0.84, metalness: 0, emissive: 0x6a1f10, emissiveIntensity: 0.16 })
  );
  mars.name = "SVR_TEXTURED_MARS";
  mars.userData.planetKind = "mars";
  mars.position.copy(marsPos);
  mars.frustumCulled = false;
  group.add(mars);

  const marsHalo = makeHalo(0xff9b6b, 0.25);
  marsHalo.name = "SVR_TEXTURED_MARS_HALO";
  marsHalo.scale.setScalar(marsRadius * 9.0);
  mars.add(marsHalo);

  const moonLight = new THREE.PointLight(0xdbeaff, options.moonLight ?? 4.2, 240, 1.55);
  moonLight.position.copy(moon.position);
  group.add(moonLight);
  const marsLight = new THREE.PointLight(0xff9b6b, options.marsLight ?? 2.8, 220, 1.65);
  marsLight.position.copy(mars.position);
  group.add(marsLight);

  group.userData.tick = (dt, t)=>{
    moon.rotation.y += dt * 0.070;
    moon.rotation.x += dt * 0.008;
    mars.rotation.y += dt * 0.092;
    mars.rotation.x += dt * 0.010;
    const orbit = options.orbit ?? 5.2;
    moon.position.x = moonPos.x + Math.sin(t * 0.018) * orbit;
    moon.position.y = moonPos.y + Math.sin(t * 0.040) * 1.2;
    moon.position.z = moonPos.z + Math.cos(t * 0.014) * (orbit * 0.75);
    mars.position.x = marsPos.x + Math.sin(t * 0.015 + 1.1) * orbit;
    mars.position.y = marsPos.y + Math.sin(t * 0.037 + 0.7) * 1.0;
    mars.position.z = marsPos.z + Math.cos(t * 0.011 + 0.5) * (orbit * 0.70);
    moonLight.position.copy(moon.position);
    marsLight.position.copy(mars.position);
  };
  return { group, moon, mars };
}

function classifyExistingPlanet(mesh){
  if (!mesh?.isMesh || !/SphereGeometry/.test(String(mesh.geometry?.type || ""))) return null;
  const n = String(mesh.name || "").toLowerCase();
  if (/mars/.test(n) || mesh.userData?.planetKind === "mars") return "mars";
  if (/moon/.test(n) || mesh.userData?.planetKind === "moon") return "moon";
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
    obj.userData.planetKind = kind;
    obj.name = kind === "moon" ? "SVR_EXISTING_TEXTURED_MOON" : "SVR_EXISTING_TEXTURED_MARS";
    obj.material = new THREE.MeshStandardMaterial({
      map: kind === "moon" ? makeMoonTexture() : makeMarsTexture(),
      bumpMap: kind === "moon" ? makeNoiseBump("moon") : makeNoiseBump("mars"),
      bumpScale: kind === "moon" ? 0.18 : 0.28,
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0,
      emissive: kind === "moon" ? 0xdbeaff : 0x6a1f10,
      emissiveIntensity: 0.14
    });
    obj.frustumCulled = false;
    obj.visible = true;
  });
}

export function ensureNorthSkyMoonMars(scene){
  if (!scene) return null;
  const old = scene.getObjectByName?.("SVR_NORTH_SKY_MOON_MARS");
  if (old){
    old.traverse((o)=>{ o.frustumCulled = false; o.visible = true; });
    const moon = old.getObjectByName("SVR_TEXTURED_MOON");
    const mars = old.getObjectByName("SVR_TEXTURED_MARS");
    if (moon) moon.position.set(-36, 134, -168);
    if (mars) mars.position.set(48, 150, -205);
    old.userData.phase131HighSky = true;
    return old;
  }
  return createTexturedMoonMars(scene, {
    name: "SVR_NORTH_SKY_MOON_MARS",
    fixedNorthSky: true,
    moonRadius: 6.2,
    marsRadius: 3.85,
    moonPosition: new THREE.Vector3(-36, 134, -168),
    marsPosition: new THREE.Vector3(48, 150, -205),
    moonLight: 4.2,
    marsLight: 2.8,
    orbit: 5.2
  });
}

export function tickTexturedMoonMars(scene, dt = 0.016){
  const t = scene.userData._time || performance.now() * 0.001;
  scene.traverse((obj)=>{ if (obj?.userData?.phase95Planets && obj.userData.tick) obj.userData.tick(dt, t); });
}

export { PHASE131_SKY as PHASE95, PHASE131_SKY as PHASE97, PHASE131_SKY };