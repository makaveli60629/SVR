AFRAME.registerComponent('card-peek', {
  tick() {
    const cam = document.querySelector('[camera]');
    if (!cam) return;

    const d = this.el.object3D.position.distanceTo(cam.object3D.position);
    this.el.object3D.rotation.x = d < 0.3 ? -1.2 : 0;
  }
});
