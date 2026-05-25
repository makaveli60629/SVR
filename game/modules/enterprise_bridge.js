/**
 * SVR Poker — Enterprise Bridge
 * Build: PHASE-203-ENTERPRISE-BRIDGE-RECORDER-FIX-LOCK
 * Safe browser-side bridge: no SQL strings, no API secrets, no Stripe secrets.
 */
const SVREnterpriseBridge = {
  build: 'PHASE-203-ENTERPRISE-BRIDGE-RECORDER-FIX-LOCK',
  apiBase: window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '',
  pending: [],
  apiOnline: false,

  init() {
    window.SVREnterpriseBridge = this;
    window.SVR_ENTERPRISE_BRIDGE = this;
    window.addEventListener('svr_poker_hand_result', (event) => this.recordHandResult(event.detail || {}));
    window.addEventListener('svr_poker_player_action', (event) => this.recordPlayerAction(event.detail || {}));
    window.addEventListener('svr_poker_action_log_update', (event) => this.recordActionLog(event.detail || {}));
    window.addEventListener('svr_poker_legal_actions_update', (event) => this.recordLegalActions(event.detail || {}));
    window.addEventListener('svr_poker_showdown_reveal', (event) => this.recordShowdown(event.detail || {}));
    window.addEventListener('svr_poker_side_pot_resolution', (event) => this.recordSidePot(event.detail || {}));
    window.addEventListener('svr_poker_turn_indicator_update', (event) => this.recordTurnIndicator(event.detail || {}));
    window.addEventListener('svr_watch_turn_indicator_update', (event) => this.recordWatchTurnIndicator(event.detail || {}));
    window.addEventListener('svr_poker_dealer_button_update', (event) => this.recordDealerButton(event.detail || {}));
    window.addEventListener('svr_poker_rebuy_update', (event) => this.recordRebuy(event.detail || {}));
    window.addEventListener('svr_poker_decision_aid_update', (event) => this.recordDecisionAid(event.detail || {}));
    window.addEventListener('svr_runtime_telemetry', (event) => this.recordTelemetry(event.detail || {}));
    window.addEventListener('svr_poker_allin_update', (event) => this.recordAllIn(event.detail || {}));
    window.addEventListener('svr_poker_fold_eligibility_update', (event) => this.recordFoldEligibility(event.detail || {}));
    window.addEventListener('svr_deploy_preflight_update', (event) => this.recordDeployPreflight(event.detail || {}));
    window.addEventListener('svr_smoke_test_result', (event) => this.recordSmokeTest(event.detail || {}));
    window.addEventListener('svr_release_candidate_update', (event) => this.recordReleaseCandidate(event.detail || {}));
    window.addEventListener('svr_runtime_qa_snapshot', (event) => this.recordRuntimeQA(event.detail || {}));
    window.addEventListener('svr_session_export_update', (event) => this.recordSessionExport(event.detail || {}));
    window.addEventListener('svr_bug_report_update', (event) => this.recordBugReport(event.detail || {}));
    window.addEventListener('svr_tester_feedback_update', (event) => this.recordTesterFeedback(event.detail || {}));
    window.addEventListener('svr_test_queue_update', (event) => this.recordTestQueue(event.detail || {}));
    window.addEventListener('svr_test_report_bundle_update', (event) => this.recordTestReportBundle(event.detail || {}));
    window.addEventListener('svr_demo_certification_update', (event) => this.recordDemoCertification(event.detail || {}));
    window.addEventListener('svr_pilot_testing_ready_update', (event) => this.recordPilotReady(event.detail || {}));
    window.addEventListener('svr_playtest_wizard_update', (event) => this.recordGeneric('/api/game/playtest-wizard', event.detail || {}));
    this.ensureRecorderSurface();
    this.healthCheck();
    setInterval(() => this.flush(), 15000);
  },

  ensureRecorderSurface() {
    const recorderMap = {
      recordDealerButton: 'dealer_button',
      recordRebuy: 'rebuy',
      recordDecisionAid: 'decision_aid',
      recordAllIn: 'allin_update',
      recordFoldEligibility: 'fold_eligibility',
      recordDeployPreflight: 'deploy_preflight',
      recordSmokeTest: 'smoke_test',
      recordReleaseCandidate: 'release_candidate',
      recordRuntimeQA: 'runtime_qa',
      recordSessionExport: 'session_export',
      recordBugReport: 'bug_report',
      recordTesterFeedback: 'tester_feedback',
      recordTestQueue: 'test_queue',
      recordTestReportBundle: 'test_report_bundle',
      recordDemoCertification: 'demo_certification',
      recordPilotReady: 'pilot_ready'
    };
    Object.entries(recorderMap).forEach(([method, type]) => {
      if (typeof this[method] !== 'function') {
        this[method] = (payload) => this.enqueue(type, payload || {});
      }
    });
  },

  async healthCheck() {
    if (!this.apiBase) return false;
    try {
      const res = await fetch(`${this.apiBase}/api/health`, { cache: 'no-store' });
      this.apiOnline = !!res.ok;
      window.dispatchEvent(new CustomEvent('svr_api_status', { detail: { online: this.apiOnline, build: this.build } }));
      return this.apiOnline;
    } catch (_) {
      this.apiOnline = false;
      return false;
    }
  },

  enqueue(type, payload) {
    const safePayload = { type, build: this.build, at: new Date().toISOString(), payload };
    this.pending.push(safePayload);
    if (this.pending.length > 75) this.pending.shift();
    this.flush();
  },


  recordGeneric(endpoint, payload) {
    this.enqueue(endpoint || 'generic', payload || {});
  },

  queue(type, payload) { this.enqueue(type || 'generic', payload || {}); },
  postTelemetry(type, payload) { this.enqueue(type || 'telemetry', payload || {}); },

  recordHandResult(payload) { this.enqueue('hand_result', payload); },
  recordPlayerAction(payload) { this.enqueue('player_action', payload); },
  recordActionLog(payload) { this.enqueue('action_log', payload); },
  recordLegalActions(payload) { this.enqueue('legal_actions', payload); },
  recordShowdown(payload) { this.enqueue('showdown_reveal', payload); },
  recordSidePot(payload) { this.enqueue('side_pot_resolution', payload); },
  recordTurnIndicator(payload) { this.enqueue('turn_indicator', payload); },
  recordWatchTurnIndicator(payload) { this.enqueue('watch_turn_indicator', payload); },
  recordDealerButton(payload) { this.enqueue('dealer_button', payload); },
  recordRebuy(payload) { this.enqueue('rebuy', payload); },
  recordDecisionAid(payload) { this.enqueue('decision_aid', payload); },
  recordAllIn(payload) { this.enqueue('allin_update', payload); },
  recordFoldEligibility(payload) { this.enqueue('fold_eligibility', payload); },
  recordDeployPreflight(payload) { this.enqueue('deploy_preflight', payload); },
  recordSmokeTest(payload) { this.enqueue('smoke_test', payload); },
  recordReleaseCandidate(payload) { this.enqueue('release_candidate', payload); },
  recordRuntimeQA(payload) { this.enqueue('runtime_qa', payload); },
  recordSessionExport(payload) { this.enqueue('session_export', payload); },
  recordBugReport(payload) { this.enqueue('bug_report', payload); },
  recordTesterFeedback(payload) { this.enqueue('tester_feedback', payload); },
  recordTestQueue(payload) { this.enqueue('test_queue', payload); },
  recordTestReportBundle(payload) { this.enqueue('test_report_bundle', payload); },
  recordDemoCertification(payload) { this.enqueue('demo_certification', payload); },
  recordPilotReady(payload) { this.enqueue('pilot_ready', payload); },
  recordTelemetry(payload) { this.enqueue('runtime_telemetry', payload); },

  async flush() {
    if (!this.apiBase || this.pending.length === 0) return;
    const copy = [...this.pending];
    try {
      const res = await fetch(`${this.apiBase}/api/game/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: copy }),
        keepalive: true,
      });
      if (res.ok) this.pending.splice(0, copy.length);
    } catch (_) {
      // Keep queue in memory only. Never block the VR render path.
    }
  }
};

SVREnterpriseBridge.init();
