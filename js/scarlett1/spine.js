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
    this.opts = { mountId: opts.mountId || "app", debug: opts.debug !== false };

    // Match your world
    this.PIT_RADIUS = 10.0;

    // Rim corridor (player stays here)
    this.RIM_INNER = this.PIT_RADIUS + 0.9;
    this.RIM_OUTER = this.PIT_RADIUS + 6.5;

    // Eagle view (lobby height)
    this.EAGLE_POS = new THREE.Vector3(0, 1.65, 8.5);
    this.EAGLE_LOOK = new THREE.Vector3(0, 0.4, 0);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 300);
    this.camera.position.copy(this.EAGLE_POS);
    this.camera.lookAt(this.EAGLE_LOOK);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    this._keys = Object.create(null);
    this._stick = { moveX: 0, moveY: 0, turnX: 0 };
    this._lastInputAt = performance.now();

    this._moveSpeed = 0.090;
    this._turnSpeed = 0.032;

    this._stairs = [];
    this._npcs = [];

    this._snapBlend = 0;
    this._snapActive = false;

    this._started = false;
  }

  start() {
    if (this._started) return;
    this._started = true;

    this._mountRenderer();
    this._installFailsafeLights();

    // Diagnostics
    try {
      Diagnostics.mount();
      Diagnostics.log("[boot] entry");
      Diagnostics.log("[boot] Diagnostics mounted");
      Diagnostics.log(`[boot] href=${location.href}`);
      Diagnostics.log(`[boot] touch=${("ontouchstart" in window) || (navigator.maxTouchPoints > 0)} maxTouchPoints=${navigator.maxTouchPoints || 0}`);
      Diagnostics.log(`[boot] xr=${!!navigator.xr}`);
    } catch (e) {
      console.warn("Diagnostics.mount failed", e);
    }

    Diagnostics.log("[boot] building world…");
    buildWorld(this.scene);
    Diagnostics.log("[boot] world built ✅");

    this._buildSpectatorRail();
    this._buildAnimatedStairs();
    this._spawnNPCs(3);

    this._enableKeyboardFallback();
    this._enableTouchJoysticks();

    document.addEventListener("scarlett-enter-vr", () => this.enterVR());

    this.snapToEagle(true);

    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });

    Diagnostics.log("[boot] ready ✅");
  }

  tick() {
    const now = performance.now();
    this._applyMovement();
    this._updateStairs(now);
    this._updateNPCs(now);

    if (now - this._lastInputAt > 2000) this._autoEagleBias();
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
    if (!navigator.xr) { Diagnostics.warn("[xr] navigator.xr not available"); return; }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
      });
      await this.renderer.xr.setSession(session);
      Diagnostics.log("[xr] session started ✅");
    } catch (e) {
      Diagnostics.error(`[xr] failed: ${e?.message || e}`);
    }
  }

  // ---------- Eagle snap ----------
  snapToEagle(immediate = false) {
    this._snapActive = true;
    this._snapBlend = immediate ? 1 : 0;
    if (immediate) {
      this.camera.position.copy(this.EAGLE_POS);
      this.camera.lookAt(this.EAGLE_LOOK);
      this.camera.position.y = this.EAGLE_POS.y;
      this._snapActive = false;
      Diagnostics.log("[cam] snapped to eagle view ✅");
    }
  }

  _updateSnapBlend() {
    if (!this._snapActive) return;
    this._snapBlend += 0.06;
    if (this._snapBlend >= 1) { this._snapBlend = 1; this._snapActive = false; }

    const t = this._snapBlend;
    // Smooth move
    this.camera.position.lerp(this.EAGLE_POS, t * 0.06);

    // Smooth look
    const dir = new THREE.Vector3().subVectors(this.EAGLE_LOOK, this.camera.position).normalize();
    const lookPos = new THREE.Vector3().addVectors(this.camera.position, dir);
    this.camera.lookAt(lookPos);

    // lock height
    this.camera.position.y = this.EAGLE_POS.y;
  }

  _autoEagleBias() {
    const p = this.camera.position;
    const r = Math.hypot(p.x, p.z);

    if (r < this.RIM_INNER + 0.35) {
      const s = (this.RIM_INNER + 0.35) / Math.max(r, 0.0001);
      p.x *= s; p.z *= s;
    }
    if (r > this.RIM_OUTER) {
      const s = this.RIM_OUTER / r;
      p.x *= s; p.z *= s;
    }

    p.z = THREE.MathUtils.lerp(p.z, this.EAGLE_POS.z, 0.01);
    p.x = THREE.MathUtils.lerp(p.x, this.EAGLE_POS.x, 0.01);
    p.y = this.EAGLE_POS.y;
  }

  _constrainToRim() {
    const p = this.camera.position;
    p.y = this.EAGLE_POS.y;

    const r = Math.hypot(p.x, p.z);
    if (r < this.RIM_INNER) {
      const s = this.RIM_INNER / Math.max(r, 0.0001);
      p.x *= s; p.z *= s;
    } else if (r > this.RIM_OUTER) {
      const s = this.RIM_OUTER / r;
      p.x *= s; p.z *= s;
    }
  }

  // ---------- Rail ----------
  _buildSpectatorRail() {
    const g = new THREE.Group();
    g.name = "SPECTATOR_RAIL";
    const radius = this.PIT_RADIUS - 0.10;

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
    ring.position.y = 1.10;
    g.add(ring);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x111524, roughness: 0.9 });
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05, 10);
    const posts = 24;
    for (let i = 0; i < posts; i++) {
      const a = (i / posts) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(Math.cos(a) * radius, 0.52, Math.sin(a) * radius);
      g.add(post);
    }

    const mid = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.03, 10, 180),
      new THREE.MeshStandardMaterial({ color: 0x1b2238, roughness: 0.8, metalness: 0.1 })
    );
    mid.rotation.x = Math.PI / 2;
    mid.position.y = 0.62;
    g.add(mid);

    this.scene.add(g);
    Diagnostics.log("[rail] spectator rail added ✅");
  }

  // ---------- Stairs ----------
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

      stairGroup.position.set(Math.cos(angle) * edgeR, 0.02, Math.sin(angle) * edgeR);
      stairGroup.rotation.y = -angle;

      for (let s = 0; s < stairSteps; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(stairsWidth, 0.20, run / stairSteps),
          new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.95 })
        );
        step.position.y = s * stepH + 0.10;
        step.position.z = -s * (run / stairSteps) - (run / stairSteps) / 2;
        stairGroup.add(step);
      }

      this._stairs.push({ group: stairGroup, angle, phase: Math.random() * Math.PI * 2 });
      this.scene.add(stairGroup);
    }

    Diagnostics.log("[stairs] animated stairs added ✅");
  }

  _updateStairs(now) {
    for (const s of this._stairs) {
      const t = (now / 1000) + s.phase;
      const wave = (Math.sin(t * 0.35) * 0.5 + 0.5);
      const slideOut = THREE.MathUtils.lerp(0.2, 1.2, wave);
      const r = (this.PIT_RADIUS - 0.30) + slideOut;
      s.group.position.x = Math.cos(s.angle) * r;
      s.group.position.z = Math.sin(s.angle) * r;
    }
  }

  // ---------- NPCs ----------
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

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 8, 14), bodyMat);
    torso.position.y = 1.05; g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), skinMat);
    head.position.y = 1.52; g.add(head);

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
      npc.rotation.y = -a + Math.PI / 2;
      npc.position.y = 0.02 + Math.sin(t * 3 + a) * 0.01;
    }
  }

  // ---------- Renderer + Lights ----------
  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x1b2238, 1.0));

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

  // ---------- Controls ----------
  _enableKeyboardFallback() {
    window.addEventListener("keydown", (e) => { this._keys[e.key.toLowerCase()] = true; this._lastInputAt = performance.now(); });
    window.addEventListener("keyup", (e) => { this._keys[e.key.toLowerCase()] = false; this._lastInputAt = performance.now(); });
  }

  _enableTouchJoysticks() {
    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    const makePad = (side) => {
      const pad = document.createElement("div");
      pad.classList.add("scar-pad");
      pad.style.cssText = `
        position: fixed; bottom: 90px; ${side}: 18px;
        width: 150px; height: 150px; border-radius: 999px;
        border: 2px solid rgba(80,120,255,0.35);
        background: rgba(10,14,24,0.20);
        z-index: 999998; touch-action: none; pointer-events: auto;
      `;

      const knob = document.createElement("div");
      knob.style.cssText = `
        position:absolute; left:50%; top:50%;
        width:70px; height:70px; transform: translate(-50%, -50%);
        border-radius:999px;
        border: 2px solid rgba(80,120,255,0.45);
        background: rgba(30,40,70,0.35);
      `;
      pad.appendChild(knob);

      let activeId = null;

      const reset = () => {
        activeId = null;
        if (side === "left") { this._stick.moveX = 0; this._stick.moveY = 0; }
        else { this._stick.turnX = 0; }
        knob.style.transform = "translate(-50%, -50%)";
      };

      pad.addEventListener("pointerdown", (e) => { activeId = e.pointerId; pad.setPointerCapture(activeId); this._lastInputAt = performance.now(); });
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
        if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }

        const nx = dx / max;
        const ny = dy / max;

        if (side === "left") { this._stick.moveX = nx; this._stick.moveY = -ny; }
        else { this._stick.turnX = nx; }

        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });

      pad.addEventListener("pointerup", (e) => { if (e.pointerId !== activeId) return; this._lastInputAt = performance.now(); reset(); });
      pad.addEventListener("pointercancel", reset);

      document.body.appendChild(pad);
    };

    makePad("left");
    makePad("right");
    Diagnostics.log("[input] Android joysticks visible ✅");
  }

  _applyMovement() {
    const speed = this._moveSpeed;
    const turn = this._turnSpeed;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    if (right.lengthSq() > 0.0001) right.normalize();

    if (this._keys["w"]) { this.camera.position.addScaledVector(forward, speed); this._lastInputAt = performance.now(); }
    if (this._keys["s"]) { this.camera.position.addScaledVector(forward, -speed); this._lastInputAt = performance.now(); }
    if (this._keys["a"]) { this.camera.position.addScaledVector(right, speed); this._lastInputAt = performance.now(); }
    if (this._keys["d"]) { this.camera.position.addScaledVector(right, -speed); this._lastInputAt = performance.now(); }

    if (Math.abs(this._stick.moveY) > 0.02) this.camera.position.addScaledVector(forward, this._stick.moveY * speed);
    if (Math.abs(this._stick.moveX) > 0.02) this.camera.position.addScaledVector(right, this._stick.moveX * speed);

    if (Math.abs(this._stick.turnX) > 0.02) this.camera.rotation.y -= this._stick.turnX * turn;

    this._constrainToRim();
  }
}
