Add these modules to your backend/backend folder.

Then update server.js.

Example usage:

const dealer = require("./dealer");
const roundManager = require("./roundManager");

socket.on("runBoard", ({ tableId }) => {

  dealer.runBoard(tableId);
  io.to(tableId).emit("tableUpdate", getTable(tableId));

});

socket.on("showdown", ({ tableId }) => {

  const winner = roundManager.determineWinner(tableId);
  io.to(tableId).emit("winner", winner);

});

This adds:

- flop / turn / river
- showdown
- pot distribution