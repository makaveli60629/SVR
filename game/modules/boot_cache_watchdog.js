/*
 * SVR Poker Phase 213 - Boot Cache Marker Alignment Watchdog
 * Prevents stale boot/main/version markers from hiding the real deployed phase.
 */
(function(){
  const BUILD = 'PHASE-226-PILOT-READY-SUMMARY-LOCK';
  const state = {
    build: BUILD,
    at: new Date().toISOString(),
    checks: [],
    warnings: []
  };
  function emit(){
    try { window.dispatchEvent(new CustomEvent('svr_boot_cache_watchdog_update', { detail: JSON.parse(JSON.stringify(state)) })); } catch(_) {}
  }
  function mark(name, ok, detail){
    state.checks.push({ name, ok: !!ok, detail: detail || '', at: new Date().toISOString() });
    if (!ok) state.warnings.push({ name, detail: detail || '', at: new Date().toISOString() });
    emit();
  }
  async function verify(){
    const hudText = (document.body && document.body.innerText || '').slice(0, 5000);
    mark('hud-build-marker', hudText.includes(BUILD), 'HUD should show the Phase 213 build marker.');
    try {
      const res = await fetch('./version.json?v=phase226-' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      mark('version-json-phase', String(data.build || '').includes(BUILD) || Number(data.phase) === 210, JSON.stringify(data).slice(0, 500));
    } catch (err) {
      mark('version-json-fetch', false, err && (err.message || String(err)));
    }
    try {
      const scripts = Array.from(document.scripts || []).map(s => s.src || '').join('\n');
      mark('boot-cache-query', scripts.includes('boot.js?v=phase226'), scripts || 'No script src found.');
    } catch (err) {
      mark('boot-cache-query', false, err && (err.message || String(err)));
    }
    if (window.SVR_BOOT_GUARD && typeof window.SVR_BOOT_GUARD.ready === 'function') {
      mark('boot-guard-present', true, 'Boot guard object present.');
    } else {
      mark('boot-guard-present', false, 'window.SVR_BOOT_GUARD missing.');
    }
  }
  window.SVR_BOOT_CACHE_WATCHDOG = { state, verify, mark, build: BUILD };
  setTimeout(verify, 1200);
})();
