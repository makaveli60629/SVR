# Phase 95 — Watch orientation + HUD flicker fix

## Fixed
- removed the extra watch flip that caused mirrored/backward text
- forced the visible watch screen to render from the intended front face
- throttled rapid HUD status changes to reduce blinking/flicker while loading and during input handoffs

## Notes
- watch frame placement is preserved
- this phase is a lock/fix pass on top of the Phase 94 audit relock build
