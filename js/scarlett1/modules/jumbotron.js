// js/scarlett1/modules/jumbotron.js
import { getScene, ensureEntity, setVisible } from './utils.js';

let _root = null;
let _visible = true;

export const jumbotron = {
  spawn() {
    const scene = getScene();
    if (!scene) return null;
    if (_root) return _root;

    _root = ensureEntity('scarlett-jumbotron','a-entity', scene);
    _root.setAttribute('position','0 6 -20');

    const screen = document.createElement('a-plane');
    screen.setAttribute('width','10');
    screen.setAttribute('height','5.6');
    screen.setAttribute('material','color:#111; emissive:#00ffff; emissiveIntensity:0.06; opacity:0.96; transparent:true');
    _root.appendChild(screen);

    const title = document.createElement('a-text');
    title.setAttribute('value','JUMBOTRON • VIDEO READY');
    title.setAttribute('align','center');
    title.setAttribute('width','12');
    title.setAttribute('color','#00FF00');
    title.setAttribute('position','0 2.6 0.02');
    _root.appendChild(title);

    const hint = document.createElement('a-text');
    hint.setAttribute('value','(Connect your video later: set material src to a <video> asset)');
    hint.setAttribute('align','center');
    hint.setAttribute('width','10');
    hint.setAttribute('color','#00FFFF');
    hint.setAttribute('position','0 -2.7 0.02');
    _root.appendChild(hint);

    setVisible(_root, _visible);
    return _root;
  },
  toggle() {
    if (!_root) this.spawn();
    _visible = !_visible;
    setVisible(_root,_visible);
    return _visible;
  }
};
