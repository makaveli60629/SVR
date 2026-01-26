// js/scarlett1/modules/store.js
import { getScene, ensureEntity, qs, addClickTarget, setVisible } from './utils.js';

let _root = null;
let _visible = false;

function buildStore() {
  const scene = getScene();
  if (!scene) return null;

  _root = ensureEntity('scarlett-store-root','a-entity', scene);
  _root.setAttribute('position','8 0 -18');
  _root.setAttribute('rotation','0 -35 0');

  // Base platform
  const base = document.createElement('a-cylinder');
  base.setAttribute('radius','3.2');
  base.setAttribute('height','0.3');
  base.setAttribute('color','#123018');
  base.setAttribute('material','roughness: 0.95');
  _root.appendChild(base);

  // Jungle arches (simple)
  for (let i=0;i<6;i++){
    const arch = document.createElement('a-torus');
    arch.setAttribute('radius','2.6');
    arch.setAttribute('radius-tubular','0.08');
    arch.setAttribute('rotation', `90 0 ${i*60}`);
    arch.setAttribute('position','0 1.5 0');
    arch.setAttribute('color','#1a6b2a');
    arch.setAttribute('material','emissive: #0f3; emissiveIntensity: 0.25; roughness:0.9');
    _root.appendChild(arch);
  }

  // Items pedestals
  const labels = [
    { name:'Avatar Skin', price:'$500', x:-1.6, z:0.9 },
    { name:'Table Felt', price:'$250', x:0, z:1.8 },
    { name:'Chip Set', price:'$150', x:1.6, z:0.9 },
  ];
  labels.forEach((it, idx) => {
    const p = document.createElement('a-cylinder');
    p.setAttribute('radius','0.45');
    p.setAttribute('height','1.0');
    p.setAttribute('position', `${it.x} 0.5 ${it.z}`);
    p.setAttribute('color','#0b0b10');
    p.setAttribute('material','emissive:#A020F0; emissiveIntensity: 0.7; roughness:0.8');
    addClickTarget(p);
    p.addEventListener('click', () => console.log(`[store] selected: ${it.name}`));
    _root.appendChild(p);

    const t = document.createElement('a-text');
    t.setAttribute('value', `${it.name}\n${it.price}`);
    t.setAttribute('align','center');
    t.setAttribute('width','4');
    t.setAttribute('color','#00FFFF');
    t.setAttribute('position', `${it.x} 1.35 ${it.z}`);
    t.setAttribute('rotation','0 0 0');
    _root.appendChild(t);
  });

  // Sign
  const sign = document.createElement('a-text');
  sign.setAttribute('value','JUNGLE STORE');
  sign.setAttribute('align','center');
  sign.setAttribute('width','10');
  sign.setAttribute('color','#00FF00');
  sign.setAttribute('position','0 3.1 0');
  _root.appendChild(sign);

  setVisible(_root, false);
  return _root;
}

export const store = {
  spawn() {
    if (!_root) buildStore();
    _visible = true;
    setVisible(_root, true);
  },
  toggle() {
    if (!_root) buildStore();
    _visible = !_visible;
    setVisible(_root, _visible);
    return _visible;
  },
  hide() {
    if (!_root) return;
    _visible = false;
    setVisible(_root, false);
  }
};
