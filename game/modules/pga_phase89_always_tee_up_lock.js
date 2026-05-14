import * as THREE from "three";

const PHASE89_BUILD = "PHASE-89-PGA-ALWAYS-TEE-UP-LOCK";

const BALL_RADIUS = 0.135;
const TEE_HEIGHT = 0.15;
const TEE_POS = new THREE.Vector3(0.42, TEE_HEIGHT + BALL_RADIUS, -1.05);
const TEE_BASE = new THREE.Vector3(0.42, 0, -1.05);

function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  painter(x, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeLabelTexture(){
  return canvasTexture(1000, 360, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#050d08");
    g.addColorStop(1,"#0b0417");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "#7dff8a";
    x.lineWidth = 10;
    x.strokeRect(18,18,w-36,h-36);
    x.textAlign = "center";
    x.fillStyle = "#ffffff";
    x.font = "900 60px system-ui, Arial";
    x.fillText("ALWAYS TEE'D UP", w/2, 112);
    x.fillStyle = "#7dff8a";
    x.font = "800 34px system-ui, Arial";
    x.fillText("BALL LOCKED ON RUBBER TEE", w/2, 178);
    x.fillStyle = "rgba(255,255,255,.82)";
    x.font = "700 25px system-ui, Arial";
    x.fillText("Right-handed stance: stand left, ball right", w/2, 246);
    x.fillText("Auto-tee respawn after shot leaves tee zone", w/2, 292);
  });
}

function createTeeVisual(root){
  const group = new THREE.Group();
  group.name = "SVR_PHASE89_RUBBER_TEE_UP_LOCK_VISUAL";
  group.position.set(TEE_BASE.x, 0, TEE_BASE.z);
  root.add(group);

  const tee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.08, TEE_HEIGHT, 32),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .72, metalness: .05, emissive: 0x07120b, emissiveIntensity: .18 })
  );
  tee.position.y = TEE_HEIGHT / 2;
  group.add(tee);

  const cup = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.012, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .82 })
  );
  cup.position.y = TEE_HEIGHT + 0.006;
  cup.rotation.x = Math.PI / 2;
  group.add(cup);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.56, 72),
    new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.026;
  group.add(ring);

  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.055, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(-0.42, 0.032, 0.32);
  group.add(line);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, .90),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.position.set(-1.78, 1.12, -0.52);
  label.rotation.y = .18;
  group.add(label);

  const glow = new THREE.PointLight(0x7dff8a, 1.15, 4.5, 2.0);
  glow.position.set(0, .35, 0);
  group.add(glow);

  return { group, tee, cup, ring, line, label, glow };
}

function zeroBallVisualMotion(ball){
  if (!ball) return;
  ball.userData.SVR_PHASE89_TEE_LOCKED_AT = performance.now();
  ball.rotation.set(0,0,0);
  ball.scale.setScalar(1);
}

function snapBallToTee(ball){
  if (!ball) return false;
  ball.position.copy(TEE_POS);
  zeroBallVisualMotion(ball);
  return true;
}

export function applyPhase89AlwaysTeeUpLock({ scene, camera, renderer, range = null, statusCb = ()=>{} } = {}){
  if (!scene || scene.userData.SVR_PHASE89_ALWAYS_TEE_UP_LOCK) return scene?.userData?.SVR_PHASE89_ALWAYS_TEE_UP_LOCK || null;
  const refs = scene.userData.SVR_PGA_RANGE_REFS || {};
  const root = refs.root || scene;
  const ball = refs.ball || scene.getObjectByName("svr-pga-ball");
  const teeVisual = createTeeVisual(root);

  if (scene.userData.SVR_RANGE_STANCE_MAT_LOCK){
    scene.userData.SVR_RANGE_STANCE_MAT_LOCK.playerStart = { x:-0.42, y:0, z:0.42 };
    scene.userData.SVR_RANGE_STANCE_MAT_LOCK.ball = { x:TEE_POS.x, y:TEE_POS.y, z:TEE_POS.z };
    scene.userData.SVR_RANGE_STANCE_MAT_LOCK.teeHeight = TEE_HEIGHT;
  }

  if (ball) snapBallToTee(ball);
  if (!renderer?.xr?.isPresenting && camera){
    camera.position.set(-0.42, 1.62, 0.72);
    camera.lookAt(TEE_POS.x, 0.74, TEE_POS.z);
  }

  let teeExitAt = 0;
  let lastBallPos = ball ? ball.position.clone() : new THREE.Vector3();
  let lastResetAt = performance.now();

  const originalReset = range?.resetBall?.bind(range);
  if (range && typeof range.resetBall === "function" && !range.userData?.SVR_PHASE89_RESET_PATCHED){
    const patched = ()=>{
      originalReset?.();
      const b = (scene.userData.SVR_PGA_RANGE_REFS || {}).ball || scene.getObjectByName("svr-pga-ball");
      snapBallToTee(b);
      teeExitAt = 0;
      lastResetAt = performance.now();
      statusCb("Auto-tee: ball locked on rubber tee");
    };
    range.resetBall = patched;
    range.userData = range.userData || {};
    range.userData.SVR_PHASE89_RESET_PATCHED = true;
  }

  function resetToTee(){
    if (range?.resetBall) range.resetBall();
    else snapBallToTee(ball || scene.getObjectByName("svr-pga-ball"));
  }

  const api = {
    build: PHASE89_BUILD,
    teePosition: TEE_POS.clone(),
    teeHeight: TEE_HEIGHT,
    resetToTee,
    update(dt = 0.016){
      const t = performance.now() * .001;
      if (teeVisual?.glow) teeVisual.glow.intensity = 1.05 + Math.sin(t * 2.2) * .18;
      if (teeVisual?.ring?.material) teeVisual.ring.material.opacity = .64 + Math.sin(t * 2.0) * .10;
      const b = (scene.userData.SVR_PGA_RANGE_REFS || {}).ball || scene.getObjectByName("svr-pga-ball");
      if (!b) return;
      const dx = b.position.x - TEE_POS.x;
      const dz = b.position.z - TEE_POS.z;
      const horizontal = Math.hypot(dx, dz);
      const moved = b.position.distanceTo(lastBallPos);
      lastBallPos.copy(b.position);

      // Keep idle/reset ball exactly teed, and respawn 2 seconds after it leaves tee zone.
      if (horizontal < .22 && moved < .004 && performance.now() - lastResetAt > 250){
        if (Math.abs(b.position.y - TEE_POS.y) > .01) snapBallToTee(b);
      }
      if (horizontal > .70 || b.position.y < .08){
        if (!teeExitAt) teeExitAt = performance.now();
      } else {
        teeExitAt = 0;
      }
      if (teeExitAt && performance.now() - teeExitAt > 2000){
        resetToTee();
      }
    }
  };

  window.SVR_PHASE89_ALWAYS_TEE_UP = api;
  scene.userData.SVR_PHASE89_ALWAYS_TEE_UP_LOCK = api;
  statusCb("Phase 89: ball is teed up on rubber tee");
  return api;
}

export { PHASE89_BUILD, TEE_POS as PHASE89_TEE_POS, TEE_HEIGHT as PHASE89_TEE_HEIGHT };
