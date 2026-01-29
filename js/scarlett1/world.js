/**
 * /js/scarlett1/world.js — PERMANENT SAFE
 * - OPEN pit divot (NO disk)
 * - Bright lobby
 * - Android joystick SAFE MODE
 */

export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  log('[world] init start');

  const holeR = 6.0;
  const outerR = 70.0;
  const pitY  = -1.65;

  /* ---------------- LIGHTING (BRIGHT) ---------------- */
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303060, 1.0));

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10,18,10);
  scene.add(sun);

  const top = new THREE.PointLight(0xffffff, 2.5, 300);
  top.position.set(0,12,0);
  scene.add(top);

  /* ---------------- OPEN PIT DIVOT ---------------- */
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, 2.2, 180, 1, true),
    new THREE.MeshStandardMaterial({
      color:0x05050b,
      roughness:0.95,
      side:THREE.DoubleSide
    })
  );
  pitWall.position.y = -1.1;
  scene.add(pitWall);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.05, 0.05, 12, 200),
    new THREE.MeshStandardMaterial({
      color:0x8a2be2,
      emissive:0x8a2be2,
      emissiveIntensity:1.2
    })
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.01;
  scene.add(pitLip);

  /* ---------------- DECK ---------------- */
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180),
    new THREE.MeshStandardMaterial({
      color:0x0b0b12,
      roughness:1,
      side:THREE.DoubleSide
    })
  );
  deck.rotation.x = -Math.PI/2;
  scene.add(deck);

  /* ---------------- CAMERA ---------------- */
  camera.position.set(0,1.6,14);
  camera.lookAt(0,1.4,0);

  /* ---------------- ANDROID JOYSTICK (SAFE) ---------------- */
  let moveX = 0, moveY = 0;

  try {
    const stick = document.createElement('div');
    stick.style.cssText = `
      position:fixed;left:18px;bottom:18px;
      width:120px;height:120px;border-radius:50%;
      background:rgba(255,255,255,0.18);
      z-index:99;touch-action:none;
    `;
    document.body.appendChild(stick);

    let active=false, sx=0, sy=0;
    stick.onpointerdown = e => { active=true; sx=e.clientX; sy=e.clientY; };
    stick.onpointermove = e => {
      if(!active) return;
      moveX = (e.clientX-sx)/80;
      moveY = (e.clientY-sy)/80;
    };
    stick.onpointerup = ()=>{ active=false; moveX=0; moveY=0; };

    log('[android] joystick mounted');
  } catch(e){
    log('[android] joystick failed (safe)');
  }

  /* ---------------- UPDATE LOOP ---------------- */
  return {
    updates:[
      (dt)=>{
        const r = window.__SCARLETT_RENDERER__;
        if(r?.xr?.isPresenting) return;

        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y=0; dir.normalize();

        const right = new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0));

        camera.position.addScaledVector(dir, -moveY*dt*3);
        camera.position.addScaledVector(right, moveX*dt*3);
      }
    ],
    interactables:[]
  };
}
