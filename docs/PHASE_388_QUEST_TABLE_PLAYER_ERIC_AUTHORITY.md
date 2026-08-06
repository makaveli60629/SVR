# Phase 388 — Quest Table, Player, Eric, Logo and Lighting Authority

## Build

`PHASE-388-QUEST-TABLE-PLAYER-ERIC-AUTHORITY-LOCK`

## Scope

This phase corrects the physical Meta Quest/Oculus runtime and the website Eric dressing-room viewer. Android Phase 385 and the protected public site remain preserved.

## Failure confirmed from the headset and dressing-room screenshot

The previous Phase 387 release did not control the final physical headset position or the final Eric transform. The screenshot and runtime audit confirmed:

- The player remained at a distant lobby position instead of the playable front seat.
- Multiple older seat controllers could continue moving the rig after the recovery module ran.
- Eric was rotated onto his side and partially intersected the floor.
- The Eric FBX does not contain embedded image-texture or material nodes that can be restored in the browser.
- The gray striped appearance was a generated fallback texture, not an original Eric texture.
- Older Eric controllers could rediscover the corrected model through internal FBX object names and rotate or reposition it again.
- Older felt/logo overlays could remain above the new surface, producing the incorrect yellow square and text.
- The Quest scene did not have a single authoritative lighting system.

## Exclusive Quest authority

The Quest entry no longer imports the failed Phase 381, Phase 384, Phase 386, or Phase 387 environment controllers. Those files remain in the repository for predecessor history, but they are not loaded by the Phase 388 Oculus entry.

The core lobby, original table, poker engine, Quest input and settlement modules load first. Phase 388 then becomes the only controller for:

- Player table position
- Movement and teleport lock
- Eric dealer instance
- Eric orientation and grounding
- Eric browser material set
- Table felt and official logo
- Quest lighting
- Dark headset overlay cleanup

## Player position

### True front/south edge

The front seat is calculated from the original table object's local positive-Z axis transformed into world space. It no longer depends on the old lobby spawn or whichever side happens to be closest.

### Physical headset placement

The runtime measures the active XR headset's actual world position and moves the rig by the required world-space delta. This avoids assuming that the rig origin and the headset eye position are identical.

### Final measurements

- Table-edge gap: approximately `0.12 m`
- Eye height: approximately `0.54 m` above the measured table top
- Continuous correction tolerance: approximately `0.032 m` horizontally and `0.075 m` vertically

### Movement protection

After placement, Phase 388 blocks older calls to:

- `position.set`
- `position.copy`
- `setPlayerPose`
- `moveTo`
- `setPosition`
- Teleport methods

Teleport, locomotion, table travel, hand rays, pointer rays, stick movement and snap turning are disabled at the table.

## Eric dealer correction

### Fresh model authority

Phase 388 detaches older approved Eric roots and loads one fresh instance from:

`game/assets/models/eric/eric.fbx`

### Bone-aware orientation

The model is tested across candidate rotations. The selected orientation must place the head above the available foot/ankle/toe bones. The result is then scaled toward `1.78 m` and grounded after the final rotation.

### Yaw-only facing

The dealer root is kept at:

- Pitch: `0`
- Roll: `0`

Only yaw is changed to face the player. This prevents a full `lookAt()` operation from tilting the body back into the floor.

### Material correction

The uploaded Eric FBX has geometry, a rig and animation data, but it does not contain restorable embedded image textures or FBX material nodes. Phase 388 therefore removes the gray striped procedural fallback and applies a stable vertex-color dealer material system:

- Hair
- Skin
- White shirt
- Dark suit
- Dark pants
- Dark shoes

This same material and orientation correction is installed in the website dressing room. The dressing-room animation mixer is stopped so the imported take cannot rotate or collapse the model during inspection.

## Official table felt and logo

Phase 388 removes older Phase 167, Phase 384 and Phase 386 felt/logo overlays. It installs one purple professional felt surface and draws the repository's official root logo directly in its center:

`/logo.png`

The incorrect yellow square and legacy pass-line logo layers are hidden.

## Lighting

The Quest lighting authority contains:

- Ambient light
- Hemisphere fill
- Warm directional key
- Cool directional fill
- Dealer/table spotlight
- ACES filmic tone mapping
- Renderer exposure `1.72`
- Dynamic shadows disabled for Quest performance

## Headset view cleanup

Phase 388 removes named dark overlays and unnamed dark planar meshes attached to or very near the XR camera. Hands, controllers, watch, cards, table, official logo, dealer and sky objects are protected from this cleanup.

## Production routes

Quest/Oculus:

`https://svrpoker.com/game/quest.html?v=phase388`

Website dressing room:

`https://svrpoker.com/site/avatar.html?v=phase388`

## Required physical Quest verification

1. The cache-recovery page runs once.
2. No Start Game panel remains.
3. The headset spawns at the true front/south edge of the original table.
4. The table is immediately within normal seated playing distance.
5. Older position, seat and teleport calls cannot pull the player back.
6. Eric stands upright with his full body above the floor.
7. Eric faces the player without pitch or roll.
8. The gray stripe material is gone.
9. Eric shows the Phase 388 skin, hair, shirt, suit, pants and shoe material regions.
10. The official SVR logo is centered on the purple felt.
11. The yellow square/legacy logo is absent.
12. The table and Eric are visibly illuminated.
13. Turning the headset does not reveal a dark square or dimming film.
14. Poker cards, chips, betting and settlement continue to function.

## QA APIs

- `window.SVR_PHASE388_BOOT_QA()`
- `window.SVR_PHASE388_QA()`
- `window.SVR_PHASE388_FRONT_SOUTH_QA()`
- `window.SVR_PHASE388_VIEW_GUARD_QA()`
- `window.SVR_PHASE388_ERIC_SITE_QA()`

## Protected systems

- Original table GLB and FBX fallback
- Phase 385 Android presentation and protected poker engine
- Public website Phase 383 content
- APK `0.1.0-rc2`, version code `2`
- Manual APK update policy
