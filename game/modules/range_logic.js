import * as THREE from "three";

const DEFAULT_BUILD = "PHASE-91-PGA-DRIVING-RANGE-RESTORE-LOCK";

function clamp(value, min, max){ return Math.max(min, Math.min(max, value)); }

function makeCanvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeTextTexture({ title = "SVR", subtitle = "", body = "", accent = "#5df2a3", bg = "#07140d" } = {}){
  return makeCanvasTexture(1024, 512, (ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, "#080914");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 74px system-ui, Arial";
    ctx.fillText(title, w / 2, 128);
    ctx.fillStyle = "rgba(230,255,244,0.92)";
    ctx.font = "bold 40px system-ui, Arial";
    ctx.fillText(subtitle, w / 2, 196);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "32px system-ui, Arial";
    const lines = String(body).split("\n");
    lines.forEach((line, index)=>ctx.fillText(line, w / 2, 282 + index * 48));
  });
}

function makeMatLabelTexture(){
  return makeCanvasTexture(1024, 512, (ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#d6a431");
    grad.addColorStop(0.48, "#ffd76d");
    grad.addColorStop(1, "#80580e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(30,20,0,0.8)";
    ctx.lineWidth = 18;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = "#160b00";
    ctx.textAlign = "center";
    ctx.font = "bold 82px system-ui, Arial";
    ctx.fillText("STAND HERE", w / 2, 182);
    ctx.font = "bold 58px system-ui, Arial";
    ctx.fillText("AIM AT BALL", w / 2, 292);
    ctx.font = "34px system-ui, Arial";
    ctx.fillText("PHASE 91 RANGE LOCK", w / 2, 392);
  });
}

function makeYardTexture(label){
  return makeCanvasTexture(512, 256, (ctx, w, h)=>{
    ctx.fillStyle = "rgba(4,10,8,0.95)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#5df2a3";
    ctx.lineWidth = 10;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 72px system-ui, Arial";
    ctx.fillText(label, w / 2, 116);
    ctx.font = "bold 44px system-ui, Arial";
    ctx.fillText("YARDS", w / 2, 178);
  });
}

function addBoard(scene, { position, size = [7, 3.5], title, subtitle, body, accent = "#5df2a3", lookAt = [0, 1.5, 0] }){
  const tex = makeTextTexture({ title, subtitle, body, accent });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true })
  );
  mesh.position.fromArray(position);
  mesh.lookAt(new THREE.Vector3(...lookAt));
  scene.add(mesh);
  return mesh;
}

function addTargetGreen(scene, z, radius, label, color = 0x1d7f3a){
  const group = new THREE.Group();
  const green = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.045, 64),
    new THREE.MeshStandardMaterial({ color, roughness: 0.84, emissive: 0x082b12, emissiveIntensity: 0.22 })
  );
  green.position.set(0, 0.025, z);
  group.add(green);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius * 0.76, 72),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.056, z);
  group.add(ring);

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.36, radius * 0.39, 72),
    new THREE.MeshBasicMaterial({ color: 0xffffa6, transparent: true, opacity: 0.90, side: THREE.DoubleSide })
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.set(0, 0.062, z);
  group.add(innerRing);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  pole.position.set(radius * 0.26, 1.12, z - radius * 0.12);
  group.add(pole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xffd84c, side: THREE.DoubleSide })
  );
  flag.position.set(radius * 0.62, 2.02, z - radius * 0.12);
  flag.rotation.y = Math.PI * 0.5;
  group.add(flag);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.72),
    new THREE.MeshBasicMaterial({ map: makeYardTexture(label), side: THREE.DoubleSide })
  );
  sign.position.set(-radius - 1.2, 0.68, z);
  sign.lookAt(0, 1.2, 4);
  group.add(sign);

  scene.add(group);
  return group;
}

function addReturnGate(scene){
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.35, 64),
    new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  ring.position.set(0, 1.45, 5.2);
  ring.rotation.y = Math.PI;
  group.add(ring);
  const core = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 64),
    new THREE.MeshBasicMaterial({ color: 0x14071f, transparent: true, opacity: 0.86, side: THREE.DoubleSide })
  );
  core.position.copy(ring.position);
  core.rotation.copy(ring.rotation);
  group.add(core);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.72),
    new THREE.MeshBasicMaterial({ map: makeTextTexture({ title: "RETURN", subtitle: "LOBBY", body: "B / ESC", accent: "#b48cff" }), side: THREE.DoubleSide, transparent: true })
  );
  label.position.set(0, 3.05, 5.2);
  label.rotation.y = Math.PI;
  group.add(label);
  scene.add(group);
  return group;
}

function makeShotBoardTexture(state){
  return makeTextTexture({
    title: "PGA DRIVE RANGE",
    subtitle: `Last Shot: ${state.distance} yd • ${state.result}`,
    body: `Stance mat locked\nBall auto-resets on tee\nClick / Space = test swing`,
    accent: "#5df2a3",
    bg: "#06140f"
  });
}

export function createPgaDrivingRange({ build = DEFAULT_BUILD, alias = "PGA DRIVE" } = {}){
  const app = document.getElementById("app");
  if (!app) throw new Error("PGA range requires #app root element");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061019);
  scene.fog = new THREE.Fog(0x061019, 36, 120);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);
  camera.position.set(0, 1.64, 4.25);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x132813, 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(-8, 18, 10);
  scene.add(sun);
  const accentLight = new THREE.PointLight(0x5df2a3, 1.2, 18, 2.0);
  accentLight.position.set(0, 3.8, 1.2);
  scene.add(accentLight);

  const fairway = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 92),
    new THREE.MeshStandardMaterial({ color: 0x145a25, roughness: 0.92, emissive: 0x041305, emissiveIntensity: 0.12 })
  );
  fairway.rotation.x = -Math.PI / 2;
  fairway.position.set(0, 0, -35);
  scene.add(fairway);

  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 86),
    new THREE.MeshBasicMaterial({ color: 0x2e9a48, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(0, 0.018, -36);
  scene.add(lane);

  const stanceMat = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 1.55),
    new THREE.MeshStandardMaterial({ map: makeMatLabelTexture(), roughness: 0.48, metalness: 0.04 })
  );
  stanceMat.rotation.x = -Math.PI / 2;
  stanceMat.position.set(0, 0.035, 2.42);
  scene.add(stanceMat);

  const tee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.075, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 })
  );
  tee.position.set(0, 0.14, 0.78);
  scene.add(tee);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.02 })
  );
  ball.position.set(0, 0.34, 0.78);
  scene.add(ball);

  const ballHome = ball.position.clone();
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.0 });
  const tracerGeo = new THREE.BufferGeometry().setFromPoints([ballHome, ballHome]);
  const tracer = new THREE.Line(tracerGeo, tracerMat);
  scene.add(tracer);

  addTargetGreen(scene, -18, 2.5, "75");
  addTargetGreen(scene, -32, 3.3, "125", 0x1b7436);
  addTargetGreen(scene, -52, 4.3, "200", 0x17662e);

  for (let i = 0; i < 11; i++){
    const z = 2 - i * 6;
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: i % 2 ? 0.12 : 0.22 })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.045, z);
    scene.add(stripe);
  }

  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.15, 48, 24), new THREE.MeshBasicMaterial({ color: 0xded8ff }));
  moon.position.set(-15, 23, -64);
  scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.95, 40, 20), new THREE.MeshBasicMaterial({ color: 0xff704c }));
  mars.position.set(12, 25, -70);
  scene.add(mars);

  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 520; i++){
    const r = 80 + Math.random() * 120;
    const a = Math.random() * Math.PI * 2;
    starPos.push(Math.cos(a) * r, 18 + Math.random() * 58, Math.sin(a) * r - 42);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.11, transparent: true, opacity: 0.72 }));
  scene.add(stars);

  addBoard(scene, {
    position: [0, 3.1, -8.2],
    title: "SVR PGA DRIVING RANGE",
    subtitle: "Private scene restored",
    body: "Gold stance mat • ball alignment • target greens\nyardage markers • tracer • auto tee reset",
    accent: "#5df2a3",
    lookAt: [0, 1.5, 4]
  });

  const shotState = { distance: 0, result: "READY" };
  const shotBoardMat = new THREE.MeshBasicMaterial({ map: makeShotBoardTexture(shotState), side: THREE.DoubleSide, transparent: true });
  const shotBoard = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.4), shotBoardMat);
  shotBoard.position.set(6.2, 2.4, -5.2);
  shotBoard.lookAt(0, 1.3, 2);
  scene.add(shotBoard);

  addReturnGate(scene);

  const keys = {};
  let yaw = 0;
  let shot = null;

  function updateShotBoard(distance, result){
    shotState.distance = distance;
    shotState.result = result;
    if (shotBoardMat.map) shotBoardMat.map.dispose();
    shotBoardMat.map = makeShotBoardTexture(shotState);
    shotBoardMat.needsUpdate = true;
  }

  function resetBall(){
    ball.position.copy(ballHome);
    tracerMat.opacity = 0;
    tracer.geometry.setFromPoints([ballHome, ballHome]);
    shot = null;
    updateShotBoard(0, "READY");
  }

  function swing(){
    if (shot) return;
    const targetDistance = 92 + Math.floor(Math.random() * 138);
    const lateral = (Math.random() - 0.5) * 9.5;
    const carryZ = -targetDistance * 0.27;
    const apex = 4.8 + Math.random() * 3.4;
    const result = targetDistance > 185 ? "LONG DRIVE" : targetDistance > 125 ? "FAIRWAY" : "CONTROL SHOT";
    shot = { t: 0, duration: 1.95, start: ballHome.clone(), end: new THREE.Vector3(lateral, 0.18, carryZ), apex, distance: targetDistance, result };
    updateShotBoard(targetDistance, result);
    tracerMat.opacity = 0.95;
  }

  renderer.domElement.addEventListener("pointerdown", swing);
  window.addEventListener("keydown", (event)=>{
    keys[event.code] = true;
    if (event.code === "Escape" || event.code === "KeyB") window.location.href = "./index.html";
    if (event.code === "Space") swing();
    if (event.code === "KeyR") resetBall();
  });
  window.addEventListener("keyup", (event)=>{ keys[event.code] = false; });
  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function stepCamera(){
    const speed = keys.ShiftLeft || keys.ShiftRight ? 0.10 : 0.055;
    if (keys.KeyQ) yaw += 0.025;
    if (keys.KeyE) yaw -= 0.025;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    if (keys.KeyW || keys.ArrowUp) camera.position.addScaledVector(forward, speed);
    if (keys.KeyS || keys.ArrowDown) camera.position.addScaledVector(forward, -speed);
    if (keys.KeyA || keys.ArrowLeft) camera.position.addScaledVector(right, -speed);
    if (keys.KeyD || keys.ArrowRight) camera.position.addScaledVector(right, speed);
    camera.position.x = clamp(camera.position.x, -8.0, 8.0);
    camera.position.z = clamp(camera.position.z, -58, 6.0);
    camera.rotation.set(0, yaw, 0);
  }

  function stepShot(delta){
    if (!shot) return;
    shot.t += delta / shot.duration;
    const t = clamp(shot.t, 0, 1);
    const pos = new THREE.Vector3().lerpVectors(shot.start, shot.end, t);
    pos.y += Math.sin(t * Math.PI) * shot.apex;
    ball.position.copy(pos);
    const points = [];
    for (let i = 0; i <= 24; i++){
      const u = t * (i / 24);
      const p = new THREE.Vector3().lerpVectors(shot.start, shot.end, u);
      p.y += Math.sin(u * Math.PI) * shot.apex;
      points.push(p);
    }
    tracer.geometry.setFromPoints(points);
    tracerMat.opacity = Math.max(0.2, 0.95 - t * 0.35);
    if (t >= 1){
      setTimeout(resetBall, 1200);
      shot = null;
    }
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    const delta = Math.min(clock.getDelta(), 0.05);
    stepCamera();
    stepShot(delta);
    moon.rotation.y += 0.0012;
    mars.rotation.y += 0.0018;
    stars.rotation.y += 0.00006;
    renderer.render(scene, camera);
  });

  window.SVR_PGA_RANGE = {
    build,
    alias,
    resetBall,
    swing,
    status: "ready",
    features: ["stance-mat", "ball-alignment", "target-greens", "yardage-markers", "tracer", "auto-reset", "return-gate"]
  };
}
