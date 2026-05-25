/**
 * SVR Poker - Demo Certification Lock
 * Build: PHASE-211-FULL-MARKER-HEALTH-LOCK
 * Shortcut: Z
 * Purpose: combine QA, smoke, RC, feedback, bug reports, and report bundle into one demo-ready gate.
 */
const BUILD = 'PHASE-211-FULL-MARKER-HEALTH-LOCK';
const STORE_KEY = 'svr_demo_certifications';

function safeRead(name, fallback = null) {
  try { return window[name] || fallback; } catch (_) { return fallback; }
}

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (_) { return []; }
}

function writeArray(key, rows, max = 25) {
  try { localStorage.setItem(key, JSON.stringify(rows.slice(0, max))); } catch (_) {}
}

function makeEl(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style') Object.assign(el.style, v);
    else if (k === 'className') el.className = v;
    else el.setAttribute(k, v);
  });
  if (text) el.textContent = text;
  return el;
}

function getModuleFlags() {
  return {
    enterpriseBridge: !!safeRead('SVR_ENTERPRISE_BRIDGE'),
    runtimeQA: !!safeRead('SVR_RUNTIME_QA'),
    sessionExport: !!safeRead('SVR_SESSION_EXPORT'),
    deployVerifier: !!safeRead('SVR_DEPLOY_VERIFIER'),
    smokeTest: !!safeRead('SVR_SMOKE_TEST'),
    releaseCandidate: !!safeRead('SVR_RELEASE_CANDIDATE'),
    playtestWizard: !!safeRead('SVR_PLAYTEST_WIZARD'),
    bugReporter: !!safeRead('SVR_BUG_REPORTER'),
    testerFeedback: !!safeRead('SVR_TESTER_FEEDBACK'),
    testQueue: !!safeRead('SVR_TEST_QUEUE'),
    testReportBundle: !!safeRead('SVR_TEST_REPORT_BUNDLE')
  };
}

function countFlags(flags) {
  return Object.values(flags).filter(Boolean).length;
}

function currentBuild() {
  const fromMeta = document.querySelector('#hud .pill:last-child')?.textContent || '';
  const match = fromMeta.match(/PHASE-[A-Z0-9._-]+/);
  return match ? match[0] : BUILD;
}

function makeCertification() {
  const flags = getModuleFlags();
  const moduleCount = countFlags(flags);
  const bugs = readArray('svr_bug_reports');
  const feedback = readArray('svr_tester_feedback');
  const queue = readArray('svr_test_queue');
  const bundles = readArray('svr_test_report_bundles');
  const blockers = queue.filter(q => String(q.type || q.category || '').toLowerCase().includes('blocker') || String(q.severity || '').toLowerCase().includes('blocker')).length;
  const lastError = window.SVR_LAST_RUNTIME_ERROR || null;
  const requiredReady = flags.runtimeQA && flags.sessionExport && flags.deployVerifier && flags.smokeTest && flags.releaseCandidate && flags.playtestWizard && flags.testReportBundle;
  let status = 'NEEDS_REVIEW';
  let reason = 'Run QA, smoke test, RC checklist, playtest wizard, and export bundle before demo.';
  if (lastError || blockers > 0) {
    status = 'BLOCKED';
    reason = lastError ? 'Runtime error captured. Review before demo.' : 'Blocker items remain in the test queue.';
  } else if (requiredReady && moduleCount >= 10) {
    status = 'DEMO_READY';
    reason = 'Required QA modules are present and no blockers/runtime errors are currently recorded.';
  }
  return {
    id: `demo-cert-${Date.now()}`,
    build: currentBuild(),
    expectedBuild: BUILD,
    generatedAt: new Date().toISOString(),
    status,
    reason,
    moduleCount,
    modules: flags,
    counters: { bugs: bugs.length, feedback: feedback.length, queue: queue.length, bundles: bundles.length, blockers },
    shortcuts: { smoke: 'T', releaseCandidate: 'U', playtestWizard: 'W', bugReport: 'G', testerFeedback: 'J', testQueue: 'K', reportBundle: 'B', sessionExportDownload: 'X', sessionExportCopy: 'Y', deployVerifier: 'V', demoCertification: 'Z' },
    lastRuntimeError: lastError,
    nextSteps: status === 'DEMO_READY' ? ['Record a short demo pass.', 'Export session JSON.', 'Capture tester feedback.'] : ['Run V/T/U/W/B overlays.', 'Clear blocker queue items.', 'Export bug/feedback JSON for review.'],
    publicPageTouched: false
  };
}

function saveCertification(row) {
  const rows = readArray(STORE_KEY);
  rows.unshift(row);
  writeArray(STORE_KEY, rows);
  window.dispatchEvent(new CustomEvent('svr_demo_certification_update', { detail: row }));
  if (window.SVR_ENTERPRISE_BRIDGE?.postTelemetry) {
    try { window.SVR_ENTERPRISE_BRIDGE.postTelemetry('demo-certification', row); } catch (_) {}
  }
  return row;
}

function downloadJson(row) {
  const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `svr-demo-certification-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2500);
}

function copyJson(row) {
  const txt = JSON.stringify(row, null, 2);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).catch(() => {});
}

const api = {
  build: BUILD,
  latest: null,
  certify() { this.latest = saveCertification(makeCertification()); return this.latest; },
  list() { return readArray(STORE_KEY); },
  download() { downloadJson(this.latest || this.certify()); },
  copy() { copyJson(this.latest || this.certify()); }
};

function renderPanel() {
  let panel = document.getElementById('svr-demo-certification-panel');
  if (panel) { panel.remove(); return; }
  const row = api.certify();
  panel = makeEl('div', { id: 'svr-demo-certification-panel', style: {
    position: 'fixed', right: '14px', top: '90px', zIndex: 9999, width: '380px', maxWidth: 'calc(100vw - 28px)',
    background: 'rgba(2,5,8,.94)', color: '#eafff4', border: '1px solid rgba(120,255,186,.45)', borderRadius: '16px',
    padding: '14px', boxShadow: '0 18px 50px rgba(0,0,0,.55)', font: '12px/1.35 system-ui,Segoe UI,Arial'
  }});
  const statusColor = row.status === 'DEMO_READY' ? '#4cff9a' : row.status === 'BLOCKED' ? '#ff5b6e' : '#ffd166';
  panel.appendChild(makeEl('h3', { style: { margin: '0 0 6px', color: statusColor } }, `Demo Certification: ${row.status}`));
  panel.appendChild(makeEl('div', {}, `Build: ${row.build}`));
  panel.appendChild(makeEl('div', {}, `Modules: ${row.moduleCount}/11`));
  panel.appendChild(makeEl('div', {}, `Bugs: ${row.counters.bugs} • Feedback: ${row.counters.feedback} • Queue: ${row.counters.queue} • Blockers: ${row.counters.blockers}`));
  panel.appendChild(makeEl('p', { style: { color: '#cfe', margin: '8px 0' } }, row.reason));
  const list = makeEl('ul', { style: { margin: '8px 0 10px', paddingLeft: '18px' } });
  row.nextSteps.forEach(s => list.appendChild(makeEl('li', {}, s)));
  panel.appendChild(list);
  const btns = makeEl('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } });
  const mkBtn = (label, fn) => {
    const b = makeEl('button', { style: { border: '1px solid rgba(120,255,186,.35)', borderRadius: '999px', background: 'rgba(12,35,25,.85)', color: '#fff', padding: '7px 10px', cursor: 'pointer' } }, label);
    b.addEventListener('click', fn); return b;
  };
  btns.appendChild(mkBtn('Refresh', () => { panel.remove(); renderPanel(); }));
  btns.appendChild(mkBtn('Download JSON', () => api.download()));
  btns.appendChild(mkBtn('Copy JSON', () => api.copy()));
  btns.appendChild(mkBtn('Close', () => panel.remove()));
  panel.appendChild(btns);
  document.body.appendChild(panel);
}

document.addEventListener('keydown', (event) => {
  if (event.key && event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey && !event.altKey) renderPanel();
});

window.SVR_DEMO_CERTIFICATION = api;
setTimeout(() => api.certify(), 1200);
