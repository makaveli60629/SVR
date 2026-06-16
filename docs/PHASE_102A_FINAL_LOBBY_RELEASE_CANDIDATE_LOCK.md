# Phase 102A - Final Lobby Release Candidate Lock

## Purpose

Create a final release-candidate status layer for the finished lobby after the Phase 101Z hard overlay release fix.

This phase does not rebuild the scene and does not rewrite the boot entry.

## Patch applied

### New module

```text
game/phase102a_final_lobby_release_candidate_lock.js
```

Adds:

- Final release-candidate QA object.
- Confirms scene, renderer, and camera exist.
- Confirms safe overlay/card is hidden.
- Confirms game-ready flag.
- Confirms finished lobby layer.
- Confirms portal interaction layer.
- Confirms at least four portal keys.
- Confirms no visible boot card.
- Confirms high Moon/Mars if available.
- Separates blockers from warnings.

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
```

The main game entry was not rewritten.

## Runtime checks

Console:

```text
window.SVR_PHASE102A_RELEASE_CANDIDATE
window.SVR_RUN_PHASE102A_RC_QA()
window.SVR_LOAD_PHASE102A_RC()
```

Release candidate condition:

```text
window.SVR_PHASE102A_RELEASE_CANDIDATE.releaseCandidate === true
```

Status values:

```text
release-candidate-ready
release-candidate-with-warnings
blocked
```

If blocked, inspect:

```text
window.SVR_PHASE102A_RELEASE_CANDIDATE.failed
window.SVR_PHASE102A_RELEASE_CANDIDATE.checks
```

If warnings exist, inspect:

```text
window.SVR_PHASE102A_RELEASE_CANDIDATE.warnings
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase102a-release-candidate
```

Presentation URL:

```text
https://svrpoker.com/game/index.html?v=phase102a-release-candidate&presentation=1
```

## Manual QA

- [ ] No Safe Loader Bridge card remains on screen.
- [ ] Lobby is visible.
- [ ] Red carpet/path visible.
- [ ] Portals visible.
- [ ] Table visible.
- [ ] Moon/Mars visible or listed as warning only.
- [ ] Console release candidate object reports `releaseCandidate: true`.

## Locked rule

This phase is release-candidate QA only. It does not change admin API, public site, Android movement, core Quest locomotion scripts, sponsor content, or Unity logic.

## Commit name

```text
Phase 102A - Final Lobby Release Candidate Lock
```
