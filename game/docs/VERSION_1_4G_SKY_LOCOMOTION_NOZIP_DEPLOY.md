# SVR 1.4G â€” Sky + Quest Locomotion No-Zip Deploy Lock

## Baseline
1.4G restored baseline. Reiki is locked and must not be touched.

## Why no update/game.zip
The local /game folder is larger than the 25 MB zip guard when compressed into update/game.zip. This phase commits direct /game files and removes update/game.zip from the repo so GitHub Pages uses the committed /game fallback path instead of overlaying a stale or oversized zip.

## Scope
Only these systems are allowed:
- Moon/Mars sky visibility, scale, glow, orbit/rotation
- Quest right-stick locomotion
- Quest grip-to-arm + trigger-to-teleport behavior
- renderer performance clamp to reduce blink/blank frames

## Protected
No Reiki files, Reiki room, Reiki storefront, Reiki hub, Reiki video/hologram, site files, poker files, or lobby layout files may be edited by this phase.

## Quest control target
- Right stick up/down = forward/back along headset/front direction.
- Right stick left/right = 45-degree snap turn.
- Grip/squeeze = arm teleport and show forward ray/marker.
- Trigger = execute teleport.
- Teleport ray must never point behind the user.

## Sky target
- Moon and Mars high above skyline.
- Textures preserved.
- Moon and Mars larger and glowing.
- Moon rotates.
- Mars rotates and orbits Moon.
