Place these files inside your backend folder.

Then modify server.js and add:

const { createTable, joinTable, getTable } = require("./tableManager");
const poker = require("./pokerEngine");

createTable("table1");

io.on("connection", (socket) => {

  socket.on("joinTable", ({ tableId, playerId }) => {
    if (joinTable(tableId, playerId)) {
      socket.join(tableId);
      io.to(tableId).emit("tableUpdate", getTable(tableId));
    }
  });

  socket.on("startHand", ({ tableId }) => {
    poker.startHand(tableId);
    io.to(tableId).emit("tableUpdate", getTable(tableId));
  });

  socket.on("bet", ({ tableId, playerId, amount }) => {
    poker.placeBet(tableId, playerId, amount);
    io.to(tableId).emit("tableUpdate", getTable(tableId));
  });

});