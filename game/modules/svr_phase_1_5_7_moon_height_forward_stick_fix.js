(function(){
  const BUILD = "VERSION-1.5.7-MOON-HEIGHT-FORWARD-STICK-FIX";
  window.SVR_BUILD_LABEL = BUILD;

  const SKY = {
    moon: { pos:[-130, 690, -940], scale:112, url:"./assets/textures/moon.jpg", color:0xf3ead8 },
    mars: { pos:[-34, 720, -1080], scale:56, url:"./assets/textures/mars.jpg", color:0xc96a3b }
  };

  const MOVE = {
    deadzone: 0.18,
    speed: 4.4,        // meters/sec feel; fast enough for lobby testing
    snapDeg: 45,
    snapCooldownMs: 240,
    lastSnap: 0,
    enabled: true
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
    if (scene && scene.traverse) {
      let cam = null;
      scene.traverse(o => {
        if (!cam && (o.isCamera || o.type === "PerspectiveCamera" || o.name === "camera")) cam = o;
      });
      if (cam) return cam;
    }

    const canvas = document.querySelector("canvas");
    if (canvas && canvas.__threeCamera) return canvas.__threeCamera;
    return null;
  }

  function getRig(){
    for (const k of ["playerRig","SVR_PLAYER_RIG","rig","cameraRig","xrRig","userRig"]) {
      if (window[k] && window[k].position) return window[k];
    }

    const cam = getCamera();
    if (cam && cam.parent && cam.parent.position) return cam.parent;

    const scene = getScene();
    if (scene && scene.traverse) {
      let rig = null;
      scene.traverse(o => {
        const n = String(o.name || "").toLowerCase();
        if (!rig && o.position && (n.includes("rig") || n.includes("player") || n.includes("camera parent"))) rig = o;
      });
      if (rig) return rig;
    }

    return cam;
  }

  function makeTexture(url){
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
      map: makeTexture(cfg.url),
      roughness: 0.92,
      metalness: 0,
      emissive: cfg.color,
      emissiveIntensity: kind === "moon" ? 0.13 : 0.08
    });

    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
    m.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_5_7_HIGH_SKY";
    m.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    m.scale.setScalar(cfg.scale);
    m.visible = true;
    m.frustumCulled = false;
    m.userData.SVR_REAL_PLANET = kind;
    m.userData.SVR_1_5_7_SKY_LOCK = true;
    scene.add(m);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 40, 20),
      new THREE.MeshBasicMaterial({ color:cfg.color, transparent:true, opacity:kind === "moon" ? 0.18 : 0.12, depthWrite:false })
    );
    halo.name = "SVR_" + kind.toUpperCase() + "_HALO_PHASE_1_5_7";
    halo.position.copy(m.position);
    halo.scale.setScalar(cfg.scale * 1.18);
    halo.userData.SVR_REAL_PLANET_HALO = kind;
    scene.add(halo);
    return m;
  }

  function lockSky(){
    const scene = getScene();
    if (!scene || !scene.traverse || !window.THREE) return;

    const found = { moon:[], mars:[] };

    scene.traverse(obj => {
      const ud = obj.userData || {};
      const mat = obj.material || {};
      const t = String((obj.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if (t.includes("moon") || ud.SVR_REAL_PLANET === "moon") found.moon.push(obj);
      if (t.includes("mars") || ud.SVR_REAL_PLANET === "mars") found.mars.push(obj);
    });

    function score(o){
      const mat = o.material || {};
      const ud = o.userData || {};
      return (ud.SVR_REAL_PLANET || ud.SVR_1_5_7_SKY_LOCK ? 400 : 0) +
             (mat.map ? 120 : 0) +
             (o.isMesh ? 10 : 0) +
             (o.visible ? 5 : 0);
    }

    function keep(kind){
      const cfg = SKY[kind];
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
      if (main.position && main.position.set) main.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      if (main.scale && main.scale.setScalar) main.scale.setScalar(cfg.scale);
      main.userData = main.userData || {};
      main.userData.SVR_REAL_PLANET = kind;
      main.userData.SVR_1_5_7_SKY_LOCK = true;
    }

    keep("moon");
    keep("mars");
  }

  function allGamepads(){
    const pads = [];
    try {
      if (navigator.getGamepads) {
        Array.from(navigator.getGamepads()).forEach(p => { if (p) pads.push(p); });
      }
    } catch(e) {}

    try {
      const session = window.SVR_XR_SESSION || window.xrSession;
      if (session && session.inputSources) {
        session.inputSources.forEach(src => {
          if (src.gamepad) pads.push(src.gamepad);
        });
      }
    } catch(e) {}

    return pads;
  }

  function axisFromPads(){
    const pads = allGamepads();
    let best = { x:0, y:0, turn:0, mag:0, label:"none" };

    pads.forEach(p => {
      const a = p.axes || [];
      const candidates = [
        { x:a[0] || 0, y:a[1] || 0, turn:a[2] || 0, label:"0/1" },
        { x:a[2] || 0, y:a[3] || 0, turn:a[0] || 0, label:"2/3" },
        { x:a[0] || 0, y:a[3] || 0, turn:a[2] || 0, label:"0/3" }
      ];

      candidates.forEach(c => {
        const mag = Math.max(Math.abs(c.x), Math.abs(c.y), Math.abs(c.turn));
        if (mag > best.mag) best = { ...c, mag, label:(p.id || "gamepad") + ":" + c.label };
      });
    });

    if (Math.abs(best.x) < MOVE.deadzone) best.x = 0;
    if (Math.abs(best.y) < MOVE.deadzone) best.y = 0;
    if (Math.abs(best.turn) < 0.70) best.turn = 0;
    return best;
  }

  function getYawForwardRight(camera){
    if (!window.THREE || !camera) return null;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() < 0.0001) {
      forward.set(0,0,-1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    return { forward, right };
  }

  function rotateYaw(obj, radians){
    if (!obj) return;
    if (obj.rotation && typeof obj.rotation.y === "number") {
      obj.rotation.y += radians;
    } else if (obj.quaternion && window.THREE) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), radians);
      obj.quaternion.multiply(q);
    }
  }

  let lastTime = performance.now();

  function locomotionLoop(now){
    requestAnimationFrame(locomotionLoop);

    if (!MOVE.enabled) return;

    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const axis = axisFromPads();
    if (axis.mag <= MOVE.deadzone) return;

    const camera = getCamera();
    const rig = getRig();
    if (!camera || !rig || !rig.position || !window.THREE) return;

    // Snap-turn from stick/right axis. Forward motion remains head/camera-forward.
    if (axis.turn && now - MOVE.lastSnap > MOVE.snapCooldownMs) {
      rotateYaw(rig, Math.sign(axis.turn) * THREE.MathUtils.degToRad(MOVE.snapDeg));
      MOVE.lastSnap = now;
    }

    const dirs = getYawForwardRight(camera);
    if (!dirs) return;

    // Browser/gamepad forward is usually negative Y. Convert so pushing forward moves camera-forward.
    const forwardAmount = -axis.y;
    const strafeAmount = axis.x;

    if (Math.abs(forwardAmount) < MOVE.deadzone && Math.abs(strafeAmount) < MOVE.deadzone) return;

    const delta = new THREE.Vector3();
    delta.addScaledVector(dirs.forward, forwardAmount * MOVE.speed * dt);
    delta.addScaledVector(dirs.right, strafeAmount * MOVE.speed * dt);

    // This is the core fix: motion is based on camera yaw, not controller sideways orientation.
    rig.position.add(delta);

    window.dispatchEvent(new CustomEvent("svr-forward-stick-fixed", {
      detail: {
        build: BUILD,
        forward: forwardAmount,
        strafe: strafeAmount,
        source: axis.label
      }
    }));
  }

  function init(){
    lockSky();
    lastTime = performance.now();
    requestAnimationFrame(locomotionLoop);
    console.log("[SVR]", BUILD, "active: moon raised + camera-forward stick locomotion");
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", () => setTimeout(init, 700));
  setInterval(lockSky, 2500);

  window.SVR_157_FORWARD_STICK_FIX = {
    build: BUILD,
    setEnabled(v){ MOVE.enabled = !!v; },
    setSpeed(v){ const n = Number(v); if (Number.isFinite(n) && n > 0) MOVE.speed = n; },
    raiseSky(){ lockSky(); }
  };
})();
