
export function attachGesture(hand,callback){

hand.addEventListener("gripdown",()=>{
callback("bet");
});

hand.addEventListener("triggerdown",()=>{
callback("fold");
});

}
