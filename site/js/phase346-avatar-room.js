import { account } from './phase345-demo-activity-persistence.js?v=phase346';
import { SVRAvatarViewer, BUILD } from './phase346-avatar-viewer.js?v=phase346';

const CATALOG_URL = '/site/data/avatar-catalog.json?v=phase346';
const state = { build: BUILD, ready: false, catalog: null, viewer: null, outfit: null, accountMode: 'loading', saved: false, lastError: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function status(message, type = '') { const element = $('#avatarStatus'); if (!element) return; element.textContent = message; element.className = `avatar-status ${type}`; }
function normalizeOutfit(input = {}) {
  const defaults = state.catalog?.defaultOutfit || {};
  return { schemaVersion: 1, modelId: input.modelId || defaults.modelId || 'eric', palette: input.palette || defaults.palette || 'midnight', headwear: input.headwear ?? defaults.headwear ?? 'none', eyewear: input.eyewear ?? defaults.eyewear ?? 'none', top: input.top ?? defaults.top ?? 'none', shoes: input.shoes ?? defaults.shoes ?? 'none', accessory: input.accessory ?? defaults.accessory ?? 'none' };
}
function selectedModel(outfit = state.outfit) { return state.catalog.avatarModels.find((entry) => entry.id === outfit?.modelId) || state.catalog.avatarModels[0]; }
async function loadSelectedModel(outfit = state.outfit) {
  const model = selectedModel(outfit), modelUrl = new URL(model.assetUrl, location.origin).href;
  if (!state.viewer.modelLoaded || state.viewer.modelUrl !== modelUrl) await state.viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72));
  return model;
}
function itemOwned(item, profile) {
  if (item.ownedByDefault || item.bodyTint || item.primary || item.assetUrl) return true;
  const inventory = Array.isArray(profile?.inventory) ? profile.inventory : [];
  return inventory.some((entry) => entry.ItemId === item.id || entry.itemId === item.id);
}
function optionButton(category, item, profile) {
  const selected = category === 'modelId' ? state.outfit?.modelId === item.id : state.outfit?.[category] === item.id, owned = itemOwned(item, profile), button = document.createElement('button');
  button.type = 'button'; button.className = `avatar-option${selected ? ' selected' : ''}${owned ? '' : ' locked'}`; button.dataset.category = category; button.dataset.itemId = item.id; button.disabled = !owned; button.innerHTML = `<span class="option-dot"></span><strong>${item.label}</strong><small>${owned ? (selected ? 'Equipped' : 'Available') : 'Locked'}</small>`; return button;
}
function renderCategory(category) {
  const panel = $(`[data-category-panel="${category}"]`); if (!panel) return; panel.textContent = '';
  const profile = account.snapshot().profile, items = category === 'modelId' ? state.catalog.avatarModels : category === 'palette' ? state.catalog.palettes : state.catalog.categories[category];
  items.forEach((item) => panel.appendChild(optionButton(category, item, profile)));
}
function renderAll({ preserveSaved = false } = {}) {
  ['modelId', 'palette', 'headwear', 'eyewear', 'top', 'shoes', 'accessory'].forEach(renderCategory);
  const profile = account.snapshot().profile; $('#avatarPlayerName').textContent = profile?.displayName || 'SVR Player'; $('#avatarMode').textContent = state.accountMode === 'api' ? 'DATABASE ACCOUNT' : 'LOCAL DEMO'; $('#avatarMode').classList.toggle('demo', state.accountMode !== 'api'); $('#outfitJson').textContent = JSON.stringify(state.outfit, null, 2); state.viewer?.applyOutfit(state.outfit); if (!preserveSaved) state.saved = false;
}
async function select(category, id) { state.outfit = normalizeOutfit({ ...state.outfit, [category]: id }); if (category === 'modelId') await loadSelectedModel(state.outfit); renderAll(); status('Preview updated. Save the outfit to use it on your profile.', 'info'); }
async function applyPreset(id) { const preset = state.catalog.presets.find((entry) => entry.id === id); if (!preset) return; state.outfit = normalizeOutfit({ ...state.outfit, ...preset.outfit }); await loadSelectedModel(state.outfit); renderAll(); status(`${preset.label} preset loaded.`, 'info'); }
async function randomize() {
  const pick = (items) => items[Math.floor(Math.random() * items.length)]?.id;
  state.outfit = normalizeOutfit({ modelId: pick(state.catalog.avatarModels), palette: pick(state.catalog.palettes), headwear: pick(state.catalog.categories.headwear), eyewear: pick(state.catalog.categories.eyewear), top: pick(state.catalog.categories.top), shoes: pick(state.catalog.categories.shoes), accessory: pick(state.catalog.categories.accessory) });
  await loadSelectedModel(state.outfit); renderAll(); status('Random outfit generated.', 'info');
}
async function save() {
  status('Saving outfit…', 'info');
  try { const model = selectedModel(state.outfit), modelUrl = new URL(model.assetUrl, location.origin).href, result = await account.updateProfile({ avatarUrl: modelUrl, equippedOutfit: state.outfit }); state.accountMode = result.mode || account.snapshot().mode; renderAll({ preserveSaved: true }); state.saved = true; status(state.accountMode === 'api' ? 'Outfit saved to your database profile.' : 'Outfit saved to this device in demo mode.', 'ok'); }
  catch (error) { state.lastError = String(error?.message || error); status(state.lastError, 'error'); }
}
async function reset() { state.outfit = normalizeOutfit(state.catalog.defaultOutfit); await loadSelectedModel(state.outfit); renderAll(); status('Default outfit restored. Save to keep it.', 'info'); }
function downloadPortrait() { try { const url = state.viewer.capture('image/png'), link = document.createElement('a'); link.href = url; link.download = `svr-avatar-${Date.now()}.png`; link.click(); status('Avatar portrait created.', 'ok'); } catch (error) { status(String(error?.message || error), 'error'); } }
function bind() {
  document.addEventListener('click', (event) => { const option = event.target.closest('.avatar-option'); if (option) select(option.dataset.category, option.dataset.itemId); const preset = event.target.closest('[data-preset]'); if (preset) applyPreset(preset.dataset.preset); });
  $('#saveOutfit').addEventListener('click', save); $('#resetOutfit').addEventListener('click', reset); $('#randomOutfit').addEventListener('click', randomize); $('#downloadPortrait').addEventListener('click', downloadPortrait); $('#resetCamera').addEventListener('click', () => state.viewer.resetView()); $('#autoRotate').addEventListener('change', (event) => state.viewer.setAutoRotate(event.target.checked));
}
function qa() {
  const accountState = account.snapshot(), viewer = state.viewer?.audit?.() || null;
  const result = { build: BUILD, ready: state.ready, catalogLoaded: Boolean(state.catalog), accountMode: accountState.mode, profileAvailable: Boolean(accountState.profile), outfitSchema: state.outfit?.schemaVersion || null, categories: Object.fromEntries(['modelId', 'palette', 'headwear', 'eyewear', 'top', 'shoes', 'accessory'].map((key) => [key, $$(`[data-category-panel="${key}"] .avatar-option`).length])), viewer, saved: state.saved, lastError: state.lastError, checkedAt: new Date().toISOString() };
  result.pass = result.ready && result.catalogLoaded && result.profileAvailable && viewer?.modelLoaded && Object.values(result.categories).every((count) => count > 0); window.SVR_PHASE346_QA_STATE = result; return result;
}
async function boot() {
  try {
    await account.bootstrap(); const accountState = account.snapshot(); if (!accountState.profile) { location.replace(`/site/login.html?next=${encodeURIComponent(location.pathname)}`); return; }
    state.accountMode = accountState.mode; const response = await fetch(CATALOG_URL, { cache: 'no-store' }); if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`); state.catalog = await response.json(); state.outfit = normalizeOutfit(accountState.profile.equippedOutfit || state.catalog.defaultOutfit); state.viewer = new SVRAvatarViewer({ canvas: $('#avatarCanvas'), catalog: state.catalog, autoRotate: true });
    const model = selectedModel(state.outfit); await state.viewer.loadModel(accountState.profile.avatarUrl || new URL(model.assetUrl, location.origin).href, Number(model.targetHeightMeters || 1.72)); bind(); renderAll();
    const presets = $('#presetButtons'); state.catalog.presets.forEach((preset) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'preset-button'; button.dataset.preset = preset.id; button.textContent = preset.label; presets.appendChild(button); });
    state.ready = true; status(state.viewer.fallbackUsed ? 'The selected avatar model could not load, so the safe mannequin is active.' : 'Avatar loaded. Select equipment and save your outfit.', state.viewer.fallbackUsed ? 'info' : 'ok'); window.SVR_PHASE346_AVATAR_QA = qa; window.SVR_PHASE346_APPLY_PRESET = applyPreset; window.SVR_PHASE346_SAVE_OUTFIT = save; window.SVR_PHASE346_AVATAR_STATE = state;
  } catch (error) { state.lastError = String(error?.message || error); status(state.lastError, 'error'); window.SVR_PHASE346_AVATAR_STATE = state; }
}
boot();
