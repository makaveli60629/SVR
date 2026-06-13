import * as THREE from "three";

function canvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function adTexture(title, subtitle, accent = "#58fff4"){
  return canvasTexture(1200, 1600, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#02070d");
    bg.addColorStop(.48, "#0b0f23");
    bg.addColorStop(1, "#06020b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w/2, h*.38, 20, w/2, h*.38, w*.72);
    glow.addColorStop(0, accent);
    glow.addColorStop(.25, "rgba(181,88,255,.24)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.globalAlpha = .42;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 26;
    ctx.strokeRect(52, 52, w - 104, h - 104);
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 8;
    ctx.strokeRect(88, 88, w - 176, h - 176);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 108px system-ui, Arial";
    ctx.fillText(title, w/2, 440, w - 150);
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#dffff8";
    ctx.font = "800 62px system-ui, Arial";
    ctx.fillText(subtitle, w/2, 620, w - 160);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.fillRect(165, 840, w - 330, 190);
    ctx.fillStyle = accent;
    ctx.font = "900 58px system-ui, Arial";
    ctx.fillText("AD BANNER READY", w/2, 936, w - 220);
    ctx.fillStyle = "#bfefff";
    ctx.font = "700 42px system-ui, Arial";
    ctx.fillText("tall • wide • wall-facing", w/2, 1165, w - 180);
  });
}

function buildingTexture(seed = 0){
  return canvasTexture(512, 1024, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#101a2b");
    bg.addColorStop(.55, "#050914");
    bg.addColorStop(1, "#141020");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const cols = 7 + (seed % 5);
    const rows = 22 + (seed % 9);
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const lit = ((r * 5 + c * 9 + seed) % 6) !== 0;
        ctx.fillStyle = lit ? "rgba(96,218,255,.50)" : "rgba(20,35,55,.32)";
        ctx.fillRect(34 + c * ((w - 68) / cols) + 5, 34 + r * ((h - 68) / rows) + 5, 22, 18);
      }
    }
    ctx.strokeStyle = "rgba(181,88,255,.18)";
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  });
}

function makeBuilding(index, count, radius){
  const angle = (index / count) * Math.PI * 2;
  const group = new THREE.Group();
  group.name = `PHASE155 SURROUNDING SKYLINE AD BUILDING ${index}`;
  group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  group.lookAt(0, 0, 0);
  const width = 7.8 + (index % 4) * 1.25;
  const height = 32 + (index % 8) * 4.2;
  const depth = 2.35;
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ map: buildingTexture(index), color: 0xffffff, roughness: .52, metalness: .18, emissive: 0x050914, emissiveIntensity: .22 })
  );
  tower.name = "PHASE155 TALL WIDE AD TOWER BODY";
  tower.position.y = height / 2;
  group.add(tower);
  return group;
}

function addOrUpdateAd(group, index){
  const titles = ["SVR POKER", "REIKI HUB", "PGA HUB", "ESPRESSO", "CHARITY", "TOURNAMENT", "VIP LOUNGE", "SCARLET"];
  const subtitles = ["play the future", "wellness preview", "golf training", "with cream", "animal shelter", "weekend events", "members only", "holding company"];
  const accents = ["#58fff4", "#b558ff", "#7dffb2", "#ffd56e", "#ff7fa8", "#65b7ff", "#ff5ef1", "#ffffff"];
  group.children.forEach((child)=>{
    const name = String(child.name || "");
    if (name.includes("TABLE FACING AD") || name.includes("PHASE155 TALL WIDE AD BANNER")) child.visible = false;
  });
  let tower = group.children.find((child)=>child.isMesh && String(child.name || "").includes("TOWER BODY"));
  if (!tower) tower = group.children.find((child)=>child.isMesh && child.geometry?.type === "BoxGeometry");
  const params = tower?.geometry?.parameters || {};
  const width = Math.max(6.4, (params.width || 7.5) * (tower?.scale?.x || 1) * .88);
  const height = Math.max(7.2, Math.min((params.height || 32) * .44, 12.8));
  const depth = Math.max(2.1, (params.depth || 2.2) * (tower?.scale?.z || 1));
  const ad = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: adTexture(titles[index % titles.length], subtitles[index % subtitles.length], accents[index % accents.length]), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  ad.name = "PHASE155 TALL WIDE AD BANNER FACING LOBBY";
  ad.position.set(0, Math.max(12, (params.height || 32) * (tower?.scale?.y || 1) * .58), depth / 2 + .095);
  group.add(ad);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(width + .45, .32, depth + .30), new THREE.MeshStandardMaterial({ color: 0xcbd8e8, roughness: .22, metalness: .82, emissive: 0x101826, emissiveIntensity: .14 }));
  cap.name = "PHASE155 SILVER ROOFTOP AD TOWER CAP";
  cap.position.set(0, (params.height || 32) * (tower?.scale?.y || 1) + .22, 0);
  group.add(cap);
}

function alignSkyline(scene){
  if (!scene || scene.userData._phase155SkylineAligned) return;
  const desired = 32;
  const radius = 76;
  const buildings = [];
  scene.traverse((obj)=>{
    if (obj?.isGroup && String(obj.name || "").includes("PHASE143 PERMANENT BACKDROP BUILDING")) buildings.push(obj);
  });
  for (let i = buildings.length; i < desired; i++){
    const b = makeBuilding(i, desired, radius);
    scene.add(b);
    buildings.push(b);
  }
  buildings.slice(0, desired).forEach((group, index)=>{
    const angle = (index / desired) * Math.PI * 2;
    group.name = `PHASE155 ALIGNED SURROUND SKYLINE AD BUILDING ${index}`;
    group.visible = true;
    group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    group.lookAt(0, 0, 0);
    group.traverse((child)=>{
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
    });
    const tower = group.children.find((child)=>child.isMesh && child.geometry?.type === "BoxGeometry");
    if (tower){
      tower.name = "PHASE155 TALL WIDE AD TOWER BODY";
      tower.material = new THREE.MeshStandardMaterial({ map: buildingTexture(index), color: 0xffffff, roughness: .52, metalness: .18, emissive: 0x050914, emissiveIntensity: .22 });
      tower.scale.x = 1.32 + (index % 3) * .14;
      tower.scale.y = 1.44 + (index % 6) * .09;
      tower.scale.z = 1.10;
      const h = tower.geometry?.parameters?.height || 28;
      tower.position.y = (h * tower.scale.y) / 2;
    }
    addOrUpdateAd(group, index);
  });
  scene.userData._phase155SkylineAligned = true;
}

function moonGlowTexture(){
  return canvasTexture(512, 512, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2, h/2, 4, w/2, h/2, w/2);
    g.addColorStop(0, "rgba(255,255,255,.95)");
    g.addColorStop(.20, "rgba(230,242,255,.42)");
    g.addColorStop(.52, "rgba(140,190,255,.18)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function addMovingMoonGlow(scene, log = ()=>{}){
  const state = scene.userData._phase143HigherPlanets || scene.userData._phase141ShowcasePlanets;
  if (!state?.moon || state._phase155MovingMoonGlow) return;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonGlowTexture(), transparent: true, opacity: .24, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  glow.name = "PHASE155 MOVING MOON GLOW FOLLOWS MOON";
  glow.scale.set(26, 26, 1);
  state.group.add(glow);
  const prior = state.update?.bind(state);
  state.update = (dt = 0.016)=>{
    prior?.(dt);
    const t = performance.now() * .001;
    if (state.moon){
      glow.position.copy(state.moon.position);
      glow.scale.setScalar(24 + Math.sin(t * 1.6) * 3.5);
      glow.material.opacity = .18 + Math.sin(t * 1.2) * .055;
      state.moon.position.y = Math.max(state.moon.position.y, 118 + Math.sin(t * .3) * 2);
    }
  };
  state._phase155MovingMoonGlow = true;
  window.SVR_PHASE155_MOON_GLOW_MOVES = true;
  log("Phase 155 moving moon glow follows the raised moon");
}

export function applyPhase155SkylineAdRingMoonGlow(args = {}, result = {}){
  const scene = args.scene;
  if (!scene) return result;
  alignSkyline(scene);
  addMovingMoonGlow(scene, args.log || (()=>{}));
  scene.userData._phase155SkylineAdRingMoonGlow = true;
  window.SVR_PHASE155_REFINED = true;
  args.setStatus?.("Phase 155: aligned surrounding skyline, tall ad banners, moving moon glow", { force: true });
  return result;
}
