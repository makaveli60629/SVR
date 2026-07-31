export function activeSeatIds(players){
  return players.filter(player=>Array.isArray(player.hand) && player.hand.length === 2).map(player=>player.id);
}

export function nextSeat(activeIds, from, seatCount = 6){
  const active = new Set(activeIds);
  for(let step = 1; step <= seatCount; step++){
    const id = (from + step + seatCount) % seatCount;
    if(active.has(id)) return id;
  }
  return -1;
}

export function blindSeats(players, dealer, seatCount = 6){
  const active = activeSeatIds(players);
  if(active.length < 2) return { dealer, smallBlind: -1, bigBlind: -1 };
  if(active.length === 2){
    return { dealer, smallBlind: dealer, bigBlind: nextSeat(active, dealer, seatCount) };
  }
  const smallBlind = nextSeat(active, dealer, seatCount);
  return { dealer, smallBlind, bigBlind: nextSeat(active, smallBlind, seatCount) };
}

export function buildProvisionalPots(players){
  const levels = [...new Set(players.map(player=>Number(player.contributed || 0)).filter(value=>value > 0))]
    .sort((a,b)=>a-b);
  const pots = [];
  let previous = 0;
  for(const level of levels){
    const contributors = players.filter(player=>Number(player.contributed || 0) >= level);
    const amount = (level - previous) * contributors.length;
    if(amount > 0){
      pots.push({
        amount,
        cap: level,
        eligible: contributors.filter(player=>!player.folded && Array.isArray(player.hand) && player.hand.length === 2).map(player=>player.id),
        winners: []
      });
    }
    previous = level;
  }
  return pots;
}

export function splitAwards(pot, dealer, seatCount = 6){
  const winners = [...new Set((pot?.winners || []).map(Number))];
  if(!winners.length || !Number(pot?.amount || 0)) return [];
  winners.sort((a,b)=>((a-dealer+seatCount)%seatCount)-((b-dealer+seatCount)%seatCount));
  const share = Math.floor(Number(pot.amount) / winners.length);
  let remainder = Number(pot.amount) - share * winners.length;
  return winners.map(id=>({ id, amount: share + (remainder-- > 0 ? 1 : 0) }));
}

export function visualChipPlan(amount, maxChips = 24){
  const denominations = [100, 25, 5, 1];
  const plan = [];
  let remaining = Math.max(0, Math.floor(Number(amount) || 0));
  for(const value of denominations){
    const count = Math.floor(remaining / value);
    const visible = Math.min(count, Math.max(0, maxChips - plan.length));
    for(let i=0;i<visible;i++) plan.push(value);
    remaining -= count * value;
    if(plan.length >= maxChips) break;
  }
  if(!plan.length && amount > 0) plan.push(1);
  return plan;
}

export function validateVisualLedger(players, pots){
  const contributionTotal = players.reduce((sum,player)=>sum + Number(player.contributed || 0), 0);
  const potTotal = pots.reduce((sum,pot)=>sum + Number(pot.amount || 0), 0);
  return {
    contributionTotal,
    potTotal,
    difference: contributionTotal - potTotal,
    pass: contributionTotal === potTotal
  };
}

export function runPhase337ModelSelfTest(){
  const players = [
    {id:0,hand:[1,2],contributed:100,folded:false},
    {id:1,hand:[1,2],contributed:250,folded:false},
    {id:2,hand:[1,2],contributed:250,folded:true},
    {id:3,hand:[1,2],contributed:400,folded:false},
    {id:4,hand:[],contributed:0,folded:true},
    {id:5,hand:[],contributed:0,folded:true}
  ];
  const pots = buildProvisionalPots(players);
  const expected = [400,450,150];
  const potAmountsPass = JSON.stringify(pots.map(pot=>pot.amount)) === JSON.stringify(expected);
  const eligibilityPass = JSON.stringify(pots.map(pot=>pot.eligible)) === JSON.stringify([[0,1,3],[1,3],[3]]);
  const ledger = validateVisualLedger(players,pots);
  const odd = splitAwards({amount:101,winners:[1,3]},0,6);
  const oddChipPass = odd[0]?.id === 1 && odd[0]?.amount === 51 && odd[1]?.id === 3 && odd[1]?.amount === 50;
  const six = Array.from({length:6},(_,id)=>({id,hand:[1,2]}));
  const heads = [{id:0,hand:[1,2]},{id:1,hand:[]},{id:2,hand:[]},{id:3,hand:[]},{id:4,hand:[1,2]},{id:5,hand:[]}];
  const sixBlind = blindSeats(six,2,6);
  const headsBlind = blindSeats(heads,0,6);
  const blindPass = sixBlind.smallBlind === 3 && sixBlind.bigBlind === 4 && headsBlind.smallBlind === 0 && headsBlind.bigBlind === 4;
  return {
    build:"PHASE-337-PHYSICAL-POT-WINNER-SETTLEMENT-LOCK",
    pass: potAmountsPass && eligibilityPass && ledger.pass && oddChipPass && blindPass,
    potAmountsPass,
    eligibilityPass,
    ledger,
    oddChipPass,
    blindPass,
    pots,
    odd,
    sixBlind,
    headsBlind
  };
}
