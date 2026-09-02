import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const BUILD = 'PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK';
export const POLISH_BUILD = 'PHASE-370-ACCOUNT-PROFILE-AVATAR-MOBILE-POLISH-LOCK';

const DEFAULT_MODEL = '/game/assets/models/eric/eric.fbx';
const DEFAULT_PALETTE = Object.freeze({
  bodyTint: '#d8dbe4',
  primary: '#11172a',
  secondary: '#7ffcff',
  metal: '#b9c7d8'
});

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) if (value?.isTexture) value.dispose?.();
  material.dispose?.();
}

function disposeObject(root) {
  root?.traverse?.((object) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach(disposeMaterial);
  });
}

function physical(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.52,
    metalness: options.metalness ?? 0.08,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: THREE.DoubleSide
  });
}

function mesh(geometry, material, name) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.castShadow = false;
  object.receiveShadow = false;
  return object;
}

function boxInfo(object) {
  object.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return {
    box,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3())
  };
}

function orientUpright(object) {
  const candidates = [
    [0, 0, 0],
    [-Math.PI / 2, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, 0, Math.PI / 2],
    [0, 0, -Math.PI / 2],
    [0, Math.PI, 0],
    [-Math.PI / 2, Math.PI, 0],
    [Math.PI / 2, Math.PI, 0]
  ];
  let best = null;
  for (const candidate of candidates) {
    object.rotation.set(...candidate);
    const info = boxInfo(object);
    const horizontal = Math.max(info.size.x, info.size.z, 0.001);
    const score = info.size.y / horizontal;
    if (!best || score > best.score) best = { score, rotation: object.rotation.clone() };
  }
  if (best) object.rotation.copy(best.rotation);
}

function normalizeModel(object, targetHeight) {
  orientUpright(object);
  let info = boxInfo(object);
  const height = Math.max(0.001, info.size.y);
  object.scale.multiplyScalar(Number(targetHeight || 1.72) / height);
  info = boxInfo(object);
  object.position.x -= info.center.x;
  object.position.z -= info.center.z;
  object.position.y -= info.box.min.y;
  object.updateWorldMatrix?.(true, true);
}

function cloneMaterial(source) {
  const copy = source?.clone?.() || physical('#d8dbe4');
  copy.side = THREE.DoubleSide;
  copy.userData = { ...(copy.userData || {}) };
  const textured = Boolean(copy.map || copy.normalMap || copy.emissiveMap || copy.roughnessMap || copy.metalnessMap);
  copy.userData.svrTexturedMaterial = textured;
  copy.userData.svrOriginalColor = copy.color?.getHexString?.() || null;
  if (copy.map) {
    copy.map.colorSpace = THREE.SRGBColorSpace;
    copy.map.needsUpdate = true;
    copy.color?.set?.(0xffffff);
  }
  if (copy.emissiveMap) {
    copy.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    copy.emissiveMap.needsUpdate = true;
  }
  if ('roughness' in copy) copy.roughness = Math.max(0.34, Number(copy.roughness ?? 0.6));
  if ('metalness' in copy) copy.metalness = Math.min(0.35, Number(copy.metalness ?? 0));
  copy.needsUpdate = true;
  return copy;
}

function capsule(radius, length, color, name) {
  return mesh(new THREE.CapsuleGeometry(radius, length, 7, 14), physical(color, { roughness: 0.68 }), name);
}

export class SVRAvatarViewer {
  constructor({ canvas, catalog = null, autoRotate = true, compact = false } = {}) {
    if (!canvas) throw new Error('AVATAR_CANVAS_REQUIRED');
    this.canvas = canvas;
    this.catalog = catalog;
    this.autoRotate = Boolean(autoRotate);
    this.compact = Boolean(compact);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050d);
    this.camera = new THREE.PerspectiveCamera(compact ? 31 : 34, 1, 0.01, 60);
    this.camera.position.set(0, compact ? 1.05 : 1.12, compact ? 3.2 : 3.35);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.15 : 1.4));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.7;
    this.controls.maxDistance = 5.2;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.maxPolarAngle = Math.PI * 0.68;
    this.controls.target.set(0, 0.92, 0);
    this.interacting = false;
    this.controls.addEventListener('start', () => { this.interacting = true; });
    this.controls.addEventListener('end', () => { this.interacting = false; });

    this.avatarRoot = new THREE.Group();
    this.avatarRoot.name = 'PHASE370_CLEAN_AVATAR_ROOT';
    this.modelRoot = new THREE.Group();
    this.modelRoot.name = 'PHASE370_MODEL_ROOT';
    this.equipmentRoot = new THREE.Group();
    this.equipmentRoot.name = 'PHASE370_EQUIPMENT_ROOT';
    this.avatarRoot.add(this.modelRoot, this.equipmentRoot);
    this.scene.add(this.avatarRoot);

    this.baseModel = null;
    this.baseMaterials = [];
    this.currentOutfit = null;
    this.modelUrl = null;
    this.modelLoaded = false;
    this.fallbackUsed = false;
    this.loadError = null;
    this.frames = 0;
    this.fps = 0;
    this.lastFrameAt = performance.now();
    this.disposed = false;
    this.mixer = null;
    this.clock = new THREE.Clock();

    this.setupRoom();
    const Resize = window.ResizeObserver || class {
      constructor(callback) { this.callback = callback; this.handler = () => callback([]); }
      observe() { window.addEventListener('resize', this.handler); this.handler(); }
      disconnect() { window.removeEventListener('resize', this.handler); }
    };
    this.resizeObserver = new Resize(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
    this.animate = this.animate.bind(this);
    this.raf = requestAnimationFrame(this.animate);
  }

  setupRoom() {
    this.scene.add(new THREE.HemisphereLight(0xd7fbff, 0x1a0a22, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(2.8, 4.1, 3.6);
    this.scene.add(key);
    const fill = new THREE.PointLight(0x7ffcff, 4.4, 8);
    fill.position.set(-2.2, 2.0, 1.5);
    this.scene.add(fill);
    const rim = new THREE.PointLight(0xa46cff, 4.2, 8);
    rim.position.set(2.2, 2.4, -1.8);
    this.scene.add(rim);
    const floor = mesh(
      new THREE.CylinderGeometry(1.08, 1.2, 0.12, 64),
      physical('#080b14', { roughness: 0.3, metalness: 0.5 }),
      'PHASE370_AVATAR_PLATFORM'
    );
    floor.position.y = -0.07;
    this.scene.add(floor);
    const ring = mesh(
      new THREE.TorusGeometry(0.9, 0.018, 10, 96),
      physical('#7ffcff', { emissive: '#7ffcff', emissiveIntensity: 2.2, roughness: 0.2 }),
      'PHASE370_AVATAR_PLATFORM_RING'
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);
  }

  async loadModel(url = DEFAULT_MODEL, targetHeight = 1.72) {
    this.modelUrl = url || DEFAULT_MODEL;
    this.loadError = null;
    this.modelLoaded = false;
    this.mixer = null;
    while (this.modelRoot.children.length) {
      const child = this.modelRoot.children.pop();
      disposeObject(child);
    }
    this.baseModel = null;
    this.baseMaterials = [];

    try {
      const isFbx = /\.fbx(?:[?#]|$)/i.test(this.modelUrl);
      const loaded = isFbx
        ? await new FBXLoader().loadAsync(this.modelUrl)
        : await new GLTFLoader().loadAsync(this.modelUrl);
      const model = isFbx ? loaded : loaded.scene || loaded.scenes?.[0];
      if (!model) throw new Error('AVATAR_SCENE_MISSING');
      model.name = 'PHASE370_TEXTURED_AVATAR_MODEL';
      normalizeModel(model, targetHeight);

      model.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const originals = Array.isArray(object.material) ? object.material : [object.material];
        const clones = originals.map((item) => cloneMaterial(item));
        object.material = Array.isArray(object.material) ? clones : clones[0];
        object.frustumCulled = false;
        object.castShadow = false;
        object.receiveShadow = false;
        this.baseMaterials.push(...clones);
      });

      this.baseModel = model;
      this.modelRoot.add(model);
      const animations = isFbx ? loaded.animations || [] : loaded.animations || [];
      if (animations.length) {
        this.mixer = new THREE.AnimationMixer(model);
        const action = this.mixer.clipAction(animations[0]);
        action.play();
      }
      this.modelLoaded = true;
      this.fallbackUsed = false;
      this.applyOutfit(this.currentOutfit || this.catalog?.defaultOutfit || {});
      this.resetView();
      return model;
    } catch (error) {
      this.loadError = String(error?.message || error);
      this.createFallbackAvatar();
      this.applyOutfit(this.currentOutfit || this.catalog?.defaultOutfit || {});
      this.resetView();
      return this.baseModel;
    }
  }

  createFallbackAvatar() {
    const root = new THREE.Group();
    root.name = 'PHASE370_DEFAULT_ERIC_FALLBACK';
    const skin = '#b97858';
    const jacket = '#251335';
    const pants = '#151821';
    const torso = capsule(0.22, 0.48, jacket, 'eric-torso');
    torso.position.y = 1.05;
    torso.scale.set(1.05, 1, 0.72);
    root.add(torso);
    const head = mesh(new THREE.SphereGeometry(0.19, 24, 18), physical(skin, { roughness: 0.72 }), 'eric-head');
    head.position.y = 1.58;
    root.add(head);
    for (const side of [-1, 1]) {
      const arm = capsule(0.072, 0.46, jacket, `eric-arm-${side}`);
      arm.position.set(side * 0.31, 1.08, 0);
      arm.rotation.z = side * 0.08;
      root.add(arm);
      const leg = capsule(0.085, 0.56, pants, `eric-leg-${side}`);
      leg.position.set(side * 0.12, 0.4, 0);
      root.add(leg);
    }
    this.baseModel = root;
    this.modelRoot.add(root);
    this.baseMaterials = [];
    root.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      this.baseMaterials.push(...materials.filter(Boolean));
    });
    this.modelLoaded = true;
    this.fallbackUsed = true;
  }

  paletteFor(id) {
    return this.catalog?.palettes?.find((item) => item.id === id) || DEFAULT_PALETTE;
  }

  clearEquipment() {
    while (this.equipmentRoot.children.length) {
      const child = this.equipmentRoot.children.pop();
      disposeObject(child);
    }
  }

  addEquipment(outfit, palette) {
    const primary = physical(palette.primary || DEFAULT_PALETTE.primary, { roughness: 0.46 });
    const accent = physical(palette.secondary || DEFAULT_PALETTE.secondary, {
      roughness: 0.28,
      metalness: 0.3,
      emissive: palette.secondary || DEFAULT_PALETTE.secondary,
      emissiveIntensity: 0.24
    });
    const metal = physical(palette.metal || DEFAULT_PALETTE.metal, { roughness: 0.2, metalness: 0.78 });
    const add = (object) => { this.equipmentRoot.add(object); return object; };

    if (outfit.top && outfit.top !== 'none') {
      const torso = mesh(new THREE.CapsuleGeometry(0.235, 0.34, 10, 24), primary, `phase442-fitted-${outfit.top}`);
      torso.position.set(0, 1.05, 0); torso.scale.set(1.08, 1, .66); add(torso);
      const collar = mesh(new THREE.TorusGeometry(.115,.022,10,32,Math.PI), accent, 'phase442-tailored-collar');
      collar.position.set(0,1.30,.115);collar.rotation.set(Math.PI/2,0,0);add(collar);
      if(outfit.top==='hoodie'){
        const hood=mesh(new THREE.TorusGeometry(.205,.055,12,38,Math.PI*1.35),primary,'phase442-sculpted-hood');
        hood.position.set(0,1.37,-.035);hood.rotation.z=-Math.PI*.17;add(hood);
      }
      for(const side of [-1,1]){const sleeve=mesh(new THREE.CapsuleGeometry(.068,.37,8,18),primary,`phase442-tailored-sleeve-${side}`);sleeve.position.set(side*.30,1.06,0);sleeve.rotation.z=side*.08;add(sleeve)}
    }
    if (outfit.headwear === 'cap') {
      const cap = mesh(new THREE.SphereGeometry(0.21, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), primary, 'phase370-cap');
      cap.position.set(0, 1.72, 0);
      add(cap);
      const brim = mesh(new THREE.BoxGeometry(0.25, 0.025, 0.17), accent, 'phase370-cap-brim');
      brim.position.set(0, 1.68, 0.14);
      add(brim);
    } else if (outfit.headwear === 'crown') {
      const crown = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 24, 1, true), metal, 'phase370-crown');
      crown.position.y = 1.76;
      add(crown);
    } else if (outfit.headwear === 'beanie') {
      const beanie=mesh(new THREE.SphereGeometry(.205,28,18,0,Math.PI*2,0,Math.PI*.58),primary,'phase442-fitted-beanie');beanie.position.set(0,1.71,0);add(beanie);
      const band=mesh(new THREE.TorusGeometry(.177,.026,10,40),accent,'phase442-beanie-band');band.position.set(0,1.67,0);band.rotation.x=Math.PI/2;add(band);
    }
    if (outfit.eyewear && outfit.eyewear !== 'none') {
      if(outfit.eyewear==='neon'){
        for(const side of [-1,1]){const lens=mesh(new THREE.TorusGeometry(.075,.012,8,28),accent,`phase442-lens-${side}`);lens.position.set(side*.082,1.57,.177);add(lens)}
        const bridge=mesh(new THREE.CylinderGeometry(.009,.009,.055,12),metal,'phase442-glasses-bridge');bridge.position.set(0,1.57,.177);bridge.rotation.z=Math.PI/2;add(bridge);
      }else{const visor=mesh(new THREE.CapsuleGeometry(.055,.22,8,20),accent,'phase442-curved-visor');visor.position.set(0,1.57,.17);visor.rotation.z=Math.PI/2;visor.scale.z=.35;add(visor)}
    }
    if (outfit.shoes && outfit.shoes !== 'none') {
      for (const side of [-1, 1]) {
        const shoe = mesh(new THREE.CapsuleGeometry(.075,.18,8,20), primary, `phase442-fitted-shoe-${side}`);
        shoe.position.set(side * 0.12, 0.07, 0.055);shoe.rotation.x=Math.PI/2;shoe.scale.set(1.05,1,.85);
        add(shoe);
      }
    }
    if (outfit.accessory === 'watch') {
      const watch = mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 22), metal, 'phase370-watch');
      watch.position.set(0.32, 0.94, 0.02);
      watch.rotation.y = Math.PI / 2;
      add(watch);
    } else if (outfit.accessory === 'badge') {
      const badge = mesh(new THREE.CircleGeometry(0.045, 24), accent, 'phase370-badge');
      badge.position.set(-0.13, 1.15, 0.13);
      add(badge);
    } else if (outfit.accessory === 'chain') {
      const chain=mesh(new THREE.TorusGeometry(.145,.012,9,48,Math.PI*1.35),metal,'phase442-gold-chain');chain.position.set(0,1.24,.145);chain.rotation.z=-Math.PI*.175;add(chain);
    }
  }

  applyOutfit(input = {}) {
    const defaults = this.catalog?.defaultOutfit || {};
    const outfit = {
      schemaVersion: 1,
      modelId: input.modelId || defaults.modelId || 'eric',
      palette: input.palette || defaults.palette || 'midnight',
      headwear: input.headwear ?? defaults.headwear ?? 'none',
      eyewear: input.eyewear ?? defaults.eyewear ?? 'none',
      top: input.top ?? defaults.top ?? 'none',
      shoes: input.shoes ?? defaults.shoes ?? 'none',
      accessory: input.accessory ?? defaults.accessory ?? 'none'
    };
    this.currentOutfit = outfit;
    const palette = this.paletteFor(outfit.palette);
    for (const base of this.baseMaterials) {
      if (!base) continue;
      if (base.userData?.svrTexturedMaterial || base.map) {
        base.color?.set?.(0xffffff);
        if (base.map) {
          base.map.colorSpace = THREE.SRGBColorSpace;
          base.map.needsUpdate = true;
        }
      } else if (base.color && base.color.getHSL) {
        const hsl = {};
        base.color.getHSL(hsl);
        if (hsl.l < 0.08 || hsl.l > 0.94) base.color.set(palette.bodyTint || DEFAULT_PALETTE.bodyTint);
      }
      base.needsUpdate = true;
    }
    this.clearEquipment();
    this.addEquipment(outfit, palette);
    window.dispatchEvent(new CustomEvent('svr:avatar-outfit-preview', {
      detail: { build: POLISH_BUILD, outfit: { ...outfit }, texturesPreserved: true }
    }));
    return { ...outfit };
  }

  setAutoRotate(value) {
    this.autoRotate = Boolean(value);
  }

  resetView() {
    this.avatarRoot.rotation.set(0, 0, 0);
    this.camera.position.set(0, this.compact ? 1.05 : 1.12, this.compact ? 3.2 : 3.35);
    this.controls.target.set(0, 0.92, 0);
    this.controls.update();
  }

  resize() {
    if (this.disposed) return;
    const parent = this.canvas.parentElement || this.canvas;
    const width = Math.max(1, parent.clientWidth || this.canvas.clientWidth || 640);
    const height = Math.max(1, parent.clientHeight || this.canvas.clientHeight || 640);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  capture(type = 'image/png') {
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL(type);
  }

  animate() {
    if (this.disposed) return;
    const delta = Math.min(0.05, this.clock.getDelta());
    this.mixer?.update?.(delta);
    if (this.autoRotate && !this.interacting) this.avatarRoot.rotation.y += delta * 0.42;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frames += 1;
    const now = performance.now();
    if (now - this.lastFrameAt >= 1000) {
      this.fps = Math.round(this.frames * 1000 / Math.max(1, now - this.lastFrameAt));
      this.frames = 0;
      this.lastFrameAt = now;
    }
    this.raf = requestAnimationFrame(this.animate);
  }

  audit() {
    const texturedMaterials = this.baseMaterials.filter((material) => material?.map).length;
    const whiteTexturedMaterials = this.baseMaterials.filter((material) => material?.map && material.color?.getHex?.() === 0xffffff).length;
    return {
      build: BUILD,
      polishBuild: POLISH_BUILD,
      modelLoaded: this.modelLoaded,
      modelUrl: this.modelUrl,
      fallbackUsed: this.fallbackUsed,
      texturesPreserved: texturedMaterials === whiteTexturedMaterials,
      texturedMaterials,
      equipmentObjects: this.equipmentRoot.children.length,
      autoRotate: this.autoRotate,
      fps: this.fps,
      loadError: this.loadError,
      pass: Boolean(this.modelLoaded && texturedMaterials === whiteTexturedMaterials),
      checkedAt: new Date().toISOString()
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect?.();
    this.controls?.dispose?.();
    disposeObject(this.avatarRoot);
    this.renderer?.dispose?.();
  }
}
