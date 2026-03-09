class Table{

 constructor(id){
   this.id=id
   this.players=[]
   this.community=[]
   this.pot=0
 }

 addPlayer(player){
   if(this.players.length<6){
      this.players.push(player)
   }
 }

}

module.exports=Table
