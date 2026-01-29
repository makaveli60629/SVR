/**
 * SCARLETT • SAFE MODULAR SPINE (WORLD MOUNT FIX)
 * - Forces world init so you never sit on black "starting..."
 * - Loads world_v2.js (not world.js) to avoid cached/duplicate crashes.
 */

import { boot } from "./modules/bootHud.js";

const BUILD = "SCARLETT1_SAFE_MODULAR_SPINE_V2_WORLD_MOUNT";

const MODULES = [
  { name: "world", path: "./world_v2.js" }
];

function log(line) {
  boot.log(line);
}

async function loadOne(mod, ctx) {
  try {
    // cache-bust so GitHub Pages + SW don't trap you
    const m = await import(mod.path + `?v=${Date.now()}`);
    log(`[mod] loaded: ${mod.path}`);

    if (typeof m.init === "function") {
      await m.init(ctx);
      log(`[mod] init ok: ${mod.path}`);
    } else {
      log(`[mod] WARN: no init() export in ${mod.path}`);
    }
  } catch (e) {
    log(`[mod] FAIL: ${mod.path} :: ${e?.message || e}`);
  }
}

async function start() {
  const ctx = await boot.mount({ build: BUILD });

  for (const mod of MODULES) {
    await loadOne(mod, ctx);
  }

  // ✅ this is the missing piece in your screenshot:
  // world init finishes -> we mark ready
  boot.ready();
}

start();
