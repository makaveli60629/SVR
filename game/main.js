
(function () {
  if (!window.AFRAME || !window.THREE) return;

  AFRAME.registerComponent('phase102-vr-cleanup', {
    init: function () {
      const scene = this.el;
      const enterVr = () => document.body.classList.add('vr-mode');
      const exitVr = () => document.body.classList.remove('vr-mode');
      scene.addEventListener('enter-vr', enterVr);
      scene.addEventListener('exit-vr', exitVr);
    }
  });

  AFRAME.registerComponent('phase102-rig', {
    init: function () {
      this.turnValue = 0;
      this.moveVec = { x: 0, y: 0 };
      this.left = document.getElementById('leftHand');
      this.right = document.getElementById('rightHand');
      this.camera = document.getElementById('camera');
      this.snapCooldown = 0;
      this.onLeft = (e) => {
        if (!e.detail) return;
        this.moveVec.x = e.detail.x || 0;
        this.moveVec.y = e.detail.y || 0;
      };
      this.onRight = (e) => {
        if (!e.detail) return;
        this.turnValue = e.detail.x || 0;
      };
      this.onLeftEnd = () => { this.moveVec.x = 0; this.moveVec.y = 0; };
      this.onRightEnd = () => { this.turnValue = 0; };
      if (this.left) {
        this.left.addEventListener('thumbstickmoved', this.onLeft);
        this.left.addEventListener('thumbsticktouchend', this.onLeftEnd);
      }
      if (this.right) {
        this.right.addEventListener('thumbstickmoved', this.onRight);
        this.right.addEventListener('thumbsticktouchend', this.onRightEnd);
      }
    },
    tick: function (time, delta) {
      const dt = Math.min((delta || 16) / 1000, 0.05);
      if (Math.abs(this.turnValue) > 0.72) {
        this.snapCooldown -= delta || 16;
        if (this.snapCooldown <= 0) {
          this.el.object3D.rotation.y -= Math.sign(this.turnValue) * (Math.PI / 8);
          this.snapCooldown = 180;
        }
      } else {
        this.snapCooldown = 0;
      }

      const mag = Math.hypot(this.moveVec.x, this.moveVec.y);
      if (mag < 0.12) return;

      const yaw = (this.camera && this.camera.object3D) ? this.camera.object3D.rotation.y : 0;
      const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
      const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
      const speed = 1.85;
      const moveX = (right.x * this.moveVec.x + forward.x * this.moveVec.y) * speed * dt;
      const moveZ = (right.z * this.moveVec.x + forward.z * this.moveVec.y) * speed * dt;
      this.el.object3D.position.x += moveX;
      this.el.object3D.position.z += moveZ;
      this.el.object3D.position.x = Math.max(-7, Math.min(7, this.el.object3D.position.x));
      this.el.object3D.position.z = Math.max(-7, Math.min(7, this.el.object3D.position.z));
      this.el.object3D.position.y = 0.0;
    }
  });

  AFRAME.registerComponent('phase102-table-fit', {
    init: function () {
      this.el.addEventListener('model-loaded', () => {
        const model = this.el.getObject3D('mesh');
        if (!model) return;
        const THREE = window.THREE;
        const loader = new THREE.TextureLoader();
        const leather = loader.load('./assets/texture/leather_dark.jpg');
        leather.wrapS = leather.wrapT = THREE.RepeatWrapping;
        leather.repeat.set(3.2, 2.25);
        if (THREE.SRGBColorSpace) leather.colorSpace = THREE.SRGBColorSpace;

        const leatherBump = loader.load('./assets/texture/leather_dark_bump.jpg');
        leatherBump.wrapS = leatherBump.wrapT = THREE.RepeatWrapping;
        leatherBump.repeat.copy(leather.repeat);

        model.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.frustumCulled = false;
          obj.castShadow = false;
          obj.receiveShadow = false;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (!mat) return;
            mat.transparent = false;
            mat.opacity = 1;
            mat.depthWrite = true;
            mat.side = THREE.DoubleSide;
            mat.map = leather;
            if ('normalMap' in mat) {
              mat.normalMap = leatherBump;
              if (mat.normalScale) mat.normalScale.set(0.72, 0.72);
            } else if ('bumpMap' in mat) {
              mat.bumpMap = leatherBump;
              mat.bumpScale = 0.05;
            }
            if (mat.metalness !== undefined) mat.metalness = 0.06;
            if (mat.roughness !== undefined) mat.roughness = 0.95;
            mat.color = new THREE.Color('#d6d7db');
            mat.needsUpdate = true;
          });
        });

        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const sourceWidth = Math.max(size.x, size.z) || 1;
        const targetWidth = 1.34; // larger seated-fit table body
        const scale = targetWidth / sourceWidth;
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const bbox2 = new THREE.Box3().setFromObject(model);
        const center2 = new THREE.Vector3();
        bbox2.getCenter(center2);
        model.position.x -= center2.x;
        model.position.z -= center2.z;
        model.position.y -= bbox2.min.y + 0.03;
        model.updateMatrixWorld(true);

        const bbox3 = new THREE.Box3().setFromObject(model);
        const size3 = new THREE.Vector3();
        bbox3.getSize(size3);
        const feltY = bbox3.max.y - 0.035;

        const felt = document.getElementById('feltTop');
        if (felt) {
          felt.setAttribute('visible', true);
          felt.setAttribute('width', Math.max(0.88, size3.x * 0.66));
          felt.setAttribute('height', Math.max(0.42, size3.z * 0.34));
          felt.setAttribute('position', { x: 0, y: feltY, z: 0 });
          const applyFeltMaterial = () => {
            const mesh = felt.getObject3D('mesh');
            if (!mesh) return;
            const feltMap = loader.load('./assets/texture/tablefelt_custom_phase100.png');
            if (THREE.SRGBColorSpace) feltMap.colorSpace = THREE.SRGBColorSpace;
            const feltBump = loader.load('./assets/texture/14_5_2_bump.jpg');
            feltBump.wrapS = feltBump.wrapT = THREE.RepeatWrapping;
            feltBump.repeat.set(2.0, 1.1);
            mesh.material = new THREE.MeshStandardMaterial({
              map: feltMap,
              bumpMap: feltBump,
              bumpScale: 0.006,
              roughness: 0.99,
              metalness: 0.0,
              side: THREE.DoubleSide,
              color: new THREE.Color('#ffffff')
            });
            mesh.renderOrder = 4;
          };
          if (felt.getObject3D('mesh')) applyFeltMaterial();
          else felt.addEventListener('loaded', applyFeltMaterial, { once: true });
        }

        const rig = document.getElementById('rig');
        if (rig) {
          rig.object3D.position.set(0, 0, bbox3.max.z + 0.08);
        }
        const camera = document.getElementById('camera');
        if (camera) {
          camera.setAttribute('position', { x: 0, y: 1.30, z: 0 });
        }
        const dealerAnchor = document.getElementById('dealerAnchor');
        if (dealerAnchor) {
          dealerAnchor.setAttribute('position', { x: 0, y: 0, z: bbox3.min.z - 0.04 });
        }
      });
    }
  });

  AFRAME.registerComponent('phase102-dealer-loader', {
    init: function () {
      const THREE = window.THREE;
      if (!THREE || !THREE.FBXLoader) return;
      const el = this.el;
      const loadingManager = new THREE.LoadingManager();
      const texLoader = new THREE.TextureLoader(loadingManager);
      const diffuse = texLoader.load('./assets/models/eric/rp_eric_rigged_001_dif.jpg');
      const normal = texLoader.load('./assets/models/eric/rp_eric_rigged_001_norm.jpg');
      const gloss = texLoader.load('./assets/models/eric/rp_eric_rigged_001_gloss.jpg');
      if (THREE.SRGBColorSpace) diffuse.colorSpace = THREE.SRGBColorSpace;

      const loader = new THREE.FBXLoader(loadingManager);
      loader.load('./assets/models/eric/eric.fbx', (fbx) => {
        fbx.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.frustumCulled = false;
          obj.castShadow = false;
          obj.receiveShadow = false;
          obj.material = new THREE.MeshStandardMaterial({
            map: diffuse,
            normalMap: normal,
            roughnessMap: gloss,
            roughness: 0.82,
            metalness: 0.02,
            side: THREE.DoubleSide,
            color: new THREE.Color('#ffffff')
          });
        });

        const bbox = new THREE.Box3().setFromObject(fbx);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const targetHeight = 1.78;
        const scale = targetHeight / Math.max(size.y, 0.001);
        fbx.scale.setScalar(scale);
        fbx.updateMatrixWorld(true);

        const bbox2 = new THREE.Box3().setFromObject(fbx);
        const center = new THREE.Vector3();
        bbox2.getCenter(center);
        fbx.position.x -= center.x;
        fbx.position.z -= center.z;
        fbx.position.y -= bbox2.min.y;
        fbx.rotation.y = Math.PI;
        el.setObject3D('mesh', fbx);
      });
    }
  });
})();
