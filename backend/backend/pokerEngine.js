
const Deck=require("./deck");
const {getTable}=require("./tableManager");

function startHand(tableId){

const table=getTable(tableId);
if(!table) return;

const deck=new Deck();
deck.shuffle();

table.deck=deck;
table.pot=0;
table.community=[];

for(const player of table.players){

player.hand=[deck.deal(),deck.deal()];
player.bet=0;
player.folded=false;

}

}

function dealFlop(tableId){

const table=getTable(tableId);

table.community.push(
table.deck.deal(),
table.deck.deal(),
table.deck.deal()
);

}

function dealTurn(tableId){

const table=getTable(tableId);

table.community.push(
table.deck.deal()
);

}

function dealRiver(tableId){

const table=getTable(tableId);

table.community.push(
table.deck.deal()
);

}

function placeBet(tableId,playerId,amount){

const table=getTable(tableId);

const player=table.players.find(p=>p.id===playerId);
if(!player) return;

player.chips-=amount;
player.bet+=amount;
table.pot+=amount;

}

module.exports={
startHand,
dealFlop,
dealTurn,
dealRiver,
placeBet
};
