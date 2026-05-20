/* SVR Phase 87 — Bot Decision State
   Lightweight legal-action bot decisions for play-money simulation.
*/
(function(){
  'use strict';

  function decide({ seat, toCall = 0, stack = 1000, strength = 0.45, canCheck = false } = {}){
    if(!seat) return { action: 'wait', amount: 0 };

    const safeStack = Number.isFinite(stack) ? stack : (seat.stack || 0);
    const pressure = safeStack > 0 ? toCall / safeStack : 1;

    if(canCheck && toCall <= 0){
      if(strength > 0.78) return { action: 'bet', amount: 40 };
      return { action: 'check', amount: 0 };
    }

    if(toCall > 0){
      if(pressure > 0.35 && strength < 0.65) return { action: 'fold', amount: 0 };
      if(strength > 0.82 && safeStack > toCall + 40) return { action: 'raise', amount: toCall + 40 };
      return { action: 'call', amount: Math.min(toCall, safeStack) };
    }

    return { action: 'check', amount: 0 };
  }

  function strengthFromCards(cards){
    // Stable deterministic fallback from card values; not a real odds engine.
    if(!window.SVRHandResultEvaluator || !cards) return 0.5;
    const evaled = window.SVRHandResultEvaluator.evaluate(cards);
    return Math.min(0.95, 0.25 + (evaled.rank * 0.07) + ((evaled.high || 0) / 100));
  }

  window.SVRBotDecisionState = {
    decide,
    strengthFromCards
  };
})();
