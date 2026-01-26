// /js/scarlett1/world.js - Modular Feature Attachment (SCARLETT1)
// Expose as window.ScarlettWorld so HUD buttons can call safely.
window.ScarlettWorld = {
  dealFlop() {
    const container = document.querySelector('#community-cards');
    if (!container) return;

    container.innerHTML = ''; // Clear previous

    for (let i = 0; i < 3; i++) {
      const card = document.createElement('a-box');

      card.classList.add('grabbable'); // IMPORTANT: collider targets this class
      card.setAttribute('width', '0.5');
      card.setAttribute('height', '0.7');
      card.setAttribute('depth', '0.02');
      card.setAttribute('position', `${(i - 1) * 0.7} 0 0`);

      // Visual: simple white placeholder (swap to textures later)
      card.setAttribute('material', 'color: #ffffff; metalness: 0.2; roughness: 0.8');

      // Make it grabbable for pinch/grab
      // super-hands uses these components to pick up and move entities.
      card.setAttribute('grabbable', '');      // allow grab
      card.setAttribute('stretchable', '');    // allow stretch (optional)
      card.setAttribute('droppable', '');      // allow drop
      card.setAttribute('hoverable', '');      // hover states

      // Hover animation for “living” table feel
      card.setAttribute('animation__hover', `property: position; dir: alternate; dur: 2000; loop: true; to: ${(i - 1) * 0.7} 0.08 0`);

      // Slight tilt so cards look more real
      card.setAttribute('rotation', '-90 0 0');

      container.appendChild(card);
    }

    console.log('Feature: Community Cards spawned (grabbable).');
  },

  spawnBot() {
    const anchor = document.querySelector('#bot-anchor');
    if (!anchor) return;

    const bot = document.createElement('a-entity');
    bot.innerHTML = `
      <a-sphere radius="0.5" position="4 1.5 0" color="#333"></a-sphere>
      <a-text value="BOT BOB" position="4 2.2 0" align="center" width="4"></a-text>
      <a-box width="0.3" height="0.5" position="3.5 1.2 0.2" rotation="45 0 0" color="white"></a-box>
    `;
    anchor.appendChild(bot);
  },

  toggleStore() {
    alert('Store Module: Loading Avatars (Male/Female/Ninja)…');
  }
};

// Initial state
document.addEventListener('DOMContentLoaded', () => {
  window.ScarlettWorld.dealFlop();
});
