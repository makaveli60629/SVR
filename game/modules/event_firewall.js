/**
 * SVR Poker — Runtime Event Firewall
 * Build: PHASE-213-BOOT-ROUTE-RECOVERY-LINK-LOCK
 * Captures high-risk runtime events and errors without touching the public page.
 */
const BUILD = 'PHASE-213-BOOT-ROUTE-RECOVERY-LINK-LOCK';
const MAX_ITEMS = 120;

function safeDetail(value){
  try { return JSON.parse(JSON.stringify(value ?? {})); }
  catch (_) { return { unserializable: true, summary: String(value) }; }
}

const SVREventFirewall = {
  build: BUILD,
  events: [],
  errors: [],
  last: null,

  init(){
    window.SVR_EVENT_FIREWALL = this;
    this.installGlobalErrorHooks();
    this.installEventMirrors();
    this.record('firewall_ready', { message: 'Runtime event firewall active.' });
  },

  record(type, payload = {}){
    const item = { type, build: BUILD, at: new Date().toISOString(), payload: safeDetail(payload) };
    this.last = item;
    this.events.unshift(item);
    if (this.events.length > MAX_ITEMS) this.events.length = MAX_ITEMS;
    try { window.dispatchEvent(new CustomEvent('svr_event_firewall_update', { detail: this.snapshot(false) })); } catch (_) {}
    return item;
  },

  recordError(type, error, context = {}){
    const item = {
      type,
      build: BUILD,
      at: new Date().toISOString(),
      message: error?.message || String(error || 'Unknown runtime error'),
      stack: error?.stack || null,
      context: safeDetail(context)
    };
    this.errors.unshift(item);
    if (this.errors.length > MAX_ITEMS) this.errors.length = MAX_ITEMS;
    try { window.dispatchEvent(new CustomEvent('svr_event_firewall_error', { detail: item })); } catch (_) {}
    return item;
  },

  installGlobalErrorHooks(){
    window.addEventListener('error', (event) => {
      this.recordError('window_error', event?.error || event?.message || 'window error', {
        filename: event?.filename,
        lineno: event?.lineno,
        colno: event?.colno
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandled_rejection', event?.reason || 'unhandled rejection');
    });
  },

  installEventMirrors(){
    const watched = [
      'svr_game_ready','svr_boot_fallback_report','svr_runtime_telemetry',
      'svr_poker_dealer_button_update','svr_poker_rebuy_update','svr_poker_decision_aid_update',
      'svr_poker_allin_update','svr_poker_fold_eligibility_update','svr_poker_turn_indicator_update',
      'svr_watch_turn_indicator_update','svr_poker_legal_actions_update','svr_poker_action_log_update',
      'svr_poker_showdown_reveal','svr_poker_side_pot_resolution','svr_poker_hand_result',
      'svr_deploy_preflight_update','svr_smoke_test_result','svr_release_candidate_update',
      'svr_runtime_qa_snapshot','svr_session_export_update','svr_bug_report_update',
      'svr_tester_feedback_update','svr_test_queue_update','svr_test_report_bundle_update',
      'svr_demo_certification_update','svr_pilot_testing_ready_update'
    ];
    watched.forEach((name) => {
      window.addEventListener(name, (event) => {
        this.record(name, { detail: event?.detail || {} });
      }, { capture: true });
    });
  },

  snapshot(includeFull = true){
    return {
      build: BUILD,
      at: new Date().toISOString(),
      eventCount: this.events.length,
      errorCount: this.errors.length,
      last: this.last,
      events: includeFull ? this.events.slice(0, MAX_ITEMS) : this.events.slice(0, 10),
      errors: includeFull ? this.errors.slice(0, MAX_ITEMS) : this.errors.slice(0, 10)
    };
  },

  download(){
    const blob = new Blob([JSON.stringify(this.snapshot(true), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `svr-event-firewall-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
};

SVREventFirewall.init();
export default SVREventFirewall;
