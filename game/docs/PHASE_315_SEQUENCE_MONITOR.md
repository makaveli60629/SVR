# Phase 315 Sequence Monitor

Build: `PHASE-315-LEFT-TO-RIGHT-SEQUENCE-MONITOR-LOCK`

Game-side only. Public root page untouched.

Adds a runtime monitor for the ordered demo event stream.

Runtime globals:

```text
window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_LOCK
window.SVR_PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_STATE
window.SVR_LIVE_LEFT_TO_RIGHT_CARD_SEQUENCE
window.SVR_PHASE315_AUDIT_LEFT_TO_RIGHT_SEQUENCE
```

Test:

```text
https://svrpoker.com/game/?v=phase315-left-right-sequence
```
