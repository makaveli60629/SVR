
const { getTable } = require("./tableManager");

function postBlinds(tableId){

const table=getTable(tableId);
if(!table) return;

const smallBlind=10;
const bigBlind=20;

if(table.players.length<2) return;

table.players[0].chips-=smallBlind;
table.players[0].bet=smallBlind;

table.players[1].chips-=bigBlind;
table.players[1].bet=bigBlind;

table.pot+=smallBlind+bigBlind;

table.currentBet=bigBlind;

}

function call(tableId,playerId){

const table=getTable(tableId);
const player=table.players.find(p=>p.id===playerId);
if(!player) return;

const amount=table.currentBet-player.bet;

player.chips-=amount;
player.bet+=amount;
table.pot+=amount;

}

function raise(tableId,playerId,amount){

const table=getTable(tableId);
const player=table.players.find(p=>p.id===playerId);
if(!player) return;

table.currentBet+=amount;

player.chips-=table.currentBet-player.bet;
table.pot+=table.currentBet-player.bet;
player.bet=table.currentBet;

}

function fold(tableId,playerId){

const table=getTable(tableId);
const player=table.players.find(p=>p.id===playerId);
if(player) player.folded=true;

}

module.exports={
postBlinds,
call,
raise,
fold
};
