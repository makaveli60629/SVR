export const Input = {
  ctx: null,

  moveSpeed: 2.2,
  turnSpeed: 2.0,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  feetRing: null,
  rayRight: null,
  reticle: null,

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

    // works for Touch and for XR input sources
    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildViz();
    console.log("✅ Input initialized (right-hand laser + bounds)");
  },

  deadzone(v, dz=0.14){
    if (Math.abs(v) < dz) return 0;
    return Math.sign(v) * (Math.abs(v)-dz)/(1-dz);
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

  getForward(){
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    return dir;
  },

  // choose RIGHT hand controller if available; else fallback to headset
  getRightAim(){
    const { controller1, controller2 } = this.ctx;

    const cands = [controller1, controller2].filter(Boolean);
    const right = cands.find(c => c.userData?.handedness === "right");
    if (right) return right;

    // sometimes handedness is still unknown for a moment; prefer controller2 as common "right"
    if (controller2) return controller2;
    if (controller1) return controller1;

    return this.getXRCamera();
  },

  makeLaser(len=7){
    const { THREE } = this.ctx;
    const g = new THREE.Group();
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-len),
    ]);
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: 0x00ffff })
    );
    g.add(line);
    return g;
  },

  buildViz(){
    const { THREE, scene } = this.ctx;

    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.40, 44),
      new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.75,
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

    // laser is world-attached, but we copy the RIGHT aim pose each frame
    this.rayRight = this.makeLaser(7.0);
    scene.add(this.rayRight);
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
      new THREE.Vector3(0, -1, 0)
    );
    const hit = ray.intersectObjects(walkSurfaces, true)[0];
    if (hit) rig.position.y = hit.point.y + 1.7;
  },

  // hard bounds so you cannot walk through pit walls or outside lobby
  clampToBounds(){
    const { rig, bounds } = this.ctx;
    if (!bounds) return;

    const x = rig.position.x;
    const z = rig.position.z;
    const r = Math.hypot(x, z) || 0.00001;

    // decide if we are "in pit" by height
    const inPit = rig.position.y < bounds.pitTopY;

    if (inPit){
      // keep inside pit radius
      const maxR = bounds.pitInnerR;
      if (r > maxR){
        const s = maxR / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
    } else {
      // keep outside pit hole AND inside lobby
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

  update(dt){
    const { rig } = this.ctx;

    this.updateFeetRing();

    // RIGHT-hand aim
    const aim = this.getRightAim();

    // pose laser to aim
    {
      const p = new this.ctx.THREE.Vector3();
      const q = new this.ctx.THREE.Quaternion();
      aim.getWorldPosition(p);
      aim.getWorldQuaternion(q);
      this.rayRight.position.copy(p);
      this.rayRight.quaternion.copy(q);
    }

    const hit = this.raycastFrom(aim);

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
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      this.clampToBounds();
      return;
    }

    // sticks (best effort)
    const gp = navigator.getGamepads?.().find(p => p?.axes?.length >= 2);
    if (!gp) return;

    const mx = this.deadzone(gp.axes[0] || 0);
    const my = this.deadzone(-(gp.axes[1] || 0));
    const tx = this.deadzone(gp.axes[2] || 0);

    const f = this.getForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    rig.position.x += (r.x * mx + f.x * my) * this.moveSpeed * dt;
    rig.position.z += (r.z * mx + f.z * my) * this.moveSpeed * dt;
    rig.rotation.y -= tx * this.turnSpeed * dt;

    this.snapGround();
    this.clampToBounds();
  }
};
