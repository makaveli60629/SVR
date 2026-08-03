import * as THREE from 'three';

export const BUILD = 'PHASE-365-ANDROID-CARD-BRAND-REFRESH-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  brandedCards: 0,
  brandId: null,
  refreshes: 0,
  installedAt: null,
  checkedAt: null
};

let texture = null;
let textureSignature = '';
let logoImage = null;
let baseQa = null;
let interval = 0;

function brandConfig() {
  return {
    id: window.SVR_ANDROID_BRAND_SLOT?.id || 'svr',
    name: window.SVR_ANDROID_BRAND_SLOT?.name || 'SVR POKER',
    logoUrl: window.SVR_ANDROID_BRAND_SLOT?.logoUrl || 'assets/ui/logo.png',
    fallbackLogoUrl: window.SVR_ANDROID_BRAND_SLOT?.fallbackLogoUrl || 'logo.png'
  };
}

function signature(config) {
  return `${config.id}|${config.name}|${config.logoUrl}|${config.fallbackLogoUrl}`;
}

function drawTexture(config) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  const paint = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#29135b');
    gradient.addColorStop(1, '#040b18');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#7ffcff';
    context.lineWidth = 18;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.strokeStyle = '#d9b45c';
    context.lineWidth = 5;
    context.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);
    if (logoImage?.complete && logoImage.naturalWidth) {
      const ratio = Math.min(292 / logoImage.naturalWidth, 252 / logoImage.naturalHeight);
      const width = logoImage.naturalWidth * ratio;
      const height = logoImage.naturalHeight * ratio;
      context.drawImage(logoImage, (canvas.width - width) / 2, 155, width, height);
    } else {
      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.font = '1000 112px system-ui';
      context.fillText('SVR', canvas.width / 2, 350);
    }
    context.textAlign = 'center';
    context.fillStyle = '#fff';
    context.font = '1000 55px system-ui';
    context.fillText(config.name, canvas.width / 2, 500);
    context.fillStyle = '#d9b45c';
    context.font = '900 27px system-ui';
    context.fillText('TOURNAMENT TABLE', canvas.width / 2, 553);
  };

  logoImage = new Image();
  logoImage.crossOrigin = 'anonymous';
  logoImage.onload = () => {
    paint();
    if (texture) texture.needsUpdate = true;
  };
  logoImage.onerror = () => {
    const fallback = new URL(config.fallbackLogoUrl, document.baseURI).href;
    if (logoImage.src !== fallback) logoImage.src = fallback;
  };
  logoImage.src = new URL(config.logoUrl, document.baseURI).href;
  paint();
  const next = new THREE.CanvasTexture(canvas);
  next.colorSpace = THREE.SRGBColorSpace;
  next.name = 'PHASE365_ANDROID_REFRESHED_BRAND_CARD_BACK';
  return next;
}

function ensureTexture() {
  const config = brandConfig();
  const nextSignature = signature(config);
  if (!texture || nextSignature !== textureSignature) {
    texture?.dispose?.();
    texture = drawTexture(config);
    textureSignature = nextSignature;
    state.brandId = config.id;
  }
  return texture;
}

function pokerPhase() {
  return String(
    window.SVR_PHASE336_POKER_STATE?.phase
    || window.SVR_PHASE85_POKER_STATE?.phase
    || window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.phase
    || 'idle'
  ).toLowerCase();
}

function cardObjects() {
  const scene = window.__SVR_SCENE__;
  if (!scene) return [];
  const cards = [];
  const phase = pokerPhase();
  if (phase !== 'showdown') {
    for (let seat = 1; seat <= 5; seat += 1) {
      for (let card = 0; card < 2; card += 1) {
        const object = scene.getObjectByName?.(`PHASE341_HOLE_${seat}_${card}`);
        if (object?.isMesh) cards.push(object);
      }
    }
  }
  for (let index = 0; index < 3; index += 1) {
    const object = scene.getObjectByName?.(`PHASE341_BURN_${index}`);
    if (object?.isMesh) cards.push(object);
  }
  return cards;
}

function apply() {
  if (!ACTIVE) return 0;
  const map = ensureTexture();
  const cards = cardObjects();
  for (const card of cards) {
    const materials = Array.isArray(card.material) ? card.material : [card.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      if (material.map !== map) {
        material.map = map;
        material.transparent = true;
        material.depthWrite = false;
        material.needsUpdate = true;
      }
    }
    card.userData.phase365BrandedCardBack = true;
    card.userData.phase365BrandId = state.brandId;
  }
  state.brandedCards = cards.length;
  state.refreshes += 1;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE365_CARD_BRAND_STATE = { ...state };
  if (window.SVR_PHASE365_STATE) window.SVR_PHASE365_STATE.cardBacksBranded = cards.length;
  return cards.length;
}

function wrapQa() {
  if (baseQa || typeof window.SVR_PHASE365_QA !== 'function') return false;
  baseQa = window.SVR_PHASE365_QA;
  window.SVR_PHASE365_QA = () => {
    const brandedCards = apply();
    const base = baseQa();
    const seated = Boolean(base.seated);
    const pass = Boolean(
      base.active
      && base.tableAligned
      && base.controllerBound
      && base.sticks?.move === 1
      && base.sticks?.look === 1
      && base.potDisplayClean
      && brandedCards >= 3
      && base.hudBrandReady
      && base.avatarsAligned === 5
      && base.nameTagsReady === 5
      && (!seated || (base.sticks?.hiddenWhileSeated && base.navigationVisibleWhileSeated === 0))
    );
    return {
      ...base,
      cardBacksBranded: brandedCards,
      cardBrandRefreshBuild: BUILD,
      pass
    };
  };
  return true;
}

function scheduleApply() {
  [0, 40, 120, 260, 520].forEach((delay) => setTimeout(apply, delay));
}

function install() {
  if (!ACTIVE || window.__SVR_PHASE365_CARD_BRAND_INSTALLED__) return;
  window.__SVR_PHASE365_CARD_BRAND_INSTALLED__ = true;
  state.installedAt = new Date().toISOString();
  window.addEventListener('svr:poker-state', scheduleApply);
  window.addEventListener('svr:phase365-state', () => {
    wrapQa();
    scheduleApply();
  });
  window.addEventListener('svr:platform-ready', scheduleApply);
  interval = window.setInterval(() => {
    wrapQa();
    apply();
  }, 420);
  window.SVR_PHASE365_REFRESH_CARD_BRAND = apply;
  window.SVR_PHASE365_CARD_BRAND_QA = () => {
    const brandedCards = apply();
    return {
      ...state,
      brandedCards,
      pass: ACTIVE && brandedCards >= 3,
      checkedAt: new Date().toISOString()
    };
  };
  wrapQa();
  scheduleApply();
}

install();
