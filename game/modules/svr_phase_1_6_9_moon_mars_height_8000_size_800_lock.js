(function(){
  const BUILD = "VERSION-1.6.9-MOON-MARS-HEIGHT-8000-SIZE-800";
  window.SVR_BUILD_LABEL = BUILD;
  const SKY = {
    moon: { x:-620, y:8000, z:-6200, scale:800, color:0xf3ead8, url:"./assets/textures/moon.jpg", spin:0.000055 },
    mars: { x: 680, y:8000, z:-7200, scale:800, color:0xc96a3b, url:"./assets/textures/mars.jpg", spin:0.000075 }
  };
  const state = { moon:null, mars:null, moonHalo:null, marsHalo:null, loop:false };
  function getScene(){
    const af = document.querySelector("a-scene");
    if (af && af.object3D && af.object3D.add && af.object3D.traverse) return af.object3D;
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
      if (window[k] && window[k].object3D && window[k].object3D.add) return window[k].object3D;
    }
    if (window.world && window.world.scene && window.world.scene.add) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }
  function tex(url){
    try {
      if (window.THREE && THREE.TextureLoader) {
        const t = new THREE.TextureLoader().load(url);
        if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
    } catch(e) {}
    return null;
  }
  function stampBuild(){
    let badge = document.getElementById("svr169BuildBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "svr169BuildBadge";
      badge.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.72);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(badge);
    }
    badge.textContent = "BUILD: " + BUILD;
  }
  function makePlanet(scene, key){
    if (!window.THREE || !scene) return null;
    const cfg = SKY[key];
    const mat = new THREE.MeshStandardMaterial({ color:cfg.color, map:tex(cfg.url), roughness:.9, metalness:0, emissive:cfg.color, emissiveIntensity:key === "moon" ? .13 : .08 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    mesh.name = "SVR_REAL_" + key.toUpperCase() + "_PHASE_1_6_9_HEIGHT_8000_SIZE_800";
    mesh.position.set(cfg.x,cfg.y,cfg.z); mesh.scale.setScalar(cfg.scale);
    mesh.visible = true; mesh.frustumCulled = false; mesh.renderOrder = 500;
    mesh.userData.SVR_REAL_PLANET = key;
    mesh.userData.SVR_1_6_9_HEIGHT_8000_SIZE_800 = true;
    mesh.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(mesh);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.06,64,32), new THREE.MeshBasicMaterial({ color:cfg.color, transparent:true, opacity:key === "moon" ? .13 : .085, depthWrite:false, side:THREE.DoubleSide }));
    halo.name = "SVR_" + key.toUpperCase() + "_HALO_PHASE_1_6_9";
    halo.position.copy(mesh.position); halo.scale.setScalar(cfg.scale * 1.10);
    halo.visible = true; halo.frustumCulled = false; halo.renderOrder = 499;
    halo.userData.SVR_REAL_PLANET_HALO = key; halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo); state[key + "Halo"] = halo;
    return mesh;
  }
  function lockPlanet(scene, key){
    const list = [];
    scene.traverse(o => {
      const ud = o.userData || {}, mat = o.material || {};
      const t = String((o.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes(key) || ud.SVR_REAL_PLANET === key) list.push(o);
    });
    let keep = list.find(o => (o.userData || {}).SVR_1_6_9_HEIGHT_8000_SIZE_800) || list.find(o => (o.userData || {}).SVR_REAL_PLANET === key);
    if (!keep) keep = makePlanet(scene, key);
    list.forEach(o => { if (o !== keep && !((o.userData || {}).SVR_DO_NOT_REMOVE)) { o.visible = false; o.userData = o.userData || {}; o.userData.SVR_1_6_9_HIDDEN_LOWER_PLANET_DUPLICATE = true; } });
    const cfg = SKY[key];
    if (keep) {
      keep.visible = true; keep.frustumCulled = false; keep.renderOrder = 500;
      keep.position.set(cfg.x,cfg.y,cfg.z); keep.scale.setScalar(cfg.scale);
      keep.userData = keep.userData || {}; keep.userData.SVR_REAL_PLANET = key; keep.userData.SVR_1_6_9_HEIGHT_8000_SIZE_800 = true; keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
    }
    const halo = state[key + "Halo"];
    if (halo && keep) { halo.visible = true; halo.position.copy(keep.position); halo.scale.setScalar(cfg.scale * 1.10); }
    state[key] = keep;
  }
  function capSkyline(scene){
    const c = { minX:-1600, maxX:1500, minZ:-8200, maxZ:-650, maxY:150, maxScaleY:0.58 };
    scene.traverse(o => {
      if (!o || !o.position) return;
      const ud = o.userData || {};
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET || ud.SVR_REAL_PLANET_HALO) return;
      const t = String((o.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const building = t.includes("building") || t.includes("tower") || t.includes("skyline") || t.includes("banner") || t.includes("megatron") || t.includes("sponsor");
      if (!building) return;
      const p = o.position;
      if (p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ) {
        o.userData = o.userData || {}; o.userData.SVR_1_6_9_CAPPED_FOR_HEIGHT_8000_PLANETS = true;
        if (p.y > c.maxY) p.y = c.maxY;
        if (o.scale && typeof o.scale.y === "number" && o.scale.y > c.maxScaleY) o.scale.y = c.maxScaleY;
      }
    });
  }
  function apply(){
    stampBuild();
    const scene = getScene();
    if (!scene || !window.THREE) return;
    lockPlanet(scene, "moon"); lockPlanet(scene, "mars"); capSkyline(scene);
    if (!state.loop) { state.loop = true; requestAnimationFrame(tick); }
    console.log("[SVR]", BUILD, "active: Moon/Mars height 8000 size 800");
  }
  function tick(){
    requestAnimationFrame(tick);
    ["moon","mars"].forEach(key => {
      const obj = state[key]; if (!obj) return;
      const cfg = SKY[key]; obj.visible = true; obj.position.set(cfg.x,cfg.y,cfg.z); obj.scale.setScalar(cfg.scale);
      if (obj.rotation) obj.rotation.y += cfg.spin;
      const halo = state[key + "Halo"];
      if (halo) { halo.visible = true; halo.position.copy(obj.position); halo.scale.setScalar(cfg.scale * 1.10); }
    });
  }
  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply,700));
  setInterval(apply,1000);
  window.SVR_169_MOON_MARS_8000_800_LOCK = { build:BUILD, sky:SKY, apply };
})();
