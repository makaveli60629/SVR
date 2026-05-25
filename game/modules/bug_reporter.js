/**
 * SVR Poker — Bug Report Capture
 * Build: PHASE-220-ONE-COMMAND-DEPLOY-HEALTH-LOCK
 * Purpose: capture tester issue reports from inside the game without touching the public Matrix page.
 * No secrets, no SQL strings, no public-page edits.
 */
const BUILD = 'PHASE-220-ONE-COMMAND-DEPLOY-HEALTH-LOCK';
const EXPECTED_PHASE = 195;
const STORE_KEY = 'svr_bug_reports_phase197';

function sanitize(value, max = 1600) {
  return String(value ?? '').replace(/[<>]/g, '').slice(0, max);
}
function nowIso() { return new Date().toISOString(); }
function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch (_) { return []; }
}
function writeStore(items) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, 50))); } catch (_) {}
}
function shortJson(obj, max = 8000) {
  try { return JSON.stringify(obj, null, 2).slice(0, max); }
  catch (_) { return '{}'; }
}

const SVRBugReporter = {
  build: BUILD,
  phase: EXPECTED_PHASE,
  visible: false,
  panel: null,
  latestState: {},
  reports: readStore(),

  init() {
    window.SVR_BUG_REPORTER = this;
    this.buildPanel();
    this.bindKeys();
    this.bindEvents();
    this.captureRuntimeState('boot');
    this.publish('boot');
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      const key = (event.key || '').toLowerCase();
      if (key === 'g') this.toggle();
    });
  },

  bindEvents() {
    [
      'svr_runtime_qa_snapshot',
      'svr_session_export_update',
      'svr_playtest_wizard_update',
      'svr_release_candidate_update',
      'svr_smoke_test_result',
      'svr_deploy_preflight_update',
      'svr_poker_turn_indicator_update',
      'svr_watch_turn_indicator_update',
      'svr_poker_showdown_reveal',
      'svr_poker_side_pot_resolution',
      'svr_poker_allin_update'
    ].forEach(name => window.addEventListener(name, event => {
      this.latestState[name] = { at: nowIso(), detail: event.detail || {} };
      if (this.visible) this.render();
    }));

    window.addEventListener('error', event => {
      this.latestState.lastError = {
        at: nowIso(),
        message: sanitize(event.message || event.error?.message || 'runtime error', 600),
        stack: sanitize(event.error?.stack || '', 1400)
      };
      this.publish('runtime-error');
    });
    window.addEventListener('unhandledrejection', event => {
      this.latestState.lastUnhandledRejection = {
        at: nowIso(),
        message: sanitize(event.reason?.message || event.reason || 'unhandled rejection', 800),
        stack: sanitize(event.reason?.stack || '', 1400)
      };
      this.publish('unhandled-rejection');
    });
  },

  captureRuntimeState(reason = 'manual') {
    const version = document.title || '';
    this.latestState.runtime = {
      reason,
      at: nowIso(),
      build: BUILD,
      phase: EXPECTED_PHASE,
      url: location.pathname + location.search,
      title: version,
      canvasPresent: !!document.querySelector('canvas'),
      sceneNavPresent: !!document.getElementById('sceneNav'),
      modules: {
        runtimeQA: !!window.SVR_RUNTIME_QA,
        sessionExport: !!window.SVR_SESSION_EXPORT,
        deployVerifier: !!window.SVR_DEPLOY_VERIFIER,
        smokeTest: !!window.SVR_SMOKE_TEST,
        releaseCandidate: !!window.SVR_RELEASE_CANDIDATE,
        playtestWizard: !!window.SVR_PLAYTEST_WIZARD,
        enterpriseBridge: !!window.SVREnterpriseBridge
      }
    };
    return this.latestState.runtime;
  },

  buildPanel() {
    if (document.getElementById('svr-bug-reporter-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-bug-reporter-panel';
    panel.style.cssText = [
      'position:fixed','right:14px','top:64px','z-index:58','display:none',
      'width:min(460px,calc(100vw - 28px))','max-height:78vh','overflow:auto',
      'background:rgba(10,6,18,.94)','color:#f6eeff','border:1px solid rgba(255,140,220,.55)',
      'box-shadow:0 18px 50px rgba(0,0,0,.64)','border-radius:16px','padding:12px',
      'font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'pointer-events:auto'
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px">
        <strong>SVR BUG REPORT — PHASE 196</strong>
        <button data-close style="border:1px solid #8950b8;background:#160b24;color:#fff;border-radius:8px;padding:4px 8px">Close</button>
      </div>
      <label>Area</label>
      <select data-area style="width:100%;margin:4px 0 8px;padding:8px;background:#07030d;color:#fff;border:1px solid #5f3a86;border-radius:8px">
        <option>Poker gameplay</option><option>Watch/UI</option><option>Teleport/movement</option><option>Private scene route</option><option>Performance</option><option>Audio</option><option>Visual/layout</option><option>Backend/API</option><option>Other</option>
      </select>
      <label>Severity</label>
      <select data-severity style="width:100%;margin:4px 0 8px;padding:8px;background:#07030d;color:#fff;border:1px solid #5f3a86;border-radius:8px">
        <option>Low</option><option>Medium</option><option>High</option><option>Blocking</option>
      </select>
      <label>What happened?</label>
      <textarea data-notes rows="5" placeholder="Describe the issue, exact button/key pressed, and what you expected." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;background:#07030d;color:#fff;border:1px solid #5f3a86;border-radius:8px"></textarea>
      <label>Tester / device</label>
      <input data-device placeholder="Quest 2 / Quest 3 / Desktop / Android / Browser" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;background:#07030d;color:#fff;border:1px solid #5f3a86;border-radius:8px" />
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
        <button data-save style="border:1px solid #8bffdd;background:#073126;color:#fff;border-radius:999px;padding:7px 10px">Save Report</button>
        <button data-download style="border:1px solid #8aa8ff;background:#101a3a;color:#fff;border-radius:999px;padding:7px 10px">Download Reports</button>
        <button data-copy style="border:1px solid #ffc970;background:#3a2608;color:#fff;border-radius:999px;padding:7px 10px">Copy Latest</button>
        <button data-clear style="border:1px solid #ff7c9f;background:#3a0715;color:#fff;border-radius:999px;padding:7px 10px">Clear Local</button>
      </div>
      <pre data-output style="white-space:pre-wrap;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;max-height:220px;overflow:auto">Ready. Press G to reopen this panel.</pre>
    `;
    document.body.appendChild(panel);
    this.panel = panel;
    panel.querySelector('[data-close]').onclick = () => this.toggle(false);
    panel.querySelector('[data-save]').onclick = () => this.saveFromForm();
    panel.querySelector('[data-download]').onclick = () => this.downloadReports();
    panel.querySelector('[data-copy]').onclick = () => this.copyLatest();
    panel.querySelector('[data-clear]').onclick = () => { this.reports = []; writeStore([]); this.render('Local reports cleared.'); };
  },

  formValue(selector) { return this.panel?.querySelector(selector)?.value || ''; },

  saveFromForm() {
    this.captureRuntimeState('bug-report');
    const report = {
      id: 'SVR-BUG-' + Date.now(),
      build: BUILD,
      phase: EXPECTED_PHASE,
      createdAt: nowIso(),
      area: sanitize(this.formValue('[data-area]'), 120),
      severity: sanitize(this.formValue('[data-severity]'), 80),
      device: sanitize(this.formValue('[data-device]'), 240),
      notes: sanitize(this.formValue('[data-notes]'), 2400),
      runtime: this.latestState.runtime || {},
      lastError: this.latestState.lastError || null,
      recentEventKeys: Object.keys(this.latestState).slice(-16)
    };
    this.reports.unshift(report);
    this.reports = this.reports.slice(0, 50);
    writeStore(this.reports);
    this.publish('save', report);
    this.render('Saved ' + report.id);
    return report;
  },

  downloadReports() {
    const payload = { build: BUILD, phase: EXPECTED_PHASE, exportedAt: nowIso(), reports: this.reports };
    const blob = new Blob([shortJson(payload, 120000)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `svr-bug-reports-phase197-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  async copyLatest() {
    const latest = this.reports[0] || this.saveFromForm();
    const text = shortJson(latest, 16000);
    try { await navigator.clipboard.writeText(text); this.render('Latest bug report copied to clipboard.'); }
    catch (_) { this.render('Clipboard unavailable. Download reports instead.'); }
  },

  render(message = '') {
    if (!this.panel) return;
    const output = this.panel.querySelector('[data-output]');
    if (output) {
      output.textContent = [
        message || 'Ready. Press Save Report after reproducing an issue.',
        `Build: ${BUILD}`,
        `Stored reports: ${this.reports.length}`,
        this.reports[0] ? `Latest: ${this.reports[0].id} | ${this.reports[0].area} | ${this.reports[0].severity}` : 'Latest: none',
        '',
        'Captured runtime keys:',
        Object.keys(this.latestState).join(', ') || 'none yet'
      ].join('\n');
    }
  },

  toggle(force) {
    this.visible = typeof force === 'boolean' ? force : !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) { this.captureRuntimeState('toggle'); this.render(); }
  },

  publish(reason, report = null) {
    const payload = {
      build: BUILD,
      phase: EXPECTED_PHASE,
      reason,
      at: nowIso(),
      reportCount: this.reports.length,
      report
    };
    window.dispatchEvent(new CustomEvent('svr_bug_report_update', { detail: payload }));
    if (window.SVREnterpriseBridge && typeof window.SVREnterpriseBridge.recordGeneric === 'function') {
      window.SVREnterpriseBridge.recordGeneric('/api/game/bug-report', payload);
    }
  }
};

SVRBugReporter.init();
