// js/scarlett1/modules/guards.js
import { getScene, qs } from './utils.js';

const DEFAULT_MODEL = 'assets/models/combat_ninja.glb';

function ensureComponentRegistered() {
  if (AFRAME.components['guard-bot']) return;

  AFRAME.registerComponent('guard-bot', {
    schema: {
      model: { type: 'string', default: DEFAULT_MODEL },
      radius: { type: 'number', default: 3.5 },
      turnSpeed: { type: 'number', default: 2.8 },
      alertColor: { type: 'color', default: '#ff0044' },
      idleColor: { type: 'color', default: '#00ff88' }
    },
    init() {
      this.cam = qs('#main-cam') || qs('a-camera');
      this.active = false;

      this.root = document.createElement('a-entity');
      this.el.appendChild(this.root);

      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', this.data.model);
      model.setAttribute('rotation', '0 180 0');
      model.setAttribute('scale', '1 1 1');

      // Fallback primitive if GLB fails
      model.addEventListener('model-error', () => {
        model.removeAttribute('gltf-model');

        const body = document.createElement('a-cylinder');
        body.setAttribute('radius', '0.22');
        body.setAttribute('height', '1.5');
        body.setAttribute('position', '0 0.75 0');
        body.setAttribute('color', '#111');

        const head = document.createElement('a-sphere');
        head.setAttribute('radius', '0.18');
        head.setAttribute('position', '0 1.55 0');
        head.setAttribute('color', '#0b0b0b');

        model.appendChild(body);
        model.appendChild(head);
      });

      this.root.appendChild(model);

      this.ring = document.createElement('a-ring');
      this.ring.setAttribute('rotation', '-90 0 0');
      this.ring.setAttribute('radius-inner', '0.35');
      this.ring.setAttribute('radius-outer', '0.45');
      this.ring.setAttribute('position', '0 0.01 0');
      this.ring.setAttribute('material', `color:${this.data.idleColor}; emissive:${this.data.idleColor}; emissiveIntensity:4; opacity:0.9; transparent:true`);
      this.el.appendChild(this.ring);

      this.root.setAttribute('animation__breath', 'property: scale; dir: alternate; dur: 1800; loop: true; to: 1.02 1.02 1.02');
    },
    tick() {
      if (!this.cam) this.cam = qs('#main-cam') || qs('a-camera');
      if (!this.cam) return;

      const camObj = this.cam.object3D;
      const g = this.el.object3D;
      const dx = camObj.position.x - g.position.x;
      const dz = camObj.position.z - g.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);

      const should = dist <= this.data.radius;

      if (should !== this.active) {
        this.active = should;
        const c = this.active ? this.data.alertColor : this.data.idleColor;
        this.ring.setAttribute('material', `color:${c}; emissive:${c}; emissiveIntensity:${this.active ? 10 : 4}; opacity:0.9; transparent:true`);
      }

      if (this.active) {
        const targetYaw = Math.atan2(dx, dz) * (180/Math.PI);
        const cur = this.el.getAttribute('rotation') || {x:0,y:0,z:0};
        const delta = (targetYaw - cur.y + 540) % 360 - 180;
        const step = Math.min(Math.max(delta, -this.data.turnSpeed), this.data.turnSpeed);
        this.el.setAttribute('rotation', `0 ${cur.y + step} 0`);
      }
    }
  });
}

export function spawnDefault() {
  ensureComponentRegistered();
  const scene = getScene();
  if (!scene) return;

  // remove old guards if any
  Array.from(scene.querySelectorAll('[data-scarlett-guard="1"]')).forEach(e => e.remove());

  const placements = [
    { pos: '3 0 -24', radius: 3.5 },
    { pos: '-3 0 -24', radius: 3.5 },
    { pos: '0 0 -27', radius: 4.0 }
  ];

  placements.forEach((p) => {
    const e = document.createElement('a-entity');
    e.setAttribute('data-scarlett-guard','1');
    e.setAttribute('position', p.pos);
    e.setAttribute('guard-bot', `model:${DEFAULT_MODEL}; radius:${p.radius}`);
    scene.appendChild(e);
  });
}
