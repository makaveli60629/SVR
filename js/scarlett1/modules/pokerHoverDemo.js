import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export async function init(ctx){
  const { scene, addLine } = ctx;
  const cards = new THREE.Group();
  cards.position.set(0, -2.2 + 2.1, 0); // sit above table top if table is at pitY+0.7
  scene.add(cards);

  const geo = new THREE.PlaneGeometry(0.6, 0.9);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0 });
  const meshA = new THREE.Mesh(geo, mat);
  const meshB = new THREE.Mesh(geo, mat.clone());
  const meshC = new THREE.Mesh(geo, mat.clone());
  meshA.position.set(-0.8, 0.05, 0);
  meshB.position.set(0, 0.05, 0);
  meshC.position.set(0.8, 0.05, 0);
  [meshA, meshB, meshC].forEach(m => { m.rotation.x = -Math.PI/2; cards.add(m); });

  let t = 0;
  ctx.__updates = ctx.__updates || [];
  ctx.__updates.push((dt)=>{
    t += dt;
    cards.position.y = (-2.2 + 2.1) + Math.sin(t*2) * 0.05;
  });

  // Hook into render loop if bootHud didn't expose update loop: use renderer setAnimationLoop already; we can't inject.
  // So just use requestAnimationFrame for this module.
  let last = performance.now();
  function loop(now){
    const dt = (now-last)/1000; last = now;
    if (ctx.__updates) for (const u of ctx.__updates) u(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  addLine("[poker] hover-card demo armed ✅");
}
