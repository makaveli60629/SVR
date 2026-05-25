/**
 * SVR Poker — Session Export Module
 * Build: PHASE-219-AUTO-APPLY-VERIFY-LOCK
 * Purpose: capture a compact testing transcript that can be copied/downloaded after a playtest.
 * No public-page edits, no secrets, no SQL strings.
 */
const BUILD = 'PHASE-219-AUTO-APPLY-VERIFY-LOCK';
const MAX_EVENTS = 80;
const MAX_SNAPSHOTS = 12;

const SESSION_EVENT_MAP = {
  svr_runtime_qa_snapshot: 'qa_snapshot',
  svr_poker_history_update: 'hand_history',
  svr_poker_action_log_update: 'action_log',
  svr_poker_legal_actions_update: 'legal_actions',
  svr_poker_decision_aid_update: 'decision_aid',
  svr_watch_turn_indicator_update: 'watch_turn',
  svr_poker_turn_indicator_update: 'turn_indicator',
  svr_poker_showdown_reveal: 'showdown',
  svr_poker_side_pot_resolution: 'side_pots',
  svr_poker_allin_update: 'all_in',
  svr_poker_dealer_button_update: 'dealer_button',
  svr_poker_rebuy_update: 'rebuy',
  svr_runtime_telemetry: 'runtime_telemetry'
};

function cloneSlim(value) {
  try {
    const out = JSON.parse(JSON.stringify(value || {}));
    if (out.actions && Array.isArray(out.actions)) out.actions = out.actions.slice(0, 10);
    if (out.history && Array.isArray(out.history)) out.history = out.history.slice(0, 10);
    if (out.ledger && Array.isArray(out.ledger)) out.ledger = out.ledger.slice(0, 10);
    if (out.snapshots && Array.isArray(out.snapshots)) out.snapshots = out.snapshots.slice(0, 4);
    return out;
  } catch (_) {
    return { value: String(value).slice(0, 280) };
  }
}

function nowIso() { return new Date().toISOString(); }

const SVRSessionExport = {
  build: BUILD,
  startedAt: nowIso(),
  events: [],
  snapshots: [],
  latest: {},
  lastDownloadUrl: '',

  init() {
    window.SVR_SESSION_EXPORT = this;
    this.bindEvents();
    this.bindKeys();
    this.record('session_export_ready', { build: BUILD });
    this.publish('ready');
  },

  bindEvents() {
    Object.keys(SESSION_EVENT_MAP).forEach(eventName => {
      window.addEventListener(eventName, (event) => {
        const type = SESSION_EVENT_MAP[eventName];
        const detail = cloneSlim(event.detail || {});
        this.latest[type] = detail;
        if (type === 'qa_snapshot') {
          this.snapshots.unshift({ at: nowIso(), detail });
          this.snapshots = this.snapshots.slice(0, MAX_SNAPSHOTS);
        }
        this.record(type, detail);
      });
    });
    window.addEventListener('error', event => this.record('runtime_error', { message: event.message || 'runtime error' }));
    window.addEventListener('unhandledrejection', event => this.record('unhandled_rejection', { message: String(event.reason || 'unhandled rejection').slice(0, 300) }));
  },

  bindKeys() {
    window.addEventListener('keydown', async (event) => {
      const key = (event.key || '').toLowerCase();
      if (key === 'x') this.download();
      if (key === 'y') await this.copyToClipboard();
    });
  },

  record(type, detail = {}) {
    const clean = cloneSlim(detail);
    const item = { at: nowIso(), type, detail: clean };
    this.events.unshift(item);
    this.events = this.events.slice(0, MAX_EVENTS);
    this.publish(type);
  },

  exportObject() {
    return {
      build: BUILD,
      startedAt: this.startedAt,
      exportedAt: nowIso(),
      url: location.pathname + location.search,
      userAgent: navigator.userAgent,
      latest: cloneSlim(this.latest),
      snapshots: cloneSlim(this.snapshots),
      events: cloneSlim(this.events)
    };
  },

  exportJson(space = 2) {
    return JSON.stringify(this.exportObject(), null, space);
  },

  download(filename = '') {
    const safeName = filename || `svr-session-${BUILD.toLowerCase()}-${Date.now()}.json`;
    const blob = new Blob([this.exportJson(2)], { type: 'application/json' });
    if (this.lastDownloadUrl) URL.revokeObjectURL(this.lastDownloadUrl);
    const url = URL.createObjectURL(blob);
    this.lastDownloadUrl = url;
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.record('session_export_downloaded', { filename: safeName, eventCount: this.events.length });
    return safeName;
  },

  async copyToClipboard() {
    const text = this.exportJson(2);
    try {
      await navigator.clipboard.writeText(text);
      this.record('session_export_copied', { chars: text.length });
      return true;
    } catch (error) {
      this.record('session_export_copy_failed', { message: String(error?.message || error).slice(0, 240) });
      return false;
    }
  },

  publish(reason) {
    try {
      window.dispatchEvent(new CustomEvent('svr_session_export_update', {
        detail: { build: BUILD, reason, eventCount: this.events.length, latest: cloneSlim(this.latest) }
      }));
    } catch (_) {}
  }
};

SVRSessionExport.init();
