import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = {
  async start({ log, getJoystick }) {

    const stage = document.getElementById('stage');
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.xr.enabled = true;
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, .1, 1000);
    camera.position.set(0,1.6,6);

    window.SCARLETT = {
      enterVR: ()=>renderer.xr.enabled && renderer.xr.setSession,
      resetSpawn: ()=>camera.position.set(0,1.6,6),
      hideHUD: ()=>document.body.classList.add('hud-hidden'),
      showHUD: ()=>document.body.classList.remove('hud-hidden'),
      copyReport: ()=>navigator.clipboard.writeText(navigator.userAgent)
    };

    let world;
    try {
      world = await import('./js/scarlett1/world.js');
      await world.init({ THREE, scene, camera, log });
      log('[world] loaded ✅');
    } catch(e){
      log('[world] failed ❌ '+e);
    }

    const speed = 2;
    const dir = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0,1,0);

    renderer.setAnimationLoop(()=>{
      const j = getJoystick();
      if(j){
        camera.getWorldDirection(dir);
        dir.y = 0; dir.normalize();
        right.crossVectors(dir,up).normalize();
        camera.position.addScaledVector(dir,-j.y*speed*.016);
        camera.position.addScaledVector(right,j.x*speed*.016);
      }
      renderer.render(scene,camera);
    });

    log('[boot] spine started ✅');
  }
};
