# Phase 107 — Quest Live QA Harness Lock

## Build

`SVR-PHASE-107-QUEST-LIVE-QA-HARNESS-LOCK`

## Purpose

Add a hidden runtime QA harness for live Quest testing without adding visible lobby clutter or changing game geometry.

## Runtime function

Open DevTools or remote Quest debugging and run:

```js
window.SVR_RUN_PHASE107_QUEST_QA()
```

## Checks

- Production demo marker exists
- Single clean boot marker exists
- Boot integrity marker exists
- Clean lobby root exists
- Main floor exists
- Spawn clear-zone root exists
- Second-floor safety root exists
- Final second-floor QA root exists
- Player-facing title is `Scarlett Poker VR`
- No phase/debug/QA text is visible on the player loading overlay
- Second-floor/balcony objects are visible
- Portal objects exist
- Poker/table/card/chip/action objects exist
- Hand teleport release chain exists
- Boot errors are empty

## Player-facing behavior

No visible UI is added.

## Not touched

- `/site`
- public landing page
- poker logic
- watch logic
- movement logic
- private scenes
- visible lobby geometry

## Test URL

`https://svrpoker.com/game/?v=phase107-quest-qa`

## Quest test checklist

1. Open the test URL fresh.
2. Confirm title/loading screen says `Scarlett Poker VR`.
3. Confirm lobby opens with no phase text.
4. Confirm spawn is clear.
5. Confirm doorway signs/pillars/arches look correct.
6. Confirm hand teleport ray appears before release.
7. Confirm release commits teleport.
8. Confirm second-floor/balcony surfaces remain visible.
9. Confirm poker table/cards/chips/watch remain visible.
10. Run `window.SVR_RUN_PHASE107_QUEST_QA()` if remote debugging is available.
