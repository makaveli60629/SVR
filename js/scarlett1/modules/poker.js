// js/scarlett1/modules/poker.js
import { qs, ensureEntity, addClickTarget } from './utils.js';

function cardEntity(i, x) {
  const c = document.createElement('a-box');
  c.setAttribute('width', '0.5');
  c.setAttribute('height', '0.7');
  c.setAttribute('depth', '0.02');
  // If Spine defines #cardBackTex in <a-assets>, use it. Else fallback to color.
  c.setAttribute('material', 'src: #cardBackTex; roughness: 0.85; metalness: 0.0; color: #ffffff;');
  c.setAttribute('position', `${x} 0 0`);
  c.setAttribute('animation', `property: position; dir: alternate; dur: 1800; loop: true; to: ${x} 0.12 0`);
  c.setAttribute('data-scarlett-card', String(i));
  addClickTarget(c);
  return c;
}

function ensureCommunityAnchor() {
  // Prefer existing anchor in Spine, else create one above origin.
  return qs('#community-cards') || ensureEntity('community-cards','a-entity', qs('#poker-table') || qs('#main-lobby') || qs('a-scene'));
}

function clearCards() {
  const a = ensureCommunityAnchor();
  Array.from(a.children).forEach(ch => ch.remove());
}

function dealN(n) {
  const a = ensureCommunityAnchor();
  clearCards();
  const xs = n === 3 ? [-0.75, 0, 0.75] : n === 4 ? [-1.125, -0.375, 0.375, 1.125] : [-1.5, -0.75, 0, 0.75, 1.5];
  for (let i=0;i<n;i++) a.appendChild(cardEntity(i, xs[i]));
}

export const poker = {
  dealFlop() { dealN(3); },
  dealTurn() { dealN(4); },
  dealRiver() { dealN(5); },
  resetHand() { clearCards(); },
  ensure() { ensureCommunityAnchor(); }
};
