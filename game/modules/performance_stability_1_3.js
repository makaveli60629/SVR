import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-3I-QUEST-PERFORMANCE-STABILITY";

function profile() {
  const ua = navigator.userAgent || "";
  const isQuest = /Quest|OculusBrowser|Meta Quest/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isQuest || /Mobile|iPhone|iPad|Android/i.test(ua);
  return { isQuest, isAndroid, isMobile };
}

function tuneRenderer(renderer, p) {
  if (!renderer) return {};
  const before = {
    pixelRatio: renderer.getPixelRatio?.(),
    toneMappingExposure: renderer.toneMappingExposure
  };
  const targetPixelRatio = p.isQuest ? 0.66 : p.isAndroid ? 0.78 : Math.min(window.devicePixelRatio || 1, 1.0);
  renderer.setPixelRatio?.(targetPixelRatio);
  renderer.xr?.setFramebufferScaleFactor?.(p.isQuest ? 0.66 : p.isMobile ? 0.82 : 0.95);
  renderer.xr?.setFoveation?.(p.isQuest ? 1.0 : 0.75);
  renderer.shadowMap.enabled = false;
  renderer.toneMappingExposure = p.isQuest ? 0.84 : p.isMobile ? 0.92 : 1.0;
  return {
    before,
    after: {
      pixelRatio: renderer.getPixelRatio?.(),
      framebufferScale: p.isQuest ? 0.66 : p.isMobile ? 0.82 : 0.95,
      toneMappingExposure: renderer.toneMappingExposure,
      foveation: p.isQuest ? 1.0 : 0.75
    }
  };
}

function stableTransparentMaterial(mat) {
  if (!mat) return false;
  let changed = false;
  if (mat.transparent || mat.opacity < 1) {
    mat.depthWrite = false;
    mat.alphaTest = Math.max(mat.alphaTest || 0, 0.015);
    if (mat.opacity > 0.98 && /BasicMaterial|MeshBasicMaterial/i.test(mat.type || "")) mat.opacity = 0.98;
    mat.needsUpdate = true;
    changed = true;
  }
  return changed;
}

function optimizeSceneMaterials(scene) {
  let materials = 0;
  let meshes = 0;
  let sprites = 0;
  let transparentFixed = 0;
  scene.traverse((obj) => {
    if (!obj) return;
    if (obj.isMesh) {
      meshes++;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.frustumCulled = true;
    }
    if (obj.isSprite) {
      sprites++;
      obj.frustumCulled = true;
      const n = String(obj.name || "");
      if (/FIREFLY|SPRITE|DUST|PARTICLE|GLOW/i.test(n) && obj.material?.opacity > 0.38) {
        obj.material.opacity = 0.38;
        obj.material.needsUpdate = true;
      }
    }
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((m) => {
      materials++;
      if (stableTransparentMaterial(m)) transparentFixed++;
      if (m.map) {
        m.map.anisotropy = Math.min(m.map.anisotropy || 1, 4);
        m.map.needsUpdate = true;
      }
    });
  });
  return { meshes, sprites, materials, transparentFixed };
}

function installFrameGuard(scene, renderer, p) {
  const samples = [];
  let last = performance.now();
  let lastOptimize = 0;
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const now = performance.now();
    const dt = now - last;
    last = now;
    samples.push(dt);
    if (samples.length > 90) samples.shift();
    if (now - lastOptimize > 2400) {
      lastOptimize = now;
      const avg = samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);
      const fps = avg > 0 ? Math.round(1000 / avg) : 0;
      window.SVR_PERFORMANCE_STABILITY_13I.fpsEstimate = fps;
      if (p.isQuest && fps && fps < 58) {
        renderer.setPixelRatio?.(0.62);
        renderer.xr?.setFramebufferScaleFactor?.(0.62);
        window.SVR_PERFORMANCE_STABILITY_13I.dynamicDownshift = true;
      }
      if (fps && fps < 45) {
        scene.traverse((obj) => {
          const n = String(obj.name || "");
          if (/FIREFLY|SPRITE|DUST|PARTICLE/i.test(n)) obj.visible = false;
        });
        window.SVR_PERFORMANCE_STABILITY_13I.particleCull = true;
      }
    }
  };
}

function removeBlackBlockers(scene) {
  let hidden = 0;
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (/BLACK.*BLOCKER|DEBUG.*BOX|TEMP.*WALL|PLACEHOLDER.*BLOCK/i.test(n)) {
      obj.visible = false;
      hidden++;
    }
  });
  return hidden;
}

export function applyPerformanceStability13(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PERFORMANCE_STABILITY_13I_LOCK")) return null;
  const renderer = window.SVR_RENDERER;
  const p = profile();
  const lock = new THREE.Group();
  lock.name = "SVR_PERFORMANCE_STABILITY_13I_LOCK";
  scene.add(lock);

  const rendererTune = tuneRenderer(renderer, p);
  const materialPass = optimizeSceneMaterials(scene);
  const hiddenBlackBlockers = removeBlackBlockers(scene);
  installFrameGuard(scene, renderer, p);

  window.SVR_PERFORMANCE_STABILITY_13I = {
    build: BUILD,
    profile: p,
    rendererTune,
    materialPass,
    hiddenBlackBlockers,
    dynamicDownshift: false,
    particleCull: false,
    goal: "reduce Quest shimmer, blink, load pressure, and frame dips"
  };
  scene.userData.SVR_PERFORMANCE_STABILITY_13I = window.SVR_PERFORMANCE_STABILITY_13I;
  log?.("Performance stability 1.3I loaded", window.SVR_PERFORMANCE_STABILITY_13I);
  return lock;
}
