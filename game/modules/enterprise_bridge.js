/**
 * SVR Poker — Enterprise Bridge
 * Build: PHASE-177-HAND-HISTORY-STACK-LOCK
 * Safe browser-side bridge: no SQL strings, no API secrets, no Stripe secrets.
 */
const SVREnterpriseBridge = {
  build: 'PHASE-177-HAND-HISTORY-STACK-LOCK',
  apiBase: window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '',
  pending: [],
  apiOnline: false,

  init() {
    window.SVREnterpriseBridge = this;
    window.addEventListener('svr_poker_hand_result', (event) => this.recordHandResult(event.detail || {}));
    window.addEventListener('svr_poker_player_action', (event) => this.recordPlayerAction(event.detail || {}));
    window.addEventListener('svr_runtime_telemetry', (event) => this.recordTelemetry(event.detail || {}));
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
    if (this.pending.length > 50) this.pending.shift();
    this.flush();
  },

  recordHandResult(payload) { this.enqueue('hand_result', payload); },
  recordPlayerAction(payload) { this.enqueue('player_action', payload); },
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
