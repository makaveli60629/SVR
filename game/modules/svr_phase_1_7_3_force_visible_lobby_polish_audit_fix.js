(function(){
  const BUILD = "VERSION-1.7.3-FORCE-VISIBLE-LOBBY-POLISH-AUDIT-FIX";
  const ROOT_ID = "svr.module.lobby.polish.primary";
  window.SVR_BUILD_LABEL = BUILD;

  const CFG = {
    yBase: 0.05,
    visible: true,
    forceAfterLoad: true,
    moduleIds: {
      root: "svr.module.lobby.polish.primary",
      directory: "svr.module.lobby.directory.primary",
      rings: "svr.module.lobby.portal-rings.primary",
      daily: "svr.module.lobby.daily-board.primary",
      welcome: "svr.module.lobby.spawn-welcome.primary",
      inspector: "svr.module.lobby.lock-inspector.primary",
      vip: "svr.module.lobby.vip-route.primary",
      silhouettes: "svr.module.lobby.ambient-silhouettes.primary",
      performance: "svr.module.lobby.performance-guard.primary"
    }
  };

  const PORTALS = [
    {k:"POKER", x:0, z:-2.4, color:0xffd36a, radius:2.1},
    {k:"REIKI / RICI", x:6.3, z:-7.2, color:0x9b6cff, radius:1.55},
    {k:"PGA", x:6.4, z:5.0, color:0x36ff88, radius:1.45},
    {k:"VIBES THEATER", x:-7.3, z:-4.9, color:0xffcc66, radius:1.55},
    {k:"SCORPION", x:-6.4, z:5.1, color:0xff4b35, radius:1.35},
    {k:"LOUNGE", x:-2.5, z:7.2, color:0xc58a52, radius:1.2},
    {k:"VR STORE", x:2.5, z:7.2, color:0x66f5ff, radius:1.2}
  ];

  function isQuestOrMobile(){
    return /Android|Quest|Mobile|OculusBrowser|MetaQuest/i.test(navigator.userAgent || "");
  }

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

  function mat(color, opacity, emissiveIntensity){
    return new THREE.MeshStandardMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: .32,
      metalness: .08,
      emissive: color,
      emissiveIntensity: emissiveIntensity === undefined ? .12 : emissiveIntensity,
      side: THREE.DoubleSide
    });
  }

  function basic(color, opacity){
    return new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  function box(w,h,d,color,opacity,emissiveIntensity){
    return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color, opacity === undefined ? 1 : opacity, emissiveIntensity));
  }

  function makeText(msg, w, h, px, color){
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color || "#ffffff";
    ctx.shadowColor = color || "#ffffff";
    ctx.shadowBlur = 22;
    ctx.font = "900 " + px + "px Arial, sans-serif";
    const lines = String(msg).split("\n");
    const lh = px * 1.18;
    lines.forEach((line,i)=>ctx.fillText(line, canvas.width/2, canvas.height/2 + (i-(lines.length-1)/2)*lh));
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  }

  function panel(title, body, w, h, accent){
    const g = new THREE.Group();
    const back = box(w,h,.12,0x03030a,.92,.06);
    g.add(back);
    const top = box(w+.18,.08,.16,accent || 0xffcc66,1,.26);
    top.position.y = h/2 + .07;
    g.add(top);
    const bot = box(w+.18,.055,.16,0x00eaff,1,.20);
    bot.position.y = -h/2 - .055;
    g.add(bot);
    const titleText = makeText(title,w*.96,h*.25,118,"#ffe69a");
    titleText.position.z = .09;
    titleText.position.y = h*.30;
    g.add(titleText);
    const bodyText = makeText(body,w*.92,h*.70,64,"#eaffff");
    bodyText.position.z = .10;
    bodyText.position.y = -h*.10;
    g.add(bodyText);
    return g;
  }

  function removeOld(scene){
    const rm = [];
    scene.traverse(o=>{
      const s = String(o.name||"");
      const id = (o.userData||{}).SVR_MODULE_ID;
      if (s.includes("SVR_LOBBY_POLISH_1_7_") || id === ROOT_ID) rm.push(o);
    });
    rm.forEach(o=>{ if(o.parent) o.parent.remove(o); });
  }

  function addBigVisibleAnchor(root){
    const p = panel("SVR LOBBY POLISH ACTIVE", "Directory â€¢ Portal Rings â€¢ Daily Board â€¢ Lock Inspector\nThis marker confirms the patch is loaded.", 6.2, 1.45, 0xffcc66);
    p.name = "SVR_LOBBY_POLISH_1_7_3_BIG_VISIBLE_CONFIRMATION";
    p.userData.SVR_MODULE_ID = CFG.moduleIds.welcome;
    p.position.set(0,3.0,2.95);
    p.rotation.y = Math.PI;
    root.add(p);
  }

  function addDirectory(root){
    const body = "POKER TABLE\nREIKI / RICI PREVIEW\nPGA GOLF HUB\nVIBES THEATER\nSMOKER LOUNGE\nSCORPION ROOM\nVR STORE\nEVENTS / GIVEAWAYS";
    const d = panel("SVR LOBBY DIRECTORY", body, 4.4, 3.25, 0x00eaff);
    d.name = "SVR_LOBBY_POLISH_1_7_3_DIRECTORY_BOARD";
    d.userData.SVR_MODULE_ID = CFG.moduleIds.directory;
    d.position.set(-4.7,2.75,2.55);
    d.rotation.y = Math.PI*.86;
    root.add(d);
  }

  function addDaily(root){
    const body = "Daily Chip Bonus: 5,000\nFeatured Room: VIBES Theater\nReiki Preview: Approval Pending\nNext Poker Event: Coming Soon\nSponsor Slots: Open";
    const d = panel("TODAY IN SVR", body, 4.4, 2.35, 0xd28bff);
    d.name = "SVR_LOBBY_POLISH_1_7_3_DAILY_ACTIVITY_BOARD";
    d.userData.SVR_MODULE_ID = CFG.moduleIds.daily;
    d.position.set(4.7,2.68,2.65);
    d.rotation.y = -Math.PI*.86;
    root.add(d);
  }

  function addRings(root){
    const group = new THREE.Group();
    group.name = "SVR_LOBBY_POLISH_1_7_3_PORTAL_RING_GROUP";
    group.userData.SVR_MODULE_ID = CFG.moduleIds.rings;
    PORTALS.forEach((p,idx)=>{
      const ring = new THREE.Mesh(new THREE.RingGeometry(p.radius*.76, p.radius, 128), basic(p.color, .52));
      ring.name = "SVR_LOBBY_PORTAL_RING_FORCE_VISIBLE_" + p.k.replace(/\W+/g,"_");
      ring.position.set(p.x,.055,p.z);
      ring.rotation.x = -Math.PI/2;
      ring.renderOrder = 999;
      ring.userData.SVR_PULSE = true;
      ring.userData.SVR_BASE_OPACITY = .52;
      group.add(ring);

      const label = makeText("ENTER\n" + p.k, 1.6, .62, 130, "#ffffff");
      label.name = "SVR_LOBBY_PORTAL_RING_LABEL_" + idx;
      label.position.set(p.x,.08,p.z+p.radius+.30);
      label.rotation.x = -Math.PI/2;
      label.renderOrder = 1000;
      group.add(label);
    });
    root.add(group);
  }

  function addVipRoute(root){
    const group = new THREE.Group();
    group.name = "SVR_LOBBY_POLISH_1_7_3_VIP_ROUTE_LIGHTING";
    group.userData.SVR_MODULE_ID = CFG.moduleIds.vip;
    const pts = [[0,3.6],[0,1.0],[0,-1.8],[3.5,-5.3],[6.2,-7.2],[2.0,-3.8],[-2.0,-3.8],[-7.1,-4.9],[-3.0,2.6],[3.0,2.7]];
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      const dx=b[0]-a[0], dz=b[1]-a[1], len=Math.sqrt(dx*dx+dz*dz);
      const bar = box(.10,.04,len, i%2 ? 0x9b6cff : 0xffcc66, .72, .20);
      bar.name = "SVR_LOBBY_VIP_ROUTE_BAR_" + i;
      bar.position.set((a[0]+b[0])/2,.06,(a[1]+b[1])/2);
      bar.rotation.y = Math.atan2(dx,dz);
      group.add(bar);
    }
    root.add(group);
  }

  function addSilhouettes(root){
    const group = new THREE.Group();
    group.name = "SVR_LOBBY_POLISH_1_7_3_AMBIENT_SILHOUETTES";
    group.userData.SVR_MODULE_ID = CFG.moduleIds.silhouettes;
    const spots = [
      [-6.4,-3.2,0xffcc66], [5.0,-6.2,0x9b6cff], [5.4,4.2,0x36ff88], [-2.4,-.6,0xffffff], [2.4,6.2,0x66f5ff]
    ];
    spots.forEach((s,i)=>{
      const npc = new THREE.Group();
      npc.name = "SVR_AMBIENT_GUEST_SILHOUETTE_" + i;
      npc.userData.SVR_AMBIENT_SILHOUETTE = true;
      npc.userData.SVR_NOT_POKER_BOT = true;
      npc.position.set(s[0],.08,s[1]);
      const body = box(.34,1.10,.22,0x08080d,.84,.02);
      body.position.y = .78;
      npc.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.18,24,12), mat(0x08080d,.88,.06));
      head.position.y = 1.50;
      npc.add(head);
      const halo = new THREE.Mesh(new THREE.RingGeometry(.25,.28,32), basic(s[2],.55));
      halo.position.y = 1.50;
      halo.rotation.y = Math.PI/2;
      npc.add(halo);
      group.add(npc);
    });
    root.add(group);
  }

  function addInspector(root){
    const body = "Moon: Locked\nMars: Locked\nAndroid Controls: Locked\nQuest Controls: Locked\nPoker Table: Locked\nReiki/RICI: Locked\nPGA: Locked\nVIBES Theater: Locked\nScorpion: Locked\nSmoker Lounge: Locked\nVR Store: Locked";
    const d = panel("SVR MODULE LOCK STATUS", body, 5.0, 2.75, 0x20ffb0);
    d.name = "SVR_LOBBY_POLISH_1_7_3_MODULE_LOCK_INSPECTOR";
    d.userData.SVR_MODULE_ID = CFG.moduleIds.inspector;
    d.position.set(0,4.18,4.35);
    d.rotation.y = Math.PI;
    d.visible = location.search.includes("debug=1") || location.search.includes("qa=1") || location.hash.includes("debug");
    root.add(d);

    const dot = box(.34,.34,.08,0x20ffb0,.95,.36);
    dot.name = "SVR_LOCK_STATUS_DOT_PUBLIC_1_7_3";
    dot.position.set(0,3.55,4.55);
    dot.rotation.y = Math.PI;
    root.add(dot);
  }

  function addCameraLabels(root){
    const labels = [
      ["CAM 3 â€” LOBBY PREVIEW",-3.5,9.2],
      ["CAM 4 â€” RICI PRESENTATION",0,9.2],
      ["CAM 5 â€” VIBES THEATER",3.5,9.2]
    ];
    labels.forEach(l=>{
      const t = makeText(l[0],2.2,.42,94,"#dffcff");
      t.name = "SVR_CAMERA_ROUTE_LABEL_" + l[0].split(" ")[1];
      t.position.set(l[1],2.05,l[2]);
      t.rotation.y = Math.PI;
      root.add(t);
    });
  }

  function badge(){
    let el = document.getElementById("svr173BuildBadge");
    if(!el){
      el = document.createElement("div");
      el.id = "svr173BuildBadge";
      el.style.cssText = "position:fixed;left:10px;top:8px;z-index:2147483600;border:2px solid #20ffb0;border-radius:10px;background:rgba(0,0,0,.82);color:#eaffff;font:900 12px Consolas,monospace;padding:8px 10px;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = "LIVE BUILD: " + BUILD;
  }

  function apply(){
    badge();
    window.SVR_PERFORMANCE_GUARD = {
      build: BUILD,
      lowPerf: isQuestOrMobile(),
      decorativePulseHz: isQuestOrMobile() ? 12 : 30,
      overlayOnly: true
    };

    const scene = getScene();
    if(!scene || !window.THREE) {
      console.warn("[SVR]", BUILD, "waiting for THREE scene");
      return;
    }

    removeOld(scene);

    const root = new THREE.Group();
    root.name = "SVR_LOBBY_POLISH_1_7_3_ROOT_FORCE_VISIBLE";
    root.userData.SVR_MODULE_ID = ROOT_ID;
    root.userData.SVR_LOCKED = true;
    root.userData.SVR_VERSION = BUILD;
    root.userData.SVR_OVERLAY_ONLY = true;

    addBigVisibleAnchor(root);
    addDirectory(root);
    addDaily(root);
    addRings(root);
    addVipRoute(root);
    addSilhouettes(root);
    addInspector(root);
    addCameraLabels(root);

    scene.add(root);

    function tick(){
      const t = performance.now()*.003;
      root.traverse(o=>{
        if((o.userData||{}).SVR_PULSE && o.material){
          o.material.opacity = .44 + Math.sin(t)*.10;
          const s = 1 + Math.sin(t)*.06;
          o.scale.set(s,s,s);
        }
        if((o.userData||{}).SVR_AMBIENT_SILHOUETTE){
          o.rotation.y += isQuestOrMobile() ? .0008 : .0015;
        }
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    window.SVR_173_LOBBY_POLISH_AUDIT = {
      build: BUILD,
      loaded: true,
      visibleConfirmation: true,
      root: ROOT_ID,
      timestamp: new Date().toISOString()
    };

    console.log("[SVR]", BUILD, "FORCE VISIBLE lobby polish loaded");
  }

  // Run repeatedly during boot because the game may create the scene after scripts load.
  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", () => setTimeout(apply, 500));
  setTimeout(apply, 1200);
  setTimeout(apply, 2500);
  setTimeout(apply, 5000);

  window.SVR_173_LOBBY_POLISH_AUDIT_FIX = { build: BUILD, apply };
})();
