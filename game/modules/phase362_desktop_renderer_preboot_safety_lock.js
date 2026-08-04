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
const MIXER_PATCH = Symbol.for('SVR_PHASE362_DESKTOP_ANIMATION_MIXER_PATCH');

const state = {
  build: BUILD,
  active: ACTIVE,
  trapInstalled: false,
  rendererPatched: false,
  animationMixerPatched: false,
  safeAsyncCompiles: 0,
  compileRetries: 0,
  renderRetries: 0,
  framesDeferred: 0,
  materialsReplaced: 0,
  animationUpdateErrors: 0,
  animationMixersDisabled: 0,
  lastAnimationError: null,
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
  return /isReady|checkMaterialsReady|undefined.*material|material.*undefined|Cannot read properties of null \(reading ['"]mesh['"]\)/i
    .test(String(error?.stack || error?.message || error || ''));
}

function animationBindingError(error) {
  return /Cannot read properties of null \(reading ['"]mesh['"]\)|PropertyBinding|AnimationMixer|findNode|No target node found/i
    .test(String(error?.stack || error?.message || error || ''));
}

function patchAnimationMixer() {
  if (!ACTIVE || !THREE.AnimationMixer?.prototype) return;
  const prototype = THREE.AnimationMixer.prototype;
  if (prototype[MIXER_PATCH]) {
    state.animationMixerPatched = true;
    return;
  }
  const originalUpdate = prototype.update;
  if (typeof originalUpdate !== 'function') return;

  Object.defineProperty(prototype, MIXER_PATCH, {
    configurable: false,
    enumerable: false,
    value: { originalUpdate }
  });

  prototype.update = function safePhase362AnimationUpdate(deltaTime) {
    try {
      return originalUpdate.call(this, deltaTime);
    } catch (error) {
      if (!animationBindingError(error)) throw error;
      state.animationUpdateErrors += 1;
      state.lastAnimationError = String(error?.stack || error?.message || error);
      try { this.stopAllAction?.(); } catch {}
      try {
        if (Array.isArray(this._actions)) {
          for (const action of this._actions) {
            if (!action) continue;
            action.enabled = false;
            action.paused = true;
          }
        }
      } catch {}
      try { this.timeScale = 0; } catch {}
      if (!this.__svrPhase362AnimationDisabled) {
        this.__svrPhase362AnimationDisabled = true;
        state.animationMixersDisabled += 1;
      }
      window.SVR_PHASE362_DESKTOP_RENDERER_STATE = state;
      return this;
    }
  };
  state.animationMixerPatched = true;
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
    pass: !ACTIVE || (
      state.trapInstalled
      && state.animationMixerPatched
      && (!window.__SVR_RENDERER__ || state.rendererPatched)
    ),
    checkedAt: new Date().toISOString()
  };
}

if (ACTIVE) {
  state.installedAt = new Date().toISOString();
  patchAnimationMixer();
  installTrap();
}
window.SVR_PHASE362_DESKTOP_RENDERER_QA = qa;
window.SVR_PHASE362_DESKTOP_RENDERER_STATE = state;
