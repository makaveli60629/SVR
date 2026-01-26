import * as THREE from 'three';

/**
 * Bots: lightweight "casino patrons" with simple pathing.
 * - Wanderers walk the high ground ring.
 * - Players sit around the table and occasionally "gesture".
 */
export function initBots({ scene, Bus }) {
  const bots = [];
  const root = new THREE.Group();
  root.name = "BOT_ROOT";
  scene.add(root);

  // Shared materials (cheap)
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x001100, emissiveIntensity: 0.6, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0x001100, emissiveIntensity: 0.6, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x221111, emissive: 0x001100, emissiveIntensity: 0.6, roughness: 0.7 }),
  ];

  const headMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0x001100, emissiveIntensity: 0.5, roughness: 0.9 });

  function makeBotBody(matIdx=0) {
    const g = new THREE.Group();
    // body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 6, 12), mats[matIdx % mats.length]);
    body.position.y = 0.85;
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), headMat);
    head.position.y = 1.25;
    // arms (simple)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, emissive: 0x001100, emissiveIntensity: 0.35 });
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.5,10), armMat);
    const armR = armL.clone();
    armL.position.set(-0.25, 0.95, 0);
    armR.position.set( 0.25, 0.95, 0);
    armL.rotation.z = Math.PI/10;
    armR.rotation.z = -Math.PI/10;

    g.add(body, head, armL, armR);
    g.userData.armL = armL;
    g.userData.armR = armR;
    return g;
  }

  function addWanderBot(i) {
    const bot = makeBotBody(i);
    bot.position.y = 1.6; // on high ground
    root.add(bot);

    const radius = 14 + Math.random()*8;
    const speed = 0.25 + Math.random()*0.25;
    const phase = Math.random()*Math.PI*2;
    bots.push({
      type: "wander",
      obj: bot,
      radius,
      speed,
      phase,
      wobble: 0.5 + Math.random()*0.7
    });
  }

  function addSeatBot(i, angle) {
    const bot = makeBotBody(i);
    root.add(bot);

    const r = 3.55;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    bot.position.set(x, 0.0, z);
    bot.position.y = 0.96; // table level
    bot.rotation.y = -angle + Math.PI/2; // face center
    bot.scale.setScalar(1.0);

    // "sitting" pose: lower body
    bot.children.forEach(ch => { /* noop */ });
    bot.position.y = 0.62;
    bots.push({
      type: "seat",
      obj: bot,
      angle,
      t: Math.random()*10,
      gesture: 0.5 + Math.random()*1.3
    });
  }

  // Create wanderers
  const wanderCount = 10;  // light enough for mobile
  for (let i=0;i<wanderCount;i++) addWanderBot(i);

  // Create seated players (6)
  const seatAngles = [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3];
  seatAngles.forEach((a, idx) => addSeatBot(idx, a));

  // Expose for updates
  window.__bots = { root, bots };
  Bus?.log?.(`BOTS ONLINE: ${wanderCount} walkers, ${seatAngles.length} seated`);
}

export function updateBots(dt) {
  const data = window.__bots;
  if (!data) return;
  const { bots } = data;
  const time = (performance.now() / 1000);

  for (const b of bots) {
    const o = b.obj;
    if (!o) continue;

    if (b.type === "wander") {
      const a = (time * b.speed + b.phase);
      o.position.x = Math.cos(a) * b.radius;
      o.position.z = Math.sin(a) * b.radius;
      o.position.y = 1.6;
      o.rotation.y = -a + Math.PI/2;

      // walk bob + arm swing
      const bob = Math.sin(time * 6 + b.phase) * 0.03;
      o.position.y = 1.6 + bob;
      const swing = Math.sin(time * 6 + b.phase) * 0.7;
      if (o.userData.armL) o.userData.armL.rotation.x = swing;
      if (o.userData.armR) o.userData.armR.rotation.x = -swing;
    } else if (b.type === "seat") {
      b.t += dt;
      // occasional gesture
      const g = Math.sin(b.t * (1.0 + b.gesture)) * 0.6;
      if (o.userData.armL) o.userData.armL.rotation.x = Math.max(0, g);
      if (o.userData.armR) o.userData.armR.rotation.x = Math.max(0, -g);
    }
  }
}
