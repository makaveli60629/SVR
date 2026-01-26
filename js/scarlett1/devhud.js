/**
 * SCARLETT1 • DEV HUD (PERMANENT)
 * Buttons: Enter VR, Reset Spawn, Hide HUD, Copy Report, Hard Reload, Lights, Music
 */
import { AndroidControls } from './androidControls.js';

export const DevHUD = (() => {
  let hud, minimized = false;
  let lightsOn = true;

  function makeBtn(label, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `
      padding:10px 12px; border-radius:12px;
      border:1px solid rgba(120,160,255,0.35);
      background:rgba(20,25,40,0.9);
      color:#d8e6ff; font:600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      cursor:pointer;
    `;
    b.addEventListener('click', onClick);
    return b;
  }

  function mount(Diagnostics) {
    if (hud) return;

    hud = document.createElement('div');
    hud.id = 'scarlett-devhud';
    hud.style.cssText = `
      position:fixed; right:10px; top:10px; z-index:999999;
      display:flex; flex-direction:column; gap:10px;
      width:min(270px, calc(100vw - 20px));
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      padding:10px; border-radius:16px;
      background:rgba(10,12,18,0.82);
      border:1px solid rgba(120,160,255,0.25);
      box-shadow:0 10px 30px rgba(0,0,0,0.45);
      display:flex; flex-direction:column; gap:10px;
    `;

    const title = document.createElement('div');
    title.textContent = 'Scarlett One • Dev Controls';
    title.style.cssText = `color:#d8e6ff; font:700 14px ui-sans-serif, system-ui; letter-spacing:0.2px;`;

    const row1 = document.createElement('div');
    row1.style.cssText = `display:flex; gap:10px; flex-wrap:wrap;`;

    const enterVR = makeBtn('Enter VR', () => {
      window.dispatchEvent(new CustomEvent('scarlett:enter-vr'));
      Diagnostics?.log?.('[ui] Enter VR requested');
    });

    const reset = makeBtn('Reset Spawn', () => {
      window.dispatchEvent(new CustomEvent('scarlett:reset-spawn'));
      Diagnostics?.log?.('[ui] Reset Spawn requested');
    });

    const hide = makeBtn('Hide HUD', () => {
      minimized = !minimized;
      const diag = document.getElementById('scarlett-diagnostics');
      const sticks = document.getElementById('scarlett-android-sticks');
      if (diag) diag.style.display = minimized ? 'none' : 'block';
      if (sticks) sticks.style.display = minimized ? 'none' : 'block';
      hide.textContent = minimized ? 'Show HUD' : 'Hide HUD';
      Diagnostics?.log?.(`[ui] HUD ${minimized ? 'hidden' : 'shown'}`);
    });

    const copy = makeBtn('Copy Report', async () => {
      await Diagnostics?.copyReport?.();
    });

    const reload = makeBtn('Hard Reload', () => {
      Diagnostics?.log?.('[ui] Hard Reload requested');
      location.reload();
    });

    const lights = makeBtn('Lights: ON', () => {
      lightsOn = !lightsOn;
      lights.textContent = `Lights: ${lightsOn ? 'ON' : 'OFF'}`;
      window.dispatchEvent(new CustomEvent('scarlett:lights', { detail: { on: lightsOn } }));
      Diagnostics?.log?.(`[ui] Lights ${lightsOn ? 'ON' : 'OFF'}`);
    });

    const music = makeBtn('Music: OFF', () => {
      window.dispatchEvent(new CustomEvent('scarlett:music-toggle'));
      Diagnostics?.log?.('[ui] Music toggle requested');
    });

    row1.appendChild(enterVR);
    row1.appendChild(reset);
    row1.appendChild(hide);
    row1.appendChild(copy);
    row1.appendChild(reload);
    row1.appendChild(lights);
    row1.appendChild(music);

    panel.appendChild(title);
    panel.appendChild(row1);

    hud.appendChild(panel);
    document.body.appendChild(hud);

    AndroidControls.mount(Diagnostics);
  }

  return { mount };
})();
