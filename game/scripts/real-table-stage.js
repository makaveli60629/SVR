document.addEventListener('DOMContentLoaded', () => {

  // Setup players
  gameState.players = ["USER", "NPC1", "NPC2", "NPC3"];

  // Spawn cards
  for (let i = 0; i < 2; i++) {
    const card = document.createElement('a-box');
    card.setAttribute('depth', 0.01);
    card.setAttribute('height', 0.14);
    card.setAttribute('width', 0.1);
    card.setAttribute('color', '#ffffff');

    card.setAttribute('grabbable', '');
    card.setAttribute('card-peek', '');

    card.setAttribute('position', `${i * 0.12} 1 -1`);

    document.querySelector('a-scene').appendChild(card);
  }

  startGameLoop();
});
