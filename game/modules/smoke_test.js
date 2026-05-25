/**
 * SVR Poker — Smoke Test Automation Module
 * Build: PHASE-206-BRIDGE-SELFTEST-STABILITY-LOCK
 * Purpose: run a safe, non-destructive readiness check after deploy before Quest/Desktop testing.
 * No public-page edits, no secrets, no SQL strings.
 */
const BUILD = 'PHASE-206-BRIDGE-SELFTEST-STABILITY-LOCK';
const EXPECTED_PHASE = 194;

function bool(value) { return !!value; }
function text(value, max = 220) { return String(value ?? '').slice(0, max); }
async function fetchJson(url) {
  try {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, url, json: await res.json() };
  } catch (error) {
    return { ok: false, url, error: text(error?.message || error) };
  }
}

const SVRSmokeTest = {
  build: BUILD,
  expectedPhase: EXPECTED_PHASE,
  latest: null,
  visible: false,
  panel: null,
  history: [],

  init() {
    window.SVR_SMOKE_TEST = this;
    this.buildPanel();
    this.bindKeys();
    setTimeout(() => this.run('boot'), 900);
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      const key = (event.key || '').toLowerCase();
      if (key === 't') this.toggle();
    });
  },

  buildPanel() {
    if (document.getElementById('svr-smoke-test-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-smoke-test-panel';
    panel.style.cssText = [
      'position:fixed','right:12px','top:62px','z-index:49','width:min(430px,calc(100vw - 24px))',
      'max-height:58vh','overflow:auto','display:none','background:rgba(3,12,10,.90)','color:#eafff5',
      'border:1px solid rgba(100,255,190,.55)','box-shadow:0 14px 38px rgba(0,0,0,.58)',
      'border-radius:14px','padding:10px 12px','font:11px/1.38 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'white-space:pre-wrap','pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  async run(reason = 'manual') {
    const [version, gameHealth, rootHealth] = await Promise.all([
      fetchJson('./version.json'),
      fetchJson('./deploy-health.json'),
      fetchJson('../deploy-health.json')
    ]);
    const checks = [];
    const versionBuild = text(version?.json?.build);
    const versionPhase = Number(version?.json?.phase || 0);
    checks.push({ name: 'version_file_phase_193', pass: versionBuild === BUILD && versionPhase === EXPECTED_PHASE, value: versionBuild || 'missing' });
    checks.push({ name: 'deploy_verifier_module', pass: bool(window.SVR_DEPLOY_VERIFIER), value: bool(window.SVR_DEPLOY_VERIFIER) });
    checks.push({ name: 'runtime_qa_module', pass: bool(window.SVR_RUNTIME_QA), value: bool(window.SVR_RUNTIME_QA) });
    checks.push({ name: 'session_export_module', pass: bool(window.SVR_SESSION_EXPORT), value: bool(window.SVR_SESSION_EXPORT) });
    checks.push({ name: 'enterprise_bridge_module', pass: bool(window.SVR_ENTERPRISE_BRIDGE), value: bool(window.SVR_ENTERPRISE_BRIDGE) });
    checks.push({ name: 'scene_navigation', pass: document.querySelectorAll('#sceneNav .scene-btn').length >= 4, value: document.querySelectorAll('#sceneNav .scene-btn').length });
    checks.push({ name: 'hud_present', pass: bool(document.getElementById('hud')), value: bool(document.getElementById('hud')) });
    checks.push({ name: 'canvas_present', pass: bool(document.querySelector('canvas')), value: bool(document.querySelector('canvas')) });
    checks.push({ name: 'game_health_reachable', pass: gameHealth.ok || gameHealth.status === 404, value: gameHealth.ok ? text(gameHealth.json?.build) : (gameHealth.status || gameHealth.error || 'pending') });
    checks.push({ name: 'root_health_reachable', pass: rootHealth.ok || rootHealth.status === 404, value: rootHealth.ok ? text(rootHealth.json?.build) : (rootHealth.status || rootHealth.error || 'pending') });

    let verifierResult = null;
    if (window.SVR_DEPLOY_VERIFIER?.run) {
      try { verifierResult = await window.SVR_DEPLOY_VERIFIER.run('smoke-test'); } catch (error) { verifierResult = { error: text(error?.message || error) }; }
    }
    if (verifierResult) checks.push({ name: 'deploy_verifier_run', pass: !verifierResult.error, value: verifierResult.pass ?? verifierResult.error });

    const failed = checks.filter(c => !c.pass);
    this.latest = {
      build: BUILD,
      expectedPhase: EXPECTED_PHASE,
      reason,
      checkedAt: new Date().toISOString(),
      pass: failed.length === 0,
      failedCount: failed.length,
      checks,
      version: version.ok ? version.json : version,
      gameHealth: gameHealth.ok ? gameHealth.json : gameHealth,
      rootHealth: rootHealth.ok ? rootHealth.json : rootHealth,
      userAgent: navigator.userAgent,
      url: location.pathname + location.search
    };
    this.history.unshift(this.latest);
    this.history = this.history.slice(0, 20);
    this.render();
    this.publish(reason);
    return this.latest;
  },

  toggle() {
    this.visible = !this.visible;
    if (this.panel) this.panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) this.run('toggle');
  },

  render() {
    if (!this.panel || !this.visible || !this.latest) return;
    const s = this.latest;
    this.panel.textContent = [
      'SVR SMOKE TEST',
      `BUILD: ${s.build}`,
      `STATUS: ${s.pass ? 'PASS' : 'CHECK'} • FAILS: ${s.failedCount}`,
      `TIME: ${s.checkedAt}`,
      '',
      ...s.checks.map(c => `${c.pass ? '✓' : '⚠'} ${c.name}: ${c.value}`),
      '',
      'Keys: T smoke • V verifier • Q QA • X export • Y copy'
    ].join('\n');
  },

  publish(reason) {
    try { window.dispatchEvent(new CustomEvent('svr_smoke_test_result', { detail: this.latest })); } catch (_) {}
    if (window.SVR_SESSION_EXPORT?.record) {
      try { window.SVR_SESSION_EXPORT.record('smoke_test', { reason, pass: this.latest?.pass, failedCount: this.latest?.failedCount }); } catch (_) {}
    }
  }
};

SVRSmokeTest.init();
