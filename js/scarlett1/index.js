/**
 * SCARLETT1 • ENTRY (PERMANENT)
 * Tools + spine + Scarlett One world.
 */
import { Spine } from './spine.js';
import { Diagnostics } from './diagnostics.js';
import { DevHUD } from './devhud.js';

export function bootScarlettOne() {
  Diagnostics.mount();
  DevHUD.mount(Diagnostics);
  Spine.start({ Diagnostics });
}
