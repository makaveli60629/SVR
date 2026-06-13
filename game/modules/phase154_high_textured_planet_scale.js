import * as THREE from "three";

const REIKI_ROOM_URL = "./reiki.html?v=phase154-high-small-textured-planets-pod-button";

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

function rounded(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

function logoButtonTexture(label){
  return makeTexture(900, 360, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * .5, h * .5, 10, w * .5, h * .5, w * .55);
    glow.addColorStop(0, "rgba(91,255,244,.95)");
    glow.addColorStop(.38, "rgba(181,88,255,.52)");
    glow.addColorStop(.72, "rgba(255,210,110,.24)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(80, 52, w - 80, h - 52);
    bg.addColorStop(0, "rgba(4,14,28,.90)");
    bg.addColorStop(.52, "rgba(30,8,58,.92)");
    bg.addColorStop(1, "rgba(2,18,24,.90)");
    ctx.fillStyle = bg;
    rounded(ctx, 86, 58, w - 172, h - 116, 72);
    ctx.fill();
    const stroke = ctx.createLinearGradient(92, 70, w - 92, h - 70);
    stroke.addColorStop(0, "#58fff4");
    stroke.addColorStop(.45, "#b558ff");
    stroke.addColorStop(1, "#ffd56e");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 18;
    rounded(ctx, 86, 58, w - 172, h - 116, 72);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#58fff4";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText(label, w / 2, h / 2 - 18, w - 210);
    ctx.shadowColor = "#b558ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#dffcff";
    ctx.font = "800 30px system-ui, Arial";
    ctx.fillText("SVR HOLOGRAM CONTROL", w / 2, h / 2 + 58, w - 220);
  });
}

function makeLogoButton(label){
  const button = new THREE.Group();
  button.name = `PHASE154 LOGO COLOR HOLOGRAM ${label} BUTTON OUTSIDE VIDEO`;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.95, .82), new THREE.MeshBasicMaterial({ map: logoButtonTexture(label), transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.name = `${button.name} GLOW HALO`;
  halo.position.z = -.016;
  const core = new THREE.Mesh(new THREE.PlaneGeometry(1.42, .52), new THREE.MeshBasicMaterial({ map: logoButtonTexture(label), transparent: true, opacity: .97, side: THREE.DoubleSide, depthWrite: false }));
  core.name = `${button.name} HIT CORE`;
  core.userData.phase154Button = true;
  core.userData.href = REIKI_ROOM_URL;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.52, .018, 12, 92), new THREE.MeshBasicMaterial({ color: 0x58fff4, transparent: true, opacity: .82, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.name = `${button.name} CYAN PURPLE RING`;
  ring.scale.set(1.40, .42, 1);
  ring.position.z = .018;
  button.add(halo, core, ring);
  button.userData.core = core;
  button.userData.halo = halo;
  button.userData.ring = ring;
  return button;
}

function findReikiGroup(scene, result){
  return result?.group || scene.userData?._phase136Reiki?.group || scene.userData?._phase135ReikiWallAligned?.group || null;
}

function refineSlideButtons(group){
  if (!group || group.userData._phase154SlideButtonsMoved) return [];
  const moved = [];
  group.traverse((obj)=>{
    if (!obj?.isMesh || !obj.geometry?.parameters) return;
    const gp = obj.geometry.parameters;
    const isSmallButton = Math.abs((gp.width || 0) - .92) < .08 && Math.abs((gp.height || 0) - .40) < .08 && obj.position.y < 1.12;
    if (!isSmallButton) return;
    const label = obj.position.x < 0 ? "BACK" : "NEXT";
    obj.name = `PHASE154 LOGO COLOR ${label} SLIDE BUTTON OUTSIDE VIDEO`;
    obj.material = new THREE.MeshBasicMaterial({ map: logoButtonTexture(label), transparent: true, opacity: .98, side: THREE.DoubleSide, depthWrite: false });
    obj.position.x = obj.position.x < 0 ? -2.45 : 2.45;
    obj.position.y = .46;
    obj.position.z = obj.position.z >= 0 ? 1.32 : -1.22;
    obj.scale.set(1.22, 1.05, 1);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .60), new THREE.MeshBasicMaterial({ map: logoButtonTexture(label), transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.name = `${obj.name} GLOW ONLY`;
    glow.position.copy(obj.position);
    glow.position.z += obj.position.z >= 0 ? -.02 : .02;
    glow.rotation.copy(obj.rotation);
    obj.parent?.add(glow);
    moved.push(obj, glow);
  });
  group.userData._phase154SlideButtonsMoved = true;
  return moved;
}

function refineHologramPod(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase154HologramPodButton) return;
  const group = findReikiGroup(scene, result);
  if (!group) return;
  let pod = null;
  group.traverse((obj)=>{
    if (!pod && String(obj.name || "").includes("PHASE140 REIKI INTERACTIVE HOLOGRAM POD")) pod = obj;
  });
  const slideGlowObjects = refineSlideButtons(group);
  const interactive = [];
  if (pod){
    pod.traverse((obj)=>{
      if (!obj?.isMesh) return;
      if (obj.userData?.href || String(obj.name || "").includes("ENTER")) obj.visible = false;
    });
    const enter = makeLogoButton("ENTER");
    enter.position.set(0, .28, 1.34);
    enter.rotation.x = -Math.PI * .08;
    pod.add(enter);
    interactive.push(enter.userData.core, enter.userData.ring);
  }
  if (interactive.length && args.renderer?.domElement && args.camera){
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    args.renderer.domElement.addEventListener("pointerdown", (ev)=>{
      const rect = args.renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, args.camera);
      const hit = raycaster.intersectObjects(interactive, true)[0];
      if (hit) window.location.href = REIKI_ROOM_URL;
    }, { passive: true });
  }
  const previousTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    previousTick?.(dt);
    const pulse = .72 + Math.sin(performance.now() * .004) * .18;
    if (pod){
      pod.traverse((obj)=>{
        if (!String(obj.name || "").includes("PHASE154 LOGO COLOR")) return;
        if (obj.material?.opacity !== undefined) obj.material.opacity = Math.max(.18, Math.min(.98, obj.name.includes("GLOW") ? pulse * .32 : pulse));
        if (obj.name.includes("RING")) obj.rotation.z += dt * 1.35;
      });
    }
    slideGlowObjects.forEach((obj)=>{
      if (obj?.material?.opacity !== undefined && obj.name.includes("GLOW")) obj.material.opacity = pulse * .26;
    });
  };
  scene.userData._phase154HologramPodButton = true;
  window.SVR_PHASE154_POD_BUTTON = true;
  args.log?.("Phase 154 logo-color hologram pod button active and moved outside video");
}

function refinePlanets(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase154HighTexturedPlanets) return;
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state?.group || !state?.moon || !state?.mars) return;

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
      earth.position.set(-46 + Math.sin(t * 0.018) * 5, 126 + Math.sin(t * 0.020) * 2.0, -198);
      earth.rotation.y += dt * 0.014;
      earth.visible = true;
      earth.frustumCulled = false;
      earthHalo.position.copy(earth.position);
    }
    moon.position.set(0 + Math.cos(t * 0.028) * 6, 118 + Math.sin(t * 0.024) * 1.6, -168);
    mars.position.set(46 + Math.sin(t * 0.023) * 7, 126 + Math.sin(t * 0.021) * 1.8, -190);
    moon.rotation.y += dt * 0.020;
    mars.rotation.y += dt * 0.018;
    moon.visible = true;
    mars.visible = true;
    moon.frustumCulled = false;
    mars.frustumCulled = false;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    skyLight.position.set(0, 126, -176);
  };

  state._phase154Refined = true;
  scene.userData._phase154HighTexturedPlanets = true;
  window.SVR_PHASE154_REFINED = true;
  args.log?.("Phase 154 high, small, textured planets active");
}

export function applyPhase154HighTexturedPlanetScale(args = {}, result = {}){
  const scene = args.scene;
  if (!scene) return result;
  refinePlanets(args, result);
  refineHologramPod(args, result);
  args.setStatus?.("Phase 154: planets high/small/textured; hologram pod button glows outside video", { force: true });
  return result;
}
