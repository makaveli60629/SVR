export const Input = {
  ctx:null,
  teleportQueued:false,
  lastSelectTime:0,
  moveHeld:false,
  ax:0, ay:0,

  init(ctx){
    this.ctx = ctx;

    // XR select hold = move, tap = teleport
    const onSelectStart = ()=>{ this.lastSelectTime = performance.now(); this.moveHeld = true; };
    const onSelectEnd = ()=>{
      const t = performance.now() - this.lastSelectTime;
      this.moveHeld = false;
      if (t < 240) this.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    console.log("✅ Input ready");
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

  getAxes(){
    const c1 = this.ctx.controller1?.gamepad;
    const c2 = this.ctx.controller2?.gamepad;
    const pick = (gp)=>{
      if (!gp?.axes) return null;
      const pairs = [
        {x:gp.axes[0]||0, y:gp.axes[1]||0},
        {x:gp.axes[2]||0, y:gp.axes[3]||0},
      ];
      let best=null, m=0;
      for (const p of pairs){
        const mm = Math.abs(p.x)+Math.abs(p.y);
        if (mm>m){ m=mm; best=p; }
      }
      if (m<0.05) return null;
      return best;
    };
    const a = pick(c1) || pick(c2);
    if (!a) return {x:0,y:0};
    return { x:a.x, y:-(a.y) }; // invert Y
  },

  rayTeleport(){
    const { THREE, camera, teleportSurfaces, controller1, controller2 } = this.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();

    const from = controller1 || controller2 || camera;
    from.getWorldPosition(o);
    from.getWorldDirection(d);

    ray.set(o, d.normalize());
    const hits = ray.intersectObjects(teleportSurfaces, true);
    return hits?.[0] || null;
  },

  snapGround(){
    const { THREE, rig, walkSurfaces } = this.ctx;
    const ray = new THREE.Raycaster();
    ray.set(new THREE.Vector3(rig.position.x, rig.position.y + 1.0, rig.position.z), new THREE.Vector3(0,-1,0));
    const hits = ray.intersectObjects(walkSurfaces, true);
    if (!hits?.length) return;
    rig.position.y = hits[0].point.y + 1.7;
  },

  update(dt){
    const { THREE, rig } = this.ctx;

    if (this.teleportQueued){
      this.teleportQueued = false;
      const h = this.rayTeleport();
      if (h){
        rig.position.set(h.point.x, h.point.y + 1.7, h.point.z);
      } else {
        const f = this.getForward();
        rig.position.x += f.x * 2.0;
        rig.position.z += f.z * 2.0;
      }
      this.snapGround();
      return;
    }

    if (this.moveHeld){
      const f = this.getForward();
      const s = 2.1;
      rig.position.x += f.x * s * dt;
      rig.position.z += f.z * s * dt;
      this.snapGround();
      return;
    }

    const a = this.getAxes();
    const x = this.deadzone(a.x, 0.15);
    const y = this.deadzone(a.y, 0.15);

    const f = this.getForward();
    const r = new THREE.Vector3(-f.z, 0, f.x);

    const s = 2.4;
    rig.position.x += (r.x*x + f.x*y) * s * dt;
    rig.position.z += (r.z*x + f.z*y) * s * dt;

    this.snapGround();
  }
};
