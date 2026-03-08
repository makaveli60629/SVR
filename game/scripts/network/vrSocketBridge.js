
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

let socket = null;

export function connect(serverURL, playerId){

  socket = io(serverURL);

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("registerPlayer",{playerId});
  });

  socket.on("tableUpdate",(table)=>{
    console.log("Table update",table);
  });

  socket.on("winner",(winner)=>{
    console.log("Winner",winner);
  });

  return socket;
}

export function joinTable(tableId,playerId){
  socket.emit("joinTable",{tableId,playerId});
}

export function startRound(tableId){
  socket.emit("startRound",{tableId});
}

export function bet(tableId,playerId,amount){
  socket.emit("raise",{tableId,playerId,amount});
}

export function fold(tableId,playerId){
  socket.emit("fold",{tableId,playerId});
}

export function nextStage(tableId){
  socket.emit("nextStage",{tableId});
}
