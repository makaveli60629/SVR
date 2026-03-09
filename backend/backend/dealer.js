
const poker=require("./pokerEngine");

function runBoard(tableId){

poker.dealFlop(tableId);
poker.dealTurn(tableId);
poker.dealRiver(tableId);

}

module.exports={
runBoard
};
