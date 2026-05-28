import * as THREE from "three";

export const ASSET_BASES = [
  new URL("../assets/", import.meta.url).toString()
];

export function assetUrls(...paths){
  const out = [];
  for (const rel of paths){
    for (const base of ASSET_BASES){
      out.push(base + rel);
    }
  }
  return [...new Set(out)];
}

export async function loadFirstTexture(urls, { colorSpace = null } = {}){
  const loader = new THREE.TextureLoader();
  for (const url of urls){
    try{
      const tex = await new Promise((resolve, reject)=>{
        loader.load(url, resolve, undefined, reject);
      });
      if (colorSpace) tex.colorSpace = colorSpace;
      tex.anisotropy = 8;
      return tex;
    }catch(err){
      // try next
    }
  }
  return null;
}
