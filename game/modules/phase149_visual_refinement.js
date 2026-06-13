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
    g.addColorStop(0.34, "rgba(255,255,255,.54)");
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function buildingWindowTexture(seed = 0){
  return canvasTexture(512, 1024, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#121c2c");
    g.addColorStop(.55, "#060b15");
    g.addColorStop(1, "#161223");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(190,225,255,.18)";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    const cols = 7 + (seed % 4);
    const rows = 18 + (seed % 8);
    const padX = 36;
    const padY = 50;
    const cellW = (w - padX * 2) / cols;
    const cellH = (h - padY * 2) / rows;
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const lit = ((r * 7 + c * 11 + seed) % 5) !== 0;
        ctx.fillStyle = lit ? "rgba(118,218,255,.54)" : "rgba(34,52,74,.28)";
        ctx.fillRect(padX + c * cellW + cellW * .18, padY + r * cellH + cellH * .20, cellW * .50, cellH * .42);
      }
    }
    ctx.fillStyle = "rgba(181,108,255,.16)";
    ctx.fillRect(0, h * .64, w, h * .10);
  });
}

function refineSilverPoles(scene){
  const silver = new THREE.MeshStandardMaterial({
    color: 0xd9e1ea,
    roughness: 0.16,
    metalness: 0.96,
    emissive: 0x151d26,
    emissiveIntensity: 0.16
  });
  scene.traverse((obj)=>{
    const name = String(obj.name || "").toLowerCase();
    if (!name.includes("stanchion")) return;
    obj.name = "PHASE153 EXTRA THIN SILVER STANCHION";
    obj.traverse((child)=>{
      if (!child.isMesh) return;
      child.material = silver;
      const y = child.position?.y || 0;
      if (y < 0.18) child.scale.set(0.42, 0.74, 0.42);
      else if (y < 1.0) child.scale.set(0.30, 1.08, 0.30);
      else child.scale.set(0.34, 0.34, 0.34);
      child.castShadow = false;
      child.receiveShadow = false;
    });
  });
}

function removeVisualOverlays(scene){
  scene.traverse((obj)=>{
    const name = String(obj.name || "").toLowerCase();
    const remove = name.includes("hologram pod glass beam") ||
      name.includes("glass beam overlay") ||
      name.includes("debug overlay") ||
      name.includes("floating overlay") ||
      name.includes("screen overlay");
    if (remove) obj.visible = false;
  });
}

function refinePlanets(scene, log = ()=>{}){
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state || state._phase153Refined) return;
  const { group, earth, moon, mars } = state;
  if (!group || !moon || !mars) return;
  group.name = "PHASE153 NATURAL SCALE NORTH SKY MOON MARS LOCK";
  group.renderOrder = 20;
  group.visible = true;
  [earth, moon, mars].forEach((obj)=>{
    if (!obj) return;
    obj.visible = true;
    obj.frustumCulled = false;
    obj.renderOrder = 20;
    if (obj.material){
      obj.material.depthWrite = true;
      obj.material.needsUpdate = true;
    }
  });
  if (earth) earth.scale.setScalar(0.36);
  moon.scale.setScalar(0.72);
  mars.scale.setScalar(0.62);

  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,255,245,.92)", "rgba(185,205,255,0)"), transparent:true, opacity:.28, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,150,92,.92)", "rgba(255,70,40,0)"), transparent:true, opacity:.26, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(118,205,255,.80)", "rgba(28,80,255,0)"), transparent:true, opacity:.12, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  moonHalo.scale.set(38, 38, 1);
  marsHalo.scale.set(42, 42, 1);
  earthHalo.scale.set(42, 42, 1);
  group.add(moonHalo, marsHalo, earthHalo);
  const northGlow = new THREE.PointLight(0xdff1ff, 1.8, 460, 1.35);
  group.add(northGlow);

  const previousUpdate = state.update?.bind(state);
  state.update = (dt = 0.016)=>{
    previousUpdate?.(dt);
    const t = performance.now() * 0.001;
    if (earth){
      earth.position.set(-30 + Math.sin(t * .035) * 3, 55 + Math.sin(t * .030) * 1.8, -84);
      earth.rotation.y += dt * .014;
      earthHalo.position.copy(earth.position);
      earth.visible = true;
    }
    moon.position.set(10 + Math.cos(t * .050) * 3.2, 50 + Math.sin(t * .044) * 1.2, -78);
    mars.position.set(42 + Math.sin(t * .043) * 4, 57 + Math.sin(t * .038) * 1.5, -90);
    moon.rotation.y += dt * .026;
    mars.rotation.y += dt * .024;
    moon.visible = true;
    mars.visible = true;
    moon.frustumCulled = false;
    mars.frustumCulled = false;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    northGlow.position.set(18, 54, -82);
  };
  state._phase149Refined = true;
  state._phase150Refined = true;
  state._phase153Refined = true;
  log("Phase 153 natural-scale north-sky moon and Mars lock active");
}

function refineBuildings(scene){
  const silver = new THREE.MeshStandardMaterial({ color:0xb8c5d4, roughness:.20, metalness:.88, emissive:0x101a28, emissiveIntensity:.14 });
  const p = new THREE.Vector3();
  let index = 0;
  scene.traverse((obj)=>{
    if (!obj?.isGroup || !String(obj.name || "").includes("PHASE143 PERMANENT BACKDROP BUILDING")) return;
    if (obj.userData._phase153BuildingRefined) return;
    obj.getWorldPosition(p);
    const dist = Math.hypot(p.x, p.z) || 1;
    const targetRadius = 70 + (index % 6) * 1.5;
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
        roughness: .48,
        metalness: .24,
        emissive: 0x070c18,
        emissiveIntensity: .20
      });
      tower.scale.x = .86 + (index % 3) * .035;
      tower.scale.z = .92;
      tower.scale.y = 1.18 + (index % 5) * .045;
      tower.position.y = (height * tower.scale.y) / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width * tower.scale.x * .96, .36, depth * 1.08), silver);
      cap.name = "PHASE153 CLEAN SILVER ROOFTOP CAP";
      cap.position.set(0, height * tower.scale.y + .18, 0);
      obj.add(cap);
      if (index % 2 === 0){
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.026, .040, 3.6, 12), silver);
        antenna.name = "PHASE153 THIN SKYLINE ANTENNA";
        antenna.position.set(0, height * tower.scale.y + 2.1, 0);
        obj.add(antenna);
      }
    }
    obj.userData._phase149BuildingRefined = true;
    obj.userData._phase150BuildingRefined = true;
    obj.userData._phase153BuildingRefined = true;
    index++;
  });
}

export function applyPhase149VisualRefinement(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase153VisualRefinement) return result;
  refineSilverPoles(scene);
  removeVisualOverlays(scene);
  refinePlanets(scene, args.log || (()=>{}));
  refineBuildings(scene);
  scene.userData._phase149VisualRefinement = true;
  scene.userData._phase150VisualRefinement = true;
  scene.userData._phase153VisualRefinement = true;
  window.SVR_PHASE149_REFINED = true;
  window.SVR_PHASE150_REFINED = true;
  window.SVR_PHASE153_REFINED = true;
  args.setStatus?.("Phase 153 refined: planets reduced to natural scale, poles/skyline preserved", { force:true });
  return result;
}
