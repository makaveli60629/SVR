(function () {
  const THREE = AFRAME.THREE;
  const loader = new THREE.TextureLoader();
  const TEXTURES = {
    color: loader.load('assets/textures/HAND_C.png'),
    normal: loader.load('assets/textures/HAND_N.png'),
    surface: loader.load('assets/textures/HAND_S.png')
  };

  TEXTURES.color.colorSpace = THREE.SRGBColorSpace;
  TEXTURES.normal.colorSpace = THREE.NoColorSpace;
  TEXTURES.surface.colorSpace = THREE.NoColorSpace;

  Object.values(TEXTURES).forEach(function (tex) {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  });

  function makeMaterial(obj) {
    return new THREE.MeshStandardMaterial({
      color: '#f3ece8',
      map: TEXTURES.color,
      normalMap: TEXTURES.normal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughnessMap: TEXTURES.surface,
      roughness: 0.84,
      metalness: 0.0,
      emissive: '#111111',
      emissiveIntensity: 0.02,
      side: THREE.DoubleSide,
      transparent: false,
      skinning: !!obj.isSkinnedMesh
    });
  }

  function apply(root) {
    let applied = false;
    root.traverse(function (obj) {
      if (!obj.isMesh) return;
      const name = String(obj.name || '').toLowerCase();
      if (name.includes('forearm') || name.includes('watch') || name.includes('device')) return;
      obj.material = makeMaterial(obj);
      obj.castShadow = false;
      obj.receiveShadow = false;
      applied = true;
    });
    return applied;
  }

  AFRAME.registerComponent('meta-hand-skin', {
    init: function () {
      this.applied = false;
      this.frames = 0;
      this.tryApply = this.tryApply.bind(this);
      this.el.addEventListener('object3dset', this.tryApply);
      setTimeout(this.tryApply, 0);
    },
    remove: function () {
      this.el.removeEventListener('object3dset', this.tryApply);
    },
    tryApply: function () {
      this.applied = apply(this.el.object3D) || this.applied;
    },
    tick: function () {
      if (this.applied) return;
      this.frames += 1;
      if (this.frames % 20 === 0) this.tryApply();
    }
  });
})();
