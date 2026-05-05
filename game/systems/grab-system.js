AFRAME.registerComponent('hand-grab', {
  init: function () {
    this.el.addEventListener('triggerdown', () => this.tryGrab());
    this.el.addEventListener('triggerup', () => this.release());
  },

  tryGrab: function () {
    const objs = document.querySelectorAll('[grabbable]');
    objs.forEach(obj => {
      const dist = this.el.object3D.position.distanceTo(obj.object3D.position);
      if (dist < 0.2) {
        obj.components.grabbable.grab(this.el);
        this.grabbed = obj;
      }
    });
  },

  release: function () {
    if (this.grabbed) {
      this.grabbed.components.grabbable.release();
      this.grabbed = null;
    }
  }
});
