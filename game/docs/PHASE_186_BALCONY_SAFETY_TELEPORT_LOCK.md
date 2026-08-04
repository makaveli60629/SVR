# Phase 186 — Balcony Safety Teleport Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Harden the Phase 185 perimeter balcony and curved wall stair system so testers do not fall through gaps and teleport targets stay on valid walkable areas.

## Added
- New module: `game/modules/phase186_balcony_safety_teleport_lock.js`
- No-gap underlay slabs beneath all perimeter balcony/walkway sections.
- No-gap underlay slabs beneath each curved stair step.
- Hidden edge reference blocks along inner balcony edges.
- Final height-follow check for desktop and XR rig movement.
- Teleport rig validation patch for upper-level targets.
- Upper-level teleport target clamp to the nearest valid perimeter walkway if target lands off-walkway.

## Runtime audit
```js
SVR_RUN_PHASE186_SAFETY_AUDIT()
```

## Test URL
`/game/?v=phase186-balcony-safety-teleport`

## QA checklist
- Walk the curved wall stair from the left-wall start point.
- Confirm no visible holes between step/landing/walkway.
- Confirm the balcony walkway feels continuous around the walls.
- Confirm teleporting upstairs does not drop you into a gap.
- Confirm desktop height follows balcony and stair path.
- Confirm Oculus height follows balcony and stair path.
