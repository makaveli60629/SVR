import * as THREE from 'three';

const floatingCards = [];

export function spawnFloatingCard(scene, x, y, z, value, isCommunity = false) {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 12;
  ctx.strokeRect(10,10,canvas.width-20,canvas.height-20);
  ctx.fillStyle = '#ff0033';
  ctx.font = 'bold 72px Arial';
  ctx.fillText(value, 24, 96);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    map: tex,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.33), mat);
  group.add(mesh);

  group.position.set(x, y + (isCommunity ? 0 : 0.6), z);
  group.rotation.y = Math.PI; // face spawn direction
  scene.add(group);

  floatingCards.push({ group, baseY: group.position.y, seed: Math.random()*10 });
  return group;
}

export function updateCardHUD(dt, time) {
  for (const c of floatingCards) {
    const bob = Math.sin((time*2.2) + c.seed) * 0.02;
    c.group.position.y = c.baseY + bob;
  }
}
