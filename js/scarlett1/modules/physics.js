// Simple card "peek" (no heavy physics engine yet)
export function initPhysics({ Bus, scene }) {
  function peek(card) {
    if (!card) return;
    const start = card.rotation.x;
    const up = -Math.PI / 3;
    card.rotation.x = up;
    setTimeout(() => { card.rotation.x = start; }, 700);
  }

  // Click/tap to peek nearest card (debug friendly)
  window.addEventListener('pointerdown', (e) => {
    // avoid UI clicks
    if (e.target && e.target.tagName === 'BUTTON') return;
    const cards = scene.userData._cards || [];
    if (!cards.length) return;
    // Peek last dealt card
    peek(cards[cards.length - 1]);
    Bus.log('PHYSICS: PEEK');
  }, { passive: true });

  window.peekCard = peek;
  Bus.log('PHYSICS & PEEK ENABLED');
}
