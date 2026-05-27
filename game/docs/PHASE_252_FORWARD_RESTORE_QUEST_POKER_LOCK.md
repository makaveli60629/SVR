# PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK

## Baseline returned
This phase deliberately uses `PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK` as the stable runtime base, then advances forward as Phase 252. This avoids the later boot/parser/runtime regressions while preserving the forward phase number.

## Fixed in this phase
- Quest right-controller teleport ray realigned so the destination marker stays in front of the user, not behind the body.
- Controller teleport changed to hold A/grip/trigger to aim and release to teleport. Buttons no longer toggle the teleport logo off before teleporting.
- Hand teleport changed to face/chin pinch/fist toggle only; away-from-face fist no longer teleports or keeps the marker stuck on. Pointed pinch confirms the destination.
- Right-stick forward/back movement now uses player snap-turn yaw, so after a 45-degree snap turn, stick-up remains forward.
- Removed the spawn/back-body fire/lightning portal arch that looked like a teleport machine.
- Raised Moon and Mars much higher in the sky and farther behind the skyline.
- Re-locked poker dealing from left to right from the dealer button.
- Raised and enlarged cards and player tags.
- Reduced table glow/overlay so cards are readable.

## Preserved locks
- Public Matrix/site untouched.
- Original lobby remains the baseline.
- Private scene routing preserved.
- Watch baseline preserved.
- Game ZIP stays under 25 MB.
