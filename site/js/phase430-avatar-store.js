import {
  buildStoreRows,
  createDefaultAvatar,
  equipItem,
  normalizeAvatar
} from '../../packages/svr-avatar-kit/avatar-kit-core.js';

const CATALOG_URL = '/packages/svr-avatar-kit/avatar-kit.catalog.json?v=phase430';
const STORAGE_KEY = 'svr.avatarKit.v2.lab';
const $ = (selector) => document.querySelector(selector);

const state = {
  build: 'SVR-AVATAR-STORE-V1',
  catalog: null,
  avatar: null,
  ready: false,
  lastError: null
};

function showStatus(message) {
  const el = $('#storeStatus');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

function slug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function renderNav(categories) {
  $('#categoryNav').innerHTML = categories.map((category) => `<button type="button" data-jump="${slug(category.id)}">${category.label}</button>`).join('');
  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function card(item) {
  const equipped = state.avatar.equipment[item.equipSlot] === item.itemId;
  return `<article class="card"><span class="slot">${item.equipSlot.toUpperCase()}</span><h3>${item.label}</h3><p>${item.categoryLabel}</p><span class="needs">${item.productionReady ? '3D asset ready' : 'Fitted 3D mesh still required'}</span><button type="button" data-equip="${item.itemId}"${equipped ? ' disabled' : ''}>${equipped ? 'Equipped' : 'Preview Equip'}</button></article>`;
}

function render() {
  const categories = state.catalog.storeCategories || [];
  const rows = buildStoreRows(state.catalog);
  renderNav(categories);
  $('#storeLanes').innerHTML = categories.map((category) => {
    const items = rows.filter((item) => item.storeCategory === category.id);
    const content = items.length ? `<div class="grid">${items.map(card).join('')}</div>` : `<div class="empty">This category is reserved in the Avatar Kit catalog and ready for future SKUs.</div>`;
    return `<section class="lane" id="${slug(category.id)}"><h2>${category.label}</h2>${content}</section>`;
  }).join('');

  document.querySelectorAll('[data-equip]').forEach((button) => button.addEventListener('click', () => {
    try {
      state.avatar = equipItem(state.avatar, button.dataset.equip, state.catalog);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.avatar));
      showStatus('Preview equipped. Opening the Avatar Kit Lab…');
      setTimeout(() => { location.href = 'avatar-kit-lab.html'; }, 350);
    } catch (error) {
      showStatus(String(error?.message || error));
    }
  }));

  window.SVR_AVATAR_STORE_STATE = state;
}

async function boot() {
  try {
    const response = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`SVR_AVATAR_CATALOG_${response.status}`);
    state.catalog = await response.json();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    state.avatar = normalizeAvatar(saved || createDefaultAvatar(state.catalog), state.catalog);
    state.ready = true;
    render();
    window.SVR_AVATAR_STORE_QA = () => ({
      build: state.build,
      ready: state.ready,
      categoryCount: state.catalog.storeCategories.length,
      starterSkuCount: state.catalog.starterItems.length,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    state.lastError = String(error?.message || error);
    showStatus(state.lastError);
    window.SVR_AVATAR_STORE_STATE = state;
  }
}

boot();
