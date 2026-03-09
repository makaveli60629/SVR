
const { getTable } = require("./tableManager");

function assignSeat(tableId, playerId){
  const table = getTable(tableId);
  if(!table) return null;

  if(!table.seats) table.seats = [];

  for(let i=0;i<table.maxPlayers;i++){
    if(!table.seats[i]){
      table.seats[i] = playerId;
      return i;
    }
  }

  return null;
}

function getSeat(tableId, playerId){
  const table = getTable(tableId);
  if(!table || !table.seats) return null;
  return table.seats.indexOf(playerId);
}

module.exports = {
  assignSeat,
  getSeat
};
