import * as THREE from "three";

export const ASSET_BASES = (() => {
  const bases = [
    // Normal game package path:
    new URL("../assets/", import.meta.url).toString(),

    // Root repo assets path:
    new URL("../../assets/", import.meta.url).toString(),

    // Root assets backup path if files were uploaded there:
    new URL("../../assets/assets_backup/", import.meta.url).toString(),

    // Absolute fallbacks for GitHub Pages:
    `${location.origin}/game/assets/`,
    `${location.origin}/assets/`,
    `${location.origin}/assets/assets_backup/`
  ];

  return [...new Set(bases)];
})();

export function assetUrls(...paths){
  const out = [];
  for (const rel of paths){
    for (const base of ASSET_BASES){
      out.push(base + rel.replace(/^\/+/, ""));
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
      // Try next base path silently.
    }
  }
  return null;
}

