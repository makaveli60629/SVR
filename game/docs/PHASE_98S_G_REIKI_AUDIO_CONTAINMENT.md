# Phase 98S-G — Reiki Audio Containment

Date: 2026-06-02
Track: game-side only

## Problem

After the Reiki finish patch, the hologram video could become audible immediately after the first click/key gesture, including from the main spawn/lobby area.

That was not the intended behavior. The requirement is:

- Reiki hologram remains visually active.
- Audio must not be heard from spawn.
- Audio should only be heard when the player enters the Reiki glass/showroom area.
- Do not lower the volume globally; preserve the loud in-room experience.

## Fix applied

Updated:

- `game/modules/reiki_finish_patch.js`

The patch no longer globally unmutes the video element after user interaction.

Instead it keeps the video muted/volume-zero at the video element layer and preserves the original `lobby_visibility_lock.js` proximity audio controller as the only source allowed to control audible playback.

## Expected result

- Hologram remains visible and playing.
- Spawn area should be silent.
- Audio should become audible only inside the Reiki room/audio zone.
- Volume behavior from the original proximity controller remains preserved.

## Protected

- Website/site not touched.
- Lobby baseline not rewritten.
- Reiki visual finish patch preserved.
- Scorpion portal lock preserved.

## Next follow-up

Next pass should audit Moon/Mars asset paths and CDN strategy:

- verify actual moon/mars texture files
- verify served `/game/assets/...` paths
- ensure no missing case-sensitive filenames
- replace procedural-looking spots with true texture maps where available
- raise Moon/Mars higher and scale Moon larger as requested
