export const AndroidControls = (() => {
  window.__scarlettInput = { moveX: 0, moveZ: 0 };

  function mount(Diagnostics) {
    const stick = document.createElement('div');
    stick.style.cssText = `
      position:fixed;
      left:20px;
      bottom:20px;
      width:120px;
      height:120px;
      border-radius:50%;
      background:rgba(80,120,255,0.25);
      border:2px solid rgba(120,160,255,0.6);
      z-index:999999;
      touch-action:none;
    `;

    stick.addEventListener('touchmove', e => {
      const t = e.touches[0];
      const r = stick.getBoundingClientRect();
      window.__scarlettInput.moveX = ((t.clientX - (r.left + r.width/2)) / r.width) * 2;
      window.__scarlettInput.moveZ = -((t.clientY - (r.top + r.height/2)) / r.height) * 2;
    });

    stick.addEventListener('touchend', () => {
      window.__scarlettInput.moveX = 0;
      window.__scarlettInput.moveZ = 0;
    });

    document.body.appendChild(stick);
    Diagnostics.log('Android joystick visible');
  }

  return { mount };
})();
