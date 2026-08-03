# SVR Poker — Phase 373 Quest Recovery Manifest

## Release identity

- **Active build:** `PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK`
- **Android build preserved:** `PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK`
- **Android route:** `/game/android.html?channel=stable&v=phase372`
- **Quest/Oculus route:** `/game/index.html?platform=quest&v=phase373`
- **Production source:** `main`
- **Production publish branch:** `gh-pages`
- **Database authority:** AWS Cognito + DynamoDB

## Owner-reported Quest failures

The owner reported:

1. Grip/teleport still moved the player while seated.
2. The actual uploaded table was invisible.
3. Eric and other NPCs were tilted or not standing correctly.
4. NPC textures were missing.
5. The player spawned near or inside the table and bounced between positions.

## Root cause audit

The Quest route had two active spawn authorities:

- Phase 364 placed the standing lobby position approximately `0.90 m` beyond the south/front table rail.
- Phase 361 then moved the player to a different lobby position approximately `4.1 m` from the table.

Phase 372 called both public spawn APIs in sequence. That produced visible position changes and could be repeated by recovery/seat transitions.

The seated path also disabled boolean locomotion flags, but older grip-teleport listeners and direct rig movement methods could still move the rig. The table authority could exist while its parent, mesh, material opacity, or color write remained invisible. The Phase 364 Eric quarantine intentionally hid Eric rather than repairing the model.

## Phase 373 corrections

### One exact spawn authority

Phase 373 redirects both public Quest spawn APIs to one implementation:

```js
window.SVR_PHASE364_LOBBY_SPAWN = window.SVR_PHASE373_STABLE_LOBBY
window.SVR_PHASE361_LOBBY_SPAWN = window.SVR_PHASE373_STABLE_LOBBY
```

The exact table-relative positions are:

- standing lobby gap: `0.90 m` beyond the south/front rail
- seated gap: `0.62 m` beyond the south/front rail

Only meaningful drift is corrected. The runtime no longer alternates between Phase 364 and Phase 361 lobby positions.

### Seated teleport hard block

While `SVR_PHASE361_STATE.seated` is true, Phase 373:

- sets all known teleport, grip teleport, hand ray, pointer, locomotion, and table-travel flags to `false`
- disables the transparent floor as a teleport target
- suspends Quest controller `squeezestart` and `squeezeend` listeners
- hides teleport arcs, rays, and landing markers
- wraps rig movement/teleport methods and rejects external movement
- maintains the exact seated anchor if another module or input attempts to move the player

Trigger/select remains available for poker and UI interaction. Grip teleport is restored after `LEAVE TABLE`.

### Visible uploaded table

Phase 373 first recovers the existing table authority by:

- forcing every parent and table child visible
- forcing mesh materials visible and opaque
- enabling material color/depth writing
- preserving existing texture maps and neutralizing accidental dark tint
- disabling table frustum culling
- aligning the model to the locked `2.74 × 0.80 × 1.46 m` geometry

If no valid visible table authority exists, Phase 373 loads:

```text
game/assets/models/table.glb
```

The fallback receives the authority name:

```text
PHASE373_VISIBLE_TABLE_GLB_AUTHORITY
```

`game/assets/table.fbx` remains included in the production artifact as the protected source/fallback asset.

### Eric and NPC repair

Phase 373 replaces the public Phase 364 NPC quarantine function. The existing quarantine timer therefore calls the Phase 373 repair instead of hiding Eric.

For Eric, Claudia, Carla, and table bots, Phase 373:

- restores root and mesh visibility
- preserves existing texture maps
- applies safe procedural skin/uniform textures where maps are absent
- evaluates alternate 90-degree rotations and selects the most upright orientation
- grounds the model at floor `Y = 0`
- turns the model toward the table
- disables expensive shadows and frustum culling for stability

The uploaded Phase 368 dealer remains separate and is excluded from this NPC repair pass.

## Protected authorities

Phase 373 does not replace:

- Phase 336 poker rules and settlement
- Phase 358 Quest complete-game authority
- Phase 359 continuity
- Phase 360 fresh shuffle and chip conservation
- Phase 361 PLAY GAME, LEAVE TABLE, watch, and seated state
- Phase 364 table dimensions, floor, and XR entry
- Phase 365 VR button deduplication
- Phase 368 uploaded dealer motion
- Phase 372 visible entry recovery

It adds a final Quest-only safety layer after those authorities load.

## Runtime QA

```js
window.SVR_PHASE373_QA()
window.SVR_PHASE373_STABLE_LOBBY()
window.SVR_PHASE373_STABLE_SEAT()
window.SVR_PHASE373_REPAIR_TABLE()
window.SVR_PHASE373_REPAIR_NPCS()
```

The QA report includes:

- visible table mesh count and measured dimensions
- active GLB/existing table source
- exact stable anchor and current headset position
- teleport flag state
- wrapped rig methods and rejected movement count
- suspended grip listeners
- hidden teleport visual count
- NPC visibility, texture, upright, grounding, and facing counts

## Automated validation

Static test:

```text
game/tools/phase373-quest-seated-table-static-test.mjs
```

Browser acceptance:

```text
game/tools/phase373-quest-seated-table-browser-acceptance.cjs
```

The browser test:

1. verifies the visible table and exact standing spawn
2. enters the Phase 361 seated state
3. confirms all teleport flags are false
4. attempts a prohibited direct rig move to `(99, 0, 99)`
5. requires Phase 373 to reject/correct the move
6. verifies the player remains at the exact seat anchor
7. verifies at least one NPC is visible, textured, and upright
8. leaves the table and requires the stable lobby spawn and teleport restoration
9. re-runs full Quest and Android games in the same protected workflow

## Deployment

The single production workflow is:

```text
.github/workflows/deploy.yml
```

After a validated merge to `main`, it publishes the exact build to `gh-pages`, requires the Phase 373 module and both table assets, and writes:

```text
/deploy-health.json
```

Expected routes in deployment health:

```text
Android: /game/android.html?channel=stable&v=phase372
Quest:   /game/index.html?platform=quest&v=phase373
```

## Truth and physical acceptance

Automated Chromium tests can validate scene authority, visibility, exact anchors, rig movement rejection, gameplay flow, and JavaScript state. Only the owner’s physical Quest can finally confirm controller grip behavior, Guardian/floor alignment, comfort, model appearance through the headset lenses, and real tracking stability.

AWS resources remain defined through the Phase 372 CloudFormation template. Azure is retired and unsupported.
