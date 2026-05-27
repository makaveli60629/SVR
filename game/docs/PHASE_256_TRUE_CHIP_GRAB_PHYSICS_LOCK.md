# PHASE 256 — True Chip Grab Physics Lock

## Goal
Prepare the poker chips for true VR grab/drop/throw physics without adding a heavy physics engine yet.

## Locked Fixes
- Chips are marked as grabbable.
- Chips are clamped to felt height.
- Chips are forced flat instead of sideways.
- Lightweight gravity/drop behavior added.
- Runtime API added:
  - window.SVR_CHIP_PHYSICS.scan(scene)
  - window.SVR_CHIP_PHYSICS.grab(chip)
  - window.SVR_CHIP_PHYSICS.release(chip, velocity)
  - window.SVR_CHIP_PHYSICS.tick(scene, dt)

## Poker Deal Rule Lock
Cards must visually deal right-to-left around the table.
Dealer starts with the player to the dealer's left.
Do not revert to left-to-right.

## Preserved
- Phase 254 boot shield hotfix.
- Phase 255 Quest locomotion/teleport/watch lock.
- Store kiosk.
- Reiki/PGA/Store/Smoker/Scorpion private routes.
- Moon/Mars.
- Site untouched.

## Next Phase
PHASE-257-VR-GRAB-EQUIP-STORE-KIOSK-LOCK
