import {PokerEngine} from "../systems/pokerEngine.js"

export class PokerTable {

constructor(scene){

this.scene = scene
this.engine = new PokerEngine()

this.seats = []
this.cards = []

this.engine.addPlayer("seat1")
this.engine.addPlayer("seat2")
this.engine.addPlayer("seat3")
this.engine.addPlayer("seat4")
this.engine.addPlayer("seat5")
this.engine.addPlayer("seat6")

this.engine.startHand()

this.createTable()
this.createSeats()
this.spawnCards()

}

createTable(){

const table = document.createElement("a-cylinder")

table.setAttribute("radius","1.6")
table.setAttribute("height","0.15")
table.setAttribute("color","green")
table.setAttribute("position","0 1 -4")

this.scene.appendChild(table)

}

createSeats(){

const seatRadius = 2
const centerX = 0
const centerZ = -4

for(let i=0;i<6;i++){

let angle = (i/6) * Math.PI * 2

let x = centerX + Math.cos(angle) * seatRadius
let z = centerZ + Math.sin(angle) * seatRadius

const seat = document.createElement("a-box")

seat.setAttribute("width","0.4")
seat.setAttribute("height","0.1")
seat.setAttribute("depth","0.4")

seat.setAttribute("color","#222")
seat.setAttribute("position",`${x} 0.5 ${z}`)

this.scene.appendChild(seat)

this.seats.push(seat)

}

}

spawnCards(){

for(let i=0;i<this.engine.players.length;i++){

let player = this.engine.players[i]

for(let c=0;c<player.cards.length;c++){

const card = document.createElement("a-plane")

card.setAttribute("width","0.18")
card.setAttribute("height","0.26")

card.setAttribute("color","white")

let seat = this.seats[i]

let pos = seat.getAttribute("position")

card.setAttribute(
"position",
`${pos.x} 1.1 ${pos.z}`
)

card.setAttribute(
"rotation",
"-90 0 0"
)

this.scene.appendChild(card)

this.cards.push(card)

}

}

}

}
