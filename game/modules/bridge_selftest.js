/**
 * SVR Poker — Bridge Self-Test & Auto-Heal Module
 * Build: PHASE-219-AUTO-APPLY-VERIFY-LOCK
 * Purpose: verify bridge recorder methods at runtime, patch missing aliases, and emit a clear health report without stopping the game loop.
 */
const BUILD = 'PHASE-219-AUTO-APPLY-VERIFY-LOCK';
const REQUIRED_RECORDERS = [
  'recordHandResult','recordPlayerAction','recordActionLog','recordLegalActions','recordShowdown','recordSidePot',
  'recordTurnIndicator','recordWatchTurnIndicator','recordDealerButton','recordRebuy','recordDecisionAid','recordTelemetry',
  'recordAllIn','recordFoldEligibility','recordDeployPreflight','recordSmokeTest','recordReleaseCandidate','recordRuntimeQA',
  'recordSessionExport','recordBugReport','recordTesterFeedback','recordTestQueue','recordTestReportBundle','recordDemoCertification',
  'recordPilotReady','recordEventFirewall','recordEventFirewallError','recordPlaytestWizard','recordBootReport','recordBootGuard','recordBootFallback'
];

function safePayload(value){
  try { return JSON.parse(JSON.stringify(value ?? {})); }
  catch (_) { return { unserializable: true, summary: String(value).slice(0, 1000) }; }
}

const SVRBridgeSelfTest = {
  build: BUILD,
  reports: [],
  lastReport: null,
  init(){
    window.SVR_BRIDGE_SELFTEST = this;
    this.run('startup');
    window.addEventListener('svr_game_ready', () => this.run('game_ready'));
    window.addEventListener('svr_poker_decision_aid_update', () => this.run('decision_aid_event'));
    window.addEventListener('svr_poker_dealer_button_update', () => this.run('dealer_button_event'));
    setTimeout(() => this.run('late_2s'), 2000);
    setTimeout(() => this.run('late_8s'), 8000);
  },
  getBridge(){
    return window.SVR_ENTERPRISE_BRIDGE || window.SVREnterpriseBridge || null;
  },
  patchBridge(bridge){
    if (!bridge) return { patched: [], missing: REQUIRED_RECORDERS.slice(), bridgePresent: false };
    const patched = [];
    REQUIRED_RECORDERS.forEach((method) => {
      if (typeof bridge[method] !== 'function') {
        bridge[method] = function(payload = {}) {
          const type = method.replace(/^record/, '').replace(/[A-Z]/g, m => '_' + m.toLowerCase()).replace(/^_/, '') || 'generic';
          if (typeof this.enqueue === 'function') this.enqueue(type, payload);
          else if (Array.isArray(this.pending)) this.pending.push({ type, build: BUILD, at: new Date().toISOString(), payload: safePayload(payload) });
        };
        patched.push(method);
      }
    });
    if (typeof bridge.queue !== 'function') {
      bridge.queue = function(type, payload = {}) { if (typeof this.enqueue === 'function') this.enqueue(type || 'generic', payload); };
      patched.push('queue');
    }
    if (typeof bridge.postTelemetry !== 'function') {
      bridge.postTelemetry = function(type, payload = {}) { if (typeof this.enqueue === 'function') this.enqueue(type || 'telemetry', payload); };
      patched.push('postTelemetry');
    }
    const missing = REQUIRED_RECORDERS.filter((method) => typeof bridge[method] !== 'function');
    return { patched, missing, bridgePresent: true };
  },
  run(reason='manual'){
    const bridge = this.getBridge();
    const status = this.patchBridge(bridge);
    const report = {
      build: BUILD,
      reason,
      at: new Date().toISOString(),
      ok: !!status.bridgePresent && status.missing.length === 0,
      bridgePresent: !!status.bridgePresent,
      patched: status.patched,
      missing: status.missing,
      recorderCount: REQUIRED_RECORDERS.length
    };
    this.lastReport = report;
    this.reports.unshift(report);
    this.reports = this.reports.slice(0, 25);
    try { window.dispatchEvent(new CustomEvent('svr_bridge_selftest_update', { detail: report })); } catch (_) {}
    try { bridge?.recordGeneric?.('bridge_selftest', report); } catch (_) {}
    try { bridge?.queue?.('bridge_selftest', report); } catch (_) {}
    return report;
  },
  copy(){
    const text = JSON.stringify(this.lastReport || this.run('copy'), null, 2);
    return navigator.clipboard?.writeText(text).catch(()=>{}) || Promise.resolve();
  }
};

SVRBridgeSelfTest.init();
export default SVRBridgeSelfTest;
