
class Deck {

constructor(){

const suits=["H","D","C","S"];
const ranks=["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

this.cards=[];

for(const s of suits){
for(const r of ranks){
this.cards.push(r+s);
}
}

}

shuffle(){

for(let i=this.cards.length-1;i>0;i--){

const j=Math.floor(Math.random()*(i+1));
[this.cards[i],this.cards[j]]=[this.cards[j],this.cards[i]];

}

}

deal(){
return this.cards.pop();
}

}

module.exports=Deck;
