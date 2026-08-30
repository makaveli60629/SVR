const BUILD = 'PHASE-423-CLOUD-UNITY-BRIDGE';
const startedAt = performance.now();

const state = {
  build: BUILD,
  platform: null,
  capabilities: null,
  rendererBudgetDelegated: false,
  fallbackPixelRatio: null,
  sceneSnapshot: null,
  initializedAt: null,
  lastReason: null
};

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const params = new URLSearchParams(location.search);
  if (params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
  if (params.get('platform') === 'android' || (/Android/i.test(ua) && !/Quest|Oculus|Meta Quest/i.test(ua))) return 'android';
  return window.SVR_PLATFORM || 'desktop';
}

function detectCapabilities() {
  return {
    webXR: !!navigator.xr,
    webGPU: !!navigator.gpu,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemoryGB: navigator.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    pixelRatio: window.devicePixelRatio || 1,
    secureContext: window.isSecureContext,
    visibilityState: document.visibilityState
  };
}

function fallbackRendererBudget(platform) {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer?.setPixelRatio || !renderer?.getPixelRatio) return null;

  // Existing SVR platform governors remain authoritative. This fallback only
  // runs when an older runtime does not expose its own renderer budget hook.
  if (typeof window.SVR_PHASE340_APPLY_RENDERER_BUDGET === 'function') {
    window.SVR_PHASE340_APPLY_RENDERER_BUDGET(platform);
    state.rendererBudgetDelegated = true;
    return renderer.getPixelRatio?.() || null;
  }

  const requested = new URLSearchParams(location.search).get('quality');
  let cap = platform === 'quest' ? 1.35 : platform === 'android' ? 1.25 : 2;
  if (requested === 'performance') cap = Math.min(cap, 1);
  if (requested === 'high' && platform === 'desktop') cap = 2;

  const current = renderer.getPixelRatio();
  const target = Math.min(current || window.devicePixelRatio || 1, cap);
  if (Number.isFinite(target) && target > 0 && target < current) renderer.setPixelRatio(target);
  state.fallbackPixelRatio = renderer.getPixelRatio?.() || target;
  return state.fallbackPixelRatio;
}

function round(value, digits = 4) {
  return typeof value === 'number' && Number.isFinite(value) ? +value.toFixed(digits) : value;
}

function serializeTransform(object) {
  return {
    position: [round(object.position?.x), round(object.position?.y), round(object.position?.z)],
    rotation: [round(object.rotation?.x), round(object.rotation?.y), round(object.rotation?.z)],
    scale: [round(object.scale?.x), round(object.scale?.y), round(object.scale?.z)]
  };
}

function snapshotScene(limit = 2500) {
  const scene = window.__SVR_SCENE__;
  if (!scene?.traverse) return null;
  const objects = [];
  scene.traverse((object) => {
    if (objects.length >= limit) return;
    const material = object.material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    objects.push({
      name: object.name || '',
      type: object.type || object.constructor?.name || 'Object3D',
      visible: object.visible !== false,
      transform: serializeTransform(object),
      geometry: object.geometry ? {
        name: object.geometry.name || '',
        type: object.geometry.type || '',
        vertexCount: object.geometry.attributes?.position?.count || null
      } : null,
      materials: materials.map((entry) => ({
        name: entry?.name || '',
        type: entry?.type || '',
        transparent: !!entry?.transparent
      })),
      tags: object.userData && typeof object.userData === 'object'
        ? Object.keys(object.userData).slice(0, 20)
        : []
    });
  });
  return {
    schema: 'SVR_SCENE_SNAPSHOT_V1',
    build: BUILD,
    platform: state.platform,
    units: 'meters',
    sourceCoordinates: 'Three.js Y-up',
    objectCount: objects.length,
    truncated: objects.length >= limit,
    objects,
    capturedAt: new Date().toISOString()
  };
}

function exportSnapshot() {
  const snapshot = snapshotScene();
  if (!snapshot) return null;
  state.sceneSnapshot = snapshot;
  return JSON.stringify(snapshot, null, 2);
}

function apply(reason = 'manual') {
  state.platform = detectPlatform();
  state.capabilities = detectCapabilities();
  state.lastReason = reason;
  fallbackRendererBudget(state.platform);
  if (!state.sceneSnapshot && window.__SVR_SCENE__) state.sceneSnapshot = snapshotScene(500);
  if (!state.initializedAt) state.initializedAt = new Date().toISOString();
  document.body?.classList.add('svr-phase423-cloud-bridge');
  window.dispatchEvent(new CustomEvent('svr:phase423-ready', { detail: qa() }));
  return qa();
}

function qa() {
  const renderer = window.__SVR_RENDERER__;
  return {
    ...state,
    runtimeMs: round(performance.now() - startedAt, 1),
    renderer: renderer?.info ? {
      pixelRatio: renderer.getPixelRatio?.() || null,
      calls: renderer.info.render?.calls || 0,
      triangles: renderer.info.render?.triangles || 0,
      geometries: renderer.info.memory?.geometries || 0,
      textures: renderer.info.memory?.textures || 0
    } : null,
    snapshotObjectCount: state.sceneSnapshot?.objectCount || 0,
    checkedAt: new Date().toISOString()
  };
}

window.SVR_PHASE423_SWEEP = apply;
window.SVR_PHASE423_QA = qa;
window.SVR_EXPORT_UNITY_BRIDGE = exportSnapshot;

window.addEventListener('svr:platform-ready', () => apply('platform-ready'), { once: true });
window.addEventListener('svr:phase396-core-ready', () => apply('core-ready'), { once: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => apply('dom-ready'), 250), { once: true });
} else {
  setTimeout(() => apply('module-load'), 250);
}

export { BUILD, apply as runCloudUnityBridge, qa as getCloudUnityBridgeQA, exportSnapshot as exportUnityBridgeSnapshot };
