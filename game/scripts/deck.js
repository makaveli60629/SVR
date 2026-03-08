
export function createDeck(){
const suits=["♠","♥","♦","♣"]
const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
let deck=[]
for(let s of suits){
 for(let r of ranks){
  deck.push({suit:s,rank:r})
 }
}
return deck
}
