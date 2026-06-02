# Phase 98S-E — Reiki Finish Patch Manifest

Date: 2026-06-02
Track: game-side only

## Purpose

Finish the current Reiki showroom/hologram pass without rewriting the full lobby or touching the website/site track.

## Files changed

- `game/modules/reiki_finish_patch.js`
- `game/index.html`
- `game/docs/PHASE_98S_E_REIKI_FINISH_PATCH_MANIFEST.md`

## What was fixed

- Added a safe modular patch that detects the existing Reiki video texture at runtime.
- Hides the older segmented / U-shaped Reiki hologram pieces.
- Replaces the visible hologram with one clean, flat, inward-facing video panel.
- Removes the old blocking wall-glow look from the visible hologram presentation.
- Adds a clean `AWAITING APPROVAL` label below the hologram.
- Adds straight red carpet overlay in the expanded Reiki area.
- Adds silver stanchions with red ropes.
- Adds both-side glass hints for the expanded Reiki showroom.
- Preserves the existing video source and audio zone behavior.
- Primes the video audio after player click or key gesture.

## Protected / not touched

- Website/site side was not edited.
- Public Matrix launch page was not edited.
- Scorpion portal position remains locked at X 12.78 / Y 1.60 / Z 15.75.
- Existing lobby baseline was not rewritten.
- Existing `lobby_visibility_lock.js` was not replaced.
- Existing video source path was preserved.

## Current build label

`PHASE-98S-E-REIKI-FINISH-PATCH`

## Test checklist

1. Open `/game/?v=phase98se-reiki-finish`.
2. Confirm build label shows `PHASE-98S-E-REIKI-FINISH-PATCH`.
3. Walk to the Reiki showroom area.
4. Confirm the hologram is one flat screen, not a U-shaped segmented display.
5. Confirm no large opaque background/wall is blocking the video.
6. Confirm label is under the hologram and says `AWAITING APPROVAL`.
7. Confirm red carpet and red ropes/silver posts align with the room entrance.
8. Click once in the game, then walk into the Reiki showroom zone to test audio.
9. Confirm Scorpion portal is still in its locked position.
10. Confirm Camera 3 still loads without black-screening.

## Remaining after this phase

- Camera 3 safety clamp should still receive a focused pass.
- Android mobile controls should be added as a separate module.
- Moon/Mars hero sky polish should be handled as its own pass.
- Full Reiki luxury showroom geometry can be refined after this smaller finish patch is verified live.

## Deploy note

This phase changes direct game files, so deploy should run from GitHub Actions after commit.
