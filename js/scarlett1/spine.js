// /js/scarlett1/spine.js
// SCARLETT1 • SPINE (PERMANENT) — FULL FEATURE PACK
// + Rim Walk Path Lock
// + Stairs (visual) animate in/out
// + Spectator Rail
// + Auto Eagle-View Snap
// + NPCs walking the rim
// + Diagnostics + Android Touch Joysticks + Enter VR hook

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";
import { Diagnostics } from "./diagnostics.js";

export class Spine {
  constructor(opts = {}) {
    this.opts = {
      mountId: opts.mountId || "app",
      debug: opts.debug !== false,
    };

    // --- World scale assumptions (match your world.js defaults) ---
    this.PIT_RADIUS = 10.0;

    // Rim walk path constraints
    this.RIM_INNER = this.PIT_RADIUS + 0.9;   // cannot go inside this (prevents falling in)
    this.RIM_OUTER = this.PIT_RADIUS + 6.5;   // keep player near the pit area

    // Eagle view target (NOT basement)
    this.EAGLE_POS = new THREE.Vector3(0, 1.65, 8.5);
    this.EAGLE_LOOK = new THREE.Vector3(0, 0.4, 0);

    // Core 3D
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      300
    );

    // ✅ Start at rim floor level, looking slightly down into center
    this.camera.position.copy(this.EAGLE_POS);
    this.camera.lookAt(this.EAGLE_LOOK);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // Input state
    this._keys = Object.create(null);
    this._stick = { moveX: 0, moveY: 0, turnX: 0 };
    this._lastInputAt = performance.now();

    // Movement tuning
    this._moveSpeed = 0.090;
    this._turnSpeed = 0.032;

    // World objects we add
    this._spectatorRail = null;
    this._stairs = [];
    this._npcs = [];

    // For smooth snap
    this._snapBlend = 0; // 0..1
    this._snapActive = false;

    this._started = false;
  }

  start() {
    if (this._started) return;
    this._started = true;

    this._mountRenderer();
    this._installFailsafeLights();

    // ✅ Diagnostics overlay (your exact export)
    try {
      Diagnostics.mount();
      Diagnostics.log("[boot] entry");
      Diagnostics.log("[boot] Diagnostics mounted");
      Diagnostics.log(`[boot] href=${location.href}`);
      Diagnostics.log(`[boot] secureContext=${window.isSecureContext}`);
      Diagnostics.log(`[boot] touch=${("ontouchstart" in window) || (navigator.maxTouchPoints > 0)} maxTouchPoints=${navigator.maxTouchPoints || 0}`);
      Diagnostics.log(`[boot] xr=${!!navigator.xr}`);
    } catch (e) {
      console.warn("Diagnostics.mount failed", e);
    }

    Diagnostics.log("[boot] building world…");
    buildWorld(this.scene);
    Diagnostics.log("[boot] world built ✅");

    // ✅ Add spectator rail (rim)
    this._buildSpectatorRail();

    // ✅ Add animated stairs (visual in/out)
    this._buildAnimatedStairs();

    // ✅ Add NPC passers-by on the rim
    this._spawnNPCs(3);

    // ✅ Controls
    this._enableKeyboardFallback();
    this._enableTouchJoysticks();

    // Hook "Enter VR" event from index.html
    document.addEventListener("scarlett-enter-vr", () => this.enterVR());

    // Optional: hard snap at boot (prevents “basement” first frame)
    this.snapToEagle(true);

    // Main loop
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });

    Diagnostics.log("[boot] ready ✅");
  }

  tick() {
    const now = performance.now();

    // movement + constraint
    this._applyMovement();

    // animated stairs
    this._updateStairs(now);

    // NPCs
    this._updateNPCs(now);

    // auto eagle snap when idle (no input for 2.0s)
    const idleMs = now - this._lastInputAt;
    if (idleMs > 2000) {
      // gently bias you back to the rim eagle stance if you drifted
      this._autoEagleBias();
    }

    // ongoing snap blend (if active)
    this._updateSnapBlend();
  }

  onResize() {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async enterVR() {
    if (!navigator.xr) {
      Diagnostics.warn("[xr] navigator.xr not available");
      return;
    }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });
      await this.renderer.xr.setSession(session);
      Diagnostics.log("[xr] session started ✅");
    } catch (e) {
      Diagnostics.error(`[xr] failed: ${e?.message || e}`);
    }
  }

  // =========================
  // Feature: Eagle View Snap
  // =========================
  snapToEagle(immediate = false) {
    this._snapActive = true;
    this._snapBlend = immediate ? 1 : 0;
    if (immediate) {
      this.camera.position.copy(this.EAGLE_POS);
      this.camera.lookAt(this.EAGLE_LOOK);
      // lock height
      this.camera.position.y = this.EAGLE_POS.y;
      this._snapActive = false;
      Diagnostics.log("[cam] snapped to eagle view ✅");
    } else {
      Diagnostics.log("[cam] smoothing to eagle view…");
    }
  }

  _updateSnapBlend() {
    if (!this._snapActive) return;

    // blend in ~0.35s
    this._snapBlend += 0.06;
    if (this._snapBlend >= 1) {
      this._snapBlend = 1;
      this._snapActive = false;
      Diagnostics.log("[cam] eagle view complete ✅");
    }

    // Smooth move
    const t = this._snapBlend;
    this.camera.position.lerpVectors(this.camera.position, this.EAGLE_POS, t * 0.12);

    // Smooth look (rotate toward target)
    const currentDir = new THREE.Vector3();
    this.camera.getWorldDirection(currentDir);
    const targetDir = new THREE.Vector3().subVectors(this.EAGLE_LOOK, this.camera.position).normalize();
    currentDir.lerp(targetDir, t * 0.10).normalize();
    const lookPos = new THREE.Vector3().addVectors(this.camera.position, currentDir);
    this.camera.lookAt(lookPos);

    // lock height
    this.camera.position.y = this.EAGLE_POS.y;
  }

  _autoEagleBias() {
    // Soft pull toward eagle radius/heading without yanking control.
    // Only acts if you drift too close to pit edge or too far away.
    const p = this.camera.position;
    const r = Math.hypot(p.x, p.z);

    // if too close to pit edge, push outward slightly
    if (r < this.RIM_INNER + 0.35) {
      const s = (this.RIM_INNER + 0.35) / Math.max(r, 0.0001);
      p.x *= s;
      p.z *= s;
    }

    // if too far, pull inward slightly
    if (r > this.RIM_OUTER) {
      const s = (this.RIM_OUTER) / r;
      p.x *= s;
      p.z *= s;
    }

    // gently bias your Z toward eagle stance (keeps “walk by” viewpoint)
    p.z = THREE.MathUtils.lerp(p.z, this.EAGLE_POS.z, 0.01);
    p.x = THREE.MathUtils.lerp(p.x, this.EAGLE_POS.x, 0.01);

    // lock height (prevents “basement” perception)
    p.y = this.EAGLE_POS.y;
  }

  // =========================
  // Feature: Rim Walk Lock
  // =========================
  _constrainToRim() {
    const p = this.camera.position;
    const r = Math.hypot(p.x, p.z);

    // ✅ lock vertical movement always (prevents “falling into pit” feel)
    p.y = this.EAGLE_POS.y;

    // clamp radius to rim corridor
    if (r < this.RIM_INNER) {
      const s = this.RIM_INNER / Math.max(r, 0.0001);
      p.x *= s;
      p.z *= s;
    } else if (r > this.RIM_OUTER) {
      const s = this.RIM_OUTER / r;
      p.x *= s;
      p.z *= s;
    }
  }

  // =========================
  // Spectator Rail
  // =========================
  _buildSpectatorRail() {
    const railGroup = new THREE.Group();
    railGroup.name = "SPECTATOR_RAIL";

    const radius = this.PIT_RADIUS - 0.10;
    const y = 0.05;

    // top glowing ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.06, 12, 220),
      new THREE.MeshStandardMaterial({
        color: 0x2a7cff,
        roughness: 0.35,
        metalness: 0.2,
        emissive: 0x0b2a66,
        emissiveIntensity: 1.2,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y + 1.05;
    railGroup.add(ring);

    // posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x111524, roughness: 0.9 });
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05, 10);

    const posts = 24;
    for (let i = 0; i < posts; i++) {
      const a = (i / posts) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(Math.cos(a) * radius, y + 0.52, Math.sin(a) * radius);
      railGroup.add(post);
    }

    // mid rail ring
    const mid = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.03, 10, 180),
      new THREE.MeshStandardMaterial({ color: 0x1b2238, roughness: 0.8, metalness: 0.1 })
    );
    mid.rotation.x = Math.PI / 2;
    mid.position.y = y + 0.62;
    railGroup.add(mid);

    this.scene.add(railGroup);
    this._spectatorRail = railGroup;

    Diagnostics.log("[rail] spectator rail added ✅");
  }

  // =========================
  // Animated Stairs (visual)
  // =========================
  _buildAnimatedStairs() {
    const stairsCount = 4;
    const stairSteps = 7;
    const stairsWidth = 2.4;
    const run = 2.8;
    const stepH = 0.18;

    const edgeR = this.PIT_RADIUS - 0.30;

    for (let i = 0; i < stairsCount; i++) {
      const angle = (i / stairsCount) * Math.PI * 2;

      const stairGroup = new THREE.Group();
      stairGroup.name = `STAIRS_${i}`;

      // base position at rim
      stairGroup.position.set(Math.cos(angle) * edgeR, 0.02, Math.sin(angle) * edgeR);
      stairGroup.rotation.y = -angle;

      // steps
      for (let s = 0; s < stairSteps; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(stairsWidth, 0.20, run / stairSteps),
          new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.95 })
        );
        step.position.y = s * stepH + 0.10;
        step.position.z = -s * (run / stairSteps) - (run / stairSteps) / 2;
        stairGroup.add(step);
      }

      // store anim data
      this._stairs.push({
        group: stairGroup,
        baseZ: stairGroup.position.z,
        baseX: stairGroup.position.x,
        angle,
        phase: Math.random() * Math.PI * 2,
        // “in/out” amplitude (how far the stairs slide)
        slide: 1.0,
      });

      this.scene.add(stairGroup);
    }

    Diagnostics.log("[stairs] animated stairs added ✅");
  }

  _updateStairs(now) {
    // Visual only: stairs slide in/out slowly (breathing)
    for (const s of this._stairs) {
      const t = (now / 1000) + s.phase;
      const wave = (Math.sin(t * 0.35) * 0.5 + 0.5); // 0..1
      const slideOut = THREE.MathUtils.lerp(0.2, 1.2, wave); // amount sliding outward

      // slide outward along its local forward axis
      // since group rotation is set, easiest is radial move
      const r = (this.PIT_RADIUS - 0.30) + slideOut;
      s.group.position.x = Math.cos(s.angle) * r;
      s.group.position.z = Math.sin(s.angle) * r;
    }
  }

  // =========================
  // NPCs walking the rim
  // =========================
  _spawnNPCs(count = 3) {
    const npcRing = this.PIT_RADIUS + 4.6;

    for (let i = 0; i < count; i++) {
      const npc = this._makeNPC(`NPC_${i}`);
      npc.userData = {
        a: (i / count) * Math.PI * 2,
        speed: 0.18 + Math.random() * 0.08,
        r: npcRing + (Math.random() * 0.6 - 0.3),
      };
      this.scene.add(npc);
      this._npcs.push(npc);
    }

    Diagnostics.log(`[npc] spawned ${count} rim walkers ✅`);
  }

  _makeNPC(name) {
    const g = new THREE.Group();
    g.name = name;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6b08c, roughness: 0.9 });

    // torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 8, 14), bodyMat);
    torso.position.y = 1.05;
    g.add(torso);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), skinMat);
    head.position.y = 1.52;
    g.add(head);

    // legs
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 10);
    const legL = new THREE.Mesh(legGeo, bodyMat);
    const legR = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(0.08, 0.35, 0);
    legR.position.set(-0.08, 0.35, 0);
    g.add(legL, legR);

    return g;
  }

  _updateNPCs(now) {
    const t = now / 1000;
    for (const npc of this._npcs) {
      npc.userData.a += npc.userData.speed * 0.01;
      const a = npc.userData.a;
      const r = npc.userData.r;

      npc.position.set(Math.cos(a) * r, 0.0, Math.sin(a) * r);
      npc.position.y = 0; // ground

      // face direction of travel
      npc.rotation.y = -a + Math.PI / 2;

      // subtle bob (life)
      npc.position.y = 0.02 + Math.sin(t * 3 + a) * 0.01;
    }
  }

  // =========================
  // Controls + Movement
  // =========================
  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1b2238, 1.0);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(10, 14, 8);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-10, 8, -8);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0x2a7cff, 1.0, 70);
    rim.position.set(0, 2.5, 0);
    this.scene.add(rim);
  }

  _enableKeyboardFallback() {
    window.addEventListener("keydown", (e) => {
      this._keys[e.key.toLowerCase()] = true;
      this._lastInputAt = performance.now();
    });
    window.addEventListener("keyup", (e) => {
      this._keys[e.key.toLowerCase()] = false;
      this._lastInputAt = performance.now();
    });
  }

  _enableTouchJoysticks() {
    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    const makePad = (side) => {
      const pad = document.createElement("div");
      pad.classList.add("scar-pad");
      pad.style.cssText = `
        position: fixed;
        bottom: 90px;
        ${side}: 18px;
        width: 150px;
        height: 150px;
        border-radius: 999px;
        border: 2px solid rgba(80,120,255,0.35);
        background: rgba(10,14,24,0.20);
        z-index: 999998;
        touch-action: none;
        pointer-events: auto;
      `;

      const knob = document.createElement("div");
      knob.style.cssText = `
        position:absolute;
        left:50%; top:50%;
        width:70px; height:70px;
        transform: translate(-50%, -50%);
        border-radius:999px;
        border: 2px solid rgba(80,120,255,0.45);
        background: rgba(30,40,70,0.35);
      `;
      pad.appendChild(knob);

      let activeId = null;

      const reset = () => {
        activeId = null;
        if (side === "left") {
          this._stick.moveX = 0;
          this._stick.moveY = 0;
        } else {
          this._stick.turnX = 0;
        }
        knob.style.transform = "translate(-50%, -50%)";
      };

      pad.addEventListener("pointerdown", (e) => {
        activeId = e.pointerId;
        pad.setPointerCapture(activeId);
        this._lastInputAt = performance.now();
      });

      pad.addEventListener("pointermove", (e) => {
        if (e.pointerId !== activeId) return;
        this._lastInputAt = performance.now();

        const r = pad.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        let dx = e.clientX - cx;
        let dy = e.clientY - cy;

        const max = 50;
        const len = Math.hypot(dx, dy);
        if (len > max) {
          dx = (dx / len) * max;
          dy = (dy / len) * max;
        }

        const nx = dx / max;
        const ny = dy / max;

        if (side === "left") {
          this._stick.moveX = nx;
          this._stick.moveY = -ny;
        } else {
          this._stick.turnX = nx;
        }

        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });

      pad.addEventListener("pointerup", (e) => {
        if (e.pointerId !== activeId) return;
        this._lastInputAt = performance.now();
        reset();
      });
      pad.addEventListener("pointercancel", reset);

      document.body.appendChild(pad);
    };

    makePad("left");  // move
    makePad("right"); // turn

    Diagnostics.log("[input] Android joysticks visible ✅");
  }

  _applyMovement() {
    const speed = this._moveSpeed;
    const turn = this._turnSpeed;

    // forward/right vectors from camera
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    if (right.lengthSq() > 0.0001) right.normalize();

    // keyboard WASD
    if (this._keys["w"]) { this.camera.position.addScaledVector(forward, speed); this._lastInputAt = performance.now(); }
    if (this._keys["s"]) { this.camera.position.addScaledVector(forward, -speed); this._lastInputAt = performance.now(); }
    if (this._keys["a"]) { this.camera.position.addScaledVector(right, speed); this._lastInputAt = performance.now(); }
    if (this._keys["d"]) { this.camera.position.addScaledVector(right, -speed); this._lastInputAt = performance.now(); }

    // touch movement
    if (Math.abs(this._stick.moveY) > 0.02) this.camera.position.addScaledVector(forward, this._stick.moveY * speed);
    if (Math.abs(this._stick.moveX) > 0.02) this.camera.position.addScaledVector(right, this._stick.moveX * speed);

    // touch turn
    if (Math.abs(this._stick.turnX) > 0.02) this.camera.rotation.y -= this._stick.turnX * turn;

    // ✅ Lock to rim corridor + lock height
    this._constrainToRim();
  }
      }
