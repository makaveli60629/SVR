/* SVR Poker Phase 213 - Full Marker Health Lock
 * Passive marker verifier: confirms visible title, HUD, version.json, deploy-health, and boot query all agree.
 * It does not block gameplay and never throws into the main runtime.
 */
(function(){
  const BUILD = 'PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK';
  const KEY = '__SVR_MARKER_HEALTH__';
  const state = { build: BUILD, checks: [], ok: false, lastRunAt: null };
  function safeDispatch(name, detail){ try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch(_){} }
  function add(name, ok, detail=''){
    state.checks.push({ name, ok: !!ok, detail: String(detail || '').slice(0, 600), at: new Date().toISOString() });
  }
  async function fetchJson(url){
    try { const r = await fetch(url, { cache: 'no-store' }); return await r.json(); } catch(error){ return { error: String(error && (error.message || error)) }; }
  }
  async function run(){
    state.checks = [];
    state.lastRunAt = new Date().toISOString();
    try {
      const title = document.title || '';
      const hudText = document.body ? document.body.innerText || '' : '';
      const scripts = Array.from(document.scripts || []).map(s => s.src || '').join('\n');
      add('title-marker', title.includes('Phase 213') || title.includes(BUILD), title);
      add('hud-build-marker', hudText.includes(BUILD), 'HUD/body contains current build marker');
      add('boot-script-cache', scripts.includes('boot.js?v=phase238'), scripts || 'no scripts found');
      const version = await fetchJson('./version.json?v=phase238-' + Date.now());
      add('version-json-marker', version && version.build === BUILD && Number(version.phase) === 211, JSON.stringify(version));
      const gameHealth = await fetchJson('./deploy-health.json?v=phase238-' + Date.now());
      add('game-deploy-health', !gameHealth.error && (!gameHealth.build || String(gameHealth.build).includes('PHASE-')), JSON.stringify(gameHealth));
      state.ok = state.checks.every(c => c.ok);
      try { localStorage.setItem(KEY, JSON.stringify({ build: BUILD, ok: state.ok, checks: state.checks, at: state.lastRunAt })); } catch(_){}
      safeDispatch('svr_marker_health_update', { build: BUILD, ok: state.ok, checks: state.checks, at: state.lastRunAt });
    } catch(error){
      add('marker-health-runtime', false, error && (error.stack || error.message || error));
      state.ok = false;
      safeDispatch('svr_marker_health_update', { build: BUILD, ok: false, checks: state.checks, error: String(error && (error.message || error)), at: new Date().toISOString() });
    }
    return state;
  }
  window.SVR_MARKER_HEALTH = { build: BUILD, state, run };
  setTimeout(run, 1200);
})();
