/* SVR Phase 87 — Table Action History
   Lightweight action log for Scorpion table play-money simulation.
*/
(function(){
  'use strict';

  const MAX_ITEMS = 12;

  function getState(){
    const root = window.SVR_TABLE_ACTION_HISTORY = window.SVR_TABLE_ACTION_HISTORY || {
      items: [],
      maxItems: MAX_ITEMS
    };
    return root;
  }

  function push(message, data){
    const state = getState();
    const item = {
      at: new Date().toISOString(),
      message: String(message || ''),
      data: data || {}
    };
    state.items.push(item);
    while(state.items.length > (state.maxItems || MAX_ITEMS)){
      state.items.shift();
    }
    window.dispatchEvent(new CustomEvent('svr:table:history', { detail: item }));
    return item;
  }

  function clear(){
    const state = getState();
    state.items = [];
    window.dispatchEvent(new CustomEvent('svr:table:history:clear'));
  }

  window.SVRTableActionHistory = {
    getState,
    push,
    clear
  };
})();
