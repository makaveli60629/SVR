/**
 * SVR Poker — Test Report Bundle
 * Build: PHASE-199-DEMO-CERTIFICATION-LOCK
 * Purpose: combine QA snapshots, bug reports, tester feedback, test queue, smoke/RC/preflight/session exports into one playtest report bundle.
 * Public Matrix launch page is not touched.
 */
const BUILD = 'PHASE-199-DEMO-CERTIFICATION-LOCK';
const EXPECTED_PHASE = 198;
const STORE_KEY = 'svr_test_report_bundles_phase198';

function clean(value, max = 2400) { return String(value ?? '').replace(/[<>]/g, '').slice(0, max); }
function nowIso() { return new Date().toISOString(); }
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; } }
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value).slice(0, 400000)); } catch (_) {} }
function toJson(value, max = 140000) { try { return JSON.stringify(value, null, 2).slice(0, max); } catch (_) { return '{}'; } }
function pickLocal(prefix) {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(prefix) === 0) out[key] = readJson(key, localStorage.getItem(key));
    }
  } catch (_) {}
  return out;
}

const SVRTestReportBundle = {
  build: BUILD,
  phase: EXPECTED_PHASE,
  visible: false,
  panel: null,
  latest: {},
  bundles: readJson(STORE_KEY, []),

  init() {
    window.SVR_TEST_REPORT_BUNDLE = this;
    this.bindEvents();
    this.bindKeys();
    this.buildPanel();
    this.createBundle('boot');
    this.publish('boot');
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      const key = (event.key || '').toLowerCase();
      if (key === 'b') this.toggle();
    });
  },

  bindEvents() {
    const events = [
      'svr_test_queue_update',
      'svr_tester_feedback_update',
      'svr_bug_report_update',
      'svr_playtest_wizard_update',
      'svr_release_candidate_update',
      'svr_smoke_test_result',
      'svr_deploy_preflight_update',
      'svr_runtime_qa_snapshot',
      'svr_session_export_update',
      'svr_poker_action_log_update',
      'svr_poker_showdown_reveal',
      'svr_poker_side_pot_resolution',
      'svr_watch_turn_indicator_update'
    ];
    events.forEach(name => window.addEventListener(name, event => {
      this.latest[name] = { at: nowIso(), detail: event.detail || {} };
      if (this.visible) this.render();
    }));
    window.addEventListener('error', event => {
      this.latest.lastError = { at: nowIso(), message: clean(event.message || 'runtime error', 900), stack: clean(event.error?.stack || '', 2200) };
      this.publish('runtime-error');
    });
    window.addEventListener('unhandledrejection', event => {
      this.latest.lastUnhandledRejection = { at: nowIso(), message: clean(event.reason?.message || event.reason || 'unhandled rejection', 900), stack: clean(event.reason?.stack || '', 2200) };
      this.publish('unhandled-rejection');
    });
  },

  buildPanel() {
    if (document.getElementById('svr-test-report-bundle-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-test-report-bundle-panel';
    panel.style.cssText = [
      'position:fixed','left:50%','top:70px','transform:translateX(-50%)','z-index:64','display:none',
      'width:min(680px,calc(100vw - 28px))','max-height:82vh','overflow:auto',
      'background:rgba(7,5,14,.97)','color:#f7f2ff','border:1px solid rgba(150,220,255,.64)',
      'box-shadow:0 22px 70px rgba(0,0,0,.72)','border-radius:18px','padding:12px',
      'font:12px/1.36 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace','pointer-events:auto'
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px">
        <strong>SVR TEST REPORT BUNDLE — PHASE 198</strong>
        <button data-close style="border:1px solid #9ee8ff;background:#10283a;color:#fff;border-radius:8px;padding:4px 8px">Close</button>
      </div>
      <div data-status style="margin-bottom:8px;color:#cfeeff">Press B to reopen. Bundle combines QA, session export, bug reports, feedback, and test queue.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
        <button data-create style="border:1px solid #9ee8ff;background:#10283a;color:#fff;border-radius:999px;padding:7px 10px">Create Bundle</button>
        <button data-copy style="border:1px solid #8affdd;background:#0d3028;color:#fff;border-radius:999px;padding:7px 10px">Copy Latest</button>
        <button data-download style="border:1px solid #ffd98a;background:#3a2b10;color:#fff;border-radius:999px;padding:7px 10px">Download Latest</button>
      </div>
      <div data-summary style="margin:8px 0;color:#e8ddff"></div>
      <pre data-json style="white-space:pre-wrap;max-height:48vh;overflow:auto;background:rgba(255,255,255,.05);border-radius:12px;padding:10px;margin:0"></pre>
    `;
    panel.querySelector('[data-close]').onclick = () => this.toggle(false);
    panel.querySelector('[data-create]').onclick = () => { this.createBundle('manual'); this.publish('manual'); this.render(); };
    panel.querySelector('[data-copy]').onclick = () => this.copyLatest();
    panel.querySelector('[data-download]').onclick = () => this.downloadLatest();
    document.body.appendChild(panel);
    this.panel = panel;
  },

  toggle(force) {
    this.visible = typeof force === 'boolean' ? force : !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) { this.createBundle('open-panel'); this.render(); }
  },

  createBundle(reason = 'manual') {
    const modules = {
      runtimeQA: !!window.SVR_RUNTIME_QA,
      sessionExport: !!window.SVR_SESSION_EXPORT,
      deployVerifier: !!window.SVR_DEPLOY_VERIFIER,
      smokeTest: !!window.SVR_SMOKE_TEST,
      releaseCandidate: !!window.SVR_RELEASE_CANDIDATE,
      playtestWizard: !!window.SVR_PLAYTEST_WIZARD,
      bugReporter: !!window.SVR_BUG_REPORTER,
      testerFeedback: !!window.SVR_TESTER_FEEDBACK,
      testQueue: !!window.SVR_TEST_QUEUE,
      enterpriseBridge: !!window.SVREnterpriseBridge
    };
    const bundle = {
      type: 'svr-test-report-bundle',
      reason,
      build: BUILD,
      phase: EXPECTED_PHASE,
      createdAt: nowIso(),
      url: location.pathname + location.search,
      title: document.title,
      modules,
      counts: {
        bugReports: window.SVR_BUG_REPORTER?.reports?.length || 0,
        testerFeedback: window.SVR_TESTER_FEEDBACK?.entries?.length || 0,
        testQueue: window.SVR_TEST_QUEUE?.queue?.length || 0,
        reportBundles: this.bundles.length
      },
      latestEvents: this.latest,
      localSnapshots: {
        bugReports: pickLocal('svr_bug_reports_'),
        testerFeedback: pickLocal('svr_tester_feedback_'),
        testQueue: pickLocal('svr_test_queue_'),
        sessionExports: pickLocal('svr_session_exports_'),
        reportBundles: {}
      },
      readiness: this.scoreReadiness(modules)
    };
    this.bundles.unshift(bundle);
    this.bundles = this.bundles.slice(0, 20);
    writeJson(STORE_KEY, this.bundles);
    this.latest.bundle = bundle;
    return bundle;
  },

  scoreReadiness(modules) {
    const required = ['runtimeQA','sessionExport','deployVerifier','smokeTest','releaseCandidate','playtestWizard','bugReporter','testerFeedback','testQueue','enterpriseBridge'];
    const present = required.filter(k => modules[k]).length;
    const score = Math.round((present / required.length) * 100);
    const missing = required.filter(k => !modules[k]);
    return { score, present, total: required.length, missing, status: score >= 90 ? 'READY_FOR_TESTING' : score >= 70 ? 'NEEDS_REVIEW' : 'BLOCKED' };
  },

  latestBundle() { return this.bundles[0] || this.createBundle('empty'); },

  render() {
    if (!this.panel) return;
    const latest = this.latestBundle();
    const summary = this.panel.querySelector('[data-summary]');
    const json = this.panel.querySelector('[data-json]');
    if (summary) summary.innerHTML = `
      <div><b>Readiness:</b> ${latest.readiness.status} — ${latest.readiness.score}% (${latest.readiness.present}/${latest.readiness.total})</div>
      <div><b>Bug reports:</b> ${latest.counts.bugReports} | <b>Feedback:</b> ${latest.counts.testerFeedback} | <b>Queue:</b> ${latest.counts.testQueue}</div>
      <div><b>Missing modules:</b> ${latest.readiness.missing.length ? latest.readiness.missing.join(', ') : 'none'}</div>
    `;
    if (json) json.textContent = toJson(latest, 60000);
  },

  async copyLatest() {
    const text = toJson(this.latestBundle(), 120000);
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  },

  downloadLatest() {
    const bundle = this.latestBundle();
    const blob = new Blob([toJson(bundle, 200000)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `svr-test-report-bundle-${BUILD}-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  publish(reason = 'update') {
    const detail = { reason, build: BUILD, phase: EXPECTED_PHASE, bundle: this.latestBundle() };
    window.dispatchEvent(new CustomEvent('svr_test_report_bundle_update', { detail }));
    return detail;
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SVRTestReportBundle.init());
else SVRTestReportBundle.init();
