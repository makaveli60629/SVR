import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Optional: simple procedural texture (no external assets)
function makeFloorTex(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, size, size);

  // speckle
  for (let i = 0; i < 9000; i++) {
    const x = (Math.random() * size) | 0;
    const y = (Math.random() * size) | 0;
    const a = Math.random() * 0.07;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // subtle grid
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.strokeStyle = 'rgba(120,160,255,0.10)';
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 4;
  return tex;
}

// HARD cap remover: removes named caps AND common “floor disk” geometry near y=0
function removeCaps(scene, holeRadius = 6) {
  const killNames = new Set([
    'floor', 'tablecap', 'centerdisc', 'ground', 'platform', 'deck'
  ]);

  const toRemove = [];
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const test = new THREE.Vector3(0, 0, 0);

  scene.traverse((o) => {
    if (!o.isMesh) return;

    const n = (o.name || '').toLowerCase();
    const gtype = o.geometry?.type || '';

    // Named caps
    if (killNames.has(n)) {
      toRemove.push(o);
      return;
    }

    // Geometry caps near floor height that cover center
    // (Circle/Plane/Cylinder thin disks, etc.)
    if (
      (gtype.includes('Circle') || gtype.includes('Plane') || gtype.includes('Cylinder')) &&
      Math.abs(o.position.y) < 1.5
    ) {
      try { box.setFromObject(o); } catch { return; }
      if (!box.containsPoint(test)) return;
      box.getSize(size);
      const wide = (size.x > holeRadius * 1.7) || (size.z > holeRadius * 1.7);
      const thin = size.y < 0.5;
      if (wide && thin) toRemove.push(o);
    }
  });

  // remove deepest-first
  toRemove.sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0));
  for (const o of toRemove) o.parent?.remove(o);

  console.log(`[sunken] removed ${toRemove.length} cap candidates`);
}

export function setupSunkenWorld(scene, opts = {}) {
  const holeR = opts.holeRadius ?? 6;
  const deckOuterR = opts.deckOuterRadius ?? 60;
  const pitDepthY = opts.pitDepthY ?? -2.0;     // lower tier floor height
  const pitWallDepth = opts.pitWallDepth ?? 10; // visual depth down the cylinder

  // 1) CLEANUP caps
  removeCaps(scene, holeR);

  // 2) LIGHTING (bright casino)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a2a, 1.5));
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(7, 14, 7);
  scene.add(key);

  // 3) OBSERVATION DECK (Ring floor with literal hole)
  const deckTex = makeFloorTex();
  const deckGeo = new THREE.RingGeometry(holeR, deckOuterR, 128, 1);
  deckGeo.rotateX(-Math.PI / 2);

  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    color: 0xffffff,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  const upperDeck = new THREE.Mesh(deckGeo, deckMat);
  upperDeck.name = "UpperObservationDeck";
  upperDeck.position.y = 0;
  scene.add(upperDeck);

  // 4) PIT WALL (deep cylinder so it looks like a stadium drop)
  const wallH = pitWallDepth;
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, wallH, 160, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 1.0,
      side: THREE.DoubleSide
    })
  );
  // top lip near deck (y ~ 0)
  pitWall.position.y = -wallH / 2 + 0.05;
  pitWall.name = "PitWall";
  scene.add(pitWall);

  // 5) PIT FLOOR (lower tier)
  const pitGeo = new THREE.CircleGeometry(holeR, 128);
  pitGeo.rotateX(-Math.PI / 2);
  const pitMat = new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 1.0 });
  const pitFloor = new THREE.Mesh(pitGeo, pitMat);
  pitFloor.position.y = pitDepthY;
  pitFloor.name = "PitFloor";
  scene.add(pitFloor);

  // 6) RIM GLOW + RAIL (so you can walk to edge and look down)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(holeR + 0.05, 0.14, 18, 200),
    new THREE.MeshStandardMaterial({
      color: 0x0b2b6f,
      emissive: 0x0b2b6f,
      emissiveIntensity: 2.1,
      roughness: 0.6
    })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  rim.name = "PitRim";
  scene.add(rim);

  // simple rail posts
  const railGroup = new THREE.Group();
  railGroup.name = "Rail";
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 16);
  const railGeo = new THREE.TorusGeometry(holeR + 0.55, 0.05, 10, 160);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.7 });

  const topRail = new THREE.Mesh(railGeo, railMat);
  topRail.rotation.x = Math.PI / 2;
  topRail.position.y = 1.0;
  railGroup.add(topRail);

  const posts = 24;
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    const post = new THREE.Mesh(postGeo, railMat);
    post.position.set(Math.cos(a) * (holeR + 0.55), 0.55, Math.sin(a) * (holeR + 0.55));
    railGroup.add(post);
  }
  scene.add(railGroup);

  // 7) GAME AREA GROUP (your table/chairs go here later)
  const gameArea = new THREE.Group();
  gameArea.name = "GameArea";
  gameArea.position.y = pitDepthY;
  scene.add(gameArea);

  // 8) Depth fog (makes it feel like a drop)
  scene.fog = new THREE.Fog(0x050509, 3.0, Math.max(25, wallH + 10));

  return { upperDeck, pitWall, pitFloor, rim, railGroup, gameArea };
    }
