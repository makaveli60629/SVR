import * as THREE from 'three';

export const BUILD = 'PHASE-362-DESKTOP-RENDERER-PREBOOT-SAFETY-LOCK';

const params = new URLSearchParams(location.search);
const PLATFORM = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit) return explicit;
  if (/\/android\.html$/i.test(location.pathname)) return 'android';
  if (/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '')) return 'quest';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
})();
const ACTIVE = PLATFORM === 'desktop';
const PATCH = Symbol.for('SVR_PHASE362_DESKTOP_RENDERER_PATCH');

const state = {
  build: BUILD,
  active: ACTIVE,
  trapInstalled: false,
  rendererPatched: false,
  safeAsyncCompiles: 0,
  compileRetries: 0,
  renderRetries: 0,
  framesDeferred: 0,
  materialsReplaced: 0,
  installedAt: null
};

function fallbackMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x241b1d,
    roughness: 0.78,
    metalness: 0.03,
    side: THREE.DoubleSide
  });
}

function safeWalk(root, visitor, limit = 22000) {
  if (!root) return;
  const stack = [root];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    count += 1;
    try { visitor(object); } catch {}
    const children = Array.isArray(object.children) ? object.children : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
}

function sanitizeScene(scene) {
  safeWalk(scene, (object) => {
    if (!object?.isMesh) return;
    const original = object.material;
    const materials = Array.isArray(original) ? original : [original];
    const fixed = materials.map((material) => {
      if (material?.isMaterial) return material;
      state.materialsReplaced += 1;
      return fallbackMaterial();
    });
    if (!fixed.length) fixed.push(fallbackMaterial());
    object.material = Array.isArray(original) ? fixed : fixed[0];
  });
}

function sparseMaterialError(error) {
  return /isReady|checkMaterialsReady|undefined.*material|material.*undefined/i
    .test(String(error?.stack || error?.message || error || ''));
}

function patchRenderer(renderer) {
  if (!ACTIVE || !renderer || renderer[PATCH]) return renderer;
  const originalCompile = typeof renderer.compile === 'function' ? renderer.compile.bind(renderer) : null;
  const originalRender = typeof renderer.render === 'function' ? renderer.render.bind(renderer) : null;

  const safeCompile = (scene, camera, targetScene) => {
    if (!originalCompile) return renderer;
    sanitizeScene(scene);
    try {
      return originalCompile(scene, camera, targetScene);
    } catch (error) {
      if (!sparseMaterialError(error)) throw error;
      state.compileRetries += 1;
      sanitizeScene(scene);
      try {
        return originalCompile(scene, camera, targetScene);
      } catch (retryError) {
        if (!sparseMaterialError(retryError)) throw retryError;
        return renderer;
      }
    }
  };

  const safeCompileAsync = async (scene, camera, targetScene) => {
    // Three r160's compileAsync readiness poll can throw later outside the
    // returned Promise. Use guarded synchronous compilation and preserve the
    // Promise-shaped API for callers.
    state.safeAsyncCompiles += 1;
    safeCompile(scene, camera, targetScene);
    return renderer;
  };

  const safeRender = (scene, camera) => {
    if (!originalRender) return renderer;
    try {
      return originalRender(scene, camera);
    } catch (error) {
      if (!sparseMaterialError(error)) throw error;
      state.renderRetries += 1;
      sanitizeScene(scene);
      try {
        return originalRender(scene, camera);
      } catch (retryError) {
        if (!sparseMaterialError(retryError)) throw retryError;
        state.framesDeferred += 1;
        return renderer;
      }
    }
  };

  Object.defineProperty(renderer, PATCH, {
    configurable: false,
    enumerable: false,
    value: { originalCompile, originalRender }
  });
  renderer.compile = safeCompile;
  renderer.compileAsync = safeCompileAsync;
  if (originalRender) renderer.render = safeRender;
  state.rendererPatched = true;
  window.SVR_PHASE362_DESKTOP_RENDERER_STATE = state;
  return renderer;
}

function installTrap() {
  if (!ACTIVE || state.trapInstalled) return;
  const descriptor = Object.getOwnPropertyDescriptor(window, '__SVR_RENDERER__');
  let current = descriptor && 'value' in descriptor ? descriptor.value : window.__SVR_RENDERER__;
  if (!descriptor || descriptor.configurable) {
    Object.defineProperty(window, '__SVR_RENDERER__', {
      configurable: true,
      enumerable: true,
      get() { return current; },
      set(value) {
        current = value;
        patchRenderer(value);
      }
    });
    state.trapInstalled = true;
  }
  patchRenderer(current);
}

function qa() {
  return {
    ...state,
    rendererPublished: Boolean(window.__SVR_RENDERER__),
    pass: !ACTIVE || (state.trapInstalled && (!window.__SVR_RENDERER__ || state.rendererPatched)),
    checkedAt: new Date().toISOString()
  };
}

if (ACTIVE) {
  state.installedAt = new Date().toISOString();
  installTrap();
}
window.SVR_PHASE362_DESKTOP_RENDERER_QA = qa;
window.SVR_PHASE362_DESKTOP_RENDERER_STATE = state;
