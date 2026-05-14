import * as THREE from "three";

const PHASE91_BUILD = "PHASE-91-CELESTIAL-POKER-DEAL-LOCK";

function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  painter(x, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePlanetTexture(kind = "moon"){
  return canvasTexture(1024, 1024, (x, w, h)=>{
    const mars = kind === "mars";
    x.clearRect(0, 0, w, h);
    const g = x.createRadialGradient(w*.34, h*.28, 18, w*.5, h*.5, w*.43);
    if (mars){
      g.addColorStop(0, "#ffd2a4");
      g.addColorStop(.32, "#ff8754");
      g.addColorStop(.70, "#b23a22");
      g.addColorStop(1, "#4c140d");
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(.38, "#edf5ff");
      g.addColorStop(.76, "#9eabc2");
      g.addColorStop(1, "#58667d");
    }
    x.fillStyle = g;
    x.beginPath();
    x.arc(w/2, h/2, w*.42, 0, Math.PI*2);
    x.fill();

    if (mars){
      x.strokeStyle = "rgba(82,22,10,.36)";
      x.lineWidth = 14;
      for (let i = 0; i < 10; i++){
        x.beginPath();
        x.ellipse(w/2, h*.20 + i*h*.065, w*.29 - i*7, 10 + (i%3)*5, i*.13, 0, Math.PI*2);
        x.stroke();
      }
      x.fillStyle = "rgba(255,220,160,.28)";
      x.beginPath();
      x.arc(w*.38, h*.36, w*.055, 0, Math.PI*2);
      x.fill();
    } else {
      x.fillStyle = "rgba(55,70,98,.28)";
      [[.36,.38,.048],[.60,.31,.072],[.64,.62,.052],[.29,.63,.036],[.73,.49,.042],[.47,.54,.026],[.41,.73,.032]].forEach(([px,py,r])=>{
        x.beginPath();
        x.arc(w*px, h*py, w*r, 0, Math.PI*2);
        x.fill();
      });
      x.strokeStyle = "rgba(255,255,255,.17)";
      x.lineWidth = 8;
      x.beginPath();
      x.arc(w/2, h/2, w*.37, Math.PI*.1, Math.PI*.72);
      x.stroke();
    }
  });
}

function makeGlowTexture(color = "rgba(180,140,255,"){
  return canvasTexture(256, 256, (x,w,h)=>{
    const g = x.createRadialGradient(w/2,h/2,2,w/2,h/2,w*.48);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(.18,`${color}.70)`);
    g.addColorStop(.55,`${color}.18)`);
    g.addColorStop(1,`${color}0)`);
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
  });
}

function createStarfield(count = 1300, radius = 104){
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++){
    const theta = Math.random() * Math.PI * 2;
    const y = 16 + Math.random() * 56;
    const r = radius * (.70 + Math.random() * .35);
    positions[i*3 + 0] = Math.cos(theta) * r;
    positions[i*3 + 1] = y;
    positions[i*3 + 2] = Math.sin(theta) * r;
    color.setHex(Math.random() < .74 ? 0xeaf7ff : Math.random() < .5 ? 0xb48cff : 0x86e3ff);
    colors[i*3 + 0] = color.r;
    colors[i*3 + 1] = color.g;
    colors[i*3 + 2] = color.b;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: .115, vertexColors: true, transparent: true, opacity: .82, depthWrite: false });
  const points = new THREE.Points(geom, mat);
  points.name = "SVR_PHASE91_REAL_STARFIELD_POINTS";
  return points;
}

function createBody({ name, kind, size, haloSize, color, lightColor, lightIntensity }){
  const group = new THREE.Group();
  group.name = name;

  const glowTex = makeGlowTexture(kind === "mars" ? "rgba(255,110,60," : "rgba(220,235,255,");
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: .70, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.name = `${name}_GLOW_HALO`;
  halo.scale.setScalar(haloSize);
  group.add(halo);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(size, 80, 40),
    new THREE.MeshStandardMaterial({ map: makePlanetTexture(kind), roughness: .82, metalness: 0, emissive: color, emissiveIntensity: kind === "mars" ? .24 : .17 })
  );
  sphere.name = `${name}_TEXTURED_ORBIT_SPHERE`;
  group.add(sphere);

  const light = new THREE.PointLight(lightColor, lightIntensity, 175, 1.75);
  group.add(light);

  return { group, sphere, halo, light };
}

export function applyPhase91CelestialPokerLock({ scene, log = console.log } = {}){
  if (!scene || scene.userData.SVR_PHASE91_CELESTIAL_POKER_LOCK) return scene?.userData?.SVR_PHASE91_CELESTIAL_POKER_LOCK || null;

  // Hide older forced moon/mars lock so the sky does not show duplicate celestial bodies.
  const oldSky = scene.getObjectByName("SVR_PHASE82_GLB_STYLE_MOON_MARS_HIGH_SKY_LOCK");
  if (oldSky) oldSky.visible = false;

  const root = new THREE.Group();
  root.name = "SVR_PHASE91_ORBITING_MOON_MARS_REAL_SKY_LOCK";
  scene.add(root);

  const stars = createStarfield();
  root.add(stars);

  const moon = createBody({
    name: "SVR_PHASE91_LARGE_GLOWING_MOON_ORBIT",
    kind: "moon",
    size: 5.9,
    haloSize: 26,
    color: 0xddeaff,
    lightColor: 0xddeaff,
    lightIntensity: 3.6
  });
  root.add(moon.group);

  const mars = createBody({
    name: "SVR_PHASE91_LARGE_GLOWING_MARS_ORBIT",
    kind: "mars",
    size: 2.9,
    haloSize: 15,
    color: 0xff6d3c,
    lightColor: 0xff7441,
    lightIntensity: 1.8
  });
  root.add(mars.group);

  const prevTick = scene.userData._tickWorld;
  function tick(dt = 0.016){
    if (typeof prevTick === "function") prevTick(dt);
    const t = performance.now() * .001;

    moon.sphere.rotation.y += dt * .060;
    moon.sphere.rotation.x += dt * .010;
    mars.sphere.rotation.y += dt * .105;
    mars.sphere.rotation.x += dt * .018;

    // High-altitude elliptical orbits behind/above the skyline.
    moon.group.position.set(Math.cos(t * .045) * 58, 48 + Math.sin(t * .023) * 4, -46 + Math.sin(t * .045) * 22);
    mars.group.position.set(Math.cos(t * .033 + 1.7) * 78, 43 + Math.sin(t * .028 + 1.2) * 5, -54 + Math.sin(t * .033 + 1.7) * 30);

    moon.halo.material.opacity = .64 + Math.sin(t * .72) * .06;
    mars.halo.material.opacity = .58 + Math.sin(t * .86) * .07;
    stars.rotation.y += dt * .0015;
  }

  scene.userData._tickWorld = tick;
  scene.userData.SVR_PHASE91_CELESTIAL_POKER_LOCK = { build: PHASE91_BUILD, root, stars, moon, mars, tick };
  window.SVR_PHASE91_CELESTIAL_POKER_LOCK = true;
  window.SVR_POKER_DEAL_DIRECTION = "RIGHT_TO_LEFT";
  log?.(`[${PHASE91_BUILD}] Moon/Mars orbit lock active. Poker deal direction target: RIGHT_TO_LEFT.`);
  return scene.userData.SVR_PHASE91_CELESTIAL_POKER_LOCK;
}

export { PHASE91_BUILD };
