/**
 * SVR Poker — Enterprise Bridge
 * Build: PHASE-194-PLAYTEST-WIZARD-LOCK
 * Safe browser-side bridge: no SQL strings, no API secrets, no Stripe secrets.
 */
const SVREnterpriseBridge = {
  build: 'PHASE-194-PLAYTEST-WIZARD-LOCK',
  apiBase: window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '',
  pending: [],
  apiOnline: false,

  init() {
    window.SVREnterpriseBridge = this;
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
    window.addEventListener('svr_playtest_wizard_update', (event) => this.recordGeneric('/api/game/playtest-wizard', event.detail || {}));
    this.healthCheck();
    setInterval(() => this.flush(), 15000);
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
    this.queue(endpoint, payload || {});
  },

  recordHandResult(payload) { this.enqueue('hand_result', payload); },
  recordPlayerAction(payload) { this.enqueue('player_action', payload); },
  recordActionLog(payload) { this.enqueue('action_log', payload); },
  recordLegalActions(payload) { this.enqueue('legal_actions', payload); },
  recordShowdown(payload) { this.enqueue('showdown_reveal', payload); },
  recordSidePot(payload) { this.enqueue('side_pot_resolution', payload); },
  recordTurnIndicator(payload) { this.enqueue('turn_indicator', payload); },
  recordWatchTurnIndicator(payload) { this.enqueue('watch_turn_indicator', payload); },
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
