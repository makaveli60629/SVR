/**
 * SCARLETT1_SAFE_MODULAR_SPINE_V1 HOTFIX
 * Loads world_v2.js to bypass cached/broken world.js ("top already declared").
 */
import { boot } from './modules/bootHud.js';

const BUILD = "SCARLETT1_SAFE_MODULAR_SPINE_V1_HOTFIX_WORLD_V2";

const MODULES = [
  { name: "world", path: "./world_v2.js" },
  { name: "storePad", path: "./modules/storePad.js" },
  { name: "musicHint", path: "./modules/musicHint.js" },
  { name: "pokerHoverDemo", path: "./modules/pokerHoverDemo.js" }
];

function log(line){ boot.log(line); }

async function loadOne(mod, ctx){
  try{
    const m = await import(mod.path + `?v=${Date.now()}`);
    log(`[mod] loaded: ${mod.path}`);
    if (m.init) {
      await m.init(ctx);
      log(`[mod] init ok: ${mod.path}`);
    } else {
      log(`[mod] WARN: no init() export in ${mod.path}`);
    }
  }catch(e){
    log(`[mod] FAIL: ${mod.path} :: ${e?.message || e}`);
  }
}

export async function startSpine(){
  const ctx = await boot.mount({ build: BUILD });
  for(const mod of MODULES){
    await loadOne(mod, ctx);
  }
  boot.ready();
}

startSpine();
