/**
 * SVR Poker — Runtime QA Snapshot Module
 * Build: PHASE-199-DEMO-CERTIFICATION-LOCK
 * Purpose: give tester/admin a fast, non-secret runtime snapshot without touching the public page.
 */
const BUILD = 'PHASE-199-DEMO-CERTIFICATION-LOCK';
const SVRRuntimeQA = {
  build: BUILD,
  startedAt: new Date().toISOString(),
  snapshot: {
    build: BUILD,
    startedAt: '',
    lastEvent: 'booting',
    eventCount: 0,
    poker: {},
    legal: {},
    decisionAid: {},
    turn: {},
    watch: {},
    sidePots: {},
    allIn: {},
    dealer: {},
    rebuys: {},
    errors: []
  },
  panel: null,
  visible: false,

  init() {
    this.snapshot.startedAt = this.startedAt;
    window.SVR_RUNTIME_QA = this.snapshot;
    this.buildPanel();
    this.bindEvents();
    this.publish('init');
  },

  buildPanel() {
    if (document.getElementById('svr-runtime-qa-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-runtime-qa-panel';
    panel.style.cssText = [
      'position:fixed','right:12px','top:62px','z-index:45','max-width:360px','max-height:56vh','overflow:auto',
      'display:none','background:rgba(2,4,12,.84)','color:#dfffee','border:1px solid rgba(126,240,208,.45)',
      'box-shadow:0 14px 36px rgba(0,0,0,.55)','border-radius:14px','padding:10px 12px',
      'font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace','white-space:pre-wrap','pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  bindEvents() {
    const capture = (name, key) => window.addEventListener(name, (event) => {
      const detail = event.detail || {};
      this.snapshot.eventCount += 1;
      this.snapshot.lastEvent = name;
      if (key) this.snapshot[key] = this.slim(detail);
      this.publish(name);
    });

    capture('svr_poker_history_update', 'poker');
    capture('svr_poker_action_log_update', 'actionLog');
    capture('svr_poker_legal_actions_update', 'legal');
    capture('svr_poker_decision_aid_update', 'decisionAid');
    capture('svr_poker_turn_indicator_update', 'turn');
    capture('svr_watch_turn_indicator_update', 'watch');
    capture('svr_poker_side_pot_resolution', 'sidePots');
    capture('svr_poker_allin_update', 'allIn');
    capture('svr_poker_dealer_button_update', 'dealer');
    capture('svr_poker_rebuy_update', 'rebuys');
    capture('svr_runtime_telemetry', 'runtime');

    window.addEventListener('error', (event) => this.addError(event.message || 'runtime error'));
    window.addEventListener('unhandledrejection', (event) => this.addError(String(event.reason || 'unhandled rejection')));
    window.addEventListener('keydown', (event) => {
      if (event.key && event.key.toLowerCase() === 'q') this.togglePanel();
    });
  },

  slim(value) {
    try {
      const json = JSON.parse(JSON.stringify(value));
      if (json.actions && Array.isArray(json.actions)) json.actions = json.actions.slice(0, 6);
      if (json.history && Array.isArray(json.history)) json.history = json.history.slice(0, 5);
      if (json.ledger && Array.isArray(json.ledger)) json.ledger = json.ledger.slice(0, 5);
      return json;
    } catch (_) {
      return { value: String(value).slice(0, 240) };
    }
  },

  addError(message) {
    this.snapshot.errors.unshift({ message: String(message).slice(0, 240), at: new Date().toISOString() });
    this.snapshot.errors = this.snapshot.errors.slice(0, 8);
    this.publish('error');
  },

  togglePanel() {
    this.visible = !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    this.render();
  },

  render() {
    if (!this.panel || !this.visible) return;
    const s = this.snapshot;
    const legal = s.legal?.legal || s.legal || {};
    const decision = s.decisionAid?.decisionAid || s.decisionAid || {};
    const turn = s.turn || {};
    const dealer = s.dealer || {};
    this.panel.textContent = [
      `SVR QA SNAPSHOT`,
      `BUILD: ${s.build}`,
      `EVENTS: ${s.eventCount} • LAST: ${s.lastEvent}`,
      `TURN: ${turn.actor || '-'} ${turn.stage || ''} ${turn.remaining ?? ''}`,
      `LEGAL: ${(legal.options || []).join('/')} call $${legal.callAmount ?? 0} min raise $${legal.minRaise ?? 0}`,
      `DECISION: ${decision.pressure || '-'} • odds ${decision.potOddsPct ?? 0}%`,
      `DEALER: ${dealer.line || '-'}`,
      `ERRORS: ${s.errors.length}`,
      `Toggle: Q`
    ].join('\n');
  },

  publish(reason) {
    this.snapshot.updatedAt = new Date().toISOString();
    this.snapshot.reason = reason;
    window.SVR_RUNTIME_QA = this.snapshot;
    this.render();
    try {
      window.dispatchEvent(new CustomEvent('svr_runtime_qa_snapshot', { detail: this.snapshot }));
    } catch (_) {}
  }
};

SVRRuntimeQA.init();
