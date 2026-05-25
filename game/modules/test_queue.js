/**
 * SVR Poker — Test Queue Dashboard
 * Build: PHASE-205-ENTERPRISE-BRIDGE-CACHEBUST-FIX-LOCK
 * Purpose: convert tester feedback, bug reports, release candidate checks, and smoke tests into a compact triage queue.
 * Public Matrix launch page is not touched.
 */
const BUILD = 'PHASE-205-ENTERPRISE-BRIDGE-CACHEBUST-FIX-LOCK';
const EXPECTED_PHASE = 197;
const STORE_KEY = 'svr_test_queue_phase197';

function clean(value, max = 2000) { return String(value ?? '').replace(/[<>]/g, '').slice(0, max); }
function nowIso() { return new Date().toISOString(); }
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; } }
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
function safeCount(value) { return Array.isArray(value) ? value.length : 0; }
function jsonText(value, max = 80000) { try { return JSON.stringify(value, null, 2).slice(0, max); } catch (_) { return '{}'; } }

const SVRTestQueue = {
  build: BUILD,
  phase: EXPECTED_PHASE,
  visible: false,
  panel: null,
  queue: readJson(STORE_KEY, []),
  latest: {},

  init() {
    window.SVR_TEST_QUEUE = this;
    this.bindEvents();
    this.bindKeys();
    this.buildPanel();
    this.rebuildQueue('boot');
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      if ((event.key || '').toLowerCase() === 'k') this.toggle();
    });
  },

  bindEvents() {
    const events = [
      'svr_tester_feedback_update',
      'svr_bug_report_update',
      'svr_playtest_wizard_update',
      'svr_release_candidate_update',
      'svr_smoke_test_result',
      'svr_deploy_preflight_update',
      'svr_runtime_qa_snapshot',
      'svr_session_export_update',
      'svr_poker_action_log_update',
      'svr_watch_turn_indicator_update'
    ];
    events.forEach(name => window.addEventListener(name, event => {
      this.latest[name] = { at: nowIso(), detail: event.detail || {} };
      this.rebuildQueue(name);
    }));
    window.addEventListener('error', event => {
      this.latest.lastError = { at: nowIso(), message: clean(event.message || 'runtime error', 900), stack: clean(event.error?.stack || '', 1600) };
      this.rebuildQueue('runtime-error');
    });
    window.addEventListener('unhandledrejection', event => {
      this.latest.lastUnhandledRejection = { at: nowIso(), message: clean(event.reason?.message || event.reason || 'unhandled rejection', 900), stack: clean(event.reason?.stack || '', 1600) };
      this.rebuildQueue('unhandled-rejection');
    });
  },

  buildPanel() {
    if (document.getElementById('svr-test-queue-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-test-queue-panel';
    panel.style.cssText = [
      'position:fixed','right:14px','top:66px','z-index:60','display:none',
      'width:min(500px,calc(100vw - 28px))','max-height:80vh','overflow:auto',
      'background:rgba(10,6,18,.96)','color:#f6f0ff','border:1px solid rgba(205,155,255,.62)',
      'box-shadow:0 18px 54px rgba(0,0,0,.68)','border-radius:16px','padding:12px',
      'font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace','pointer-events:auto'
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px">
        <strong>SVR TEST QUEUE — PHASE 197</strong>
        <button data-close style="border:1px solid #d9a7ff;background:#261039;color:#fff;border-radius:8px;padding:4px 8px">Close</button>
      </div>
      <div data-status style="margin-bottom:8px;color:#d9c8ff">Press K to reopen. Queue builds from feedback, bug reports, QA, smoke, and RC checks.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
        <button data-rebuild style="border:1px solid #d9a7ff;background:#261039;color:#fff;border-radius:999px;padding:7px 10px">Rebuild Queue</button>
        <button data-copy style="border:1px solid #8affdd;background:#073126;color:#fff;border-radius:999px;padding:7px 10px">Copy Queue</button>
        <button data-download style="border:1px solid #8aa8ff;background:#101a3a;color:#fff;border-radius:999px;padding:7px 10px">Download Queue</button>
      </div>
      <pre data-output style="white-space:pre-wrap;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;max-height:330px;overflow:auto">Ready.</pre>
    `;
    document.body.appendChild(panel);
    this.panel = panel;
    panel.querySelector('[data-close]').onclick = () => this.toggle(false);
    panel.querySelector('[data-rebuild]').onclick = () => this.rebuildQueue('manual');
    panel.querySelector('[data-copy]').onclick = () => this.copyQueue();
    panel.querySelector('[data-download]').onclick = () => this.downloadQueue();
  },

  collectSources() {
    const feedback = window.SVR_TESTER_FEEDBACK?.entries || readJson('svr_tester_feedback_phase197', []);
    const bugReports = window.SVR_BUG_REPORTER?.reports || readJson('svr_bug_reports_phase197', []);
    const qa = window.SVR_RUNTIME_QA?.latest || null;
    const smoke = window.SVR_SMOKE_TEST?.latest || this.latest.svr_smoke_test_result?.detail || null;
    const rc = window.SVR_RELEASE_CANDIDATE?.latest || this.latest.svr_release_candidate_update?.detail || null;
    const deploy = window.SVR_DEPLOY_VERIFIER?.latest || this.latest.svr_deploy_preflight_update?.detail || null;
    return { feedback, bugReports, qa, smoke, rc, deploy };
  },

  severityFromText(text) {
    const value = String(text || '').toLowerCase();
    if (/blocking|blocker|cannot continue|crash|black screen|freeze/.test(value)) return 'BLOCKER';
    if (/bug|error|fail|broken/.test(value)) return 'BUG';
    if (/performance|lag|jitter|stutter|slow/.test(value)) return 'PERFORMANCE';
    if (/polish|alignment|readability|visual/.test(value)) return 'POLISH';
    if (/pass|ready/.test(value)) return 'PASS';
    return 'REVIEW';
  },

  rebuildQueue(reason = 'manual') {
    const src = this.collectSources();
    const queue = [];
    (src.bugReports || []).slice(0, 20).forEach((report, index) => {
      const text = [report.severity, report.area, report.notes, report.snapshot?.lastError?.message].filter(Boolean).join(' ');
      queue.push({ type: 'bug', priority: this.severityFromText(text), title: clean(report.area || 'Bug report #' + (index + 1), 120), notes: clean(report.notes || report.severity || '', 900), at: report.createdAt || nowIso() });
    });
    (src.feedback || []).slice(0, 30).forEach((entry, index) => {
      const text = [entry.verdict, entry.area, entry.notes, entry.snapshot?.lastError?.message].filter(Boolean).join(' ');
      queue.push({ type: 'feedback', priority: this.severityFromText(text), title: clean(entry.area || 'Tester feedback #' + (index + 1), 120), notes: clean((entry.verdict || '') + ' — ' + (entry.notes || ''), 900), at: entry.createdAt || nowIso() });
    });
    if (this.latest.lastError) queue.unshift({ type: 'runtime', priority: 'BLOCKER', title: 'Runtime error captured', notes: clean(this.latest.lastError.message, 900), at: this.latest.lastError.at });
    if (this.latest.lastUnhandledRejection) queue.unshift({ type: 'runtime', priority: 'BUG', title: 'Unhandled rejection captured', notes: clean(this.latest.lastUnhandledRejection.message, 900), at: this.latest.lastUnhandledRejection.at });
    if (!queue.length) queue.push({ type: 'system', priority: 'PASS', title: 'No active queue items', notes: 'Current local runtime did not report bugs or feedback items yet.', at: nowIso() });

    const rank = { BLOCKER: 0, BUG: 1, PERFORMANCE: 2, POLISH: 3, REVIEW: 4, PASS: 5 };
    queue.sort((a,b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9));
    this.queue = queue.slice(0, 60);
    writeJson(STORE_KEY, this.queue);
    const summary = this.summary(reason);
    this.publish('queue', summary);
    if (this.visible) this.render(summary);
    return summary;
  },

  summary(reason = 'manual') {
    const counts = this.queue.reduce((acc, item) => { acc[item.priority] = (acc[item.priority] || 0) + 1; return acc; }, {});
    return {
      build: BUILD,
      phase: EXPECTED_PHASE,
      generatedAt: nowIso(),
      reason,
      total: this.queue.length,
      counts,
      recommendation: counts.BLOCKER ? 'Stop and fix blockers before next demo.' : counts.BUG ? 'Fix bugs, then retest.' : counts.PERFORMANCE ? 'Run Quest performance pass.' : 'Ready for next playtest cycle.',
      queue: this.queue
    };
  },

  render(payload = this.summary('render')) {
    if (!this.panel) return;
    const output = this.panel.querySelector('[data-output]');
    const status = this.panel.querySelector('[data-status]');
    if (status) status.textContent = `${payload.total || 0} queue items • ${payload.recommendation || 'Ready.'}`;
    if (output) output.textContent = jsonText(payload, 20000);
  },

  toggle(force) {
    this.visible = typeof force === 'boolean' ? force : !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) this.render(this.rebuildQueue('open'));
  },

  async copyQueue() {
    const payload = this.summary('copy');
    try { await navigator.clipboard.writeText(jsonText(payload, 30000)); this.render({ ...payload, recommendation: 'Queue copied to clipboard.' }); }
    catch (_) { this.render({ ...payload, recommendation: 'Clipboard unavailable. Use Download Queue.' }); }
  },

  downloadQueue() {
    const payload = this.summary('download');
    const blob = new Blob([jsonText(payload, 90000)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `svr-test-queue-phase197-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  publish(kind, detail = null) {
    window.dispatchEvent(new CustomEvent('svr_test_queue_update', { detail: detail || this.summary(kind) }));
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SVRTestQueue.init());
else SVRTestQueue.init();
