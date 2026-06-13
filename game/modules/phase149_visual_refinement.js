import * as THREE from "three";

function canvasTexture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}

function glowTexture(core, edge){
  return canvasTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2, h/2, 4, w/2, h/2, w/2);
    g.addColorStop(0, core);
    g.addColorStop(0.34, "rgba(255,255,255,.50)");
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function buildingWindowTexture(seed = 0){
  return canvasTexture(512, 1024, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#111928");
    g.addColorStop(.55, "#070d18");
    g.addColorStop(1, "#14101f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(160,210,255,.16)";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    const cols = 6 + (seed % 4);
    const rows = 16 + (seed % 8);
    const padX = 38;
    const padY = 54;
    const cellW = (w - padX * 2) / cols;
    const cellH = (h - padY * 2) / rows;
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const lit = ((r * 7 + c * 11 + seed) % 5) !== 0;
        ctx.fillStyle = lit ? "rgba(120,215,255,.46)" : "rgba(38,58,82,.26)";
        ctx.fillRect(padX + c * cellW + cellW * .16, padY + r * cellH + cellH * .22, cellW * .52, cellH * .38);
      }
    }
    ctx.fillStyle = "rgba(181,108,255,.18)";
    ctx.fillRect(0, h * .62, w, h * .10);
  });
}

function refineSilverPoles(scene){
  const silver = new THREE.MeshStandardMaterial({
    color: 0xcfd6df,
    roughness: 0.20,
    metalness: 0.92,
    emissive: 0x111820,
    emissiveIntensity: 0.12
  });
  scene.traverse((obj)=>{
    const name = String(obj.name || "").toLowerCase();
    if (!name.includes("stanchion")) return;
    obj.name = "PHASE149 THIN SILVER STANCHION";
    obj.traverse((child)=>{
      if (!child.isMesh) return;
      child.material = silver;
      const y = child.position?.y || 0;
      if (y < 0.18) child.scale.set(0.56, 0.92, 0.56);
      else if (y < 1.0) child.scale.set(0.42, 1.06, 0.42);
      else child.scale.set(0.48, 0.48, 0.48);
      child.castShadow = false;
      child.receiveShadow = false;
    });
  });
}

function removeVisualOverlays(scene){
  scene.traverse((obj)=>{
    const name = String(obj.name || "").toLowerCase();
    if (name.includes("hologram pod glass beam") || name.includes("glass beam overlay") || name.includes("debug overlay")){
      obj.visible = false;
    }
  });
}

function refinePlanets(scene, log = ()=>{}){
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state || state.userData?._phase149Refined || state._phase149Refined) return;
  const { group, earth, moon, mars } = state;
  if (!group || !moon || !mars) return;
  group.name = "PHASE149 VISIBLE NORTH SKY MOON MARS LOCK";
  group.renderOrder = 10;
  [earth, moon, mars].forEach((obj)=>{
    if (!obj) return;
    obj.frustumCulled = false;
    obj.renderOrder = 10;
    if (obj.material){
      obj.material.depthWrite = true;
      obj.material.needsUpdate = true;
    }
  });
  if (earth) earth.scale.setScalar(0.82);
  moon.scale.setScalar(1.58);
  mars.scale.setScalar(1.38);

  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,255,245,.92)", "rgba(185,205,255,0)"), transparent:true, opacity:.28, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,150,92,.92)", "rgba(255,70,40,0)"), transparent:true, opacity:.30, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(118,205,255,.88)", "rgba(28,80,255,0)"), transparent:true, opacity:.18, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  moonHalo.scale.set(82, 82, 1);
  marsHalo.scale.set(92, 92, 1);
  earthHalo.scale.set(105, 105, 1);
  group.add(moonHalo, marsHalo, earthHalo);
  const northGlow = new THREE.PointLight(0xdff1ff, 2.4, 520, 1.25);
  group.add(northGlow);

  const previousUpdate = state.update?.bind(state);
  state.update = (dt = 0.016)=>{
    previousUpdate?.(dt);
    const t = performance.now() * 0.001;
    if (earth){
      earth.position.set(-38 + Math.sin(t * .055) * 4, 104 + Math.sin(t * .032) * 2, -86);
      earth.rotation.y += dt * .018;
      earthHalo.position.copy(earth.position);
    }
    moon.position.set(12 + Math.cos(t * .075) * 6, 118 + Math.sin(t * .055) * 2.5, -76);
    mars.position.set(64 + Math.sin(t * .052) * 7, 128 + Math.sin(t * .041) * 3, -92);
    moon.rotation.y += dt * .030;
    mars.rotation.y += dt * .026;
    moon.frustumCulled = false;
    mars.frustumCulled = false;
    if (earth) earth.frustumCulled = false;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    northGlow.position.set(20, 125, -84);
  };
  state._phase149Refined = true;
  log("Phase 149 visible north-sky moon and Mars lock active");
}

function refineBuildings(scene){
  const silver = new THREE.MeshStandardMaterial({ color:0xaab6c4, roughness:.24, metalness:.82, emissive:0x101a28, emissiveIntensity:.12 });
  const p = new THREE.Vector3();
  let index = 0;
  scene.traverse((obj)=>{
    if (!obj?.isGroup || !String(obj.name || "").includes("PHASE143 PERMANENT BACKDROP BUILDING")) return;
    if (obj.userData._phase149BuildingRefined) return;
    obj.getWorldPosition(p);
    const dist = Math.hypot(p.x, p.z) || 1;
    const targetRadius = 66 + (index % 5) * 1.8;
    obj.position.x = (p.x / dist) * targetRadius;
    obj.position.z = (p.z / dist) * targetRadius;
    obj.lookAt(0, 0, 0);
    const tower = obj.children.find(ch=>ch.isMesh && ch.geometry?.type === "BoxGeometry");
    if (tower){
      const gp = tower.geometry.parameters || {};
      const width = gp.width || 5;
      const height = gp.height || 24;
      const depth = gp.depth || 2;
      tower.material = new THREE.MeshStandardMaterial({
        map: buildingWindowTexture(index),
        color: 0xffffff,
        roughness: .52,
        metalness: .22,
        emissive: 0x050914,
        emissiveIntensity: .18
      });
      tower.scale.y = 1.12 + (index % 4) * .035;
      tower.position.y = (height * tower.scale.y) / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width * .92, .35, depth * 1.08), silver);
      cap.name = "PHASE149 SILVER ROOFTOP CAP";
      cap.position.set(0, height * tower.scale.y + .18, 0);
      obj.add(cap);
      if (index % 3 === 0){
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 3.2, 12), silver);
        antenna.name = "PHASE149 SKYLINE ANTENNA";
        antenna.position.set(0, height * tower.scale.y + 1.9, 0);
        obj.add(antenna);
      }
    }
    obj.userData._phase149BuildingRefined = true;
    index++;
  });
}

export function applyPhase149VisualRefinement(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase149VisualRefinement) return result;
  refineSilverPoles(scene);
  removeVisualOverlays(scene);
  refinePlanets(scene, args.log || (()=>{}));
  refineBuildings(scene);
  scene.userData._phase149VisualRefinement = true;
  window.SVR_PHASE149_REFINED = true;
  args.setStatus?.("Phase 149 refined: thin silver poles, no glass overlay, visible planets, improved skyline", { force:true });
  return result;
}
