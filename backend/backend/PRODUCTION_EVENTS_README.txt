
Add these imports to server.js

const seats = require("./seatManager");
const dealerButton = require("./dealerButton");
const sidepots = require("./sidePotManager");
const wallet = require("./walletManager");
const reconnect = require("./reconnectManager");

Example events:

socket.on("sit", ({tableId, playerId}) => {

  const seat = seats.assignSeat(tableId, playerId);
  io.to(tableId).emit("seatUpdate", {playerId, seat});

});

socket.on("rotateDealer", ({tableId}) => {

  const dealer = dealerButton.rotateDealer(tableId);
  io.to(tableId).emit("dealerUpdate", dealer);

});

socket.on("sidePots", ({tableId}) => {

  const pots = sidepots.calculateSidePots(tableId);
  io.to(tableId).emit("sidePots", pots);

});

socket.on("walletSync", async ({playerId}) => {

  const balance = await wallet.getWallet(playerId);
  socket.emit("wallet", balance);

});
