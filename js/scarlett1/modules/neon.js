// js/scarlett1/modules/neon.js
import { qsa } from './utils.js';

let _enabled = false;

export function enablePulse() {
  _enabled = true;
  // Pulse any entity tagged with data-neon="1" OR material emissiveIntensity present
  const targets = qsa('[data-neon="1"]');
  targets.forEach((el, idx) => {
    if (el.getAttribute('animation__neon')) return;
    el.setAttribute('animation__neon', `property: material.emissiveIntensity; dir: alternate; dur: ${1800 + (idx%7)*120}; loop: true; to: 26`);
  });
}

export function tagNeon(el) {
  if (!el) return;
  el.setAttribute('data-neon','1');
  if (_enabled) enablePulse();
}
