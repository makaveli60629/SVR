(function () {
  AFRAME.registerComponent('floating-logo', {
    tick: function (time) {
      const obj = this.el.object3D;
      obj.position.y = 4.45 + Math.sin(time * 0.0012) * 0.08;
    }
  });
})();
