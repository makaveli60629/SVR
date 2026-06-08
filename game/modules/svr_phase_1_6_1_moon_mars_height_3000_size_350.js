(function(){
  const BUILD = "VERSION-1.6.1-MOON-MARS-HEIGHT-3000-SIZE-350";
  window.SVR_BUILD_LABEL = BUILD;

  const LOCK = {
    height: 3000,
    size: 350,
    center: { x: 0, z: -80 },
    moon: {
      radius: 1880,
      height: 3000,
      scale: 350,
      speed: 0.000017,
      spin: 0.000110,
      phase: -1.12,
      url: "./assets/textures/moon.jpg",
      color: 0xf3ead8
    },
    mars: {
      radius: 2220,
      height: 3000,
      scale: 350,
      speed: 0.000024,
      spin: 0.000145,
      phase: -0.60,
      url: "./assets/textures/mars.jpg",
      color: 0xc96a3b
    },
    corridor: {
      minX: -700,
      maxX: 520,
      minZ: -2900,
      maxZ: -650,
      maxBuildingY: 330,
      maxScaleY: 1.10
    }
  };

  window.SVR_161_MOON_MARS_LOCK = LOCK;

  const state = {
    moon: null,
    mars: null,
    moonHalo: null,
    marsHalo: null,
    lastScene: null,
    started: performance.now(),
    loopStarted: false
  };

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
        const tx = new THREE.TextureLoader().load(url);
        if (THREE.SRGBColorSpace) tx.colorSpace = THREE.SRGBColorSpace;
        return tx;
      }
    } catch(e) {}
    return null;
  }

  function makePlanet(scene, kind, cfg){
    if (!window.THREE || !scene) return null;

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      map: loadTexture(cfg.url),
      roughness: 0.92,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: kind === "moon" ? 0.14 : 0.09
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    mesh.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_6_1_HEIGHT_3000_SIZE_350";
    mesh.scale.setScalar(cfg.scale);
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 40;
    mesh.userData.SVR_REAL_PLANET = kind;
    mesh.userData.SVR_1_6_1_HEIGHT_3000_SIZE_350 = true;
    mesh.userData.SVR_PERMANENT_SKY_OBJECT = true;
    mesh.userData.SVR_ORBITS_LOBBY_OUTLINE = true;
    scene.add(mesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 32),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: kind === "moon" ? 0.17 : 0.10,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_6_1_HEIGHT_3000_SIZE_350";
    halo.scale.setScalar(cfg.scale * 1.16);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 39;
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    halo.userData.SVR_1_6_1_HEIGHT_3000_SIZE_350 = true;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);

    state[kind + "Halo"] = halo;
    return mesh;
  }

  function scorePlanet(obj){
    const mat = obj.material || {};
    const ud = obj.userData || {};
    return (ud.SVR_1_6_1_HEIGHT_3000_SIZE_350 ? 1200 : 0) +
           (ud.SVR_1_6_0_HEIGHT_1999_SIZE_300 ? 800 : 0) +
           (ud.SVR_REAL_PLANET ? 650 : 0) +
           (mat.map ? 160 : 0) +
           (obj.isMesh ? 10 : 0) +
           (obj.visible ? 5 : 0);
  }

  function findOrCreate(scene, kind){
    const list = [];
    scene.traverse(obj => {
      const ud = obj.userData || {};
      const mat = obj.material || {};
      const text = String((obj.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (text.includes(kind) || ud.SVR_REAL_PLANET === kind) list.push(obj);
    });

    let keep = list.slice().sort((a,b)=>scorePlanet(b)-scorePlanet(a))[0];
    if (!keep) keep = makePlanet(scene, kind, LOCK[kind]);

    list.forEach(obj => {
      if (obj === keep) return;
      const mat = obj.material || {};
      const ud = obj.userData || {};
      if (!mat.map && !ud.SVR_DO_NOT_REMOVE && !ud.SVR_REAL_PLANET) {
        obj.visible = false;
        if (obj.parent) obj.parent.remove(obj);
      }
    });

    if (keep) {
      keep.visible = true;
      keep.frustumCulled = false;
      keep.renderOrder = 40;
      if (keep.scale && keep.scale.setScalar) keep.scale.setScalar(LOCK[kind].scale);
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = kind;
      keep.userData.SVR_1_6_1_HEIGHT_3000_SIZE_350 = true;
      keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
      keep.userData.SVR_ORBITS_LOBBY_OUTLINE = true;
    }

    state[kind] = keep;
  }

  function capSkylineCorridor(scene){
    const c = LOCK.corridor;
    scene.traverse(obj => {
      if (!obj || !obj.position) return;
      const ud = obj.userData || {};
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET || ud.SVR_REAL_PLANET_HALO) return;

      const text = String((obj.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const building =
        text.includes("building") ||
        text.includes("tower") ||
        text.includes("skyline") ||
        text.includes("banner") ||
        text.includes("megatron");

      if (!building) return;

      const p = obj.position;
      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;
      if (!inCorridor) return;

      obj.userData = obj.userData || {};
      obj.userData.SVR_1_6_1_CAPPED_FOR_MOON_MARS = true;
      obj.userData.SVR_SKYLINE_TIER_LOCK = true;

      if (p.y > c.maxBuildingY) p.y = c.maxBuildingY;
      if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > c.maxScaleY) obj.scale.y = c.maxScaleY;
    });
  }

  function orbitPosition(kind, elapsed){
    const cfg = LOCK[kind];
    const a = cfg.phase + elapsed * cfg.speed;

    let x = LOCK.center.x + Math.cos(a) * cfg.radius;
    let z = LOCK.center.z + Math.sin(a) * cfg.radius;

    // Keep on a visible upper north arc.
    if (z > -800) z = -800 - Math.abs(z + 800) * 0.22;
    if (z < -2850) z = -2850 + Math.abs(z + 2850) * 0.22;

    return [x, cfg.height, z];
  }

  function tick(now){
    requestAnimationFrame(tick);

    const scene = getScene();
    if (!scene || !window.THREE) return;

    if (scene !== state.lastScene) {
      state.lastScene = scene;
      findOrCreate(scene, "moon");
      findOrCreate(scene, "mars");
      capSkylineCorridor(scene);
    }

    const elapsed = now - state.started;

    ["moon","mars"].forEach(kind => {
      const obj = state[kind];
      if (!obj) return;

      const p = orbitPosition(kind, elapsed);
      if (obj.position && obj.position.set) obj.position.set(p[0], p[1], p[2]);
      if (obj.scale && obj.scale.setScalar) obj.scale.setScalar(LOCK[kind].scale);
      if (obj.rotation) obj.rotation.y += LOCK[kind].spin;

      const halo = state[kind + "Halo"];
      if (halo && halo.position) {
        halo.position.copy(obj.position);
        if (halo.scale && halo.scale.setScalar) halo.scale.setScalar(LOCK[kind].scale * 1.16);
      }
    });
  }

  function apply(){
    const scene = getScene();
    if (!scene || !window.THREE) return;

    findOrCreate(scene, "moon");
    findOrCreate(scene, "mars");
    capSkylineCorridor(scene);

    if (!state.loopStarted) {
      state.loopStarted = true;
      requestAnimationFrame(tick);
    }

    console.log("[SVR]", BUILD, "active: Moon/Mars height=3000 size=350");
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 3000);

  window.SVR_161_MOON_MARS_HEIGHT_SIZE_LOCK = {
    build: BUILD,
    height: 3000,
    size: 350,
    apply
  };
})();
