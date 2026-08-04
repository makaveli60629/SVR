export const BUILD = 'PHASE-374-PHASE358-ORIGINAL-TABLE-COMPAT-LOCK';

const ORIGINAL_NAME = 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY';
const LEGACY_NAME = 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';
const state = {
  build: BUILD,
  installed: false,
  wrappedRun: false,
  wrappedQa: false,
  patchedReports: 0,
  rejectedReports: 0,
  lastReason: null,
  lastResult: null,
  installedAt: null,
  checkedAt: null
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function originalTableAudit(existing = {}) {
  const authority = window.SVR_TABLE_AUTHORITY;
  const qa = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null;
  const phase358Qa = window.SVR_PHASE358_UPLOADED_TABLE_QA?.() || null;
  const original = authority?.isObject3D && authority.name === ORIGINAL_NAME && qa?.pass === true;
  if (!original) return null;
  return {
    ...existing,
    table: ORIGINAL_NAME,
    tableAuthorityBuild: 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK',
    uploadedTableAuthority: true,
    phase374OriginalTableAuthority: true,
    legacyTableNameAccepted: false,
    fallbackPresent: false,
    originalTableQa: qa,
    uploadedTableQa: phase358Qa,
    pass: Boolean(
      existing.scene !== false
      && existing.logo
      && existing.potDisplay
      && Number(existing.holeMeshes || 0) >= 2
      && Number(existing.communityMeshes || 0) >= 5
    )
  };
}

function recomputeReport(report, reason = 'compat') {
  if (!report || typeof report !== 'object') return report;
  const table = originalTableAudit(report.table || {});
  if (!table) {
    state.rejectedReports += 1;
    state.lastReason = `${reason}:original-table-not-ready`;
    state.lastResult = report;
    return report;
  }
  report.table = table;
  report.pass = Boolean(
    report.runtimeReady
    && Number(report.startupMs || Infinity) <= 45000
    && report.input?.pass === true
    && report.table?.pass === true
    && report.renderer?.xrEnabled === true
    && report.renderer?.shadows === false
    && report.hand?.pass === true
    && report.nextHand?.advanced === true
    && Array.isArray(report.failedModules)
    && report.failedModules.length === 0
  );
  state.patchedReports += 1;
  state.lastReason = reason;
  state.lastResult = report;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE358_ACCEPTANCE_RESULT = report;
  window.SVR_PHASE374_PHASE358_COMPAT_STATE = { ...state };
  return report;
}

function wrapRun() {
  const current = window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE;
  if (typeof current !== 'function' || current.svrPhase374OriginalTableCompat) return false;
  const wrapped = async (...args) => recomputeReport(await current(...args), 'run-wrapper');
  wrapped.svrPhase374OriginalTableCompat = true;
  wrapped.svrPhase374OriginalTableCompatOriginal = current;
  window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE = wrapped;
  state.wrappedRun = true;
  return true;
}

function wrapQa() {
  const current = window.SVR_PHASE358_QA;
  if (typeof current !== 'function' || current.svrPhase374OriginalTableCompat) return false;
  const wrapped = (...args) => {
    const result = current(...args);
    const table = originalTableAudit(result?.table || {});
    if (table) {
      result.table = table;
      result.uploadedTable = window.SVR_PHASE358_UPLOADED_TABLE_QA?.() || result.uploadedTable;
      result.pass = Boolean(
        result.active
        && result.input?.pass
        && result.table?.pass
        && result.uploadedTable?.pass === true
        && result.pokerBoot?.pass === true
        && result.shader?.pass === true
        && result.renderer?.xrEnabled === true
        && result.renderer?.shadows === false
      );
    }
    return result;
  };
  wrapped.svrPhase374OriginalTableCompat = true;
  wrapped.svrPhase374OriginalTableCompatOriginal = current;
  window.SVR_PHASE358_QA = wrapped;
  state.wrappedQa = true;
  return true;
}

async function install() {
  if (state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    const runReady = typeof window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE === 'function';
    const qaReady = typeof window.SVR_PHASE358_QA === 'function';
    const tableReady = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.().pass === true;
    if (runReady && qaReady && tableReady) break;
    await wait(80);
  }
  wrapRun();
  wrapQa();
  state.installed = state.wrappedRun && state.wrappedQa;
  state.installedAt = new Date().toISOString();
  window.SVR_PHASE374_PHASE358_COMPAT_QA = () => ({
    ...state,
    originalTable: window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null,
    currentAuthority: window.SVR_TABLE_AUTHORITY?.name || null,
    acceptedNames: [ORIGINAL_NAME, LEGACY_NAME],
    pass: Boolean(state.installed && window.SVR_TABLE_AUTHORITY?.name === ORIGINAL_NAME && window.SVR_PHASE374_ORIGINAL_TABLE_QA?.().pass === true),
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE374_PHASE358_COMPAT_STATE = { ...state };
}

window.addEventListener('svr:phase358-acceptance', (event) => {
  recomputeReport(event.detail, 'acceptance-event');
});

await install();
