import * as THREE from "three";

export function installSvrPortalWalkthrough({
  scene,
  camera,
  renderer,
  gotoScene = ()=>false,
  setStatus = ()=>{},
  log = ()=>{}
} = {}){
  if (!scene || !camera) return { update:()=>{}, enterNearest:()=>false };

  const portalDefs = [
    { key:"lobby",    label:"LOBBY",    x:0.0,   z:7.4,  color:0x7fffdc },
    { key:"seat",     label:"SEAT",     x:0.0,   z:2.6,  color:0xd7b8ff },
    { key:"reiki",    label:"REIKI",    x:6.8,   z:3.8,  color:0x46e3c8 },
    { key:"pga",      label:"PGA",      x:-6.8,  z:3.8,  color:0x48a6ff },
    { key:"legends",  label:"LEGEND",   x:-6.8,  z:-4.2, color:0xb987ff },
    { key:"sponsor",  label:"SPONSOR",  x:0.0,   z:8.8,  color:0xf6d365 },
    { key:"scorpion", label:"SCORPION", x:6.8,   z:-4.2, color:0xff4ab8 }
  ];

  if (scene.getObjectByName("SVR_PHYSICAL_PORTAL_SYSTEM")) {
    log("[SVR portal] already installed");
    return window.SVR_PORTALS_RUNTIME || { update:()=>{}, enterNearest:()=>false };
  }

  const root = new THREE.Group();
  root.name = "SVR_PHYSICAL_PORTAL_SYSTEM";
  scene.add(root);

  const portalObjects = [];
  const head = new THREE.Vector3();
  let nearest = null;
  let cooldownUntil = 0;

  function makeText(label, color){
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 512, 160);
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#" + color.toString(16).padStart(6,"0");
    ctx.shadowColor = "rgba(190,120,255,.90)";
    ctx.shadowBlur = 18;
    ctx.fillText(label, 256, 78);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    }));

    sprite.scale.set(1.6, .5, 1);
    return sprite;
  }

  function makePortal(def){
    const group = new THREE.Group();
    group.name = "SVR_PORTAL_" + def.key;
    group.userData.svrPortalKey = def.key;
    group.position.set(def.x, 0.05, def.z);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(.82,.82,.035,64),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: .24,
        depthWrite: false
      })
    );
    pad.position.y = .02;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(.86,.035,14,96),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: .92,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .07;

    const glow = new THREE.PointLight(def.color, 0.0, 3.4, 2.0);
    glow.position.set(0,.35,0);

    const label = makeText(def.label, def.color);
    label.position.set(0, .9, 0);

    group.add(pad, ring, glow, label);
    root.add(group);

    const rec = { ...def, group, pad, ring, glow };
    portalObjects.push(rec);
  }

  portalDefs.forEach(makePortal);

  function getHeadPosition(){
    if (renderer?.xr?.isPresenting){
      const xrCam = renderer.xr.getCamera(camera);
      xrCam.getWorldPosition(head);
      return head;
    }

    camera.getWorldPosition(head);
    return head;
  }

  function enterPortal(rec, reason = "walk"){
    if (!rec || performance.now() < cooldownUntil) return false;

    cooldownUntil = performance.now() + 900;

    try {
      const ok = gotoScene(rec.key);

      if (ok !== false) {
        setStatus(`Portal: ${rec.label}`, { force:true });
        log("[SVR portal] entered", rec.key, reason);
        return true;
      }

      setStatus(`Portal target unavailable: ${rec.label}`, { force:true });
      return false;
    } catch(err) {
      setStatus(`Portal error: ${rec.label}`, { force:true });
      log("[SVR portal error]", rec.key, err?.message || err);
      return false;
    }
  }

  function enterNearest(){
    if (nearest) return enterPortal(nearest, "select");
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

  function update(dt = 0.016){
    const p = getHeadPosition();
    nearest = null;
    let best = Infinity;

    for (const rec of portalObjects){
      const d = Math.hypot(p.x - rec.group.position.x, p.z - rec.group.position.z);

      rec.ring.rotation.z += 1.6 * dt;

      if (d < 2.15){
        rec.pad.material.opacity = .50;
        rec.glow.intensity = 1.6;
      } else {
        rec.pad.material.opacity = .24;
        rec.glow.intensity = 0.0;
      }

      if (d < best){
        best = d;
        nearest = rec;
      }

      if (d < .62 && performance.now() > cooldownUntil){
        enterPortal(rec, "walkthrough");
      }
    }

    if (nearest && best < 1.7 && performance.now() > cooldownUntil){
      setStatus(`Portal ready: ${nearest.label} • walk through / press E / trigger`, { force:false, minGap:700 });
    }
  }

  const runtime = { update, enterNearest };
  window.SVR_PORTALS_RUNTIME = runtime;
  window.SVR_PORTALS = {
    enterNearest,
    enter:key=>enterPortal(portalObjects.find(p=>p.key===key), "api"),
    list:()=>portalObjects.map(p=>p.key)
  };

  log("[SVR portal] physical portal system installed:", portalObjects.map(p=>p.key).join(", "));
  return runtime;
}
