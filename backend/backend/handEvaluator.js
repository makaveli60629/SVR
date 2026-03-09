
function evaluateHand(playerHand,community){

const cards=[...playerHand,...community];
const rankOrder="23456789TJQKA";

const values=cards.map(c=>rankOrder.indexOf(c[0]));
values.sort((a,b)=>b-a);

return values.slice(0,5);

}

function compareHands(a,b){

for(let i=0;i<a.length;i++){
if(a[i]>b[i]) return 1;
if(a[i]<b[i]) return -1;
}

return 0;

}

module.exports={
evaluateHand,
compareHands
};
