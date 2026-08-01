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
  'modules/phase336_authoritative_poker_rules_pot_settlement_lock.js'
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
    `svr-platform-${state.platform}`, 'svr-phase340', 'svr-phase355'
  );
  document.getElementById('safeStage')?.remove();
  window.__SVR_GAME_READY__ = true;
  window.SVR_GAME_READY = true;
  window.SVR_PLATFORM_READY = true;
  state.readyAt = new Date().toISOString();
  state.releaseReason = reason;
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForRuntime(timeoutMs = 5500) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (window.__SVR_RENDERER__ && window.__SVR_SCENE__ && window.__SVR_CAMERA__) return true;
    await wait(50);
  }
  return false;
}

function sanitizeSceneMaterials(scene) {
  let invalid = 0;
  try {
    scene.traverse((object) => {
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
  } catch {}
  return invalid;
}

async function prewarmRuntime() {
  const available = await waitForRuntime(state.platform === 'camera3' ? 3600 : 5500);
  if (!available) return { available: false, compiled: false, textures: 0, invalidMaterials: 0 };

  const renderer = window.__SVR_RENDERER__;
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  window.SVR_PHASE355_GOVERN?.();
  window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.(state.platform);
  const invalidMaterials = sanitizeSceneMaterials(scene);
  let textures = 0;
  const textureLimit = state.platform === 'android' ? 28 : 64;

  try {
    scene.traverse((object) => {
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
  } catch {}

  let compiled = false;
  let method = 'none';
  try {
    if (typeof renderer.compileAsync === 'function') {
      method = 'compileAsync';
      await Promise.race([
        renderer.compileAsync(scene, camera),
        wait(state.platform === 'android' ? 900 : 1800)
      ]);
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
      await wait(40);
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
    window.SVR_PHASE340_GOVERN?.();
    state.deferredTotalMs = +(performance.now() - started).toFixed(1);
    state.deferredReadyAt = new Date().toISOString();
    window.SVR_PHASE340_PLATFORM_STATE = state;
    window.dispatchEvent(new CustomEvent('svr:platform-deferred-ready', { detail: auditSnapshot() }));
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => run().catch((error) => {
      state.deferredFatal = String(error?.stack || error?.message || error);
    }), { timeout: 5000 });
  } else {
    setTimeout(() => run().catch((error) => {
      state.deferredFatal = String(error?.stack || error?.message || error);
    }), 2600);
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
  window.SVR_PHASE340_GOVERN?.();
  state.audit = window.SVR_PHASE340_AUTHORITY_AUDIT?.() || null;
  state.totalMs = +(performance.now() - state.startedPerf).toFixed(1);
  window.SVR_PHASE340_PLATFORM_STATE = state;
  window.SVR_PHASE340_AUDIT = auditSnapshot;

  release('phase355-android-critical-ready');
  status(`${state.platform} ready`);
  window.dispatchEvent(new CustomEvent('svr:platform-ready', { detail: auditSnapshot() }));
  scheduleDeferred();
  return state;
}

window.SVR_BOOT_PLATFORM = bootPlatform;
