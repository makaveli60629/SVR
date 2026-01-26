// js/world.js
const world = {
  dealFlop() {
    const cards = document.querySelector('#community-cards');
    if (!cards) return;
    cards.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('a-box');
      c.setAttribute('width', '0.5');
      c.setAttribute('height', '0.7');
      c.setAttribute('depth', '0.02');
      c.setAttribute('color', '#ffffff');
      c.setAttribute('position', `${(i - 1) * 0.75} 0 0`);
      c.setAttribute(
        'animation',
        `property: position; dir: alternate; dur: 2000; loop: true; to: ${(i - 1) * 0.75} 0.15 0`
      );
      cards.appendChild(c);
    }
  },

  resetPlayer() {
    const rig = document.querySelector('#rig');
    if (rig) rig.setAttribute('position', '0 0 0');
  }
};

// ---------------------------
// Combat Ninja Guard Component
// ---------------------------
AFRAME.registerComponent('guard-bot', {
  schema: {
    model: { type: 'string', default: 'assets/models/combat_ninja.glb' },
    radius: { type: 'number', default: 3.0 },          // detect distance
    turnSpeed: { type: 'number', default: 2.5 },       // look-at smoothing
    alertColor: { type: 'color', default: '#ff0044' }, // glow when active
    idleColor: { type: 'color', default: '#00ff88' }   // glow when idle
  },

  init() {
    this.rig = document.querySelector('#rig');
    this.cam = document.querySelector('#main-cam');
    this.active = false;

    // Create a parent container so we can rotate the whole guard smoothly.
    this.root = document.createElement('a-entity');
    this.el.appendChild(this.root);

    // Try load GLB model; fallback to a stylized placeholder.
    const model = document.createElement('a-entity');
    model.setAttribute('gltf-model', this.data.model);
    model.setAttribute('position', '0 0 0');
    model.setAttribute('rotation', '0 180 0'); // face “forward” by default
    model.setAttribute('scale', '1 1 1');

    // If the model fails to load, show a placeholder.
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

      const visor = document.createElement('a-ring');
      visor.setAttribute('radius-inner', '0.09');
      visor.setAttribute('radius-outer', '0.13');
      visor.setAttribute('rotation', '0 0 0');
      visor.setAttribute('position', '0 1.55 0.18');
      visor.setAttribute('material', `color:${this.data.idleColor}; emissive:${this.data.idleColor}; emissiveIntensity:2`);

      model.appendChild(body);
      model.appendChild(head);
      model.appendChild(visor);
    });

    this.root.appendChild(model);

    // Neon “status ring” under the guard (always visible)
    this.ring = document.createElement('a-ring');
    this.ring.setAttribute('rotation', '-90 0 0');
    this.ring.setAttribute('radius-inner', '0.35');
    this.ring.setAttribute('radius-outer', '0.45');
    this.ring.setAttribute('position', '0 0.01 0');
    this.ring.setAttribute(
      'material',
      `color:${this.data.idleColor}; emissive:${this.data.idleColor}; emissiveIntensity:4; opacity:0.9; transparent:true`
    );
    this.el.appendChild(this.ring);

    // Idle “breathing” animation
    this.root.setAttribute('animation__breath', 'property: scale; dir: alternate; dur: 1800; loop: true; to: 1.02 1.02 1.02');

    // Interaction: click/hand select
    this.el.classList.add('clickable');
    this.el.addEventListener('click', () => {
      console.log('[guard] Interacted');
      // You can trigger doors, UI, or warnings here.
    });
  },

  tick(time, dt) {
    if (!this.cam) this.cam = document.querySelector('#main-cam');
    if (!this.cam) return;

    // Use camera world position
    const camObj = this.cam.object3D;
    const guardObj = this.el.object3D;

    const dx = camObj.position.x - guardObj.position.x;
    const dz = camObj.position.z - guardObj.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const shouldBeActive = dist <= this.data.radius;

    // Toggle active ring color/glow
    if (shouldBeActive !== this.active) {
      this.active = shouldBeActive;
      const c = this.active ? this.data.alertColor : this.data.idleColor;
      this.ring.setAttribute('material', `color:${c}; emissive:${c}; emissiveIntensity:${this.active ? 10 : 4}; opacity:0.9; transparent:true`);
    }

    // If active, smoothly rotate to face the camera
    if (this.active) {
      const targetYaw = Math.atan2(dx, dz) * (180 / Math.PI);
      const current = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
      const delta = (targetYaw - current.y + 540) % 360 - 180; // shortest path
      const step = Math.min(Math.max(delta, -this.data.turnSpeed), this.data.turnSpeed);
      this.el.setAttribute('rotation', `0 ${current.y + step} 0`);
    }
  }
});

// Boot
document.addEventListener('DOMContentLoaded', () => {
  world.dealFlop();
});
