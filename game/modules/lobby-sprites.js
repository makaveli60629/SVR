(function () {
  const THREE = AFRAME.THREE;

  function glowTexture(inner, outer) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 118);
    g.addColorStop(0, inner);
    g.addColorStop(0.32, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }

  AFRAME.registerComponent('lobby-sprites', {
    init: function () {
      this.group = new THREE.Group();
      this.sprites = [];
      const textures = [
        glowTexture('rgba(255,214,255,1)', 'rgba(182,86,255,0.72)'),
        glowTexture('rgba(255,245,255,1)', 'rgba(255,96,190,0.68)'),
        glowTexture('rgba(230,200,255,1)', 'rgba(105,78,255,0.68)')
      ];
      const defs = [
        { x: -8, y: 3.4, z: -10, s: 2.3 },
        { x: 9, y: 4.5, z: -11, s: 2.2 },
        { x: -16, y: 6.6, z: -20, s: 3.2 },
        { x: 18, y: 7.2, z: -24, s: 2.7 },
        { x: 0, y: 5.3, z: -18, s: 2.6 }
      ];
      defs.forEach((d, i) => {
        const mat = new THREE.SpriteMaterial({ map: textures[i % textures.length], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(d.x, d.y, d.z);
        sprite.scale.set(d.s, d.s, 1);
        sprite.userData.baseY = d.y;
        sprite.userData.baseS = d.s;
        sprite.userData.phase = i * 1.17;
        this.group.add(sprite);
        this.sprites.push(sprite);
      });
      this.el.object3D.add(this.group);
    },
    tick: function (time) {
      const t = time * 0.001;
      this.sprites.forEach((sprite, i) => {
        const pulse = 1 + Math.sin(t * 1.4 + sprite.userData.phase) * 0.06;
        sprite.position.y = sprite.userData.baseY + Math.sin(t * 0.72 + sprite.userData.phase) * 0.92;
        sprite.scale.set(sprite.userData.baseS * pulse, sprite.userData.baseS * pulse, 1);
        sprite.material.opacity = 0.62 + Math.sin(t * 1.9 + i) * 0.18;
      });
    }
  });
})();
