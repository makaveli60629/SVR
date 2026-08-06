# Phase 387 — Quest Direct Seat Recovery

## Build

`PHASE-387-QUEST-DIRECT-SEAT-RECOVERY-LOCK`

## Why Phase 386 did not change the headset view

The physical Oculus report showed that the deployed Phase 386 behavior was not taking authority over the route and rig actually used in the headset.

The repo audit found four concrete causes:

1. The public launch page still linked the Quest game with `v=phase384`.
2. `site-public-hooks.js` still used the Phase 384 cache epoch and rewrote Quest links back to Phase 384.
3. Phase 373 had wrapped the rig movement methods and `position.set`. Phase 386 reused a guarded transform, so its placement call could return without moving the headset to the table.
4. Phase 373 registered an XR session-start lobby correction that could move the player back away from the table after WebXR entered immersive mode.

## Phase 387 authority

### Unique Oculus entry

`game/quest.html` is now the canonical Quest entry.

On its first load it:

- unregisters stale service workers;
- deletes existing browser caches;
- advances the Quest/public cache epoch;
- reloads itself once with `clean=1`;
- opens the runtime using a timestamped direct-mode URL.

This unique filename prevents an old cached `/game/index.html` document from remaining the only runtime seen by the headset.

### No start screen

Direct Quest mode hides the boot/start overlay and begins loading automatically. The user is not required to press a Start Game button.

### Immediate seated table position

The runtime:

- calls the real Phase 361 table-join API once;
- sets the seated state explicitly;
- positions the player approximately `0.48 m` beyond the front/south table edge;
- calibrates eye height close to the table surface;
- uses Phase 373's preserved original rig methods when available;
- directly updates rig coordinates when guarded public methods cannot be used;
- applies repeated corrections after XR session start;
- continuously corrects later lobby drift.

### Lobby-spawn prevention

Public lobby-spawn APIs are replaced in direct Quest mode with the seated-table placement command. The older Phase 373 XR session-start lobby move is followed by timed reseat bursts and the continuous table anchor.

### Teleport and movement

At the direct table seat:

- locomotion is disabled;
- stick movement is disabled;
- table travel is disabled;
- hand, grip, watch, and standard teleport are disabled;
- pointer and hand rays are disabled;
- teleport arcs, markers, landing indicators, and reticles are hidden.

### Eric recovery

Phase 387 does not depend only on the older deferred Eric loader.

It:

- reuses a valid approved Eric root only when that root contains visible meshes;
- otherwise independently loads `game/assets/models/eric/eric.fbx`;
- normalizes Eric upright toward `1.78 m`;
- places Eric behind the dealer side of the table;
- preserves usable source texture maps;
- creates fallback skin, hair, shirt, suit, pants, and shoe textures when maps are missing;
- applies textures only once to prevent repeated material cloning;
- hides duplicate approved Eric roots and external skeleton helpers;
- throttles alignment work for Quest performance.

### Preserved Phase 386 environment work

Phase 387 reasserts and preserves:

- original uploaded table authority;
- professional lighting;
- corrected table materials and felt;
- SVR felt logo;
- black headset-overlay cleanup;
- textured Moon;
- Earth and Mars preservation.

## Public routes

Canonical Oculus entry:

`https://svrpoker.com/game/quest.html?v=phase387`

Direct runtime target:

`https://svrpoker.com/game/index.html?platform=quest&v=phase387&direct=1&autoseat=1&questfix=1&clean=1`

Android remains:

`https://svrpoker.com/game/android.html?channel=stable&v=phase385`

## Required headset acceptance

1. Opening Preview Game or the canonical Quest URL clears the stale runtime once.
2. No Start Game screen remains in front of the game.
3. The player enters seated at the front edge of the original table.
4. The headset does not return to the far lobby position after entering VR.
5. Eric appears behind the opposite/dealer side of the table.
6. Eric has visible materials and no separate skeleton helper.
7. The table is lit, readable, and branded with the SVR logo.
8. Teleport and locomotion remain unavailable while seated.
9. The black square/film is absent.
10. Moon, Earth, and Mars remain visible according to their locked environment rules.

## QA APIs

- `window.SVR_PHASE387_BOOT_QA()`
- `window.SVR_PHASE387_QA()`
- `window.SVR_PHASE387_DIRECT_SEAT(reason)`
- `window.SVR_PHASE387_ENSURE_ERIC()`
- `window.SVR_PHASE387_SWEEP(reason)`

## Protected systems

- Phase 383/384 website content and layout
- Phase 380 deterministic poker engine
- Phase 385 Android tabletop presentation
- Phase 381 dealer motion/audio authority
- APK `0.1.0-rc2`, version code `2`, manual updates only
