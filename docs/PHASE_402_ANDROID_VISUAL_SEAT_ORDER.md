# Phase 402 — Android Visual Left Seat Order

## Scope
Android browser gameplay only. Quest and iPhone/Safari remain on their protected builds.

## Reported defect
The rendered table seats do not follow simple numeric seat-index order. The Android betting engine previously advanced by numeric index, which could make action jump across the visible table and skip the local player.

## Authoritative physical order
Moving left around the rendered Android felt:

1. YOU — seat 0
2. Nova — seat 5
3. Claudia — seat 1
4. Eric — seat 2
5. Maya — seat 3
6. Darius — seat 4
7. back to YOU — seat 0

Locked index cycle: `[0, 5, 1, 2, 3, 4]`.

Critical regression: **Darius (4) must advance to YOU (0) whenever YOU is eligible.**

## Gameplay changes
- New Android gameplay authority: `game/modules/phase402_android_gameplay.js`.
- Android-only direct page: `game/android-stable-phase402.html`.
- `game/android-tabletop.html` routes Practice / Regular / Tournament into the Phase 402 page.
- Dealer rotation follows the physical seat cycle.
- Small blind and big blind follow the physical seat cycle.
- Pre-flop starts at the first eligible seat left of the big blind.
- Flop / turn / river start at the first eligible seat left of the dealer.
- Folded, all-in, and empty seats are skipped without jumping across eligible seats.
- Visible deal animation follows the physical seat cycle.

## Tournament alignment
`phase401_android_tournament_director.js` now uses the same `[0,5,1,2,3,4]` order for dealer/blind/action anchoring. Reiki First 50 rules, prize, levels, results and crown remain unchanged.

## Protected systems
- Phase 398 call/raise sizing rules unchanged.
- Phase 399 teaching, hand guide, chip rack and showdown system unchanged.
- Phase 401 tournament structure and landscape styling preserved.
- Quest Phase 396 unchanged.
- iPhone/Safari continues to load the existing shared `android-stable.html` with Phase 398 gameplay; the Phase 402 page is Android-only.
- APK remains `0.1.0-rc2`, version code `2`, manual update only, no native rebuild.

## Acceptance tests
- Full physical cycle: YOU → Nova → Claudia → Eric → Maya → Darius → YOU.
- Darius → YOU with all six seats live.
- Darius → YOU when Nova is unavailable.
- YOU → Claudia when Nova is folded.
- Dealer/SB/BB advance through all six physical seats without collisions.
- Pre-flop actor is left of BB.
- Post-flop actor is left of dealer.
- Tournament director uses the same order.
