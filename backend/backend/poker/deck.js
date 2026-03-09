const suits=["♠","♥","♦","♣"]
const ranks=["A","K","Q","J","10","9","8","7","6","5","4","3","2"]

function createDeck(){
 let deck=[]
 suits.forEach(s=>{
  ranks.forEach(r=>{
   deck.push(r+s)
  })
 })
 return shuffle(deck)
}

function shuffle(deck){
 return deck.sort(()=>Math.random()-0.5)
}

module.exports={createDeck}
