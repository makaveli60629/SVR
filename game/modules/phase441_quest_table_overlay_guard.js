/* PHASE-441-QUEST-TABLE-OVERLAY-GUARD */
export const BUILD = 'PHASE-441-QUEST-TABLE-OVERLAY-GUARD';

let installed = false;
let lastError = null;
let lockedAt = null;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function roundedRectContains(position, line) {
  const x = Number(position?.x || 0) - Number(line?.centerX || 0);
  const z = Number(position?.z || 0) - Number(line?.centerZ || 0);
  const halfW = Math.max(0.001, Number(line?.halfWidth || 0.001));
  const halfD = Math.max(0.001, Number(line?.halfDepth || 0.001));
  const r = Math.max(0.001, Math.min(Number(line?.cornerRadius || 0.001), halfW, halfD));
  const qx = Math.abs(x) - (halfW - r);
  const qz = Math.abs(z) - (halfD - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r <= 0;
}

function lockFalse(object, key = 'visible') {
  if (!object) return false;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (descriptor?.get?.__svrPhase441Locked) return true;
    const getter = () => false;
    getter.__svrPhase441Locked = true;
    Object.defineProperty(object, key, { configurable: true, enumerable: true, get: getter, set: () => {} });
    return true;
  } catch {
    try { object[key] = false; } catch {}
    return false;
  }
}

function installLocks() {
  const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
  const table = runtime?.table;
  const line = window.SVR_PHASE441_QA?.()?.passLine;
  if (!table?.table || !line) return false;

  lockFalse(table.presentationGroup);
  lockFalse(table.brandingGroup);
  lockFalse(table.brandingMesh);
  if (table.brandingMesh?.material) lockFalse(table.brandingMesh.material);
  for (const cover of table.hiddenCoverRecords || []) lockFalse(cover);

  try {
    const lineGetter = () => () => ({ ...line });
    lineGetter.__svrPhase441Locked = true;
    Object.defineProperty(table, 'getBettingLine', { configurable: true, enumerable: true, get: lineGetter, set: () => {} });
  } catch { table.getBettingLine = () => ({ ...line }); }

  if (runtime.interaction) {
    try {
      const actionGetter = () => position => roundedRectContains(position, line);
      actionGetter.__svrPhase441Locked = true;
      Object.defineProperty(runtime.interaction, 'isPastLine', { configurable: true, enumerable: true, get: actionGetter, set: () => {} });
    } catch { runtime.interaction.isPastLine = position => roundedRectContains(position, line); }
  }

  installed = true;
  lockedAt ||= new Date().toISOString();
  window.SVR_PHASE441_OVERLAY_GUARD_STATE = qa();
  return true;
}

function qa() {
  const runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
  const table = runtime?.table;
  return {
    build: BUILD,
    installed,
    floatingBrandingPlaneVisible: Boolean(table?.brandingMesh?.visible),
    brandingGroupVisible: Boolean(table?.brandingGroup?.visible),
    presentationGroupVisible: Boolean(table?.presentationGroup?.visible),
    lockedAt,
    lastError,
    pass: Boolean(installed && table?.brandingMesh?.visible === false && table?.brandingGroup?.visible === false && table?.presentationGroup?.visible === false && !lastError),
    checkedAt: new Date().toISOString()
  };
}

async function install() {
  const started = performance.now();
  while (performance.now() - started < 30000) {
    if (installLocks()) return qa();
    await wait(50);
  }
  lastError = 'PHASE441_OVERLAY_GUARD_TIMEOUT';
  window.SVR_PHASE441_OVERLAY_GUARD_STATE = qa();
  return false;
}

window.SVR_PHASE441_OVERLAY_GUARD_INSTALL = install;
window.SVR_PHASE441_OVERLAY_GUARD_QA = qa;
window.SVR_PHASE441_OVERLAY_GUARD_READY_PROMISE = install();
