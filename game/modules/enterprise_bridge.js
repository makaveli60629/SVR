/**
 * SVR Poker — Enterprise Bridge
 * Build: PHASE-204-EVENT-FIREWALL-BRIDGE-HARDENING-LOCK
 * Safe browser-side bridge: no SQL strings, no API secrets, no Stripe secrets.
 */
const SVREnterpriseBridge = {
  build: 'PHASE-204-EVENT-FIREWALL-BRIDGE-HARDENING-LOCK',
  apiBase: window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '',
  pending: [],
  apiOnline: false,
  installedListeners: [],

  init() {
    window.SVREnterpriseBridge = this;
    window.SVR_ENTERPRISE_BRIDGE = this;
    this.ensureRecorderSurface();
    this.installListeners();
    this.healthCheck();
    setInterval(() => this.flush(), 15000);
  },

  installListeners(){
    const listeners = [
      ['svr_poker_hand_result', 'recordHandResult'],
      ['svr_poker_player_action', 'recordPlayerAction'],
      ['svr_poker_action_log_update', 'recordActionLog'],
      ['svr_poker_legal_actions_update', 'recordLegalActions'],
      ['svr_poker_showdown_reveal', 'recordShowdown'],
      ['svr_poker_side_pot_resolution', 'recordSidePot'],
      ['svr_poker_turn_indicator_update', 'recordTurnIndicator'],
      ['svr_watch_turn_indicator_update', 'recordWatchTurnIndicator'],
      ['svr_poker_dealer_button_update', 'recordDealerButton'],
      ['svr_poker_rebuy_update', 'recordRebuy'],
      ['svr_poker_decision_aid_update', 'recordDecisionAid'],
      ['svr_runtime_telemetry', 'recordTelemetry'],
      ['svr_poker_allin_update', 'recordAllIn'],
      ['svr_poker_fold_eligibility_update', 'recordFoldEligibility'],
      ['svr_deploy_preflight_update', 'recordDeployPreflight'],
      ['svr_smoke_test_result', 'recordSmokeTest'],
      ['svr_release_candidate_update', 'recordReleaseCandidate'],
      ['svr_runtime_qa_snapshot', 'recordRuntimeQA'],
      ['svr_session_export_update', 'recordSessionExport'],
      ['svr_bug_report_update', 'recordBugReport'],
      ['svr_tester_feedback_update', 'recordTesterFeedback'],
      ['svr_test_queue_update', 'recordTestQueue'],
      ['svr_test_report_bundle_update', 'recordTestReportBundle'],
      ['svr_demo_certification_update', 'recordDemoCertification'],
      ['svr_pilot_testing_ready_update', 'recordPilotReady'],
      ['svr_event_firewall_update', 'recordEventFirewall'],
      ['svr_event_firewall_error', 'recordEventFirewallError'],
      ['svr_playtest_wizard_update', 'recordPlaytestWizard']
    ];
    listeners.forEach(([eventName, methodName]) => this.safeListen(eventName, methodName));
  },

  safeListen(eventName, methodName){
    const handler = (event) => {
      try {
        if (typeof this[methodName] !== 'function') {
          this.ensureRecorderSurface();
        }
        if (typeof this[methodName] === 'function') {
          this[methodName](event?.detail || {});
        } else {
          this.enqueue(`missing_recorder:${methodName}`, event?.detail || {});
        }
      } catch (error) {
        this.recordBridgeError({ eventName, methodName, message: error?.message || String(error), stack: error?.stack || null });
      }
    };
    window.addEventListener(eventName, handler);
    this.installedListeners.push({ eventName, methodName });
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
      recordPilotReady: 'pilot_ready',
      recordEventFirewall: 'event_firewall',
      recordEventFirewallError: 'event_firewall_error',
      recordPlaytestWizard: 'playtest_wizard'
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

  safePayload(payload){
    try { return JSON.parse(JSON.stringify(payload ?? {})); }
    catch (_) { return { unserializable: true, summary: String(payload) }; }
  },

  enqueue(type, payload) {
    const safePayload = { type, build: this.build, at: new Date().toISOString(), payload: this.safePayload(payload) };
    this.pending.push(safePayload);
    if (this.pending.length > 75) this.pending.shift();
    this.flush();
  },

  recordGeneric(endpoint, payload) { this.enqueue(endpoint || 'generic', payload || {}); },
  queue(type, payload) { this.enqueue(type || 'generic', payload || {}); },
  postTelemetry(type, payload) { this.enqueue(type || 'telemetry', payload || {}); },

  recordBridgeError(payload) {
    this.pending.push({ type: 'bridge_error', build: this.build, at: new Date().toISOString(), payload: this.safePayload(payload) });
    if (this.pending.length > 75) this.pending.shift();
    try { window.SVR_EVENT_FIREWALL?.recordError?.('enterprise_bridge_error', payload?.message || 'bridge error', payload); } catch (_) {}
  },

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
  recordEventFirewall(payload) { this.enqueue('event_firewall', payload); },
  recordEventFirewallError(payload) { this.enqueue('event_firewall_error', payload); },
  recordPlaytestWizard(payload) { this.enqueue('playtest_wizard', payload); },

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
export default SVREnterpriseBridge;
