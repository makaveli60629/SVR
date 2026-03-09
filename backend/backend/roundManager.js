
const {getTable}=require("./tableManager");
const {evaluateHand,compareHands}=require("./handEvaluator");

function determineWinner(tableId){

const table=getTable(tableId);
if(!table) return null;

let bestPlayer=null;
let bestScore=null;

for(const player of table.players){

if(player.folded) continue;

const score=evaluateHand(player.hand,table.community);

if(!bestScore){
bestScore=score;
bestPlayer=player;
continue;
}

const result=compareHands(score,bestScore);

if(result===1){
bestScore=score;
bestPlayer=player;
}

}

if(bestPlayer){
bestPlayer.chips+=table.pot;
}

return bestPlayer;

}

module.exports={
determineWinner
};
