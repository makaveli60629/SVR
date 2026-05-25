/**
 * SVR Poker — Tester Feedback Triage
 * Build: PHASE-229-POWER-DEPLOY-WATCHER-LOCK
 * Purpose: collect playtest verdicts and triage summaries after QA/smoke/bug-report passes.
 * Public Matrix page is not touched.
 */
const BUILD = 'PHASE-229-POWER-DEPLOY-WATCHER-LOCK';
const EXPECTED_PHASE = 196;
const STORE_KEY = 'svr_tester_feedback_phase197';

function clean(value, max = 1800) { return String(value ?? '').replace(/[<>]/g, '').slice(0, max); }
function nowIso() { return new Date().toISOString(); }
function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (_) { return []; } }
function writeStore(items) { try { localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, 75))); } catch (_) {} }
function toJson(obj, max = 90000) { try { return JSON.stringify(obj, null, 2).slice(0, max); } catch (_) { return '{}'; } }

const SVRTesterFeedback = {
  build: BUILD,
  phase: EXPECTED_PHASE,
  visible: false,
  panel: null,
  entries: readStore(),
  latest: {},

  init() {
    window.SVR_TESTER_FEEDBACK = this;
    this.bindEvents();
    this.buildPanel();
    this.bindKeys();
    this.snapshot('boot');
    this.publish('boot');
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      if ((event.key || '').toLowerCase() === 'j') this.toggle();
    });
  },

  bindEvents() {
    [
      'svr_bug_report_update',
      'svr_playtest_wizard_update',
      'svr_release_candidate_update',
      'svr_smoke_test_result',
      'svr_deploy_preflight_update',
      'svr_runtime_qa_snapshot',
      'svr_session_export_update',
      'svr_poker_action_log_update',
      'svr_poker_showdown_reveal',
      'svr_watch_turn_indicator_update'
    ].forEach(name => window.addEventListener(name, event => {
      this.latest[name] = { at: nowIso(), detail: event.detail || {} };
      if (this.visible) this.render();
    }));
    window.addEventListener('error', event => {
      this.latest.lastError = { at: nowIso(), message: clean(event.message || 'runtime error', 700), stack: clean(event.error?.stack || '', 1800) };
      this.publish('runtime-error');
    });
    window.addEventListener('unhandledrejection', event => {
      this.latest.lastUnhandledRejection = { at: nowIso(), message: clean(event.reason?.message || event.reason || 'unhandled rejection', 900), stack: clean(event.reason?.stack || '', 1800) };
      this.publish('unhandled-rejection');
    });
  },

  snapshot(reason = 'manual') {
    const bugCount = window.SVR_BUG_REPORTER?.reports?.length || 0;
    this.latest.snapshot = {
      at: nowIso(),
      reason,
      build: BUILD,
      phase: EXPECTED_PHASE,
      url: location.pathname + location.search,
      title: document.title,
      modules: {
        runtimeQA: !!window.SVR_RUNTIME_QA,
        sessionExport: !!window.SVR_SESSION_EXPORT,
        deployVerifier: !!window.SVR_DEPLOY_VERIFIER,
        smokeTest: !!window.SVR_SMOKE_TEST,
        releaseCandidate: !!window.SVR_RELEASE_CANDIDATE,
        playtestWizard: !!window.SVR_PLAYTEST_WIZARD,
        bugReporter: !!window.SVR_BUG_REPORTER,
        enterpriseBridge: !!window.SVREnterpriseBridge
      },
      localCounts: {
        bugReports: bugCount,
        feedbackEntries: this.entries.length
      },
      lastError: this.latest.lastError || null,
      lastUnhandledRejection: this.latest.lastUnhandledRejection || null,
      recentEventKeys: Object.keys(this.latest).slice(-18)
    };
    return this.latest.snapshot;
  },

  buildPanel() {
    if (document.getElementById('svr-tester-feedback-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-tester-feedback-panel';
    panel.style.cssText = [
      'position:fixed','left:14px','top:66px','z-index:59','display:none',
      'width:min(470px,calc(100vw - 28px))','max-height:80vh','overflow:auto',
      'background:rgba(5,12,18,.95)','color:#eafcff','border:1px solid rgba(119,255,221,.58)',
      'box-shadow:0 18px 54px rgba(0,0,0,.68)','border-radius:16px','padding:12px',
      'font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'pointer-events:auto'
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px">
        <strong>SVR TESTER FEEDBACK — PHASE 196</strong>
        <button data-close style="border:1px solid #55d6c2;background:#061b1a;color:#fff;border-radius:8px;padding:4px 8px">Close</button>
      </div>
      <label>Test verdict</label>
      <select data-verdict style="width:100%;margin:4px 0 8px;padding:8px;background:#02080b;color:#fff;border:1px solid #2f8075;border-radius:8px">
        <option>Pass - ready for next test</option><option>Needs polish</option><option>Bug found</option><option>Blocking - cannot continue</option><option>Performance concern</option>
      </select>
      <label>Area tested</label>
      <select data-area style="width:100%;margin:4px 0 8px;padding:8px;background:#02080b;color:#fff;border:1px solid #2f8075;border-radius:8px">
        <option>Poker loop</option><option>Watch decisions</option><option>Quest controls</option><option>Teleport</option><option>Private scene route</option><option>Deploy/version</option><option>Smoke test</option><option>Release candidate</option><option>Backend/API</option><option>Other</option>
      </select>
      <label>Tester notes</label>
      <textarea data-notes rows="5" placeholder="What did you test? What passed? What needs the next fix?" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;background:#02080b;color:#fff;border:1px solid #2f8075;border-radius:8px"></textarea>
      <label>Device / browser</label>
      <input data-device placeholder="Quest 3 / Quest 2 / Desktop Chrome / Android browser" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;background:#02080b;color:#fff;border:1px solid #2f8075;border-radius:8px" />
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
        <button data-save style="border:1px solid #8bffdd;background:#073126;color:#fff;border-radius:999px;padding:7px 10px">Save Feedback</button>
        <button data-download style="border:1px solid #8aa8ff;background:#101a3a;color:#fff;border-radius:999px;padding:7px 10px">Download</button>
        <button data-copy style="border:1px solid #ffc970;background:#3a2608;color:#fff;border-radius:999px;padding:7px 10px">Copy Latest</button>
        <button data-summary style="border:1px solid #d197ff;background:#2b113a;color:#fff;border-radius:999px;padding:7px 10px">QA Summary</button>
      </div>
      <pre data-output style="white-space:pre-wrap;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;max-height:230px;overflow:auto">Ready. Press J to reopen this panel.</pre>
    `;
    document.body.appendChild(panel);
    this.panel = panel;
    panel.querySelector('[data-close]').onclick = () => this.toggle(false);
    panel.querySelector('[data-save]').onclick = () => this.saveFromForm();
    panel.querySelector('[data-download]').onclick = () => this.download();
    panel.querySelector('[data-copy]').onclick = () => this.copyLatest();
    panel.querySelector('[data-summary]').onclick = () => this.render(this.summaryText());
  },

  formValue(sel) { return this.panel?.querySelector(sel)?.value || ''; },

  saveFromForm() {
    const snap = this.snapshot('tester-feedback');
    const entry = {
      id: 'SVR-FEEDBACK-' + Date.now(),
      build: BUILD,
      phase: EXPECTED_PHASE,
      createdAt: nowIso(),
      verdict: clean(this.formValue('[data-verdict]'), 120),
      area: clean(this.formValue('[data-area]'), 120),
      device: clean(this.formValue('[data-device]'), 260),
      notes: clean(this.formValue('[data-notes]'), 2600),
      snapshot: snap
    };
    this.entries.unshift(entry);
    this.entries = this.entries.slice(0, 75);
    writeStore(this.entries);
    this.publish('save', entry);
    this.render('Saved ' + entry.id);
    return entry;
  },

  summaryText() {
    this.snapshot('summary');
    const blockers = this.entries.filter(e => /blocking/i.test(e.verdict)).length;
    const bugs = this.entries.filter(e => /bug/i.test(e.verdict)).length;
    return [
      'SVR PHASE 196 TESTER TRIAGE SUMMARY',
      'Build: ' + BUILD,
      'Feedback entries: ' + this.entries.length,
      'Bug entries: ' + bugs,
      'Blocking entries: ' + blockers,
      'Bug reports stored: ' + (window.SVR_BUG_REPORTER?.reports?.length || 0),
      'Recent runtime keys: ' + (Object.keys(this.latest).slice(-12).join(', ') || 'none'),
      'Next recommendation: ' + (blockers ? 'Fix blockers before moving forward.' : bugs ? 'Review bug reports, then continue.' : 'Ready for next phase testing.')
    ].join('\n');
  },

  download() {
    const payload = { build: BUILD, phase: EXPECTED_PHASE, exportedAt: nowIso(), entries: this.entries, latest: this.latest, summary: this.summaryText() };
    const blob = new Blob([toJson(payload, 150000)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `svr-tester-feedback-phase197-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  async copyLatest() {
    const latest = this.entries[0] || this.saveFromForm();
    const text = toJson(latest, 18000);
    try { await navigator.clipboard.writeText(text); this.render('Latest feedback copied to clipboard.'); }
    catch (_) { this.render('Clipboard unavailable. Download feedback instead.'); }
  },

  render(message = '') {
    if (!this.panel) return;
    const output = this.panel.querySelector('[data-output]');
    if (output) output.textContent = message || this.summaryText();
  },

  toggle(force) {
    this.visible = typeof force === 'boolean' ? force : !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) this.render();
  },

  publish(reason, entry = null) {
    const payload = { build: BUILD, phase: EXPECTED_PHASE, reason, at: nowIso(), entryCount: this.entries.length, entry };
    window.dispatchEvent(new CustomEvent('svr_tester_feedback_update', { detail: payload }));
    if (window.SVREnterpriseBridge && typeof window.SVREnterpriseBridge.recordGeneric === 'function') {
      window.SVREnterpriseBridge.recordGeneric('/api/game/tester-feedback', payload);
    }
  }
};

SVRTesterFeedback.init();
