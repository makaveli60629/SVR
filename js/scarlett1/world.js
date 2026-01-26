// js/scarlett1/world.js - world actions (PERMANENT)
export const world = {
  dealFlop() {
    const cards = document.querySelector('#community-cards');
    if (!cards) return;

    cards.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('a-box');
      c.setAttribute('width', '0.5');
      c.setAttribute('height', '0.7');
      c.setAttribute('depth', '0.02');
      c.setAttribute('material', 'src: #cardBackTex; roughness: 0.8; metalness: 0.0;');
      c.setAttribute('position', `${(i - 1) * 0.75} 0 0`);
      c.setAttribute('animation', `property: position; dir: alternate; dur: 2000; loop: true; to: ${(i - 1) * 0.75} 0.15 0`);
      cards.appendChild(c);
    }
  },

  resetPlayer() {
    const rig = document.querySelector('#rig');
    if (rig) rig.setAttribute('position', '0 0 0');
  }
};
