(function () {
  const THREE = AFRAME.THREE;

  function makeWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 6; y < canvas.height - 6; y += 12) {
      for (let x = 6; x < canvas.width - 6; x += 12) {
        const lit = Math.random() > 0.4;
        ctx.fillStyle = lit ? (Math.random() > 0.5 ? '#bf9bff' : '#ffe0a8') : '#10151f';
        ctx.fillRect(x, y, 6, 7);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.2, 3.6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  AFRAME.registerComponent('lobby-skyline', {
    init: function () {
      const group = new THREE.Group();
      const tex = makeWindowTexture();
      const sideMat = new THREE.MeshStandardMaterial({
        color: '#222834',
        map: tex,
        emissiveMap: tex,
        emissive: '#5f46c4',
        emissiveIntensity: 0.54,
        roughness: 0.92,
        metalness: 0.05
      });
      const roofMat = new THREE.MeshStandardMaterial({ color: '#27303c', roughness: 0.95, metalness: 0.02 });
      const mats = [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat];

      const defs = [
        { x: -145, z: -190, w: 24, h: 126, d: 24 },
        { x: -116, z: -178, w: 18, h: 92, d: 18 },
        { x: -92, z: -168, w: 16, h: 118, d: 16 },
        { x: -66, z: -162, w: 15, h: 84, d: 15 },
        { x: -40, z: -156, w: 14, h: 64, d: 14 },
        { x: 44, z: -156, w: 14, h: 66, d: 14 },
        { x: 70, z: -162, w: 16, h: 88, d: 16 },
        { x: 96, z: -170, w: 18, h: 122, d: 18 },
        { x: 122, z: -180, w: 18, h: 98, d: 18 },
        { x: 152, z: -196, w: 24, h: 132, d: 24 },
        { x: -190, z: -222, w: 28, h: 162, d: 28 },
        { x: 196, z: -226, w: 28, h: 168, d: 28 },
        { x: -18, z: -208, w: 22, h: 52, d: 22 },
        { x: 20, z: -214, w: 22, h: 48, d: 22 }
      ];

      defs.forEach((b) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mats);
        mesh.position.set(b.x, b.h / 2, b.z);
        group.add(mesh);
        if (b.h > 90) {
          const crown = new THREE.Mesh(
            new THREE.BoxGeometry(b.w * 0.42, Math.max(6, b.h * 0.08), b.d * 0.42),
            new THREE.MeshStandardMaterial({ color: '#30394a', emissive: '#7d63df', emissiveIntensity: 0.22, roughness: 0.9 })
          );
          crown.position.set(b.x, b.h + Math.max(3, b.h * 0.05), b.z);
          group.add(crown);
        }
      });

      const haze = new THREE.Mesh(
        new THREE.PlaneGeometry(360, 92),
        new THREE.MeshBasicMaterial({ color: '#1c1238', transparent: true, opacity: 0.15, depthWrite: false })
      );
      haze.position.set(0, 28, -236);
      group.add(haze);

      this.el.object3D.add(group);
    }
  });
})();
