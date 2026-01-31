import { hudLog } from "./diagnostics.js";

export function spawnDemoBots(THREE, parent, seatAnchors) {
  const bots = [];
  const mat = new THREE.MeshStandardMaterial({ color: 0x0f1116, roughness: 0.6, metalness: 0.2 });
  const face = new THREE.MeshBasicMaterial({ color: 0x2bd6ff });

  seatAnchors.forEach((a, i) => {
    const bot = new THREE.Group();
    bot.position.copy(a.position);
    bot.rotation.y = a.rotation.y;

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 8, 16), mat);
    body.position.y = 0.95;
    bot.add(body);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), face);
    visor.position.set(0, 1.12, 0.18);
    bot.add(visor);

    bot.userData = { t: Math.random() * 10, i };
    parent.add(bot);
    bots.push(bot);
  });

  hudLog(`Bots seated: ${bots.length} ✅`);
  hudLog("Demo: bots bob + idle animation running.");
  return bots;
}

export function tickBots(dt, bots) {
  for (const b of bots) {
    b.userData.t += dt;
    b.position.y = 0.02 * Math.sin(b.userData.t * 1.6);
  }
}
