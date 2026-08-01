# PHASE 356 — QUEST FULL-GAME ACCEPTANCE AND SMOOTHNESS LOCK

Build: `PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK`

## Runtime authority

- `modules/phase356_quest_full_game_acceptance_smoothness_lock.js`
- Loaded on Quest only.
- Android controls are removed if they are accidentally created.
- Quest renderer pixel ratio is capped at 1.25.
- Shadows are disabled for headset stability.
- WebXR stays enabled.
- Account, profile-avatar, in-game avatar, and presence modules are deferred until after the table is playable.

## Browser acceptance

Run:

```js
await window.SVR_PHASE356_RUN_QUEST_FULL_GAME_ACCEPTANCE()
```

Required result:

- `pass: true`
- platform `quest`
- hands-primary contract present
- controller fallback contract present
- zero Android controller roots
- table, logo, pot display, two hole cards, and five community cards present
- full hand reaches showdown
- pot settles
- total stacks equal 6,000
- NEXT HAND advances

## Hardware acceptance

The browser workflow cannot simulate real Meta hand joints, controller sticks, room-scale tracking, or headset teleport comfort. Complete the physical checklist in the repository handoff before calling Quest hardware certified.

## Locked product truth

This remains local play-money poker against five bots. Phase 349 presence does not make cards, balances, pots, or winners server-authoritative.
