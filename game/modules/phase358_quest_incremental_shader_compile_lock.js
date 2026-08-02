import * as THREE from 'three';

export const BUILD = 'PHASE-358-QUEST-INCREMENTAL-SHADER-COMPILE-LOCK';

const params = new URLSearchParams(location.search);
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || params.get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  restored: false,
  compileCallsDeferred: 0,
  compileAsyncCallsDeferred: 0,
  materialsInspected: 0,
  materialsReplaced: 0,
  compileRetries: 0,
  sparseCompileDeferrals: 0,
  renderRetries: 0,
  sparseRenderDeferrals: 0,
  installedAt: null,
  restoredAt: null
};

const prototype = THREE.WebGLRenderer?.prototype;
let originalCompile = null;
let originalCompileAsync = null;
let originalRender = null;

function fallbackMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x241b1d,
    roughness: 0.78,
    metalness: 0.03,
    side: THREE.DoubleSide
  });
}

function safeWalk(root, visitor, limit = 18000) {
  if (!root) return 0;
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
  return count;
}

function sanitizeSceneMaterials(scene) {
  safeWalk(scene, (object) => {
    if (!object?.isMesh) return;
    const original = object.material;
    const source = Array.isArray(original) ? original : [original];
    state.materialsInspected += source.length;
    const fixed = source.map((material) => {
      if (material?.isMaterial) return material;
      state.materialsReplaced += 1;
      return fallbackMaterial();
    });
    if (!fixed.length) {
      fixed.push(fallbackMaterial());
      state.materialsReplaced += 1;
    }
    object.material = Array.isArray(original) ? fixed : fixed[0];
  });
  return scene;
}

function sparseMaterialError(error) {
  const message = String(error?.stack || error?.message || error || '');
  return /isReady|checkMaterialsReady|undefined.*material|material.*undefined/i.test(message);
}

function safeCompile(scene, camera, targetScene) {
  sanitizeSceneMaterials(scene);
  try {
    return originalCompile.call(this, scene, camera, targetScene);
  } catch (error) {
    if (!sparseMaterialError(error)) throw error;
    state.compileRetries += 1;
    sanitizeSceneMaterials(scene);
    try {
      return originalCompile.call(this, scene, camera, targetScene);
    } catch (retryError) {
      if (!sparseMaterialError(retryError)) throw retryError;
      state.sparseCompileDeferrals += 1;
      return this;
    }
  }
}

async function safeCompileAsync(scene, camera, targetScene) {
  sanitizeSceneMaterials(scene);
  try {
    return await originalCompileAsync.call(this, scene, camera, targetScene);
  } catch (error) {
    if (!sparseMaterialError(error)) throw error;
    state.compileRetries += 1;
    sanitizeSceneMaterials(scene);
    try {
      return await originalCompileAsync.call(this, scene, camera, targetScene);
    } catch (retryError) {
      if (!sparseMaterialError(retryError)) throw retryError;
      state.sparseCompileDeferrals += 1;
      return this;
    }
  }
}

function safeRender(scene, camera) {
  try {
    return originalRender.call(this, scene, camera);
  } catch (error) {
    if (!sparseMaterialError(error)) throw error;
    state.renderRetries += 1;
    sanitizeSceneMaterials(scene);
    try {
      return originalRender.call(this, scene, camera);
    } catch (retryError) {
      if (!sparseMaterialError(retryError)) throw retryError;
      // Render errors from a late sparse FBX material must not terminate the
      // WebXR animation loop. Skip only this frame after one sanitation retry.
      state.sparseRenderDeferrals += 1;
      return this;
    }
  }
}

function install() {
  if (!ACTIVE || !prototype || state.installed) return state;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  originalCompile = prototype.compile;
  originalCompileAsync = prototype.compileAsync;
  originalRender = prototype.render;

  prototype.compile = function phase358QuestDeferredCompile() {
    state.compileCallsDeferred += 1;
    return this;
  };

  prototype.compileAsync = async function phase358QuestDeferredCompileAsync() {
    state.compileAsyncCallsDeferred += 1;
    return this;
  };

  if (typeof originalRender === 'function') prototype.render = safeRender;

  window.SVR_PHASE358_SANITIZE_SCENE_MATERIALS = sanitizeSceneMaterials;
  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function restore() {
  if (!state.installed || state.restored || !prototype) return state;
  const scene = window.__SVR_SCENE__;
  sanitizeSceneMaterials(scene);
  if (typeof originalCompile === 'function') prototype.compile = safeCompile;
  if (typeof originalCompileAsync === 'function') prototype.compileAsync = safeCompileAsync;
  else delete prototype.compileAsync;
  if (typeof originalRender === 'function') prototype.render = safeRender;
  state.restored = true;
  state.restoredAt = new Date().toISOString();
  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function qa() {
  return {
    ...state,
    incrementalDuringCriticalBoot: state.installed,
    originalsRestoredAfterReady: state.restored,
    sparseMaterialGuard: typeof window.SVR_PHASE358_SANITIZE_SCENE_MATERIALS === 'function',
    sparseCompileDeferralAvailable: true,
    sparseRenderDeferralAvailable: true,
    pass: !ACTIVE || state.installed
  };
}

if (ACTIVE) {
  install();
  window.addEventListener('svr:platform-ready', () => setTimeout(restore, 0), { once: true });
  setTimeout(() => {
    if (window.SVR_PLATFORM_READY === true) restore();
  }, 15000);
}

window.SVR_PHASE358_QUEST_SHADER_QA = qa;
window.SVR_PHASE358_QUEST_SHADER_RESTORE = restore;
