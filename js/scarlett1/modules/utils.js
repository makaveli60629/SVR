// js/scarlett1/modules/utils.js
export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

export function getScene() {
  return document.querySelector('a-scene');
}

export function ensureEntity(id, tag='a-entity', parent=null) {
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement(tag);
  el.setAttribute('id', id);
  (parent || getScene() || document.body).appendChild(el);
  return el;
}

export function isVRCapable() {
  const scene = getScene();
  return !!(scene && scene.enterVR);
}

export function safeNumber(n, fallback=0) {
  return (typeof n === 'number' && Number.isFinite(n)) ? n : fallback;
}

export function vecToStr(v) {
  if (!v) return '0 0 0';
  return `${safeNumber(v.x).toFixed(2)} ${safeNumber(v.y).toFixed(2)} ${safeNumber(v.z).toFixed(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export function setVisible(el, visible) {
  if (!el) return;
  el.object3D.visible = !!visible;
}

export function addClickTarget(el) {
  if (!el) return;
  el.classList.add('clickable');
  // If the Spine doesn't configure raycasters, A-Frame cursor click still works.
}
