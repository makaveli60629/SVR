const {createDeck}=require("./deck")

class PokerEngine{

 startHand(table){

   const deck=createDeck()

   table.players.forEach(p=>{
     p.cards=[deck.pop(),deck.pop()]
   })

   table.community=[
     deck.pop(),
     deck.pop(),
     deck.pop(),
     deck.pop(),
     deck.pop()
   ]

 }

}

module.exports=PokerEngine
