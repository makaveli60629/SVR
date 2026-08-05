import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

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
    return pending.get(resolved);
  };
  window.SVR_PHASE381_FBX_LOAD_CACHE = pending;
}

window.SVR_PHASE381_ASSET_CACHE_QA = () => ({
  build: BUILD,
  installed: Boolean(FBXLoader.prototype[key]),
  pendingOrLoadedAssets: window.SVR_PHASE381_FBX_LOAD_CACHE?.size || 0,
  checkedAt: new Date().toISOString()
});
