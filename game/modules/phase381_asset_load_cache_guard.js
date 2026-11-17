import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

export const BUILD = 'PHASE-381-ASSET-LOAD-CACHE-GUARD';
const key = Symbol.for('svr.phase381.fbxLoadCacheInstalled');

if (!FBXLoader.prototype[key]) {
  const original = FBXLoader.prototype.loadAsync;
  const pending = new Map();
  Object.defineProperty(FBXLoader.prototype, key, { value: true });
  FBXLoader.prototype.loadAsync = function phase381CachedFbxLoadAsync(url, onProgress) {
    const resolved = new URL(String(url), location.href).href;
    if (!pending.has(resolved)) {
      const request = original.call(this, resolved, onProgress).catch((error) => {
        pending.delete(resolved);
        throw error;
      });
      pending.set(resolved, request);
    }
    // Cache the download/parse, never a live scene instance. Legacy and current
    // dealers may request the same FBX; sharing it reparents the model and lets
    // their floor/animation guards fight over one skeleton.
    return pending.get(resolved).then((asset) => {
      const instance = cloneSkeleton(asset);
      instance.traverse((object) => {
        if (Array.isArray(object.material)) object.material = object.material.map(material => material?.clone?.() || material);
        else if (object.material?.clone) object.material = object.material.clone();
      });
      return instance;
    });
  };
  window.SVR_PHASE381_FBX_LOAD_CACHE = pending;
}

window.SVR_PHASE381_ASSET_CACHE_QA = () => ({
  build: BUILD,
  installed: Boolean(FBXLoader.prototype[key]),
  pendingOrLoadedAssets: window.SVR_PHASE381_FBX_LOAD_CACHE?.size || 0,
  checkedAt: new Date().toISOString()
});
