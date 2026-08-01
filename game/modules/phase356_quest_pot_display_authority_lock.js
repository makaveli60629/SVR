export const BUILD = 'PHASE-356-QUEST-POT-DISPLAY-AUTHORITY-LOCK';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findDisplay() {
  return window.SVR_PHASE356_SAFE_FIND?.(
    window.__SVR_SCENE__,
    'PHASE356_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY'
  ) || null;
}

async function install(timeoutMs = 8000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    window.SVR_PHASE356_BOOT_GOVERN?.();
    const display = findDisplay();
    if (display) {
      let marker = display.children?.find?.((child) => child?.name === 'PHASE333_PHASE356_QUEST_POT_DISPLAY_AUTHORITY');
      if (!marker) {
        const Object3D = display.constructor?.prototype?.isSprite
          ? display.constructor.prototype.constructor
          : null;
        marker = Object3D ? new Object3D() : null;
        if (!marker || marker.isSprite) {
          marker = document.createElement ? null : marker;
        }
        if (!marker) {
          const THREE = await import('three');
          marker = new THREE.Object3D();
        }
        marker.name = 'PHASE333_PHASE356_QUEST_POT_DISPLAY_AUTHORITY';
        marker.userData = { phase356PotDisplayAuthority: true };
        display.add(marker);
      }
      window.SVR_PHASE356_POT_DISPLAY = display;
      window.SVR_PHASE356_POT_DISPLAY_STATE = {
        build: BUILD,
        display: display.name,
        marker: marker.name,
        visible: display.visible !== false,
        installedAt: new Date().toISOString(),
        pass: display.visible !== false
      };
      return window.SVR_PHASE356_POT_DISPLAY_STATE;
    }
    await wait(100);
  }
  window.SVR_PHASE356_POT_DISPLAY_STATE = {
    build: BUILD,
    display: null,
    marker: null,
    visible: false,
    installedAt: new Date().toISOString(),
    pass: false
  };
  return window.SVR_PHASE356_POT_DISPLAY_STATE;
}

window.SVR_PHASE356_POT_DISPLAY_QA = () => ({
  ...(window.SVR_PHASE356_POT_DISPLAY_STATE || {}),
  current: findDisplay()?.name || null,
  checkedAt: new Date().toISOString()
});

await install();
