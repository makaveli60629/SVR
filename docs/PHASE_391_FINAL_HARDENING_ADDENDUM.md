# Phase 391 Final Hardening Addendum

## Final deep-audit finding

After the Phase 391 merge, a second-pass active-manifest audit found three remaining historical Quest modules that were no longer compatible with the consolidated runtime:

1. `phase358_quest_runtime_boot_lock.js` could create `PHASE358_QUEST_TABLE_FALLBACK` before the Phase 380 original GLB completed loading.
2. `phase358_quest_pot_display_authority_lock.js` depended on the old Phase 358 boot-created display.
3. `phase358_quest_full_game_acceptance_smoothness_lock.js` waited for `SVR_PHASE358_UPLOADED_TABLE_QA` and `SVR_PHASE358_POKER_BOOT_QA`, authorities intentionally removed by Phase 391.

## Final correction

The active Phase 391 Quest manifest now excludes:

- `phase358_quest_uploaded_table_authority_lock.js`;
- `phase358_quest_runtime_boot_lock.js`;
- `phase358_quest_poker_boot_order_lock.js`;
- `phase358_quest_pot_display_authority_lock.js`;
- `phase358_quest_full_game_acceptance_smoothness_lock.js`;
- `phase379_quest_procedural_table_authority.js`;
- `phase388_quest_table_player_eric_authority.js`;
- `phase388_front_south_seat_authority.js`.

The production Quest route therefore cannot create the old Phase 358 fallback table or wait indefinitely for retired acceptance APIs.

## Direct-table performance lock

The canonical Quest route uses `direct=1`, `autoseat=1`, and `questfix=1`. For this route, deferred lobby, account, avatar-profile, and multiplayer-presence modules are disabled during the table session. This prevents background lobby construction and social bridges from competing with initial poker rendering or increasing the headset boot workload.

Standard non-direct Quest routes may still load the protected lobby/social deferred modules when explicitly used.

## Remaining active Quest stack

The Phase 391 direct Quest manifest now contains:

- runtime authority registry;
- device/XR alignment;
- incremental Quest shader compilation;
- base renderer/game boot;
- one authoritative poker engine and settlement bridge;
- Quest hands/controller interaction;
- shader and gesture gameplay polish;
- physical pot/chip settlement;
- adaptive performance pipeline.

The original table, Phase 341 cards, recessed playing surface, Eric dealer, fixed-front spawn, and Phase 391 runtime audit are loaded explicitly by `game/index.html` after the core runtime is ready.

## Result

This addendum closes the last known active duplicate-table creation path and removes obsolete acceptance waits from the production Quest boot sequence.
