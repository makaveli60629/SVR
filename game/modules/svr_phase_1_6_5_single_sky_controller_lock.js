(function(){
  const BUILD = "VERSION-1.6.5-SINGLE-SKY-CONTROLLER-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const LOCK = {
    moon: { name:"Moon", x:-280, y:4500, z:-3200, scale:340, color:0xf3ead8, url:"./assets/textures/moon.jpg", spin:0.00010 },
    mars: { name:"Mars", x: 260, y:4500, z:-3700, scale:300, color:0xc96a3b, url:"./assets/textures/mars.jpg", spin:0.00014 },
    buildingCap: { minX:-1200, maxX:1050, minZ:-4400, maxZ:-650, maxY:180, maxScaleY:0.70 }
  };

  window.SVR_SINGLE_SKY_CONTROLLER_LOCK = { build:BUILD, lock:LOCK };

  const state = { scene:null, moon:null, mars:null, moonHalo:null, marsHalo:null, loop:false };

  function getThreeScene(){
    // A-Frame path first, because this project often uses <a-scene>.
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

  function loadTexture(url){
    try {
      if (window.THREE && THREE.TextureLoader) {
        const t = new THREE.TextureLoader().load(url);
        if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
    } catch(e) {}
    return null;
  }

  function makePlanet(scene, key){
    if (!window.THREE || !scene) return null;
    const cfg = LOCK[key];

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      map: loadTexture(cfg.url),
      roughness: 0.9,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: key === "moon" ? 0.17 : 0.10
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    mesh.name = "SVR_LOCKED_" + cfg.name.toUpperCase() + "_PHASE_1_6_5_SINGLE_SKY";
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    mesh.scale.setScalar(cfg.scale);
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 1000;
    mesh.userData.SVR_REAL_PLANET = key;
    mesh.userData.SVR_SINGLE_SKY_CONTROLLER_LOCK = true;
    mesh.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(mesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 32),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: key === "moon" ? 0.18 : 0.11,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_LOCKED_" + cfg.name.toUpperCase() + "_HALO_PHASE_1_6_5";
    halo.position.copy(mesh.position);
    halo.scale.setScalar(cfg.scale * 1.14);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 999;
    halo.userData.SVR_REAL_PLANET_HALO = key;
    halo.userData.SVR_SINGLE_SKY_CONTROLLER_LOCK = true;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);

    state[key + "Halo"] = halo;
    return mesh;
  }

  function score(o){
    const ud = o.userData || {};
    const mat = o.material || {};
    return (ud.SVR_SINGLE_SKY_CONTROLLER_LOCK ? 100000 : 0) +
           (ud.SVR_REAL_PLANET ? 1000 : 0) +
           (mat.map ? 200 : 0) +
           (o.visible ? 5 : 0);
  }

  function lockPlanet(scene, key){
    const list = [];
    scene.traverse(o => {
      const ud = o.userData || {};
      const mat = o.material || {};
      const t = String((o.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes(key) || ud.SVR_REAL_PLANET === key) list.push(o);
    });

    let keep = list.slice().sort((a,b)=>score(b)-score(a))[0];
    if (!keep) keep = makePlanet(scene, key);

    list.forEach(o => {
      if (o === keep) return;
      if (!((o.userData || {}).SVR_DO_NOT_REMOVE)) {
        o.visible = false;
        o.userData = o.userData || {};
        o.userData.SVR_1_6_5_HIDDEN_OLD_SKY_DUPLICATE = true;
      }
    });

    const cfg = LOCK[key];
    if (keep) {
      keep.visible = true;
      keep.frustumCulled = false;
      keep.renderOrder = 1000;
      keep.position.set(cfg.x, cfg.y, cfg.z);
      keep.scale.setScalar(cfg.scale);
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = key;
      keep.userData.SVR_SINGLE_SKY_CONTROLLER_LOCK = true;
      keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
    }

    const halo = state[key + "Halo"];
    if (halo && keep) {
      halo.visible = true;
      halo.position.copy(keep.position);
      halo.scale.setScalar(cfg.scale * 1.14);
    }

    state[key] = keep;
  }

  function capBuildings(scene){
    const c = LOCK.buildingCap;
    scene.traverse(o => {
      if (!o || !o.position) return;
      const ud = o.userData || {};
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET || ud.SVR_REAL_PLANET_HALO) return;

      const t = String((o.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const building = t.includes("building") || t.includes("tower") || t.includes("skyline") || t.includes("banner") || t.includes("megatron") || t.includes("sponsor");
      if (!building) return;

      const p = o.position;
      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;
      if (!inCorridor) return;

      o.userData = o.userData || {};
      o.userData.SVR_1_6_5_CAPPED_FOR_SINGLE_SKY_LOCK = true;
      o.userData.SVR_VIEWABLE_FROM_LOBBY = true;

      if (p.y > c.maxY) p.y = c.maxY;
      if (o.scale && typeof o.scale.y === "number" && o.scale.y > c.maxScaleY) o.scale.y = c.maxScaleY;
    });
  }

  function updateBadge(){
    let badge = document.getElementById("svr165BuildBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "svr165BuildBadge";
      badge.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.70);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(badge);
    }
    badge.textContent = "BUILD: " + BUILD;
  }

  function stampOldLabels(){
    updateBadge();
    document.querySelectorAll("body *").forEach(el => {
      if (!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD:") || txt.includes("UPDATE-3.0-PHASE-120") || txt.includes("VERSION-1.6.3") || txt.includes("VERSION-1.6.4")) {
        el.textContent = "BUILD: " + BUILD;
        el.setAttribute("data-svr165-build-label-fixed","true");
      }
    });
  }

  function apply(){
    stampOldLabels();
    const scene = getThreeScene();
    if (!scene || !window.THREE) return;

    state.scene = scene;
    lockPlanet(scene, "moon");
    lockPlanet(scene, "mars");
    capBuildings(scene);

    if (!state.loop) {
      state.loop = true;
      requestAnimationFrame(tick);
    }

    console.log("[SVR]", BUILD, "active: single sky controller; old sky modules removed from index");
  }

  function tick(){
    requestAnimationFrame(tick);

    ["moon","mars"].forEach(key => {
      const obj = state[key];
      if (!obj) return;
      const cfg = LOCK[key];

      // Absolute hard lock every frame. No orbit until visual position is confirmed.
      obj.visible = true;
      obj.position.set(cfg.x, cfg.y, cfg.z);
      obj.scale.setScalar(cfg.scale);
      if (obj.rotation) obj.rotation.y += cfg.spin;

      const halo = state[key + "Halo"];
      if (halo) {
        halo.visible = true;
        halo.position.copy(obj.position);
        halo.scale.setScalar(cfg.scale * 1.14);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 1000);

  window.SVR_165_SINGLE_SKY_CONTROLLER = { build: BUILD, lock: LOCK, apply };
})();
