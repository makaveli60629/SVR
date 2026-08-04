// SVR Site Internal — Playtest Wizard Client
// Build: PHASE-194-PLAYTEST-WIZARD-LOCK
// Safe internal page helper only. Does not touch root public Matrix page.
(function(){
  const BUILD = 'PHASE-194-PLAYTEST-WIZARD-LOCK';
  async function postPlaytestWizard(payload){
    const api = window.SVR_API_BASE || localStorage.getItem('svr_api_base') || '';
    if(!api) return { ok:false, skipped:true, reason:'missing_api_base', build: BUILD };
    try {
      const res = await fetch(api + '/api/game/playtest-wizard', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.assign({ build: BUILD, source:'site-internal' }, payload || {}))
      });
      return await res.json();
    } catch(error) {
      return { ok:false, build: BUILD, message:String(error && error.message || error) };
    }
  }
  window.SVRPlaytestWizardClient = { build: BUILD, postPlaytestWizard };
})();
