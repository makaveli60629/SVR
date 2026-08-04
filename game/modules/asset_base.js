import * as THREE from "three";

export const ASSET_BASES = [
  new URL("../assets/", import.meta.url).toString()
];

const metrics = [];
function platform(){ return String(window.SVR_PLATFORM || document.body?.dataset?.platform || "desktop").toLowerCase(); }
function anisotropyBudget(){ const value=platform(); if(value==="camera3")return 1; if(value==="android"||value==="quest")return 2; return 6; }

export function assetUrls(...paths){
  const out = [];
  for (const rel of paths){
    for (const base of ASSET_BASES){ out.push(base + rel); }
  }
  return [...new Set(out)];
}

function withTimeout(promise, ms, label){
  let timer;
  return Promise.race([
    promise.finally(()=>clearTimeout(timer)),
    new Promise((_, reject)=>{ timer=setTimeout(()=>reject(new Error(`${label} timed out after ${ms}ms`)),ms); })
  ]);
}

export async function loadFirstTexture(urls, { colorSpace = null, timeoutMs = 6000 } = {}){
  const loader = new THREE.TextureLoader();
  const candidates = window.SVR_PHASE342_RESOLVE_ASSET_URLS?.(urls) || urls;
  for (const url of [...new Set(candidates)]){
    const started = performance.now();
    try{
      const tex = await withTimeout(new Promise((resolve, reject)=>{ loader.load(url, resolve, undefined, reject); }), timeoutMs, url);
      if (colorSpace) tex.colorSpace = colorSpace;
      tex.anisotropy = Math.min(anisotropyBudget(), window.__SVR_RENDERER__?.capabilities?.getMaxAnisotropy?.() || anisotropyBudget());
      tex.generateMipmaps = true;
      tex.userData = { ...(tex.userData || {}), svrAssetUrl:url, svrLoadMs:+(performance.now()-started).toFixed(1) };
      metrics.push({ url, ok:true, ms:tex.userData.svrLoadMs, at:new Date().toISOString() });
      if(metrics.length>100)metrics.shift();
      window.SVR_ASSET_LOAD_METRICS=metrics;
      return tex;
    }catch(err){
      metrics.push({ url, ok:false, ms:+(performance.now()-started).toFixed(1), error:String(err?.message||err), at:new Date().toISOString() });
      if(metrics.length>100)metrics.shift();
    }
  }
  window.SVR_ASSET_LOAD_METRICS=metrics;
  return null;
}

window.SVR_ASSET_LOAD_METRICS = metrics;
