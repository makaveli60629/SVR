(function () {
  const THREE = AFRAME.THREE;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const clockVec = new THREE.Vector3();

  function makeCardTexture(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 356;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#11161f';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    ctx.fillStyle = /♥|♦/.test(label) ? '#d82f2f' : '#101318';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(label, 26, 92);
    ctx.globalAlpha = 0.16;
    ctx.font = 'bold 180px Arial';
    ctx.fillText(label, 28, 284);
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const CARD_TEX = ['A♠','K♠','Q♦','J♣','10♥','9♣','7♦'].reduce((acc, label) => { acc[label] = makeCardTexture(label); return acc; }, {});

  function faceTowardCamera(obj, camera, lockX) {
    if (!camera) return;
    camera.getWorldPosition(clockVec);
    obj.lookAt(clockVec.x, lockX ? obj.getWorldPosition(new THREE.Vector3()).y : clockVec.y, clockVec.z);
    if (lockX) obj.rotateY(Math.PI);
  }

  AFRAME.registerComponent('real-table-stage', {
    init: function () {
      this.cardsReady = false;
      this.demoIndex = 0;
      this.lastSwap = 0;
      this.onLoad = this.onLoad.bind(this);
      this.el.addEventListener('model-loaded', this.onLoad);
    },
    remove: function () {
      this.el.removeEventListener('model-loaded', this.onLoad);
    },
    onLoad: function () {
      const model = this.el.getObject3D('mesh');
      if (!model) return;
      model.scale.set(0.001, 0.001, 0.001);
      box.setFromObject(model);
      box.getSize(size);
      box.getCenter(center);
      model.position.x -= center.x;
      model.position.y -= box.min.y;
      model.position.z -= center.z;

      const top = size.y * 0.001;
      const feltW = size.x * 0.001 * 0.69;
      const feltD = size.z * 0.001 * 0.70;
      this.surface = { top, feltW, feltD };

      const felt = document.createElement('a-circle');
      felt.setAttribute('radius', '1');
      felt.setAttribute('rotation', '-90 0 0');
      felt.setAttribute('position', `0 ${top + 0.004} 0`);
      felt.setAttribute('scale', `${feltW * 0.52} ${feltD * 0.52} 1`);
      felt.setAttribute('src', '#tableFelt');
      felt.setAttribute('material', 'roughness:0.92; metalness:0.0');
      this.el.appendChild(felt);

      const logo = document.createElement('a-circle');
      logo.setAttribute('radius', '0.56');
      logo.setAttribute('rotation', '-90 0 0');
      logo.setAttribute('position', `0 ${top + 0.005} 0`);
      logo.setAttribute('src', '#logoTable');
      logo.setAttribute('material', 'shader:flat; transparent:true; alphaTest:0.06; side:double; depthWrite:false');
      this.el.appendChild(logo);

      this.cardGroup = new THREE.Group();
      this.el.object3D.add(this.cardGroup);
      this.communityCards = [];
      const communityX = [-0.52, -0.26, 0, 0.26, 0.52];
      communityX.forEach((x, i) => {
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 0.30),
          new THREE.MeshBasicMaterial({ map: CARD_TEX[['A♠','K♠','Q♦','J♣','10♥'][i]], transparent: false })
        );
        card.position.set(x, top + 0.26, -0.08);
        this.cardGroup.add(card);
        this.communityCards.push(card);
      });

      this.handCards = [];
      [-0.18, 0.18].forEach((x, i) => {
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(0.24, 0.32),
          new THREE.MeshBasicMaterial({ map: CARD_TEX[i === 0 ? 'A♠' : 'K♠'], transparent: false })
        );
        card.position.set(x, top + 0.18, feltD * 0.38);
        this.cardGroup.add(card);
        this.handCards.push(card);
      });
      this.cardsReady = true;
    },
    tick: function (time) {
      if (!this.cardsReady) return;
      const camera = this.el.sceneEl && this.el.sceneEl.camera;
      this.communityCards.forEach((card, i) => {
        card.position.y = this.surface.top + 0.26 + Math.sin(time * 0.0014 + i * 0.8) * 0.02;
        faceTowardCamera(card, camera, true);
      });
      this.handCards.forEach((card, i) => {
        card.position.y = this.surface.top + 0.18 + Math.sin(time * 0.0011 + i) * 0.012;
        faceTowardCamera(card, camera, true);
      });

      if (time - this.lastSwap > 2400) {
        this.lastSwap = time;
        const phases = [
          ['A♠','K♠','Q♦','J♣','10♥'],
          ['9♣','K♠','Q♦','J♣','10♥'],
          ['9♣','7♦','Q♦','J♣','10♥'],
          ['9♣','7♦','A♠','J♣','10♥']
        ];
        this.demoIndex = (this.demoIndex + 1) % phases.length;
        this.communityCards.forEach((card, i) => {
          card.material.map = CARD_TEX[phases[this.demoIndex][i]];
          card.material.needsUpdate = true;
        });
      }
    }
  });
})();
