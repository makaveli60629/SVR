(function () {
  const THREE = AFRAME.THREE;
  const loader = new THREE.TextureLoader();

  const LAYOUT = {
    moon: {
      basePosition: { x: -74, y: 214, z: -610 },
      orbitRadiusX: 28,
      orbitRadiusY: 10,
      orbitRadiusZ: 18,
      orbitSpeed: 0.00012,
      spinSpeed: 0.00042
    },
    mars: {
      basePosition: { x: 170, y: 228, z: -670 },
      orbitRadiusX: 32,
      orbitRadiusY: 12,
      orbitRadiusZ: 22,
      orbitSpeed: 0.00014,
      spinSpeed: 0.00056
    }
  };

  function dirFromPosition(pos) {
    return new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  }

  function loadMoonTextures() {
    const diffuse = loader.load('assets/textures/moon_final_diffuse.png');
    const bump = loader.load('assets/textures/moon_final_bump.png');
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
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#6a2310');
    g.addColorStop(0.35, '#b5481b');
    g.addColorStop(0.7, '#f08b51');
    g.addColorStop(1, '#81401b');
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
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function buildStarField() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const moonDir = dirFromPosition(LAYOUT.moon.basePosition);
    const marsDir = dirFromPosition(LAYOUT.mars.basePosition);
    let tries = 0;
    while (positions.length < 1200 * 3 && tries < 40000) {
      tries += 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.62;
      const radius = 760 + Math.random() * 140;
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = 90 + Math.cos(phi) * radius * 0.9;
      const z = -Math.abs(Math.sin(phi) * Math.sin(theta) * radius) - 260;
      const d = new THREE.Vector3(x, y, z).normalize();
      if (d.dot(moonDir) > 0.994) continue;
      if (d.dot(marsDir) > 0.996) continue;
      positions.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    }));
  }

  AFRAME.registerComponent('star-dome', {
    init: function () {
      this.stars = buildStarField();
      this.el.object3D.add(this.stars);
    },
    tick: function (time) {
      if (!this.stars) return;
      this.stars.rotation.y = time * 0.000004;
    }
  });

  AFRAME.registerComponent('cinematic-moon', {
    init: function () {
      const tex = loadMoonTextures();
      this.diffuse = tex.diffuse;
      this.bump = tex.bump;
      this.applyMaterial = this.applyMaterial.bind(this);
      this.el.addEventListener('object3dset', this.applyMaterial);
      this.applyMaterial();
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.12, 28, 20),
        new THREE.MeshBasicMaterial({ color: '#fff0e6', transparent: true, opacity: 0.10, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      this.el.object3D.add(glow);
    },
    remove: function () {
      this.el.removeEventListener('object3dset', this.applyMaterial);
    },
    applyMaterial: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.material = new THREE.MeshStandardMaterial({
          map: this.diffuse,
          bumpMap: this.bump,
          bumpScale: 0.18,
          roughness: 1.0,
          metalness: 0.0,
          emissive: '#19181d',
          emissiveIntensity: 0.05
        });
        obj.renderOrder = 4;
      });
    },
    tick: function (time, dt) {
      const obj = this.el.object3D;
      const m = LAYOUT.moon;
      const orbitT = time * m.orbitSpeed;
      obj.position.set(
        m.basePosition.x + Math.cos(orbitT) * m.orbitRadiusX,
        m.basePosition.y + Math.sin(orbitT * 0.8) * m.orbitRadiusY,
        m.basePosition.z + Math.sin(orbitT) * m.orbitRadiusZ
      );
      obj.rotation.y += dt * m.spinSpeed;
      obj.rotation.z = Math.sin(orbitT * 0.5) * 0.03;
    }
  });

  AFRAME.registerComponent('cinematic-mars', {
    init: function () {
      this.map = makeMarsTexture();
      this.applyMaterial = this.applyMaterial.bind(this);
      this.el.addEventListener('object3dset', this.applyMaterial);
      this.applyMaterial();
    },
    remove: function () {
      this.el.removeEventListener('object3dset', this.applyMaterial);
    },
    applyMaterial: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.material = new THREE.MeshStandardMaterial({
          map: this.map,
          roughness: 0.96,
          metalness: 0.0,
          emissive: '#5c2610',
          emissiveIntensity: 0.14
        });
        obj.renderOrder = 3;
      });
    },
    tick: function (time, dt) {
      const obj = this.el.object3D;
      const m = LAYOUT.mars;
      const orbitT = time * m.orbitSpeed;
      obj.position.set(
        m.basePosition.x + Math.cos(orbitT) * m.orbitRadiusX,
        m.basePosition.y + Math.sin(orbitT * 1.05) * m.orbitRadiusY,
        m.basePosition.z + Math.sin(orbitT) * m.orbitRadiusZ
      );
      obj.rotation.y += dt * m.spinSpeed;
      obj.rotation.x = Math.sin(orbitT * 0.7) * 0.05;
    }
  });
})();
