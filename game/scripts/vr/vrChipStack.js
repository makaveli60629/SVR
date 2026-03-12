/**
 * SVR Poker — vrChipStack.js
 * Renders a chip stack cylinder in an A-Frame scene.
 * Height is proportional to chip count.
 */

/**
 * @param {Element} scene   — A-Frame <a-scene> element
 * @param {number}  amount  — Number of chips (affects height)
 * @param {string}  pos     — A-Frame position string e.g. "1 0.85 -0.5"
 * @param {string}  [color] — Hex color string
 * @param {string}  [id]    — Optional element ID
 */
export function createChipStack(scene, amount, pos, color = '#ff3c3c', id = null) {
  const height = Math.max(0.02, amount / 500);

  const chip = document.createElement('a-cylinder');
  if (id) chip.setAttribute('id', id);
  chip.setAttribute('radius',   '0.14');
  chip.setAttribute('height',   String(height));
  chip.setAttribute('color',    color);
  chip.setAttribute('position', pos);
  chip.setAttribute('shadow',   'receive: true; cast: true');
  scene.appendChild(chip);

  // Label
  const label = document.createElement('a-text');
  const [x, y, z] = pos.split(' ').map(Number);
  label.setAttribute('value',    String(amount));
  label.setAttribute('position', `${x} ${y + height + 0.08} ${z}`);
  label.setAttribute('align',    'center');
  label.setAttribute('color',    '#ffe94d');
  label.setAttribute('scale',    '0.5 0.5 0.5');
  label.setAttribute('look-at',  '[camera]');
  scene.appendChild(label);

  return { chip, label };
}

/**
 * Update an existing chip stack's height and label
 */
export function updateChipStack(id, amount) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('height', String(Math.max(0.02, amount / 500)));
}
