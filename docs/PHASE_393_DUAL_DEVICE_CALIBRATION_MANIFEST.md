# Phase 393 — Quest Physical Calibration and Android Table Organization

## Release lock

`PHASE-393-DUAL-DEVICE-CALIBRATION-LOCK`

## Quest correction

Build: `PHASE-393-QUEST-TABLE-ERIC-SEAT-CALIBRATION-LOCK`

- Enlarges the original table toward a 3.35-meter presentation width.
- Calibrates the hand-rest/table top to approximately 0.98 meters above the floor.
- Buries the table base to approximately -0.08 meters so the lower trim lines meet or disappear below the floor.
- Places the visible inner felt approximately 0.11 meters below the hand rest.
- Disables the older black felt-cover overlays without removing the original hand rest.
- Creates `PHASE393_VISIBLE_RECESSED_INNER_FELT` as a clean generated inner-table ellipse.
- Raises the Phase 341 physical cards above the corrected felt.
- Seats the Quest viewpoint approximately 0.14 meters beyond the front rail at a 1.18-meter seated eye height.
- Applies bounded seat correction for 15 seconds after runtime/session entry instead of permanently locking locomotion.
- Keeps Eric at the dealer side of the table and normalizes his height to approximately 1.78 meters.
- Locks Eric's pelvis/root translation to prevent upward root-motion drift.
- Uses an absolute floor offset so repeated placement cannot accumulate vertical movement.
- Adds a lightweight arm movement and visible dealing-card flight presentation.
- Attempts to normalize Claudia, Maya, Darius, and Nova avatar roots to Eric's height when those models are present.

## Android table reorganization

Build: `PHASE-393-ANDROID-PERIMETER-TURN-CLOCK-AUDIO-LOCK`

- Reduces opponent panel size.
- Enlarges opponent card backs.
- Positions all five opponents around the table perimeter.
- Keeps the table center free of player panels.
- Preserves the community-card and player-hole-card area at the bottom.
- Keeps the bright SVR logo and pot in the open center.
- Embeds the two sponsor panels near the lower table rail so they do not cover seats, cards, or the pot.
- Adds a visible active-player blink and countdown badge.
- Adds a 15-second turn clock.
- Shows each player's latest action, including check, call, raise, all-in, fold, blind, and win.
- Automatically folds a timed-out player who is facing a bet.
- Automatically checks a timed-out player when no bet is owed.
- Adds a custom raise slider.
- Adds half-pot, pot, minimum, and maximum quick-bet controls.
- Adds synthesized deal, chip, raise, fold, check, turn, timer, burn, winner, and loss sounds.
- Adds a user-controlled sound toggle.
- Adds supported-device vibration feedback for actions and wins.
- Preserves continuous play, out-of-chips handling, XP, rankings, burn-and-turn dealing, winner effects, and sponsor configuration.

## Protected APK policy

- APK version: `0.1.0-rc2`
- Version code: `2`
- Forced update: disabled
- Recurring update prompt: disabled
- Native rebuild: not claimed

## Additional Android concept features for a later phase

1. Hand-history and instant replay with pot/action reconstruction.
2. Quick chat, reactions, and table-safe emotes.
3. Accessibility presets for card size, contrast, color-blind suits, and reduced motion.
4. Daily missions, streak rewards, and achievement badges tied to XP.
5. Private-table invitations and real multiplayer seat synchronization.

## Physical acceptance checklist

### Quest

- Confirm the player's eye is close to the front rail and seated.
- Confirm the lower table trim no longer floats above the floor.
- Confirm the hand rest is around waist height relative to Eric.
- Confirm the recessed purple/green felt is visible and no black cover hides it.
- Confirm all card meshes remain above the felt.
- Confirm Eric remains on the floor for several minutes without rising.
- Confirm Eric faces the table and the dealing-card animation is visible.

### Android

- Confirm five compact opponent boxes remain on the perimeter.
- Confirm no player box occupies the center.
- Confirm opponent cards are readable.
- Confirm the active seat blinks and the clock counts from 15.
- Confirm timeout behavior, raise slider, preset bets, sound toggle, and sponsor panels.
- Complete several hands in portrait and landscape.
