import { BUILD, VERSION, detectPlatform, manifestFor, validateManifest } from './phase340_platform_manifest.js';

const state = {
  build: BUILD,
  active: false,
  platform: null,
  modules: [],
  loaded: [],
  failed: [],
  timings: [],
  prewarm: null,
  startedAt: null,
  startedPerf: null,
  readyAt: null
};

const CRITICAL = new Set([
  'main.js',
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
  document.body.classList.add('boot-released','runtime-visible','overlay-released','ready',`svr-platform-${state.platform}`,'svr-phase340');
  document.getElementById('safeStage')?.remove();
  window.__SVR_GAME_READY__ = true;
  window.SVR_GAME_READY = true;
  state.readyAt = new Date().toISOString();
  state.releaseReason = reason;
}
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitForRuntime(timeoutMs = 5500) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (window.__SVR_RENDERER__ && window.__SVR_SCENE__ && window.__SVR_CAMERA__) return true;
    await wait(60);
  }
  return false;
}

async function prewarmRuntime() {
  const available = await waitForRuntime(state.platform === 'camera3' ? 3600 : 5500);
  if (!available) return { available: false, compiled: false, textures: 0 };
  const renderer = window.__SVR_RENDERER__, scene = window.__SVR_SCENE__, camera = window.__SVR_CAMERA__;
  window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.(state.platform);
  let textures = 0;
  try {
    scene.traverse((object) => {
      if (!object?.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','alphaMap']) {
          const texture = material?.[key];
          if (texture && textures < 64) {
            try { renderer.initTexture?.(texture); textures += 1; } catch {}
          }
        }
      }
    });
  } catch {}
  let compiled = false, method = 'none';
  try {
    if (typeof renderer.compileAsync === 'function') {
      method = 'compileAsync';
      await Promise.race([renderer.compileAsync(scene, camera), wait(1800)]);
      compiled = true;
    } else if (typeof renderer.compile === 'function') {
      method = 'compile';
      renderer.compile(scene, camera);
      compiled = true;
    }
  } catch (error) {
    state.prewarmError = String(error?.message || error);
  }
  return { available: true, compiled, method, textures };
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
  window.SVR_PHASE340_MANIFEST = manifestAudit;

  for (let index = 0; index < state.modules.length; index += 1) {
    const path = state.modules[index];
    const started = performance.now();
    status(`Loading ${state.platform} core ${index + 1} / ${state.modules.length}`);
    try {
      await import(moduleUrl(path));
      const ms = +(performance.now() - started).toFixed(1);
      state.loaded.push(path);
      state.timings.push({ path, ms, ok: true });
    } catch (error) {
      const ms = +(performance.now() - started).toFixed(1);
      const failure = { path, ms, error: String(error?.message || error) };
      state.failed.push(failure);
      state.timings.push({ ...failure, ok: false });
      if (CRITICAL.has(path)) {
        state.fatal = failure;
        status(`Critical module failed: ${path}`);
        release('critical-module-recovery');
        throw error;
      }
    }
  }

  status('Prewarming table, cards, chips, and shaders…');
  state.prewarm = await prewarmRuntime();
  window.SVR_PHASE340_GOVERN?.();
  const audit = window.SVR_PHASE340_AUTHORITY_AUDIT?.() || null;
  state.audit = audit;
  state.totalMs = +(performance.now() - state.startedPerf).toFixed(1);
  window.SVR_PHASE340_PLATFORM_STATE = state;
  window.SVR_PHASE340_AUDIT = () => ({
    build: BUILD,
    platform: state.platform,
    manifest: validateManifest(state.platform),
    loaded: state.loaded.slice(),
    failed: state.failed.slice(),
    timings: state.timings.slice(),
    prewarm: state.prewarm,
    authority: window.SVR_PHASE340_AUTHORITY_AUDIT?.() || state.audit,
    renderer: window.__SVR_RENDERER__?.info ? {
      calls: window.__SVR_RENDERER__.info.render?.calls || 0,
      triangles: window.__SVR_RENDERER__.info.render?.triangles || 0,
      geometries: window.__SVR_RENDERER__.info.memory?.geometries || 0,
      textures: window.__SVR_RENDERER__.info.memory?.textures || 0
    } : null,
    checkedAt: new Date().toISOString()
  });
  release('phase340-platform-ready');
  status(`${state.platform} ready`);
  window.dispatchEvent(new CustomEvent('svr:platform-ready', { detail: window.SVR_PHASE340_AUDIT() }));
  return state;
}

window.SVR_BOOT_PLATFORM = bootPlatform;
