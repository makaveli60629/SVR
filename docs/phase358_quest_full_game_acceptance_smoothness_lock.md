# PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK

## Scope

Quest WebXR browser release acceptance after Android Phase 357.

## Delivered

- Quest-only incremental shader compilation during critical boot.
- Uploaded FBX poker table as the only accepted table authority.
- Poker-first table and card startup.
- Meta hands primary with Quest controller fallback.
- 45-degree snap turn and headset-look movement contracts preserved.
- Android controls excluded from Quest.
- Raised Quest pot display authority.
- Deterministic, one-action-per-turn full-hand acceptance driver.
- Full browser acceptance through showdown and next-hand advancement.
- Deferred lobby, account, avatar, and presence work after critical readiness.

## Platform isolation

Android keeps:

- Phase 347 single-controller authority.
- Phase 356 freeze recovery.
- Phase 357 close seating, turn display, showdown, and ANTE UP flow.
- APK `0.1.0-rc1`, code `1`, manual updates only.

Camera 3 remains spectator-only. Desktop keeps its existing presentation path.

## Product truth

Phase 358 certifies the browser stack for a complete local play-money game against five bots. Physical Quest input and comfort require the headset checklist. Server-authoritative poker, cards, balances, and production multiplayer are not claimed.

## Release route

`https://svrpoker.com/game/index.html?platform=quest&v=phase358`

## Acceptance APIs

```js
window.SVR_PHASE358_QA()
await window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE()
window.SVR_PHASE358_ACCEPTANCE_RESULT
```
