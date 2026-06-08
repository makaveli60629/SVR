(function(){
  const BUILD = "VERSION-1.6.2-BUILDING-TIER-RESTRUCTURE-MOON-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const LOCK = {
    moon: {
      height: 3000,
      scale: 340,
      radius: 1880,
      phase: -1.12,
      speed: 0.000017,
      spin: 0.000110,
      url: "./assets/textures/moon.jpg",
      color: 0xf3ead8
    },
    mars: {
      height: 3000,
      scale: 340,
      radius: 2220,
      phase: -0.60,
      speed: 0.000024,
      spin: 0.000145,
      url: "./assets/textures/mars.jpg",
      color: 0xc96a3b
    },
    center: { x: 0, z: -80 },
    corridor: {
      minX: -760,
      maxX: 560,
      minZ: -3100,
      maxZ: -600,
      maxY: 260,
      maxScaleY: 0.95,
      rule: "No building, billboard, portal, hologram, or banner may block Moon/Mars from the lobby."
    },
    tiers: [
      { id:"TIER-1-NORTH-MEGATRON-LEFT",  tier:1, x:-760, y:150, z:-1120, maxY:340, purpose:"major sponsor megatron, left north wall", viewableFromLobby:true },
      { id:"TIER-1-NORTH-MEGATRON-RIGHT", tier:1, x: 760, y:150, z:-1120, maxY:340, purpose:"major sponsor megatron, right north wall", viewableFromLobby:true },
      { id:"TIER-1-EAST-MEGATRON",        tier:1, x: 980, y:160, z:-220,  maxY:360, purpose:"east sponsor anchor", viewableFromLobby:true },
      { id:"TIER-1-WEST-MEGATRON",        tier:1, x:-980, y:160, z:-220,  maxY:360, purpose:"west sponsor anchor", viewableFromLobby:true },

      { id:"TIER-2-NORTH-BANNER-LEFT",    tier:2, x:-430, y:95, z:-730, maxY:210, purpose:"mid sponsor banner, low north", viewableFromLobby:true },
      { id:"TIER-2-NORTH-BANNER-RIGHT",   tier:2, x: 430, y:95, z:-730, maxY:210, purpose:"mid sponsor banner, low north", viewableFromLobby:true },
      { id:"TIER-2-EAST-BANNER-RING",     tier:2, x: 700, y:95, z: 120, maxY:220, purpose:"mid sponsor banner, east ring", viewableFromLobby:true },
      { id:"TIER-2-WEST-BANNER-RING",     tier:2, x:-700, y:95, z: 120, maxY:220, purpose:"mid sponsor banner, west ring", viewableFromLobby:true },

      { id:"TIER-3-LOW-FILLER-FRONT",     tier:3, x:0, y:45, z:420, maxY:110, purpose:"low city filler only", viewableFromLobby:true },
      { id:"TIER-3-LOW-FILLER-SIDES",     tier:3, x:"side-ring", y:45, z:"varied", maxY:120, purpose:"small ads / low city filler", viewableFromLobby:true }
    ]
  };

  window.SVR_BUILDING_TIER_PERMANENT_LOCK = LOCK;

  let state = {
    scene:null,
    moon:null,
    mars:null,
    moonHalo:null,
    marsHalo:null,
    started: performance.now(),
    loop:false
  };

  function getScene(){
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
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

  function makePlanet(scene, kind, cfg){
    if (!window.THREE || !scene) return null;
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      map: tex(cfg.url),
      roughness: .92,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: kind === "moon" ? .14 : .09
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    m.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_6_2_HEIGHT_3000_SIZE_340";
    m.scale.setScalar(cfg.scale);
    m.visible = true;
    m.frustumCulled = false;
    m.renderOrder = 50;
    m.userData.SVR_REAL_PLANET = kind;
    m.userData.SVR_1_6_2_HEIGHT_3000_SIZE_340 = true;
    m.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(m);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08,64,32),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: kind === "moon" ? .16 : .10,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_6_2";
    halo.scale.setScalar(cfg.scale * 1.15);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 49;
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);
    state[kind + "Halo"] = halo;
    return m;
  }

  function planetScore(o){
    const ud = o.userData || {};
    const mat = o.material || {};
    return (ud.SVR_1_6_2_HEIGHT_3000_SIZE_340 ? 2000 : 0) +
           (ud.SVR_REAL_PLANET ? 900 : 0) +
           (mat.map ? 160 : 0) +
           (o.isMesh ? 10 : 0) +
           (o.visible ? 5 : 0);
  }

  function lockPlanet(scene, kind){
    const list = [];
    scene.traverse(o => {
      const ud = o.userData || {};
      const mat = o.material || {};
      const t = String((o.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes(kind) || ud.SVR_REAL_PLANET === kind) list.push(o);
    });

    let keep = list.slice().sort((a,b)=>planetScore(b)-planetScore(a))[0];
    if (!keep) keep = makePlanet(scene, kind, LOCK[kind]);

    list.forEach(o => {
      if (o === keep) return;
      const mat = o.material || {};
      const ud = o.userData || {};
      if (!mat.map && !ud.SVR_DO_NOT_REMOVE && !ud.SVR_REAL_PLANET) {
        o.visible = false;
        if (o.parent) o.parent.remove(o);
      }
    });

    if (keep) {
      keep.visible = true;
      keep.frustumCulled = false;
      keep.renderOrder = 50;
      if (keep.scale && keep.scale.setScalar) keep.scale.setScalar(LOCK[kind].scale);
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = kind;
      keep.userData.SVR_1_6_2_HEIGHT_3000_SIZE_340 = true;
      keep.userData.SVR_PERMANENT_SKY_OBJECT = true;
    }
    state[kind] = keep;
  }

  function classifyBuilding(obj){
    const ud = obj.userData || {};
    const name = String((obj.name || "") + " " + JSON.stringify(ud)).toLowerCase();
    const isBuilding = name.includes("building") || name.includes("tower") || name.includes("skyline") || name.includes("banner") || name.includes("megatron") || name.includes("sponsor");
    if (!isBuilding || !obj.position) return null;

    let tier = 3;
    if (name.includes("megatron") || name.includes("tier1") || name.includes("tier 1") || name.includes("willis") || name.includes("trump")) tier = 1;
    else if (name.includes("banner") || name.includes("tier2") || name.includes("tier 2") || name.includes("sponsor")) tier = 2;

    return tier;
  }

  function restructureBuildings(scene){
    const c = LOCK.corridor;
    let counts = { 1:0, 2:0, 3:0, capped:0, locked:0 };

    scene.traverse(obj => {
      const tier = classifyBuilding(obj);
      if (!tier) return;

      obj.userData = obj.userData || {};
      const p = obj.position;

      // Lock tier metadata permanently.
      obj.userData.SVR_BUILDING_TIER = tier;
      obj.userData.SVR_BUILDING_PURPOSE = tier === 1 ? "Tier 1 major sponsor / megatron" : tier === 2 ? "Tier 2 mid sponsor banner" : "Tier 3 low city filler / small ad";
      obj.userData.SVR_VIEWABLE_FROM_LOBBY = true;
      obj.userData.SVR_BUILDING_LOCK_VERSION = BUILD;

      const inCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;

      // Strong rule: no building is allowed to block Moon/Mars corridor.
      if (inCorridor) {
        counts.capped++;
        obj.userData.SVR_PLANET_SIGHTLINE_CAPPED = true;
        if (p.y > c.maxY) p.y = c.maxY;
        if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > c.maxScaleY) obj.scale.y = c.maxScaleY;

        // Push tier 1 out to side if it is too centered in the planet corridor.
        if (tier === 1 && Math.abs(p.x) < 520) {
          p.x = p.x < 0 ? -760 : 760;
          obj.userData.SVR_MOVED_OUT_OF_PLANET_CORRIDOR = true;
        }
      }

      // Tier-specific caps. These make layout consistent and viewable from lobby.
      if (tier === 1) {
        if (p.y > 360) p.y = 360;
        if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > 1.55) obj.scale.y = 1.55;
      } else if (tier === 2) {
        if (p.y > 220) p.y = 220;
        if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > 1.18) obj.scale.y = 1.18;
      } else {
        if (p.y > 125) p.y = 125;
        if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > .9) obj.scale.y = .9;
      }

      if (!obj.userData.SVR_BUILDING_LOCATION_LOCK) {
        obj.userData.SVR_BUILDING_LOCATION_LOCK = {
          build: BUILD,
          tier,
          x: Number((p.x || 0).toFixed ? p.x.toFixed(2) : p.x),
          y: Number((p.y || 0).toFixed ? p.y.toFixed(2) : p.y),
          z: Number((p.z || 0).toFixed ? p.z.toFixed(2) : p.z),
          viewableFromLobby: true,
          rule: "Do not move or resize without updating game/docs/BUILDING_TIER_PERMANENT_LOCK.json"
        };
      }

      counts[tier]++;
      counts.locked++;
    });

    window.SVR_BUILDING_TIER_RUNTIME_COUNTS = counts;
  }

  function orbitPosition(kind, elapsed){
    const cfg = LOCK[kind];
    const a = cfg.phase + elapsed * cfg.speed;
    let x = LOCK.center.x + Math.cos(a) * cfg.radius;
    let z = LOCK.center.z + Math.sin(a) * cfg.radius;

    // Keep in high north/up viewable arc.
    if (z > -860) z = -860 - Math.abs(z + 860) * .20;
    if (z < -2860) z = -2860 + Math.abs(z + 2860) * .20;
    return [x, cfg.height, z];
  }

  function tick(now){
    requestAnimationFrame(tick);
    const scene = getScene();
    if (!scene || !window.THREE) return;

    if (state.scene !== scene) {
      state.scene = scene;
      lockPlanet(scene, "moon");
      lockPlanet(scene, "mars");
      restructureBuildings(scene);
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
        if (halo.scale && halo.scale.setScalar) halo.scale.setScalar(LOCK[kind].scale * 1.15);
      }
    });
  }

  function apply(){
    const scene = getScene();
    if (!scene || !window.THREE) return;
    lockPlanet(scene, "moon");
    lockPlanet(scene, "mars");
    restructureBuildings(scene);
    if (!state.loop) {
      state.loop = true;
      requestAnimationFrame(tick);
    }
    console.log("[SVR]", BUILD, "active: buildings locked by tier, Moon height 3000 size 340");
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 2500);

  window.SVR_162_BUILDING_TIER_MOON_LOCK = { build: BUILD, lock: LOCK, apply };
})();
