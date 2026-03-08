
function dealCards(){
const cards=["A♠","K♠","Q♠","J♠","10♠","A♥","K♥","Q♥"]
let c1=cards[Math.floor(Math.random()*cards.length)]
let c2=cards[Math.floor(Math.random()*cards.length)]
alert("Your hand: "+c1+" "+c2)
}
