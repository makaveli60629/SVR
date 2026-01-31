export const Input = {
  ctx:null,

  // movement
  moveSpeed: 2.4,
  turnSpeed: 1.7,    // smooth turn (fallback)
  snapTurn: true,
  snapAngle: Math.PI / 6, // 30 degrees
  snapCooldown: 0.28,
  snapT: 0,

  // teleport
  teleportQueued:false,
  lastSelectTime:0,
  moveHeld:false,

  // visuals
  rayLine:null,
  reticle:null,

  init(ctx){
    this.ctx = ctx;

    // XR select: tap to teleport, hold to move-forward (optional)
    const onSelectStart = ()=>{ this.lastSelectTime = performance.now(); this.moveHeld = true; };
    const onSelectEnd = ()=>{
      const t = performance.now() - this.lastSelectTime;
      this.moveHeld = false;
      if (t < 260) this.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    // Build teleport ray visuals
    this.buildTeleportViz();

    console.log("✅ Input ready (Quest locomotion + teleport)");
  },

  buildTeleportViz(){
    const { THREE, scene } = this.ctx;

    // Line
    const pts = [ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-6) ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff });
    this.rayLine = new THREE.Line(geom, mat);
    this.rayLine.visible = false;
    scene.add(this.rayLine);

    // Reticle
    const rGeom = new THREE.RingGeometry(0.12, 0.18, 32);
    const rMat  = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent:true, opacity:0.9, side: THREE.DoubleSide });
    this.reticle = new THREE.Mesh(rGeom, rMat);
    this.reticle.rotation.x = -Math.PI/2;
    this.reticle.visible = false;
    scene.add(this.reticle);
  },

  deadzone(v, dz=0.15){
    if (Math.abs(v) < dz) return 0;
    const s = (Math.abs(v) - dz) / (1 - dz);
    return Math.sign(v) * Math.min(1, s);
  },

  getForward(){
    const { THREE, camera } = this.ctx;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    d.y = 0;
    const l = Math.hypot(d.x, d.z) || 1;
    d.x/=l; d.z/=l;
    return d;
  },

  getRight(){
    const f = this.getForward();
    return this.ctx.THREE ? new this.ctx.THREE.Vector3(-f.z, 0, f.x) : {x:-f.z,z:f.x};
  },

  getGamepad(controller){
    const gp = controller?.gamepad;
    return gp && gp.axes ? gp : null;
  },

  // Quest standard mapping:
  // Left stick = axes[2],axes[3] OR axes[0],axes[1] depending on browser
  // Right stick = the other pair
  pickStick(gp, preferIndex){
    if (!gp) return {x:0,y:0};

    const pairs = [
      {x:gp.axes[0]||0, y:gp.axes[1]||0},
      {x:gp.axes[2]||0, y:gp.axes[3]||0},
    ];

    // preferIndex 0 or 1
    const p = pairs[preferIndex] || pairs[0];
    return { x:p.x, y:-(p.y) };
  },

  rayTeleportFrom(obj){
    const { THREE, camera, teleportSurfaces } = this.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();

    const from = obj || camera;
    from.getWorldPosition(o);
    from.getWorldDirection(d);

    ray.set(o, d.normalize());
    const hits = ray.intersectObjects(teleportSurfaces, true);
    return hits?.[0] || null;
  },

  snapGround(){
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces?.length) return;

    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, rig.position.y + 1.2, rig.position.z),
      new THREE.Vector3(0,-1,0)
    );
    const hits = ray.intersectObjects(walkSurfaces, true);
    if (!hits?.length) return;

    rig.position.y = hits[0].point.y + 1.7;
  },

  updateTeleportViz(hit, fromObj){
    const { THREE, camera } = this.ctx;
    if (!this.rayLine || !this.reticle) return;

    if (!hit){
      this.rayLine.visible = false;
      this.reticle.visible = false;
      return;
    }

    // Show reticle
    this.reticle.visible = true;
    this.reticle.position.copy(hit.point);
    this.reticle.position.y += 0.02;

    // Show ray line
    this.rayLine.visible = true;
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    const src = fromObj || camera;
    src.getWorldPosition(o);
    src.getWorldDirection(d);
    const end = hit.point.clone();

    const arr = this.rayLine.geometry.attributes.position.array;
    arr[0]=o.x; arr[1]=o.y; arr[2]=o.z;
    arr[3]=end.x; arr[4]=end.y; arr[5]=end.z;
    this.rayLine.geometry.attributes.position.needsUpdate = true;
  },

  update(dt){
    const { rig, controller1, controller2 } = this.ctx;

    // Snap turn timer
    this.snapT = Math.max(0, this.snapT - dt);

    // Choose a controller as "aim"
    const aim = controller1 || controller2;

    // Always compute teleport target so user sees where they're aiming
    const hit = this.rayTeleportFrom(aim);
    this.updateTeleportViz(hit, aim);

    // Teleport on queued
    if (this.teleportQueued){
      this.teleportQueued = false;
      if (hit){
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    // Hold-select = gentle forward walk (optional)
    if (this.moveHeld){
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

    // Thumbsticks locomotion
    const gp1 = this.getGamepad(controller1);
    const gp2 = this.getGamepad(controller2);

    // Prefer controller1 for locomotion; fallback controller2
    const gp = gp1 || gp2;

    // Try both mappings:
    // left stick candidate = pair 0, right stick = pair 1 (or swapped)
    const a0 = this.pickStick(gp, 0);
    const a1 = this.pickStick(gp, 1);

    // Decide which is "move": whichever has more magnitude (works across mappings)
    const m0 = Math.abs(a0.x)+Math.abs(a0.y);
    const m1 = Math.abs(a1.x)+Math.abs(a1.y);

    const move = (m0 >= m1) ? a0 : a1;
    const turn = (m0 >= m1) ? a1 : a0;

    const mx = this.deadzone(move.x, 0.15);
    const my = this.deadzone(move.y, 0.15);

    const tx = this.deadzone(turn.x, 0.22);

    // Apply move in camera space
    const f = this.getForward();
    const r = this.ctx.THREE.Vector3 ? new this.ctx.THREE.Vector3(-f.z, 0, f.x) : {x:-f.z,z:f.x};

    const s = this.moveSpeed;
    rig.position.x += (r.x*mx + f.x*my) * s * dt;
    rig.position.z += (r.z*mx + f.z*my) * s * dt;

    // Turn
    if (this.snapTurn){
      if (this.snapT <= 0 && Math.abs(tx) > 0.55){
        rig.rotation.y -= Math.sign(tx) * this.snapAngle;
        this.snapT = this.snapCooldown;
      }
    } else {
      rig.rotation.y -= tx * this.turnSpeed * dt;
    }

    this.snapGround();
  }
};
