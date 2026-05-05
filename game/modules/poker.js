window.gameState = {
  players: ["USER","NPC1","NPC2","NPC3"],
  pot: 0,
  currentBet: 50,
  currentPlayerIndex: 0,
  awaitingInput: false,
  playerChips: 1000
};

function nextTurn() {
  const g = gameState;
  g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;

  const p = g.players[g.currentPlayerIndex];

  if (p === "USER") {
    g.awaitingInput = true;
    updateWatch();
    return;
  }

  setTimeout(() => {
    npcAct();
    nextTurn();
  }, 1200);
}

function npcAct() {
  const g = gameState;
  const r = Math.random();

  if (r < 0.4) g.pot += g.currentBet;
  else if (r < 0.7) g.currentBet += 50;
}

function playerFold() {
  gameState.awaitingInput = false;
  nextTurn();
}

function playerCall() {
  const g = gameState;
  g.playerChips -= g.currentBet;
  g.pot += g.currentBet;
  g.awaitingInput = false;
  updateWatch();
  nextTurn();
}

function playerRaise() {
  const g = gameState;
  g.currentBet += 50;
  g.playerChips -= g.currentBet;
  g.pot += g.currentBet;
  g.awaitingInput = false;
  updateWatch();
  nextTurn();
}

function updateWatch() {
  if (!window.SVRWatchUI) return;
  window.SVRWatchUI.setData({
    chips: gameState.playerChips,
    pot: gameState.pot,
    bet: gameState.currentBet
  });
}

window.playerFold = playerFold;
window.playerCall = playerCall;
window.playerRaise = playerRaise;
window.startGameLoop = nextTurn;
