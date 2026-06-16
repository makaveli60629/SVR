# Phase 102B - Release Candidate Bug Sweep + Quest Walkthrough Checklist

## Purpose

Add a release-candidate bug sweep and Quest walkthrough checklist after Phase 102A.

This phase does not rebuild the scene and does not rewrite the boot entry.

## Patch applied

### New module

```text
game/phase102b_release_candidate_bug_sweep_checklist.js
```

Adds:

- Release-candidate bug sweep object.
- Blocker vs warning separation.
- Safe overlay hidden check.
- Scene / renderer / camera checks.
- Phase 102A release-candidate check.
- Finished lobby check.
- Portal layer check.
- Portal key count check.
- Quest module warning checks.
- Moon/Mars warning check.
- Quest walkthrough checklist.
- Manual console runners.

### Updated bridge

```text
game/phase101v_safe_loader_bridge.js
```

Now safely loads:

```text
phase101u_quest_controller_portal_teleport_qa.js
phase101w_quest_live_movement_portal_verification.js
phase101x_quest_live_fix_pass.js
phase101y_lobby_visual_final_qa_presentation_lock.js
phase102a_final_lobby_release_candidate_lock.js
phase102b_release_candidate_bug_sweep_checklist.js
```

The main game entry was not rewritten.

## Runtime checks

Console:

```text
window.SVR_PHASE102B_BUG_SWEEP
window.SVR_RUN_PHASE102B_BUG_SWEEP()
window.SVR_SHOW_PHASE102B_WALKTHROUGH()
window.SVR_LOAD_PHASE102B_BUG_SWEEP()
```

Demo-ready condition:

```text
window.SVR_PHASE102B_BUG_SWEEP.demoReady === true
```

Status values:

```text
demo-ready
demo-ready-with-warnings
blocked
```

If blocked, inspect:

```text
window.SVR_PHASE102B_BUG_SWEEP.blockers
```

If warnings exist, inspect:

```text
window.SVR_PHASE102B_BUG_SWEEP.warnings
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase102b-bug-sweep
```

Presentation URL:

```text
https://svrpoker.com/game/index.html?v=phase102b-bug-sweep&presentation=1
```

## Quest walkthrough checklist

- [ ] Load validation URL.
- [ ] Confirm no loader card remains.
- [ ] Confirm red carpet path and table are visible.
- [ ] Confirm PGA, Wellness, Store, and Scorpion portals are visible/readable.
- [ ] Desktop fallback: click/touch a portal or use 1/2/3/4 and F1/F2/F3/F4.
- [ ] Quest WebXR: enter VR if supported.
- [ ] Quest movement: forward follows head/camera direction.
- [ ] Quest teleport: ray points forward, not behind.
- [ ] Quest portal select: controller select/squeeze records portal payload.
- [ ] Console: `window.SVR_RUN_PHASE102B_BUG_SWEEP().demoReady === true`.

## Locked rule

This phase is release-candidate QA/checklist only. It does not change admin API, public site, Android movement, core Quest locomotion scripts, sponsor content, or Unity logic.

## Commit name

```text
Phase 102B - Release Candidate Bug Sweep Quest Walkthrough Checklist
```
