(function () {
  const THREE = AFRAME.THREE;

  function makeCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101219';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 14000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const v = 18 + Math.random() * 32;
      ctx.fillStyle = `rgba(${v + 10},${v},${v + 20},0.12)`;
      ctx.fillRect(x, y, 2, 2);
    }
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = `rgba(140,90,255,${0.02 + Math.random() * 0.03})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
      ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    return tex;
  }

  AFRAME.registerComponent('lobby-floor', {
    init: function () {
      const group = new THREE.Group();
      const carpetTex = makeCarpetTexture();

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(34, 0.16, 28),
        new THREE.MeshStandardMaterial({ color: '#090c12', roughness: 0.96, metalness: 0.05 })
      );
      base.position.set(0, -0.08, 0);
      group.add(base);

      const carpet = new THREE.Mesh(
        new THREE.PlaneGeometry(18.5, 12.6),
        new THREE.MeshStandardMaterial({ map: carpetTex, color: '#ffffff', roughness: 0.96, metalness: 0.0 })
      );
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.y = 0.011;
      group.add(carpet);

      const trim = new THREE.Mesh(
        new THREE.RingGeometry(6.2, 6.95, 64),
        new THREE.MeshStandardMaterial({ color: '#2b2438', emissive: '#4f31a8', emissiveIntensity: 0.18, roughness: 0.72 })
      );
      trim.rotation.x = -Math.PI / 2;
      trim.position.y = 0.014;
      group.add(trim);

      const makeRail = (x, z, w, d, h) => {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.08, d),
          new THREE.MeshStandardMaterial({ color: '#2c3240', metalness: 0.38, roughness: 0.52 })
        );
        frame.position.set(x, h, z);
        group.add(frame);

        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(w - 0.08, 1.15, Math.max(0.04, d - 0.02)),
          new THREE.MeshPhysicalMaterial({ color: '#8bb9ff', transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.0, transmission: 0.65 })
        );
        glass.position.set(x, 0.58, z);
        group.add(glass);
      };

      makeRail(0, -12.8, 28, 0.08, 1.16);
      makeRail(-13.8, -1.2, 0.08, 23.6, 1.16);
      makeRail(13.8, -1.2, 0.08, 23.6, 1.16);

      this.el.object3D.add(group);
    }
  });
})();
