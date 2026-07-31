# Phase 344 — Android Full-Hand Acceptance and Input Lock

Phase 344 hardens the Phase 343 Android HUD without adding another controller or poker engine.

## Active protections
- Same-action duplicate taps are blocked for 650 ms.
- Duplicate NEXT HAND commands are blocked for 1100 ms.
- Android actions are rejected when it is not the human turn or when Phase 336 reports them as illegal.
- One short confirmation appears after an accepted action.
- The seated camera recenters only after sustained table-view drift.
- The five community-card HUD slots repair and resynchronize from Phase 336.
- Each hand records street progression, card counts, action sequence, and winners.

## Runtime QA
```js
window.SVR_PHASE344_QA()
await window.SVR_PHASE344_RUN_FULL_HAND_QA()
window.SVR_PHASE344_RECENTER()
window.SVR_PHASE344_HISTORY
```

The APK remains `0.1.0-rc1`, code `1`, with forced and recurring update prompts disabled.
