# Phase 311 Local Two-Player Ghost Multiplayer Prototype

Build: `PHASE-311-LOCAL-TWO-PLAYER-GHOST-MULTIPLAYER-PROTOTYPE`

## Summary

Phase 311 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a free local prototype for two visible player markers before paid or dedicated server work.

## Behavior

- Creates an Admin / Oculus local pill that follows the local camera position.
- Creates an Android Ghost pill that moves on a local simulated path.
- Emits `svr-local-ghost-multiplayer-frame` once per second.
- Stores local ghost state in `window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE`.
- Marks `realNetworkConnected=false` so this cannot be confused with true server multiplayer.
- Provides `window.SVR_PHASE311_SET_GHOST_POSITION(x,z)` for manual ghost positioning tests.

## Runtime globals

```text
window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_MULTIPLAYER_PROTOTYPE
window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE
window.SVR_LOCAL_GHOST_MULTIPLAYER_STATE
window.SVR_PHASE311_SET_GHOST_POSITION
```

## Files changed

```text
game/phase311_local_two_player_ghost_multiplayer_prototype.js
game/phase310_scorpion_poker_loop_qa_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Important limit

This is not real network multiplayer yet. It is a free local two-marker prototype so movement pills and state flow can be tested before adding a server.

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase311-local-two-player-ghost
```
