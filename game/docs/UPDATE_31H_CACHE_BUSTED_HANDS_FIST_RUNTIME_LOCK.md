# Update 3.1-H — Cache-Busted Hands Fist Runtime Lock

## Reason for this phase
The user reported that the game still looked unchanged after prior fixes. The likely cause was browser / Quest ES module caching: `index.html` had cache parameters, but `main.js` still imported stable nested paths such as `./modules/hands.js` and `./modules/teleport.js`, allowing Quest Browser to reuse stale module code.

## Active build

```text
UPDATE-3.1-H-CACHE-BUSTED-HANDS-FIST-RUNTIME-LOCK
```

## Files changed
- `game/main.js`
- `game/modules/hands_phase228.js`
- `game/modules/movement_phase228.js`
- `game/update31_version_sync_phase228.js`
- `game/phase176_boot.js`
- `game/phase228_cache_busted_runtime_lock.js`
- `game/index.html`
- `game/phase225_uploaded_floor_table_texture_reuse_lock.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Actual fix
`main.js` now imports cache-busted wrapper files:

```js
import { createHands } from "./modules/hands_phase228.js";
import { createTeleportRig } from "./modules/movement_phase228.js";
```

Those wrappers import the current runtime with query suffixes:

```js
export { createHands } from "./hands.js?v=phase228-hands-fist-no-controller";
export { createTeleportRig } from "./teleport_phase215.js?v=phase228movementarc";
```

This forces Quest Browser to fetch the updated hands and teleport modules instead of reusing old module cache.

## Runtime behavior preserved
- Oculus hands only.
- No created controller visual model.
- Fist-only hand teleport.
- Release fist to leap.
- Round cyan/purple particle arc.
- Hand/fist glow aura.
- Face-square cleanup remains active.
- Site untouched.

## Test URL

```text
https://svrpoker.com/game/index.html?v=phase228-cache-busted-hands-fist-runtime-lock&fresh=228
```

## Verification in browser console

```js
window.SVR_LOCKED_FINAL_BUILD
window.SVR_PHASE228
window.SVR_PHASE228_MAIN_IMPORT_LOCK
```

Expected:

```text
UPDATE-3.1-H-CACHE-BUSTED-HANDS-FIST-RUNTIME-LOCK
```
