import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = (() => {
  let scene, camera, renderer;
  function start({ Diagnostics }) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x223366, 1.2);
    scene.add(light);

    const grid = new THREE.GridHelper(40,40);
    scene.add(grid);

    Diagnostics.log('Scene ready');
    renderer.setAnimationLoop(()=>renderer.render(scene,camera));
  }
  return { start };
})();
