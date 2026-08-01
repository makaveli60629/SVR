import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const BUILD = 'PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK';
const DEFAULT_MODEL = '/game/assets/models/player.glb';
const DEFAULT_PALETTE = { bodyTint: '#d8dbe4', primary: '#11172a', secondary: '#7ffcff', metal: '#b9c7d8' };

function disposeObject(root) {
  root?.traverse?.((object) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((item) => item.dispose?.());
  });
}
function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.45,
    metalness: options.metalness ?? 0.08,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: THREE.DoubleSide
  });
}
function roundedBox(width, height, depth, radius = 0.04) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: radius * 0.35, bevelSize: radius * 0.35, bevelSegments: 3 });
}
function mesh(geometry, mat, name) {
  const result = new THREE.Mesh(geometry, mat);
  result.name = name;
  result.castShadow = false;
  result.receiveShadow = false;
  return result;
}

export class SVRAvatarViewer {
  constructor({ canvas, catalog = null, autoRotate = true, compact = false } = {}) {
    if (!canvas) throw new Error('AVATAR_CANVAS_REQUIRED');
    this.canvas = canvas;
    this.catalog = catalog;
    this.autoRotate = autoRotate;
    this.compact = compact;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050d);
    this.camera = new THREE.PerspectiveCamera(compact ? 31 : 34, 1, 0.01, 50);
    this.camera.position.set(0, compact ? 1.05 : 1.02, compact ? 3.15 : 3.0);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.6));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 4.5;
    this.controls.minPolarAngle = Math.PI * 0.20;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.target.set(0, 0.92, 0);
    this.interacting = false;
    this.controls.addEventListener('start', () => { this.interacting = true; });
    this.controls.addEventListener('end', () => { this.interacting = false; });
    this.avatarRoot = new THREE.Group();
    this.avatarRoot.name = 'PHASE346_AVATAR_ROOT';
    this.equipmentRoot = new THREE.Group();
    this.equipmentRoot.name = 'PHASE346_EQUIPMENT_ROOT';
    this.avatarRoot.add(this.equipmentRoot);
    this.scene.add(this.avatarRoot);
    this.baseModel = null;
    this.baseMaterials = [];
    this.currentOutfit = null;
    this.modelUrl = null;
    this.modelLoaded = false;
    this.fallbackUsed = false;
    this.loadError = null;
    this.frames = 0;
    this.lastFrameAt = performance.now();
    this.fps = 0;
    this.disposed = false;
    this.setupRoom();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
    this.animate = this.animate.bind(this);
    this.raf = requestAnimationFrame(this.animate);
  }
  setupRoom() {
    this.scene.add(new THREE.HemisphereLight(0xcff9ff, 0x16091f, 1.45));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2.5, 3.5, 3.2);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x7ffcff, 4.2, 7);
    rim.position.set(-2.1, 1.8, -1.5);
    this.scene.add(rim);
    const gold = new THREE.PointLight(0xffd98a, 3.4, 6);
    gold.position.set(2.1, 1.2, 1.2);
    this.scene.add(gold);
    const floor = mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.12, 64), material('#080b14', { roughness: 0.28, metalness: 0.5 }), 'PHASE346_PLATFORM');
    floor.position.y = -0.07;
    this.scene.add(floor);
    const ring = mesh(new THREE.TorusGeometry(0.88, 0.018, 10, 96), material('#7ffcff', { emissive: '#7ffcff', emissiveIntensity: 2.0, roughness: 0.2 }), 'PHASE346_PLATFORM_RING');
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);
    const backdrop = mesh(new THREE.TorusGeometry(1.48, 0.024, 12, 96, Math.PI * 1.55), material('#784cff', { emissive: '#784cff', emissiveIntensity: 1.4 }), 'PHASE346_BACKDROP_RING');
    backdrop.position.set(0, 1.15, -0.55);
    backdrop.rotation.z = Math.PI * 0.225;
    this.scene.add(backdrop);
  }
  async loadModel(url = DEFAULT_MODEL, targetHeight = 1.72) {
    this.modelUrl = url || DEFAULT_MODEL;
    this.loadError = null;
    this.modelLoaded = false;
    if (this.baseModel) {
      this.avatarRoot.remove(this.baseModel);
      disposeObject(this.baseModel);
      this.baseModel = null;
    }
    try {
      const gltf = await new GLTFLoader().loadAsync(this.modelUrl);
      const model = gltf.scene || gltf.scenes?.[0];
      if (!model) throw new Error('AVATAR_SCENE_MISSING');
      model.name = 'PHASE346_BASE_AVATAR_GLB';
      model.updateWorldMatrix(true, true);
      let box = new THREE.Box3().setFromObject(model);
      const height = Math.max(0.0001, box.max.y - box.min.y);
      model.scale.setScalar(targetHeight / height);
      model.updateWorldMatrix(true, true);
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;
      this.baseMaterials = [];
      model.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const source = Array.isArray(object.material) ? object.material : [object.material];
        const cloned = source.map((item) => {
          const copy = item.clone();
          copy.side = THREE.DoubleSide;
          copy.needsUpdate = true;
          this.baseMaterials.push(copy);
          return copy;
        });
        object.material = Array.isArray(object.material) ? cloned : cloned[0];
        object.frustumCulled = false;
      });
      this.baseModel = model;
      this.avatarRoot.add(model);
      this.modelLoaded = true;
      this.fallbackUsed = false;
      this.applyOutfit(this.currentOutfit || this.catalog?.defaultOutfit || {});
      return model;
    } catch (error) {
      this.loadError = String(error?.message || error);
      this.createFallbackAvatar();
      this.applyOutfit(this.currentOutfit || this.catalog?.defaultOutfit || {});
      return this.baseModel;
    }
  }
  createFallbackAvatar() {
    const root = new THREE.Group();
    root.name = 'PHASE346_FALLBACK_MANNEQUIN';
    const skin = material('#b8bec8', { roughness: 0.65 });
    const torso = mesh(new THREE.CapsuleGeometry(0.23, 0.52, 8, 16), skin, 'fallback-torso');
    torso.position.y = 1.02;
    torso.scale.set(1.0, 1.0, 0.68);
    root.add(torso);
    const head = mesh(new THREE.SphereGeometry(0.19, 24, 18), skin, 'fallback-head');
    head.position.y = 1.56;
    head.scale.z = 0.84;
    root.add(head);
    for (const side of [-1, 1]) {
      const arm = mesh(new THREE.CapsuleGeometry(0.075, 0.48, 6, 12), skin, `fallback-arm-${side}`);
      arm.position.set(side * 0.31, 1.04, 0);
      arm.rotation.z = side * 0.06;
      root.add(arm);
      const leg = mesh(new THREE.CapsuleGeometry(0.09, 0.58, 6, 12), skin, `fallback-leg-${side}`);
      leg.position.set(side * 0.12, 0.39, 0);
      root.add(leg);
    }
    this.baseModel = root;
    this.baseMaterials = [skin];
    this.avatarRoot.add(root);
    this.modelLoaded = true;
    this.fallbackUsed = true;
  }
  paletteFor(id) {
    return this.catalog?.palettes?.find((item) => item.id === id) || DEFAULT_PALETTE;
  }
  itemFor(category, id) {
    return this.catalog?.categories?.[category]?.find((item) => item.id === id) || { id: 'none', generator: 'none' };
  }
  applyOutfit(input = {}) {
    const defaults = this.catalog?.defaultOutfit || {};
    const outfit = {
      schemaVersion: 1,
      modelId: input.modelId || defaults.modelId || 'svr-player',
      palette: input.palette || defaults.palette || 'midnight',
      headwear: input.headwear ?? defaults.headwear ?? 'none',
      eyewear: input.eyewear ?? defaults.eyewear ?? 'none',
      top: input.top ?? defaults.top ?? 'none',
      shoes: input.shoes ?? defaults.shoes ?? 'none',
      accessory: input.accessory ?? defaults.accessory ?? 'none'
    };
    this.currentOutfit = outfit;
    const palette = this.paletteFor(outfit.palette);
    this.baseMaterials.forEach((base) => {
      if (base.color) base.color.set(palette.bodyTint || DEFAULT_PALETTE.bodyTint);
      if ('roughness' in base) base.roughness = Math.max(0.42, base.roughness ?? 0.6);
      if ('metalness' in base) base.metalness = Math.min(0.18, base.metalness ?? 0);
      base.needsUpdate = true;
    });
    while (this.equipmentRoot.children.length) {
      const child = this.equipmentRoot.children.pop();
      disposeObject(child);
    }
    this.generate(this.itemFor('top', outfit.top).generator, palette);
    this.generate(this.itemFor('headwear', outfit.headwear).generator, palette);
    this.generate(this.itemFor('eyewear', outfit.eyewear).generator, palette);
    this.generate(this.itemFor('shoes', outfit.shoes).generator, palette);
    this.generate(this.itemFor('accessory', outfit.accessory).generator, palette);
    window.dispatchEvent(new CustomEvent('svr:avatar-outfit-preview', { detail: { build: BUILD, outfit: { ...outfit } } }));
    return { ...outfit };
  }
  generate(type, palette) {
    if (!type || type === 'none') return;
    const primary = material(palette.primary || '#11172a', { roughness: 0.4, metalness: 0.12 });
    const accent = material(palette.secondary || '#7ffcff', { roughness: 0.28, metalness: 0.35, emissive: palette.secondary || '#7ffcff', emissiveIntensity: 0.25 });
    const metal = material(palette.metal || '#b9c7d8', { roughness: 0.18, metalness: 0.82 });
    const add = (object) => { this.equipmentRoot.add(object); return object; };
    if (['jacket', 'hoodie', 'vest'].includes(type)) {
      const torso = mesh(roundedBox(type === 'vest' ? 0.43 : 0.48, type === 'hoodie' ? 0.55 : 0.51, 0.22, 0.055), primary, `phase346-${type}-torso`);
      torso.position.set(-0.24, 0.82, -0.12);
      add(torso);
      const trim = mesh(new THREE.BoxGeometry(0.032, 0.50, 0.012), accent, `phase346-${type}-trim`);
      trim.position.set(0, 1.075, 0.112);
      add(trim);
      if (type !== 'vest') {
        for (const side of [-1, 1]) {
          const sleeve = mesh(new THREE.CapsuleGeometry(0.075, 0.39, 6, 12), primary, `phase346-${type}-sleeve-${side}`);
          sleeve.position.set(side * 0.31, 1.06, 0);
          sleeve.rotation.z = side * 0.06;
          add(sleeve);
        }
      }
      if (type === 'hoodie') {
        const hood = mesh(new THREE.TorusGeometry(0.18, 0.055, 10, 32, Math.PI * 1.55), primary, 'phase346-hood');
        hood.position.set(0, 1.40, -0.06);
        hood.rotation.x = Math.PI / 2;
        hood.rotation.z = Math.PI * 0.23;
        add(hood);
      }
    } else if (type === 'cap') {
      const crown = mesh(new THREE.SphereGeometry(0.205, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.58), primary, 'phase346-cap-crown');
      crown.position.set(0, 1.69, 0);
      crown.scale.z = 0.90;
      add(crown);
      const brim = mesh(new THREE.BoxGeometry(0.25, 0.025, 0.18), accent, 'phase346-cap-brim');
      brim.position.set(0, 1.66, 0.145);
      brim.rotation.x = -0.08;
      add(brim);
    } else if (type === 'beanie') {
      const beanie = mesh(new THREE.SphereGeometry(0.205, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.66), primary, 'phase346-beanie');
      beanie.position.set(0, 1.70, 0);
      beanie.scale.z = 0.90;
      add(beanie);
      const band = mesh(new THREE.TorusGeometry(0.185, 0.027, 10, 36), accent, 'phase346-beanie-band');
      band.position.set(0, 1.64, 0);
      band.rotation.x = Math.PI / 2;
      add(band);
    } else if (type === 'crown') {
      const band = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.10, 32, 1, true), metal, 'phase346-crown-band');
      band.position.y = 1.70;
      add(band);
      for (let i = 0; i < 7; i++) {
        const spike = mesh(new THREE.ConeGeometry(0.047, 0.18, 8), accent, `phase346-crown-spike-${i}`);
        const angle = i / 7 * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.15, 1.83, Math.sin(angle) * 0.15);
        add(spike);
      }
    } else if (type === 'glasses-round') {
      for (const side of [-1, 1]) {
        const lens = mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 30), accent, `phase346-glasses-${side}`);
        lens.position.set(side * 0.085, 1.56, 0.175);
        add(lens);
      }
      const bridge = mesh(new THREE.BoxGeometry(0.045, 0.012, 0.012), metal, 'phase346-glasses-bridge');
      bridge.position.set(0, 1.56, 0.176);
      add(bridge);
    } else if (type === 'visor') {
      const visor = mesh(roundedBox(0.36, 0.105, 0.035, 0.025), material(palette.secondary || '#7ffcff', { transparent: true, opacity: 0.72, emissive: palette.secondary || '#7ffcff', emissiveIntensity: 0.7, roughness: 0.1 }), 'phase346-visor');
      visor.position.set(-0.18, 1.50, 0.16);
      add(visor);
    } else if (type === 'sneakers' || type === 'boots') {
      for (const side of [-1, 1]) {
        const shoe = mesh(roundedBox(type === 'boots' ? 0.18 : 0.20, type === 'boots' ? 0.22 : 0.12, 0.34, 0.035), primary, `phase346-${type}-${side}`);
        shoe.position.set(side * 0.105 - 0.09, type === 'boots' ? 0.02 : -0.01, -0.06);
        add(shoe);
        if (type === 'sneakers') {
          const sole = mesh(new THREE.BoxGeometry(0.20, 0.025, 0.35), accent, `phase346-sneaker-sole-${side}`);
          sole.position.set(side * 0.105, 0.025, 0.115);
          add(sole);
        }
      }
    } else if (type === 'chain') {
      const chain = mesh(new THREE.TorusGeometry(0.16, 0.012, 10, 48, Math.PI * 1.35), metal, 'phase346-chain');
      chain.position.set(0, 1.31, 0.13);
      chain.rotation.z = Math.PI * 0.825;
      add(chain);
    } else if (type === 'watch') {
      const watch = mesh(new THREE.TorusGeometry(0.066, 0.018, 10, 28), accent, 'phase346-watch-band');
      watch.position.set(-0.31, 0.79, 0.015);
      watch.rotation.x = Math.PI / 2;
      add(watch);
      const face = mesh(new THREE.BoxGeometry(0.065, 0.055, 0.028), metal, 'phase346-watch-face');
      face.position.set(-0.31, 0.79, 0.085);
      add(face);
    } else if (type === 'badge') {
      const badge = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 32), accent, 'phase346-founder-badge');
      badge.rotation.x = Math.PI / 2;
      badge.position.set(0.14, 1.24, 0.13);
      add(badge);
    }
  }
  setAutoRotate(value) { this.autoRotate = Boolean(value); }
  resetView() {
    this.camera.position.set(0, this.compact ? 1.05 : 1.02, this.compact ? 3.15 : 3.0);
    this.controls.target.set(0, 0.92, 0);
    this.controls.update();
    this.avatarRoot.rotation.set(0, 0, 0);
  }
  resize() {
    const parent = this.canvas.parentElement || this.canvas;
    const width = Math.max(1, parent.clientWidth || 1);
    const height = Math.max(1, parent.clientHeight || width);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
  capture(type = 'image/png', quality = 0.92) {
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL(type, quality);
  }
  audit() {
    return {
      build: BUILD,
      active: !this.disposed,
      modelUrl: this.modelUrl,
      modelLoaded: this.modelLoaded,
      fallbackUsed: this.fallbackUsed,
      loadError: this.loadError,
      outfit: this.currentOutfit ? { ...this.currentOutfit } : null,
      equipmentObjects: this.equipmentRoot.children.length,
      renderer: {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        fps: Number(this.fps.toFixed(1))
      },
      checkedAt: new Date().toISOString()
    };
  }
  animate(now) {
    if (this.disposed) return;
    this.frames++;
    if (now - this.lastFrameAt >= 1000) {
      this.fps = this.frames * 1000 / (now - this.lastFrameAt);
      this.frames = 0;
      this.lastFrameAt = now;
    }
    if (this.autoRotate && !this.interacting) this.avatarRoot.rotation.y += this.compact ? 0.0022 : 0.0017;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.animate);
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect?.();
    this.controls?.dispose?.();
    disposeObject(this.scene);
    this.renderer?.dispose?.();
  }
}
window.SVRAvatarViewer = SVRAvatarViewer;
