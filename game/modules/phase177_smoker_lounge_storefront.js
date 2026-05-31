// PHASE-177-SMOKER-LOUNGE-STOREFRONT
// Adds a modular Smoker Lounge storefront beside the existing Lounge portal.
// No site edits. No nicotine product ads. Private lounge route preserved.
import * as THREE from "three";

const PHASE = "PHASE-177-SMOKER-LOUNGE-STOREFRONT";

if (!window.__SVR_PHASE177_SMOKER_LOUNGE_STOREFRONT__) {
  window.__SVR_PHASE177_SMOKER_LOUNGE_STOREFRONT__ = true;

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
    x.font = "bold 76px system-ui, Segoe UI, Arial";
    x.fillText(title.toUpperCase(), c.width / 2, 130);
    x.fillStyle = "#cffff0";
    x.font = "bold 40px system-ui, Segoe UI, Arial";
    x.fillText(subtitle.toUpperCase(), c.width / 2, 205);
    x.fillStyle = "rgba(255,255,255,0.90)";
    x.font = "30px system-ui, Segoe UI, Arial";
    lines.slice(0, 4).forEach((line, idx) => x.fillText(line, c.width / 2, 285 + idx * 44));
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

  function addRope(parent, x, z, h = 0.54) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.44, metalness: 0.45, emissive: 0x2a1636, emissiveIntensity: 0.18 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffb86b, roughness: 0.34, metalness: 0.55, emissive: 0x4d2200, emissiveIntensity: 0.30 });
    const post = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 18), postMat);
    cyl.position.y = h * 0.5;
    post.add(cyl);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), capMat);
    cap.position.y = h + 0.035;
    post.add(cap);
    post.position.set(x, 0, z);
    parent.add(post);
    return post;
  }

  function addStorefront(scene) {
    if (!scene || scene.userData.phase177SmokerLoungeStorefrontAdded) return false;
    scene.userData.phase177SmokerLoungeStorefrontAdded = true;

    const root = new THREE.Group();
    root.name = "PHASE177_SMOKER_LOUNGE_STOREFRONT_ROOT";
    // Existing lounge portal is near (-7.8, 0, 2.2). This storefront sits directly beside it, off the walkway.
    root.position.set(-8.65, 0.02, 3.55);
    root.rotation.y = 1.18;
    scene.add(root);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x08080d, roughness: 0.48, metalness: 0.36, emissive: 0x14091d, emissiveIntensity: 0.28 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb86b, roughness: 0.30, metalness: 0.45, emissive: 0x4b2107, emissiveIntensity: 0.45 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xb48cff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.24, emissive: 0x30134c, emissiveIntensity: 0.28, side: THREE.DoubleSide });

    const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.25, 0.16), frameMat);
    back.position.set(0, 1.74, -0.10);
    root.add(back);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 1.05),
      new THREE.MeshBasicMaterial({ map: makeTexture("Smoker Lounge", "Private Social Room", ["Portal beside this storefront", "No product ads active", "Relax • Talk • Watch • Return"]), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    sign.position.set(0, 2.76, 0.02);
    sign.renderOrder = 80;
    root.add(sign);

    const lower = new THREE.Mesh(
      new THREE.PlaneGeometry(3.55, 1.35),
      new THREE.MeshBasicMaterial({ map: makeTexture("Lounge Entry", "Social Hangout", ["Private room route preserved", "Comfort seating planned", "Media wall planned"]), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    lower.position.set(0, 1.42, 0.03);
    lower.renderOrder = 81;
    root.add(lower);

    const glassL = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 2.0), glassMat);
    glassL.position.set(-2.16, 1.65, 0.045);
    root.add(glassL);
    const glassR = glassL.clone();
    glassR.position.x = 2.16;
    root.add(glassR);

    neonBar(root, 0, 3.36, 0.075, 4.45, 0.045, 0xffb86b, 0.86);
    neonBar(root, 0, 0.08, 0.075, 4.45, 0.035, 0xffb86b, 0.55);
    neonBar(root, -2.24, 1.72, 0.075, 0.045, 3.25, 0xb48cff, 0.74);
    neonBar(root, 2.24, 1.72, 0.075, 0.045, 3.25, 0x7ff5c7, 0.68);

    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.15), new THREE.MeshBasicMaterial({ color: 0x1a0a21, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    mat.name = "PHASE177_LOUNGE_ENTRY_MAT";
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(0, 0.006, 1.0);
    root.add(mat);

    const ropeA = addRope(root, -1.75, 1.26);
    const ropeB = addRope(root, 1.75, 1.26);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.5, 12), goldMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 0.58, 1.26);
    root.add(rope);

    const lightA = new THREE.PointLight(0xffb86b, 1.15, 6, 2);
    lightA.position.set(-1.5, 2.6, 0.7);
    root.add(lightA);
    const lightB = new THREE.PointLight(0xb48cff, 0.9, 5.5, 2);
    lightB.position.set(1.5, 1.25, 0.7);
    root.add(lightB);

    const prevTick = scene.userData._tickPhase177;
    scene.userData._tickPhase177 = (dt) => {
      if (prevTick) prevTick(dt);
      const p = 0.5 + 0.5 * Math.sin(performance.now() * 0.002);
      sign.scale.setScalar(1 + p * 0.008);
      lower.scale.setScalar(1 + (1 - p) * 0.006);
      mat.material.opacity = 0.58 + p * 0.12;
      ropeA.rotation.y += dt * 0.12;
      ropeB.rotation.y -= dt * 0.12;
    };

    if (!scene.userData.phase177TickHooked) {
      scene.userData.phase177TickHooked = true;
      const prevWorld = scene.userData._tickWorld;
      scene.userData._tickWorld = (dt) => {
        if (prevWorld) prevWorld(dt);
        if (scene.userData._tickPhase177) scene.userData._tickPhase177(dt);
      };
    }

    const status = document.getElementById("status");
    if (status) status.textContent = "Phase 177: Smoker Lounge storefront added by portal";
    window.SVR_PHASE177_SMOKER_LOUNGE_STOREFRONT = {
      phase: PHASE,
      position: { x: -8.65, y: 0.02, z: 3.55 },
      besidePortal: "smokerLounge",
      protected: ["site", "private-scene-route", "lobby-core", "quest-controls"]
    };
    console.log(`[${PHASE}] loaded`);
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
