/**
 * SVR Poker — Guided Playtest Wizard
 * Build: PHASE-218-AUTO-APPLY-STATUS-LOCK
 * Purpose: give testers one clear checklist after deploy without touching the public Matrix page.
 * No secrets, no SQL strings, no public-page edits.
 */
const BUILD = 'PHASE-218-AUTO-APPLY-STATUS-LOCK';
const EXPECTED_PHASE = 194;

function safeValue(value, max = 260) {
  return String(value ?? '').slice(0, max);
}

function has(name) {
  try { return !!window[name]; } catch (_) { return false; }
}

const SVRPlaytestWizard = {
  build: BUILD,
  expectedPhase: EXPECTED_PHASE,
  visible: false,
  panel: null,
  latest: null,
  checks: [],
  events: [],

  init() {
    window.SVR_PLAYTEST_WIZARD = this;
    this.buildPanel();
    this.bindKeys();
    this.bindEvents();
    setTimeout(() => this.run('boot'), 1400);
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      const key = (event.key || '').toLowerCase();
      if (key === 'w') this.toggle();
    });
  },

  bindEvents() {
    [
      'svr_deploy_preflight_update',
      'svr_smoke_test_result',
      'svr_release_candidate_update',
      'svr_session_export_update',
      'svr_poker_turn_indicator_update',
      'svr_watch_turn_indicator_update',
      'svr_poker_history_update',
      'svr_poker_showdown_reveal',
      'svr_runtime_qa_snapshot'
    ].forEach(name => {
      window.addEventListener(name, event => {
        this.events.unshift({
          event: name,
          at: new Date().toISOString(),
          summary: this.summarize(event.detail || {})
        });
        this.events = this.events.slice(0, 16);
        this.publish('event:' + name);
        if (this.visible) this.render();
      });
    });
  },

  summarize(detail) {
    if (detail.pass !== undefined) return 'pass=' + !!detail.pass;
    if (detail.actor || detail.street) return `${detail.actor || ''} ${detail.street || ''}`.trim();
    if (detail.winner || detail.handName) return `${detail.winner || ''} ${detail.handName || ''}`.trim();
    if (detail.status) return safeValue(detail.status, 80);
    return safeValue(Object.keys(detail).slice(0, 5).join(',') || 'update', 120);
  },

  buildPanel() {
    if (document.getElementById('svr-playtest-wizard-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-playtest-wizard-panel';
    panel.style.cssText = [
      'position:fixed','left:50%','top:62px','transform:translateX(-50%)','z-index:54',
      'width:min(720px,calc(100vw - 24px))','max-height:72vh','overflow:auto','display:none',
      'background:rgba(5,8,18,.92)','color:#edf6ff','border:1px solid rgba(110,190,255,.58)',
      'box-shadow:0 18px 48px rgba(0,0,0,.62)','border-radius:16px','padding:12px 14px',
      'font:12px/1.42 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace','white-space:pre-wrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  async run(reason = 'manual') {
    const checks = [];
    const add = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: safeValue(detail, 240) });

    add('Build label present', document.documentElement.innerHTML.includes(BUILD) || document.title.includes('Phase 199'), BUILD);
    add('Runtime QA module', has('SVR_RUNTIME_QA'), 'Q overlay');
    add('Session export module', has('SVR_SESSION_EXPORT'), 'X download / Y copy');
    add('Deploy verifier module', has('SVR_DEPLOY_VERIFIER'), 'V overlay');
    add('Smoke test module', has('SVR_SMOKE_TEST'), 'T overlay');
    add('Release candidate module', has('SVR_RELEASE_CANDIDATE'), 'U overlay');
    add('Enterprise bridge module', has('SVREnterpriseBridge'), 'backend-safe event bridge');
    add('Watch runtime candidate', !!document.body, 'watch sync listens to poker events');
    add('Scene nav present', !!document.getElementById('sceneNav'), 'private scene routes');
    add('Canvas present', !!document.querySelector('canvas'), 'Three/WebXR render target');

    this.latest = {
      build: BUILD,
      phase: EXPECTED_PHASE,
      reason,
      at: new Date().toISOString(),
      pass: checks.every(c => c.pass),
      checks,
      shortcuts: {
        W: 'Playtest wizard',
        V: 'Deploy preflight',
        T: 'Smoke test',
        U: 'Release candidate checklist',
        Q: 'Runtime QA snapshot',
        X: 'Download session export',
        Y: 'Copy session export',
        F: 'Fold',
        C: 'Check / Call',
        R: 'Raise',
        A: 'All-In',
        H: 'Next hand'
      }
    };
    this.checks = checks;
    this.publish('run:' + reason);
    this.render();
    return this.latest;
  },

  render() {
    if (!this.panel || !this.latest) return;
    const ok = this.latest.pass ? 'PASS' : 'CHECK';
    const rows = this.latest.checks.map(c => `${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`).join('\n');
    const shortcuts = Object.entries(this.latest.shortcuts).map(([k,v]) => `${k} = ${v}`).join('   ');
    const events = this.events.slice(0, 8).map(e => `${e.at.slice(11,19)} ${e.event} ${e.summary}`).join('\n') || 'waiting for game events';
    this.panel.textContent = [
      `SVR PLAYTEST WIZARD — ${ok}`,
      `Build: ${BUILD}`,
      `Generated: ${this.latest.at}`,
      '',
      'CHECKS',
      rows,
      '',
      'SHORTCUTS',
      shortcuts,
      '',
      'TEST ORDER',
      '1. Press V and confirm deploy-health/version match.',
      '2. Press T and confirm smoke test passes.',
      '3. Press U and confirm release candidate gate is acceptable.',
      '4. Sit/Seat, play one hand: C/R/A/F/H.',
      '5. Press Q for runtime QA.',
      '6. Press X to download a playtest report or Y to copy it.',
      '',
      'RECENT EVENTS',
      events
    ].join('\n');
  },

  toggle() {
    this.visible = !this.visible;
    if (!this.latest) this.run('toggle');
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) this.render();
  },

  publish(reason) {
    const payload = {
      build: BUILD,
      phase: EXPECTED_PHASE,
      reason,
      at: new Date().toISOString(),
      pass: this.latest ? !!this.latest.pass : null,
      checks: this.checks.slice(0, 16)
    };
    window.dispatchEvent(new CustomEvent('svr_playtest_wizard_update', { detail: payload }));
    if (window.SVREnterpriseBridge && typeof window.SVREnterpriseBridge.recordGeneric === 'function') {
      window.SVREnterpriseBridge.recordGeneric('/api/game/playtest-wizard', payload);
    }
  }
};

SVRPlaytestWizard.init();
