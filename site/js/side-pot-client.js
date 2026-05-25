// PHASE-182-SIDE-POT-ELIGIBILITY-LOCK internal site hook only. Public Matrix page untouched.
(function(){
  window.SVR_SIDE_POT_BUILD = 'PHASE-182-SIDE-POT-ELIGIBILITY-LOCK';
  window.addEventListener('svr_poker_side_pot_resolution', function(event){
    try { localStorage.setItem('svr_last_side_pot_resolution', JSON.stringify(event.detail || {})); } catch (_) {}
  });
})();
