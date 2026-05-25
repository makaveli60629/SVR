(function(){
  const BUILD = 'PHASE-220-ONE-COMMAND-DEPLOY-HEALTH-LOCK';
  const state = { build: BUILD, status: 'ready', fixed: ['PowerShell Invoke-Git argument binding', 'highest-phase packet detection', 'direct packet apply'] };
  window.SVR_AUTO_APPLY_GIT_FIX = {
    state,
    show(){ console.log('[SVR auto apply fix]', state); return state; }
  };
  window.dispatchEvent(new CustomEvent('svr_auto_apply_git_fix_ready', { detail: state }));
})();
