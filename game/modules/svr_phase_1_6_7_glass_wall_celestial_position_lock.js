(function(){
  const BUILD = "VERSION-1.6.7-GLASS-WALL-CELESTIAL-POSITION-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const SKY = {
    moon: { x:-320, y:5200, z:-3600, scale:360, color:0xf3ead8, url:"./assets/textures/moon.jpg", spin:0.00009 },
    mars: { x: 300, y:5200, z:-4100, scale:300, color:0xc96a3b, url:"./assets/textures/mars.jpg", spin:0.00013 }
  };

  const GLASS = {
    // Wall-attached storefront glass, not on the carpet walkway.
    // The red carpet center remains clear.
    groupName: "SVR_REIKI_GLASS_WALL_ATTACHED_PHASE_1_6_7",
    z: -18.65,
    y: 3.25,
    leftX: -5.95,
    rightX: 5.95,
    width: 3.55,
    height: 5.95,
    archY: 6.25,
    trimColor: 0x00ffd5
  };

  const state = { scene:null, moon:null, mars:null, moonHalo:null, marsHalo:null, glass:null, loop:false };

  function getAScene(){
    return document.querySelector("a-scene");
  }

  function getScene(){
    const af = getAScene();
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
    let badge = document.getElementById("svr167BuildBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "svr167BuildBadge";
      badge.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.70);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(badge);
    }
    badge.textContent = "BUILD: " + BUILD;

    document.querySelectorAll("body *").forEach(el => {
      if (!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD:") || txt.includes("UPDATE-3.0") || txt.includes("VERSION-1.6.")) {
        el.textContent = "BUILD: " + BUILD;
        el.setAttribute("data-svr167-build-label-fixed","true");
      }
    });
  }

  function makePlanet(scene, key){
    if (!window.THREE || !scene) return null;
    const cfg = SKY[key];

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      map: tex(cfg.url),
      roughness: .9,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: key === "moon" ? .16 : .10
    });

    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    m.name = "SVR_REAL_" + key.toUpperCase() + "_PHASE_1_6_7_HIGH_SKY";
    m.position.set(cfg.x, cfg.y, cfg.z);
    m.scale.setScalar(cfg.scale);
    m.visible = true;
    m.frustumCulled = false;
    m.renderOrder = 300;
    m.userData.SVR_REAL_PLANET = key;
    m.userData.SVR_1_6_7_HIGH_SKY = true;
    m.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(m);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 32),
      new THREE.MeshBasicMaterial({ color:cfg.color, transparent:true, opacity:key === "moon" ? .17 : .11, depthWrite:false, side:THREE.DoubleSide })
    );
    halo.name = "SVR_" + key.toUpperCase() + "_HALO_PHASE_1_6_7";
    halo.position.copy(m.position);
    halo.scale.setScalar(cfg.scale * 1.14);
    halo.visible = true;
    halo.frustumCulled = false;
    halo.renderOrder = 299;
    halo.userData.SVR_REAL_PLANET_HALO = key;
    halo.userData.SVR_PERMANENT_SKY_OBJECT = true;
    scene.add(halo);

    state[key + "Halo"] = halo;
    return m;
  }

  function scorePlanet(o){
    const ud = o.userData || {};
    const mat = o.material || {};
    return (ud.SVR_1_6_7_HIGH_SKY ? 10000 : 0) + (ud.SVR_REAL_PLANET ? 1200 : 0) + (mat.map ? 200 : 0);
  }

  function lockPlanet(scene, key){
    const list = [];
    scene.traverse(o => {
      const ud = o.userData || {};
      const mat = o.material || {};
      const t = String((o.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes(key) || ud.SVR_REAL_PLANET === key) list.push(o);
    });

    let keep = list.slice().sort((a,b)=>scorePlanet(b)-scorePlanet(a))[0];
    if (!keep) keep = makePlanet(scene, key);

    list.forEach(o => {
      if (o === keep) return;
      if (!((o.userData || {}).SVR_DO_NOT_REMOVE)) {
        o.visible = false;
        o.userData = o.userData || {};
        o.userData.SVR_1_6_7_HIDDEN_OLD_PLANET = true;
      }
    });

    const cfg = SKY[key];
    if (keep) {
      keep.visible = true;
      keep.frustumCulled = false;
      keep.renderOrder = 300;
      keep.position.set(cfg.x, cfg.y, cfg.z);
      keep.scale.setScalar(cfg.scale);
      keep.userData = keep.userData || {};
      keep.userData.SVR_REAL_PLANET = key;
      keep.userData.SVR_1_6_7_HIGH_SKY = true;
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

  function hideOldGlassAndCarpetClutter(scene){
    scene.traverse(o => {
      if (!o || !o.position) return;
      const ud = o.userData || {};
      if (ud.SVR_1_6_7_GLASS_WALL_ATTACHED) return;

      const t = String((o.name || "") + " " + JSON.stringify(ud)).toLowerCase();

      const glassish = t.includes("glass") || t.includes("reiki_glass") || t.includes("wall_glass");
      const plantish = t.includes("plant") || t.includes("pot") || t.includes("fern");
      const ropeGrayPole = (t.includes("gray") || t.includes("grey")) && (t.includes("pole") || t.includes("rope"));

      // Remove / hide glass that is sitting near the red carpet/walkway.
      if (glassish && Math.abs(o.position.x) < 3.2 && o.position.z > -15.5 && o.position.z < 2.5) {
        o.visible = false;
        o.userData.SVR_1_6_7_HIDDEN_GLASS_ON_CARPET = true;
      }

      // Carpet must stay clear.
      if (plantish && Math.abs(o.position.x) < 2.2 && o.position.z > -9 && o.position.z < 4) {
        o.visible = false;
        o.userData.SVR_1_6_7_CARPET_CLEAR = true;
      }

      // Remove grey pole/rope sections when they clutter the storefront sides.
      if (ropeGrayPole && o.position.z > -15.5 && o.position.z < 1.5) {
        o.visible = false;
        o.userData.SVR_1_6_7_HIDDEN_GREY_POLE_ROPE = true;
      }
    });
  }

  function createGlassWall(scene){
    if (!window.THREE || !scene) return;
    if (state.glass && state.glass.parent) return;

    // Remove prior injected version if any.
    const old = scene.getObjectByName && scene.getObjectByName(GLASS.groupName);
    if (old && old.parent) old.parent.remove(old);

    const group = new THREE.Group();
    group.name = GLASS.groupName;
    group.position.set(0, 0, 0);
    group.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
    group.userData.SVR_ATTACHED_TO_REIKI_STOREFRONT_WALL = true;
    group.userData.SVR_RED_CARPET_CLEAR = true;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7fffee,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const trimMat = new THREE.MeshBasicMaterial({
      color: GLASS.trimColor,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const panelGeo = new THREE.PlaneGeometry(GLASS.width, GLASS.height);

    const left = new THREE.Mesh(panelGeo, glassMat);
    left.name = "SVR_REIKI_LEFT_WALL_ATTACHED_GLASS";
    left.position.set(GLASS.leftX, GLASS.y, GLASS.z);
    left.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
    group.add(left);

    const right = new THREE.Mesh(panelGeo, glassMat);
    right.name = "SVR_REIKI_RIGHT_WALL_ATTACHED_GLASS";
    right.position.set(GLASS.rightX, GLASS.y, GLASS.z);
    right.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
    group.add(right);

    // Top arch/header, attached near wall, not carpet.
    const arch = new THREE.Mesh(new THREE.PlaneGeometry(12.7, 0.22), trimMat);
    arch.name = "SVR_REIKI_FRONT_ARCH_WALL_ATTACHED";
    arch.position.set(0, GLASS.archY, GLASS.z + 0.015);
    arch.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
    group.add(arch);

    // Side trims.
    [["LEFT",GLASS.leftX-GLASS.width/2],["RIGHT",GLASS.rightX+GLASS.width/2]].forEach(([name,x]) => {
      const trim = new THREE.Mesh(new THREE.PlaneGeometry(.16, GLASS.height + .25), trimMat);
      trim.name = "SVR_REIKI_" + name + "_GLASS_SIDE_TRIM";
      trim.position.set(x, GLASS.y, GLASS.z + 0.02);
      trim.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
      group.add(trim);
    });

    // Bottom is above floor/wall line and not on carpet.
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(12.7, .12), trimMat);
    bottom.name = "SVR_REIKI_GLASS_BOTTOM_WALL_LINE";
    bottom.position.set(0, .42, GLASS.z + 0.02);
    bottom.userData.SVR_1_6_7_GLASS_WALL_ATTACHED = true;
    group.add(bottom);

    scene.add(group);
    state.glass = group;
  }

  function capSkyline(scene){
    const c = { minX:-1200, maxX:1050, minZ:-4550, maxZ:-650, maxY:170, maxScaleY:.66 };
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
      o.userData.SVR_1_6_7_CAPPED_FOR_HIGH_PLANETS = true;
      if (p.y > c.maxY) p.y = c.maxY;
      if (o.scale && typeof o.scale.y === "number" && o.scale.y > c.maxScaleY) o.scale.y = c.maxScaleY;
    });
  }

  function apply(){
    stampBuild();
    const scene = getScene();
    if (!scene || !window.THREE) return;

    state.scene = scene;
    lockPlanet(scene, "moon");
    lockPlanet(scene, "mars");
    createGlassWall(scene);
    hideOldGlassAndCarpetClutter(scene);
    capSkyline(scene);

    if (!state.loop) {
      state.loop = true;
      requestAnimationFrame(tick);
    }

    console.log("[SVR]", BUILD, "active: glass attached to storefront wall; Moon/Mars high sky");
  }

  function tick(){
    requestAnimationFrame(tick);
    ["moon","mars"].forEach(key => {
      const obj = state[key];
      if (!obj) return;
      const cfg = SKY[key];
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
  setInterval(apply, 1200);

  window.SVR_167_GLASS_WALL_CELESTIAL_LOCK = { build: BUILD, sky: SKY, glass: GLASS, apply };
})();
