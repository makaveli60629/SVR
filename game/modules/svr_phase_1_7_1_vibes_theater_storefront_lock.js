(function(){
  const BUILD = "VERSION-1.7.1-VIBES-THEATER-STOREFRONT-LOCK";
  const MODULE_ID = "svr.module.theater.vibes.storefront.primary";
  window.SVR_BUILD_LABEL = BUILD;

  const CFG = {
    moduleId: MODULE_ID,
    name: "SVR VIBES THEATER",
    subtitle: "VR CINEMA â€¢ STORIES â€¢ PREMIERES",
    locationLabel: "west_wall_clothes_screen_replacement",
    groupPosition: [-11.6, 2.4, -4.8],
    groupRotationY: Math.PI / 2,
    protectLegends: true,
    route: "/game/?scene=vibes-theater"
  };

  function getScene(){
    const af = document.querySelector("a-scene");
    if (af && af.object3D && af.object3D.add) return af.object3D;
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add) return window[k];
      if (window[k] && window[k].object3D && window[k].object3D.add) return window[k].object3D;
    }
    if (window.world && window.world.scene && window.world.scene.add) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function makeText(msg, size, color){
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.font = "900 " + size + "px Arial Black, Impact, sans-serif";
    const lines = String(msg).split("\n");
    lines.forEach((line, i) => ctx.fillText(line, canvas.width/2, canvas.height/2 + (i-(lines.length-1)/2)*size*1.15));
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true, side:THREE.DoubleSide, depthWrite:false });
    return new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.2), mat);
  }

  function box(w,h,d, color, opacity, emissive){
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.28,
      metalness: 0.15,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.18 : 0
    });
    return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  }

  function cyl(r,h,color,opacity){
    const mat = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness:.3, roughness:.25, emissive:color, emissiveIntensity:.07 });
    return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24), mat);
  }

  function hideOldClothesScreen(scene){
    const candidates = [];
    scene.traverse(o => {
      if (!o || !o.position) return;
      const ud = o.userData || {};
      const txt = String((o.name||"") + " " + JSON.stringify(ud)).toLowerCase();
      const isClothes = /clothes|clothing|apparel|fashion|wardrobe|avatar wear|main clothes/.test(txt);
      const isLegend = /legend|hall.?of.?fame|statue|trophy|pedestal/.test(txt);
      const inWestZone = o.position.x < -3.0 && o.position.x > -25.0 && o.position.z > -18.0 && o.position.z < 12.0;
      if (isClothes && !isLegend && inWestZone) candidates.push(o);
    });
    candidates.forEach(o => {
      o.visible = false;
      o.userData = o.userData || {};
      o.userData.SVR_HIDDEN_BY_VIBES_THEATER_1_7_1 = true;
    });
    return candidates.length;
  }

  function clearExisting(scene){
    const remove = [];
    scene.traverse(o => {
      if ((o.userData||{}).SVR_MODULE_ID === MODULE_ID || String(o.name||"").includes("SVR_VIBES_THEATER_1_7_1")) remove.push(o);
    });
    remove.forEach(o => o.parent && o.parent.remove(o));
  }

  function addTheater(scene){
    if (!window.THREE || !scene) return;
    clearExisting(scene);
    const hidden = hideOldClothesScreen(scene);

    const g = new THREE.Group();
    g.name = "SVR_VIBES_THEATER_1_7_1_GROUP";
    g.userData.SVR_MODULE_ID = MODULE_ID;
    g.userData.SVR_LOCKED = true;
    g.userData.SVR_VERSION = BUILD;
    g.position.set(CFG.groupPosition[0], CFG.groupPosition[1], CFG.groupPosition[2]);
    g.rotation.y = CFG.groupRotationY;

    const facade = box(8.2, 5.3, .22, 0x06030d, .86, 0x200040);
    facade.name = "SVR_VIBES_THEATER_FACADE";
    g.add(facade);

    const topTrim = box(8.7,.16,.28,0xffcc66,1,0xffaa22);
    topTrim.position.set(0,2.75,.08); g.add(topTrim);
    const bottomTrim = box(8.7,.12,.28,0xffcc66,1,0xffaa22);
    bottomTrim.position.set(0,-2.75,.08); g.add(bottomTrim);
    const leftTrim = box(.13,5.5,.28,0xffcc66,1,0xffaa22);
    leftTrim.position.set(-4.18,0,.08); g.add(leftTrim);
    const rightTrim = box(.13,5.5,.28,0xffcc66,1,0xffaa22);
    rightTrim.position.set(4.18,0,.08); g.add(rightTrim);

    const marquee = box(7.4,1.0,.35,0x120019,.94,0x6e00ff);
    marquee.name = "SVR_VIBES_THEATER_MARQUEE";
    marquee.position.set(0,2.05,.18);
    g.add(marquee);

    const title = makeText("SVR VIBES THEATER", 132, "#ffe7a3");
    title.name = "SVR_VIBES_THEATER_TITLE_TEXT";
    title.position.set(0,2.08,.39);
    g.add(title);

    const subtitle = makeText("VR CINEMA â€¢ STORIES â€¢ PREMIERES", 72, "#9fffff");
    subtitle.name = "SVR_VIBES_THEATER_SUBTITLE_TEXT";
    subtitle.position.set(0,1.38,.40);
    subtitle.scale.setScalar(.72);
    g.add(subtitle);

    const screen = box(4.9,2.35,.18,0x050010,.97,0x330066);
    screen.name = "SVR_VIBES_THEATER_PREVIEW_SCREEN";
    screen.position.set(0,-.35,.20);
    g.add(screen);

    const screenText = makeText("COMING SOON\nCOMMUNITY STORIES + FEATURE SCREENINGS", 86, "#ffffff");
    screenText.name = "SVR_VIBES_THEATER_SCREEN_TEXT";
    screenText.position.set(0,-.35,.42);
    screenText.scale.set(.78,.78,.78);
    g.add(screenText);

    const p1 = box(1.25,2.35,.14,0x100018,.96,0x2a0044);
    p1.position.set(-3.25,-.35,.22); g.add(p1);
    const p1t = makeText("INDIE\nVR\nFILMS", 80, "#ff7cff");
    p1t.position.set(-3.25,-.35,.43); p1t.scale.set(.32,.55,.32); g.add(p1t);

    const p2 = box(1.25,2.35,.14,0x100018,.96,0x003344);
    p2.position.set(3.25,-.35,.22); g.add(p2);
    const p2t = makeText("STORY\nNIGHT", 86, "#7ffcff");
    p2t.position.set(3.25,-.35,.43); p2t.scale.set(.34,.56,.34); g.add(p2t);

    const portal = box(2.8,.75,.18,0x001b24,.85,0x00d5ff);
    portal.name = "SVR_VIBES_THEATER_PORTAL_ENTER_VR_CINEMA";
    portal.position.set(0,-2.08,.32);
    portal.userData.SVR_MODULE_ID = "svr.module.theater.vibes.portal";
    portal.userData.SVR_ROUTE = CFG.route;
    g.add(portal);

    const portalText = makeText("ENTER VR CINEMA", 94, "#aaffff");
    portalText.name = "SVR_VIBES_THEATER_PORTAL_TEXT";
    portalText.position.set(0,-2.08,.53);
    portalText.scale.set(.54,.42,.54);
    g.add(portalText);

    const carpet = box(3.7,.035,4.2,0x8b001a,.92,0x180000);
    carpet.name = "SVR_VIBES_THEATER_RED_CARPET";
    carpet.position.set(0,-2.78,2.35);
    g.add(carpet);

    [-2.25, 2.25].forEach(x => {
      [-.25,1.45,3.0].forEach(z => {
        const post = cyl(.055,.88,0xffcc66,1);
        post.position.set(x,-2.32,z);
        g.add(post);
      });
      const rail = box(.07,.07,3.3,0xffcc66,1,0xffaa22);
      rail.position.set(x,-1.9,1.38);
      g.add(rail);
    });

    const bars = [];
    for (let i=0;i<9;i++){
      const b = box(.18,.08,.18, i%2 ? 0x00eaff : 0xb000ff, 1, i%2 ? 0x00eaff : 0xb000ff);
      b.position.set(-3.2 + i*.8, 2.72, .36);
      b.userData.SVR_VIBES_LIGHT_BAR = true;
      bars.push(b);
      g.add(b);
    }

    scene.add(g);

    function tick(){
      const t = performance.now() * .002;
      bars.forEach((b,i) => {
        const s = .8 + Math.sin(t + i*.75)*.18;
        b.scale.setScalar(s);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    console.log("[SVR]", BUILD, "added", MODULE_ID, "hidden clothes objects:", hidden);
  }

  function badge(){
    let el = document.getElementById("svr171BuildBadge");
    if (!el) {
      el = document.createElement("div");
      el.id = "svr171BuildBadge";
      el.style.cssText = "position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(255,205,90,.7);border-radius:10px;background:rgba(0,0,0,.72);color:#ffe9a6;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = "BUILD: " + BUILD;
  }

  function apply(){
    badge();
    const scene = getScene();
    if (!scene || !window.THREE) return;
    addTheater(scene);
  }

  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 900));
  setTimeout(apply, 1800);

  window.SVR_171_VIBES_THEATER_LOCK = { build: BUILD, config: CFG, apply };
})();
