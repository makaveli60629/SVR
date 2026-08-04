import * as THREE from "three";

function seeded(seed){
  let s = seed >>> 0;
  return ()=>{
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function moonTexture(){
  return canvasTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#b7bcc8");
    g.addColorStop(.45, "#e3e5ec");
    g.addColorStop(1, "#7f8591");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 190; i++){
      const x = (i * 131 + 53) % w;
      const y = (i * 89 + 31) % h;
      const r = 10 + (i % 16) * 4;
      ctx.fillStyle = `rgba(30,33,43,${0.10 + (i % 8) * .022})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.25, r, i * .19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.10)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.10)";
    for (let i = 0; i < 40; i++){
      ctx.beginPath();
      ctx.ellipse((i * 197) % w, (i * 113) % h, 90 + (i % 5) * 21, 10 + (i % 4) * 4, i * .23, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function marsTexture(){
  return canvasTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#4a140b");
    g.addColorStop(.34, "#9d3d1e");
    g.addColorStop(.70, "#d68148");
    g.addColorStop(1, "#2d0b06");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 130; i++){
      ctx.fillStyle = `rgba(54,13,6,${0.14 + (i % 7) * .030})`;
      ctx.beginPath();
      ctx.ellipse((i * 149 + 41) % w, (i * 97 + 25) % h, 52 + (i % 8) * 20, 10 + (i % 5) * 7, i * .31, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,196,118,.16)";
    ctx.lineWidth = 8;
    for (let y = 54; y < h; y += 62){
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * .24, y + 28, w * .64, y - 32, w, y + 14);
      ctx.stroke();
    }
  });
}

function earthTexture(){
  return canvasTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0a316f");
    g.addColorStop(.48, "#1684d8");
    g.addColorStop(1, "#06143f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const land = [[200,230,190,86,-.25],[455,394,150,85,.44],[805,290,250,112,-.36],[1080,505,190,94,.22],[1340,252,160,72,.08],[620,590,126,50,-.12]];
    land.forEach((p, i)=>{
      ctx.fillStyle = i % 2 ? "#2e9652" : "#72c56d";
      ctx.beginPath();
      ctx.ellipse(...p, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,.30)";
    for (let i = 0; i < 48; i++){
      ctx.beginPath();
      ctx.ellipse((i * 151 + 80) % w, 60 + (i * 73) % 640, 115 + (i % 5) * 24, 12 + (i % 4) * 7, i * .27, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function glowTexture(core, edge){
  return canvasTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2, h/2, 4, w/2, h/2, w/2);
    g.addColorStop(0, core);
    g.addColorStop(.34, "rgba(255,255,255,.30)");
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function applyPlanetMaterial(mesh, tex, emissive, intensity, roughness){
  if (!mesh) return;
  mesh.material = new THREE.MeshStandardMaterial({ map: tex, roughness, metalness: 0, emissive, emissiveIntensity: intensity });
  mesh.material.needsUpdate = true;
  mesh.visible = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 28;
}

function makeHalo(color, opacity, size){
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color, "rgba(0,0,0,0)"), transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(size, size, 1);
  halo.renderOrder = 27;
  return halo;
}

function hideOldStarPatterns(scene){
  scene.traverse((obj)=>{
    const name = String(obj?.name || "").toLowerCase();
    if (obj?.isPoints && !name.includes("phase160")) obj.visible = false;
    if ((obj?.isLine || obj?.type === "Line" || obj?.type === "LineLoop") && name.includes("star")) obj.visible = false;
  });
}

function makeStarLayer(name, count, radiusMin, radiusMax, yMin, yMax, size, opacity, seed){
  const rand = seeded(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++){
    const cluster = Math.floor(rand() * 18);
    const clusterAngle = (cluster / 18) * Math.PI * 2 + (rand() - .5) * .42;
    const scatter = (rand() - .5) * (rand() < .82 ? .55 : 1.5);
    const angle = clusterAngle + scatter;
    const radius = radiusMin + Math.pow(rand(), .72) * (radiusMax - radiusMin);
    const heightBand = rand() < .60 ? Math.pow(rand(), 1.7) : rand();
    const y = yMin + heightBand * (yMax - yMin);
    positions[i*3] = Math.cos(angle) * radius + (rand() - .5) * 32;
    positions[i*3 + 1] = y;
    positions[i*3 + 2] = Math.sin(angle) * radius + (rand() - .5) * 32;
    color.setHSL(.56 + rand() * .20, .18 + rand() * .34, .66 + rand() * .30);
    colors[i*3] = color.r;
    colors[i*3 + 1] = color.g;
    colors[i*3 + 2] = color.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }));
  points.name = name;
  points.frustumCulled = false;
  return points;
}

function addPhase160Stars(scene){
  if (scene.userData._phase160Starfield) return scene.userData._phase160Starfield;
  hideOldStarPatterns(scene);
  const far = makeStarLayer("PHASE160 ASYMMETRIC FAR STARFIELD", 1450, 165, 420, 58, 260, .72, .74, 1601);
  const mid = makeStarLayer("PHASE160 CLUSTERED MID STARFIELD", 950, 110, 290, 46, 205, .48, .86, 1602);
  const pin = makeStarLayer("PHASE160 RANDOM PIN STARFIELD", 720, 90, 230, 52, 185, .26, .92, 1603);
  scene.add(far, mid, pin);
  scene.userData._phase160Starfield = { far, mid, pin, update(dt = .016){ far.rotation.y += dt * .0009; mid.rotation.y -= dt * .0012; pin.rotation.y += dt * .0018; } };
  return scene.userData._phase160Starfield;
}

function refineOrbitalPlanets(scene, log = ()=>{}){
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state?.group || !state?.moon || !state?.mars) return null;
  if (state._phase160OrbitalLobbyPlanets) return state;
  const { group, earth, moon, mars } = state;
  group.name = "PHASE160 LOBBY ORBIT SKY PLANETS";
  group.visible = true;
  group.renderOrder = 26;
  [...group.children].forEach((child)=>{ if (child.isSprite || child.isPointLight) group.remove(child); });
  applyPlanetMaterial(earth, earthTexture(), 0x061735, .12, .64);
  applyPlanetMaterial(moon, moonTexture(), 0x111118, .045, .91);
  applyPlanetMaterial(mars, marsTexture(), 0x2c0804, .075, .78);

  if (earth) earth.scale.setScalar(.155);
  moon.scale.setScalar(.48);
  mars.scale.setScalar(.39);

  const earthHalo = makeHalo("rgba(90,170,255,.80)", .16, 38);
  const moonHalo = makeHalo("rgba(250,250,255,.86)", .22, 34);
  const marsHalo = makeHalo("rgba(255,125,72,.78)", .17, 34);
  const skyLight = new THREE.PointLight(0xd9ecff, 1.42, 650, 1.55);
  group.add(earthHalo, moonHalo, marsHalo, skyLight);

  const previousUpdate = state.update?.bind(state);
  state.update = (dt = .016)=>{
    previousUpdate?.(dt);
    const t = performance.now() * .001;
    const moonAngle = -Math.PI * .42 + t * .010;
    const marsAngle = Math.PI * .98 + t * .0075;
    const earthAngle = Math.PI * .52 + t * .0055;
    if (earth){
      earth.position.set(Math.cos(earthAngle) * 262, 136 + Math.sin(t * .19) * 3.8, Math.sin(earthAngle) * 262);
      earth.rotation.y += dt * .022;
      earth.rotation.z = .21;
      earth.visible = true;
      earth.frustumCulled = false;
      earthHalo.position.copy(earth.position);
    }
    moon.position.set(Math.cos(moonAngle) * 184, 118 + Math.sin(t * .24) * 3.0, Math.sin(moonAngle) * 184);
    mars.position.set(Math.cos(marsAngle) * 214, 126 + Math.sin(t * .21) * 3.4, Math.sin(marsAngle) * 214);
    moon.rotation.y += dt * .030;
    moon.rotation.x += dt * .004;
    mars.rotation.y += dt * .026;
    mars.rotation.x += dt * .003;
    moon.visible = true;
    mars.visible = true;
    moon.frustumCulled = false;
    mars.frustumCulled = false;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    skyLight.position.set(0, 150, -80);
    moonHalo.scale.setScalar(32 + Math.sin(t * 1.1) * 2.2);
    marsHalo.scale.setScalar(31 + Math.sin(t * 0.9 + 1.4) * 1.8);
    earthHalo.scale.setScalar(38 + Math.sin(t * 0.7 + .6) * 2.5);
  };
  state._phase160OrbitalLobbyPlanets = true;
  window.SVR_PHASE160_ORBITAL_PLANETS = true;
  log("Phase 160 lobby orbital planets active");
  return state;
}

export function applyPhase160OrbitalPlanetStarfield(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase160PlanetStarfieldLock) return result;
  const stars = addPhase160Stars(scene);
  refineOrbitalPlanets(scene, args.log || (()=>{}));
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt = .016)=>{
    oldTick?.(dt);
    stars?.update?.(dt);
  };
  scene.userData._phase160PlanetStarfieldLock = true;
  window.SVR_PHASE160_STARFIELD = true;
  args.setStatus?.("Phase 160: bigger separated orbit planets and non-pattern starfield active", { force: true });
  return result;
}
