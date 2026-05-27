# PHASE 255 — Quest Locomotion Teleport Watch Lock

## Goal
Lock VR movement before adding more gameplay/physics.

## Locked Control Rules
- Right controller stick Y = forward/back movement.
- Right controller stick X = 45-degree snap turn.
- Movement is headset-facing.
- Hold A / grip / trigger = aim teleport.
- Release = teleport.
- Hand fist/pinch fallback = aim teleport.
- No instant accidental teleport.
- Watch should face player and stay upright.
- Controller meshes remain hidden/natural hand proxy preferred.

## Preserved
- Phase 254 boot shield hotfix.
- Store kiosk.
- Reiki Room route.
- PGA Drive route.
- Chip/Putt route.
- Store Room route.
- Scorpion route.
- Moon/Mars.
- Site untouched.

## QA Checklist
1. Desktop game boots.
2. Quest Enter VR appears.
3. Quest right stick moves forward/back.
4. Quest right stick snap-turns left/right in 45-degree steps.
5. A/grip/trigger hold shows teleport aim.
6. Release teleports.
7. Fist/pinch fallback works if hand tracking is active.
8. Watch is not upside down.
9. Kiosk still visible.
10. Private scene buttons still route correctly.

## Next Phase
PHASE-256-TRUE-CHIP-GRAB-PHYSICS-LOCK
