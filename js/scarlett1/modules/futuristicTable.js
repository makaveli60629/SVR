import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function makeFeltMarkingsTexture(size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, size, size);

  // subtle felt noise
  for (let i = 0; i < 22000; i++) {
    const x = (Math.random() * size) | 0;
    const y = (Math.random() * size) | 0;
    const a = Math.random() * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const cx = size / 2;
  const cy = size / 2;

  function glowStroke(radius, color, width, glowWidth) {
    ctx.save();
    ctx.translate(cx, cy);

    // outer glow
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = width + glowWidth;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // inner line
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // pass/marker rings
  glowStroke(size * 0.24, 'rgba(200,180,255,1)', 6, 28);
  glowStroke(size * 0.16, 'rgba(160,120,255,1)', 4, 18);

  // 8 seat markers
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = size * 0.31;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;

    ctx.fillStyle = 'rgba(190,160,255,0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(240,240,255,0.95)';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeGlowRing(radius, tube, colorHex, intensity = 1.0) {
  const g = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 16, 220),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: Math.min(1, 0.55 * intensity),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  g.rotation.x = Math.PI / 2;
  return g;
}

function makePodChair({ bodyColor = 0x111118, accent = 0x8a2be2 } = {}) {
  const chair = new THREE.Group();
  chair.name = "PodChair";

  const shellGeo = new THREE.SphereGeometry(
    0.72, 36, 22,
    0, Math.PI * 2,
    0, Math.PI * 0.62
  );

  const shellMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.32,
    metalness: 0.28
  });

  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.y = 0.75;
  chair.add(shell);

  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.52, 0.10, 28),
    new THREE.MeshStandardMaterial({ color: 0x07070b, roughness: 0.6, metalness: 0.05 })
  );
  seat.position.y = 0.42;
  chair.add(seat);

  const baseRing = makeGlowRing(0.55, 0.035, accent, 1.2);
  baseRing.position.y = 0.08;
  chair.add(baseRing);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.45, 0.28, 20),
    new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.8, metalness: 0.05 })
  );
  base.position.y = 0.15;
  chair.add(base);

  return chair;
}

export function createFuturisticTable(scene, opts = {}) {
  const {
    tableY = -1.6,
    tableRadius = 2.35,
    chairRadius = 3.35,
    accent = 0x8a2be2,
    emissive = 0x4b0082
  } = opts;

  const group = new THREE.Group();
  group.name = "FuturisticPokerPod";
  group.position.set(0, tableY, 0);

  // pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 2.55, 1.5, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b10,
      roughness: 0.55,
      metalness: 0.25,
      emissive,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide
    })
  );
  base.position.y = -0.75;
  group.add(base);

  // underglow
  const underGlow = makeGlowRing(2.55, 0.075, accent, 1.35);
  underGlow.position.y = -1.35;
  group.add(underGlow);

  // tabletop felt + markings
  const feltTex = makeFeltMarkingsTexture(1024);
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(tableRadius, tableRadius, 0.22, 128),
    new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 0.92,
      metalness: 0.02,
      map: feltTex,
      emissive: 0x120a20,
      emissiveIntensity: 0.18
    })
  );
  tableTop.position.y = 0.0;
  group.add(tableTop);

  // glossy leather trim
  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(tableRadius + 0.12, 0.19, 18, 240),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.20,
      metalness: 0.20,
      envMapIntensity: 0.6
    })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.12;
  group.add(trim);

  // neon ring
  const neon = makeGlowRing(tableRadius + 0.18, 0.05, accent, 1.8);
  neon.position.y = 0.11;
  group.add(neon);

  // chairs
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const chair = makePodChair({ accent });
    chair.position.set(Math.cos(a) * chairRadius, 0, Math.sin(a) * chairRadius);
    chair.rotation.y = -a + Math.PI;
    group.add(chair);
  }

  // hologram globe + sparkle cards
  const holo = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x7ffcff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    })
  );
  holo.name = "HologramGlobe";
  holo.position.y = 1.25;
  group.add(holo);

  const holoGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.66, 22, 16),
    new THREE.MeshBasicMaterial({
      color: 0x7ffcff,
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  holoGlow.position.copy(holo.position);
  group.add(holoGlow);

  const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const cardGeo = new THREE.BoxGeometry(0.18, 0.01, 0.26);
  const cards = new THREE.Group();
  cards.name = "HoloCards";
  for (let i=0;i<5;i++){
    const c = new THREE.Mesh(cardGeo, cardMat);
    c.position.set((i-2)*0.24, 0.35, 0);
    c.rotation.y = 0.12*(i-2);
    cards.add(c);
  }
  group.add(cards);

  // local lights
  const key = new THREE.PointLight(0xffffff, 0.95, 16);
  key.position.set(0, 3.4, 0);
  group.add(key);

  const purple = new THREE.PointLight(accent, 1.35, 22);
  purple.position.set(0, 1.2, 0);
  group.add(purple);

  function update(dt){
    const t = performance.now() * 0.001;
    holo.rotation.y += dt * 0.7;
    holo.rotation.x += dt * 0.18;
    holo.material.opacity = 0.45 + Math.sin(t * 2.0) * 0.08;
    holoGlow.material.opacity = 0.08 + Math.sin(t * 2.0 + 1.0) * 0.03;
    cards.rotation.y = Math.sin(t*0.6)*0.15;
  }

  scene.add(group);
  return { group, update };
}
