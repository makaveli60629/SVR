import { account } from './phase345-demo-activity-persistence.js?v=phase346';
import { SVRAvatarViewer, BUILD } from './phase346-avatar-viewer.js?v=phase346';

const canvas = document.getElementById('profileAvatarCanvas');
let viewer = null, catalog = null, lastOutfit = '';

async function ensure() {
  if (!canvas) return null;
  await account.bootstrap();
  if (!catalog) {
    const response = await fetch('/site/data/avatar-catalog.json?v=phase346', { cache: 'no-store' });
    if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
    catalog = await response.json();
  }
  if (!viewer) viewer = new SVRAvatarViewer({ canvas, catalog, autoRotate: true, compact: true });
  const profile = account.snapshot().profile;
  if (!profile) return viewer;
  const outfit = profile.equippedOutfit && Object.keys(profile.equippedOutfit).length ? profile.equippedOutfit : catalog.defaultOutfit;
  const model = catalog.avatarModels.find((entry) => entry.id === outfit.modelId) || catalog.avatarModels[0];
  const modelUrl = profile.avatarUrl || new URL(model.assetUrl, location.origin).href;
  const key = JSON.stringify({ url: modelUrl, outfit });
  if (key !== lastOutfit) {
    lastOutfit = key;
    if (!viewer.modelLoaded || viewer.modelUrl !== modelUrl) await viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72));
    viewer.applyOutfit(outfit);
  }
  return viewer;
}
async function audit() {
  await ensure();
  const result = { build: BUILD, active: Boolean(viewer), profile: Boolean(account.snapshot().profile), viewer: viewer?.audit?.() || null, checkedAt: new Date().toISOString() };
  result.pass = Boolean(result.active && result.profile && result.viewer?.modelLoaded);
  return result;
}
ensure().catch((error) => { window.SVR_PHASE346_PROFILE_AVATAR_ERROR = String(error?.message || error); });
window.addEventListener('svr:account-change', () => ensure().catch(() => undefined));
window.addEventListener('svr:avatar-outfit-preview', () => ensure().catch(() => undefined));
window.SVR_PHASE346_PROFILE_AVATAR_QA = audit;
window.SVR_PHASE346_PROFILE_AVATAR_RESET = () => viewer?.resetView?.();
