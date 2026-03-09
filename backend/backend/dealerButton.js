
const { getTable } = require("./tableManager");

function rotateDealer(tableId){

  const table = getTable(tableId);
  if(!table) return;

  if(table.dealerIndex === undefined)
    table.dealerIndex = 0;
  else
    table.dealerIndex =
      (table.dealerIndex + 1) % table.players.length;

  return table.dealerIndex;

}

module.exports = {
  rotateDealer
};
