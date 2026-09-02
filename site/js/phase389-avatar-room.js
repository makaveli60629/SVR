/* PHASE-389-AVATAR-DRESSING-ROOM-VISIBLE-REFRESH-LOCK */
import { account } from './phase345-demo-activity-persistence.js?v=phase389';
import { SVRAvatarViewer } from './phase346-avatar-viewer.js?v=phase389';

export const BUILD = 'PHASE-389-AVATAR-DRESSING-ROOM-VISIBLE-REFRESH-LOCK';
const CATALOG_URL = '/site/data/avatar-catalog.json?v=phase389';
const state = { build: BUILD, ready: false, catalog: null, viewer: null, outfit: null, accountMode: 'loading', saved: false, lastError: null, cameraPreset: 'full' };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function status(message, type = '') {
  const element = $('#avatarStatus');
  if (!element) return;
  element.textContent = message;
  element.className = `phase389-status ${type}`;
}

function normalizeOutfit(input = {}) {
  const defaults = state.catalog?.defaultOutfit || {};
  return {
    schemaVersion: 1,
    modelId: input.modelId || defaults.modelId || 'svr-player',
    palette: input.palette || defaults.palette || 'midnight',
    headwear: input.headwear ?? defaults.headwear ?? 'none',
    eyewear: input.eyewear ?? defaults.eyewear ?? 'none',
    top: input.top ?? defaults.top ?? 'none',
    shoes: input.shoes ?? defaults.shoes ?? 'none',
    accessory: input.accessory ?? defaults.accessory ?? 'none'
  };
}

function selectedModel(outfit = state.outfit) {
  return state.catalog?.avatarModels?.find((entry) => entry.id === outfit?.modelId) || state.catalog?.avatarModels?.[0];
}

async function loadSelectedModel(outfit = state.outfit) {
  const model = selectedModel(outfit);
  if (!model) throw new Error('AVATAR_MODEL_CATALOG_EMPTY');
  const modelUrl = new URL(model.assetUrl, location.origin).href;
  if (!state.viewer.modelLoaded || state.viewer.modelUrl !== modelUrl) {
    await state.viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72));
  }
  state.viewer.setAutoRotate($('#autoRotate')?.checked !== false);
  applyCameraPreset(state.cameraPreset);
  return model;
}

function itemOwned(item, profile) {
  if (item.ownedByDefault || item.bodyTint || item.primary || item.assetUrl) return true;
  const inventory = Array.isArray(profile?.inventory) ? profile.inventory : [];
  return inventory.some((entry) => entry.ItemId === item.id || entry.itemId === item.id);
}

function optionButton(category, item, profile) {
  const selected = category === 'modelId' ? state.outfit?.modelId === item.id : state.outfit?.[category] === item.id;
  const owned = itemOwned(item, profile);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `avatar-option${selected ? ' selected' : ''}${owned ? '' : ' locked'}`;
  button.dataset.category = category;
  button.dataset.itemId = item.id;
  button.disabled = !owned;
  button.innerHTML = `<span class="option-dot"></span><strong>${item.label}</strong><small>${owned ? (selected ? 'Equipped' : 'Available') : 'Locked'}</small>`;
  return button;
}

function categoryItems(category) {
  if (category === 'modelId') return state.catalog.avatarModels || [];
  if (category === 'palette') return state.catalog.palettes || [];
  return state.catalog.categories?.[category] || [];
}

function renderCategory(category) {
  const panel = $(`[data-category-panel="${category}"]`);
  if (!panel) return;
  panel.textContent = '';
  const profile = account.snapshot().profile;
  categoryItems(category).forEach((item) => panel.appendChild(optionButton(category, item, profile)));
}

function renderAll({ preserveSaved = false } = {}) {
  ['modelId', 'palette', 'headwear', 'eyewear', 'top', 'shoes', 'accessory'].forEach(renderCategory);
  const profile = account.snapshot().profile;
  $('#avatarPlayerName').textContent = profile?.displayName || 'SVR Player';
  $('#avatarMode').textContent = state.accountMode === 'api' ? 'DATABASE ACCOUNT' : 'LOCAL DEMO';
  $('#outfitJson').textContent = JSON.stringify(state.outfit, null, 2);
  state.viewer?.applyOutfit(state.outfit);
  if (!preserveSaved) state.saved = false;
  window.SVR_PHASE389_AVATAR_STATE = state;
}

function applyCameraPreset(preset = 'full') {
  if (!state.viewer) return;
  state.cameraPreset = preset;
  const { camera, controls } = state.viewer;
  if (preset === 'face') {
    camera.position.set(0, 1.55, 1.45);
    controls.target.set(0, 1.48, 0);
  } else if (preset === 'upper') {
    camera.position.set(0, 1.28, 2.15);
    controls.target.set(0, 1.15, 0);
  } else {
    state.viewer.resetView();
  }
  controls.update();
  $$('[data-camera-preset]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cameraPreset === preset)));
}

async function select(category, id) {
  state.outfit = normalizeOutfit({ ...state.outfit, [category]: id });
  if (category === 'modelId') await loadSelectedModel(state.outfit);
  renderAll();
  status('Preview updated. Save the outfit to use it on your profile and game identity.', 'info');
}

async function applyPreset(id) {
  const preset = state.catalog.presets?.find((entry) => entry.id === id);
  if (!preset) return;
  state.outfit = normalizeOutfit({ ...state.outfit, ...preset.outfit });
  await loadSelectedModel(state.outfit);
  renderAll();
  status(`${preset.label} preset loaded.`, 'info');
}

async function randomize() {
  const pick = (items) => items[Math.floor(Math.random() * items.length)]?.id;
  state.outfit = normalizeOutfit({
    modelId: pick(state.catalog.avatarModels),
    palette: pick(state.catalog.palettes),
    headwear: pick(state.catalog.categories.headwear),
    eyewear: pick(state.catalog.categories.eyewear),
    top: pick(state.catalog.categories.top),
    shoes: pick(state.catalog.categories.shoes),
    accessory: pick(state.catalog.categories.accessory)
  });
  await loadSelectedModel(state.outfit);
  renderAll();
  status('Random outfit generated.', 'info');
}

async function save() {
  status('Saving outfit…', 'info');
  try {
    const model = selectedModel(state.outfit);
    const modelUrl = new URL(model.assetUrl, location.origin).href;
    const result = await account.updateProfile({ avatarUrl: modelUrl, equippedOutfit: state.outfit });
    state.accountMode = result.mode || account.snapshot().mode;
    state.saved = true;
    renderAll({ preserveSaved: true });
    window.dispatchEvent(new CustomEvent('svr:avatar-saved', { detail: { build: BUILD, outfit: { ...state.outfit } } }));
    status(state.accountMode === 'api' ? 'Outfit saved to your database profile.' : 'Outfit saved to this device in demo mode.', 'ok');
  } catch (error) {
    state.lastError = String(error?.message || error);
    status(state.lastError, 'error');
  }
}

async function reset() {
  state.outfit = normalizeOutfit(state.catalog.defaultOutfit);
  await loadSelectedModel(state.outfit);
  renderAll();
  status('Default outfit restored. Save to keep it.', 'info');
}

function downloadPortrait() {
  try {
    const url = state.viewer.capture('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `svr-avatar-${Date.now()}.png`;
    link.click();
    status('Avatar portrait created.', 'ok');
  } catch (error) {
    status(String(error?.message || error), 'error');
  }
}

function bind() {
  document.addEventListener('click', (event) => {
    const option = event.target.closest('.avatar-option');
    if (option) void select(option.dataset.category, option.dataset.itemId);
    const preset = event.target.closest('[data-preset]');
    if (preset) void applyPreset(preset.dataset.preset);
    const cameraButton = event.target.closest('[data-camera-preset]');
    if (cameraButton) applyCameraPreset(cameraButton.dataset.cameraPreset);
  });
  $('#saveOutfit')?.addEventListener('click', save);
  $('#resetOutfit')?.addEventListener('click', reset);
  $('#randomOutfit')?.addEventListener('click', randomize);
  $('#downloadPortrait')?.addEventListener('click', downloadPortrait);
  $('#resetCamera')?.addEventListener('click', () => applyCameraPreset('full'));
  $('#autoRotate')?.addEventListener('change', (event) => state.viewer.setAutoRotate(event.target.checked));
}

function qa() {
  const viewer = state.viewer?.audit?.() || null;
  const result = {
    build: BUILD,
    ready: state.ready,
    catalogLoaded: Boolean(state.catalog),
    accountMode: account.snapshot().mode,
    profileAvailable: Boolean(account.snapshot().profile),
    modelLoaded: Boolean(viewer?.modelLoaded),
    fallbackUsed: Boolean(viewer?.fallbackUsed),
    categories: Object.fromEntries(['modelId', 'palette', 'headwear', 'eyewear', 'top', 'shoes', 'accessory'].map((key) => [key, $$(`[data-category-panel="${key}"] .avatar-option`).length])),
    cameraPreset: state.cameraPreset,
    viewer,
    lastError: state.lastError,
    checkedAt: new Date().toISOString()
  };
  result.pass = Boolean(result.ready && result.catalogLoaded && result.profileAvailable && result.modelLoaded && Object.values(result.categories).every((count) => count > 0));
  window.SVR_PHASE389_AVATAR_QA_STATE = result;
  return result;
}

async function boot() {
  try {
    await account.bootstrap();
    const accountState = account.snapshot();
    if (!accountState.profile) {
      location.replace(`/site/login.html?next=${encodeURIComponent('/site/avatar.html?v=phase389')}`);
      return;
    }
    state.accountMode = accountState.mode;
    const response = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
    state.catalog = await response.json();
    state.outfit = normalizeOutfit(accountState.profile.equippedOutfit || state.catalog.defaultOutfit);
    state.viewer = new SVRAvatarViewer({ canvas: $('#avatarCanvas'), catalog: state.catalog, autoRotate: true });
    const model = selectedModel(state.outfit);
    await state.viewer.loadModel(accountState.profile.avatarUrl || new URL(model.assetUrl, location.origin).href, Number(model.targetHeightMeters || 1.72));
    bind();
    renderAll();
    const presets = $('#presetButtons');
    state.catalog.presets?.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'phase389-btn gold';
      button.dataset.preset = preset.id;
      button.textContent = preset.label;
      presets.appendChild(button);
    });
    state.ready = true;
    applyCameraPreset('full');
    status(state.viewer.fallbackUsed ? 'Safe mannequin active because the selected model could not load.' : 'Phase 389 avatar loaded. Clothing, camera views, portrait, and save are active.', state.viewer.fallbackUsed ? 'info' : 'ok');
    window.SVR_PHASE389_AVATAR_QA = qa;
    window.SVR_PHASE389_AVATAR_STATE = state;
  } catch (error) {
    state.lastError = String(error?.message || error);
    status(state.lastError, 'error');
    window.SVR_PHASE389_AVATAR_STATE = state;
  }
}

boot();
