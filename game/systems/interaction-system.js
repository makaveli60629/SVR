AFRAME.registerComponent('grabbable', {
  init: function () {
    this.grabbed = false;
    this.originalParent = null;
  },

  grab: function (hand) {
    this.grabbed = true;
    this.originalParent = this.el.parentElement;
    hand.object3D.add(this.el.object3D);
    this.el.object3D.position.set(0, 0, -0.1);
  },

  release: function () {
    if (!this.grabbed) return;
    this.grabbed = false;
    this.originalParent.object3D.add(this.el.object3D);
  }
});
