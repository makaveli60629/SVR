AFRAME.registerComponent('card-peek', {
  tick: function () {
    const cam = document.querySelector('[camera]');
    if (!cam) return;

    const dist = this.el.object3D.position.distanceTo(cam.object3D.position);

    if (dist < 0.3) {
      this.el.object3D.rotation.x = -1.2;
    } else {
      this.el.object3D.rotation.x = 0;
    }
  }
});
