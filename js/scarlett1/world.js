/**
 * Scarlett1 World — V4 BIG LOBBY + BALCONY + DOORS + SIGNS + STORE + TRUE PIT
 */
export async function init({ THREE, scene, camera, log }) {
  log('[world] init V4 big lobby + balcony');

  scene.background = new THREE.Color(0x05060b);

  // -----------------
  // LIGHTING (BRIGHT)
  // -----------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a44, 1.25);
  hemi.position.set(0, 30, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(10, 18, 12);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7a5cff, 1.0);
  rim.position.set(-14, 12, -16);
  scene.add(rim);

  // -----------------
  // PROCEDURAL "TEXTURE" FOR WALLS
  // -----------------
  function makePanelTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');

    // base
    g.fillStyle = '#14141c';
    g.fillRect(0, 0, 512, 512);

    // panels
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 6; x++) {
        const px = x * 85 + 8;
        const py = y * 64 + 8;
        g.fillStyle = (x + y) % 2 ? '#1a1a28' : '#161622';
        g.fillRect(px, py, 70, 48);
      }
    }

    // subtle neon stripe
    g.fillStyle = 'rgba(122,92,255,0.35)';
    g.fillRect(0, 250, 512, 14);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    tex.anisotropy = 4;
    return tex;
  }

  const wallTex = makePanelTexture();

  // -----------------
  // DIMENSIONS (2× bigger)
  // -----------------
  const floorOuterR = 32;
  const wallHeight = 10;
  const pitR = 6.2;
  const pitDepth = 7.0;

  // -----------------
  // FLOOR (RING HOLE)
  // -----------------
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.02, floorOuterR, 128),
    new THREE.MeshStandardMaterial({
      color: 0x15151f,
      roughness: 0.92,
      metalness: 0.08,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.userData.isFloor = true;
  scene.add(floor);

  // floor accent ring
  const accent = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.55, pitR + 0.85, 128),
    new THREE.MeshStandardMaterial({
      color: 0x2b2b3a,
      roughness: 0.35,
      metalness: 0.55,
      emissive: new THREE.Color(0x130a2a),
      emissiveIntensity: 1.0,
    })
  );
  accent.rotation.x = -Math.PI / 2;
  accent.position.y = 0.01;
  accent.userData.isFloor = true;
  scene.add(accent);

  // -----------------
  // WALLS (BIG CYLINDER)
  // -----------------
  const walls = new THREE.Mesh(
    new THREE.CylinderGeometry(floorOuterR, floorOuterR, wallHeight, 128, 1, true),
    new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.03,
      side: THREE.DoubleSide,
    })
  );
  walls.position.y = wallHeight / 2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // -----------------
  // BALCONY RING + TOP RAIL
  // -----------------
  const balconyY = 5.5;
  const balconyR0 = floorOuterR - 4.0;
  const balconyR1 = floorOuterR - 1.8;

  const balcony = new THREE.Mesh(
    new THREE.RingGeometry(balconyR0, balconyR1, 128),
    new THREE.MeshStandardMaterial({
      color: 0x1b1b28,
      roughness: 0.85,
      metalness: 0.12,
    })
  );
  balcony.rotation.x = -Math.PI / 2;
  balcony.position.y = balconyY;
  balcony.userData.isFloor = true; // can teleport onto balcony
  scene.add(balcony);

  const topRail = new THREE.Mesh(
    new THREE.TorusGeometry(balconyR1 + 0.2, 0.05, 16, 160),
    new THREE.MeshStandardMaterial({
      color: 0x7a5cff,
      roughness: 0.25,
      metalness: 0.7,
      emissive: new THREE.Color(0x220a44),
      emissiveIntensity: 1.0,
    })
  );
  topRail.rotation.x = Math.PI / 2;
  topRail.position.y = balconyY + 1.0;
  scene.add(topRail);

  // -----------------
  // TRUE PIT (OPEN)
  // -----------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 128, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x030308),
      emissiveIntensity: 1.0,
    })
  );
  pitWall.position.y = -(pitDepth / 2);
  scene.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(pitR - 0.2, 128),
    new THREE.MeshStandardMaterial({
      color: 0x05050a,
      roughness: 0.98,
      metalness: 0.0,
      emissive: new THREE.Color(0x020207),
      emissiveIntensity: 1.0,
    })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.02;
  pitBottom.userData.isFloor = true;
  scene.add(pitBottom);

  // Pit top rail
  const pitRail = new THREE.Mesh(
    new THREE.TorusGeometry(pitR + 0.25, 0.05, 16, 180),
    new THREE.MeshStandardMaterial({
      color: 0x6f7bff,
      roughness: 0.25,
      metalness: 0.65,
      emissive: new THREE.Color(0x101a44),
      emissiveIntensity: 1.0,
    })
  );
  pitRail.rotation.x = Math.PI / 2;
  pitRail.position.y = 1.05;
  scene.add(pitRail);

  // -----------------
  // SPAWN PAD (NOT IN PIT)
  // -----------------
  const spawnPad = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2bffcc,
      roughness: 0.25,
      metalness: 0.35,
      emissive: new THREE.Color(0x003b2f),
      emissiveIntensity: 1.2,
    })
  );
  spawnPad.rotation.x = -Math.PI / 2;
  spawnPad.position.set(0, 0.02, floorOuterR - 8);
  spawnPad.userData.isFloor = true;
  scene.add(spawnPad);
  window.__SCARLETT_SPAWN__ = spawnPad;

  // -----------------
  // DOORWAYS + SIGNS (N,E,W,S)
  // -----------------
  function doorway(x, z, rotY, label, color) {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    grp.rotation.y = rotY;

    // frame
    const frameMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.6,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.35,
    });

    const left = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), frameMat);
    left.position.set(-1.6, 1.6, 0);
    const right = left.clone();
    right.position.set(1.6, 1.6, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 0.25), frameMat);
    top.position.set(0, 3.05, 0);

    grp.add(left, right, top);

    // sign plate
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.8, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x101018,
        roughness: 0.4,
        metalness: 0.3,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.25,
      })
    );
    sign.position.set(0, 4.3, 0);
    grp.add(sign);

    // simple “text” using canvas texture
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0)';
    g.clearRect(0,0,512,128);
    g.fillStyle = '#ffffff';
    g.font = 'bold 72px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 256, 64);

    const t = new THREE.CanvasTexture(c);
    const txt = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.7),
      new THREE.MeshBasicMaterial({ map: t, transparent: true })
    );
    txt.position.set(0, 4.3, 0.09);
    grp.add(txt);

    scene.add(grp);
  }

  const R = floorOuterR - 1.2;
  doorway(0, -R, 0, 'VIP', 0xff3b7a);                 // back
  doorway(0,  R, Math.PI, 'EVENTS', 0x2bffcc);        // front
  doorway( R, 0, -Math.PI/2, 'POKER', 0x6f7bff);       // right
  doorway(-R, 0,  Math.PI/2, 'STORE', 0x7a5cff);       // left

  // -----------------
  // STORE KIOSK (LEFT SIDE)
  // -----------------
  const kiosk = new THREE.Group();
  kiosk.position.set(-floorOuterR + 9, 0, 0);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.6, 32),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.6,
      metalness: 0.2,
      emissive: new THREE.Color(0x110622),
      emissiveIntensity: 0.8,
    })
  );
  base.position.y = 0.3;
  kiosk.add(base);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.4, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x0f0f16,
      roughness: 0.2,
      metalness: 0.5,
      emissive: new THREE.Color(0x2a0a55),
      emissiveIntensity: 0.9,
    })
  );
  panel.position.set(0, 1.6, 0);
  kiosk.add(panel);

  // kiosk floor is teleportable
  const kioskPad = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.85, metalness: 0.08 })
  );
  kioskPad.rotation.x = -Math.PI / 2;
  kioskPad.position.y = 0.01;
  kioskPad.userData.isFloor = true;
  kiosk.add(kioskPad);

  scene.add(kiosk);

  // -----------------
  // SAFE NON-XR CAMERA
  // -----------------
  camera.position.set(0, 1.6, floorOuterR - 6);
  camera.lookAt(0, 1.6, 0);

  log('[world] V4 ready ✅');

  function update(dt) {
    const t = performance.now() * 0.001;
    topRail.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.25;
    pitRail.material.emissiveIntensity = 0.8 + Math.sin(t * 2.2) * 0.25;
  }

  return { updates: [update], interactables: [] };
}
