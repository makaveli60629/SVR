(function () {
  const THREE = AFRAME.THREE;
  const loader = new THREE.TextureLoader();

  // ── Positions scaled so Moon & Mars are clearly visible in the sky ─────────
  // Brought much closer and repositioned so they appear above the skyline
  const LAYOUT = {
    moon: {
      basePosition: { x: -38, y: 62, z: -180 },
      orbitRadiusX: 6,
      orbitRadiusY: 3,
      orbitRadiusZ: 5,
      orbitSpeed: 0.00012,
      spinSpeed: 0.00042
    },
    mars: {
      basePosition: { x: 52, y: 74, z: -200 },
      orbitRadiusX: 8,
      orbitRadiusY: 3,
      orbitRadiusZ: 6,
      orbitSpeed: 0.00014,
      spinSpeed: 0.00056
    }
  };

  function dirFromPosition(pos) {
    return new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  }

  function loadMoonTextures() {
    const diffuse = loader.load('assets/textures/moon_final_diffuse.png',
      undefined, undefined,
      function () {
        // fallback – generate procedural moon if texture missing
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(256, 128, 10, 256, 128, 240);
        g.addColorStop(0,   '#f0ecdf');
        g.addColorStop(0.4, '#c8c0a8');
        g.addColorStop(1,   '#888070');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 256);
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * 512, y = Math.random() * 256, r = 4 + Math.random() * 28;
          const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, 'rgba(80,70,60,0.55)');
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        diffuse.image = canvas;
        diffuse.needsUpdate = true;
      }
    );
    const bump = loader.load('assets/textures/moon_final_bump.png',
      undefined, undefined, function () { /* ignore missing bump */ }
    );
    diffuse.colorSpace = THREE.SRGBColorSpace;
    bump.colorSpace = THREE.NoColorSpace;
    [diffuse, bump].forEach(function (tex) {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = 4;
    });
    return { diffuse, bump };
  }

  function makeMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0,    '#6a2310');
    g.addColorStop(0.35, '#b5481b');
    g.addColorStop(0.70, '#f08b51');
    g.addColorStop(1,    '#81401b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 10 + Math.random() * 60;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, Math.random() > 0.5 ? 'rgba(255,210,170,0.7)' : 'rgba(90,25,10,0.65)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ── Procedural star field ─────────────────────────────────────────────────
  function buildStarField() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors    = [];
    const moonDir = dirFromPosition(LAYOUT.moon.basePosition);
    const marsDir = dirFromPosition(LAYOUT.mars.basePosition);
    let tries = 0;
    while (positions.length < 3600 && tries < 80000) {
      tries++;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.random() * Math.PI * 0.58;
      const radius = 480 + Math.random() * 120;
      const x =  Math.sin(phi) * Math.cos(theta) * radius;
      const y =  60 + Math.cos(phi) * radius * 0.88;
      const z = -Math.abs(Math.sin(phi) * Math.sin(theta) * radius) - 100;
      const d = new THREE.Vector3(x, y, z).normalize();
      if (d.dot(moonDir) > 0.97) continue;
      if (d.dot(marsDir) > 0.97) continue;
      positions.push(x, y, z);
      // Slight colour variation: blue-white / warm
      const warm = Math.random();
      colors.push(
        0.80 + warm * 0.20,
        0.85 + warm * 0.10,
        0.95 + (1 - warm) * 0.05
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({
      vertexColors: true,
      size:         1.35,
      sizeAttenuation: true,
      transparent: true,
      opacity:     0.97,
      depthWrite:  false
    }));
  }

  // ── Star dome ────────────────────────────────────────────────────────────
  AFRAME.registerComponent('star-dome', {
    init: function () {
      this.stars = buildStarField();
      this.el.object3D.add(this.stars);
    },
    tick: function (time) {
      if (this.stars) this.stars.rotation.y = time * 0.000004;
    }
  });

  // ── Cinematic Moon ────────────────────────────────────────────────────────
  AFRAME.registerComponent('cinematic-moon', {
    init: function () {
      const tex = loadMoonTextures();
      this.diffuse = tex.diffuse;
      this.bump    = tex.bump;
      this.applyMaterial = this.applyMaterial.bind(this);
      this.el.addEventListener('object3dset', this.applyMaterial);
      this.applyMaterial();

      // Bright halo glow so moon is always visible
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.18, 28, 20),
        new THREE.MeshBasicMaterial({
          color: '#fff0e6',
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      this.el.object3D.add(glow);

      // Outer corona
      const corona = new THREE.Mesh(
        new THREE.SphereGeometry(1.32, 24, 16),
        new THREE.MeshBasicMaterial({
          color: '#c8b0ff',
          transparent: true,
          opacity: 0.07,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      this.el.object3D.add(corona);
    },
    remove: function () {
      this.el.removeEventListener('object3dset', this.applyMaterial);
    },
    applyMaterial: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse(function (obj) {
        if (!obj.isMesh) return;
        obj.material = new THREE.MeshStandardMaterial({
          map:               this.diffuse,
          bumpMap:           this.bump,
          bumpScale:         0.18,
          roughness:         1.0,
          metalness:         0.0,
          emissive:          '#1a1820',
          emissiveIntensity: 0.06
        });
        obj.renderOrder = 4;
      }.bind(this));
    },
    tick: function (time, dt) {
      const obj = this.el.object3D;
      const m   = LAYOUT.moon;
      const orbitT = time * m.orbitSpeed;
      obj.position.set(
        m.basePosition.x + Math.cos(orbitT) * m.orbitRadiusX,
        m.basePosition.y + Math.sin(orbitT * 0.8) * m.orbitRadiusY,
        m.basePosition.z + Math.sin(orbitT) * m.orbitRadiusZ
      );
      obj.rotation.y += dt * m.spinSpeed;
      obj.rotation.z  = Math.sin(orbitT * 0.5) * 0.03;
    }
  });

  // ── Cinematic Mars ────────────────────────────────────────────────────────
  AFRAME.registerComponent('cinematic-mars', {
    init: function () {
      this.map = makeMarsTexture();
      this.applyMaterial = this.applyMaterial.bind(this);
      this.el.addEventListener('object3dset', this.applyMaterial);
      this.applyMaterial();

      // Mars warm glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 24, 16),
        new THREE.MeshBasicMaterial({
          color: '#ff6030',
          transparent: true,
          opacity: 0.10,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      this.el.object3D.add(glow);
    },
    remove: function () {
      this.el.removeEventListener('object3dset', this.applyMaterial);
    },
    applyMaterial: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse(function (obj) {
        if (!obj.isMesh) return;
        obj.material = new THREE.MeshStandardMaterial({
          map:               this.map,
          roughness:         0.96,
          metalness:         0.0,
          emissive:          '#6a2a08',
          emissiveIntensity: 0.22
        });
        obj.renderOrder = 3;
      }.bind(this));
    },
    tick: function (time, dt) {
      const obj  = this.el.object3D;
      const m    = LAYOUT.mars;
      const orbitT = time * m.orbitSpeed;
      obj.position.set(
        m.basePosition.x + Math.cos(orbitT) * m.orbitRadiusX,
        m.basePosition.y + Math.sin(orbitT * 1.05) * m.orbitRadiusY,
        m.basePosition.z + Math.sin(orbitT) * m.orbitRadiusZ
      );
      obj.rotation.y += dt * m.spinSpeed;
      obj.rotation.x  = Math.sin(orbitT * 0.7) * 0.05;
    }
  });
})();
