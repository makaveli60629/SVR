# PHASE-90-UNLOCKED-APPLY-BOOT-LOCK

Game-side only fix. Website/site untouched.

## Fixed

- Fixed the `spawnLogoTex is not defined` boot crash in `game/modules/world_skyline.js`.
- `buildOuterCity()` now accepts `spawnLogoTex` as an optional parameter.
- Logo texture is loaded before city/skyline construction.
- City billboard fallback uses `./assets/ui/logo.png` if the texture is not available.

## Preserved

- Original lobby runtime path.
- PGA Drive / Chip + Putt private route pages.
- Reiki private route page with AWAITING APPROVAL placeholder.
- Scorpion, Smoker Lounge, and Store Room private route pages.
- Store portal URL: `https://svrpoker.com/site/store.html`.
- No unapproved sponsor/founder branding.
- Dealer body disabled.
- Website/site side untouched.

## Test

Open `/game/?v=phase88-boot-stability` and confirm the black runtime error screen no longer appears.
