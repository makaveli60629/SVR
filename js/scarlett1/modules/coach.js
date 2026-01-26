export function initCoach({ Bus }) {
  function calculateEV(potSize, betSize, winProbability) {
    const ev = (winProbability * potSize) - ((1 - winProbability) * betSize);
    return Number(ev.toFixed(2));
  }
  window.calculateEV = calculateEV;

  window.showEVDemo = () => {
    const pot = 100, bet = 40, p = 0.45;
    const ev = calculateEV(pot, bet, p);
    Bus.log(`COACH: EV demo pot=${pot} bet=${bet} p=${p} -> EV=${ev}`);
  };

  Bus.log('AI COACH ONLINE');
}
