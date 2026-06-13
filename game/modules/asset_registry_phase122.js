// Phase 122 asset registry: gloves + optimized Earth textures.
// Runtime-safe: assets are registered but not auto-loaded into the main lobby unless a later phase enables them.
window.SVR_PHASE122_ASSETS = {
  build: "UPDATE-3.0-PHASE-122-GLOVES-EARTH-ASSET-ADD-LOCK",
  runtimeSafe: true,
  assets: {
    gloves: {
      type: "obj-cosmetic",
      name: "Protective Gear Gloves",
      obj: "assets/models/gloves/protective_gear/protective_gear_gloves.obj",
      mtl: "assets/models/gloves/protective_gear/protective_gear_gloves.mtl",
      textures: [
        "assets/models/gloves/protective_gear/protective_gear_skin_diffuse.jpg",
        "assets/models/gloves/protective_gear/protective_gear_color.jpg"
      ],
      usage: "Future avatar/controller cosmetic preview. Do not auto-load on Quest until optimized GLB conversion is approved."
    },
    earth: {
      type: "planet-texture-set",
      name: "Optimized Earth Texture Set",
      albedo: "assets/texture/earth/earth_albedo_1k.webp",
      clouds: "assets/texture/earth/earth_clouds_1k.webp",
      nightLights: "assets/texture/earth/earth_night_lights_1k.webp",
      bump: "assets/texture/earth/earth_bump_1k.jpg",
      landOceanMask: "assets/texture/earth/earth_land_ocean_mask_1k.webp",
      usage: "Future high-sky Earth planet or presentation asset. Blend source intentionally excluded from runtime package."
    }
  }
};
console.info("SVR Phase 122 assets registered", window.SVR_PHASE122_ASSETS);
