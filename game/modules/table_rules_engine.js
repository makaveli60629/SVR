/* SVR Phase 87 — Scorpion Table Rules Engine
   Coordinates play-money table lifecycle and emits events consumed by Phase 84–86 modules.
*/
(function(){
  'use strict';

  const PHASE = 'PHASE-87-SCORPION-TABLE-RULES-ENGINE-LOCK';

  function getEngine(){
    const engine = window.SVR_TABLE_RULES_ENGINE = window.SVR_TABLE_RULES_ENGINE || {
      phase: PHASE,
      handNumber: 0,
      dealerIndex: 0,
      activeIndex: 0,
      stage: 'idle',
      seats: [],
      community: []
    };
    return engine;
  }

  function log(message, data){
    if(window.SVRTableActionHistory) window.SVRTableActionHistory.push(message, data);
    else console.info('[SVR Table]', message, data || '');
  }

  function init(opts = {}){
    const engine = getEngine();
    const accounting = window.SVRTableAccounting;
    if(accounting){
      accounting.ensureSeats(opts.seatCount || 6);
      engine.seats = accounting.getState().seats;
    } else {
      engine.seats = engine.seats.length ? engine.seats : ['player','bot1','bot2','bot3','bot4','bot5'].map((id,i)=>({id, name:i?'BOT '+i:'PLAYER', stack:1000}));
    }
    window.dispatchEvent(new CustomEvent('svr:table:engine:init', { detail: engine }));
    return engine;
  }

  function startHand(){
    const engine = init();
    engine.handNumber += 1;
    engine.stage = 'preflop';
    engine.community = [];
    engine.dealerIndex = (engine.dealerIndex + 1) % engine.seats.length;
    engine.activeIndex = (engine.dealerIndex + 1) % engine.seats.length;

    if(window.SVRTableAccounting) window.SVRTableAccounting.resetForHand();
    log(`Hand ${engine.handNumber} started`, { dealerIndex: engine.dealerIndex });

    window.dispatchEvent(new CustomEvent('svr:table:hand:start', { detail: engine }));
    window.dispatchEvent(new CustomEvent('svr:table:deal:leftToRight', { detail: { dealerIndex: engine.dealerIndex }}));
    setActive(engine.activeIndex);
    return engine;
  }

  function setActive(index){
    const engine = getEngine();
    engine.activeIndex = index % engine.seats.length;
    const seat = engine.seats[engine.activeIndex];
    window.dispatchEvent(new CustomEvent('svr:poker:turn', { detail: { seat, index: engine.activeIndex, stage: engine.stage }}));
    log(`${seat?.name || 'Seat'} to act`, { seat });
    return seat;
  }

  function nextSeat(){
    const engine = getEngine();
    let idx = engine.activeIndex;
    for(let i=0;i<engine.seats.length;i++){
      idx = (idx + 1) % engine.seats.length;
      const s = engine.seats[idx];
      if(s && !s.folded && !s.allIn) return setActive(idx);
    }
    return null;
  }

  function applyAction(seatId, action, amount = 0){
    const engine = getEngine();
    const seat = engine.seats.find(s=>s.id===seatId) || engine.seats[engine.activeIndex];
    if(!seat) return null;

    seat.lastAction = action;
    if(action === 'fold') seat.folded = true;
    if(['call','bet','raise'].includes(action) && window.SVRTableAccounting){
      window.SVRTableAccounting.commitAmount(seat.id, amount);
    }

    window.dispatchEvent(new CustomEvent('svr:poker:action', { detail: { seat, action, amount, stage: engine.stage }}));
    log(`${seat.name} ${action}${amount ? ' ' + amount : ''}`, { seat, action, amount });
    return nextSeat();
  }

  function advanceStage(){
    const engine = getEngine();
    const order = ['preflop','flop','turn','river','showdown'];
    const current = order.indexOf(engine.stage);
    engine.stage = order[Math.min(current + 1, order.length - 1)] || 'showdown';
    window.dispatchEvent(new CustomEvent('svr:table:stage', { detail: engine }));
    log(`Stage: ${engine.stage}`);
    if(engine.stage === 'showdown') showdown();
    else setActive((engine.dealerIndex + 1) % engine.seats.length);
    return engine.stage;
  }

  function showdown(entries){
    const engine = getEngine();
    let result = null;
    if(window.SVRHandResultEvaluator){
      const fallbackEntries = engine.seats.filter(s=>!s.folded).map(s=>({ seatId:s.id, name:s.name, cards:s.cards || [], community:engine.community || [] }));
      result = window.SVRHandResultEvaluator.chooseWinner(entries || fallbackEntries);
    }
    const winner = result?.winner || engine.seats.find(s=>!s.folded) || engine.seats[0];
    if(winner && window.SVRTableAccounting) window.SVRTableAccounting.payout(winner.seatId || winner.id);
    window.dispatchEvent(new CustomEvent('svr:poker:winner', { detail: { winner, result }}));
    log(`Winner: ${winner?.name || winner?.seatId || 'unknown'}`, { winner, result });
    return result;
  }

  window.SVRTableRulesEngine = {
    getEngine,
    init,
    startHand,
    setActive,
    nextSeat,
    applyAction,
    advanceStage,
    showdown
  };
})();
