export const Input = {
  ctx:null,

  // movement
  moveSpeed: 2.2,
  snapTurn: true,
  snapAngle: Math.PI / 6,
  snapCooldown: 0.28,
  snapT: 0,

  // trigger behavior
  teleportQueued:false,
  lastSelectTime:0,
  holdingSelect:false,

  // visuals
  rayLine:null,
  reticle:null,

  init(ctx){
    this.ctx = ctx;

    const onSelectStart = ()=>{
      this.lastSelectTime = performance.now();
      this.holdingSelect = true;
    };

    const onSelectEnd = ()=>{
      const t = performance.now() - this.lastSelectTime;
      this.holdingSelect = false;
      // Tap => teleport, Hold => was walk
      if (t < 260) this.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildTeleportViz();
    console.log("✅ Input ready (tap teleport + hold walk forward + reticle)");
  },

  buildTeleportViz(){
    const { THREE, scene } = this.ctx;

    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-6),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff });
    this.rayLine = new THREE.Line(geom, mat);
    this.rayLine.visible = true;
    scene.add(this.rayLine);

    const rGeom = new THREE.RingGeometry(0.12, 0.18, 32);
    const rMat  = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent:true, opacity:0.95, side: THREE.DoubleSide });
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

  getGamepad(controller){
    const gp = controller?.gamepad;
    return gp && gp.axes ? gp : null;
  },

  pickStick(gp, idx){
    if (!gp) return {x:0,y:0};
    const pairs = [
      {x:gp.axes[0]||0, y:gp.axes[1]||0},
      {x:gp.axes[2]||0, y:gp.axes[3]||0},
    ];
    const p = pairs[idx] || pairs[0];
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
      new THREE.Vector3(rig.position.x, rig.position.y + 1.3, rig.position.z),
      new THREE.Vector3(0,-1,0)
    );
    const hits = ray.intersectObjects(walkSurfaces, true);
    if (!hits?.length) return;

    rig.position.y = hits[0].point.y + 1.7;
  },

  updateTeleportViz(hit, fromObj){
    const { THREE, camera } = this.ctx;
    if (!this.rayLine || !this.reticle) return;

    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    const src = fromObj || camera;
    src.getWorldPosition(o);
    src.getWorldDirection(d);

    if (!hit){
      this.reticle.visible = false;
      // still show a short ray forward
      const end = o.clone().add(d.multiplyScalar(3));
      const arr = this.rayLine.geometry.attributes.position.array;
      arr[0]=o.x; arr[1]=o.y; arr[2]=o.z;
      arr[3]=end.x; arr[4]=end.y; arr[5]=end.z;
      this.rayLine.geometry.attributes.position.needsUpdate = true;
      return;
    }

    this.reticle.visible = true;
    this.reticle.position.copy(hit.point);
    this.reticle.position.y += 0.02;

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

    // Aim controller
    const aim = controller1 || controller2;

    // Teleport target (for circle/reticle)
    const hit = this.rayTeleportFrom(aim);
    this.updateTeleportViz(hit, aim);

    // Teleport on tap
    if (this.teleportQueued){
      this.teleportQueued = false;
      if (hit){
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    // HOLD trigger = walk forward (universal fallback)
    if (this.holdingSelect){
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

    // Thumbsticks locomotion (best effort)
    const gp = this.getGamepad(controller1) || this.getGamepad(controller2);
    const a0 = this.pickStick(gp, 0);
    const a1 = this.pickStick(gp, 1);

    const m0 = Math.abs(a0.x)+Math.abs(a0.y);
    const m1 = Math.abs(a1.x)+Math.abs(a1.y);

    const move = (m0 >= m1) ? a0 : a1;
    const turn = (m0 >= m1) ? a1 : a0;

    const mx = this.deadzone(move.x, 0.15);
    const my = this.deadzone(move.y, 0.15);
    const tx = this.deadzone(turn.x, 0.22);

    const f = this.getForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    const s = this.moveSpeed;
    rig.position.x += (r.x*mx + f.x*my) * s * dt;
    rig.position.z += (r.z*mx + f.z*my) * s * dt;

    if (this.snapTurn){
      if (this.snapT <= 0 && Math.abs(tx) > 0.55){
        rig.rotation.y -= Math.sign(tx) * this.snapAngle;
        this.snapT = this.snapCooldown;
      }
    }

    this.snapGround();
  }
};
