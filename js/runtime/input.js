export const Input = {
  ctx: null,

  moveSpeed: 2.2,
  snapTurn: false,              // smooth turn by default (better for sticks)
  turnSpeed: 2.0,               // radians/sec
  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  // visuals
  feetRing: null,

  // three laser rigs (attached to XR objects)
  rayCam: null,
  rayC1: null,
  rayC2: null,
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

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildViz();
    console.log("✅ Input ready (laser attached to XR objects)");
  },

  deadzone(v, dz=0.14){
    if (Math.abs(v) < dz) return 0;
    const s = (Math.abs(v) - dz) / (1 - dz);
    return Math.sign(v) * Math.min(1, s);
  },

  getXRCamera(){
    const { renderer, camera } = this.ctx;
    try {
      const xrCam = renderer.xr.getCamera(camera);
      return xrCam?.cameras?.[0] || xrCam || camera;
    } catch {
      return camera;
    }
  },

  // controller pose is valid if not near origin
  poseOk(obj){
    if (!obj) return false;
    const p = this._tmpV || (this._tmpV = new this.ctx.THREE.Vector3());
    obj.getWorldPosition(p);
    return (Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z)) > 0.001;
  },

  // create a laser group with a local line (0,0,0 -> 0,0,-len)
  makeLaser(len=6.0){
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

    // little “muzzle” dot
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    dot.position.set(0,0,-0.02);
    g.add(dot);

    // offset so it looks like it comes from the hand/controller
    g.position.set(0, 0, 0);
    return g;
  },

  buildViz(){
    const { THREE, scene, controller1, controller2 } = this.ctx;

    // feet ring (world)
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

    // reticle (world)
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

    // attach lasers
    this.rayCam = this.makeLaser(7.0);
    this.rayC1  = this.makeLaser(7.0);
    this.rayC2  = this.makeLaser(7.0);

    // camera laser is attached each frame (camera object can change in XR),
    // but we’ll keep it in the scene and position/rotate it from XR camera.
    scene.add(this.rayCam);

    if (controller1) controller1.add(this.rayC1);
    if (controller2) controller2.add(this.rayC2);

    this.rayCam.visible = true;
    this.rayC1.visible  = true;
    this.rayC2.visible  = true;
  },

  updateFeetRing(){
    const { rig } = this.ctx;
    this.feetRing.position.set(rig.position.x, rig.position.y - 1.68, rig.position.z);
  },

  // pick active aim source: prefer controller with valid pose, else XR camera
  getAimSource(){
    const { controller1, controller2 } = this.ctx;
    if (this.poseOk(controller1)) return { type:"c1", obj: controller1 };
    if (this.poseOk(controller2)) return { type:"c2", obj: controller2 };
    return { type:"cam", obj: this.getXRCamera() };
  },

  // raycast from aim object
  raycastFrom(obj){
    const { THREE, teleportSurfaces } = this.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    obj.getWorldPosition(o);
    obj.getWorldDirection(d);
    ray.set(o, d.normalize());
    const hits = ray.intersectObjects(teleportSurfaces, true);
    return hits?.[0] || null;
  },

  updateReticle(hit){
    if (hit){
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }
  },

  // snap rig down onto walk surfaces (no “air walking”)
  snapGround(){
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces?.length) return;
    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, rig.position.y + 1.6, rig.position.z),
      new THREE.Vector3(0,-1,0)
    );
    const hits = ray.intersectObjects(walkSurfaces, true);
    if (!hits?.length) return;
    rig.position.y = hits[0].point.y + 1.7;
  },

  // robust axes mapping: choose best two axis pairs for move+turn
  getMoveTurnFromGamepad(gp){
    if (!gp || !gp.axes || gp.axes.length < 2) return { mx:0, my:0, tx:0 };

    // build candidate pairs: (0,1), (2,3), (4,5)...
    const pairs = [];
    for (let i=0;i+1<gp.axes.length;i+=2){
      const x = gp.axes[i] || 0;
      const y = gp.axes[i+1] || 0;
      const mag = Math.abs(x) + Math.abs(y);
      pairs.push({ i, x, y, mag });
    }
    pairs.sort((a,b)=> b.mag - a.mag);

    const move = pairs[0] || { x:0, y:0 };
    const turn = pairs[1] || { x:0, y:0 };

    // Meta reports forward as -Y usually
    const mx = this.deadzone(move.x, 0.14);
    const my = this.deadzone(-(move.y), 0.14);

    // turn on X of second-best pair; if none, use move.x lightly
    let tx = this.deadzone(turn.x, 0.18);
    if (Math.abs(tx) < 0.001) tx = this.deadzone(move.x, 0.24);

    return { mx, my, tx };
  },

  // attempt to find a controller gamepad first, else fallback to navigator.getGamepads()
  getAnyGamepad(){
    const { controller1, controller2 } = this.ctx;
    const g1 = controller1?.gamepad;
    const g2 = controller2?.gamepad;
    if (g1 && g1.axes) return g1;
    if (g2 && g2.axes) return g2;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads){
      if (p && p.axes && p.axes.length >= 2) return p;
    }
    return null;
  },

  // keep camera laser following XR camera pose (since xr camera object can be special)
  updateCameraLaserPose(){
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    cam.getWorldPosition(p);
    cam.getWorldQuaternion(q);
    this.rayCam.position.copy(p);
    this.rayCam.quaternion.copy(q);
  },

  // show only the active laser, guaranteed attached to the aim source
  updateLaserVisibility(activeType){
    // controller lasers are children; camera laser is world-attached
    this.rayCam.visible = (activeType === "cam");
    this.rayC1.visible  = (activeType === "c1");
    this.rayC2.visible  = (activeType === "c2");
  },

  update(dt){
    const { rig } = this.ctx;

    this.updateFeetRing();
    this.updateCameraLaserPose();

    const aim = this.getAimSource();
    this.updateLaserVisibility(aim.type);

    const hit = this.raycastFrom(aim.obj);
    this.updateReticle(hit);

    // tap trigger => teleport
    if (this.teleportQueued){
      this.teleportQueued = false;
      if (hit){
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    // hold trigger => walk forward (works even if sticks fail)
    if (this.holdingSelect){
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

    // sticks movement
    const gp = this.getAnyGamepad();
    const { mx, my, tx } = this.getMoveTurnFromGamepad(gp);

    const f = this.getForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    rig.position.x += (r.x * mx + f.x * my) * this.moveSpeed * dt;
    rig.position.z += (r.z * mx + f.z * my) * this.moveSpeed * dt;

    // smooth turn
    rig.rotation.y -= tx * this.turnSpeed * dt;

    this.snapGround();
  }
};
