class Player{

 constructor(id,username,chips){
   this.id=id
   this.username=username
   this.chips=chips
   this.cards=[]
   this.bet=0
   this.folded=false
 }

}

module.exports=Player
