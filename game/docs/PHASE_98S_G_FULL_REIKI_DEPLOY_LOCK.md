# Phase 98S-G — Full Reiki Deploy Lock

Date: 2026-06-02
Track: game-side only

## Final phase goal

Prepare the current Reiki section for full deploy/testing after the finish patch and audio containment fixes.

## Build label

`PHASE-98S-G-FULL-REIKI-DEPLOY-LOCK`

## Files touched in this deploy lock

- `game/index.html`
- `game/modules/reiki_finish_patch.js`
- `game/main.js`
- `game/docs/PHASE_98S_E_REIKI_FINISH_PATCH_MANIFEST.md`
- `game/docs/PHASE_98S_F_RUNTIME_SNAP_GUARD.md`
- `game/docs/PHASE_98S_G_REIKI_AUDIO_CONTAINMENT.md`
- `game/docs/PHASE_98S_G_FULL_REIKI_DEPLOY_LOCK.md`

## What is now included

### Reiki visual finish

- One clean flat Reiki hologram.
- Old segmented / U-shaped hologram pieces hidden.
- Old blocking background/glow-panel look removed from visible presentation.
- `AWAITING APPROVAL` label under the hologram.
- Red carpet overlay.
- Silver posts and red ropes.
- Both-side glass hints for the expanded showroom.

### Reiki audio containment

- Hologram stays visually active.
- Hologram audio no longer globally unmutes from spawn.
- Spawn area should stay silent.
- Existing proximity audio controller remains responsible for audible playback inside the Reiki showroom area.

### Runtime stability

- Fixed `snapLeft` undefined crash in `main.js`.
- Added defensive desktop-controls guard.
- Camera 3 orbit is clamped to safer radius and height values.

## Protected locks

- Website/site side untouched.
- Public Matrix page untouched.
- Lobby baseline preserved.
- Scorpion portal position preserved at X 12.78 / Y 1.60 / Z 15.75.
- No unapproved Reiki external branding added.

## Test route

Open:

`/game/?v=phase98sg-full-reiki-deploy-lock`

Then verify:

1. Build label shows `PHASE-98S-G-FULL-REIKI-DEPLOY-LOCK`.
2. No runtime error panel appears at boot.
3. You do not hear Reiki audio from spawn.
4. Reiki hologram remains visually active.
5. Audio becomes available only when entering the Reiki showroom/audio zone.
6. Reiki hologram is a single clean flat screen.
7. Red carpet, rails, ropes, and glass hints are visible.
8. Camera 3 preview does not fly out or crash.
9. Scorpion portal remains available.

## Remaining after deploy

Next recommended phase:

`Phase 98S-H — Moon/Mars Real Texture + Higher Sky Lock`

That phase should specifically audit real texture paths and CDN/direct-asset loading for Moon/Mars.
