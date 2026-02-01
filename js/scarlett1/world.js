export const Input = {
  ctx: null,

  moveSpeed: 2.25,
  turnSpeed: 2.15,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  feetRing: null,
  reticle: null,

  // the ray is ATTACHED to right controller
  rightRay: null,
  rayLen: 7.0,

  init(ctx){
    this.ctx = ctx;

    const onSelectStart = () => {
      this.lastSelectTime = performance.now();
      this.holdingSelect = true;
    };
    const onSelectEnd = () => {
      const t = performance.now() - this.lastSelectTime;
      this.holdingSelect = false;
      if (t < 260) this.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildViz();
    console.log("✅ Input initialized (right ray attached + XR gamepad)");
  },

  deadzone(v, dz=0.16){
    if (Math.abs(v) < dz) return 0;
    return Math.sign(v) * (Math.abs(v)-dz)/(1-dz);
  },

  // Prefer the controller that reports handedness === right
  getRightController(){
    const { controller1, controller2 } = this.ctx;
    if (controller1?.userData?.handedness === "right") return controller1;
    if (controller2?.userData?.handedness === "right") return controller2;

    // fallback: often controller2 acts as right
    return controller2 || controller1 || null;
  },

  getXRCamera(){
    const { renderer, camera } = this.ctx;
    try{
      const xrCam = renderer.xr.getCamera(camera);
      return xrCam?.cameras?.[0] || xrCam || camera;
    }catch{
      return camera;
    }
  },

  getFlatForward(){
    // forward based on camera direction but flattened
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    return dir;
  },

  buildViz(){
    const { THREE, scene } = this.ctx;

    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.40, 44),
      new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide
      })
    );
    this.feetRing.rotation.x = -Math.PI/2;
    scene.add(this.feetRing);

    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 40),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      })
    );
    this.reticle.rotation.x = -Math.PI/2;
    this.reticle.visible = false;
    scene.add(this.reticle);

    // Build ray (line) ONCE
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-this.rayLen)
    ]);
    const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color:0x00ffff }));
    this.rightRay = new THREE.Group();
    this.rightRay.add(line);
    this.rightRay.visible = false;

    // Attach later (after controller exists)
  },

  ensureRayAttached(){
    const { scene } = this.ctx;
    if (!this.rightRay) return;

    const right = this.getRightController();
    if (right && this.rightRay.parent !== right){
      // remove from old parent
      if (this.rightRay.parent) this.rightRay.parent.remove(this.rightRay);

      // attach to RIGHT controller
      right.add(this.rightRay);
      this.rightRay.position.set(0,0,0);
      this.rightRay.rotation.set(0,0,0);
      this.rightRay.visible = true;
      return;
    }

    // If no controller at all (rare), attach to camera
    if (!right){
      const cam = this.getXRCamera();
      if (this.rightRay.parent !== cam){
        if (this.rightRay.parent) this.rightRay.parent.remove(this.rightRay);
        cam.add(this.rightRay);
        this.rightRay.position.set(0,0,0);
        this.rightRay.rotation.set(0,0,0);
        this.rightRay.visible = true;
      }
    }
  },

  updateFeetRing(){
    const { rig } = this.ctx;
    this.feetRing.position.set(rig.position.x, rig.position.y - 1.68, rig.position.z);
  },

  raycastFrom(obj){
    const { THREE, teleportSurfaces } = this.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    obj.getWorldPosition(o);
    obj.getWorldDirection(d);
    ray.set(o, d.normalize());
    return ray.intersectObjects(teleportSurfaces, true)[0] || null;
  },

  snapGround(){
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces.length) return;

    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, rig.position.y + 1.6, rig.position.z),
      new THREE.Vector3(0,-1,0)
    );
    const hit = ray.intersectObjects(walkSurfaces, true)[0];
    if (hit) rig.position.y = hit.point.y + 1.7;
  },

  clampToBounds(){
    const { rig, bounds } = this.ctx;
    if (!bounds) return;

    const x = rig.position.x;
    const z = rig.position.z;
    const r = Math.hypot(x,z) || 0.00001;

    const inPit = rig.position.y < bounds.pitTopY;

    if (inPit){
      const maxR = bounds.pitInnerR;
      if (r > maxR){
        const s = maxR / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
    } else {
      const minR = bounds.pitOuterR;
      const maxR = bounds.lobbyR;

      if (r < minR){
        const s = minR / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
      if (r > maxR){
        const s = maxR / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
    }
  },

  // Prefer XR right-controller gamepad for stick locomotion
  getRightGamepad(){
    const right = this.getRightController();
    const gp = right?.userData?.gamepad;
    if (gp?.axes?.length >= 2) return gp;

    // fallback: any gamepad with axes
    const all = navigator.getGamepads?.() || [];
    for (const g of all){
      if (g?.axes?.length >= 2) return g;
    }
    return null;
  },

  update(dt){
    const { rig } = this.ctx;

    this.ensureRayAttached();
    this.updateFeetRing();

    const rightCtrl = this.getRightController() || this.getXRCamera();
    const hit = this.raycastFrom(rightCtrl);

    if (hit){
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }

    // tap => teleport
    if (this.teleportQueued){
      this.teleportQueued = false;
      if (hit){
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
        this.clampToBounds();
      }
      return;
    }

    // hold => walk forward (fallback)
    if (this.holdingSelect){
      const f = this.getFlatForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      this.clampToBounds();
      return;
    }

    // stick locomotion
    const gp = this.getRightGamepad();
    if (!gp) return;

    const mx = this.deadzone(gp.axes[0] || 0);
    const my = this.deadzone(-(gp.axes[1] || 0));

    // Optional snap-turn: use right stick X if present
    const tx = this.deadzone(gp.axes[2] || 0);

    const f = this.getFlatForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    rig.position.x += (r.x*mx + f.x*my) * this.moveSpeed * dt;
    rig.position.z += (r.z*mx + f.z*my) * this.moveSpeed * dt;

    rig.rotation.y -= tx * this.turnSpeed * dt;

    this.snapGround();
    this.clampToBounds();
  }
};
