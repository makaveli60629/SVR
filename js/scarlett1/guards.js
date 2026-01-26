// js/scarlett1/guards.js - guard-bot component (PERMANENT)
AFRAME.registerComponent('guard-bot', {
  schema: {
    model: { type: 'string', default: 'assets/models/combat_ninja.glb' },
    radius: { type: 'number', default: 3.0 },
    turnSpeed: { type: 'number', default: 2.5 },
    alertColor: { type: 'color', default: '#ff0044' },
    idleColor: { type: 'color', default: '#00ff88' }
  },

  init() {
    this.cam = document.querySelector('#main-cam');
    this.active = false;

    this.root = document.createElement('a-entity');
    this.el.appendChild(this.root);

    const model = document.createElement('a-entity');
    model.setAttribute('gltf-model', this.data.model);
    model.setAttribute('position', '0 0 0');
    model.setAttribute('rotation', '0 180 0');
    model.setAttribute('scale', '1 1 1');

    model.addEventListener('model-error', () => {
      // Fallback placeholder if GLB fails
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
      visor.setAttribute('position', '0 1.55 0.18');
      visor.setAttribute('material', `color:${this.data.idleColor}; emissive:${this.data.idleColor}; emissiveIntensity:2`);

      model.appendChild(body);
      model.appendChild(head);
      model.appendChild(visor);
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
    if (!this.cam) this.cam = document.querySelector('#main-cam');
    if (!this.cam) return;

    const camObj = this.cam.object3D;
    const guardObj = this.el.object3D;

    const dx = camObj.position.x - guardObj.position.x;
    const dz = camObj.position.z - guardObj.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const shouldBeActive = dist <= this.data.radius;

    if (shouldBeActive !== this.active) {
      this.active = shouldBeActive;
      const c = this.active ? this.data.alertColor : this.data.idleColor;
      this.ring.setAttribute('material', `color:${c}; emissive:${c}; emissiveIntensity:${this.active ? 10 : 4}; opacity:0.9; transparent:true`);
    }

    if (this.active) {
      const targetYaw = Math.atan2(dx, dz) * (180 / Math.PI);
      const current = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
      const delta = (targetYaw - current.y + 540) % 360 - 180;
      const step = Math.min(Math.max(delta, -this.data.turnSpeed), this.data.turnSpeed);
      this.el.setAttribute('rotation', `0 ${current.y + step} 0`);
    }
  }
});
