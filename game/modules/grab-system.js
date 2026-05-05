AFRAME.registerComponent('hand-grab', {
  init() {
    this.target = null;

    this.el.addEventListener('triggerdown', () => this.tryGrab());
    this.el.addEventListener('triggerup', () => this.release());
  },

  tryGrab() {
    document.querySelectorAll('[grabbable]').forEach(obj => {
      const d = this.el.object3D.position.distanceTo(obj.object3D.position);
      if (d < 0.25 && !this.target) {
        obj.components.grabbable.grab(this.el);
        this.target = obj;
      }
    });
  },

  release() {
    if (!this.target) return;
    this.target.components.grabbable.release();
    this.target = null;
  }
});
