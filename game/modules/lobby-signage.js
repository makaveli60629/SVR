(function () {
  const THREE = AFRAME.THREE;

  function makePanelTexture(title, rows) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 1024, 512);
    bg.addColorStop(0, '#070a10');
    bg.addColorStop(1, '#121927');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.strokeStyle = '#9e67ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, 1000, 488);

    ctx.fillStyle = '#f5dcff';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(title, 42, 74);

    rows.forEach((row, i) => {
      const y = 128 + i * 68;
      ctx.fillStyle = 'rgba(155,104,255,0.12)';
      ctx.fillRect(34, y - 38, 956, 46);
      ctx.strokeStyle = 'rgba(213,192,255,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(34, y - 38, 956, 46);
      ctx.fillStyle = '#d7e5ff';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(String(i + 1).padStart(2, '0'), 52, y - 8);
      ctx.fillStyle = '#f4f7ff';
      ctx.fillText(row, 112, y - 8);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  AFRAME.registerComponent('lobby-signage', {
    init: function () {
      const group = new THREE.Group();
      const legendTex = makePanelTexture('LEGENDS WALL', ['HALL OF FAME', 'HIGH STACK WINNERS', 'ALL-IN LEAGUE', 'COMING SOON']);
      const sponsorTex = makePanelTexture('SPONSORSHIP WALL', ['SPONSOR SLOTS', 'TOURNAMENT BACKERS', 'CHARITY PARTNERS', 'COMING SOON']);

      const makePanel = (tex, x, y, z, ry) => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(5.8, 2.9),
          new THREE.MeshBasicMaterial({ map: tex, transparent: false })
        );
        panel.position.set(x, y, z);
        panel.rotation.y = ry;
        group.add(panel);

        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(6.1, 3.2, 0.18),
          new THREE.MeshStandardMaterial({ color: '#181b23', emissive: '#6c46dd', emissiveIntensity: 0.14, roughness: 0.88 })
        );
        frame.position.set(x, y, z - 0.12 * Math.cos(ry));
        frame.rotation.y = ry;
        group.add(frame);
      };

      makePanel(legendTex, -9.4, 2.3, -5.7, 0.36);
      makePanel(sponsorTex, 9.4, 2.3, -5.7, -0.36);
      this.el.object3D.add(group);
    }
  });
})();
