AFRAME.registerComponent('grabbable', {
  init() {
    this.grabbed = false;
    this.parent = null;
  },

  grab(hand) {
    this.grabbed = true;
    this.parent = this.el.parentElement;
    hand.object3D.add(this.el.object3D);
    this.el.object3D.position.set(0,0,-0.12);
  },

  release() {
    if (!this.grabbed) return;
    this.parent.object3D.add(this.el.object3D);
    this.grabbed = false;
  }
});
