import * as THREE from 'three';

export const BUILD = 'PHASE-358-QUEST-INCREMENTAL-SHADER-COMPILE-LOCK';

const params = new URLSearchParams(location.search);
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || params.get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const INSTANCE_PATCH = Symbol.for('SVR_PHASE358_RENDERER_INSTANCE_PATCH');

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  restored: false,
  rendererTrapInstalled: false,
  rendererInstancesPatched: 0,
  rendererInstancesActivated: 0,
  compileCallsDeferred: 0,
  compileAsyncCallsDeferred: 0,
  materialsInspected: 0,
  materialsReplaced: 0,
  compileRetries: 0,
  sparseCompileDeferrals: 0,
  safeAsyncCompiles: 0,
  renderRetries: 0,
  sparseRenderDeferrals: 0,
  installedAt: null,
  restoredAt: null
};

const prototype = THREE.WebGLRenderer?.prototype;
const rendererRecords = new Set();
let prototypeOriginalCompile = null;
let prototypeOriginalCompileAsync = null;
let prototypeOriginalRender = null;
let rendererPoll = 0;

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

function guardedCall(original, renderer, scene, camera, targetScene, type) {
  if (typeof original !== 'function') return renderer;
  sanitizeSceneMaterials(scene);
  try {
    return original.call(renderer, scene, camera, targetScene);
  } catch (error) {
    if (!sparseMaterialError(error)) throw error;
    if (type === 'render') state.renderRetries += 1;
    else state.compileRetries += 1;
    sanitizeSceneMaterials(scene);
    try {
      return original.call(renderer, scene, camera, targetScene);
    } catch (retryError) {
      if (!sparseMaterialError(retryError)) throw retryError;
      if (type === 'render') state.sparseRenderDeferrals += 1;
      else state.sparseCompileDeferrals += 1;
      return renderer;
    }
  }
}

function createRendererRecord(renderer) {
  const record = {
    renderer,
    originalCompile: typeof renderer.compile === 'function' ? renderer.compile : null,
    originalCompileAsync: typeof renderer.compileAsync === 'function' ? renderer.compileAsync : null,
    originalRender: typeof renderer.render === 'function' ? renderer.render : null,
    active: false
  };

  record.deferredCompile = function phase358QuestInstanceDeferredCompile() {
    state.compileCallsDeferred += 1;
    return renderer;
  };

  record.deferredCompileAsync = async function phase358QuestInstanceDeferredCompileAsync() {
    state.compileAsyncCallsDeferred += 1;
    return renderer;
  };

  record.safeCompile = function phase358QuestInstanceSafeCompile(scene, camera, targetScene) {
    return guardedCall(record.originalCompile, renderer, scene, camera, targetScene, 'compile');
  };

  record.safeCompileAsync = async function phase358QuestInstanceSafeCompileAsync(scene, camera, targetScene) {
    // Never call Three.js r160's original compileAsync() on Quest. Its delayed
    // currentProgram.isReady() poll can throw outside the returned Promise.
    state.safeAsyncCompiles += 1;
    record.safeCompile(scene, camera, targetScene);
    return renderer;
  };

  record.safeRender = function phase358QuestInstanceSafeRender(scene, camera) {
    return guardedCall(record.originalRender, renderer, scene, camera, undefined, 'render');
  };

  return record;
}

function activateRendererRecord(record) {
  if (!record || record.active) return record;
  const { renderer } = record;
  renderer.compile = record.safeCompile;
  renderer.compileAsync = record.safeCompileAsync;
  if (record.originalRender) renderer.render = record.safeRender;
  record.active = true;
  state.rendererInstancesActivated += 1;
  return record;
}

function patchRendererInstance(renderer) {
  if (!ACTIVE || !renderer || typeof renderer !== 'object') return null;
  if (renderer[INSTANCE_PATCH]) {
    const existing = renderer[INSTANCE_PATCH];
    if (state.restored) activateRendererRecord(existing);
    return existing;
  }

  const record = createRendererRecord(renderer);
  try {
    Object.defineProperty(renderer, INSTANCE_PATCH, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: record
    });
  } catch {
    renderer[INSTANCE_PATCH] = record;
  }
  rendererRecords.add(record);
  state.rendererInstancesPatched += 1;

  if (state.restored) activateRendererRecord(record);
  else {
    renderer.compile = record.deferredCompile;
    renderer.compileAsync = record.deferredCompileAsync;
    if (record.originalRender) renderer.render = record.safeRender;
  }
  return record;
}

function installRendererAssignmentTrap() {
  if (!ACTIVE || state.rendererTrapInstalled) return false;
  const descriptor = Object.getOwnPropertyDescriptor(window, '__SVR_RENDERER__');
  let currentValue = descriptor && 'value' in descriptor
    ? descriptor.value
    : window.__SVR_RENDERER__;

  if (!descriptor || descriptor.configurable) {
    try {
      Object.defineProperty(window, '__SVR_RENDERER__', {
        configurable: true,
        enumerable: true,
        get() { return currentValue; },
        set(value) {
          currentValue = value;
          patchRendererInstance(value);
        }
      });
      state.rendererTrapInstalled = true;
    } catch {}
  }

  patchRendererInstance(currentValue);
  return state.rendererTrapInstalled;
}

function safeCompile(scene, camera, targetScene) {
  return guardedCall(prototypeOriginalCompile, this, scene, camera, targetScene, 'compile');
}

async function safeCompileAsync(scene, camera, targetScene) {
  state.safeAsyncCompiles += 1;
  safeCompile.call(this, scene, camera, targetScene);
  return this;
}

function safeRender(scene, camera) {
  return guardedCall(prototypeOriginalRender, this, scene, camera, undefined, 'render');
}

function install() {
  if (!ACTIVE || state.installed) return state;
  state.installed = true;
  state.installedAt = new Date().toISOString();

  if (prototype) {
    prototypeOriginalCompile = prototype.compile;
    prototypeOriginalCompileAsync = prototype.compileAsync;
    prototypeOriginalRender = prototype.render;

    prototype.compile = function phase358QuestDeferredCompile() {
      state.compileCallsDeferred += 1;
      return this;
    };

    prototype.compileAsync = async function phase358QuestDeferredCompileAsync() {
      state.compileAsyncCallsDeferred += 1;
      return this;
    };

    if (typeof prototypeOriginalRender === 'function') prototype.render = safeRender;
  }

  installRendererAssignmentTrap();
  rendererPoll = window.setInterval(() => {
    patchRendererInstance(window.__SVR_RENDERER__);
  }, 16);

  window.SVR_PHASE358_PATCH_RENDERER_INSTANCE = patchRendererInstance;
  window.SVR_PHASE358_SANITIZE_SCENE_MATERIALS = sanitizeSceneMaterials;
  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function restore() {
  if (!state.installed || state.restored) return state;
  state.restored = true;
  state.restoredAt = new Date().toISOString();

  const scene = window.__SVR_SCENE__;
  sanitizeSceneMaterials(scene);

  if (prototype) {
    if (typeof prototypeOriginalCompile === 'function') prototype.compile = safeCompile;
    prototype.compileAsync = safeCompileAsync;
    if (typeof prototypeOriginalRender === 'function') prototype.render = safeRender;
  }

  patchRendererInstance(window.__SVR_RENDERER__);
  for (const record of rendererRecords) activateRendererRecord(record);
  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function qa() {
  const liveRenderer = window.__SVR_RENDERER__;
  const liveRecord = liveRenderer?.[INSTANCE_PATCH] || null;
  return {
    ...state,
    incrementalDuringCriticalBoot: state.installed,
    originalsRestoredAfterReady: state.restored,
    originalCompileAsyncCaptured: typeof prototypeOriginalCompileAsync === 'function'
      || [...rendererRecords].some((record) => typeof record.originalCompileAsync === 'function'),
    originalCompileAsyncRestored: false,
    rendererInstancePublished: Boolean(liveRenderer),
    rendererInstancePatched: Boolean(liveRecord),
    rendererInstanceActive: Boolean(liveRecord?.active),
    sparseMaterialGuard: typeof window.SVR_PHASE358_SANITIZE_SCENE_MATERIALS === 'function',
    sparseCompileDeferralAvailable: true,
    sparseRenderDeferralAvailable: true,
    safeAsyncCompileAvailable: true,
    pass: !ACTIVE || (state.installed && (!liveRenderer || Boolean(liveRecord)))
  };
}

if (ACTIVE) {
  install();
  window.addEventListener('svr:platform-ready', () => setTimeout(restore, 0), { once: true });
  setTimeout(() => {
    if (window.SVR_PLATFORM_READY === true) restore();
  }, 15000);
  window.addEventListener('beforeunload', () => {
    if (rendererPoll) clearInterval(rendererPoll);
  }, { once: true });
}

window.SVR_PHASE358_QUEST_SHADER_QA = qa;
window.SVR_PHASE358_QUEST_SHADER_RESTORE = restore;
