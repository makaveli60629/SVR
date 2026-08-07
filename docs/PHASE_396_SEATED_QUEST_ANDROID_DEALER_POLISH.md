# Phase 396 — Seated Quest + Android Dealer Rotation Polish

## Release lock

`PHASE-396-SEATED-QUEST-ANDROID-DEALER-POLISH-LOCK`

## Quest

- Teleport is disabled for the direct Quest poker route.
- The player is hard-seated at the front playable position; table translation is continuously corrected back to the seated pose.
- Teleport rays, arcs, markers, and teleport controls are hidden/disabled.
- Non-card tabletop overlays are suppressed so the original table, recessed felt, and physical cards remain visible.
- The Phase 341 physical card presentation remains authoritative and requires at least 17 card meshes.
- If the poker engine is idle/showdown with no physical cards visible, the runtime requests a new test hand so dealing can be observed.
- Phase 395 table scale, floor alignment, Eric grounding, dealer distance, and lighting remain in effect.

## Android

- Phase 393 gameplay engine remains authoritative.
- Phase 394 center-table/sponsor/burn animation polish remains active.
- Community cards are enlarged again for readability.
- The burn tray is moved directly above the community-card area.
- Burn animation still travels from the deck to the burn tray.
- A circular `D` dealer button follows `state.dealer` around all six seats.
- A dealer-name readout identifies the current button holder.
- Existing 15-second turn indication, active-seat blink, actions, raise slider, sounds, pot movement, XP, continuous play, sponsor areas, and winner effects remain intact.

## APK policy

- APK: `0.1.0-rc2`
- Version code: `2`
- Forced update: false
- Update prompt: false
- Native rebuild: false

## Physical acceptance

### Quest

1. Confirm no teleport ray/marker appears and teleport does not move the player.
2. Confirm the player remains fully seated at the front rail.
3. Confirm non-card overlays no longer cover the tabletop.
4. Confirm hole/community/burn cards are visible and dealing begins.
5. Confirm Eric remains grounded and the Phase 395 lighting/table sizing remains acceptable.

### Android

1. Confirm burn tray is immediately above the community cards.
2. Confirm five community cards fit without overlap in portrait and landscape.
3. Confirm the `D` button changes seats at the start of each hand.
4. Confirm the dealer readout matches the button holder.
5. Confirm the existing active-player/15-second turn display still makes turn ownership clear.
