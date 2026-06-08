(function(){
  const BUILD = "VERSION-1.6.4-MOON-MARS-HEIGHT-4500-MARS-300";
  window.SVR_BUILD_LABEL = BUILD;

  const LOCK = {
    moon: {
      height: 4500,
      scale: 340,
      x: -260,
      z: -3100,
      url: "./assets/textures/moon.jpg",
      color: 0xf3ead8,
      spin: 0.00010
    },
    mars: {
      height: 4500,
      scale: 300,
      x: 240,
      z: -3550,
      url: "./assets/textures/mars.jpg",
      color: 0xc96a3b,
      spin: 0.00014
    },
    corridor: {
      minX: -1050,
      maxX: 900,
      minZ: -4300,
      maxZ: -700,
      maxY: 190,
      maxScaleY: 0.72
    }
  };

  window.SVR_164_MOON_MARS_FORCE_LOCK = LOCK;

  const state = { scene:null, moon:null, mars:null, moonHalo:null, marsHalo:null, loop:false };

  function getScene(){
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
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

  function makePlanet(scene, kind){
    if (!window.THREE || !scene) return null;
    const cfg = LOCK[kind];

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      map: loadTexture(cfg.url),
      roughness: 0.9,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: kind === "moon" ? 0.16 : 0.10
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    mesh.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_6_4_HEIGHT_4500";
    mesh.position.set(cfg.x, cfg.height, cfg.z);
    mesh.scale.setScalar(cfg.scale);
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 200;
    mesh.userData.SVR_REAL_PLANET = kind;
    mesh.userData.SVR_1_6_4_FORCE_HEIGHT_4500 = true;
    mesh.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(mesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 32),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: kind === "moon" ? 0.16 : 0.10,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_6_4";
    halo.position.copy(mesh.position);
    halo.scale.setScalar(cfg.scale * 1.14);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 199;
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);

    state[kind + "Halo"] = halo;
    return mesh;
  }

  function scorePlanet(obj){
    const ud = obj.userData || {};
    const mat = obj.material || {};
    return (ud.SVR_1_6_4_FORCE_HEIGHT_4500 ? 10000 : 0) +
           (ud.SVR_REAL_PLANET ? 1500 : 0) +
           (mat.map ? 200 : 0) +
           (obj.visible ? 5 : 0);
  }

  function lockPlanet(scene, kind){
    const list = [];
    scene.traverse(obj => {
      const ud = obj.userData || {};
      const mat = obj.material || {};
      const t = String((obj.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes(kind) || ud.SVR_REAL_PLANET === kind) list.push(obj);
    });

    let keep = list.slice().sort((a,b)=>scorePlanet(b)-scorePlanet(a))[0];
    if (!keep) keep = makePlanet(scene, kind);

    // Hide all older/lower duplicates so the top high-sky version is the only visible target.
    list.forEach(obj => {
      if (obj === keep) return;
      if (!((obj.userData || {}).SVR_DO_NOT_REMOVE)) {
        obj.visible = false;
        obj.userData = obj.userData || {};
        obj.userData.SVR_1_6_4_HIDDEN_LOWER_DUPLICATE = true;
      }
    });

    const cfg = LOCK[kind];
    if (keep) {
      keep.visible = true;
      keep.frustumCulled = false;
      keep.renderOrder = 200;
      keep.position.set(cfg.x, cfg.height, cfg.z);
      keep.scale.setScalar(cfg.scale);
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = kind;
      keep.userData.SVR_1_6_4_FORCE_HEIGHT_4500 = true;
      keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
    }

    const halo = state[kind + "Halo"];
    if (halo && keep) {
      halo.visible = true;
      halo.position.copy(keep.position);
      halo.scale.setScalar(cfg.scale * 1.14);
    }

    state[kind] = keep;
  }

  function capBuildings(scene){
    const c = LOCK.corridor;
    scene.traverse(obj => {
      if (!obj || !obj.position) return;

      const ud = obj.userData || {};
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET || ud.SVR_REAL_PLANET_HALO) return;

      const t = String((obj.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const building =
        t.includes("building") || t.includes("tower") || t.includes("skyline") ||
        t.includes("banner") || t.includes("megatron") || t.includes("sponsor");

      if (!building) return;

      const p = obj.position;
      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;
      if (!inCorridor) return;

      obj.userData = obj.userData || {};
      obj.userData.SVR_1_6_4_CAPPED_FOR_HEIGHT_4500 = true;
      obj.userData.SVR_VIEWABLE_FROM_LOBBY = true;

      if (p.y > c.maxY) p.y = c.maxY;
      if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > c.maxScaleY) obj.scale.y = c.maxScaleY;
    });
  }

  function stampBuild(){
    document.querySelectorAll("body *").forEach(el => {
      if (!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD:") || txt.includes("UPDATE-3.0-PHASE-120")) {
        el.textContent = "BUILD: " + BUILD;
        el.setAttribute("data-svr164-build-label-fixed","true");
      }
    });

    let badge = document.getElementById("svr164BuildBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "svr164BuildBadge";
      badge.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.65);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(badge);
    }
    badge.textContent = "BUILD: " + BUILD;
  }

  function apply(){
    stampBuild();
    const scene = getScene();
    if (!scene || !window.THREE) return;

    state.scene = scene;
    lockPlanet(scene, "moon");
    lockPlanet(scene, "mars");
    capBuildings(scene);

    if (!state.loop) {
      state.loop = true;
      requestAnimationFrame(tick);
    }

    console.log("[SVR]", BUILD, "active: moon height 4500, moon size 340, mars height 4500, mars size 300");
  }

  function tick(){
    requestAnimationFrame(tick);

    ["moon","mars"].forEach(kind => {
      const obj = state[kind];
      if (!obj) return;
      const cfg = LOCK[kind];

      // Hard override every frame so older modules cannot pull it back down.
      obj.visible = true;
      obj.position.set(cfg.x, cfg.height, cfg.z);
      obj.scale.setScalar(cfg.scale);
      if (obj.rotation) obj.rotation.y += cfg.spin;

      const halo = state[kind + "Halo"];
      if (halo) {
        halo.visible = true;
        halo.position.copy(obj.position);
        halo.scale.setScalar(cfg.scale * 1.14);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 1200);

  window.SVR_164_FORCE_MOON_MARS_4500 = { build: BUILD, lock: LOCK, apply };
})();
