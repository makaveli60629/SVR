import { AndroidControls } from './androidControls.js';
export const DevHUD = (() => {
  function mount(Diagnostics) {
    AndroidControls.mount(Diagnostics);
  }
  return { mount };
})();
