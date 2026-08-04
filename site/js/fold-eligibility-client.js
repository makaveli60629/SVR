// PHASE-183-FOLD-ELIGIBILITY-MUCK-LOCK internal site hook only. Public Matrix launch page untouched.
(function(){
  window.SVR_FOLD_ELIGIBILITY_BUILD = 'PHASE-183-FOLD-ELIGIBILITY-MUCK-LOCK';
  window.addEventListener('svr_poker_fold_eligibility_update', function(event){
    try { localStorage.setItem('svr_last_fold_eligibility_update', JSON.stringify(event.detail || {})); } catch (_) {}
  });
  window.addEventListener('svr_poker_side_pot_resolution', function(event){
    try { localStorage.setItem('svr_last_side_pot_resolution_with_folds', JSON.stringify(event.detail || {})); } catch (_) {}
  });
})();
