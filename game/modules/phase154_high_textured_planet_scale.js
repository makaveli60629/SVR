import * as THREE from "three";

function makeTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function makeMoonTexture(){
  return makeTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#bfc3cc");
    g.addColorStop(0.42, "#e1e3e8");
    g.addColorStop(1, "#8b909b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++){
      const x = (i * 113 + 47) % w;
      const y = (i * 71 + 29) % h;
      const r = 9 + (i % 14) * 4;
      ctx.fillStyle = `rgba(28,31,40,${0.10 + (i % 7) * 0.025})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.35, r, (i * 0.27) % 6.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.13)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let i = 0; i < 34; i++){
      ctx.beginPath();
      ctx.ellipse((i * 173) % w, (i * 97) % h, 84 + (i % 5) * 22, 9 + (i % 4) * 4, i * .31, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeMarsTexture(){
  return makeTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#531a10");
    g.addColorStop(0.42, "#b4512b");
    g.addColorStop(0.74, "#d7804b");
    g.addColorStop(1, "#35100c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 95; i++){
      ctx.fillStyle = `rgba(60,17,9,${0.18 + (i % 6) * 0.035})`;
      ctx.beginPath();
      ctx.ellipse((i * 127 + 60) % w, (i * 83 + 35) % h, 48 + (i % 7) * 20, 10 + (i % 5) * 7, i * .29, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(247,170,95,.20)";
    for (let i = 0; i < 16; i++){
      ctx.fillRect(0, 48 + i * 43, w, 6 + (i % 3) * 3);
    }
  });
}

function makeEarthTexture(){
  return makeTexture(1536, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#124c9d");
    g.addColorStop(0.55, "#188bd8");
    g.addColorStop(1, "#071b52");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const land = [[230,240,190,86,-.25],[460,390,145,80,.44],[780,285,255,108,-.35],[1045,505,190,90,.25],[1320,260,160,72,.10],[620,580,120,48,-.12]];
    land.forEach((p, i)=>{
      ctx.fillStyle = i % 2 ? "#2f9d58" : "#74c76e";
      ctx.beginPath();
      ctx.ellipse(...p, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,.28)";
    for (let i = 0; i < 38; i++){
      ctx.beginPath();
      ctx.ellipse((i * 137 + 80) % w, 70 + (i * 61) % 620, 110 + (i % 5) * 26, 12 + (i % 4) * 7, i * .28, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function applyTexturedMaterial(mesh, texture, emissive, intensity, roughness){
  if (!mesh) return;
  mesh.material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness,
    metalness: 0,
    emissive,
    emissiveIntensity: intensity
  });
  mesh.material.needsUpdate = true;
  mesh.visible = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 21;
}

function removeOldPlanetGlow(group){
  [...group.children].forEach((child)=>{
    if (child.isSprite || child.isPointLight) group.remove(child);
  });
}

function makeHalo(color, opacity, size){
  const tex = makeTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2, h/2, 2, w/2, h/2, w/2);
    g.addColorStop(0, color);
    g.addColorStop(.38, "rgba(255,255,255,.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(size, size, 1);
  halo.renderOrder = 20;
  return halo;
}

export function applyPhase154HighTexturedPlanetScale(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase154HighTexturedPlanets) return result;
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state?.group || !state?.moon || !state?.mars) return result;

  const { group, earth, moon, mars } = state;
  group.name = "PHASE154 HIGH SMALL TEXTURED PLANETS NORTH SKY";
  group.visible = true;
  group.renderOrder = 20;
  removeOldPlanetGlow(group);

  applyTexturedMaterial(earth, makeEarthTexture(), 0x071a32, 0.10, 0.64);
  applyTexturedMaterial(moon, makeMoonTexture(), 0x111118, 0.035, 0.94);
  applyTexturedMaterial(mars, makeMarsTexture(), 0x2c0804, 0.055, 0.82);

  if (earth) earth.scale.setScalar(0.075);
  moon.scale.setScalar(0.24);
  mars.scale.setScalar(0.22);

  const earthHalo = makeHalo("rgba(90,170,255,.70)", 0.09, 18);
  const moonHalo = makeHalo("rgba(240,244,255,.78)", 0.13, 16);
  const marsHalo = makeHalo("rgba(255,120,70,.72)", 0.12, 17);
  const skyLight = new THREE.PointLight(0xd9ecff, 1.15, 540, 1.45);
  group.add(earthHalo, moonHalo, marsHalo, skyLight);

  const previousUpdate = state.update?.bind(state);
  state.update = (dt = 0.016)=>{
    previousUpdate?.(dt);
    const t = performance.now() * 0.001;
    if (earth){
      earth.position.set(-42 + Math.sin(t * 0.018) * 5, 108 + Math.sin(t * 0.020) * 2.0, -178);
      earth.rotation.y += dt * 0.014;
      earth.visible = true;
      earth.frustumCulled = false;
      earthHalo.position.copy(earth.position);
    }
    moon.position.set(4 + Math.cos(t * 0.028) * 6, 96 + Math.sin(t * 0.024) * 1.6, -146);
    mars.position.set(42 + Math.sin(t * 0.023) * 7, 104 + Math.sin(t * 0.021) * 1.8, -168);
    moon.rotation.y += dt * 0.020;
    mars.rotation.y += dt * 0.018;
    moon.visible = true;
    mars.visible = true;
    moon.frustumCulled = false;
    mars.frustumCulled = false;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    skyLight.position.set(0, 110, -155);
  };

  state._phase154Refined = true;
  scene.userData._phase154HighTexturedPlanets = true;
  window.SVR_PHASE154_REFINED = true;
  args.log?.("Phase 154 high, small, textured planets active");
  args.setStatus?.("Phase 154: planets raised, scaled down, and re-textured", { force: true });
  return result;
}
