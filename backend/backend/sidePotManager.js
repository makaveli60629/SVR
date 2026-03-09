
const { getTable } = require("./tableManager");

function calculateSidePots(tableId){

  const table = getTable(tableId);
  if(!table) return [];

  const bets = table.players.map(p => p.bet);
  const unique = [...new Set(bets)].sort((a,b)=>a-b);

  const pots = [];

  for(let i=0;i<unique.length;i++){
    const level = unique[i];
    const contributors =
      table.players.filter(p => p.bet >= level);

    const potValue =
      contributors.length *
      (level - (unique[i-1] || 0));

    pots.push({
      amount: potValue,
      players: contributors.map(p=>p.id)
    });
  }

  return pots;
}

module.exports = {
  calculateSidePots
};
