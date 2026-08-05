export const BUILD = 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
const ACTIVE = platform === 'quest'
  || platform === 'android'
  || /Quest|Oculus|Meta Quest|Android/i.test(ua)
  || /android-lobby\.html$/i.test(location.pathname);

const state = {
  build: BUILD,
  active: ACTIVE,
  ticks: 0,
  reattachments: 0,
  visibleRepairs: 0,
  fallbackRemovals: 0,
  authorityRepairs: 0,
  originalName: null,
  originalParent: null,
  visibleMeshes: 0,
  fallbackPresent: false,
  pass: false,
  lastReason: null,
  lastError: null,
  checkedAt: null
};

let timer = null;
let observer = null;

function scene() {
  return window.__SVR_SCENE__ || window.SVR_SCENE || window.scene || null;
}

function worldRoot() {
  const root = scene();
  return root?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || root;
}

function originalTable() {
  const direct = window.SVR_PHASE380_ORIGINAL_TABLE;
  if (direct?.isObject3D) return direct;
  return scene()?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY') || null;
}

function visit(root, callback, limit = 24000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { callback(object); } catch {}
    for (const child of object.children || []) if (child && child !== object) stack.push(child);
  }
  return seen.size;
}

function forceVisible(table) {
  let visibleMeshes = 0;
  let repaired = 0;
  let cursor = table;
  while (cursor) {
    if (cursor.visible === false) repaired += 1;
    cursor.visible = true;
    cursor = cursor.parent;
  }
  visit(table, (object) => {
    if (object.visible === false) repaired += 1;
    object.visible = true;
    if (!object.isMesh) return;
    visibleMeshes += 1;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      material.visible = true;
      material.opacity = 1;
      material.transparent = false;
      material.colorWrite = true;
      material.depthWrite = true;
      material.depthTest = true;
      if (material.map) material.map.needsUpdate = true;
      material.needsUpdate = true;
    }
  });
  state.visibleMeshes = visibleMeshes;
  state.visibleRepairs += repaired;
  return visibleMeshes > 0;
}

function removeEmergencyFallback(table) {
  const root = scene();
  if (!root || !table?.parent) return 0;
  const remove = [];
  visit(root, (object) => {
    if (object === table) return;
    if (String(object.name || '') === 'PHASE379_PROCEDURAL_TABLE_AUTHORITY'
      || String(object.name || '') === 'PHASE358_QUEST_TABLE_FALLBACK') remove.push(object);
  });
  for (const object of remove) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.fallbackRemovals += remove.length;
  return remove.length;
}

function inspectFallback() {
  let present = false;
  visit(scene(), (object) => {
    if (String(object.name || '') === 'PHASE379_PROCEDURAL_TABLE_AUTHORITY'
      || String(object.name || '') === 'PHASE358_QUEST_TABLE_FALLBACK') present = true;
  });
  state.fallbackPresent = present;
  return present;
}

function tick(reason = 'watchdog') {
  if (!ACTIVE) return qa();
  state.ticks += 1;
  state.lastReason = reason;
  try {
    window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.(`phase381-${reason}`);
    const table = originalTable();
    const root = worldRoot();
    if (table?.isObject3D && !table.parent && root?.isObject3D) {
      root.add(table);
      state.reattachments += 1;
    }
    if (table?.isObject3D) {
      state.originalName = table.name || null;
      state.originalParent = table.parent?.name || table.parent?.type || null;
      forceVisible(table);
      if (window.SVR_TABLE_AUTHORITY !== table) {
        try { window.SVR_TABLE_AUTHORITY = table; } catch {}
        state.authorityRepairs += 1;
      }
      removeEmergencyFallback(table);
    } else {
      window.SVR_PHASE379_FORCE_TABLE?.(`phase381-${reason}-missing-original`);
    }
    inspectFallback();
    state.lastError = null;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
  }
  state.checkedAt = new Date().toISOString();
  state.pass = Boolean(
    originalTable()?.parent
    && window.SVR_TABLE_AUTHORITY === originalTable()
    && state.visibleMeshes > 0
    && !state.fallbackPresent
    && !state.lastError
  );
  window.SVR_PHASE381_TABLE_WATCHDOG_STATE = { ...state };
  return { ...state };
}

function qa() {
  const table = originalTable();
  inspectFallback();
  return {
    ...state,
    active: ACTIVE,
    originalPresent: Boolean(table?.isObject3D),
    originalAttached: Boolean(table?.parent),
    originalVisible: Boolean(table?.visible),
    authorityIsOriginal: Boolean(table && window.SVR_TABLE_AUTHORITY === table),
    fallbackPresent: state.fallbackPresent,
    pass: Boolean(table?.parent && table.visible && state.visibleMeshes > 0 && window.SVR_TABLE_AUTHORITY === table && !state.fallbackPresent && !state.lastError),
    checkedAt: new Date().toISOString()
  };
}

function start() {
  if (!ACTIVE || timer) return;
  tick('start');
  timer = setInterval(() => tick('interval'), 1800);
  if ('MutationObserver' in window) {
    observer = new MutationObserver(() => queueMicrotask(() => tick('dom-mutation')));
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

window.SVR_PHASE381_TABLE_WATCHDOG_TICK = tick;
window.SVR_PHASE381_TABLE_WATCHDOG_QA = qa;
window.addEventListener('svr:phase380-original-table-ready', () => tick('original-ready'));
window.addEventListener('svr:phase380-core-ready', () => tick('core-ready'));
window.addEventListener('svr:phase373-core-ready', () => tick('quest-core-ready'));
window.addEventListener('svr:platform-ready', () => tick('platform-ready'));
window.addEventListener('pageshow', () => tick('pageshow'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick('visible'); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
