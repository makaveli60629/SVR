// PHASE-181-SMOKER-LOUNGE-STOREFRONT-POSITION-LOCK
// Repositions the Smoker Lounge storefront to the measured portal location:
// X -19.84 / Y 1.60 / Z 5.17, nearest PORTAL_smokerLounge.
// Keeps storefront modular, off the walkway, and separated from neighboring portal/storefront areas.
import * as THREE from "three";

const PHASE = "PHASE-181-SMOKER-LOUNGE-STOREFRONT-POSITION-LOCK";
const LOUNGE_POSITION = new THREE.Vector3(-19.84, 0.02, 5.17);
const LOUNGE_FACING_DEGREES = 299;
const LOUNGE_ROTATION_Y = THREE.MathUtils.degToRad(LOUNGE_FACING_DEGREES + 180);

if (!window.__SVR_PHASE181_SMOKER_LOUNGE_STOREFRONT__) {
  window.__SVR_PHASE181_SMOKER_LOUNGE_STOREFRONT__ = true;

  function makeTexture(title, subtitle, lines = []) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#080613");
    g.addColorStop(0.55, "#1a1022");
    g.addColorStop(1, "#071816");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "rgba(255,184,107,0.95)";
    x.lineWidth = 10;
    x.strokeRect(18, 18, c.width - 36, c.height - 36);
    x.strokeStyle = "rgba(180,140,255,0.85)";
    x.lineWidth = 5;
    x.strokeRect(42, 42, c.width - 84, c.height - 84);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff7e8";
    x.font = "bold 70px system-ui, Segoe UI, Arial";
    x.fillText(title.toUpperCase(), c.width / 2, 125);
    x.fillStyle = "#cffff0";
    x.font = "bold 38px system-ui, Segoe UI, Arial";
    x.fillText(subtitle.toUpperCase(), c.width / 2, 198);
    x.fillStyle = "rgba(255,255,255,0.90)";
    x.font = "29px system-ui, Segoe UI, Arial";
    lines.slice(0, 4).forEach((line, idx) => x.fillText(line, c.width / 2, 280 + idx * 44));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function neonBar(parent, x, y, z, sx, sy, color, opacity = 0.72) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), m);
    b.position.set(x, y, z);
    b.renderOrder = 78;
    parent.add(b);
    return b;
  }

  function addRope(parent, x, z, h = 0.48) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.44, metalness: 0.45, emissive: 0x2a1636, emissiveIntensity: 0.18 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffb86b, roughness: 0.34, metalness: 0.55, emissive: 0x4d2200, emissiveIntensity: 0.30 });
    const post = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.040, h, 18), postMat);
    cyl.position.y = h * 0.5;
    post.add(cyl);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8), capMat);
    cap.position.y = h + 0.03;
    post.add(cap);
    post.position.set(x, 0, z);
    parent.add(post);
    return post;
  }

  function hideOlderLoungeRoots(scene) {
    scene.traverse((obj) => {
      if (!obj || obj.name !== "PHASE177_SMOKER_LOUNGE_STOREFRONT_ROOT") return;
      obj.visible = false;
      obj.userData.phase181HiddenOldLoungeStorefront = true;
    });
  }

  function addClearZone(root) {
    const zoneMat = new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0.075, side: THREE.DoubleSide, depthWrite: false });
    const zone = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.52, 96), zoneMat);
    zone.name = "PHASE181_LOUNGE_NO_OVERLAP_CLEAR_ZONE";
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(0, 0.012, 0.86);
    zone.renderOrder = 20;
    root.add(zone);
    return zone;
  }

  function addStorefront(scene) {
    if (!scene || scene.userData.phase181SmokerLoungeStorefrontAdded) return false;
    scene.userData.phase181SmokerLoungeStorefrontAdded = true;
    hideOlderLoungeRoots(scene);

    const root = new THREE.Group();
    root.name = "PHASE181_SMOKER_LOUNGE_STOREFRONT_ROOT";
    root.position.copy(LOUNGE_POSITION);
    root.rotation.y = LOUNGE_ROTATION_Y;
    root.scale.setScalar(0.82);
    root.userData.portalAnchor = "PORTAL_smokerLounge";
    root.userData.noOverlapRadius = 2.55;
    root.userData.lockedPosition = { x: -19.84, y: 0.02, z: 5.17, facingDegrees: LOUNGE_FACING_DEGREES };
    scene.add(root);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x08080d, roughness: 0.48, metalness: 0.36, emissive: 0x14091d, emissiveIntensity: 0.28 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb86b, roughness: 0.30, metalness: 0.45, emissive: 0x4b2107, emissiveIntensity: 0.45 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xb48cff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.24, emissive: 0x30134c, emissiveIntensity: 0.28, side: THREE.DoubleSide });

    const clearZone = addClearZone(root);

    const back = new THREE.Mesh(new THREE.BoxGeometry(3.65, 3.05, 0.14), frameMat);
    back.name = "PHASE181_LOUNGE_STOREFRONT_BACK_PANEL";
    back.position.set(0, 1.62, -0.10);
    root.add(back);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.45, 0.95),
      new THREE.MeshBasicMaterial({ map: makeTexture("Smoker Lounge", "Private Social Room", ["Located at PORTAL_smokerLounge", "No product ads active", "Relax • Talk • Watch • Return"]), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    sign.name = "PHASE181_LOUNGE_MAIN_SIGN";
    sign.position.set(0, 2.54, 0.02);
    sign.renderOrder = 80;
    root.add(sign);

    const lower = new THREE.Mesh(
      new THREE.PlaneGeometry(3.08, 1.18),
      new THREE.MeshBasicMaterial({ map: makeTexture("Lounge Entry", "Portal Beside Storefront", ["Route preserved", "No overlap zone locked", "Storefront stays off walkway"]), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    lower.name = "PHASE181_LOUNGE_ENTRY_PANEL";
    lower.position.set(0, 1.30, 0.03);
    lower.renderOrder = 81;
    root.add(lower);

    const glassL = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.80), glassMat);
    glassL.name = "PHASE181_LOUNGE_GLASS_LEFT";
    glassL.position.set(-1.88, 1.50, 0.045);
    root.add(glassL);
    const glassR = glassL.clone();
    glassR.name = "PHASE181_LOUNGE_GLASS_RIGHT";
    glassR.position.x = 1.88;
    root.add(glassR);

    neonBar(root, 0, 3.17, 0.075, 3.88, 0.04, 0xffb86b, 0.86);
    neonBar(root, 0, 0.08, 0.075, 3.88, 0.032, 0xffb86b, 0.55);
    neonBar(root, -1.96, 1.62, 0.075, 0.04, 3.05, 0xb48cff, 0.74);
    neonBar(root, 1.96, 1.62, 0.075, 0.04, 3.05, 0x7ff5c7, 0.68);

    const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 0.92), new THREE.MeshBasicMaterial({ color: 0x1a0a21, transparent: true, opacity: 0.64, side: THREE.DoubleSide }));
    mat.name = "PHASE181_LOUNGE_ENTRY_MAT_REPOSITIONED";
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(0, 0.006, 0.82);
    root.add(mat);

    const ropeA = addRope(root, -1.36, 1.02);
    const ropeB = addRope(root, 1.36, 1.02);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.72, 12), goldMat);
    rope.name = "PHASE181_LOUNGE_FRONT_ROPE";
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 0.51, 1.02);
    root.add(rope);

    const lightA = new THREE.PointLight(0xffb86b, 0.95, 5.2, 2);
    lightA.position.set(-1.25, 2.35, 0.65);
    root.add(lightA);
    const lightB = new THREE.PointLight(0xb48cff, 0.78, 4.8, 2);
    lightB.position.set(1.25, 1.15, 0.65);
    root.add(lightB);

    const prevTick = scene.userData._tickPhase181;
    scene.userData._tickPhase181 = (dt) => {
      if (prevTick) prevTick(dt);
      const p = 0.5 + 0.5 * Math.sin(performance.now() * 0.002);
      sign.scale.setScalar(1 + p * 0.006);
      lower.scale.setScalar(1 + (1 - p) * 0.004);
      mat.material.opacity = 0.50 + p * 0.10;
      clearZone.material.opacity = 0.052 + p * 0.034;
      ropeA.rotation.y += dt * 0.10;
      ropeB.rotation.y -= dt * 0.10;
    };

    if (!scene.userData.phase181TickHooked) {
      scene.userData.phase181TickHooked = true;
      const prevWorld = scene.userData._tickWorld;
      scene.userData._tickWorld = (dt) => {
        if (prevWorld) prevWorld(dt);
        if (scene.userData._tickPhase181) scene.userData._tickPhase181(dt);
      };
    }

    const status = document.getElementById("status");
    if (status) status.textContent = "Phase 181: Lounge storefront locked to smokerLounge portal location";
    window.SVR_PHASE181_SMOKER_LOUNGE_STOREFRONT = {
      phase: PHASE,
      measuredHubPosition: { x: -19.84, y: 1.60, z: 5.17, facing: "South-West (299°)" },
      storefrontPosition: { x: -19.84, y: 0.02, z: 5.17, facingDegrees: LOUNGE_FACING_DEGREES },
      noOverlapRadius: 2.55,
      besidePortal: "PORTAL_smokerLounge",
      protected: ["site", "private-scene-route", "lobby-core", "quest-controls", "neighboring-storefronts"]
    };
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE181_SMOKER_LOUNGE_STOREFRONT);
    return true;
  }

  function boot() {
    const tryHook = () => addStorefront(window.SVR_GAME?.scene);
    if (!tryHook()) {
      let attempts = 0;
      const id = setInterval(() => {
        attempts++;
        if (tryHook() || attempts > 120) clearInterval(id);
      }, 250);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}
