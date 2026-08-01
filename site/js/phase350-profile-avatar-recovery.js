import { account } from './phase345-demo-activity-persistence.js?v=phase350';

const BUILD = 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK';
const canvas = document.getElementById('profileAvatarCanvas');
let viewer = null;
let catalog = null;
let lastSignature = '';
let status = 'initializing';
let lastError = null;
let attempts = 0;
let fallbackFrames = 0;

function timeout(promise, milliseconds, label) {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}
function ensureResizeObserver() {
  if ('ResizeObserver' in window) return;
  window.ResizeObserver = class ResizeObserverFallback {
    constructor(callback) { this.callback = callback; this.handler = () => callback([]); }
    observe() { window.addEventListener('resize', this.handler); setTimeout(this.handler, 0); }
    disconnect() { window.removeEventListener('resize', this.handler); }
    unobserve() {}
  };
}
function host() {
  const parent = canvas?.parentElement;
  if (!parent) return null;
  parent.style.position = 'relative';
  let overlay = document.getElementById('phase350AvatarStatus');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'phase350AvatarStatus';
    overlay.style.cssText = 'position:absolute;left:10px;right:10px;bottom:10px;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border:1px solid rgba(127,252,255,.48);border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font:800 11px/1.2 system-ui;backdrop-filter:blur(8px);pointer-events:none';
    overlay.innerHTML = '<span id="phase350AvatarStatusText">Preparing avatar preview…</span><button id="phase350AvatarRetry" type="button" style="display:none;pointer-events:auto;border:1px solid #ffd98a;border-radius:9px;background:#111827;color:#fff;padding:6px 8px;font-weight:900">Retry</button>';
    parent.appendChild(overlay);
    overlay.querySelector('#phase350AvatarRetry')?.addEventListener('click', () => ensure(true));
  }
  return overlay;
}
function setStatus(next, message, retry = false) {
  status = next;
  const overlay = host();
  const text = overlay?.querySelector('#phase350AvatarStatusText');
  const button = overlay?.querySelector('#phase350AvatarRetry');
  if (text) text.textContent = message;
  if (button) button.style.display = retry ? 'block' : 'none';
  window.SVR_PHASE350_PROFILE_AVATAR_STATE = snapshot();
}
function palette(outfit = {}) {
  const colors = {
    midnight: ['#7ffcff', '#151936'], royal: ['#b68cff', '#26154b'], scarlet: ['#ff7192', '#3a1020'],
    gold: ['#ffd98a', '#392b10'], emerald: ['#75ffbe', '#0c3828']
  };
  return colors[outfit.palette] || colors.midnight;
}
function drawFallback(outfit = {}, label = 'PLAYER') {
  if (!canvas) return;
  const width = Math.max(180, Math.round(canvas.clientWidth || 180));
  const height = Math.max(220, Math.round(canvas.clientHeight || 220));
  canvas.width = Math.round(width * Math.min(devicePixelRatio || 1, 1.5));
  canvas.height = Math.round(height * Math.min(devicePixelRatio || 1, 1.5));
  const context = canvas.getContext('2d');
  if (!context) return;
  const sx = canvas.width / width, sy = canvas.height / height;
  context.setTransform(sx, 0, 0, sy, 0, 0);
  const [accent, dark] = palette(outfit);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#03050d'); gradient.addColorStop(.55, dark); gradient.addColorStop(1, '#02030a');
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  context.strokeStyle = accent; context.globalAlpha = .32; context.lineWidth = 2;
  for (let radius = 38; radius < Math.max(width, height); radius += 34) {
    context.beginPath(); context.arc(width / 2, height * .56, radius, 0, Math.PI * 2); context.stroke();
  }
  context.globalAlpha = 1;
  context.shadowColor = accent; context.shadowBlur = 22;
  context.fillStyle = '#c8b09c'; context.beginPath(); context.arc(width / 2, height * .29, Math.min(width, height) * .10, 0, Math.PI * 2); context.fill();
  context.fillStyle = accent; context.beginPath(); context.roundRect(width * .31, height * .40, width * .38, height * .34, 24); context.fill();
  context.fillStyle = '#111827'; context.beginPath(); context.roundRect(width * .34, height * .44, width * .32, height * .28, 19); context.fill();
  context.strokeStyle = accent; context.lineWidth = 8; context.lineCap = 'round';
  context.beginPath(); context.moveTo(width * .35, height * .48); context.lineTo(width * .22, height * .68); context.moveTo(width * .65, height * .48); context.lineTo(width * .78, height * .68); context.moveTo(width * .43, height * .72); context.lineTo(width * .38, height * .92); context.moveTo(width * .57, height * .72); context.lineTo(width * .62, height * .92); context.stroke();
  context.shadowBlur = 0; context.fillStyle = '#fff'; context.textAlign = 'center'; context.font = '900 13px system-ui'; context.fillText(String(label || 'PLAYER').toUpperCase().slice(0, 22), width / 2, height - 14);
  fallbackFrames += 1;
}
async function loadCatalog() {
  if (catalog) return catalog;
  const response = await timeout(fetch('/site/data/avatar-catalog.json?v=phase350', { cache: 'no-store' }), 7000, 'AVATAR_CATALOG');
  if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
  catalog = await response.json();
  return catalog;
}
async function ensure(force = false) {
  if (!canvas) return null;
  attempts += 1;
  lastError = null;
  ensureResizeObserver();
  const initial = account.snapshot?.().profile || {};
  drawFallback(initial.equippedOutfit || {}, initial.displayName || 'PLAYER');
  setStatus('fallback-ready', 'Fallback avatar ready • loading 3D preview…');
  try {
    await timeout(account.bootstrap(), 7000, 'ACCOUNT');
    const profile = account.snapshot().profile || {};
    const sourceCatalog = await loadCatalog();
    const outfit = profile.equippedOutfit && Object.keys(profile.equippedOutfit).length ? profile.equippedOutfit : sourceCatalog.defaultOutfit;
    drawFallback(outfit, profile.displayName || 'PLAYER');
    const model = sourceCatalog.avatarModels.find((entry) => entry.id === outfit.modelId) || sourceCatalog.avatarModels[0];
    const modelUrl = profile.avatarUrl || new URL(model.assetUrl, location.origin).href;
    const signature = JSON.stringify({ modelUrl, outfit });
    if (!force && viewer && signature === lastSignature) return viewer;
    setStatus('loading-3d', 'Loading 3D avatar…');
    const module = await timeout(import('./phase346-avatar-viewer.js?v=phase350'), 9000, 'AVATAR_VIEWER_MODULE');
    if (!viewer) {
      viewer = new module.SVRAvatarViewer({ canvas, catalog: sourceCatalog, autoRotate: true, compact: true });
      viewer.createFallbackAvatar?.();
      viewer.applyOutfit?.(outfit);
    }
    lastSignature = signature;
    const modelPromise = viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72));
    await timeout(modelPromise, 15000, 'AVATAR_MODEL').catch((error) => {
      lastError = String(error?.message || error);
      viewer.applyOutfit?.(outfit);
    });
    viewer.applyOutfit?.(outfit);
    const audit = viewer.audit?.() || {};
    if (audit.modelLoaded) setStatus(audit.fallbackUsed ? '3d-fallback-ready' : '3d-ready', audit.fallbackUsed ? '3D fallback ready' : '3D avatar ready');
    else setStatus('fallback-ready', 'Fallback avatar ready', true);
    return viewer;
  } catch (error) {
    lastError = String(error?.message || error);
    const profile = account.snapshot?.().profile || {};
    drawFallback(profile.equippedOutfit || {}, profile.displayName || 'PLAYER');
    setStatus('fallback-ready', 'Avatar fallback ready • 3D preview unavailable', true);
    return null;
  }
}
function snapshot() {
  const audit = viewer?.audit?.() || null;
  return {
    build: BUILD,
    active: Boolean(canvas),
    status,
    attempts,
    fallbackFrames,
    viewerCreated: Boolean(viewer),
    modelLoaded: Boolean(audit?.modelLoaded),
    fallbackUsed: Boolean(audit?.fallbackUsed || !viewer),
    lastError,
    checkedAt: new Date().toISOString()
  };
}
function qa() {
  const result = snapshot();
  result.pass = result.active && ['fallback-ready', '3d-fallback-ready', '3d-ready'].includes(result.status) && result.fallbackFrames > 0;
  window.SVR_PHASE350_PROFILE_AVATAR_QA_STATE = result;
  return result;
}

host();
ensure();
window.addEventListener('svr:account-change', () => ensure());
window.addEventListener('svr:avatar-outfit-preview', () => ensure(true));
window.addEventListener('resize', () => { if (!viewer) ensure(); });
window.SVR_PHASE350_PROFILE_AVATAR_RETRY = () => ensure(true);
window.SVR_PHASE350_PROFILE_AVATAR_RESET = () => viewer?.resetView?.();
window.SVR_PHASE350_PROFILE_AVATAR_QA = qa;
