import * as THREE from "three";

const PHASE85_BUILD = "PHASE-86-PGA-STABILITY-WATCH-LOCK";

function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  painter(ctx, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function dronePanelTexture(state){
  return canvasTexture(1024, 512, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#060313");
    g.addColorStop(.65,"#130525");
    g.addColorStop(1,"#020608");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#b48cff";
    ctx.lineWidth = 10;
    roundRect(ctx, 18, 18, w - 36, h - 36, 30);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 66px system-ui, Arial";
    ctx.fillText("SVR CADDIE COACH", w/2, 90);
    ctx.fillStyle = state.mode === "NIGHT" ? "#86e3ff" : "#f2c14e";
    ctx.font = "900 38px system-ui, Arial";
    ctx.fillText(`ENV: ${state.mode}`, w/2, 150);
    ctx.fillStyle = "#eaffff";
    ctx.font = "800 38px system-ui, Arial";
    ctx.fillText(`TOP DRIVE: ${Math.round(state.topDrive || 0)} YD`, w/2, 232);
    ctx.fillText(`CLUB SPEED: ${Math.round(state.clubSpeed || 0)} MPH`, w/2, 294);
    ctx.fillStyle = state.alignment === "SQUARE" ? "#7dff8a" : state.alignment === "OPEN/CLOSED" ? "#ff6680" : "#cfd7ff";
    ctx.font = "900 42px system-ui, Arial";
    ctx.fillText(`FACE: ${state.alignment || "WAITING"}`, w/2, 374);
    ctx.fillStyle = "rgba(255,255,255,.74)";
    ctx.font = "700 24px system-ui, Arial";
    ctx.fillText("Y = Day/Night • Range boot safety locked", w/2, 448);
  });
}

function divotTexture(){
  return canvasTexture(256, 256, (ctx, w, h)=>{
    ctx.clearRect(0,0,w,h);
    const g = ctx.createRadialGradient(w/2,h/2,6,w/2,h/2,118);
    g.addColorStop(0,"rgba(96,52,20,.88)");
    g.addColorStop(.42,"rgba(60,32,12,.68)");
    g.addColorStop(.8,"rgba(22,80,34,.20)");
    g.addColorStop(1,"rgba(22,80,34,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
  });
}

function birdTexture(){
  return canvasTexture(128, 128, (ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = "rgba(235,248,255,.92)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(18,70);
    ctx.quadraticCurveTo(42,48,64,70);
    ctx.quadraticCurveTo(88,48,110,70);
    ctx.stroke();
  });
}

function findBall(scene){
  return scene.getObjectByName("svr-pga-ball") || scene.getObjectByName("golf-ball") || null;
}

function findClub(scene){
  return scene.getObjectByName("svr-range-club") || null;
}

function findClubHead(club){
  return club?.userData?.head || club || null;
}

function createDrone(scene){
  const root = new THREE.Group();
  root.name = "SVR_PHASE86_CADDIE_DRONE";
  scene.add(root);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(.18,24,16),
    new THREE.MeshStandardMaterial({ color:0x171226, roughness:.34, metalness:.42, emissive:0x2b1055, emissiveIntensity:.38 })
  );
  body.scale.set(1.25,.72,1);
  root.add(body);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.045,16,8), new THREE.MeshBasicMaterial({ color:0x86e3ff }));
  eye.position.set(0,.04,-.18);
  root.add(eye);
  const rotorMat = new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:.62, side:THREE.DoubleSide });
  const rotors = [];
  [[-.26,.11,.18],[.26,.11,.18],[-.26,.11,-.18],[.26,.11,-.18]].forEach(([x,y,z])=>{
    const r = new THREE.Mesh(new THREE.CircleGeometry(.14,32), rotorMat.clone());
    r.rotation.x = -Math.PI/2;
    r.position.set(x,y,z);
    root.add(r);
    rotors.push(r);
  });
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9,.95),
    new THREE.MeshBasicMaterial({ map:dronePanelTexture({ mode:"DAY", topDrive:0, clubSpeed:0, alignment:"WAITING" }), transparent:true, side:THREE.DoubleSide })
  );
  panel.position.set(0,-.68,-.10);
  root.add(panel);
  const glow = new THREE.PointLight(0xb48cff,1.1,5,2);
  root.add(glow);
  return { root, panel, rotors, glow, eye };
}

function createPrecisionRing(scene){
  const group = new THREE.Group();
  group.name = "SVR_PHASE86_PRECISION_RING";
  group.position.set(0,1.45,-34);
  scene.add(group);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.9,.045,12,96),
    new THREE.MeshBasicMaterial({ color:0x86e3ff, transparent:true, opacity:.72, side:THREE.DoubleSide, depthWrite:false })
  );
  ring.rotation.x = Math.PI/2;
  group.add(ring);
  const light = new THREE.PointLight(0x86e3ff,1.8,18,2);
  group.add(light);
  return { group, ring, light, radius:2.05, cooldown:0 };
}

function createBirds(scene){
  const group = new THREE.Group();
  group.name = "SVR_PHASE86_REACTIVE_BIRDS";
  scene.add(group);
  const tex = birdTexture();
  const birds = [];
  for(let i=0;i<14;i++){
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, color:i%3===0?0x86e3ff:0xffffff, transparent:true, opacity:.58, depthWrite:false }));
    sprite.position.set((Math.random()-.5)*18,3.4+Math.random()*2.5,-14-Math.random()*34);
    sprite.scale.setScalar(.34+Math.random()*.26);
    sprite.userData.base = sprite.position.clone();
    sprite.userData.vel = new THREE.Vector3();
    sprite.userData.phase = Math.random()*Math.PI*2;
    group.add(sprite);
    birds.push(sprite);
  }
  return birds;
}

export function createPhase85PgaUpdate({ scene, camera, renderer, range = null, statusCb = ()=>{} } = {}){
  if (!scene) return null;
  if (scene.userData.SVR_PHASE86_PGA_STABILITY_LOCK) return scene.userData.SVR_PHASE86_PGA_STABILITY_LOCK;
  const state = {
    build: PHASE85_BUILD,
    mode: localStorage.getItem("svr_pga_env_mode_v1") || "DAY",
    windVector: new THREE.Vector3(.24,0,-.08),
    topDrive: parseFloat(localStorage.getItem("svr_pga_top_drive_phase86") || "0") || 0,
    clubSpeed: 0,
    alignment: "WAITING",
    divots: [],
    lastHead: new THREE.Vector3(),
    lastImpactAt: 0,
    lastPanelAt: 0
  };
  const drone = createDrone(scene);
  const ring = createPrecisionRing(scene);
  const birds = createBirds(scene);
  const divotTex = divotTexture();
  function applyEnvironment(){
    const night = state.mode === "NIGHT";
    scene.fog = new THREE.FogExp2(night ? 0x03040a : 0x10151b, night ? .018 : .010);
    if (scene.background?.isColor) scene.background.setHex(night ? 0x020406 : 0x08101a);
    drone.glow.color.setHex(night ? 0xb48cff : 0xf2c14e);
    drone.eye.material.color.setHex(night ? 0x86e3ff : 0xf2c14e);
    localStorage.setItem("svr_pga_env_mode_v1", state.mode);
  }
  function updatePanel(force = false){
    const now = performance.now();
    if (!force && now - state.lastPanelAt < 260) return;
    state.lastPanelAt = now;
    const old = drone.panel.material.map;
    drone.panel.material.map = dronePanelTexture(state);
    drone.panel.material.needsUpdate = true;
    old?.dispose?.();
  }
  function toggleEnvironment(){
    state.mode = state.mode === "DAY" ? "NIGHT" : "DAY";
    applyEnvironment();
    updatePanel(true);
    statusCb(`PGA environment: ${state.mode}`);
    return state.mode;
  }
  function spawnDivot(pos, strength = 1){
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(.42 + strength*.12, .25 + strength*.08),
      new THREE.MeshBasicMaterial({ map:divotTex, transparent:true, opacity:.74, side:THREE.DoubleSide, depthWrite:false })
    );
    mesh.name = "SVR_PHASE86_SLOW_GROW_DIVOT";
    mesh.rotation.x = -Math.PI/2;
    mesh.rotation.z = (Math.random()-.5)*.8;
    mesh.position.copy(pos).setY(.022);
    mesh.userData.life = 120;
    mesh.userData.maxLife = 120;
    scene.add(mesh);
    state.divots.push(mesh);
  }
  function updateDrone(dt){
    const target = new THREE.Vector3();
    if (renderer?.xr?.isPresenting) renderer.xr.getCamera(camera).getWorldPosition(target);
    else target.copy(camera.position);
    const desired = target.clone().add(new THREE.Vector3(1.15,.42,-1.15));
    drone.root.position.lerp(desired, 1 - Math.pow(.001, dt));
    drone.root.lookAt(target.x, target.y + .2, target.z);
    drone.rotors.forEach((r,i)=>{ r.rotation.z += dt * (18 + i); });
  }
  function updateAlignment(dt, ball, club, head){
    if (!ball || !club || !head) {
      state.alignment = "WAITING";
      if (state.guide) state.guide.visible = false;
      return;
    }
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);
    const ballPos = ball.position.clone();
    const dist = headPos.distanceTo(ballPos);
    if (dist > 2.4) {
      state.alignment = "WAITING";
      if (state.guide) state.guide.visible = false;
      return;
    }
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(club.quaternion).normalize();
    const toBall = ballPos.clone().sub(headPos).normalize();
    const square = Math.abs(forward.dot(toBall)) > .70;
    state.alignment = square ? "SQUARE" : "OPEN/CLOSED";
    if (!state.guide){
      state.guide = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,0,-1)]),
        new THREE.LineBasicMaterial({ color:0x86e3ff, transparent:true, opacity:.88 })
      );
      scene.add(state.guide);
    }
    const end = headPos.clone().add(toBall.multiplyScalar(Math.min(1.4, Math.max(.25, dist))));
    state.guide.geometry.setFromPoints([headPos, end]);
    state.guide.material.color.setHex(square ? 0x7dff8a : 0xff6680);
    state.guide.visible = dist < 1.85;
  }
  function updateImpact(dt, ball, head){
    if (!ball || !head) return;
    const now = performance.now();
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);
    const speed = headPos.distanceTo(state.lastHead) / Math.max(dt,.001);
    state.lastHead.copy(headPos);
    state.clubSpeed = THREE.MathUtils.lerp(state.clubSpeed, speed * 2.237, .14);
    if (headPos.distanceTo(ball.position) < .43 && headPos.y < .10 && now - state.lastImpactAt > 360){
      state.lastImpactAt = now;
      spawnDivot(ball.position.clone(), THREE.MathUtils.clamp(speed/5,.4,1.7));
      statusCb("PGA turf impact: divot recovery active");
    }
  }
  function updateRing(dt, ball){
    ring.cooldown = Math.max(0, ring.cooldown - dt);
    ring.group.rotation.z += dt * .15;
    ring.light.intensity = THREE.MathUtils.lerp(ring.light.intensity, 1.8, .05);
    if (!ball || ring.cooldown > 0) return;
    const d = Math.hypot(ball.position.x - ring.group.position.x, ball.position.z - ring.group.position.z);
    if (d < ring.radius && Math.abs(ball.position.y - ring.group.position.y) < 1.9){
      ring.cooldown = 4;
      state.topDrive = Math.max(state.topDrive, Math.abs(ball.position.z) * 5.2);
      localStorage.setItem("svr_pga_top_drive_phase86", String(state.topDrive));
      ring.light.intensity = 5;
      statusCb("PERFECT SHOT • Precision Ring hit");
      updatePanel(true);
    }
  }
  function updateDivots(dt){
    for(let i=state.divots.length-1;i>=0;i--){
      const d = state.divots[i];
      d.userData.life -= dt;
      const alpha = Math.max(0, d.userData.life / d.userData.maxLife);
      d.material.opacity = .74 * alpha;
      if (d.userData.life <= 0){
        scene.remove(d);
        d.geometry.dispose?.();
        d.material.dispose?.();
        state.divots.splice(i,1);
      }
    }
  }
  function updateBirds(dt, ball){
    const t = performance.now() * .001;
    for(const b of birds){
      if (ball && b.position.distanceTo(ball.position) < 2.0){
        b.userData.vel.set((Math.random()-.5)*2.2,1.6+Math.random()*1.8,-2-Math.random()*2.8);
        b.material.opacity = .82;
      }
      if (b.userData.vel.lengthSq() > .001){
        b.position.addScaledVector(b.userData.vel, dt);
        b.userData.vel.multiplyScalar(1 - Math.min(dt*.55,.08));
        b.userData.vel.y -= dt*.25;
      } else {
        b.position.y = b.userData.base.y + Math.sin(t + b.userData.phase) * .10;
        b.position.x = b.userData.base.x + Math.sin(t*.7 + b.userData.phase) * .10 + state.windVector.x * Math.sin(t*.4) * .18;
      }
      b.material.opacity = THREE.MathUtils.lerp(b.material.opacity, .58, .015);
    }
  }
  window.SVR_PGA_PHASE85 = { build: PHASE85_BUILD, toggleEnvironment, getState:()=>({ mode:state.mode, topDrive:state.topDrive, clubSpeed:state.clubSpeed, alignment:state.alignment, windVector:state.windVector.toArray() }) };
  window.addEventListener("keydown", (e)=>{ if (!e.repeat && e.code === "KeyY") toggleEnvironment(); });
  applyEnvironment();
  updatePanel(true);
  const lock = { build: PHASE85_BUILD, state, toggleEnvironment, update(dt){ const ball = findBall(scene); const club = findClub(scene); const head = findClubHead(club); updateDrone(dt); updateAlignment(dt, ball, club, head); updateImpact(dt, ball, head); updateRing(dt, ball); updateDivots(dt); updateBirds(dt, ball); updatePanel(false); } };
  scene.userData.SVR_PHASE86_PGA_STABILITY_LOCK = lock;
  return lock;
}

export { PHASE85_BUILD };
