import { account } from '../../site/js/phase345-demo-activity-persistence.js?v=phase346';

const BUILD = 'PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK';
const CATALOG_URL = '/site/data/avatar-catalog.json?v=phase346';
let catalog = null, lastSignature = '';

async function loadCatalog() {
  if (catalog) return catalog;
  const response = await fetch(CATALOG_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
  catalog = await response.json();
  return catalog;
}
function normalize(profile, sourceCatalog) {
  const defaults = sourceCatalog.defaultOutfit || {}, source = profile?.equippedOutfit || {};
  const outfit = { schemaVersion: 1, modelId: source.modelId || defaults.modelId || 'eric', palette: source.palette || defaults.palette || 'midnight', headwear: source.headwear ?? defaults.headwear ?? 'none', eyewear: source.eyewear ?? defaults.eyewear ?? 'none', top: source.top ?? defaults.top ?? 'none', shoes: source.shoes ?? defaults.shoes ?? 'none', accessory: source.accessory ?? defaults.accessory ?? 'none' };
  const model = sourceCatalog.avatarModels.find((entry) => entry.id === outfit.modelId) || sourceCatalog.avatarModels[0];
  return { build: BUILD, playerId: profile?.playerId || null, displayName: profile?.displayName || 'Player', modelUrl: profile?.avatarUrl || new URL(model.assetUrl, location.origin).href, modelFormat: model.format || 'fbx', targetHeightMeters: Number(model.targetHeightMeters || 1.72), outfit, source: account.snapshot().mode, updatedAt: new Date().toISOString() };
}
async function sync() {
  await account.bootstrap();
  const avatar = normalize(account.snapshot().profile, await loadCatalog()), signature = JSON.stringify(avatar);
  if (signature !== lastSignature) { lastSignature = signature; window.SVR_PLAYER_AVATAR_PROFILE = avatar; window.dispatchEvent(new CustomEvent('svr:player-avatar-profile', { detail: avatar })); }
  return avatar;
}
function audit() {
  const avatar = window.SVR_PLAYER_AVATAR_PROFILE || null;
  const result = { build: BUILD, active: true, profileLoaded: Boolean(avatar), modelUrl: avatar?.modelUrl || null, modelFormat: avatar?.modelFormat || null, targetHeightMeters: avatar?.targetHeightMeters || null, outfitSchema: avatar?.outfit?.schemaVersion || null, source: avatar?.source || null, route: '/game/avatar.html?v=phase346', checkedAt: new Date().toISOString() };
  result.pass = Boolean(result.profileLoaded && result.modelUrl && result.outfitSchema === 1); return result;
}
sync().catch((error) => { window.SVR_PHASE346_AVATAR_BRIDGE_ERROR = String(error?.message || error); });
window.addEventListener('svr:account-change', () => sync().catch(() => undefined));
window.addEventListener('storage', (event) => { if (/svr_phase345_demo_player|svr_phase346/i.test(event.key || '')) sync().catch(() => undefined); });
window.SVR_PHASE346_AVATAR_SYNC = sync;
window.SVR_PHASE346_AVATAR_BRIDGE_QA = audit;
window.SVR_OPEN_AVATAR_ROOM = () => { location.href = '/game/avatar.html?v=phase346'; };
