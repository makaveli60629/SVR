# Update 3.1-F — Single Runtime Quest Controller Overlay Lock

## User issues addressed
- Browser tab/build label bouncing between older 3.0 / 3.1 / 3.1-C / 3.1-E phases.
- Old phase layers appearing and disappearing during boot.
- Missing or inconsistent upstairs floor behavior caused by overlapping legacy modules.
- Two Mars / duplicate sky objects.
- Quest forward movement not following the current 45-degree facing direction.
- Transparent dark square overlays stuck in front of the Oculus view.
- Right Quest controller not visible while playing.
- Teleport beam close/far distance not adjustable enough.

## Files changed
- `game/update31_version_sync_lock.js`
- `game/modules/teleport_phase215.js`
- `game/modules/hands.js`
- `game/phase225_uploaded_floor_table_texture_reuse_lock.js`
- `game/phase176_boot.js`
- `game/phase226_single_runtime_quest_controller_overlay_lock.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Runtime lock
The active build is now:

```text
UPDATE-3.1-F-SINGLE-RUNTIME-QUEST-CONTROLLER-OVERLAY-LOCK
```

The new runtime sets:

```js
window.SVR_LOCKED_FINAL_BUILD
window.SVR_PHASE226.active
window.SVR_UPDATE31.phase = "3.1-F"
```

## Legacy phase conflict fix
`update31_version_sync_lock.js` no longer auto-imports:

- `update31_lobby_structure_completion.js`
- `update31_moon_phase_hard_lock.js`

Those legacy imports were re-stamping older labels and introducing duplicate lobby/sky layers.

## Quest movement fix
`teleport_phase215.js` now uses the active XR headset/camera forward vector for right-stick forward/back movement. This is intended to make snap-turn 45 degrees, then forward, move in the direction the player is currently facing.

## Quest controller visual
`hands.js` now creates a visible lightweight Quest-style right controller model while keeping hand/proxy debug overlays hidden.

## Face overlay purge
`phase226_single_runtime_quest_controller_overlay_lock.js` repeatedly removes:

- camera-attached transparent planes/sprites
- diagnostic panels
- black/view/screen overlay meshes
- near-face transparent flat squares
- the Phase 225 texture diagnostic label

## Moon/Mars normalization
The phase keeps only:

- `UPDATE31D_ONLY_SKY_MOON_LEFT_EYE_CANDY`
- `UPDATE31D_ONLY_SKY_MOON_HALO`
- `UPDATE31D_TEXTURED_MARS_HIGH_SKY`

Extra Moon/Mars objects are removed.

## Moon texture note
The phase attempts to load a real moon texture from common repo paths under `game/assets/`. If no matching texture is found, it preserves the current high-sky moon instead of breaking the scene.

## Test URL

```text
https://svrpoker.com/game/?v=phase226-single-runtime-quest-controller-overlay-lock
```

## Quest checklist
- [ ] Browser title stays on Update 3.1-F.
- [ ] No old phase/title bouncing after boot.
- [ ] Upstairs floor remains visible.
- [ ] No dark transparent squares remain in front of the eyes.
- [ ] Right Quest controller is visible.
- [ ] Snap-turn 45 degrees, then push forward: movement follows facing direction.
- [ ] Hold grip/trigger to aim teleport; move stick to adjust near/far; release to teleport.
- [ ] Only one Moon and one Mars remain high in the sky.
- [ ] Site remains untouched.
