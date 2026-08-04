# Phase 140 — Deal Display Removal + Build Authority Lock

## Scope

Game-side only. Website/site/public root files are not changed.

## User-visible problem

Large mirrored boards reading `LIVE LEFT → RIGHT DEAL SEQUENCE` and related deal-lock displays were blocking the VR lobby view. They were coming from old monitor modules and reappearing on timers.

## Root cause

- `phase315_left_to_right_sequence_monitor_lock.js` creates `PHASE315_LEFT_TO_RIGHT_SEQUENCE_MONITOR_ROOT` and redraws the monitor every 5 seconds.
- `phase316_deal_order_seat_badges_lock.js` creates `PHASE316_DEAL_ORDER_SEAT_BADGES_ROOT` and redraws deal badges every 6 seconds.
- Phase 139 loaded last before this patch, so the next authority layer needed to load after Phase 139.

## Files changed

```text
game/phase140_deal_display_removal_build_authority_lock.js
game/index.html
deploy-health.json
game/docs/PHASE_140_DEAL_DISPLAY_REMOVAL_BUILD_AUTHORITY_LOCK.md
```

## What Phase 140 does

- Removes/hides Phase 315 live deal sequence monitors.
- Removes/hides Phase 316 deal-order badges.
- Removes/hides Phase 317 deal-direction arrows if they appear.
- Adds DOM and Three.js scene sweeps so old visual displays cannot reappear.
- Keeps poker left-to-right logic intact.
- Keeps dealer button, card-dealing events, chips, and pot logic intact.
- Forces final visible badge to:

```text
PHASE 140 • STABLE BUILD LOCK
```

## Runtime globals

```js
window.SVR_PHASE140_BUILD_AUTHORITY_LOCK
window.SVR_PHASE140_DEAL_DISPLAY_REMOVAL_QA
window.SVR_RUN_PHASE140_DEAL_DISPLAY_AUDIT()
```

## QA command

After deploy, run:

```js
window.SVR_RUN_PHASE140_DEAL_DISPLAY_AUDIT()
```

Expected result:

```text
dealDisplaysVisible: 0
pokerVisualMonitorsRemoved: true
leftToRightLogicPreserved: true
siteTouched: false
```

## Test in Oculus

1. Open `/game/?v=phase140-deal-display-removal`.
2. Confirm no large mirrored `LIVE LEFT → RIGHT DEAL SEQUENCE` display is visible.
3. Wait 60 seconds and confirm it does not return.
4. Confirm badge reads `PHASE 140 • STABLE BUILD LOCK`.
5. Confirm poker can still deal left-to-right.

## Protected

- Do not touch `/site`.
- Do not rewrite lobby layout.
- Do not remove actual poker deal logic.
- Do not add new sponsor branding.
