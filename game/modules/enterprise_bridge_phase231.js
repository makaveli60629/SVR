/**
 * SVR Poker — Enterprise Bridge Phase 205
 * Build: PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK
 * Purpose: cache-busted bridge with safe recorder aliases so poker events cannot crash the render loop.
 * Safe browser-side bridge: no SQL strings, no API secrets, no Stripe secrets.
 */
const BUILD = 'PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK';

const EVENT_TO_RECORDER = [
  ['svr_poker_hand_result', 'recordHandResult', 'hand_result'],
  ['svr_poker_player_action', 'recordPlayerAction', 'player_action'],
  ['svr_poker_action_log_update', 'recordActionLog', 'action_log'],
  ['svr_poker_legal_actions_update', 'recordLegalActions', 'legal_actions'],
  ['svr_poker_showdown_reveal', 'recordShowdown', 'showdown_reveal'],
  ['svr_poker_side_pot_resolution', 'recordSidePot', 'side_pot_resolution'],
  ['svr_poker_turn_indicator_update', 'recordTurnIndicator', 'turn_indicator'],
  ['svr_watch_turn_indicator_update', 'recordWatchTurnIndicator', 'watch_turn_indicator'],
  ['svr_poker_dealer_button_update', 'recordDealerButton', 'dealer_button'],
  ['svr_poker_rebuy_update', 'recordRebuy', 'rebuy'],
  ['svr_poker_decision_aid_update', 'recordDecisionAid', 'decision_aid'],
  ['svr_runtime_telemetry', 'recordTelemetry', 'runtime_telemetry'],
  ['svr_poker_allin_update', 'recordAllIn', 'allin_update'],
  ['svr_poker_fold_eligibility_update', 'recordFoldEligibility', 'fold_eligibility'],
  ['svr_deploy_preflight_update', 'recordDeployPreflight', 'deploy_preflight'],
  ['svr_smoke_test_result', 'recordSmokeTest', 'smoke_test'],
  ['svr_release_candidate_update', 'recordReleaseCandidate', 'release_candidate'],
  ['svr_runtime_qa_snapshot', 'recordRuntimeQA', 'runtime_qa'],
  ['svr_session_export_update', 'recordSessionExport', 'session_export'],
  ['svr_bug_report_update', 'recordBugReport', 'bug_report'],
  ['svr_tester_feedback_update', 'recordTesterFeedback', 'tester_feedback'],
  ['svr_test_queue_update', 'recordTestQueue', 'test_queue'],
  ['svr_test_report_bundle_update', 'recordTestReportBundle', 'test_report_bundle'],
  ['svr_demo_certification_update', 'recordDemoCertification', 'demo_certification'],
  ['svr_pilot_testing_ready_update', 'recordPilotReady', 'pilot_ready'],
  ['svr_event_firewall_update', 'recordEventFirewall', 'event_firewall'],
  ['svr_event_firewall_error', 'recordEventFirewallError', 'event_firewall_error'],
  ['svr_playtest_wizard_update', 'recordPlaytestWizard', 'playtest_wizard'],
  ['svr_game_boot_report', 'recordBootReport', 'boot_report'],
  ['svr_boot_guard_report', 'recordBootGuard', 'boot_guard'],
  ['svr_boot_fallback_report', 'recordBootFallback', 'boot_fallback']
];

const METHOD_TO_TYPE = Object.fromEntries(EVENT_TO_RECORDER.map(([, method, type]) => [method, type]));

const SVREnterpriseBridge = {
  build: BUILD,
  apiBase: window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '',
  pending: [],
  apiOnline: false,
  installedListeners: [],
  listenerErrors: [],

  init() {
    window.SVREnterpriseBridge = this;
    window.SVR_ENTERPRISE_BRIDGE = this;
    this.ensureRecorderSurface();
    this.installListeners();
    this.healthCheck();
    setInterval(() => this.flush(), 15000);
    this.enqueue('bridge_ready', { build: this.build, recorderCount: Object.keys(METHOD_TO_TYPE).length });
  },

  ensureRecorderSurface() {
    Object.entries(METHOD_TO_TYPE).forEach(([method, type]) => {
      if (typeof this[method] !== 'function') {
        this[method] = (payload = {}) => this.enqueue(type, payload);
      }
    });
    if (typeof this.queue !== 'function') this.queue = (type, payload = {}) => this.enqueue(type || 'generic', payload);
    if (typeof this.postTelemetry !== 'function') this.postTelemetry = (type, payload = {}) => this.enqueue(type || 'telemetry', payload);
    if (typeof this.recordGeneric !== 'function') this.recordGeneric = (type, payload = {}) => this.enqueue(type || 'generic', payload);
  },

  installListeners() {
    EVENT_TO_RECORDER.forEach(([eventName, methodName, type]) => this.safeListen(eventName, methodName, type));
  },

  safeListen(eventName, methodName, type) {
    const handler = (event) => {
      try {
        this.ensureRecorderSurface();
        const fn = this[methodName];
        const detail = event?.detail || {};
        if (typeof fn === 'function') fn.call(this, detail);
        else this.enqueue(type || `missing_recorder:${methodName}`, detail);
      } catch (error) {
        this.recordBridgeError({ eventName, methodName, message: error?.message || String(error), stack: error?.stack || null });
      }
    };
    try {
      window.addEventListener(eventName, handler);
      this.installedListeners.push({ eventName, methodName, type });
    } catch (error) {
      this.recordBridgeError({ eventName, methodName, message: error?.message || String(error), installFailed: true });
    }
  },

  safePayload(payload) {
    try { return JSON.parse(JSON.stringify(payload ?? {})); }
    catch (_) { return { unserializable: true, summary: String(payload).slice(0, 1200) }; }
  },

  enqueue(type, payload = {}) {
    const event = { type: type || 'generic', build: this.build, at: new Date().toISOString(), payload: this.safePayload(payload) };
    this.pending.push(event);
    if (this.pending.length > 100) this.pending.shift();
    try { window.dispatchEvent(new CustomEvent('svr_enterprise_bridge_queue', { detail: event })); } catch (_) {}
    this.flush();
  },

  recordBridgeError(payload = {}) {
    const safe = { type: 'bridge_error', build: this.build, at: new Date().toISOString(), payload: this.safePayload(payload) };
    this.listenerErrors.push(safe);
    if (this.listenerErrors.length > 30) this.listenerErrors.shift();
    this.pending.push(safe);
    if (this.pending.length > 100) this.pending.shift();
    try { window.SVR_EVENT_FIREWALL?.recordError?.('enterprise_bridge_error', payload?.message || 'bridge error', payload); } catch (_) {}
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
      // Keep queue in memory only. Never block render/game loop.
    }
  }
};

// Explicit concrete methods remain here for grep/tests and to avoid future alias misses.
Object.entries(METHOD_TO_TYPE).forEach(([method, type]) => {
  if (typeof SVREnterpriseBridge[method] !== 'function') {
    SVREnterpriseBridge[method] = function(payload = {}) { this.enqueue(type, payload); };
  }
});

SVREnterpriseBridge.init();
export default SVREnterpriseBridge;

// Phase 242 compatibility alias enterprise_bridge_phase231.js
