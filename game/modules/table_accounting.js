/* SVR Phase 87 — Table Accounting
   Play-money stack, bet, and pot accounting helpers.
*/
(function(){
  'use strict';

  function createSeat(id, name, stack){
    return {
      id,
      name: name || id,
      stack: Number.isFinite(stack) ? stack : 1000,
      committed: 0,
      folded: false,
      allIn: false,
      lastAction: 'waiting'
    };
  }

  function getState(){
    const state = window.SVR_TABLE_ACCOUNTING = window.SVR_TABLE_ACCOUNTING || {
      pot: 0,
      currentBet: 0,
      minRaise: 20,
      smallBlind: 10,
      bigBlind: 20,
      seats: []
    };
    return state;
  }

  function ensureSeats(count){
    const state = getState();
    if(!state.seats.length){
      const total = count || 6;
      for(let i=0;i<total;i++){
        state.seats.push(createSeat(i === 0 ? 'player' : `bot${i}`, i === 0 ? 'PLAYER' : `BOT ${i}`, 1000));
      }
    }
    return state.seats;
  }

  function resetForHand(){
    const state = getState();
    state.pot = 0;
    state.currentBet = 0;
    state.seats.forEach(seat => {
      seat.committed = 0;
      seat.folded = false;
      seat.allIn = false;
      seat.lastAction = 'waiting';
    });
  }

  function commitAmount(seatId, amount){
    const state = getState();
    const seat = state.seats.find(s => s.id === seatId);
    if(!seat) return null;
    const raw = Math.max(0, Math.floor(Number(amount) || 0));
    const paid = Math.min(raw, seat.stack);
    seat.stack -= paid;
    seat.committed += paid;
    state.pot += paid;
    if(seat.committed > state.currentBet) state.currentBet = seat.committed;
    if(seat.stack <= 0) seat.allIn = true;
    window.dispatchEvent(new CustomEvent('svr:table:accounting', { detail: { type: 'commit', seat, paid, state }}));
    return { seat, paid, state };
  }

  function toCall(seatId){
    const state = getState();
    const seat = state.seats.find(s => s.id === seatId);
    if(!seat) return 0;
    return Math.max(0, state.currentBet - seat.committed);
  }

  function payout(winnerSeatId){
    const state = getState();
    const seat = state.seats.find(s => s.id === winnerSeatId);
    if(!seat) return null;
    const amount = state.pot;
    seat.stack += amount;
    state.pot = 0;
    window.dispatchEvent(new CustomEvent('svr:table:accounting', { detail: { type: 'payout', seat, amount, state }}));
    return { seat, amount, state };
  }

  window.SVRTableAccounting = {
    getState,
    ensureSeats,
    resetForHand,
    commitAmount,
    toCall,
    payout,
    createSeat
  };
})();
