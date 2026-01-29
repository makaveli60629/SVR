/**
 * MODULE: musicHint.js
 * Small helper log so you know music is wired.
 */
export async function init(ctx){
  const { log } = ctx;
  log('[music] wired to HUD buttons ✅');
  return {};
}
