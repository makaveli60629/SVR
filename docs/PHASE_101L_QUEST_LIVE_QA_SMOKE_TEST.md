# Phase 101L - Quest Live QA Smoke Test

## Purpose

Add an in-game QA smoke-test object for the current Phase 260 live stack so Quest/WebXR testing can verify the build without guessing.

## Scope

Game-side QA only.

No website rebuild. No lobby redesign. No Android movement change. No Unity-only logic.

## Patch applied

### New module

```text
game/phase101l_quest_live_qa_smoke_test.js
```

This module checks:

- Core runtime objects exist.
- Phase 260 is active.
- Phase 260 geometry root exists.
- Phase 101G HUD cleanup is active.
- Phase 101H scene cleanup is active.
- Phase 101I camera/path polish is active.
- Phase 101J locomotion forward-lock is active or ready.
- Phase 101K performance cleanup is active.
- Bottom scene nav is hidden in clean mode.
- Top-right phase badge is hidden in clean mode.
- Debug buttons are hidden in clean mode.
- Frame probe is running.

### Wire-in

`game/phase101k_quest_performance_cleanup.js` now imports:

```text
./phase101l_quest_live_qa_smoke_test.js?v=phase101l-quest-live-qa-smoke-test
```

Because Phase 101K already loads from Phase 260, Phase 101L now runs through the live Phase 260 chain.

## Console commands for Quest testing

Open browser console and run:

```text
window.SVR_PHASE101L_QA
window.SVR_RUN_PHASE101L_QA()
window.SVR_PHASE101L_QA.summary
window.SVR_PHASE101L_QA.checks
```

## Expected result

After the scene has loaded for a few seconds:

```text
window.SVR_PHASE101L_QA.summary.status
```

Expected status:

```text
ready-for-quest-live-test
```

If it returns:

```text
needs-review
```

Open:

```text
window.SVR_PHASE101L_QA.summary.failed
```

and use the failed keys as the next patch list.

## Manual Quest validation

- [ ] Enter Quest Browser.
- [ ] Open the live game route.
- [ ] Wait 8 to 12 seconds.
- [ ] Confirm HUD is clean.
- [ ] Confirm Phase 260 canopy is visible.
- [ ] Confirm no duplicate old canopy roots are visible.
- [ ] Enter WebXR.
- [ ] Test trigger/grip teleport.
- [ ] Test fist teleport if hand tracking is active.
- [ ] Turn head 45 degrees and move forward.
- [ ] Confirm forward follows gaze.
- [ ] Check `window.SVR_PHASE101L_QA.summary`.

## Locked rule

This phase adds QA instrumentation only. It does not claim physical Quest success until tested on headset.

## Commit name

```text
Phase 101L - Quest Live QA Smoke Test
```
