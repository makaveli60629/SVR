// js/scarlett1/modules/diagnostics.js
import { getScene, qs, vecToStr, nowIso, copyToClipboard } from './utils.js';

export function buildReport() {
  const scene = getScene();
  const rig = qs('#rig');
  const cam = qs('#main-cam') || qs('a-camera');
  const ua = navigator.userAgent || 'unknown';
  const href = location.href;

  const secure = (window.isSecureContext === true);
  const pads = (navigator.getGamepads && navigator.getGamepads()) ? Array.from(navigator.getGamepads()).filter(Boolean).length : 0;

  const rigPos = rig ? rig.getAttribute('position') : null;
  const camPos = cam ? cam.getAttribute('position') : null;

  const xr = !!(navigator.xr);
  const vrCapable = !!(scene && scene.enterVR);

  return [
    'SCARLETT REPORT',
    `time=${nowIso()}`,
    `href=${href}`,
    `secureContext=${secure}`,
    `ua=${ua}`,
    `webxr=${xr}`,
    `scene.enterVR=${vrCapable}`,
    `gamepads=${pads}`,
    `rigPos=${vecToStr(rigPos)}`,
    `camPos=${vecToStr(camPos)}`,
  ].join('\n');
}

export async function copyReport() {
  const txt = buildReport();
  const ok = await copyToClipboard(txt);
  console.log(ok ? '[scarlettModule] report copied' : '[scarlettModule] report copy failed');
  return ok;
}
