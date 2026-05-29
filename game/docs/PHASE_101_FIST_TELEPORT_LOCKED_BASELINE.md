# Phase 101 — Fist Teleport Locked Baseline

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Locked working behavior
The current fist/pinch teleport behavior is confirmed working and is now locked as the baseline.

```text
Hold fist or pinch -> aim at purple target -> unclench/release -> teleport leap
```

## Preservation rule
Do not rewrite or replace `game/modules/teleport.js` in future phases unless the user explicitly asks to change fist teleport behavior.

Future floor, watch, portal, Moon/Mars, performance, or lobby work must preserve:

- last valid purple target behavior
- unclench/release teleport leap
- Quest hand tracking drop counting as release
- controller fallback teleport behavior
- right-stick movement/snap turn behavior

## Next priority
Continue floor blinking/performance fixes without modifying the locked teleport logic.
