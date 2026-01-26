// js/scarlett1/modules/watch.js
import { qs, getScene, addClickTarget, setVisible } from './utils.js';

let _root = null;
let _visible = false;

function buildWatch() {
  const scene = getScene();
  if (!scene) return null;

  const cam = qs('#main-cam') || qs('a-camera');
  if (!cam) return null;

  _root = document.createElement('a-entity');
  _root.setAttribute('id','scarlett-watch');
  _root.setAttribute('position','0.35 -0.25 -0.6'); // in view, like a wrist panel
  _root.setAttribute('rotation','-10 0 0');
  cam.appendChild(_root);

  const panel = document.createElement('a-plane');
  panel.setAttribute('width','0.55');
  panel.setAttribute('height','0.28');
  panel.setAttribute('color','#001a10');
  panel.setAttribute('material','opacity:0.92; transparent:true; emissive:#00ff88; emissiveIntensity:0.08');
  _root.appendChild(panel);

  const label = document.createElement('a-text');
  label.setAttribute('value','SCARLETT WATCH');
  label.setAttribute('align','center');
  label.setAttribute('width','1.2');
  label.setAttribute('color','#00FFFF');
  label.setAttribute('position','0 0.08 0.01');
  _root.appendChild(label);

  const buttons = [
    { txt:'FLOP', x:-0.18, fn:() => window.scarlettModule?.poker?.dealFlop?.() },
    { txt:'STORE', x:0.00, fn:() => window.scarlettModule?.store?.toggle?.() },
    { txt:'RADIO', x:0.18, fn:() => window.scarlettModule?.radio?.toggle?.() },
  ];
  buttons.forEach(b => {
    const btn = document.createElement('a-box');
    btn.setAttribute('width','0.14');
    btn.setAttribute('height','0.07');
    btn.setAttribute('depth','0.02');
    btn.setAttribute('position', `${b.x} -0.05 0.02`);
    btn.setAttribute('material','color:#0b0b10; emissive:#A020F0; emissiveIntensity:0.6');
    addClickTarget(btn);
    btn.addEventListener('click', b.fn);
    _root.appendChild(btn);

    const t = document.createElement('a-text');
    t.setAttribute('value', b.txt);
    t.setAttribute('align','center');
    t.setAttribute('width','0.6');
    t.setAttribute('color','#00FF00');
    t.setAttribute('position', `${b.x} -0.05 0.04`);
    _root.appendChild(t);
  });

  setVisible(_root,false);
  return _root;
}

export const watch = {
  toggle() {
    if (!_root) buildWatch();
    _visible = !_visible;
    setVisible(_root,_visible);
    return _visible;
  },
  show() { if (!_root) buildWatch(); _visible=true; setVisible(_root,true); },
  hide() { if (!_root) return; _visible=false; setVisible(_root,false); }
};
