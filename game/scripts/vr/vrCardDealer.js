/**
 * SVR Poker — vrCardDealer.js
 * Renders a playing card as an A-Frame plane in 3D space.
 */

/**
 * @param {Element} scene  — A-Frame <a-scene> element
 * @param {string}  label  — e.g. "A♠", "K♥"
 * @param {string}  pos    — A-Frame position string e.g. "0 1.1 -1"
 * @param {string}  [id]   — Optional element ID
 */
export function dealCard(scene, label, pos, id = null) {
  const el = document.createElement('a-plane');
  if (id) el.setAttribute('id', id);
  el.setAttribute('width',  '0.30');
  el.setAttribute('height', '0.45');
  el.setAttribute('position', pos);
  el.setAttribute('rotation', '-90 0 0');
  el.setAttribute('color',   '#ffffff');
  el.setAttribute('text', `value: ${label}; align: center; color: black; width: 0.9`);
  scene.appendChild(el);
  return el;
}

/**
 * Remove a card by ID
 */
export function removeCard(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Animate a card deal — slides from deck position to target
 */
export function animateDeal(el, fromPos, toPos, duration = 600) {
  el.setAttribute('position', fromPos);
  el.setAttribute('animation', `property: position; to: ${toPos}; dur: ${duration}; easing: easeOutQuad`);
}
