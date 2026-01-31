// /js/scarlett1/modules/utils.js
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function deadzone(v, dz=0.15) { return Math.abs(v) < dz ? 0 : v; }

export function getRig() { return document.getElementById("rig"); }
export function getCameraEl() { return document.getElementById("camera"); }

export function ensure(el, name, attrs={}) {
  const e = document.createElement(el);
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
  if (name) e.setAttribute("id", name);
  return e;
}
