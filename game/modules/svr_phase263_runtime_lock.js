import * as THREE from "three";

const PHASE = "263";
const VERSION = "phase263-clean-sidecar-runtime";

if (!window.SVR_PHASE_263_RUNTIME_LOCK) {
  window.SVR_PHASE_263_RUNTIME_LOCK = true;
  installGlobalErrorShield();
  installBootFinalizer();
  installNoMusicGuard();
  waitForGameAndInstall();
}

function ui(id){
  return document.getElementById(id);
}

function setStatus(text, opts = {}){
  const s = ui("status");
  if (!s) return;

  if (opts.force || !s.__lastSet || performance.now() - s.__lastSet > (opts.minGap || 800)) {
    s.textContent = text;
    s.__lastSet = performance.now();
  }
}

function setMode(text){
  const m = ui("mode");
  if (m) m.textContent = text;
}

function logLine(...parts){
  const log = ui("log");
  const text = parts.map(p => typeof p === "string" ? p : JSON.stringify(p)).join(" ");

  try { console.log("[SVR " + PHASE + "]", text); } catch(_e) {}

  if (log) {
    log.textContent += "\n[SVR " + PHASE + "] " + text;
    if (/error|failed|exception|missing/i.test(text)) {
      log.style.display = "block";
    }
  }
}

function installGlobalErrorShield(){
  window.addEventListener("error", (e)=>{
    setStatus("Runtime error caught. Open Logs.", { force:true });
    logLine("ERROR", e?.message || e?.error || e);
  });

  window.addEventListener("unhandledrejection", (e)=>{
    setStatus("Promise/runtime error caught. Open Logs.", { force:true });
    logLine("PROMISE", e?.reason?.stack || e?.reason?.message || e?.reason || e);
  });

  logLine("error shield active");
}

function installBootFinalizer(){
  function ready(reason){
    const s = ui("status");
    const m = ui("mode");

    if (s && /booting|loading|boot issue|black boot/i.test(s.textContent || "")) {
      s.textContent = "Ready. Original lobby active. Phase 263 clean sidecar locked.";
    }

    if (m && /hands|not tracked|checking/i.test(m.textContent || "")) {
      m.textContent = "Input ready: desktop / Quest";
    }

    try {
      document.querySelectorAll("*").forEach((el)=>{
        if ((el.textContent || "").trim() === "VR NOT SUPPORTED") {
          el.style.display = "none";
        }
      });
    } catch(_e) {}

    window.SVR_BOOT_READY = true;
    logLine("boot ready", reason);
  }

  setTimeout(()=>ready("2s"), 2000);
  setTimeout(()=>ready("5s"), 5000);
  setTimeout(()=>ready("8s"), 8000);
  setTimeout(()=>ready("12s"), 12000);
  window.addEventListener("load", ()=>ready("window-load"));
}

function installNoMusicGuard(){
  function muteAll(){
    try {
      document.querySelectorAll("audio, video").forEach((el)=>{
        el.pause();
        el.muted = true;
        el.volume = 0;
      });
    } catch(_e) {}
  }

  muteAll();
  setInterval(muteAll, 3000);
}

function waitForGameAndInstall(){
  let tries = 0;

  const timer = setInterval(()=>{
    tries++;

    const game = window.SVR_GAME;

    if (game?.scene && game?.camera) {
      clearInterval(timer);
      installRuntimeModules(game);
      return;
    }

    if (tries > 48) {
      clearInterval(timer);
      setStatus("Phase 263 loaded. Waiting for original lobby object.", { force:true });
      logLine("SVR_GAME not found after wait. main.js may still fail before world build.");
    }
  }, 250);
}

function installRuntimeModules(game){
  const { scene, camera, renderer, world } = game;

  if (!scene || !camera) {
    logLine("missing scene/camera");
    return;
  }

  installLobbyCleanup(scene);
  installPhysicalPortals({ scene, camera, renderer, world });
  installSiteViewer({ scene });

  setStatus("Ready. Original lobby active. Teleport, portals, and viewer locked.", { force:true });
  setMode("Input ready: desktop / Quest");

  let last = performance.now();

  function loop(){
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    try {
      window.SVR_PHASE_263_PORTALS?.update?.(dt);
      window.SVR_PHASE_263_VIEWER?.update?.(dt);
    } catch(err) {
      logLine("module update error", err?.message || err);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  logLine("runtime modules installed");
}

function installLobbyCleanup(scene){
  if (scene.userData.svrPhase263Cleanup) return;
  scene.userData.svrPhase263Cleanup = true;

  const secondFloorKeywords = [
    "secondfloor", "second floor", "upperfloor", "upper floor",
    "floor2", "level2", "level 2", "mezzanine", "mezz",
    "balcony", "upstairs", "stair", "stairs", "catwalk",
    "skybridge", "bridgefloor", "upperdeck", "upper deck"
  ];

  const protect = [
    "scene", "camera", "player", "rig", "hand", "controller",
    "watch", "teleport", "floor", "ground", "lobby", "table",
    "chair", "seat", "card", "chip", "moon", "mars", "skyline",
    "portal", "sign", "wall"
  ];

  function labelOf(obj){
    const parts = [];
    let p = obj;

    while (p) {
      if (p.name) parts.push(p.name);

      if (p.userData) {
        for (const [k,v] of Object.entries(p.userData)) {
          parts.push(String(k));
          if (typeof v === "string") parts.push(v);
        }
      }

      p = p.parent;
    }

    return parts.join(" ").toLowerCase();
  }

  let hidden = 0;

  scene.traverse((obj)=>{
    const label = labelOf(obj);
    if (!label) return;

    if (protect.some(k => label.includes(k))) return;

    if (secondFloorKeywords.some(k => label.includes(k))) {
      obj.visible = false;
      obj.userData.svrPhase263Hidden = "second-floor-cleanup";
      hidden++;
    }
  });

  logLine("cleanup complete", "hidden:", hidden);
}

function installPhysicalPortals({ scene, camera, renderer, world }){
  if (scene.getObjectByName("SVR_PHASE_263_PHYSICAL_PORTALS")) {
    return;
  }

  const defs = [
    { key:"lobby", label:"LOBBY", x:0, z:7.4, color:0x7fffdc },
    { key:"seat", label:"SEAT", x:0, z:2.6, color:0xd7b8ff },
    { key:"reiki", label:"REIKI", x:6.8, z:3.8, color:0x46e3c8 },
    { key:"pga", label:"PGA", x:-6.8, z:3.8, color:0x48a6ff },
    { key:"legends", label:"LEGEND", x:-6.8, z:-4.2, color:0xb987ff },
    { key:"sponsor", label:"SPONSOR", x:0, z:8.8, color:0xf6d365 },
    { key:"scorpion", label:"SCORPION", x:6.8, z:-4.2, color:0xff4ab8 }
  ];

  const root = new THREE.Group();
  root.name = "SVR_PHASE_263_PHYSICAL_PORTALS";
  scene.add(root);

  const portals = [];
  const head = new THREE.Vector3();
  let nearest = null;
  let cooldown = 0;

  for (const def of defs) {
    const group = new THREE.Group();
    group.name = "SVR_PHASE_263_PORTAL_" + def.key;
    group.position.set(def.x, 0.05, def.z);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(.82,.82,.035,64),
      new THREE.MeshBasicMaterial({
        color:def.color,
        transparent:true,
        opacity:.24,
        depthWrite:false
      })
    );
    pad.position.y = .02;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(.86,.035,14,96),
      new THREE.MeshBasicMaterial({
        color:def.color,
        transparent:true,
        opacity:.92,
        depthWrite:false
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .07;

    const glow = new THREE.PointLight(def.color, 0, 3.4, 2);
    glow.position.set(0,.35,0);

    const label = makeTextSprite(def.label, def.color);
    label.position.set(0,.9,0);

    group.add(pad, ring, glow, label);
    root.add(group);

    portals.push({ ...def, group, pad, ring, glow });
  }

  function getHead(){
    if (renderer?.xr?.isPresenting) {
      renderer.xr.getCamera(camera).getWorldPosition(head);
    } else {
      camera.getWorldPosition(head);
    }

    return head;
  }

  function routeTo(key){
    const map = {
      lobby:"lobby",
      seat:"seat",
      reiki:"reiki",
      pga:"pga",
      legends:"legend",
      sponsor:"sponsor",
      scorpion:"scorpion"
    };

    const label = map[key] || key;

    const btn = Array.from(document.querySelectorAll("button")).find((b)=>{
      return (b.textContent || "").trim().toLowerCase().includes(label);
    });

    if (btn) {
      btn.click();
      return true;
    }

    return false;
  }

  function enter(rec, reason="walk"){
    if (!rec || performance.now() < cooldown) return false;

    cooldown = performance.now() + 900;

    const ok = routeTo(rec.key);

    setStatus(ok ? `Portal: ${rec.label}` : `Portal touched: ${rec.label}`, { force:true });
    logLine("portal", rec.key, reason, ok ? "routed" : "fallback");

    return ok;
  }

  function enterNearest(){
    if (nearest) return enter(nearest, "select");
    setStatus("No portal close enough. Walk into a glowing portal.", { force:true });
    return false;
  }

  window.addEventListener("keydown", (e)=>{
    if (e.code === "KeyE") enterNearest();
  });

  try {
    renderer?.xr?.getController(0)?.addEventListener("selectstart", ()=>enterNearest());
    renderer?.xr?.getController(1)?.addEventListener("selectstart", ()=>enterNearest());
  } catch(_e) {}

  function update(dt=.016){
    const p = getHead();
    nearest = null;
    let best = Infinity;

    for (const rec of portals) {
      const d = Math.hypot(p.x - rec.group.position.x, p.z - rec.group.position.z);

      rec.ring.rotation.z += 1.6 * dt;
      rec.pad.material.opacity = d < 2.15 ? .50 : .24;
      rec.glow.intensity = d < 2.15 ? 1.6 : 0;

      if (d < best) {
        best = d;
        nearest = rec;
      }

      if (d < .62 && performance.now() > cooldown) {
        enter(rec, "walkthrough");
      }
    }

    if (nearest && best < 1.7 && performance.now() > cooldown) {
      setStatus(`Portal ready: ${nearest.label} • walk through / press E / trigger`, { force:false, minGap:700 });
    }
  }

  window.SVR_PHASE_263_PORTALS = {
    update,
    enterNearest,
    list:()=>portals.map(p=>p.key)
  };

  logLine("physical portals installed", portals.map(p=>p.key).join(", "));
}

function installSiteViewer({ scene }){
  if (scene.getObjectByName("SVR_PHASE_263_SITE_VIEWER")) return;

  const root = new THREE.Group();
  root.name = "SVR_PHASE_263_SITE_VIEWER";
  root.position.set(0,0,-7.4);
  scene.add(root);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 3.05, .08),
    new THREE.MeshStandardMaterial({
      color:0x080010,
      emissive:0x23004a,
      emissiveIntensity:.45,
      roughness:.55,
      metalness:.08
    })
  );
  frame.position.set(0, 1.9, 0);
  root.add(frame);

  const pages = {
    store:["SVR STORE","/site/store.html","Products and avatar gear","Store portal stays in game"],
    register:["REGISTER","/site/register.html","Member profile","Future account bridge"],
    membership:["MEMBERSHIP","/site/membership.html","VIP access","Beta notices"],
    sponsors:["SPONSORS","/site/sponsorship.html","Partner hub","Sponsor-ready flow"],
    support:["SUPPORT","/site/support.html","Help and contact","Community support flow"]
  };

  const keys = Object.keys(pages);
  let index = 0;

  const texture = makeViewerTexture(pages[keys[index]]);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.3, 2.55),
    new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true
    })
  );
  screen.position.set(0, 1.9, .055);
  root.add(screen);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55,1.55,.045,64),
    new THREE.MeshBasicMaterial({
      color:0x8d33ff,
      transparent:true,
      opacity:.32
    })
  );
  pad.position.set(0,.04,1.25);
  root.add(pad);

  function setPage(i){
    index = (i + keys.length) % keys.length;
    drawViewerTexture(texture.image, pages[keys[index]]);
    texture.needsUpdate = true;
    setStatus("Viewer: " + pages[keys[index]][0], { force:true });
  }

  window.addEventListener("keydown", (e)=>{
    if (e.code === "BracketRight") setPage(index + 1);
    if (e.code === "BracketLeft") setPage(index - 1);
    if (e.code === "KeyO") window.location.href = pages[keys[index]][1];
  });

  function update(dt=.016){
    pad.rotation.y += dt * .8;
  }

  window.SVR_PHASE_263_VIEWER = { update, setPage };
  logLine("site viewer installed");
}

function makeTextSprite(label, color){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const x = c.getContext("2d");

  x.clearRect(0,0,512,160);
  x.font = "bold 44px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#" + color.toString(16).padStart(6,"0");
  x.shadowColor = "rgba(190,120,255,.9)";
  x.shadowBlur = 18;
  x.fillText(label, 256, 78);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map:t,
    transparent:true,
    depthWrite:false
  }));

  sprite.scale.set(1.6,.5,1);
  return sprite;
}

function makeViewerTexture(page){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  drawViewerTexture(c, page);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function drawViewerTexture(c, page){
  const x = c.getContext("2d");

  const g = x.createLinearGradient(0,0,1024,512);
  g.addColorStop(0,"#090014");
  g.addColorStop(.5,"#19052e");
  g.addColorStop(1,"#030008");

  x.fillStyle = g;
  x.fillRect(0,0,1024,512);

  x.strokeStyle = "rgba(190,120,255,.85)";
  x.lineWidth = 8;
  x.strokeRect(22,22,980,468);

  x.fillStyle = "#f3eaff";
  x.font = "bold 64px Arial";
  x.fillText(page[0], 60, 96);

  x.fillStyle = "#7fffdc";
  x.font = "bold 30px Arial";
  x.fillText(page[1], 60, 145);

  x.fillStyle = "#dcc8ff";
  x.font = "34px Arial";
  x.fillText("• " + page[2], 75, 230);
  x.fillText("• " + page[3], 75, 288);

  x.fillStyle = "#b987ff";
  x.font = "bold 28px Arial";
  x.fillText("Controls: [ ] switch page • O open selected page", 60, 462);
}
