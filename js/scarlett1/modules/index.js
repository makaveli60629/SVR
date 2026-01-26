// js/scarlett1/modules/index.js
import { qs, getScene, isVRCapable } from './utils.js';
import { poker } from './poker.js';
import { store } from './store.js';
import { radio } from './radio.js';
import { watch } from './watch.js';
import { pads } from './pads.js';
import { jumbotron } from './jumbotron.js';
import { spawnDefault as spawnGuards } from './guards.js';
import { ensureLighting, setBright } from './lights.js';
import { enablePulse } from './neon.js';
import { copyReport } from './diagnostics.js';

export function createScarlettModule() {
  let _inited = false;

  function init() {
    if (_inited) return true;
    const scene = getScene();
    if (!scene) {
      // retry once scene exists
      setTimeout(init, 250);
      return false;
    }
    ensureLighting();
    // Spawn default modules that are safe anywhere
    try { pads.spawn(); } catch {}
    try { jumbotron.spawn(); } catch {}
    try { spawnGuards(); } catch {}
    try { poker.ensure(); } catch {}
    try { enablePulse(); } catch {}

    _inited = true;
    console.log('[scarlettModule] init ok');
    return true;
  }

  function enterVR() {
    const scene = getScene();
    if (!scene || !scene.enterVR) return false;
    try { scene.enterVR(); return true; } catch { return false; }
  }

  function resetSpawn() {
    const rig = qs('#rig');
    if (!rig) return false;
    rig.setAttribute('position','0 0 0');
    rig.setAttribute('rotation','0 0 0');
    return true;
  }

  function hideHud() {
    const hud = document.getElementById('dev-hud');
    if (!hud) return false;
    const isHidden = hud.style.display === 'none';
    hud.style.display = isHidden ? '' : 'none';
    return !isHidden;
  }

  return {
    // top-level system
    init,
    enterVR,
    resetSpawn,
    hideHud,
    copyReport,

    // convenience groups
    poker,
    store,
    radio,
    watch,
    pads,
    jumbotron,
    guards: { spawnDefault: spawnGuards },
    neon: { enablePulse },
    lights: { setBright }
  };
}
