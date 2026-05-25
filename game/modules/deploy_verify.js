/**
 * SVR Poker — Deploy Verifier / Preflight QA Module
 * Build: PHASE-204-EVENT-FIREWALL-BRIDGE-HARDENING-LOCK
 * Purpose: catch stale deploys, mismatched game/version/deploy-health data, and runtime drift before testing.
 * No public-page edits, no secrets, no SQL strings.
 */
const BUILD = 'PHASE-204-EVENT-FIREWALL-BRIDGE-HARDENING-LOCK';
const EXPECTED_PHASE = 194;

async function fetchJsonSafe(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { ok: false, status: res.status, url };
    const json = await res.json();
    return { ok: true, url, json };
  } catch (error) {
    return { ok: false, url, error: String(error?.message || error).slice(0, 240) };
  }
}

function textSafe(value) { return String(value ?? '').slice(0, 500); }

const SVRDeployVerifier = {
  build: BUILD,
  expectedPhase: EXPECTED_PHASE,
  latest: null,
  panel: null,
  visible: false,

  init() {
    window.SVR_DEPLOY_VERIFIER = this;
    this.buildPanel();
    this.bindKeys();
    setTimeout(() => this.run('boot'), 600);
  },

  bindKeys() {
    window.addEventListener('keydown', (event) => {
      const key = (event.key || '').toLowerCase();
      if (key === 'v') this.toggle();
    });
    window.addEventListener('svr_session_export_update', () => {
      if (this.latest) this.publish('session-export-seen');
    });
  },

  buildPanel() {
    if (document.getElementById('svr-deploy-verifier-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'svr-deploy-verifier-panel';
    panel.style.cssText = [
      'position:fixed','left:12px','top:62px','z-index:48','max-width:420px','max-height:58vh','overflow:auto',
      'display:none','background:rgba(10,4,18,.86)','color:#f7ecff','border:1px solid rgba(190,150,255,.55)',
      'box-shadow:0 14px 38px rgba(0,0,0,.58)','border-radius:14px','padding:10px 12px',
      'font:11px/1.38 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace','white-space:pre-wrap','pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  async run(reason = 'manual') {
    const [gameVersion, gameHealth, rootHealth] = await Promise.all([
      fetchJsonSafe('./version.json?v=' + Date.now()),
      fetchJsonSafe('./deploy-health.json?v=' + Date.now()),
      fetchJsonSafe('../deploy-health.json?v=' + Date.now())
    ]);
    const runtime = {
      build: BUILD,
      expectedPhase: EXPECTED_PHASE,
      location: location.pathname + location.search,
      userAgent: navigator.userAgent,
      hasSessionExport: !!window.SVR_SESSION_EXPORT,
      hasRuntimeQA: !!window.SVR_RUNTIME_QA,
      hasEnterpriseBridge: !!window.SVR_ENTERPRISE_BRIDGE
    };
    const checks = [];
    const gvBuild = textSafe(gameVersion?.json?.build);
    const ghBuild = textSafe(gameHealth?.json?.build);
    const rhBuild = textSafe(rootHealth?.json?.build);
    checks.push({ name: 'runtime_build', pass: runtime.build === BUILD, value: runtime.build });
    checks.push({ name: 'game_version_build', pass: gvBuild === BUILD, value: gvBuild || 'missing' });
    checks.push({ name: 'game_version_phase', pass: Number(gameVersion?.json?.phase) === EXPECTED_PHASE, value: gameVersion?.json?.phase ?? 'missing' });
    checks.push({ name: 'game_deploy_health', pass: !gameHealth.ok || ghBuild === BUILD, value: ghBuild || gameHealth.status || gameHealth.error || 'pending' });
    checks.push({ name: 'root_deploy_health', pass: !rootHealth.ok || rhBuild === BUILD, value: rhBuild || rootHealth.status || rootHealth.error || 'pending' });
    checks.push({ name: 'qa_module', pass: runtime.hasRuntimeQA, value: runtime.hasRuntimeQA });
    checks.push({ name: 'session_export_module', pass: runtime.hasSessionExport, value: runtime.hasSessionExport });

    const failed = checks.filter(c => !c.pass);
    this.latest = {
      build: BUILD,
      expectedPhase: EXPECTED_PHASE,
      checkedAt: new Date().toISOString(),
      reason,
      pass: failed.length === 0,
      failedCount: failed.length,
      checks,
      gameVersion: gameVersion.ok ? gameVersion.json : gameVersion,
      gameHealth: gameHealth.ok ? gameHealth.json : gameHealth,
      rootHealth: rootHealth.ok ? rootHealth.json : rootHealth,
      runtime
    };
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
    const lines = [
      'SVR DEPLOY PREFLIGHT',
      `BUILD: ${s.build}`,
      `STATUS: ${s.pass ? 'PASS' : 'CHECK'} • FAILS: ${s.failedCount}`,
      `TIME: ${s.checkedAt}`,
      '',
      ...s.checks.map(c => `${c.pass ? '✓' : '⚠'} ${c.name}: ${c.value}`),
      '',
      'Keys: V verifier • Q QA • X export • Y copy'
    ];
    this.panel.textContent = lines.join('\n');
  },

  publish(reason) {
    try {
      window.dispatchEvent(new CustomEvent('svr_deploy_preflight_update', { detail: this.latest }));
    } catch (_) {}
  }
};

SVRDeployVerifier.init();
