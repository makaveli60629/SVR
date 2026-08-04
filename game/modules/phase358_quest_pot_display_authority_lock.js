import * as THREE from 'three';

export const BUILD = 'PHASE-358-QUEST-POT-DISPLAY-AUTHORITY-LOCK';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findDisplay() {
  return window.SVR_PHASE358_SAFE_FIND?.(
    window.__SVR_SCENE__,
    'PHASE358_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY'
  ) || null;
}

async function install(timeoutMs = 8000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    window.SVR_PHASE358_BOOT_GOVERN?.();
    const display = findDisplay();
    if (display) {
      let marker = display.children?.find?.((child) => child?.name === 'PHASE333_PHASE358_QUEST_POT_DISPLAY_AUTHORITY');
      if (!marker) {
        marker = new THREE.Object3D();
        marker.name = 'PHASE333_PHASE358_QUEST_POT_DISPLAY_AUTHORITY';
        marker.userData = { phase358PotDisplayAuthority: true };
        display.add(marker);
      }
      display.visible = true;
      window.SVR_PHASE358_POT_DISPLAY = display;
      window.SVR_PHASE358_POT_DISPLAY_STATE = {
        build: BUILD,
        display: display.name,
        marker: marker.name,
        visible: display.visible !== false,
        installedAt: new Date().toISOString(),
        pass: display.visible !== false
      };
      return window.SVR_PHASE358_POT_DISPLAY_STATE;
    }
    await wait(100);
  }
  window.SVR_PHASE358_POT_DISPLAY_STATE = {
    build: BUILD,
    display: null,
    marker: null,
    visible: false,
    installedAt: new Date().toISOString(),
    pass: false
  };
  return window.SVR_PHASE358_POT_DISPLAY_STATE;
}

window.SVR_PHASE358_POT_DISPLAY_QA = () => ({
  ...(window.SVR_PHASE358_POT_DISPLAY_STATE || {}),
  current: findDisplay()?.name || null,
  checkedAt: new Date().toISOString()
});

await install();
