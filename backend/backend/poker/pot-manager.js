class PotManager{

 constructor(){
   this.pot=0
 }

 addBet(amount){
   this.pot+=amount
 }

 reset(){
   this.pot=0
 }

}

module.exports=PotManager
