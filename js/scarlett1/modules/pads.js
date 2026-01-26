// js/scarlett1/modules/pads.js
import { getScene, addClickTarget, setVisible, ensureEntity } from './utils.js';

let _root = null;

function makePad(label, pos, onClick) {
  const g = document.createElement('a-entity');
  g.setAttribute('position', pos);

  const base = document.createElement('a-box');
  base.setAttribute('width','0.6');
  base.setAttribute('height','0.12');
  base.setAttribute('depth','0.35');
  base.setAttribute('material','color:#002200; emissive:#00ff88; emissiveIntensity:0.25; opacity:0.95; transparent:true');
  addClickTarget(base);
  base.addEventListener('click', onClick);
  g.appendChild(base);

  const t = document.createElement('a-text');
  t.setAttribute('value', label);
  t.setAttribute('align','center');
  t.setAttribute('width','2.2');
  t.setAttribute('color','#00FFFF');
  t.setAttribute('position','0 0.09 0.18');
  g.appendChild(t);

  return g;
}

export const pads = {
  spawn() {
    const scene = getScene();
    if (!scene) return;

    if (_root) return _root;
    _root = ensureEntity('scarlett-pads','a-entity', scene);
    _root.setAttribute('position','0 1.0 -2.0');

    _root.appendChild(makePad('ENTER VR', '-1.1 0 0', () => window.scarlettModule?.enterVR?.()));
    _root.appendChild(makePad('RESET', '0 0 0', () => window.scarlettModule?.resetSpawn?.()));
    _root.appendChild(makePad('WATCH', '1.1 0 0', () => window.scarlettModule?.watch?.toggle?.()));

    return _root;
  },
  show() { if (_root) setVisible(_root,true); },
  hide() { if (_root) setVisible(_root,false); }
};
