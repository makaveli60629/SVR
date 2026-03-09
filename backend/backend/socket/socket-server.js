const {Server}=require("socket.io")
const PokerEngine=require("../poker/poker-engine")
const Table=require("../poker/table-manager")

const tables={}
const engine=new PokerEngine()

function initSocket(server){

 const io=new Server(server,{cors:{origin:"*"}})

 io.on("connection",(socket)=>{

   console.log("Player connected")

   socket.on("joinTable",(tableId)=>{

     if(!tables[tableId])
       tables[tableId]=new Table(tableId)

     socket.join(tableId)

   })

   socket.on("startGame",(tableId)=>{
     engine.startHand(tables[tableId])
     io.to(tableId).emit("handStarted",tables[tableId])
   })

 })

}

module.exports=initSocket
