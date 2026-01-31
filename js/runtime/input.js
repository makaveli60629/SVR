export const Input = {
  ctx: null,

  moveSpeed: 2.2,
  turnSpeed: 2.0,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  feetRing: null,
  rayCam: null,
  rayC1: null,
  rayC2: null,
  reticle: null,

  init(ctx){
    Input.ctx = ctx;

    const onSelectStart = () => {
      Input.lastSelectTime = performance.now();
      Input.holdingSelect = true;
    };
    const onSelectEnd = () => {
      const t = performance.now() - Input.lastSelectTime;
      Input.holdingSelect = false;
      if (t < 260) Input.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    Input.buildViz();
    console.log("✅ Input initialized v2 (this-safe)");
  },

  getForward(){
    const { THREE } = Input.ctx;
    const cam = Input.getXRCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    return dir;
  },

  deadzone(v, dz=0.14){
    if (Math.abs(v) < dz) return 0;
    return Math.sign(v) * (Math.abs(v)-dz)/(1-dz);
  },

  getXRCamera(){
    const { renderer, camera } = Input.ctx;
    try {
      const xrCam = renderer.xr.getCamera(camera);
      return xrCam?.cameras?.[0] || xrCam || camera;
    } catch {
      return camera;
    }
  },

  poseOk(obj){
    if (!obj) return false;
    const v = new Input.ctx.THREE.Vector3();
    obj.getWorldPosition(v);
    return v.lengthSq() > 0.0001;
  },

  makeLaser(len=7){
    const { THREE } = Input.ctx;
    const g = new THREE.Group();
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-len)
    ]);
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color:0x00ffff })
    );
    g.add(line);
    return g;
  },

  buildViz(){
    const { THREE, scene, controller1, controller2 } = Input.ctx;

    Input.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.2,0.4,40),
      new THREE.MeshBasicMaterial({
        color:0x00c8ff,
        transparent:true,
        opacity:0.75,
        side:THREE.DoubleSide
      })
    );
    Input.feetRing.rotation.x = -Math.PI/2;
    scene.add(Input.feetRing);

    Input.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12,0.18,32),
      new THREE.MeshBasicMaterial({
        color:0x00ffff,
        transparent:true,
        opacity:0.95,
        side:THREE.DoubleSide
      })
    );
    Input.reticle.rotation.x = -Math.PI/2;
    Input.reticle.visible = false;
    scene.add(Input.reticle);

    Input.rayCam = Input.makeLaser();
    scene.add(Input.rayCam);

    Input.rayC1 = Input.makeLaser();
    Input.rayC2 = Input.makeLaser();
    if (controller1) controller1.add(Input.rayC1);
    if (controller2) controller2.add(Input.rayC2);
  },

  updateFeetRing(){
    const { rig } = Input.ctx;
    Input.feetRing.position.set(
      rig.position.x,
      rig.position.y - 1.68,
      rig.position.z
    );
  },

  getAim(){
    const { controller1, controller2 } = Input.ctx;
    if (Input.poseOk(controller1)) return { type:"c1", obj:controller1 };
    if (Input.poseOk(controller2)) return { type:"c2", obj:controller2 };
    return { type:"cam", obj:Input.getXRCamera() };
  },

  raycast(obj){
    const { THREE, teleportSurfaces } = Input.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    obj.getWorldPosition(o);
    obj.getWorldDirection(d);
    ray.set(o, d.normalize());
    return ray.intersectObjects(teleportSurfaces,true)[0] || null;
  },

  snapGround(){
    const { THREE, rig, walkSurfaces } = Input.ctx;
    if (!walkSurfaces.length) return;
    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, rig.position.y+1.6, rig.position.z),
      new THREE.Vector3(0,-1,0)
    );
    const hit = ray.intersectObjects(walkSurfaces,true)[0];
    if (hit) rig.position.y = hit.point.y + 1.7;
  },

  update(dt){
    const { rig } = Input.ctx;

    Input.updateFeetRing();

    const aim = Input.getAim();

    Input.rayCam.visible = (aim.type==="cam");
    Input.rayC1.visible  = (aim.type==="c1");
    Input.rayC2.visible  = (aim.type==="c2");

    if (aim.type==="cam"){
      const p=new Input.ctx.THREE.Vector3();
      const q=new Input.ctx.THREE.Quaternion();
      aim.obj.getWorldPosition(p);
      aim.obj.getWorldQuaternion(q);
      Input.rayCam.position.copy(p);
      Input.rayCam.quaternion.copy(q);
    }

    const hit = Input.raycast(aim.obj);
    if (hit){
      Input.reticle.visible=true;
      Input.reticle.position.copy(hit.point);
      Input.reticle.position.y+=0.02;
    } else Input.reticle.visible=false;

    if (Input.teleportQueued){
      Input.teleportQueued=false;
      if (hit){
        rig.position.set(hit.point.x, hit.point.y+1.7, hit.point.z);
        Input.snapGround();
      }
      return;
    }

    if (Input.holdingSelect){
      const f = Input.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      Input.snapGround();
      return;
    }

    const gp = navigator.getGamepads?.().find(p=>p?.axes?.length>=2);
    if (!gp) return;

    const mx = Input.deadzone(gp.axes[0]||0);
    const my = Input.deadzone(-(gp.axes[1]||0));
    const tx = Input.deadzone(gp.axes[2]||0);

    const f = Input.getForward();
    const r = new Input.ctx.THREE.Vector3(-f.z,0,f.x);

    rig.position.x += (r.x*mx + f.x*my)*Input.moveSpeed*dt;
    rig.position.z += (r.z*mx + f.z*my)*Input.moveSpeed*dt;
    rig.rotation.y -= tx * Input.turnSpeed * dt;

    Input.snapGround();
  }
};
