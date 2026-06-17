# Phase 265 — Pillar Sign Clearance Lock

**Build:** `PHASE-265-PILLAR-SIGN-CLEARANCE-LOCK`  
**Track:** game-only pillar / storefront sign alignment  
**Site touched:** no

## Purpose

Fix the screenshot issue where Roman rear pillars were sitting in front of the storefront signs.

## Protected Baseline

- Phase 261 new lobby remains active.
- Roman canopy/lobby architecture remains preserved.
- No old lobby restore.
- No Phase 84 rollback.
- No website changes.
- No Truitive/Trueitive/founder branding.

## Changes

The rear columns are no longer left at their original center-line positions. They are moved into bay gaps between storefront signs:

```text
Column 1 -> far left edge / outer gap
Column 2 -> left Wellness edge gap
Column 3 -> gap between Wellness and PGA
Column 4 -> gap between PGA and Play Game
Column 5 -> gap between Play Game and Store
Column 6 -> gap between Store and Scorpion
Column 7 -> right Scorpion edge gap
```

Additional cleanup:

- rear columns pushed farther behind the storefront wall
- rear columns slimmed
- caps/bases slimmed
- storefront signs raised slightly
- storefront signs pulled forward slightly for readability
- interior storefront preview items moved farther back and scaled smaller
- store plinths softened
- Moon/Mars high-back lock preserved
- no-Truitive/no-founder runtime policy preserved

## Runtime Files

```text
game/main.js
game/modules/phase262_geometry_sky_alignment_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Manual QA

Open:

```text
https://svrpoker.com/game/?v=phase265-pillar-sign-clearance
```

Check:

- pillars are not directly in front of the storefront signs
- Wellness/PGA/Play Game/Store/Scorpion signs are readable
- columns still exist as Roman architectural elements
- storefront wall remains aligned
- Moon/Mars remain high and visible
- no Trueitive/Truitive/founder content
- no Phase 84 rollback
- site remains unchanged
