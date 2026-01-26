export const AndroidControls = (() => {
  window.__scarlettInput = { moveX:0, moveZ:0, yaw:0 };
  function mount(Diagnostics) {
    Diagnostics.log('Android controls armed');
  }
  return { mount };
})();
