// js/scarlett1/modules/lights.js
import { getScene } from './utils.js';

let _ambient = null;
let _key = null;

function ensure() {
  const scene = getScene();
  if (!scene) return;
  if (!_ambient) {
    _ambient = document.createElement('a-light');
    _ambient.setAttribute('type','ambient');
    _ambient.setAttribute('intensity','1.6');
    scene.appendChild(_ambient);
  }
  if (!_key) {
    _key = document.createElement('a-light');
    _key.setAttribute('type','point');
    _key.setAttribute('position','0 10 -12');
    _key.setAttribute('intensity','3.2');
    _key.setAttribute('distance','120');
    scene.appendChild(_key);
  }
}

export function setBright(on=true) {
  ensure();
  if (!_ambient || !_key) return;
  if (on) {
    _ambient.setAttribute('intensity','1.9');
    _key.setAttribute('intensity','3.8');
  } else {
    _ambient.setAttribute('intensity','0.9');
    _key.setAttribute('intensity','1.6');
  }
}

export function ensureLighting() { ensure(); }
