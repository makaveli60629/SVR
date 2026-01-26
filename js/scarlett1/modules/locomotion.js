export const Locomotion = {
  _keys: new Set(),
  _drag: null,
  _vel: { x: 0, z: 0 },
  _inited: false,

  init() {
    if (this._inited) return;
    this._inited = true;

    window.addEventListener('keydown', (e) => this._keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this._keys.delete(e.key.toLowerCase()));

    window.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.tagName === 'BUTTON') return;
      this._drag = { x: e.clientX, y: e.clientY };
    }, { passive: true });

    window.addEventListener('pointerup', () => { this._drag = null; }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      if (!this._drag) return;
      const dx = e.clientX - this._drag.x;
      const dy = e.clientY - this._drag.y;
      this._vel.x = dx * 0.002;
      this._vel.z = dy * 0.002;
      this._drag.x = e.clientX;
      this._drag.y = e.clientY;
    }, { passive: true });
  },

  update(dt, playerGroup) {
    if (!playerGroup) return;
    const speed = 2.0;

    let vx = 0, vz = 0;
    if (this._keys.has('a')) vx -= 1;
    if (this._keys.has('d')) vx += 1;
    if (this._keys.has('w')) vz -= 1;
    if (this._keys.has('s')) vz += 1;

    playerGroup.position.x += vx * speed * dt;
    playerGroup.position.z += vz * speed * dt;

    playerGroup.position.x += this._vel.x;
    playerGroup.position.z += this._vel.z;
    this._vel.x *= 0.88;
    this._vel.z *= 0.88;
  }
};
