(function(){
  const BUILD = "VERSION-1.5.8-SKYLINE-TIER-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const CONFIG = {
    // High enough to be visible over the building ring from lobby/reiki/storefront view.
    moon: { pos:[-165, 880, -1220], scale:128, url:"./assets/textures/moon.jpg", color:0xf3ead8 },
    mars: { pos:[-38, 925, -1390], scale:64, url:"./assets/textures/mars.jpg", color:0xc96a3b },

    // Protected sightline wedge: buildings in this rough x-range/z-depth are capped or pushed down.
    // This prevents skyline pieces from covering the Moon/Mars when the user looks north/up.
    sightline: {
      minX:-260,
      maxX:95,
      minZ:-1550,
      maxZ:-720,
      maxBuildingY:285,
      maxHeightScaleY:1.22
    },

    tiers: [
      {
        id:"T1-MEGATRON-NORTH",
        tier:1,
        purpose:"Primary sponsor megatron / north skyline anchor",
        location:"north outer skyline, behind lobby wall",
        position:{ x:-360, y:150, z:-980 },
        maxY:320,
        lock:true,
        notes:"Never place in Moon/Mars sightline corridor."
      },
      {
        id:"T1-MEGATRON-EAST",
        tier:1,
        purpose:"Primary sponsor megatron / east skyline anchor",
        location:"east outer skyline",
        position:{ x:620, y:155, z:-250 },
        maxY:340,
        lock:true,
        notes:"Allowed tall; should not cross north sky sightline."
      },
      {
        id:"T1-MEGATRON-WEST",
        tier:1,
        purpose:"Primary sponsor megatron / west skyline anchor",
        location:"west outer skyline",
        position:{ x:-620, y:155, z:-250 },
        maxY:340,
        lock:true,
        notes:"Allowed tall; should not cross north sky sightline."
      },
      {
        id:"T2-MID-BANNER-RING",
        tier:2,
        purpose:"Mid sponsor banner building set",
        location:"outer side ring, below planet sightline",
        position:{ x:"varied", y:95, z:"side-ring" },
        maxY:255,
        lock:true,
        notes:"Medium buildings only."
      },
      {
        id:"T3-SMALL-BANNER-LOW",
        tier:3,
        purpose:"Small local ads and decorative city filler",
        location:"low front skyline and side fillers",
        position:{ x:"varied", y:45, z:"front/side low" },
        maxY:145,
        lock:true,
        notes:"Never block Moon/Mars."
      },
      {
        id:"SKY-CLEAR-MOON-MARS-CORRIDOR",
        tier:0,
        purpose:"Permanent clear view corridor for Moon/Mars",
        location:"north sky, above skyline",
        position:{ x:"-260..95", y:"above 285", z:"-1550..-720" },
        maxY:"buildings capped at 285 inside this corridor",
        lock:true,
        notes:"No future building, portal, billboard, or hologram may occupy this corridor."
      }
    ]
  };

  window.SVR_SKYLINE_TIER_LOCK = CONFIG;

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
    if (!scene || !scene.traverse) return null;
    let cam = null;
    scene.traverse(o => {
      if (!cam && (o.isCamera || o.type === "PerspectiveCamera" || /camera/i.test(o.name || ""))) cam = o;
    });
    return cam;
  }

  function tx(url){
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
      map: tx(cfg.url),
      roughness: .92,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: kind === "moon" ? .13 : .08
    });

    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 36), mat);
    m.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_5_8_PERMANENT_HIGH_SKY_LOCK";
    m.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    m.scale.setScalar(cfg.scale);
    m.visible = true;
    m.frustumCulled = false;
    m.renderOrder = 2;
    m.userData.SVR_REAL_PLANET = kind;
    m.userData.SVR_1_5_8_SKY_LOCK = true;
    m.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(m);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 48, 24),
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent:true,
        opacity: kind === "moon" ? .18 : .11,
        depthWrite:false,
        side: THREE.DoubleSide
      })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_5_8_PERMANENT";
    halo.position.copy(m.position);
    halo.scale.setScalar(cfg.scale * 1.2);
    halo.renderOrder = 1;
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    halo.userData.SVR_1_5_8_SKY_LOCK = true;
    scene.add(halo);

    return m;
  }

  function lockPlanets(scene){
    const found = { moon:[], mars:[] };

    scene.traverse(obj => {
      const ud = obj.userData || {};
      const mat = obj.material || {};
      const text = String((obj.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (text.includes("moon") || ud.SVR_REAL_PLANET === "moon") found.moon.push(obj);
      if (text.includes("mars") || ud.SVR_REAL_PLANET === "mars") found.mars.push(obj);
    });

    function score(o){
      const mat = o.material || {};
      const ud = o.userData || {};
      return (ud.SVR_1_5_8_SKY_LOCK || ud.SVR_REAL_PLANET ? 500 : 0) +
             (mat.map ? 140 : 0) +
             (o.isMesh ? 10 : 0) +
             (o.visible ? 5 : 0);
    }

    function keep(kind){
      const cfg = CONFIG[kind];
      const list = found[kind];
      let main = list.slice().sort((a,b)=>score(b)-score(a))[0];

      if (!main) main = makePlanet(scene, kind, cfg);
      if (!main) return;

      list.forEach(o => {
        if (o === main) return;
        const mat = o.material || {};
        const ud = o.userData || {};
        if (!mat.map && !ud.SVR_DO_NOT_REMOVE && !ud.SVR_REAL_PLANET) {
          o.visible = false;
          if (o.parent) o.parent.remove(o);
        }
      });

      main.visible = true;
      main.frustumCulled = false;
      main.renderOrder = 2;
      if (main.position && main.position.set) main.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      if (main.scale && main.scale.setScalar) main.scale.setScalar(cfg.scale);
      main.userData = main.userData || {};
      main.userData.SVR_REAL_PLANET = kind;
      main.userData.SVR_1_5_8_SKY_LOCK = true;
      main.userData.SVR_PERMANENT_SKY_OBJECT = true;
    }

    keep("moon");
    keep("mars");
  }

  function capBlockingBuildings(scene){
    if (!scene || !scene.traverse) return;
    const c = CONFIG.sightline;

    scene.traverse(obj => {
      if (!obj || !obj.position) return;

      const ud = obj.userData || {};
      const name = String((obj.name || "") + " " + JSON.stringify(ud)).toLowerCase();

      const isBuilding =
        name.includes("building") ||
        name.includes("skyline") ||
        name.includes("tower") ||
        name.includes("megatron") ||
        name.includes("banner");

      if (!isBuilding) return;
      if (ud.SVR_PERMANENT_SKY_OBJECT || ud.SVR_REAL_PLANET) return;

      const p = obj.position;
      const insideCorridor = p.x >= c.minX && p.x <= c.maxX && p.z >= c.minZ && p.z <= c.maxZ;

      if (insideCorridor) {
        obj.userData = obj.userData || {};
        obj.userData.SVR_SKYLINE_TIER_LOCK = true;
        obj.userData.SVR_BLOCKING_MOON_MARS_CORRIDOR = true;

        // Lower/cap corridor objects, but do not delete. This preserves city while opening sky.
        if (p.y > c.maxBuildingY) p.y = c.maxBuildingY;

        if (obj.scale && typeof obj.scale.y === "number" && obj.scale.y > c.maxHeightScaleY) {
          obj.scale.y = c.maxHeightScaleY;
        }

        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => {
            if (m && "transparent" in m) {
              m.transparent = true;
              if (typeof m.opacity === "number" && m.opacity > .88) m.opacity = .88;
            }
          });
        }
      }

      // Assign permanent building tier metadata if missing.
      if (!obj.userData.SVR_BUILDING_TIER) {
        let tier = 3;
        if (name.includes("megatron") || name.includes("tier1") || name.includes("tier 1")) tier = 1;
        else if (name.includes("banner") || name.includes("tier2") || name.includes("tier 2")) tier = 2;

        obj.userData.SVR_BUILDING_TIER = tier;
        obj.userData.SVR_BUILDING_LOCATION_LOCK = {
          build: BUILD,
          originalName: obj.name || obj.uuid,
          lockedX: Number(p.x.toFixed ? p.x.toFixed(2) : p.x),
          lockedY: Number(p.y.toFixed ? p.y.toFixed(2) : p.y),
          lockedZ: Number(p.z.toFixed ? p.z.toFixed(2) : p.z),
          purpose: tier === 1 ? "Tier 1 megatron/sponsor anchor" : tier === 2 ? "Tier 2 sponsor banner" : "Tier 3 city filler/local banner",
          note: "Do not move without updating docs/SKYLINE_TIER_LOCK.json"
        };
      }
    });
  }

  function createManifestPanelData(){
    // Runtime-readable compact copy for diagnostics.
    window.SVR_SKYLINE_TIER_MANIFEST = {
      build: BUILD,
      moon: CONFIG.moon,
      mars: CONFIG.mars,
      sightline: CONFIG.sightline,
      tiers: CONFIG.tiers,
      rule: "Moon/Mars corridor must stay clear. Buildings inside corridor are capped below maxBuildingY."
    };
  }

  function apply(){
    const scene = getScene();
    if (!scene || !window.THREE) return;

    lockPlanets(scene);
    capBlockingBuildings(scene);
    createManifestPanelData();

    console.log("[SVR]", BUILD, "active: Moon/Mars high visibility corridor + building tier metadata lock");
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 700));
  setInterval(apply, 2500);

  window.SVR_158_SKYLINE_TIER_LOCK = {
    build: BUILD,
    config: CONFIG,
    apply
  };
})();
