import { SVRAvatarViewer } from './phase346-avatar-viewer.js?v=phase351';

export const BUILD = 'PHASE-368-PROFILE-REAL-TEXTURE-BARE-AVATAR-FIT-LOCK';

const ACTIVE = /\/site\/profile\.html$/i.test(location.pathname) || Boolean(document.getElementById('profileShowroomCanvas'));
const originalApplyOutfit = SVRAvatarViewer.prototype.applyOutfit;
const originalLoadModel = SVRAvatarViewer.prototype.loadModel;
const materialSnapshots = new WeakMap();

function rememberMaterials(viewer) {
  for (const material of viewer?.baseMaterials || []) {
    if (!material || materialSnapshots.has(material)) continue;
    materialSnapshots.set(material, {
      color: material.color?.clone?.() || null,
      map: material.map || null,
      normalMap: material.normalMap || null,
      roughnessMap: material.roughnessMap || null,
      metalnessMap: material.metalnessMap || null,
      emissiveMap: material.emissiveMap || null,
      roughness: material.roughness,
      metalness: material.metalness,
      transparent: material.transparent,
      opacity: material.opacity
    });
  }
}

function restoreRealTextures(viewer) {
  let textured = 0;
  let restored = 0;
  for (const material of viewer?.baseMaterials || []) {
    const snapshot = materialSnapshots.get(material);
    if (!snapshot) continue;
    const hasTexture = Boolean(snapshot.map || snapshot.normalMap || snapshot.roughnessMap || snapshot.metalnessMap || snapshot.emissiveMap);
    if (hasTexture) textured += 1;
    if (snapshot.color && material.color) material.color.copy(snapshot.color);
    material.map = snapshot.map;
    material.normalMap = snapshot.normalMap;
    material.roughnessMap = snapshot.roughnessMap;
    material.metalnessMap = snapshot.metalnessMap;
    material.emissiveMap = snapshot.emissiveMap;
    if (Number.isFinite(snapshot.roughness)) material.roughness = snapshot.roughness;
    if (Number.isFinite(snapshot.metalness)) material.metalness = snapshot.metalness;
    material.transparent = snapshot.transparent;
    material.opacity = snapshot.opacity;
    for (const texture of [material.map, material.emissiveMap]) {
      if (texture?.isTexture) {
        texture.colorSpace = 'srgb';
        texture.needsUpdate = true;
      }
    }
    material.needsUpdate = true;
    restored += 1;
  }
  return { textured, restored };
}

function clearGeneratedClothes(viewer) {
  const root = viewer?.equipmentRoot;
  if (!root) return 0;
  let count = 0;
  while (root.children.length) {
    const child = root.children.pop();
    child?.traverse?.((object) => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => material.dispose?.());
    });
    count += 1;
  }
  return count;
}

function bareProfileOutfit(input = {}, viewer) {
  const modelId = input.modelId || viewer?.catalog?.defaultOutfit?.modelId || 'eric';
  const palette = input.palette || viewer?.catalog?.defaultOutfit?.palette || 'midnight';
  return {
    schemaVersion: 1,
    modelId,
    palette,
    headwear: 'none',
    eyewear: 'none',
    top: 'none',
    shoes: 'none',
    accessory: 'none'
  };
}

if (ACTIVE) SVRAvatarViewer.prototype.loadModel = async function phase368TextureAwareLoadModel(...args) {
  const result = await originalLoadModel.apply(this, args);
  rememberMaterials(this);
  const textureState = restoreRealTextures(this);
  clearGeneratedClothes(this);
  this.currentOutfit = bareProfileOutfit(this.currentOutfit || {}, this);
  window.SVR_PHASE368_PROFILE_TEXTURE_STATE = {
    build: BUILD,
    modelLoaded: Boolean(this.modelLoaded),
    fallbackUsed: Boolean(this.fallbackUsed),
    modelUrl: this.modelUrl || null,
    ...textureState,
    generatedClothes: 0,
    checkedAt: new Date().toISOString()
  };
  return result;
};

if (ACTIVE) SVRAvatarViewer.prototype.applyOutfit = function phase368BareTextureOutfit(input = {}) {
  rememberMaterials(this);
  const bare = bareProfileOutfit(input, this);
  const result = originalApplyOutfit.call(this, bare);
  const removed = clearGeneratedClothes(this);
  const textureState = restoreRealTextures(this);
  this.currentOutfit = bare;
  window.SVR_PHASE368_PROFILE_TEXTURE_STATE = {
    build: BUILD,
    modelLoaded: Boolean(this.modelLoaded),
    fallbackUsed: Boolean(this.fallbackUsed),
    modelUrl: this.modelUrl || null,
    ...textureState,
    generatedClothesRemoved: removed,
    bareAvatar: true,
    checkedAt: new Date().toISOString()
  };
  return { ...bare, phase368BareAvatar: true };
};

function installStyle() {
  if (document.getElementById('svr368-profile-texture-style')) return;
  const style = document.createElement('style');
  style.id = 'svr368-profile-texture-style';
  style.textContent = `
.profile-showroom{min-height:620px!important}
.profile-showroom canvas{height:620px!important}
.showroom-overlay{padding:14px!important}
.showroom-identity{max-width:min(500px,58%)!important;padding:11px 13px!important;background:rgba(1,4,12,.58)!important}
.showroom-identity h1{font-size:clamp(22px,3vw,34px)!important}
.showroom-status-card{max-width:480px!important;background:rgba(0,0,0,.56)!important}
.showroom-controls{max-width:min(620px,62%)!important}
.showroom-controls .btn{min-height:40px!important;padding:9px 12px!important}
.showroom-hint{bottom:68px!important}
@media(max-width:800px){
  .profile-showroom{min-height:640px!important}
  .profile-showroom canvas{height:640px!important}
  .showroom-identity{max-width:calc(100% - 90px)!important}
  .showroom-bottom{gap:8px!important}
  .showroom-controls{max-width:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .showroom-status-card{max-width:100%!important}
}
@media(max-width:520px){
  .profile-showroom{min-height:680px!important}
  .profile-showroom canvas{height:680px!important}
  .showroom-overlay{padding:10px!important}
  .showroom-identity{max-width:calc(100% - 76px)!important}
  .showroom-controls .btn{font-size:13px!important;padding:8px!important}
}
`;
  document.head.appendChild(style);
}

if (ACTIVE) installStyle();

window.SVR_PHASE368_PROFILE_TEXTURE_QA = () => {
  const state = window.SVR_PHASE368_PROFILE_TEXTURE_STATE || {};
  return {
    build: BUILD,
    active: ACTIVE,
    patchInstalled: ACTIVE && SVRAvatarViewer.prototype.applyOutfit !== originalApplyOutfit,
    bareAvatar: state.bareAvatar !== false,
    modelLoaded: state.modelLoaded ?? null,
    fallbackUsed: state.fallbackUsed ?? null,
    texturedMaterials: Number(state.textured || 0),
    restoredMaterials: Number(state.restored || 0),
    generatedClothes: Number(state.generatedClothes || 0),
    pass: Boolean(
      ACTIVE
      && SVRAvatarViewer.prototype.applyOutfit !== originalApplyOutfit
      && Number(state.generatedClothes || 0) === 0
      && (state.modelLoaded == null || state.modelLoaded === true)
    ),
    checkedAt: new Date().toISOString()
  };
};

window.dispatchEvent(new CustomEvent('svr:phase368-profile-texture-ready', { detail: { build: BUILD } }));
