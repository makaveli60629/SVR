# SVR Poker — Phase 373 Safe Rig and Postflight Addendum

## Why this addendum exists

The first Phase 373 browser attack test proved that seated teleport blocking worked, but exposed two additional integration defects:

1. The non-XR acceptance environment selected a scene container that was also an ancestor of the poker table as the apparent player rig. Moving that container moved the table below the floor.
2. Late leave-table handlers could rewrite some teleport flags after the primary Phase 373 restore completed.

The same test scene also contained no discoverable named NPC roots, which meant a strict NPC-count assertion could not distinguish “no NPC objects loaded in headless Chromium” from “NPC repair failed.”

## Safe player-rig preflight

Module:

```text
game/modules/phase373_quest_rig_preflight_lock.js
```

It runs after the protected Phase 361 and historical Phase 364 NPC modules, but before the main Phase 373 seated lock.

It:

- examines all known player-rig references
- rejects the scene, the table itself, and every ancestor of the authoritative table
- guards rejected container movement methods while seated
- selects the nearest safe camera/player ancestor
- creates a dedicated camera rig only when no safe existing rig is available
- publishes the selected safe rig through `window.SVR_TELEPORT_RIG_REF`

QA:

```js
window.SVR_PHASE373_RIG_PREFLIGHT_QA()
```

A pass requires:

- selected rig is an Object3D
- selected rig is not the scene
- selected rig is not the table
- selected rig is not an ancestor of the table
- no preflight error

## Main seated lock

Module:

```text
game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js
```

The main lock now receives the preflight-selected safe rig. Therefore:

- exact lobby and seat positioning moves only the player/camera rig
- the poker table remains at floor `Y = 0`
- direct seated movement attempts are rejected
- standing movement is not continuously recentered
- table visibility and GLB fallback remain independent of player movement

## Quest postflight

Module:

```text
game/modules/phase373_quest_npc_teleport_postflight_lock.js
```

It runs after the main Phase 373 lock.

### Standing teleport restoration

The postflight captures the standing teleport baseline before seating. After `LEAVE TABLE`, it reapplies that baseline at:

```text
0 ms, 180 ms, 480 ms, 900 ms, and 1600 ms
```

This deliberately runs after late Phase 361/362/legacy handlers. It does not continuously reposition the standing player.

QA:

```js
window.SVR_PHASE373_POSTFLIGHT_QA()
```

A standing pass requires every teleport/locomotion flag to equal its captured standing baseline.

### Broader NPC recovery

The postflight finds both:

- explicitly named Eric, Claudia, Carla, NPC, bot, player-avatar, and Phase 356/361 roots
- unnamed skinned humanoid meshes inferred from skeletons and human-scale bounds

For available humanoids it:

- restores visibility
- preserves existing maps
- creates safe fallback skin/uniform maps only when maps are absent
- chooses an upright orientation
- grounds the model
- faces it toward the poker table
- disables expensive shadows and frustum culling

Headless Chromium may load no NPC roots. In that case the automated result is explicitly:

```text
no-humanoid-roots-in-current-scene
```

That is not claimed as physical NPC acceptance. Physical Quest appearance remains owner-verified.

## Measured browser acceptance

The updated attack test:

```text
game/tools/phase373-quest-seated-table-browser-acceptance.cjs
```

requires:

- preflight-selected rig does not own the table
- table stays at floor level before and after seating
- all seated teleport flags are false
- prohibited move toward `(99, 0, 99)` increases blocked-move count
- headset/player drift remains within the seated threshold
- table vertical drift remains within `0.04 m`
- available NPC roots are repaired, or the headless scene truthfully reports no humanoid roots
- standing teleport baseline is restored after leave
- no JavaScript, local HTTP, or request failures

## Production files

The production publisher requires all three modules:

```text
game/modules/phase373_quest_rig_preflight_lock.js
game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js
game/modules/phase373_quest_npc_teleport_postflight_lock.js
```

Android remains on the protected Phase 372 route and is not modified by these Quest-only modules.
