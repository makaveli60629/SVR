
export function dealCard(scene,card,pos){

const el = document.createElement("a-plane");

el.setAttribute("width","0.3");
el.setAttribute("height","0.45");

el.setAttribute("position",pos);

el.setAttribute("text","value:"+card+";align:center;color:black");
el.setAttribute("material","color:white");

scene.appendChild(el);

}
