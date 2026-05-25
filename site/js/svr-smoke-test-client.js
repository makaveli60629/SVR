// SVR site-internal smoke test client — PHASE-192-SMOKE-TEST-AUTOMATION-LOCK
// Internal /site helper only. Public Matrix launch page is untouched.
window.SVR_SITE_SMOKE_TEST_CLIENT = {
  build: 'PHASE-192-SMOKE-TEST-AUTOMATION-LOCK',
  async check() {
    const urls = ['../game/version.json','../game/deploy-health.json','../deploy-health.json'];
    const results = await Promise.all(urls.map(url => fetch(url + '?v=' + Date.now()).then(r => r.json()).catch(error => ({ error: String(error), url }))));
    const payload = { build: this.build, checkedAt: new Date().toISOString(), results };
    window.dispatchEvent(new CustomEvent('svr_site_smoke_test_update', { detail: payload }));
    return payload;
  }
};
