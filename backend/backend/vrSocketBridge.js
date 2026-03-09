
const socketio = require("socket.io-client");

let socket = null;

function connect(serverURL, playerId){
  socket = socketio(serverURL);

  socket.on("connect", () => {
    console.log("VR Client Connected:", socket.id);
    socket.emit("registerPlayer", { playerId });
  });

  socket.on("tableUpdate", (table) => {
    console.log("Table Update:", table);
  });

  socket.on("winner", (winner) => {
    console.log("Winner:", winner);
  });

  return socket;
}

function joinTable(tableId, playerId){
  socket.emit("joinTable",{tableId,playerId});
}

function startRound(tableId){
  socket.emit("startRound",{tableId});
}

function bet(tableId,playerId,amount){
  socket.emit("raise",{tableId,playerId,amount});
}

function fold(tableId,playerId){
  socket.emit("fold",{tableId,playerId});
}

function nextStage(tableId){
  socket.emit("nextStage",{tableId});
}

module.exports = {
  connect,
  joinTable,
  startRound,
  bet,
  fold,
  nextStage
};
