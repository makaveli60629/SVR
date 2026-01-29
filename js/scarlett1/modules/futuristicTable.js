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


function makeLuxuryChair({ bodyColor = 0x14141c, accent = 0x8a2be2 } = {}) {
  const chair = new THREE.Group();
  chair.name = "LuxuryChair";

  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.12, 0.70),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.12 })
  );
  seat.position.y = 0.55;
  chair.add(seat);

  // Back (curved wrap)
  const back = new THREE.Mesh(
    new THREE.CylinderGeometry(0.40, 0.46, 0.85, 24, 1, true, Math.PI * 0.55, Math.PI * 0.90),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45, metalness: 0.18, side: THREE.DoubleSide })
  );
  back.rotation.y = Math.PI / 2;
  back.position.set(0, 0.98, -0.30);
  chair.add(back);

  // Arm rests
  const armMat = new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.65, metalness: 0.08 });
  const armGeo = new THREE.BoxGeometry(0.08, 0.10, 0.62);
  const armL = new THREE.Mesh(armGeo, armMat);
  const armR = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.40, 0.72, 0.02);
  armR.position.set( 0.40, 0.72, 0.02);
  chair.add(armL); chair.add(armR);

  // Stem + base
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.10, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.55, metalness: 0.35 })
  );
  stem.position.y = 0.27;
  chair.add(stem);

  const foot = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.03, 10, 120),
    new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.7, metalness: 0.25 })
  );
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.01;
  chair.add(foot);

  // Glow ring
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.04, 12, 140),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.03;
  chair.add(baseRing);

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
    const chair = makeLuxuryChair({ accent });
    chair.position.set(Math.cos(a) * chairRadius, 0, Math.sin(a) * chairRadius);
    chair.rotation.y = -a + Math.PI;
    group.add(chair);
  }

    new THREE.SphereGeometry(0.58, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x7ffcff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    })
  );

    new THREE.SphereGeometry(0.66, 22, 16),
    new THREE.MeshBasicMaterial({
      color: 0x7ffcff,
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const cardGeo = new THREE.BoxGeometry(0.18, 0.01, 0.26);
  const cards = new THREE.Group();
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

  
function update(dt) {
  // subtle pulse on neon + float cards (if any)
  const t = performance.now() * 0.001;
  neon.material.opacity = 0.45 + Math.sin(t * 2.0) * 0.08;
  // optional: gently bob the whole group
  // group.position.y = tableY + Math.sin(t * 1.2) * 0.01;
}


  scene.add(group);
  return { group, update };
}