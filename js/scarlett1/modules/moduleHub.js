// SVR/js/scarlett1/modules/moduleHub.js
// Simple, safe, static module hub (no dynamic imports).

export const ModuleHub = (() => {
  let ctx = null;
  const mods = [];

  function init(_ctx) {
    ctx = _ctx;
    ctx.log?.('[hub] init');
  }

  function register(mod) {
    if (!mod || !mod.id) throw new Error('Module missing {id}');
    mods.push(mod);
    ctx?.log?.(`[hub] registered: ${mod.id}`);
  }

  function start() {
    if (!ctx) throw new Error('ModuleHub.init(ctx) must be called first');
    for (const m of mods) {
      try { m.init?.(ctx); }
      catch (e) { ctx.log?.(`[hub] init fail ${m.id}: ${e.message || e}`); }
    }
    ctx.log?.('[hub] start complete');
  }

  function update(dt) {
    for (const m of mods) {
      try { m.update?.(dt, ctx); }
      catch (e) { ctx.log?.(`[hub] update fail ${m.id}: ${e.message || e}`); }
    }
  }

  return { init, register, start, update };
})();
