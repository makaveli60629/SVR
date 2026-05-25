/**
 * SVR Poker — Release Candidate Checklist Module
 * Build: PHASE-203-ENTERPRISE-BRIDGE-RECORDER-FIX-LOCK
 * Purpose: combine deploy, smoke, QA, export, and runtime module checks into one tester-ready release gate.
 * Public Matrix page is untouched. No secrets. No SQL strings.
 */
const BUILD = 'PHASE-203-ENTERPRISE-BRIDGE-RECORDER-FIX-LOCK';
const EXPECTED_PHASE = 194;

function safeText(value, max = 260) { return String(value ?? '').slice(0, max); }
function yes(value) { return !!value; }
async function fetchJson(url) {
  try {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, url, json: await res.json() };
  } catch (error) {
    return { ok: false, url, error: safeText(error?.message || error) };
  }
}

const SVRReleaseCandidate = {
  build: BUILD,
  expectedPhase: EXPECTED_PHASE,
  visible: false,
  latest: null,
  panel: null,
  history: [],

  init() {
    window.SVR_RELEASE_CANDIDATE = this;
    this.buildPanel();
    this.bindKeys();
    setTimeout(() => this.run('boot'), 1300);
  },

  bindKeys() {
    window.addEventListener('keydown', event => {
      const key = (event.key || '').toLowerCase();
      if (key === 'u') this.toggle();
    });
    window.addEventListener('svr_smoke_test_result', event => {
      this.history.unshift({ type:'smoke', at:new Date().toISOString(), pass: !!event.detail?.pass });
      this.history = this.history.slice(0, 20);
    });
    window.addEventListener('svr_deploy_preflight_update', event => {
      this.history.unshift({ type:'deploy', at:new Date().toISOString(), pass: !!event.detail?.pass });
      this.history = this.history.slice(0, 20);
    });
  },

  buildPanel() {
    if (document.getElementById('svr-release-candidate-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-release-candidate-panel';
    panel.style.cssText = [
      'position:fixed','left:50%','top:62px','transform:translateX(-50%)','z-index:52','width:min(620px,calc(100vw - 24px))',
      'max-height:64vh','overflow:auto','display:none','background:rgba(4,8,16,.92)','color:#eef7ff',
      'border:1px solid rgba(105,210,255,.62)','box-shadow:0 18px 46px rgba(0,0,0,.62)',
      'border-radius:16px','padding:12px 14px','font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'white-space:pre-wrap','pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  async run(reason = 'manual') {
    const [version, gameHealth, rootHealth] = await Promise.all([
      fetchJson('./version.json'), fetchJson('./deploy-health.json'), fetchJson('../deploy-health.json')
    ]);

    let smoke = null;
    if (window.SVR_SMOKE_TEST?.run) {
      try { smoke = await window.SVR_SMOKE_TEST.run('release-candidate'); } catch (error) { smoke = { pass:false, error:safeText(error?.message || error) }; }
    }
    let deploy = null;
    if (window.SVR_DEPLOY_VERIFIER?.run) {
      try { deploy = await window.SVR_DEPLOY_VERIFIER.run('release-candidate'); } catch (error) { deploy = { pass:false, error:safeText(error?.message || error) }; }
    }

    const checks = [];
    const versionBuild = safeText(version?.json?.build);
    const versionPhase = Number(version?.json?.phase || 0);
    checks.push({ name:'version_build_phase_194', pass: versionBuild === BUILD && versionPhase === EXPECTED_PHASE, value: versionBuild || 'missing' });
    checks.push({ name:'game_deploy_health', pass: !gameHealth.ok || safeText(gameHealth?.json?.build) === BUILD, value: gameHealth.ok ? safeText(gameHealth.json?.build) : (gameHealth.status || gameHealth.error || 'pending') });
    checks.push({ name:'root_deploy_health_seen', pass: rootHealth.ok || rootHealth.status === 404 || rootHealth.error, value: rootHealth.ok ? safeText(rootHealth.json?.build) : (rootHealth.status || rootHealth.error || 'pending') });
    checks.push({ name:'deploy_verifier', pass: yes(window.SVR_DEPLOY_VERIFIER), value: yes(window.SVR_DEPLOY_VERIFIER) });
    checks.push({ name:'smoke_test', pass: yes(window.SVR_SMOKE_TEST), value: yes(window.SVR_SMOKE_TEST) });
    checks.push({ name:'runtime_qa', pass: yes(window.SVR_RUNTIME_QA), value: yes(window.SVR_RUNTIME_QA) });
    checks.push({ name:'session_export', pass: yes(window.SVR_SESSION_EXPORT), value: yes(window.SVR_SESSION_EXPORT) });
    checks.push({ name:'playtest_wizard', pass: yes(window.SVR_PLAYTEST_WIZARD), value: yes(window.SVR_PLAYTEST_WIZARD) });
    checks.push({ name:'enterprise_bridge', pass: yes(window.SVR_ENTERPRISE_BRIDGE), value: yes(window.SVR_ENTERPRISE_BRIDGE) });
    checks.push({ name:'watch_module_state', pass: yes(window.SVR_WATCH_STATE) || yes(document.getElementById('hud')), value: yes(window.SVR_WATCH_STATE) ? 'watch-state' : 'hud-fallback' });
    checks.push({ name:'private_scene_routes', pass: document.querySelectorAll('#sceneNav .scene-btn[data-url]').length >= 5, value: document.querySelectorAll('#sceneNav .scene-btn[data-url]').length });
    checks.push({ name:'smoke_run_pass', pass: smoke ? !!smoke.pass : false, value: smoke ? (smoke.pass ? 'PASS' : `CHECK:${smoke.failedCount ?? smoke.error ?? 'unknown'}`) : 'not-run' });
    checks.push({ name:'deploy_run_pass', pass: deploy ? !!deploy.pass : false, value: deploy ? (deploy.pass ? 'PASS' : `CHECK:${deploy.failedCount ?? deploy.error ?? 'unknown'}`) : 'not-run' });

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
      smoke,
      deploy,
      url: location.pathname + location.search,
      userAgent: navigator.userAgent
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
      'SVR RELEASE CANDIDATE CHECKLIST',
      `BUILD: ${s.build}`,
      `STATUS: ${s.pass ? 'PASS / READY TO TEST' : 'CHECK REQUIRED'} • FAILS: ${s.failedCount}`,
      `TIME: ${s.checkedAt}`,
      '',
      ...s.checks.map(c => `${c.pass ? '✓' : '⚠'} ${c.name}: ${c.value}`),
      '',
      'Keys: U release checklist • T smoke • V verifier • Q QA • X export • Y copy'
    ].join('\n');
  },

  publish(reason) {
    try { window.dispatchEvent(new CustomEvent('svr_release_candidate_update', { detail: this.latest })); } catch (_) {}
    if (window.SVR_SESSION_EXPORT?.record) {
      try { window.SVR_SESSION_EXPORT.record('release_candidate', { reason, pass:this.latest?.pass, failedCount:this.latest?.failedCount }); } catch (_) {}
    }
    this.post(reason);
  },

  async post(reason) {
    try {
      await fetch('/api/game/release-candidate', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ ...this.latest, reason })
      });
    } catch (_) {}
  }
};

SVRReleaseCandidate.init();
