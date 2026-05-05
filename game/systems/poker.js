const gameState = {
  players: [],
  pot: 0,
  currentBet: 0,
  currentPlayerIndex: 0,
  awaitingInput: false,
  playerChips: 1000
};

function nextTurn() {
  gameState.currentPlayerIndex++;

  if (gameState.currentPlayerIndex >= gameState.players.length) {
    gameState.currentPlayerIndex = 0;
  }

  const current = gameState.players[gameState.currentPlayerIndex];

  if (current === "USER") {
    gameState.awaitingInput = true;
    updateWatch();
    return;
  }

  setTimeout(() => {
    npcAct(current);
    nextTurn();
  }, 1400);
}

function playerFold() {
  gameState.awaitingInput = false;
  nextTurn();
}

function playerCall() {
  gameState.playerChips -= gameState.currentBet;
  gameState.pot += gameState.currentBet;
  gameState.awaitingInput = false;
  updateWatch();
  nextTurn();
}

function playerRaise() {
  const raise = gameState.currentBet + 50;
  gameState.playerChips -= raise;
  gameState.pot += raise;
  gameState.currentBet = raise;
  gameState.awaitingInput = false;
  updateWatch();
  nextTurn();
}

function npcAct(player) {
  const actions = ["fold", "call", "raise"];
  const action = actions[Math.floor(Math.random() * actions.length)];

  if (action === "call") gameState.pot += gameState.currentBet;
  if (action === "raise") gameState.currentBet += 50;
}

function updateWatch() {
  const el = document.querySelector("#watch-ui");
  if (!el) return;

  el.setAttribute("text", "value",
    `Chips: ${gameState.playerChips}\nPot: ${gameState.pot}\nBet: ${gameState.currentBet}`
  );
}

window.playerFold = playerFold;
window.playerCall = playerCall;
window.playerRaise = playerRaise;
window.startGameLoop = nextTurn;
