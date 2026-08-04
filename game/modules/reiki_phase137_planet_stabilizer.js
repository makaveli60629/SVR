import * as THREE from "three";
import { applyReikiPhase136FlipOrbit } from "./reiki_phase136_flip_orbit.js";

function makeCanvasTexture(w, h, draw){
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeGlowTexture(core, edge){
  return makeCanvasTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, core);
    g.addColorStop(0.25, "rgba(255,255,255,.55)");
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeEarthTexture(){
  return makeCanvasTexture(1024, 512, (ctx, w, h)=>{
    ctx.fillStyle = "#0d2c68";
    ctx.fillRect(0, 0, w, h);
    const continents = [
      [180, 190, 135, 58, -0.25], [340, 285, 120, 70, 0.50], [620, 210, 165, 76, -0.45],
      [750, 330, 115, 62, 0.25], [900, 175, 110, 45, 0.12], [95, 330, 92, 46, 0.35]
    ];
    continents.forEach(([x,y,rx,ry,rot], i)=>{
      ctx.fillStyle = i % 2 ? "rgba(52,155,91,.82)" : "rgba(68,178,105,.78)";
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,.20)";
    for (let i = 0; i < 15; i++){
      ctx.beginPath();
      ctx.ellipse((i * 83 + 60) % w, 80 + (i * 39) % 330, 90 + (i % 4) * 22, 12 + (i % 3) * 8, i * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeMoonTexture(){
  return makeCanvasTexture(512, 256, (ctx, w, h)=>{
    ctx.fillStyle = "#cfd2d8";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 38; i++){
      ctx.fillStyle = `rgba(60,62,70,${0.10 + (i % 5) * 0.035})`;
      ctx.beginPath();
      ctx.arc((i * 71) % w, (i * 43) % h, 6 + (i % 7) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeMarsTexture(){
  return makeCanvasTexture(512, 256, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#7b2c1d");
    g.addColorStop(0.55, "#c86a3d");
    g.addColorStop(1, "#e18a52");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(80,22,10,.35)";
    for (let i = 0; i < 26; i++){
      ctx.beginPath();
      ctx.ellipse((i * 61) % w, (i * 37) % h, 20 + (i % 6) * 12, 6 + (i % 4) * 6, i * 0.41, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function hideBrokenPlanetSystems(scene, keeper){
  const p = new THREE.Vector3();
  scene.traverse((obj)=>{
    if (!obj || obj === keeper || keeper.children.includes(obj)) return;
    obj.getWorldPosition?.(p);
    if (p.y < 50) return;
    const sphereRadius = obj.isMesh ? (obj.geometry?.parameters?.radius || 0) : 0;
    const largeSprite = obj.isSprite && Math.max(obj.scale.x || 0, obj.scale.y || 0) > 24;
    const oldLight = obj.isPointLight && p.length() > 80;
    if ((obj.isMesh && sphereRadius >= 3.5) || largeSprite || oldLight){
      obj.visible = false;
    }
  });
}

function addOrbitRing(parent, radius, color, opacity){
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.72, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(160).map((p)=>new THREE.Vector3(p.x, 0, p.y));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const line = new THREE.LineLoop(geo, mat);
  line.position.y = 78;
  parent.add(line);
  return line;
}

function addStablePlanetSystem(scene, log = ()=>{}){
  if (scene.userData._phase137StablePlanets) return scene.userData._phase137StablePlanets;

  const group = new THREE.Group();
  group.name = "PHASE137 STABLE EARTH MOON MARS ORBIT";
  scene.add(group);

  const earth = new THREE.Mesh(new THREE.SphereGeometry(10.5, 48, 32), new THREE.MeshStandardMaterial({ map: makeEarthTexture(), roughness: .78, metalness: .02, emissive: 0x061428, emissiveIntensity: .08 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.1, 32, 20), new THREE.MeshStandardMaterial({ map: makeMoonTexture(), roughness: .92, metalness: .01, emissive: 0x101018, emissiveIntensity: .04 }));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(4.0, 32, 20), new THREE.MeshStandardMaterial({ map: makeMarsTexture(), roughness: .82, metalness: .02, emissive: 0x240804, emissiveIntensity: .05 }));

  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture("rgba(110,190,255,.95)", "rgba(50,130,255,0)"), transparent: true, opacity: .20, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture("rgba(255,255,255,.90)", "rgba(180,200,255,0)"), transparent: true, opacity: .15, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture("rgba(255,145,90,.90)", "rgba(255,75,40,0)"), transparent: true, opacity: .15, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  earthHalo.scale.set(44, 44, 1); moonHalo.scale.set(17, 17, 1); marsHalo.scale.set(20, 20, 1);

  const light = new THREE.PointLight(0xaed8ff, 1.2, 240, 1.9);
  addOrbitRing(group, 92, 0x5edcff, .16);
  group.add(earth, moon, mars, earthHalo, moonHalo, marsHalo, light);

  const state = {
    group, earth, moon, mars,
    update(dt = 0){
      const t = performance.now() * 0.001;
      hideBrokenPlanetSystems(scene, group);
      const earthOrbit = t * 0.060;
      const earthRadius = 92;
      const baseY = 80 + Math.sin(t * 0.10) * 5;
      earth.position.set(Math.cos(earthOrbit) * earthRadius, baseY, Math.sin(earthOrbit) * earthRadius * 0.72);
      earth.rotation.y += dt * 0.18;
      earth.rotation.z = 0.23;

      const moonOrbit = t * 0.70;
      moon.position.set(
        earth.position.x + Math.cos(moonOrbit) * 21,
        earth.position.y + 5 + Math.sin(moonOrbit * 0.90) * 4,
        earth.position.z + Math.sin(moonOrbit) * 17
      );
      moon.rotation.y += dt * 0.22;

      const marsOrbit = t * 0.38;
      mars.position.set(
        earth.position.x + Math.cos(marsOrbit) * 36,
        earth.position.y + 11 + Math.sin(marsOrbit * 0.80) * 6,
        earth.position.z + Math.sin(marsOrbit) * 28
      );
      mars.rotation.y += dt * 0.17;

      earthHalo.position.copy(earth.position);
      moonHalo.position.copy(moon.position);
      marsHalo.position.copy(mars.position);
      light.position.copy(earth.position);
    }
  };
  scene.userData._phase137StablePlanets = state;
  log?.("Phase 137 stable planet system active: one Earth orbit, Moon/Mars follow Earth");
  return state;
}

export function applyPhase137PlanetStabilizer(args = {}){
  const result = applyReikiPhase136FlipOrbit(args);
  const scene = args.scene;
  if (!scene) return result;

  if (result?.solar?.group) result.solar.group.visible = false;
  const stable = addStablePlanetSystem(scene, args.log || (()=>{}));
  const prevTick = scene.userData._tickWorld;
  if (!scene.userData._phase137PlanetTickWrapped){
    scene.userData._tickWorld = (dt)=>{
      prevTick?.(dt);
      stable.update(dt);
    };
    scene.userData._phase137PlanetTickWrapped = true;
  }
  args.setStatus?.("Phase 137 planets stabilized", { force: true });
  return { ...result, stablePlanets: stable };
}
