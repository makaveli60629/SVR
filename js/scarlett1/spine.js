import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = (() => {
  let scene, camera, renderer;

  function start({ Diagnostics }) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);

    camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.4));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x141a2a })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshStandardMaterial({ color: 0x2a6bff })
    );
    cube.position.set(0,1,0);
    scene.add(cube);

    Diagnostics.log('World visible');

    renderer.setAnimationLoop(() => {
      const i = window.__scarlettInput || {};
      camera.position.x += (i.moveX || 0) * 0.05;
      camera.position.z += (i.moveZ || 0) * 0.05;
      renderer.render(scene, camera);
    });
  }

  return { start };
})();
