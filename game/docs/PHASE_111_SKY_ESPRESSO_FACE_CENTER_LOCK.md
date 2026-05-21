# Phase 111 — Sky + Espresso Face Center Lock

## User-reported fixes

- Moon and Mars were still too low and visually behind/blocked by the skyline/buildings.
- Espresso with Cream ad wall holder was turned sideways/backward instead of facing the center/Reiki/lobby sightline.
- The real Espresso ad picture from the current screenshot/backed-up visual reference needed to be restored as an in-game texture.

## Locked changes

- Raised Moon and Mars much higher above the skyline.
- Increased Moon and Mars size and halo/glow for Quest visibility.
- Moved Moon/Mars deeper behind the skyline but high enough not to be blocked by buildings.
- Rebuilt Espresso wall tower so the holder and ad face point toward the center lobby/Reiki view.
- Added `assets/ui/espresso-with-cream-real.png` and loads it over the procedural fallback.
- Site remains untouched.

## Validation

- Build label should read `PHASE-111-SKY-ESPRESSO-FACE-CENTER-LOCK`.
- Test in lobby looking toward Reiki: Espresso ad should face the player/center view.
- Test in Quest: Moon and Mars should read above the skyline, larger, glowing, and not hidden below buildings.
