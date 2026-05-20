# Phase 88 — Scorpion Integration + Quest Validation Lock

## Scope

Game-side only. Website and SQL/backend tracks remain paused.

## Purpose

Phase 88 wires a lightweight integration guard into the game runtime so the Scorpion poker table work from Phases 84–87 can be validated together without redesigning the lobby.

## Locked checks

- Phase 84 table reality modules can coexist with the game.
- Phase 85 turn timer and auto-bet tray can coexist with the game.
- Phase 86 seated avatar controller can coexist with the game.
- Phase 87 table rules engine can coexist with the game.
- Missing optional modules must not black-screen the build.
- Scene routing remains game-side only.
- Quest/WebXR readiness is tracked.

## Runtime marker

The browser exposes:

```js
window.SVR_SCORPION_INTEGRATION_GUARD
window.SVR_PHASE_88_LOCK
```

Use this in DevTools:

```js
window.SVR_SCORPION_INTEGRATION_GUARD.assertReady()
```

## Validation checklist

1. Load lobby.
2. Enter Scorpion Room.
3. Sit at table.
4. Confirm cards remain readable.
5. Confirm chips are flat.
6. Confirm left-to-right deal direction remains locked.
7. Confirm watch remains visible and usable.
8. Confirm Quest controller fallback still works.
9. Confirm teleport remains hold-to-aim/release-to-teleport.
10. Confirm no website files were modified.
