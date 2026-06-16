# Phase 101W - Quest Live Movement + Portal Selection Verification

## Purpose

Verify Quest/WebXR movement and portal selection after Phase 101U, without changing the protected boot path.

## Patch applied

### New verification module

```text
game/phase101w_quest_live_movement_portal_verification.js
```

Adds:

- Quest/WebXR readiness checks.
- Scene/camera/renderer checks.
- Phase 101S finished lobby check.
- Phase 101T portal layer check.
- Phase 101U controller QA check.
- Portal count verification.
- Teleport forward-lock instrumentation check.
- Last portal event recorder.
- In-lobby QA board.
- Console QA object.

### Updated bridge module

```text
game/phase101v_safe_loader_bridge.js
```

Now late-loads:

```text
phase101u_quest_controller_portal_teleport_qa.js
phase101w_quest_live_movement_portal_verification.js
```

The main game entry was not rewritten in this phase.

## Runtime checks

Console:

```text
window.SVR_PHASE101W_QUEST_LIVE_VERIFY
window.SVR_RUN_PHASE101W_QA()
window.SVR_LOAD_PHASE101W_VERIFY()
```

Expected:

```text
window.SVR_PHASE101W_QUEST_LIVE_VERIFY.active === true
```

Ready condition:

```text
window.SVR_PHASE101W_QUEST_LIVE_VERIFY.status === "ready"
```

If status is `needs-review`, inspect:

```text
window.SVR_PHASE101W_QUEST_LIVE_VERIFY.failed
window.SVR_PHASE101W_QUEST_LIVE_VERIFY.checks
window.SVR_PHASE101W_QUEST_LIVE_VERIFY.lastSample
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase101w-quest-live-verify
```

## Manual Quest QA

- [ ] Load game on Quest Browser.
- [ ] Confirm the lobby appears and does not stick on boot.
- [ ] Enter WebXR.
- [ ] Move forward/back and confirm it follows head direction.
- [ ] Aim teleport ray and confirm it points forward, not behind.
- [ ] Select PGA portal with controller.
- [ ] Select Wellness portal with controller.
- [ ] Select Store portal with controller.
- [ ] Select Scorpion portal with controller.
- [ ] Check:

```text
window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL
```

- [ ] Run:

```text
window.SVR_RUN_PHASE101W_QA()
```

## Locked rule

This phase is verification-only. It does not change admin API, public site, Android movement, core Quest locomotion scripts, sponsor content, or Unity logic.

## Commit name

```text
Phase 101W - Quest Live Movement Portal Selection Verification
```
