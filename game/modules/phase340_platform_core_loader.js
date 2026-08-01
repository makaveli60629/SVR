import {
  BUILD,
  VERSION,
  detectPlatform,
  manifestFor,
  deferredManifestFor,
  validateManifest
} from './phase340_platform_manifest.js';

const state = {
  build: BUILD,
  active: false,
  platform: null,
  modules: [],
  deferredModules: [],
  loaded: [],
  failed: [],
  timings: [],
  deferredLoaded: [],
  deferredFailed: [],
  deferredTimings: [],
  prewarm: null,
  startedAt: null,
  startedPerf: null,
  readyAt: null,
  deferredReadyAt: null,
  totalMs: null,
  deferredTotalMs: null
};

const CRITICAL = new Set([
  'main.js',
  'modules/phase355_android_poker_boot_order_lock.js',
  'modules/phase356_quest_runtime_boot_lock.js',
  'modules/phase356_quest_poker_boot_order_lock.js',
  'modules/phase336_authoritative_poker_rules_pot_settlement_lock.js',
  'modules/phase356_quest_full_game_acceptance_smoothness_lock.js'
]);

function status(message) {
  const element = document.getElementById('safeStatus') || document.getElementById('status');
  if (element) element.textContent = message;
  state.lastMessage = message;
}

function moduleUrl(path) {
  const url = new URL(path, document.baseURI);
  url.searchParams.set('v', VERSION);
  return url.href;
}

function release(reason) {
  if (state.readyAt) return;
  document.body.classList.add(
    'boot-released', 'runtime-visible', 'overlay-released', 'ready',
    `svr-platform-${state.platform}`, 'svr-phase340', 'svr-phase356'
  );
  document.getElementById('safeStage')?.remove();
  window.__SVR_GAME_READY__ = true;
  window.SVR_GAME_READY = true;
  window.SVR_PLATFORM_READY = true;
  state.readyAt = new Date().toISOString();
  state.releaseReason = reason;
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function safeWalk(root, visitor, limit = 14000) {
  if (typeof window.SVR_PHASE356_SAFE_WALK === 'function') return window.SVR_PHASE356_SAFE_WALK(root, visitor, limit);
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

async function waitForRuntime(timeoutMs = 6500) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (window.__SVR_RENDERER__ && window.__SVR_SCENE__ && window.__SVR_CAMERA__) return true;
    await wait(50);
  }
  return false;
}

function sanitizeSceneMaterials(scene) {
  let invalid = 0;
  safeWalk(scene, (object) => {
    if (!object?.isMesh) return;
    if (Array.isArray(object.material)) {
      const valid = object.material.filter((material) => material?.isMaterial === true);
      if (valid.length !== object.material.length) {
        invalid += object.material.length - valid.length;
        if (valid.length) object.material = valid;
        else object.visible = false;
      }
    } else if (!object.material?.isMaterial) {
      invalid += 1;
      object.visible = false;
    }
    object.castShadow = false;
    object.receiveShadow = false;
  });
  return invalid;
}

async function prewarmRuntime() {
  const timeout = state.platform === 'camera3' ? 3600 : state.platform === 'quest' ? 6500 : 5500;
  const available = await waitForRuntime(timeout);
  if (!available) return { available: false, compiled: false, textures: 0, invalidMaterials: 0 };

  const renderer = window.__SVR_RENDERER__;
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  window.SVR_PHASE355_GOVERN?.();
  window.SVR_PHASE356_BOOT_GOVERN?.();
  window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.(state.platform);
  if (state.platform === 'quest') {
    try { renderer.setPixelRatio(Math.min(Number(devicePixelRatio || 1), 1.25)); } catch {}
    try { renderer.shadowMap.enabled = false; } catch {}
    try { renderer.xr.enabled = true; } catch {}
  }
  const invalidMaterials = sanitizeSceneMaterials(scene);
  let textures = 0;
  const textureLimit = state.platform === 'android' ? 28 : state.platform === 'quest' ? 44 : 64;

  safeWalk(scene, (object) => {
    if (!object?.material || textures >= textureLimit) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials.filter((entry) => entry?.isMaterial)) {
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'alphaMap']) {
        const texture = material?.[key];
        if (texture && textures < textureLimit) {
          try {
            renderer.initTexture?.(texture);
            textures += 1;
          } catch {}
        }
      }
    }
  });

  let compiled = false;
  let method = 'none';
  try {
    if (typeof renderer.compileAsync === 'function') {
      method = 'compileAsync';
      const compileBudget = state.platform === 'android' ? 900 : state.platform === 'quest' ? 1200 : 1800;
      await Promise.race([renderer.compileAsync(scene, camera), wait(compileBudget)]);
      compiled = true;
    } else if (typeof renderer.compile === 'function') {
      method = 'compile';
      renderer.compile(scene, camera);
      compiled = true;
    }
  } catch (error) {
    state.prewarmError = String(error?.message || error);
  }

  return { available: true, compiled, method, textures, invalidMaterials };
}

async function importList(paths, deferred = false) {
  const loaded = deferred ? state.deferredLoaded : state.loaded;
  const failed = deferred ? state.deferredFailed : state.failed;
  const timings = deferred ? state.deferredTimings : state.timings;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    const started = performance.now();
    if (!deferred) status(`Loading ${state.platform} table ${index + 1} / ${paths.length}`);
    try {
      await import(moduleUrl(path));
      const ms = +(performance.now() - started).toFixed(1);
      loaded.push(path);
      timings.push({ path, ms, ok: true });
    } catch (error) {
      const ms = +(performance.now() - started).toFixed(1);
      const failure = { path, ms, error: String(error?.stack || error?.message || error) };
      failed.push(failure);
      timings.push({ ...failure, ok: false });
      if (!deferred && CRITICAL.has(path)) {
        state.fatal = failure;
        status(`Critical module failed: ${path}`);
        release('critical-module-recovery');
        throw error;
      }
    }
    if (deferred) {
      window.SVR_PHASE355_GOVERN?.();
      window.SVR_PHASE356_BOOT_GOVERN?.();
      await wait(state.platform === 'quest' ? 80 : 40);
    }
  }
}

function auditSnapshot() {
  return {
    build: BUILD,
    platform: state.platform,
    manifest: validateManifest(state.platform),
    loaded: state.loaded.slice(),
    failed: state.failed.slice(),
    timings: state.timings.slice(),
    deferredLoaded: state.deferredLoaded.slice(),
    deferredFailed: state.deferredFailed.slice(),
    deferredTimings: state.deferredTimings.slice(),
    totalMs: state.totalMs,
    deferredTotalMs: state.deferredTotalMs,
    prewarm: state.prewarm,
    authority: window.SVR_PHASE340_AUTHORITY_AUDIT?.() || state.audit,
    phase355: window.SVR_PHASE355_QA?.() || null,
    phase356: window.SVR_PHASE356_QA?.() || null,
    renderer: window.__SVR_RENDERER__?.info ? {
      calls: window.__SVR_RENDERER__.info.render?.calls || 0,
      triangles: window.__SVR_RENDERER__.info.render?.triangles || 0,
      geometries: window.__SVR_RENDERER__.info.memory?.geometries || 0,
      textures: window.__SVR_RENDERER__.info.memory?.textures || 0
    } : null,
    readyAt: state.readyAt,
    deferredReadyAt: state.deferredReadyAt,
    checkedAt: new Date().toISOString()
  };
}

function scheduleDeferred() {
  if (!state.deferredModules.length || state.deferredScheduled) return;
  state.deferredScheduled = true;
  const run = async () => {
    const started = performance.now();
    await importList(state.deferredModules, true);
    window.SVR_PHASE355_GOVERN?.();
    window.SVR_PHASE356_BOOT_GOVERN?.();
    window.SVR_PHASE340_GOVERN?.();
    state.deferredTotalMs = +(performance.now() - started).toFixed(1);
    state.deferredReadyAt = new Date().toISOString();
    window.SVR_PHASE340_PLATFORM_STATE = state;
    window.dispatchEvent(new CustomEvent('svr:platform-deferred-ready', { detail: auditSnapshot() }));
  };
  const execute = () => run().catch((error) => {
    state.deferredFatal = String(error?.stack || error?.message || error);
  });
  const acceptanceMode = state.platform === 'quest' && new URLSearchParams(location.search).get('acceptance') === '1';
  if (acceptanceMode) {
    window.addEventListener('svr:phase356-acceptance', () => setTimeout(execute, 1000), { once: true });
    return;
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(execute, { timeout: state.platform === 'quest' ? 6500 : 5000 });
  } else {
    setTimeout(execute, state.platform === 'quest' ? 3600 : 2600);
  }
}

export async function bootPlatform(options = {}) {
  if (state.active) return state;
  state.active = true;
  state.startedAt = new Date().toISOString();
  state.startedPerf = performance.now();
  state.platform = options.platform || options.forcedPlatform || detectPlatform();
  window.SVR_PLATFORM = state.platform;
  document.body.dataset.platform = state.platform;
  document.body.dataset.build = BUILD;

  const manifestAudit = validateManifest(state.platform);
  if (!manifestAudit.pass) throw new Error(`Invalid ${state.platform} manifest: ${JSON.stringify(manifestAudit)}`);
  state.modules = manifestFor(state.platform);
  state.deferredModules = deferredManifestFor(state.platform);
  window.SVR_PHASE340_MANIFEST = manifestAudit;

  await importList(state.modules, false);
  status('Finishing table, cards, and shaders…');
  state.prewarm = await prewarmRuntime();
  window.SVR_PHASE355_GOVERN?.();
  window.SVR_PHASE356_BOOT_GOVERN?.();
  window.SVR_PHASE340_GOVERN?.();
  state.audit = window.SVR_PHASE340_AUTHORITY_AUDIT?.() || null;
  state.totalMs = +(performance.now() - state.startedPerf).toFixed(1);
  window.SVR_PHASE340_PLATFORM_STATE = state;
  window.SVR_PHASE340_AUDIT = auditSnapshot;

  release(`phase356-${state.platform}-critical-ready`);
  status(`${state.platform} ready`);
  window.dispatchEvent(new CustomEvent('svr:platform-ready', { detail: auditSnapshot() }));
  scheduleDeferred();
  return state;
}

window.SVR_BOOT_PLATFORM = bootPlatform;
