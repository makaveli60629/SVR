
class VRPlayerController{

constructor(playerId, bridge){
  this.playerId = playerId;
  this.bridge = bridge;
}

sit(tableId){
  this.bridge.joinTable(tableId, this.playerId);
}

bet(tableId, amount){
  this.bridge.bet(tableId, this.playerId, amount);
}

fold(tableId){
  this.bridge.fold(tableId, this.playerId);
}

startRound(tableId){
  this.bridge.startRound(tableId);
}

nextStage(tableId){
  this.bridge.nextStage(tableId);
}

}

module.exports = VRPlayerController;
