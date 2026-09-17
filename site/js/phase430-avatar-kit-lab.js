import {
  AVATAR_BUILD,
  buildStoreRows,
  createDefaultAvatar,
  equipItem,
  normalizeAvatar,
  setAppearance,
  setMorph,
  switchBaseBody,
  validateAvatar
} from '../../packages/svr-avatar-kit/avatar-kit-core.js';

const CATALOG_URL = '/packages/svr-avatar-kit/avatar-kit.catalog.json?v=phase430';
const STORAGE_KEY = 'svr.avatarKit.v2.lab';
const $ = (selector) => document.querySelector(selector);

const state = {
  build: 'SVR-AVATAR-KIT-LAB-V1',
  catalog: null,
  avatar: null,
  ready: false,
  lastError: null
};

function optionMarkup(items, selected, valueKey = 'id') {
  return items.map((item) => {
    const value = item[valueKey];
    return `<option value="${value}"${value === selected ? ' selected' : ''}>${item.label || value}</option>`;
  }).join('');
}

function fieldSelect(label, id, items, selected, valueKey = 'id') {
  return `<div class="field"><label for="${id}">${label}</label><select id="${id}">${optionMarkup(items, selected, valueKey)}</select></div>`;
}

function bindSelect(id, handler) {
  $(`#${id}`)?.addEventListener('change', (event) => {
    handler(event.target.value);
    render();
  });
}

function renderAppearanceControls() {
  const c = state.catalog;
  const a = state.avatar;
  $('#appearanceFields').innerHTML = [
    fieldSelect('Base Body', 'baseBodyId', c.bodyFamilies, a.baseBodyId),
    fieldSelect('Skin Tone', 'skinToneId', c.appearance.skinTones, a.appearance.skinToneId),
    fieldSelect('Eye Color', 'eyeColorId', c.appearance.eyeColors, a.appearance.eyeColorId),
    fieldSelect('Hair Style', 'hairStyleId', c.appearance.hairStyles, a.appearance.hairStyleId),
    fieldSelect('Hair Color', 'hairColorId', c.appearance.hairColors, a.appearance.hairColorId),
    fieldSelect('Nail Style', 'nailStyleId', c.appearance.nailStyles, a.appearance.nailStyleId),
    fieldSelect('Nail Color', 'nailColorId', c.appearance.nailColors, a.appearance.nailColorId)
  ].join('');

  bindSelect('baseBodyId', (value) => { state.avatar = switchBaseBody(state.avatar, value, c); });
  for (const key of ['skinToneId', 'eyeColorId', 'hairStyleId', 'hairColorId', 'nailStyleId', 'nailColorId']) {
    bindSelect(key, (value) => { state.avatar = setAppearance(state.avatar, { [key]: value }, c); });
  }
}

function renderMorphControls() {
  const labels = {
    height: 'Height',
    bodyMass: 'Body Size',
    shoulderWidth: 'Shoulder Width',
    torsoLength: 'Torso Length',
    armLength: 'Arm Length',
    legLength: 'Leg Length',
    handScale: 'Hand Size',
    footScale: 'Foot Size'
  };
  $('#morphFields').innerHTML = Object.keys(state.catalog.morphs).map((key) => {
    const value = Number(state.avatar.morphs[key] ?? 0.5);
    return `<div class="field"><label for="morph-${key}">${labels[key] || key}</label><div class="range-row"><input id="morph-${key}" type="range" min="0" max="1" step="0.01" value="${value}"><output id="morph-${key}-value">${Math.round(value * 100)}%</output></div></div>`;
  }).join('');

  for (const key of Object.keys(state.catalog.morphs)) {
    $(`#morph-${key}`)?.addEventListener('input', (event) => {
      state.avatar = setMorph(state.avatar, key, Number(event.target.value), state.catalog);
      $(`#morph-${key}-value`).textContent = `${Math.round(Number(event.target.value) * 100)}%`;
      renderPreview();
      renderJson();
    });
  }
}

function renderStore() {
  const rows = buildStoreRows(state.catalog);
  $('#storeItems').innerHTML = rows.map((item) => {
    const equipped = state.avatar.equipment[item.equipSlot] === item.itemId;
    const status = item.productionReady ? '3D ready' : 'Fitted mesh needed';
    return `<article class="item"><strong>${item.label}</strong><small>${item.categoryLabel} · ${item.equipSlot}<br>${status}</small><button data-equip="${item.itemId}"${equipped ? ' disabled' : ''}>${equipped ? 'Equipped' : 'Equip'}</button></article>`;
  }).join('');
  document.querySelectorAll('[data-equip]').forEach((button) => button.addEventListener('click', () => {
    state.avatar = equipItem(state.avatar, button.dataset.equip, state.catalog);
    render();
  }));
}

function renderPreview() {
  const c = state.catalog;
  const a = state.avatar;
  const skin = c.appearance.skinTones.find((item) => item.id === a.appearance.skinToneId)?.color || '#A96F4E';
  const eye = c.appearance.eyeColors.find((item) => item.id === a.appearance.eyeColorId)?.color || '#5A3825';
  const hair = c.appearance.hairColors.find((item) => item.id === a.appearance.hairColorId)?.color || '#151312';
  const nails = c.appearance.nailColors.find((item) => item.id === a.appearance.nailColorId)?.color || '#E9C5B8';
  const figure = $('#figure');
  figure.style.setProperty('--skin', skin);
  figure.style.setProperty('--eye', eye);
  figure.style.setProperty('--hair', hair);
  figure.style.setProperty('--nails', nails);
  figure.style.setProperty('--bodyScale', String(0.92 + a.morphs.height * 0.16));
  figure.style.setProperty('--shoulders', String(0.82 + a.morphs.shoulderWidth * 0.36));
  const body = c.bodyFamilies.find((item) => item.id === a.baseBodyId);
  const check = validateAvatar(a, c);
  $('#bodyMeta').textContent = `${body?.label || a.baseBodyId} · ${Math.round(a.morphs.height * 100)}% height`;
  $('#storeMeta').textContent = `${Object.values(a.equipment).filter((value) => value && value !== 'none').length} equipped · ${c.equipmentSlots.length} slots`;
  $('#qaMeta').textContent = check.pass ? 'Schema QA: PASS' : `Schema QA: ${check.errors.length} issues`;
  $('#labStatus').textContent = check.pass ? 'Avatar record valid' : 'Avatar record needs review';
}

function renderJson() {
  $('#avatarJson').textContent = JSON.stringify(state.avatar, null, 2);
}

function render() {
  renderAppearanceControls();
  renderMorphControls();
  renderStore();
  renderPreview();
  renderJson();
  window.SVR_AVATAR_KIT_LAB_STATE = state;
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.avatar));
  $('#labStatus').textContent = 'Saved to this device';
}

function reset() {
  state.avatar = createDefaultAvatar(state.catalog);
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function download() {
  const blob = new Blob([JSON.stringify(state.avatar, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'svr-avatar-v2.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function boot() {
  try {
    const response = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`SVR_AVATAR_CATALOG_${response.status}`);
    state.catalog = await response.json();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    state.avatar = normalizeAvatar(saved || state.catalog.defaultAvatar, state.catalog);
    state.ready = true;
    render();
    $('#saveAvatar').addEventListener('click', saveLocal);
    $('#resetAvatar').addEventListener('click', reset);
    $('#downloadAvatar').addEventListener('click', download);
    window.SVR_AVATAR_KIT_QA = () => ({
      build: AVATAR_BUILD,
      labBuild: state.build,
      ready: state.ready,
      validation: validateAvatar(state.avatar, state.catalog),
      bodyCount: state.catalog.bodyFamilies.length,
      storeItemCount: state.catalog.starterItems.length,
      slotCount: state.catalog.equipmentSlots.length,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    state.lastError = String(error?.message || error);
    $('#labStatus').textContent = state.lastError;
    window.SVR_AVATAR_KIT_LAB_STATE = state;
  }
}

boot();
