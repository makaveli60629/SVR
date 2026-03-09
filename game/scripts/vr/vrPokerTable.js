
export class VRPokerTable{

constructor(scene){
  this.scene = scene;
  this.tableState = null;
}

update(table){

  this.tableState = table;
  this.renderCommunity();
  this.renderPlayers();

}

renderCommunity(){

  if(!this.tableState) return;

  const cards = this.tableState.community || [];

  cards.forEach((card,i)=>{

    let el = document.getElementById("community"+i);

    if(!el){

      el = document.createElement("a-plane");

      el.setAttribute("id","community"+i);
      el.setAttribute("width","0.3");
      el.setAttribute("height","0.45");
      el.setAttribute("position",`${i*0.4-0.8} 1.1 -1`);

      this.scene.appendChild(el);
    }

    el.setAttribute("text","value:"+card+";align:center;color:black");
    el.setAttribute("material","color:white");

  });

}

renderPlayers(){

  if(!this.tableState) return;

  this.tableState.players.forEach((p,i)=>{

    let seat = document.getElementById("seat"+i);

    if(!seat){

      seat = document.createElement("a-cylinder");

      seat.setAttribute("id","seat"+i);
      seat.setAttribute("radius","0.3");
      seat.setAttribute("height","0.1");

      seat.setAttribute("position",
      `${Math.cos(i)*2} 0.5 ${Math.sin(i)*2}`);

      this.scene.appendChild(seat);

    }

  });

}

}
