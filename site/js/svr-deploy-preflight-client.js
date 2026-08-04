// SVR site-internal deploy preflight client — PHASE-191-DEPLOY-VERIFIER-PREFLIGHT-LOCK
// Internal /site helper only. Public Matrix launch page is untouched.
window.SVR_SITE_DEPLOY_PREFLIGHT = {
  build: 'PHASE-191-DEPLOY-VERIFIER-PREFLIGHT-LOCK',
  async check() {
    const [root, game] = await Promise.all([
      fetch('../deploy-health.json?v=' + Date.now()).then(r=>r.json()).catch(e=>({error:String(e)})),
      fetch('../game/deploy-health.json?v=' + Date.now()).then(r=>r.json()).catch(e=>({error:String(e)}))
    ]);
    const result = { build: this.build, checkedAt: new Date().toISOString(), root, game };
    window.dispatchEvent(new CustomEvent('svr_site_deploy_preflight_update', { detail: result }));
    return result;
  }
};
