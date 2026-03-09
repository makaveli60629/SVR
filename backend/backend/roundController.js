
const poker=require("./pokerEngine");
const dealer=require("./dealer");
const bet=require("./betManager");
const {getTable}=require("./tableManager");

function startRound(tableId){

const table=getTable(tableId);
if(!table) return;

poker.startHand(tableId);
bet.postBlinds(tableId);

table.stage="preflop";

}

function nextStage(tableId){

const table=getTable(tableId);
if(!table) return;

if(table.stage==="preflop"){
poker.dealFlop(tableId);
table.stage="flop";
return;
}

if(table.stage==="flop"){
poker.dealTurn(tableId);
table.stage="turn";
return;
}

if(table.stage==="turn"){
poker.dealRiver(tableId);
table.stage="river";
return;
}

if(table.stage==="river"){
table.stage="showdown";
}

}

module.exports={
startRound,
nextStage
};
