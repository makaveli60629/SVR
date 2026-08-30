# Phase 424 — Dealer Ground + Preset Authority Lock

## Scope
Private Dealer Lab only. No public landing-page edits.

## User visual finding
Eric was visible and textured, but his shoes were not contacting the lab floor. The submitted preset also specified `innerMargin: 0.125 m` (4.92 in) while the visible lab controls could restore an older locally saved value.

## Fixes
- Added bounding-box based `groundToFloor(0)` to the Eric dealer module.
- The lab grounds Eric after initial restore, after pasted JSON is applied, after reset, and after scale changes.
- Added explicit **Ground Eric** controls and diagnostics for live feet Y versus floor Y.
- Switched Dealer Lab local storage to Phase 424 keys so stale V1/V2 browser values do not override the submitted preset.
- Submitted dealer values are now the Phase 424 starting values: scale `0.0157`, X `-0.42`, requested root Y `0.30` before grounding, Z `1.50`, shoulder X `0.55`, shoulder Z `-0.48`, elbow X `0.36`, wrist Z `-0.45`, speed `1.35`.
- Submitted table values are authoritative defaults: table Y `0.62`, felt drop `0.014`, inner wall margin `0.125`, collision drop `0.020`, card lift `0.008`.
- After grounding, the current JSON reports the corrected dealer Y plus a `grounding` object containing floor Y, feet Y, and the last grounding delta.

## Acceptance
1. Eric feet report approximately `0.0000 m` in diagnostics after load/apply/reset.
2. Eric visibly contacts the lab floor.
3. Inner wall margin shows `0.125 m / 4.92 in` unless intentionally changed by the user.
4. Pasted preset values are reflected by both runtime and sliders.
5. Production lobby/public website remain unchanged.
