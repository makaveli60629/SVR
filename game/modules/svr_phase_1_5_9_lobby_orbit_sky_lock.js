(function(){
  const BUILD = "VERSION-1.5.9-LOBBY-ORBIT-SKY-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const ORBIT = {
    // Orbit ring is high over the lobby/city outline, not inside the storefront.
    center: { x: 0, y: 0, z: -60 },
    moon: {
      radius: 1280,
      height: 1020,
      scale: 132,
      speed: 0.000030,
      spin: 0.000150,
      phase: -1.05,
      url: "./assets/textures/moon.jpg",
      color: 0xf3ead8
    },
    mars: {
      radius: 1520,
      height: 1080,
      scale: 66,
      speed: 0.000044,
      spin: 0.000210,
      phase: -0.62,
      url: "./assets/textures/mars.jpg",
      color: 0xc96a3b
    },
    // This keeps the planets in the upper visible north sky arc.
    visibleArc: {
      minZ: -1800,
      maxZ: -760,
      minY: 920
    }
  };

  window.SVR_LOBBY_ORBIT_SKY_LOCK = { build: BUILD, orbit: ORBIT };

  let state = {
    moon: null,
    mars: null,
    moonHalo: null,
    marsHalo: null,
    lastScene: null,
    started: performance.now()
  };

  function getScene(){
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
    }
    if (window.world && window.world.scene && window.world.scene.add) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function getCamera(){
    for (const k of ["camera","SVR_CAMERA","svrCamera"]) {
      if (window[k] && window[k].position) return window[k];
    }
    const scene = getScene();
    let cam = null;
    if (scene && scene.traverse) {
      scene.traverse(o => {
        if (!cam && (o.isCamera || o.type === "PerspectiveCamera" || /camera/i.test(o.name || ""))) cam = o;
      });
    }
    return cam;
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
      emissiveIntensity: kind === "moon" ? 0.13 : 0.08
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 36), mat);
    mesh.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_5_9_LOBBY_ORBIT";
    mesh.scale.setScalar(cfg.scale);
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    mesh.userData.SVR_REAL_PLANET = kind;
    mesh.userData.SVR_1_5_9_ORBIT_SKY_LOCK = true;
    mesh.userData.SVR_PERMANENT_SKY_OBJECT = true;
    mesh.userData.SVR_ORBITS_LOBBY_OUTLINE = true;
    scene.add(mesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 48, 24),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: kind === "moon" ? 0.18 : 0.11,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_5_9_LOBBY_ORBIT";
    halo.scale.setScalar(cfg.scale * 1.2);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 9;
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    halo.userData.SVR_1_5_9_ORBIT_SKY_LOCK = true;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);

    state[kind + "Halo"] = halo;
    return mesh;
  }

  function scorePlanet(obj){
    const mat = obj.material || {};
    const ud = obj.userData || {};
    return (ud.SVR_1_5_9_ORBIT_SKY_LOCK || ud.SVR_REAL_PLANET ? 700 : 0) +
           (ud.SVR_1_5_8_SKY_LOCK ? 250 : 0) +
           (mat.map ? 140 : 0) +
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
    if (!keep) keep = makePlanet(scene, kind, ORBIT[kind]);

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
      keep.renderOrder = 10;
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = kind;
      keep.userData.SVR_1_5_9_ORBIT_SKY_LOCK = true;
      keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
      keep.userData.SVR_ORBITS_LOBBY_OUTLINE = true;
      if (keep.scale && keep.scale.setScalar) keep.scale.setScalar(ORBIT[kind].scale);
    }

    state[kind] = keep;
  }

  function clearPlanetSightline(scene){
    const c = {
      minX: -360,
      maxX: 180,
      minZ: -1900,
      maxZ: -680,
      maxY: 330,
      maxScaleY: 1.16
    };

    scene.traverse(obj => {
      if (!obj || !obj.position) return;
      const ud = obj.userData || {};
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET || ud.SVR_REAL_PLANET_HALO) return;

      const text = String((obj.name || "") + " " + JSON.stringify(ud)).toLowerCase();
      const isBuilding = text.includes("building") || text.includes("tower") || text.includes("skyline") || text.includes("banner") || text.includes("megatron");
      if (!isBuilding) return;

      const p = obj.position;
      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;
      if (!inCorridor) return;

      obj.userData = obj.userData || {};
      obj.userData.SVR_1_5_9_CAPPED_FOR_PLANET_ORBIT = true;
      obj.userData.SVR_BUILDING_LOCATION_LOCK = obj.userData.SVR_BUILDING_LOCATION_LOCK || {
        build: BUILD,
        originalName: obj.name || obj.uuid,
        lockedX: Number((p.x || 0).toFixed ? p.x.toFixed(2) : p.x),
        lockedY: Number((p.y || 0).toFixed ? p.y.toFixed(2) : p.y),
        lockedZ: Number((p.z || 0).toFixed ? p.z.toFixed(2) : p.z),
        note: "Capped to keep Moon/Mars orbit visible."
      };

      if (p.y > c.maxY) p.y = c.maxY;
      if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > c.maxScaleY) obj.scale.y = c.maxScaleY;
    });
  }

  function orbitPosition(kind, elapsed){
    const cfg = ORBIT[kind];
    let a = cfg.phase + elapsed * cfg.speed;

    // Keep most of the path on visible north/up arc.
    let x = ORBIT.center.x + Math.cos(a) * cfg.radius;
    let z = ORBIT.center.z + Math.sin(a) * cfg.radius;

    // If it rotates behind a bad section, fold it back into the visible north sky.
    if (z > ORBIT.visibleArc.maxZ) z = ORBIT.visibleArc.maxZ - Math.abs(z - ORBIT.visibleArc.maxZ) * 0.35;
    if (z < ORBIT.visibleArc.minZ) z = ORBIT.visibleArc.minZ + Math.abs(z - ORBIT.visibleArc.minZ) * 0.35;

    return [x, Math.max(cfg.height, ORBIT.visibleArc.minY), z];
  }

  function tick(now){
    requestAnimationFrame(tick);

    const scene = getScene();
    if (!scene || !window.THREE) return;

    if (scene !== state.lastScene) {
      state.lastScene = scene;
      findOrCreate(scene, "moon");
      findOrCreate(scene, "mars");
      clearPlanetSightline(scene);
    }

    const elapsed = now - state.started;

    [["moon", state.moon], ["mars", state.mars]].forEach(([kind, obj]) => {
      if (!obj) return;

      const p = orbitPosition(kind, elapsed);
      if (obj.position && obj.position.set) obj.position.set(p[0], p[1], p[2]);
      if (obj.rotation) obj.rotation.y += ORBIT[kind].spin;

      const halo = state[kind + "Halo"];
      if (halo && halo.position) {
        halo.position.copy(obj.position);
        if (halo.rotation) halo.rotation.y += ORBIT[kind].spin * 0.4;
      }
    });
  }

  function apply(){
    const scene = getScene();
    if (!scene || !window.THREE) return;
    findOrCreate(scene, "moon");
    findOrCreate(scene, "mars");
    clearPlanetSightline(scene);
    console.log("[SVR]", BUILD, "active: Moon/Mars orbit lobby outline high sky");
  }

  document.addEventListener("DOMContentLoaded", () => { apply(); requestAnimationFrame(tick); });
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 3000);

  window.SVR_159_LOBBY_ORBIT_SKY_LOCK = {
    build: BUILD,
    orbit: ORBIT,
    apply
  };
})();
