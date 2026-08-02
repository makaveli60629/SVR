# Phase 359 Handoff — Android + Quest Gameplay Continuity

## Release objective

Ship one coordinated browser-game release that preserves the certified Android and Quest platform authorities while guaranteeing the same visible poker result and continuous local-hand behavior on both.

## Completed scope

- Android Phase 357 remains the seating, turn/bet, showdown, and action authority.
- Quest Phase 358 remains the uploaded-table, WebXR boot, Meta-hands, and Quest acceptance authority.
- Phase 336 remains the only poker engine.
- Phase 359 adds a shared winner/card/payout presentation and protected continuous NEXT HAND timer.
- The public website, profile showroom, avatar dressing room, Camera 3, account backend, and APK version are not redesigned or replaced.

## Required test evidence before merge

- Android browser hand reaches preflop, flop, turn, river, showdown, payout, and another hand.
- Quest browser hand reaches the same complete sequence.
- Two hole cards and five community cards are visible.
- Winner name, payout amount, winning hand, winner cards, board, and settled pot are available.
- Quest uses `game/assets/table.fbx` as the accepted table source and rejects the emergency fallback.
- Android has one controller root with no legacy control duplication.
- Quest has Meta hands primary and controller fallback.
- Exactly 6,000 chips remain conserved across the local six-player table.
- APK remains `0.1.0-rc1`, code `1`, manual update only.

## Physical test boundary

GitHub/Chromium can certify browser logic and scene contracts. The owner’s physical tests are still required for:

- Actual Meta Quest hand joints
- Controller stick feel
- Teleport direction and release behavior
- Seated reach and comfort
- Android touch feel and device frame pacing

## Test routes

- `https://svrpoker.com/game/android.html?channel=stable&v=phase359`
- `https://svrpoker.com/game/index.html?platform=quest&v=phase359`
