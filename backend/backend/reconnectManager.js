
const sessions = {};

function registerConnection(playerId, socketId){
  sessions[playerId] = socketId;
}

function getConnection(playerId){
  return sessions[playerId];
}

function removeConnection(playerId){
  delete sessions[playerId];
}

module.exports = {
  registerConnection,
  getConnection,
  removeConnection
};
